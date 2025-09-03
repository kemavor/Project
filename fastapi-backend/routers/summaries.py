from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import google.generativeai as genai
import os
from dotenv import load_dotenv

from database import get_db
from models import User, Course, LiveStream, LectureSummary, SummaryAccess, StreamTranscription, Enrollment, LectureTranscription
from schemas import (
    LectureSummaryCreate, LectureSummaryUpdate, LectureSummaryResponse,
    SummaryAccessCreate, SummaryAccessResponse, CourseSummariesResponse
)
from auth import get_current_user

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/summaries", tags=["summaries"])

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


async def generate_summary_with_gemini(transcription_text: str, lecture_title: str) -> dict:
    """Generate a comprehensive summary using Gemini AI"""
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        Please analyze the following lecture transcription and create a comprehensive summary:

        Lecture Title: {lecture_title}
        
        Transcription:
        {transcription_text}

        Please provide:
        1. A detailed summary (200-400 words)
        2. Key points (5-10 bullet points)
        3. Topics covered (list of main topics)
        4. A confidence score (0.0-1.0) based on transcription quality

        Format your response as JSON with the following structure:
        {{
            "summary": "detailed summary text",
            "key_points": ["point 1", "point 2", ...],
            "topics_covered": ["topic 1", "topic 2", ...],
            "confidence_score": 0.85
        }}
        """
        
        response = model.generate_content(prompt)
        
        # Parse the JSON response
        import json
        try:
            result = json.loads(response.text)
            return result
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "summary": response.text[:1000],  # First 1000 chars as summary
                "key_points": ["AI-generated summary available"],
                "topics_covered": ["General lecture content"],
                "confidence_score": 0.5
            }
            
    except Exception as e:
        print(f"Error generating summary with Gemini: {e}")
        return {
            "summary": "Summary generation temporarily unavailable. Please check back later.",
            "key_points": ["Summary generation failed"],
            "topics_covered": ["Technical content"],
            "confidence_score": 0.0
        }


async def auto_generate_summary(stream_id: int, db: Session):
    """Background task to automatically generate summary after stream ends"""
    try:
        # Get the livestream
        stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
        if not stream or not stream.auto_summary_enabled:
            return
        
        # Get all transcriptions for this stream
        transcriptions = db.query(StreamTranscription).filter(
            StreamTranscription.stream_id == stream_id,
            StreamTranscription.is_final == True
        ).order_by(StreamTranscription.start_time).all()
        
        if not transcriptions:
            print(f"No transcriptions found for stream {stream_id}")
            return
        
        # Combine all transcription text
        transcription_text = " ".join([t.text for t in transcriptions])
        
        if len(transcription_text.strip()) < 100:  # Skip if too short
            print(f"Transcription too short for stream {stream_id}")
            return
        
        # Generate summary using Gemini
        ai_result = await generate_summary_with_gemini(transcription_text, stream.title)
        
        # Create summary record
        summary = LectureSummary(
            stream_id=stream_id,
            course_id=stream.course_id,
            title=f"Summary: {stream.title}",
            summary=ai_result["summary"],
            key_points=ai_result["key_points"],
            topics_covered=ai_result["topics_covered"],
            generated_by="gemini",
            confidence_score=ai_result["confidence_score"],
            word_count=len(ai_result["summary"].split()),
            transcription_segments_count=len(transcriptions),
            total_transcription_duration=stream.duration / 60.0 if stream.duration else 0.0
        )
        
        db.add(summary)
        db.commit()
        db.refresh(summary)
        
        print(f"Auto-generated summary for stream {stream_id}: {summary.id}")
        
    except Exception as e:
        print(f"Error auto-generating summary for stream {stream_id}: {e}")
        db.rollback()


@router.post("/generate/{stream_id}", response_model=LectureSummaryResponse)
async def generate_summary(
    stream_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger summary generation for a completed stream"""
    # Verify stream exists and user has permission
    stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    # Check if user is instructor or admin
    if current_user.role not in ["admin", "super_admin"] and stream.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to generate summary for this stream")
    
    # Check if summary already exists
    existing_summary = db.query(LectureSummary).filter(LectureSummary.stream_id == stream_id).first()
    if existing_summary:
        return existing_summary
    
    # Add background task to generate summary
    background_tasks.add_task(auto_generate_summary, stream_id, db)
    
    # Return placeholder response
    placeholder_summary = LectureSummary(
        stream_id=stream_id,
        course_id=stream.course_id,
        title=f"Generating summary for: {stream.title}",
        summary="Summary is being generated. Please check back in a few minutes.",
        key_points=["Summary generation in progress"],
        topics_covered=["Processing..."],
        generated_by="gemini",
        confidence_score=0.0,
        word_count=0,
        transcription_segments_count=0,
        total_transcription_duration=0.0
    )
    
    return placeholder_summary


