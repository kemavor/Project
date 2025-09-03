from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import io

from database import get_db
from models import User, Course, LiveStream, StreamParticipant, StreamChatMessage, Question, StreamAnalytics
from schemas import (
    LiveStreamCreate, LiveStreamUpdate, LiveStreamResponse,
    StreamParticipantCreate, StreamParticipantResponse,
    StreamChatMessageCreate, StreamChatMessageResponse,
    StreamQuestionCreate, StreamQuestionUpdate, StreamQuestionResponse,
    StreamAnalyticsResponse, StreamStartRequest, StreamStopRequest,
    StreamJoinRequest, StreamLeaveRequest, StreamStatsResponse,
    ChatLockRequest, VideoRecordingRequest, VideoRecordingResponse,
    RecordedLectureResponse
)
from auth import get_current_user
from services.video_service import video_service
from config import settings

router = APIRouter(prefix="/livestream", tags=["livestream"])


@router.post("/", response_model=LiveStreamResponse, status_code=status.HTTP_201_CREATED)
def create_live_stream(
    stream: LiveStreamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new RTMP-to-HLS live stream"""
    # Verify user is a teacher
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=403, detail="Only teachers can create live streams")

    # Verify course exists and user is the instructor
    course = db.query(Course).filter(Course.id == stream.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You can only create streams for your own courses")

    # Generate unique RTMP key and HLS URL
    import uuid
    rtmp_key = str(uuid.uuid4())
    hls_url = f"http://localhost:8081/hls/{rtmp_key}/index.m3u8"
    
    # Create new live stream with RTMP-to-HLS architecture
    db_stream = LiveStream(
        title=stream.title,
        description=stream.description,
        course_id=stream.course_id,
        instructor_id=current_user.id,
        scheduled_at=stream.scheduled_at,
        max_viewers=stream.max_viewers,
        is_public=stream.is_public,
        is_recording=stream.is_recording,
        rtmp_key=rtmp_key,
        hls_url=hls_url,
        rtmp_server_url="rtmp://localhost:1936/live",
        transcription_enabled=stream.transcription_enabled,
        auto_summary_enabled=stream.auto_summary_enabled
    )

    db.add(db_stream)
    db.commit()
    db.refresh(db_stream)

    return db_stream


@router.get("/", response_model=List[LiveStreamResponse])
def get_live_streams(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all live streams with optional filtering"""
    try:
        query = db.query(LiveStream)

        if status and status != "all":
            query = query.filter(LiveStream.status == status)
        if course_id:
            query = query.filter(LiveStream.course_id == course_id)

        streams = query.offset(skip).limit(limit).all()
        
        # Convert using the safe from_orm method
        result = []
        for stream in streams:
            try:
                stream_response = LiveStreamResponse.from_orm(stream)
                result.append(stream_response)
            except Exception as e:
                print(f"Error converting stream {stream.id}: {str(e)}")
                # Continue with other streams instead of failing completely
                continue
        
        return result
    except Exception as e:
        print(f"Error in get_live_streams: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/active", response_model=List[LiveStreamResponse])
def get_active_live_streams(db: Session = Depends(get_db)):
    """Get all active live streams"""
    streams = db.query(LiveStream).filter(
        LiveStream.status.in_(["scheduled", "live"])).all()
    return streams


@router.get("/schedule", response_model=List[LiveStreamResponse])
def get_scheduled_streams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get scheduled livestreams for the current user (students see all, teachers see their own)"""
    from datetime import datetime, timedelta
    
    # Get streams for today and next few days
    today = datetime.now().date()
    end_date = today + timedelta(days=7)  # Next 7 days
    
    query = db.query(LiveStream).join(Course)
    
    if current_user.role == "teacher":
        # Teachers see only their scheduled streams
        query = query.filter(LiveStream.instructor_id == current_user.id)
    else:
        # Students see all public scheduled streams or streams from their enrolled courses
        # For now, show all public streams - can be enhanced to check enrollments
        query = query.filter(LiveStream.is_public == True)
    
    # Filter by date range and status
    streams = query.filter(
        LiveStream.status.in_(["scheduled", "live"]),
        LiveStream.scheduled_at != None,
        LiveStream.scheduled_at >= datetime.combine(today, datetime.min.time()),
        LiveStream.scheduled_at <= datetime.combine(end_date, datetime.max.time())
    ).order_by(LiveStream.scheduled_at.asc()).limit(limit).all()
    
    # Convert to response format with instructor names
    result = []
    for stream in streams:
        try:
            # Get instructor name
            instructor = db.query(User).filter(User.id == stream.instructor_id).first()
            instructor_name = f"{instructor.first_name} {instructor.last_name}" if instructor else "Unknown"
            
            # Get course name
            course_name = stream.course.title if stream.course else "Unknown Course"
            
            stream_response = LiveStreamResponse(
                id=stream.id,
                title=stream.title,
                description=stream.description,
                course_id=stream.course_id,
                instructor_id=stream.instructor_id,
                status=stream.status,
                rtmp_key=stream.rtmp_key,
                hls_url=stream.hls_url,
                viewer_count=stream.viewer_count,
                max_viewers=stream.max_viewers,
                scheduled_at=stream.scheduled_at,
                started_at=stream.started_at,
                ended_at=stream.ended_at,
                duration=stream.duration,
                is_public=stream.is_public,
                is_recording=stream.is_recording,
                created_at=stream.created_at,
                updated_at=stream.updated_at,
                instructor_name=instructor_name,
                course_name=course_name
            )
            result.append(stream_response)
        except Exception as e:
            print(f"Error converting scheduled stream {stream.id}: {str(e)}")
            continue
    
    return result


@router.get("/my", response_model=List[LiveStreamResponse])
def get_my_live_streams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's live streams"""
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=403, detail="Only teachers can access their streams")
    
    streams = db.query(LiveStream).filter(
        LiveStream.instructor_id == current_user.id
    ).order_by(LiveStream.created_at.desc()).all()
    
    return streams


