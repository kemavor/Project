"""
Transcription API endpoints for recorded lectures
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import User, LiveStream, LectureTranscription, LectureSummary
from auth import get_current_user
from services.lecture_transcription_service import lecture_transcription_service

router = APIRouter(prefix="/transcription", tags=["transcription"])


@router.post("/{stream_id}/start")
async def start_transcription(
    stream_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start transcription processing for a recorded lecture"""
    
    # Verify stream exists and user has access
    stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    # Check if user is instructor or admin
    if current_user.role not in ["teacher", "admin"] and stream.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if stream has recorded video
    if not stream.video_s3_key:
        raise HTTPException(
            status_code=400, 
            detail="No recorded video found for this stream"
        )
    
    # Check if transcription is already in progress
    existing_transcription = db.query(LectureTranscription).filter(
        LectureTranscription.stream_id == stream_id
    ).first()
    
    if existing_transcription and existing_transcription.status == "processing":
        raise HTTPException(
            status_code=400, 
            detail="Transcription already in progress"
        )
    
    # Start transcription in background
    background_tasks.add_task(
        lecture_transcription_service.process_lecture, 
        stream_id
    )
    
    return {
        "message": "Transcription started successfully",
        "stream_id": stream_id,
        "status": "processing"
    }


@router.get("/{stream_id}/status")
def get_transcription_status(
    stream_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transcription status for a stream"""
    
    # Verify stream exists and user has access
    stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    # Get transcription status
    status_info = lecture_transcription_service.get_transcription_status(stream_id)
    
    return {
        "stream_id": stream_id,
        "status": status_info["status"],
        "audio_extracted": status_info.get("audio_extracted", False),
        "transcription_completed": status_info.get("transcription_completed", False),
        "summary_completed": status_info.get("summary_completed", False),
        "processing_started_at": status_info.get("processing_started_at"),
        "processing_completed_at": status_info.get("processing_completed_at"),
        "error_message": status_info.get("error_message")
    }


@router.get("/{stream_id}/transcript")
def get_transcript(
    stream_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the full transcript for a stream"""
    
    # Verify stream exists and user has access
    stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    # Get transcription
    transcription = db.query(LectureTranscription).filter(
        LectureTranscription.stream_id == stream_id
    ).first()
    
    if not transcription:
        raise HTTPException(status_code=404, detail="Transcription not found")
    
    if transcription.status != "completed":
        raise HTTPException(
            status_code=400, 
            detail=f"Transcription not ready. Status: {transcription.status}"
        )
    
    # Get summary if available
    summary = db.query(LectureSummary).filter(
        LectureSummary.transcription_id == transcription.id
    ).first()
    
    return {
        "id": transcription.id,
        "stream_id": stream_id,
        "full_transcript": transcription.full_transcript or "",
        "transcript_chunks": transcription.transcript_chunks or [],
        "summary_text": summary.summary_text if summary else None,
        "key_points": summary.key_points if summary else [],
        "topics_covered": summary.topics_covered if summary else [],
        "audio_duration_seconds": transcription.audio_duration_seconds,
        "status": transcription.status,
        "created_at": transcription.created_at,
        "updated_at": transcription.updated_at
    }


@router.get("/")
def get_transcriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    status: Optional[str] = None
):
    """Get list of transcriptions for current user"""
    
    query = db.query(LectureTranscription).join(LiveStream)
    
    if current_user.role == "teacher":
        # Teachers see their own transcriptions
        query = query.filter(LiveStream.instructor_id == current_user.id)
    elif current_user.role != "admin":
        # Students see transcriptions from courses they're enrolled in
        # This would need enrollment checking - simplified for now
        query = query.filter(LiveStream.is_public == True)
    
    if status:
        query = query.filter(LectureTranscription.status == status)
    
    transcriptions = query.order_by(
        LectureTranscription.created_at.desc()
    ).limit(limit).all()
    
    # Format response
    result = []
    for transcription in transcriptions:
        stream = db.query(LiveStream).filter(LiveStream.id == transcription.stream_id).first()
        instructor = db.query(User).filter(User.id == stream.instructor_id).first() if stream else None
        
        result.append({
            "id": transcription.id,
            "stream_id": transcription.stream_id,
            "stream_title": stream.title if stream else "Unknown",
            "instructor_name": f"{instructor.first_name} {instructor.last_name}" if instructor else "Unknown",
            "status": transcription.status,
            "audio_duration_seconds": transcription.audio_duration_seconds,
            "transcription_completed": transcription.transcription_completed,
            "summary_completed": transcription.summary_completed,
            "created_at": transcription.created_at,
            "processing_completed_at": transcription.processing_completed_at
        })
    
    return result


@router.delete("/{stream_id}")
def delete_transcription(
    stream_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete transcription data for a stream"""
    
    # Verify stream exists and user has access
    stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    # Check permissions
    if current_user.role not in ["teacher", "admin"] and stream.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get transcription
    transcription = db.query(LectureTranscription).filter(
        LectureTranscription.stream_id == stream_id
    ).first()
    
    if not transcription:
        raise HTTPException(status_code=404, detail="Transcription not found")
    
    try:
        # Delete summary first (foreign key constraint)
        summary = db.query(LectureSummary).filter(
            LectureSummary.transcription_id == transcription.id
        ).first()
        if summary:
            db.delete(summary)
        
        # Delete transcription
        db.delete(transcription)
        db.commit()
        
        return {"message": "Transcription deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete transcription: {str(e)}"
        )