@router.get("/course/{course_id}", response_model=CourseSummariesResponse)
async def get_course_summaries(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all summaries for a course (available to enrolled students and instructors)"""
    # Verify course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check access permissions
    has_access = False
    
    if current_user.role in ["admin", "super_admin"]:
        has_access = True
    elif course.instructor_id == current_user.id:
        has_access = True
    else:
        # Check if user is enrolled in the course
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id,
            Enrollment.status == "enrolled"
        ).first()
        has_access = enrollment is not None
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to access summaries for this course")
    
    # Get all summaries for the course
    summaries = db.query(LectureSummary).filter(
        LectureSummary.course_id == course_id
    ).order_by(LectureSummary.generated_at.desc()).all()
    
    # Calculate total duration
    total_duration = sum([s.total_transcription_duration for s in summaries])
    
    return CourseSummariesResponse(
        course_id=course_id,
        course_title=course.title,
        summaries=summaries,
        total_summaries=len(summaries),
        total_duration=total_duration
    )


@router.get("/my-summaries", response_model=List[CourseSummariesResponse])
async def get_my_summaries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get summaries for all courses the user has access to"""
    summaries_by_course = []
    
    if current_user.role == "student":
        # Get enrolled courses
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.status == "enrolled"
        ).all()
        
        for enrollment in enrollments:
            course = enrollment.course
            
            # Get old-style summaries
            old_summaries = db.query(LectureSummary).filter(
                LectureSummary.course_id == course.id
            ).order_by(LectureSummary.generated_at.desc()).all()
            
            # Get new transcription-based summaries
            transcription_summaries = []
            streams = db.query(LiveStream).filter(LiveStream.course_id == course.id).all()
            for stream in streams:
                transcription = db.query(LectureTranscription).filter(
                    LectureTranscription.stream_id == stream.id,
                    LectureTranscription.status == "completed"
                ).first()
                if transcription and transcription.summary:
                    # Convert transcription summary to the expected format
                    converted_summary = type('obj', (object,), {
                        'id': f"t_{transcription.summary.id}",
                        'stream_id': stream.id,
                        'course_id': course.id,
                        'title': f"Lecture Summary: {stream.title}",
                        'summary': transcription.summary.summary_text or "",
                        'key_points': transcription.summary.key_points or [],
                        'topics_covered': transcription.summary.topics_covered or [],
                        'generated_by': 't5-small',
                        'confidence_score': 0.8,
                        'word_count': len((transcription.summary.summary_text or "").split()),
                        'transcription_segments_count': len((transcription.full_transcript or "").split('.')),
                        'total_transcription_duration': transcription.audio_duration_seconds / 60.0 if transcription.audio_duration_seconds else 0.0,
                        'generated_at': transcription.summary.created_at,
                        'created_at': transcription.summary.created_at,
                        'updated_at': transcription.summary.updated_at
                    })
                    transcription_summaries.append(converted_summary)
            
            # Combine both types of summaries
            all_summaries = old_summaries + transcription_summaries
            
            if all_summaries:  # Only include courses with summaries
                total_duration = sum([
                    getattr(s, 'total_transcription_duration', 0) for s in all_summaries
                ])
                summaries_by_course.append(CourseSummariesResponse(
                    course_id=course.id,
                    course_title=course.title,
                    summaries=all_summaries,
                    total_summaries=len(all_summaries),
                    total_duration=total_duration
                ))
    
    elif current_user.role == "teacher":
        # Get taught courses
        courses = db.query(Course).filter(Course.instructor_id == current_user.id).all()
        
        for course in courses:
            summaries = db.query(LectureSummary).filter(
                LectureSummary.course_id == course.id
            ).order_by(LectureSummary.generated_at.desc()).all()
            
            if summaries:  # Only include courses with summaries
                total_duration = sum([s.total_transcription_duration for s in summaries])
                summaries_by_course.append(CourseSummariesResponse(
                    course_id=course.id,
                    course_title=course.title,
                    summaries=summaries,
                    total_summaries=len(summaries),
                    total_duration=total_duration
                ))
    
    elif current_user.role in ["admin", "super_admin"]:
        # Get all courses with summaries
        courses_with_summaries = db.query(Course).join(LectureSummary).distinct().all()
        
        for course in courses_with_summaries:
            summaries = db.query(LectureSummary).filter(
                LectureSummary.course_id == course.id
            ).order_by(LectureSummary.generated_at.desc()).all()
            
            total_duration = sum([s.total_transcription_duration for s in summaries])
            summaries_by_course.append(CourseSummariesResponse(
                course_id=course.id,
                course_title=course.title,
                summaries=summaries,
                total_summaries=len(summaries),
                total_duration=total_duration
            ))
    
    return summaries_by_course