@router.get("/validate-key/{rtmp_key}")
def validate_rtmp_key(rtmp_key: str, db: Session = Depends(get_db)):
    """Validate RTMP stream key for OBS streaming"""
    try:
        stream = db.query(LiveStream).filter(LiveStream.rtmp_key == rtmp_key).first()
        
        if not stream:
            return {"valid": False, "reason": "RTMP key not found"}
            
        if stream.status not in ["scheduled", "live"]:
            return {"valid": False, "reason": "Stream not active"}
            
        return {"valid": True, "stream_id": stream.id, "title": stream.title, "hls_url": stream.hls_url}
    
    except Exception as e:
        print(f"RTMP key validation error: {str(e)}")
        return {"valid": False, "reason": "Validation error"}


@router.post("/rtmp-status")
def update_rtmp_status(
    request_data: dict,
    db: Session = Depends(get_db)
):
    """Receive RTMP server status updates from MediaMTX"""
    try:
        rtmp_key = request_data.get("streamKey") or request_data.get("rtmpKey")
        status = request_data.get("status")
        timestamp = request_data.get("timestamp")
        
        if not rtmp_key or not status:
            raise HTTPException(status_code=400, detail="Missing required fields")
            
        stream = db.query(LiveStream).filter(LiveStream.rtmp_key == rtmp_key).first()
        
        if not stream:
            raise HTTPException(status_code=404, detail="Stream not found")
            
        # Update stream status based on RTMP server notification
        if status == "live" or status == "connected":
            stream.status = "live"
            stream.started_at = datetime.utcnow()
        elif status == "ended" or status == "disconnected":
            stream.status = "ended"
            stream.ended_at = datetime.utcnow()
            if stream.started_at:
                stream.duration = int((stream.ended_at - stream.started_at).total_seconds())
                
        db.commit()
        
        return {"success": True, "message": f"Stream status updated to {status}"}
        
    except Exception as e:
        print(f"RTMP status update error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recorded-lectures", response_model=List[RecordedLectureResponse])
