from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import User, Course, LiveStream, StreamParticipant, ChatMessage, Question, StreamAnalytics
from schemas import (
    LiveStreamCreate, LiveStreamUpdate, LiveStreamResponse,
    StreamParticipantCreate, StreamParticipantResponse,
    StreamChatMessageCreate, StreamChatMessageResponse,
    StreamQuestionCreate, StreamQuestionUpdate, StreamQuestionResponse,
    StreamAnalyticsResponse, StreamStartRequest, StreamStopRequest,
    StreamJoinRequest, StreamLeaveRequest, StreamStatsResponse
)
from auth import get_current_user

router = APIRouter(tags=["livestream"])


@router.post("/", response_model=LiveStreamResponse, status_code=status.HTTP_201_CREATED)
def create_live_stream(
    stream: LiveStreamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new live stream"""
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

    # Create new live stream
    db_stream = LiveStream(
        title=stream.title,
        description=stream.description,
        course_id=stream.course_id,
        instructor_id=current_user.id,
        scheduled_at=stream.scheduled_at,
        max_viewers=stream.max_viewers,
        is_public=stream.is_public,
        is_recording=stream.is_recording,
        quality_settings=stream.quality_settings
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
    query = db.query(LiveStream)

    if status:
        query = query.filter(LiveStream.status == status)
    if course_id:
        query = query.filter(LiveStream.course_id == course_id)

    streams = query.offset(skip).limit(limit).all()
    return streams


@router.get("/active", response_model=List[LiveStreamResponse])
def get_active_live_streams(db: Session = Depends(get_db)):
    """Get all active live streams"""
    streams = db.query(LiveStream).filter(
        LiveStream.status.in_(["scheduled", "live"])).all()
    return streams


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

    # Check if stream is live
    if db_stream.status != "live":
        raise HTTPException(status_code=400, detail="Stream is not live")

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
    chat_messages = db.query(ChatMessage).filter(
        ChatMessage.stream_id == stream_id).count()
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
    chat_message = ChatMessage(
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
    messages = db.query(ChatMessage).filter(
        ChatMessage.stream_id == stream_id,
        ChatMessage.is_visible == True
    ).order_by(ChatMessage.created_at.desc()).offset(skip).limit(limit).all()

    return messages


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