@router.get("/{summary_id}", response_model=LectureSummaryResponse)
async def get_summary(
    summary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific summary"""
    summary = db.query(LectureSummary).filter(LectureSummary.id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    
    # Check access permissions
    course = summary.course
    has_access = False
    
    if current_user.role in ["admin", "super_admin"]:
        has_access = True
    elif course.instructor_id == current_user.id:
        has_access = True
    else:
        # Check if user is enrolled in the course
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course.id,
            Enrollment.status == "enrolled"
        ).first()
        has_access = enrollment is not None
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to access this summary")
    
    # Track access
    access_record = SummaryAccess(
        summary_id=summary_id,
        user_id=current_user.id
    )
    db.add(access_record)
    db.commit()
    
    return summary


@router.post("/{summary_id}/bookmark", response_model=SummaryAccessResponse)
async def bookmark_summary(
    summary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bookmark or unbookmark a summary"""
    # Verify summary exists and user has access
    summary = db.query(LectureSummary).filter(LectureSummary.id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    
    # Check if bookmark already exists
    existing_bookmark = db.query(SummaryAccess).filter(
        SummaryAccess.summary_id == summary_id,
        SummaryAccess.user_id == current_user.id,
        SummaryAccess.is_bookmarked == True
    ).first()
    
    if existing_bookmark:
        # Remove bookmark
        existing_bookmark.is_bookmarked = False
        db.commit()
        return existing_bookmark
    else:
        # Add bookmark
        bookmark = SummaryAccess(
            summary_id=summary_id,
            user_id=current_user.id,
            is_bookmarked=True
        )
        db.add(bookmark)
        db.commit()
        db.refresh(bookmark)
        return bookmark


@router.delete("/admin/{summary_id}")
async def delete_summary(
    summary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a summary (admin/instructor only)"""
    summary = db.query(LectureSummary).filter(LectureSummary.id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    
    # Check permissions
    if current_user.role not in ["admin", "super_admin"] and summary.course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this summary")
    
    # Delete access records first
    db.query(SummaryAccess).filter(SummaryAccess.summary_id == summary_id).delete()
    
    # Delete summary
    db.delete(summary)
    db.commit()
    
    return {"message": "Summary deleted successfully"}


@router.get("/transcription/{stream_id}")
async def get_transcription_summary(
    stream_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transcription-based summary for a specific stream"""
    
    # Get the stream
    stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    # Check access permissions
    course = stream.course
    has_access = False
    
    if current_user.role in ["admin", "super_admin"]:
        has_access = True
    elif course.instructor_id == current_user.id:
        has_access = True
    else:
        # Check if user is enrolled in the course
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course.id,
            Enrollment.status == "enrolled"
        ).first()
        has_access = enrollment is not None
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to access this summary")
    
    # Get transcription and summary
    transcription = db.query(LectureTranscription).filter(
        LectureTranscription.stream_id == stream_id,
        LectureTranscription.status == "completed"
    ).first()
    
    if not transcription or not transcription.summary:
        raise HTTPException(status_code=404, detail="No transcription summary available for this stream")
    
    # Track access
    access_record = SummaryAccess(
        summary_id=f"t_{transcription.summary.id}",  # Use transcription summary ID with prefix
        user_id=current_user.id
    )
    try:
        db.add(access_record)
        db.commit()
    except:
        # Ignore access tracking errors
        db.rollback()
    
    # Return formatted summary
    return {
        "id": f"t_{transcription.summary.id}",
        "stream_id": stream.id,
        "course_id": course.id,
        "title": f"Lecture Summary: {stream.title}",
        "summary": transcription.summary.summary_text or "",
        "key_points": transcription.summary.key_points or [],
        "topics_covered": transcription.summary.topics_covered or [],
        "full_transcript": transcription.full_transcript,
        "transcript_chunks": transcription.transcript_chunks or [],
        "audio_duration_seconds": transcription.audio_duration_seconds,
        "generated_by": "t5-small",
        "confidence_score": 0.8,
        "word_count": len((transcription.summary.summary_text or "").split()),
        "created_at": transcription.summary.created_at,
        "updated_at": transcription.summary.updated_at
    }


@router.get("/student-summaries")
async def get_student_summaries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    course_id: Optional[int] = None
):
    """Get all available summaries for students (both old and transcription-based)"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="This endpoint is for students only")
    
    # Get enrolled courses
    enrollments_query = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.status == "enrolled"
    )
    
    if course_id:
        enrollments_query = enrollments_query.filter(Enrollment.course_id == course_id)
    
    enrollments = enrollments_query.all()
    
    all_summaries = []
    
    for enrollment in enrollments:
        course = enrollment.course
        
        # Get transcription-based summaries
        streams = db.query(LiveStream).filter(LiveStream.course_id == course.id).all()
        for stream in streams:
            transcription = db.query(LectureTranscription).filter(
                LectureTranscription.stream_id == stream.id,
                LectureTranscription.status == "completed"
            ).first()
            
            if transcription and transcription.summary:
                summary_data = {
                    "id": f"t_{transcription.summary.id}",
                    "type": "transcription",
                    "stream_id": stream.id,
                    "course_id": course.id,
                    "course_title": course.title,
                    "title": f"Lecture Summary: {stream.title}",
                    "summary": transcription.summary.summary_text or "",
                    "key_points": transcription.summary.key_points or [],
                    "topics_covered": transcription.summary.topics_covered or [],
                    "audio_duration_minutes": transcription.audio_duration_seconds / 60.0 if transcription.audio_duration_seconds else 0.0,
                    "generated_by": "t5-small",
                    "created_at": transcription.summary.created_at,
                    "has_full_transcript": bool(transcription.full_transcript)
                }
                all_summaries.append(summary_data)
    
    # Sort by creation date (newest first)
    all_summaries.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "summaries": all_summaries,
        "total_count": len(all_summaries),
        "courses_count": len(set(s["course_id"] for s in all_summaries))
    }