def get_recorded_lectures(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    course_id: Optional[int] = None,
    limit: int = 50
):
    """Get list of recorded lectures"""
    query = db.query(LiveStream).filter(
        LiveStream.video_s3_key.isnot(None),  # Has recording
        LiveStream.status == "ended"
    )

    if current_user.role == "teacher":
        # Teachers see their own recorded lectures
        query = query.filter(LiveStream.instructor_id == current_user.id)

    if course_id:
        query = query.filter(LiveStream.course_id == course_id)

    streams = query.order_by(LiveStream.ended_at.desc()).limit(limit).all()

    # Convert to response format
    recorded_lectures = []
    for stream in streams:
        # Get instructor name
        instructor = db.query(User).filter(User.id == stream.instructor_id).first()
        instructor_name = f"{instructor.first_name} {instructor.last_name}" if instructor else "Unknown"

        # Generate fresh presigned URL
        recording_url = video_service.generate_presigned_video_url(
            stream.video_s3_key, expiration=3600
        ) if stream.video_s3_key else None

        recorded_lectures.append(RecordedLectureResponse(
            id=stream.id,
            title=stream.title,
            description=stream.description,
            course_id=stream.course_id,
            instructor_name=instructor_name,
            recording_url=recording_url or "",
            video_duration_seconds=stream.video_duration_seconds,
            file_size=stream.video_file_size,
            created_at=stream.created_at
        ))

    return recorded_lectures


@router.get("/{stream_id}", response_model=LiveStreamResponse)
def get_live_stream(stream_id: int, db: Session = Depends(get_db)):
    """Get a specific live stream"""
    stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Live stream not found")
    return stream


