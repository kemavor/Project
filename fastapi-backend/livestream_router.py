from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import User, Course, LiveStream, StreamParticipant, ChatMessage, Question
from schemas import (
    LiveStreamCreate, LiveStreamUpdate, LiveStreamResponse,
    StreamChatMessageCreate, StreamChatMessageResponse,
    StreamQuestionCreate, StreamQuestionUpdate, StreamQuestionResponse,
    StreamStartRequest, StreamStopRequest, StreamJoinRequest, StreamLeaveRequest, StreamStatsResponse
)
from auth import get_current_user

router = APIRouter(prefix="/api/livestream", tags=["livestream"])


@router.post("/", response_model=LiveStreamResponse, status_code=status.HTTP_201_CREATED)
def create_live_stream(
    stream: LiveStreamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new live stream"""
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=403, detail="Only teachers can create live streams")

    course = db.query(Course).filter(Course.id == stream.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You can only create streams for your own courses")

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


@router.get("/active", response_model=List[LiveStreamResponse])
def get_active_live_streams(db: Session = Depends(get_db)):
    """Get all active live streams"""
    streams = db.query(LiveStream).filter(
        LiveStream.status.in_(["scheduled", "live"])).all()
    return streams


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

    if db_stream.instructor_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You can only start your own streams")

    if db_stream.status == "live":
        raise HTTPException(status_code=400, detail="Stream is already live")

    db_stream.status = "live"
    db_stream.started_at = datetime.utcnow()
    if start_request.quality_settings:
        db_stream.quality_settings = start_request.quality_settings

    db.commit()

    return {"message": "Stream started successfully", "stream_id": stream_id}


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

    if db_stream.status not in ["scheduled", "live"]:
        raise HTTPException(status_code=400, detail="Stream is not accessible")

    existing_participant = db.query(StreamParticipant).filter(
        StreamParticipant.stream_id == stream_id,
        StreamParticipant.user_id == current_user.id,
        StreamParticipant.left_at.is_(None)
    ).first()

    if existing_participant:
        raise HTTPException(
            status_code=400, detail="Already joined this stream")

    current_viewers = db.query(StreamParticipant).filter(
        StreamParticipant.stream_id == stream_id,
        StreamParticipant.left_at.is_(None)
    ).count()

    if current_viewers >= db_stream.max_viewers:
        raise HTTPException(
            status_code=400, detail="Stream is at maximum capacity")

    participant = StreamParticipant(
        stream_id=stream_id,
        user_id=current_user.id,
        is_moderator=current_user.id == db_stream.instructor_id
    )

    db.add(participant)
    db_stream.viewer_count = current_viewers + 1
    db.commit()

    return {"message": "Joined stream successfully", "stream_id": stream_id}


@router.post("/{stream_id}/chat", response_model=StreamChatMessageResponse)
def send_chat_message(
    stream_id: int,
    message: StreamChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a chat message in a live stream"""
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    if db_stream.status not in ["scheduled", "live"]:
        raise HTTPException(status_code=400, detail="Stream is not active")

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


@router.get("/{stream_id}/stats", response_model=StreamStatsResponse)
def get_stream_stats(stream_id: int, db: Session = Depends(get_db)):
    """Get live stream statistics"""
    db_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Live stream not found")

    participants = db.query(StreamParticipant).filter(
        StreamParticipant.stream_id == stream_id).all()
    chat_messages = db.query(ChatMessage).filter(
        ChatMessage.stream_id == stream_id).count()
    questions = db.query(Question).filter(
        Question.stream_id == stream_id).count()

    total_watch_time = sum(
        p.duration_watched for p in participants if p.duration_watched)
    avg_watch_time = total_watch_time / \
        len(participants) if participants else 0
    engagement_score = min(
        100, (chat_messages + questions * 2) / max(len(participants), 1) * 10)

    return StreamStatsResponse(
        stream_id=stream_id,
        current_viewers=db_stream.viewer_count,
        peak_viewers=db_stream.viewer_count,
        total_unique_viewers=len(participants),
        chat_messages_count=chat_messages,
        questions_count=questions,
        average_watch_time=avg_watch_time / 60,
        engagement_score=engagement_score,
        is_live=db_stream.status == "live",
        duration=db_stream.duration,
        started_at=db_stream.started_at
    )