@router.put("/{stream_id}", response_model=LiveStreamResponse)
def update_live_stream(
    stream_id: int,
    stream_update: LiveStreamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a live stream"""
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    # Verify user is the instructor
    if db_stream.instructor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You can only update your own streams")

    # Update fields
    update_data = stream_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_stream, field, value)

    db.commit()
    db.refresh(db_stream)
    return db_stream


@router.post("/{stream_id}/start")
def start_live_stream(
    stream_id: int,
    start_request: StreamStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a live stream"""
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    # Verify user is the instructor
    if db_stream.instructor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You can only start your own streams")

    # Check if stream is already live
    if db_stream.status == "live":
        raise HTTPException(status_code=400, detail="Stream is already live")

    # Update stream status
    db_stream.status = "live"
    db_stream.started_at = datetime.utcnow()
    if start_request.quality_settings:
        db_stream.quality_settings = start_request.quality_settings

    db.commit()

    return {"message": "Stream started successfully", "stream_id": stream_id}


@router.post("/{stream_id}/stop")
def stop_live_stream(
    stream_id: int,
    stop_request: StreamStopRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stop a live stream"""
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    # Verify user is the instructor
    if db_stream.instructor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You can only stop your own streams")

    # Check if stream can be stopped (allow stopping live, scheduled, or paused streams)
    if db_stream.status not in ["live", "scheduled", "paused"]:
        raise HTTPException(
            status_code=400, detail="Stream cannot be stopped in its current state")

    # Update stream status
    db_stream.status = "ended"
    db_stream.ended_at = datetime.utcnow()
    if db_stream.started_at:
        db_stream.duration = int(
            (db_stream.ended_at - db_stream.started_at).total_seconds())

    db.commit()

    return {"message": "Stream stopped successfully", "stream_id": stream_id}


@router.post("/{stream_id}/join")
def join_live_stream(
    stream_id: int,
    join_request: StreamJoinRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a live stream as a viewer"""
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    # Check if stream is accessible
    if db_stream.status not in ["scheduled", "live"]:
        raise HTTPException(status_code=400, detail="Stream is not accessible")

    # Check if user is already a participant
    existing_participant = db.query(StreamParticipant).filter(
        StreamParticipant.stream_id == stream_id,
        StreamParticipant.user_id == current_user.id,
        StreamParticipant.left_at.is_(None)
    ).first()

    if existing_participant:
        raise HTTPException(
            status_code=400, detail="Already joined this stream")

    # Check viewer limit
    current_viewers = db.query(StreamParticipant).filter(
        StreamParticipant.stream_id == stream_id,
        StreamParticipant.left_at.is_(None)
    ).count()

    if current_viewers >= db_stream.max_viewers:
        raise HTTPException(
            status_code=400, detail="Stream is at maximum capacity")

    # Create participant record
    participant = StreamParticipant(
        stream_id=stream_id,
        user_id=current_user.id,
        is_moderator=current_user.id == db_stream.instructor_id
    )

    db.add(participant)

    # Update viewer count
    db_stream.viewer_count = current_viewers + 1

    db.commit()

    return {"message": "Joined stream successfully", "stream_id": stream_id}


@router.post("/{stream_id}/leave")
def leave_live_stream(
    stream_id: int,
    leave_request: StreamLeaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a live stream"""
    # Find active participation
    participant = db.query(StreamParticipant).filter(
        StreamParticipant.stream_id == stream_id,
        StreamParticipant.user_id == current_user.id,
        StreamParticipant.left_at.is_(None)
    ).first()

    if not participant:
        raise HTTPException(
            status_code=400, detail="Not currently participating in this stream")

    # Update participant record
    participant.left_at = datetime.utcnow()
    if participant.joined_at:
        participant.duration_watched = int(
            (participant.left_at - participant.joined_at).total_seconds())

    # Update viewer count
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if db_stream and db_stream.viewer_count > 0:
        db_stream.viewer_count -= 1

    db.commit()

    return {"message": "Left stream successfully", "stream_id": stream_id}


@router.get("/{stream_id}/stats", response_model=StreamStatsResponse)
def get_stream_stats(stream_id: int, db: Session = Depends(get_db)):
    """Get live stream statistics"""
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    # Calculate stats
    participants = db.query(StreamParticipant).filter(
        StreamParticipant.stream_id == stream_id).all()
    chat_messages = db.query(StreamChatMessage).filter(
        StreamChatMessage.stream_id == stream_id).count()
    questions = db.query(Question).filter(
        Question.stream_id == stream_id).count()

    # Calculate average watch time
    total_watch_time = sum(
        p.duration_watched for p in participants if p.duration_watched)
    avg_watch_time = total_watch_time / \
        len(participants) if participants else 0

    # Calculate engagement score (simplified)
    engagement_score = min(
        100, (chat_messages + questions * 2) / max(len(participants), 1) * 10)

    return StreamStatsResponse(
        stream_id=stream_id,
        current_viewers=db_stream.viewer_count,
        peak_viewers=db_stream.viewer_count,  # Simplified - could track peak separately
        total_unique_viewers=len(participants),
        chat_messages_count=chat_messages,
        questions_count=questions,
        average_watch_time=avg_watch_time / 60,  # Convert to minutes
        engagement_score=engagement_score,
        is_live=db_stream.status == "live",
        duration=db_stream.duration,
        started_at=db_stream.started_at
    )


@router.post("/{stream_id}/chat", response_model=StreamChatMessageResponse)
def send_chat_message(
    stream_id: int,
    message: StreamChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a chat message in a live stream"""
    # Verify stream exists and is active
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    if db_stream.status not in ["scheduled", "live"]:
        raise HTTPException(status_code=400, detail="Stream is not active")

    # Verify user is participating
    participant = db.query(StreamParticipant).filter(
        StreamParticipant.stream_id == stream_id,
        StreamParticipant.user_id == current_user.id,
        StreamParticipant.left_at.is_(None)
    ).first()

    if not participant:
        raise HTTPException(
            status_code=400, detail="Must join stream before sending messages")

    if not participant.can_chat:
        raise HTTPException(
            status_code=403, detail="Chat is disabled for this user")

    # Create chat message
    chat_message = StreamChatMessage(
        stream_id=stream_id,
        user_id=current_user.id,
        message=message.message,
        message_type=message.message_type
    )

    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)

    return chat_message


@router.get("/{stream_id}/chat", response_model=List[StreamChatMessageResponse])
def get_chat_messages(
    stream_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get chat messages for a live stream"""
    messages = db.query(StreamChatMessage).filter(
        StreamChatMessage.stream_id == stream_id,
        StreamChatMessage.is_visible == True
    ).order_by(StreamChatMessage.created_at.desc()).offset(skip).limit(limit).all()

    return messages


@router.post("/{stream_id}/chat/lock")
def toggle_chat_lock(
    stream_id: int,
    lock_request: ChatLockRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle chat lock for a live stream (teachers only)"""
    # Verify stream exists
    stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    # Verify user is the instructor
    if stream.instructor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the stream instructor can lock/unlock chat")

    # Update chat lock status
    stream.chat_locked = lock_request.locked
    db.commit()
    db.refresh(stream)

    return {
        "message": f"Chat {'locked' if lock_request.locked else 'unlocked'} successfully",
        "locked": stream.chat_locked
    }


@router.post("/{stream_id}/questions", response_model=StreamQuestionResponse)
def ask_question(
    stream_id: int,
    question: StreamQuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ask a question in a live stream"""
    # Verify stream exists and is active
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    if db_stream.status not in ["scheduled", "live"]:
        raise HTTPException(status_code=400, detail="Stream is not active")

    # Verify user is participating
    participant = db.query(StreamParticipant).filter(
        StreamParticipant.stream_id == stream_id,
        StreamParticipant.user_id == current_user.id,
        StreamParticipant.left_at.is_(None)
    ).first()

    if not participant:
        raise HTTPException(
            status_code=400, detail="Must join stream before asking questions")

    if not participant.can_ask_questions:
        raise HTTPException(
            status_code=403, detail="Questions are disabled for this user")

    # Create question
    db_question = Question(
        stream_id=stream_id,
        user_id=current_user.id,
        question=question.question
    )

    db.add(db_question)
    db.commit()
    db.refresh(db_question)

    return db_question


@router.get("/{stream_id}/questions", response_model=List[StreamQuestionResponse])
def get_questions(
    stream_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get questions for a live stream"""
    questions = db.query(Question).filter(
        Question.stream_id == stream_id,
        Question.is_visible == True
    ).order_by(Question.upvotes.desc(), Question.created_at.desc()).offset(skip).limit(limit).all()

    return questions


@router.post("/{stream_id}/questions/{question_id}/upvote")
def upvote_question(
    stream_id: int,
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upvote a question"""
    db_question = db.query(Question).filter(
        Question.id == question_id,
        Question.stream_id == stream_id
    ).first()

    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Increment upvotes
    db_question.upvotes += 1
    db.commit()

    return {"message": "Question upvoted successfully", "upvotes": db_question.upvotes}


@router.put("/{stream_id}/questions/{question_id}/answer")
def answer_question(
    stream_id: int,
    question_id: int,
    answer_update: StreamQuestionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Answer a question (instructor only)"""
    db_question = db.query(Question).filter(
        Question.id == question_id,
        Question.stream_id == stream_id
    ).first()

    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Verify user is the instructor
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream or db_stream.instructor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only instructors can answer questions")

    # Update question
    if answer_update.is_answered is not None:
        db_question.is_answered = answer_update.is_answered
    if answer_update.answer is not None:
        db_question.answer = answer_update.answer
        db_question.answered_by = current_user.id
        db_question.answered_at = datetime.utcnow()

    db.commit()

    return {"message": "Question answered successfully"}


@router.delete("/{stream_id}")
def delete_live_stream(
    stream_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a live stream (instructor only)"""
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    # Verify user is the instructor OR is an admin
    print(f"Delete authorization check: stream instructor_id={db_stream.instructor_id}, current_user.id={current_user.id}, current_user.role={current_user.role}")
    if db_stream.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail=f"Permission denied. Stream belongs to instructor {db_stream.instructor_id}, you are user {current_user.id} with role {current_user.role}")

    # Check if stream is currently live
    if db_stream.status == "live":
        raise HTTPException(
            status_code=400, detail="Cannot delete a live stream. Stop it first.")

    try:
        # Delete related records first (cascade delete)
        # Delete stream participants
        db.query(StreamParticipant).filter(StreamParticipant.stream_id == stream_id).delete()
        
        # Delete chat messages
        db.query(StreamChatMessage).filter(StreamChatMessage.stream_id == stream_id).delete()
        
        # Delete questions
        db.query(Question).filter(Question.stream_id == stream_id).delete()
        
        # Delete analytics if they exist
        db.query(StreamAnalytics).filter(StreamAnalytics.stream_id == stream_id).delete()

        # Delete the stream itself
        db.delete(db_stream)
        db.commit()

        return {"message": "Live stream deleted successfully"}
    
    except Exception as e:
        db.rollback()
        print(f"Error deleting stream {stream_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete stream: {str(e)}"
        )


@router.get("/recent/lectures", response_model=List[LiveStreamResponse])
def get_recent_lectures(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 5
):
    """Get recent lectures for the current user"""
    if current_user.role == "teacher":
        # For teachers, get their recent conducted lectures
        recent_lectures = db.query(LiveStream).filter(
            LiveStream.instructor_id == current_user.id,
            LiveStream.status.in_(["ended", "completed"])
        ).order_by(LiveStream.ended_at.desc()).limit(limit).all()
    else:
        # For students, get lectures they participated in
        recent_lectures = db.query(LiveStream).join(
            StreamParticipant, LiveStream.id == StreamParticipant.stream_id
        ).filter(
            StreamParticipant.user_id == current_user.id,
            LiveStream.status.in_(["ended", "completed"])
        ).order_by(LiveStream.ended_at.desc()).limit(limit).all()

    return recent_lectures


@router.delete("/clear-ended")
def clear_ended_streams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear ended streams for the current user"""
    try:
        if current_user.role == "teacher":
            # For teachers, clear their ended streams
            ended_streams = db.query(LiveStream).filter(
                LiveStream.instructor_id == current_user.id,
                LiveStream.status == "ended"
            ).all()

            if not ended_streams:
                return {
                    "message": "No ended streams to clear",
                    "deleted_count": 0
                }

            deleted_count = 0
            for stream in ended_streams:
                # Delete related records first
                db.query(StreamParticipant).filter(
                    StreamParticipant.stream_id == stream.id
                ).delete()

                db.query(StreamChatMessage).filter(
                    StreamChatMessage.stream_id == stream.id
                ).delete()

                db.query(Question).filter(
                    Question.stream_id == stream.id
                ).delete()

                db.query(StreamAnalytics).filter(
                    StreamAnalytics.stream_id == stream.id
                ).delete()

                # Delete the stream itself
                db.delete(stream)
                deleted_count += 1
        else:
            # For students, clear streams they participated in
            # First get the stream IDs they participated in
            participated_streams = db.query(StreamParticipant.stream_id).filter(
                StreamParticipant.user_id == current_user.id
            ).subquery()

            ended_streams = db.query(LiveStream).filter(
                LiveStream.id.in_(participated_streams),
                LiveStream.status == "ended"
            ).all()

            if not ended_streams:
                return {
                    "message": "No ended streams to clear",
                    "deleted_count": 0
                }

            deleted_count = 0
            for stream in ended_streams:
                # Delete related records first
                db.query(StreamParticipant).filter(
                    StreamParticipant.stream_id == stream.id
                ).delete()

                db.query(StreamChatMessage).filter(
                    StreamChatMessage.stream_id == stream.id
                ).delete()

                db.query(Question).filter(
                    Question.stream_id == stream.id
                ).delete()

                db.query(StreamAnalytics).filter(
                    StreamAnalytics.stream_id == stream.id
                ).delete()

                # Delete the stream itself
                db.delete(stream)
                deleted_count += 1

        db.commit()
        return {
            "message": f"Successfully cleared {deleted_count} ended streams",
            "deleted_count": deleted_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear ended streams: {str(e)}"
        )


# Video Recording Endpoints

@router.post("/{stream_id}/recording/start", response_model=VideoRecordingResponse)
def start_recording(
    stream_id: int,
    recording_request: VideoRecordingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start recording a live stream"""
    # Verify stream exists and user is instructor
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    if db_stream.instructor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the stream instructor can control recording"
        )

    # Check if stream is live
    if db_stream.status != "live":
        raise HTTPException(
            status_code=400, detail="Stream must be live to start recording"
        )

    # Check if already recording
    if db_stream.is_recording:
        raise HTTPException(
            status_code=400, detail="Stream is already being recorded"
        )

    # Update stream recording status
    db_stream.is_recording = True
    db_stream.recording_started_at = datetime.utcnow()
    db_stream.video_s3_bucket = settings.s3_video_bucket_name
    
    db.commit()
    db.refresh(db_stream)

    return VideoRecordingResponse(
        success=True,
        message="Recording started successfully",
        recording_url=None  # Will be available after recording stops
    )


@router.post("/{stream_id}/recording/stop", response_model=VideoRecordingResponse)
def stop_recording(
    stream_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stop recording a live stream"""
    # Verify stream exists and user is instructor
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    if db_stream.instructor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the stream instructor can control recording"
        )

    # Check if currently recording
    if not db_stream.is_recording:
        raise HTTPException(
            status_code=400, detail="Stream is not currently being recorded"
        )

    # Update stream recording status
    db_stream.is_recording = False
    db_stream.recording_ended_at = datetime.utcnow()
    
    # Calculate recording duration
    if db_stream.recording_started_at:
        duration = (db_stream.recording_ended_at - db_stream.recording_started_at).total_seconds()
        db_stream.video_duration_seconds = int(duration)

    db.commit()
    db.refresh(db_stream)

    return VideoRecordingResponse(
        success=True,
        message="Recording stopped successfully",
        recording_url=db_stream.recording_url,
        s3_key=db_stream.video_s3_key,
        file_size=db_stream.video_file_size
    )


@router.post("/{stream_id}/recording/upload", response_model=VideoRecordingResponse)
async def upload_recorded_video(
    stream_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a complete recorded video file for a stream"""
    # Verify stream exists and user is instructor
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    if db_stream.instructor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the stream instructor can upload recordings"
        )

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Check file size (max 500MB for video)
    file_content = await file.read()
    max_size = 500 * 1024 * 1024  # 500MB
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=400, 
            detail="Video file too large. Maximum size is 500MB"
        )

    try:
        # Upload to S3
        result = video_service.upload_complete_video(
            stream_id=stream_id,
            video_data=file_content,
            filename=file.filename
        )

        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload video: {result['error']}"
            )

        # Update stream record
        db_stream.video_s3_key = result["s3_key"]
        db_stream.video_s3_bucket = settings.s3_video_bucket_name
        db_stream.video_file_size = result["file_size"]
        db_stream.video_content_type = result["content_type"]
        db_stream.recording_url = result["s3_url"]
        
        # Generate presigned URL for immediate access
        presigned_url = video_service.generate_presigned_video_url(
            result["s3_key"], expiration=3600
        )
        if presigned_url:
            db_stream.recording_url = presigned_url

        db.commit()
        db.refresh(db_stream)

        return VideoRecordingResponse(
            success=True,
            message="Video uploaded successfully",
            recording_url=db_stream.recording_url,
            s3_key=result["s3_key"],
            file_size=result["file_size"]
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload video: {str(e)}"
        )


@router.get("/{stream_id}/recording/url")
def get_recording_url(
    stream_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a fresh pre-signed URL for accessing the recorded video"""
    # Verify stream exists
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    # Check if user has access (instructor or enrolled student)
    if current_user.role == "teacher" and db_stream.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if not db_stream.video_s3_key:
        raise HTTPException(status_code=404, detail="No recording available for this stream")

    # Generate fresh presigned URL
    presigned_url = video_service.generate_presigned_video_url(
        db_stream.video_s3_key, expiration=3600
    )

    if not presigned_url:
        raise HTTPException(
            status_code=500, 
            detail="Failed to generate video access URL"
        )

    return {
        "recording_url": presigned_url,
        "expires_in": 3600,
        "file_size": db_stream.video_file_size,
        "duration_seconds": db_stream.video_duration_seconds
    }


