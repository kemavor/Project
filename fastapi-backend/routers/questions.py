"""
Question Generation and Quiz API endpoints
Auto-generates questions using NLP techniques (NER, Keyphrase Extraction)
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import json
import logging

from database import get_db
from models import (
    User, LiveStream, LectureTranscription, GeneratedQuestion, 
    QuestionAnswer, QuizSession, Enrollment, Course, CourseDocument
)
from auth import get_current_user
from services.question_generation_service import question_generation_service
from services.user_statistics_service import user_statistics_service

router = APIRouter(prefix="/questions", tags=["questions"])
logger = logging.getLogger(__name__)


@router.get("/enrolled-courses-with-documents")
async def get_enrolled_courses_with_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get enrolled courses with their available documents for quiz generation"""
    
    # This endpoint works for both students and teachers
    course_documents = []
    
    try:
        if current_user.role == "student":
            # Get student's enrolled courses
            enrollments = db.query(Enrollment).filter(
                Enrollment.student_id == current_user.id,
                Enrollment.status == "enrolled"
            ).all()
            
            for enrollment in enrollments:
                course = db.query(Course).filter(Course.id == enrollment.course_id).first()
                if course:
                    # Get instructor name
                    instructor = db.query(User).filter(User.id == course.instructor_id).first()
                    instructor_name = f"{instructor.first_name} {instructor.last_name}" if instructor else "Unknown"
                    
                    # Get documents for this course with questions
                    documents = db.query(CourseDocument).filter(
                        CourseDocument.course_id == course.id,
                        CourseDocument.is_public == True  # Only public documents
                    ).all()
                    
                    # Filter documents that have questions or can generate questions
                    document_data = []
                    for document in documents:
                        question_count = db.query(GeneratedQuestion).filter(
                            GeneratedQuestion.document_id == document.id,
                            GeneratedQuestion.is_active == True
                        ).count()
                        
                        # Include documents with questions OR documents that can generate questions
                        if question_count > 0 or document.file_type.lower() in ['pdf', 'txt', 'doc', 'docx']:
                            document_data.append({
                                "document_id": document.id,
                                "title": document.title or document.original_filename,
                                "filename": document.original_filename,
                                "file_type": document.file_type,
                                "uploaded_at": document.created_at,
                                "file_size": document.file_size,
                                "has_questions": question_count > 0,
                                "questions_count": question_count,
                                "can_generate_questions": document.file_type.lower() in ['pdf', 'txt', 'doc', 'docx']
                            })
                    
                    if document_data:  # Only include courses that have documents
                        course_documents.append({
                            "course_id": course.id,
                            "course_title": course.title,
                            "instructor_name": instructor_name,
                            "enrollment_date": enrollment.enrolled_at,
                            "documents": document_data
                        })
        
        elif current_user.role in ["teacher", "admin"]:
            # Get teacher's courses or all courses for admin
            if current_user.role == "teacher":
                courses = db.query(Course).filter(Course.instructor_id == current_user.id).all()
            else:  # admin
                courses = db.query(Course).all()
            
            for course in courses:
                # Get instructor name
                instructor = db.query(User).filter(User.id == course.instructor_id).first()
                instructor_name = f"{instructor.first_name} {instructor.last_name}" if instructor else "Unknown"
                
                # Get documents for this course
                documents = db.query(CourseDocument).filter(
                    CourseDocument.course_id == course.id
                ).all()
                
                # Filter documents that have questions or can generate questions
                document_data = []
                for document in documents:
                    question_count = db.query(GeneratedQuestion).filter(
                        GeneratedQuestion.document_id == document.id,
                        GeneratedQuestion.is_active == True
                    ).count()
                    
                    # Include documents with questions OR documents that can generate questions
                    if question_count > 0 or document.file_type.lower() in ['pdf', 'txt', 'doc', 'docx']:
                        document_data.append({
                            "document_id": document.id,
                            "title": document.title or document.original_filename,
                            "filename": document.original_filename,
                            "file_type": document.file_type,
                            "uploaded_at": document.created_at,
                            "file_size": document.file_size,
                            "has_questions": question_count > 0,
                            "questions_count": question_count,
                            "can_generate_questions": document.file_type.lower() in ['pdf', 'txt', 'doc', 'docx']
                        })
                
                if document_data:  # Only include courses that have documents
                    course_documents.append({
                        "course_id": course.id,
                        "course_title": course.title,
                        "instructor_name": instructor_name,
                        "enrollment_date": None,  # Teachers don't have enrollment dates
                        "documents": document_data
                    })
        
        return course_documents
        
    except Exception as e:
        logger.error(f"Error fetching enrolled courses with documents: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch courses with documents: {str(e)}"
        )


# Backward compatibility endpoint - redirect old API calls to new document-based approach
@router.get("/enrolled-courses-with-lectures")
async def get_enrolled_courses_with_lectures_legacy(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Legacy endpoint - redirects to document-based approach"""
    return await get_enrolled_courses_with_documents(current_user, db)


@router.post("/document/{document_id}/generate")
async def generate_questions_from_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    num_mcq: int = 5,
    num_short_answer: int = 3,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate questions from a course document (teachers only)"""
    
    # Verify document exists and user has permission
    document = db.query(CourseDocument).filter(CourseDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get course to check permissions
    course = db.query(Course).filter(Course.id == document.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if user is instructor or admin
    if current_user.role not in ["teacher", "admin"] and course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only instructors can generate questions for their course documents")
    
    # Check if document type is supported
    if document.file_type.lower() not in ['pdf', 'txt', 'doc', 'docx']:
        raise HTTPException(
            status_code=400, 
            detail=f"Document type '{document.file_type}' is not supported for question generation. Supported types: PDF, TXT, DOC, DOCX"
        )
    
    # Check if questions already exist
    existing_questions = db.query(GeneratedQuestion).filter(
        GeneratedQuestion.document_id == document_id
    ).count()
    
    if existing_questions > 0:
        return {
            "message": f"Questions already exist for this document ({existing_questions} questions)",
            "existing_questions": existing_questions,
            "regenerate_url": f"/questions/document/{document_id}/regenerate"
        }
    
    # TODO: Extract text content from document (S3 download and text extraction)
    # For now, use a placeholder
    document_content = "This is placeholder text content from the document. In production, this would be extracted from the actual S3 document."
    
    # Start question generation in background
    background_tasks.add_task(
        generate_questions_from_document_content,
        document_content,
        document_id,
        course.id,
        num_mcq,
        num_short_answer
    )
    
    return {
        "message": "Question generation started",
        "document_id": document_id,
        "status": "processing",
        "estimated_questions": num_mcq + num_short_answer
    }


@router.post("/{stream_id}/generate")
async def generate_questions(
    stream_id: int,
    background_tasks: BackgroundTasks,
    num_mcq: int = 5,
    num_short_answer: int = 3,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate questions from a transcribed lecture (teachers only)"""
    
    # Verify stream exists and user has permission
    stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    # Check if user is instructor or admin
    if current_user.role not in ["teacher", "admin"] and stream.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only instructors can generate questions for their lectures")
    
    # Get transcription
    transcription = db.query(LectureTranscription).filter(
        LectureTranscription.stream_id == stream_id,
        LectureTranscription.status == "completed"
    ).first()
    
    if not transcription or not transcription.full_transcript:
        raise HTTPException(
            status_code=400, 
            detail="No completed transcription available for this stream"
        )
    
    # Check if questions already exist
    existing_questions = db.query(GeneratedQuestion).filter(
        GeneratedQuestion.stream_id == stream_id
    ).count()
    
    if existing_questions > 0:
        return {
            "message": f"Questions already exist for this stream ({existing_questions} questions)",
            "existing_questions": existing_questions,
            "regenerate_url": f"/questions/{stream_id}/regenerate"
        }
    
    # Start question generation in background
    background_tasks.add_task(
        question_generation_service.generate_questions_from_transcript,
        transcription.full_transcript,
        stream_id,
        num_mcq,
        num_short_answer
    )
    
    return {
        "message": "Question generation started",
        "stream_id": stream_id,
        "status": "processing",
        "estimated_questions": num_mcq + num_short_answer
    }


@router.post("/{stream_id}/regenerate")
async def regenerate_questions(
    stream_id: int,
    background_tasks: BackgroundTasks,
    num_mcq: int = 5,
    num_short_answer: int = 3,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Regenerate questions for a stream (removes existing questions)"""
    
    # Verify permissions
    stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    if current_user.role not in ["teacher", "admin"] and stream.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete existing questions
    db.query(GeneratedQuestion).filter(GeneratedQuestion.stream_id == stream_id).delete()
    db.commit()
    
    # Get transcription
    transcription = db.query(LectureTranscription).filter(
        LectureTranscription.stream_id == stream_id,
        LectureTranscription.status == "completed"
    ).first()
    
    if not transcription:
        raise HTTPException(status_code=400, detail="No transcription available")
    
    # Start regeneration
    background_tasks.add_task(
        question_generation_service.generate_questions_from_transcript,
        transcription.full_transcript,
        stream_id,
        num_mcq,
        num_short_answer
    )
    
    return {
        "message": "Question regeneration started",
        "stream_id": stream_id,
        "status": "processing"
    }


@router.get("/{stream_id}")
def get_questions(
    stream_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    question_type: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 20
):
    """Get generated questions for a stream"""
    
    # Verify stream exists and user has access
    stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    # Check access permissions
    has_access = False
    if current_user.role in ["teacher", "admin"]:
        if current_user.role == "admin" or stream.instructor_id == current_user.id:
            has_access = True
    elif current_user.role == "student":
        # Check if student is enrolled in the course
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == stream.course_id,
            Enrollment.status == "enrolled"
        ).first()
        has_access = enrollment is not None
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied to this stream's questions")
    
    # Build query
    query = db.query(GeneratedQuestion).filter(
        GeneratedQuestion.stream_id == stream_id,
        GeneratedQuestion.is_active == True
    )
    
    if question_type:
        query = query.filter(GeneratedQuestion.question_type == question_type)
    
    if difficulty:
        query = query.filter(GeneratedQuestion.difficulty_level == difficulty)
    
    questions = query.order_by(GeneratedQuestion.confidence_score.desc()).limit(limit).all()
    
    # Format response based on user role
    if current_user.role == "student":
        # Students don't see correct answers immediately
        return [
            {
                "id": q.id,
                "question_type": q.question_type,
                "question_text": q.question_text,
                "options": q.options,
                "difficulty_level": q.difficulty_level,
                "topic_tags": q.topic_tags,
                "created_at": q.created_at
            }
            for q in questions
        ]
    else:
        # Teachers/admins see full details
        return [
            {
                "id": q.id,
                "question_type": q.question_type,
                "question_text": q.question_text,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "difficulty_level": q.difficulty_level,
                "topic_tags": q.topic_tags,
                "confidence_score": q.confidence_score,
                "source_sentence": q.source_sentence,
                "times_used": q.times_used,
                "accuracy_rate": (q.correct_responses / max(q.times_used, 1)) * 100,
                "created_at": q.created_at
            }
            for q in questions
        ]


@router.get("/{stream_id}/status")
def get_generation_status(
    stream_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get question generation status for a stream"""
    
    # Verify access
    stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    if current_user.role not in ["teacher", "admin"] and stream.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get question statistics
    questions = db.query(GeneratedQuestion).filter(GeneratedQuestion.stream_id == stream_id).all()
    
    if not questions:
        return {
            "status": "no_questions",
            "message": "No questions generated yet",
            "total_questions": 0
        }
    
    # Calculate statistics
    question_stats = {
        "total_questions": len(questions),
        "multiple_choice": len([q for q in questions if q.question_type == "multiple_choice"]),
        "short_answer": len([q for q in questions if q.question_type == "short_answer"]),
        "difficulty_breakdown": {
            "easy": len([q for q in questions if q.difficulty_level == "easy"]),
            "medium": len([q for q in questions if q.difficulty_level == "medium"]),
            "hard": len([q for q in questions if q.difficulty_level == "hard"])
        },
        "average_confidence": sum(q.confidence_score for q in questions) / len(questions),
        "most_recent_generation": max(q.created_at for q in questions),
        "total_usage": sum(q.times_used for q in questions)
    }
    
    return {
        "status": "completed",
        "stream_id": stream_id,
        **question_stats
    }


from pydantic import BaseModel

class QuizStartRequest(BaseModel):
    course_id: int  # Changed from stream_id to course_id
    document_id: Optional[int] = None  # Optional: quiz from specific document
    question_count: Optional[int] = 10
    difficulty_level: Optional[str] = None
    time_limit: Optional[int] = None  # in minutes

@router.post("/quiz/start")
def start_quiz_session(
    quiz_request: QuizStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a quiz session for a student"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can start quiz sessions")
    
    # Extract parameters from request
    course_id = quiz_request.course_id
    document_id = quiz_request.document_id
    num_questions = quiz_request.question_count or 10
    difficulty_filter = quiz_request.difficulty_level
    time_limit_minutes = quiz_request.time_limit
    
    # Verify course access
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == course_id,
        Enrollment.status == "enrolled"
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    # Get available questions
    query = db.query(GeneratedQuestion).filter(
        GeneratedQuestion.course_id == course_id,
        GeneratedQuestion.is_active == True
    )
    
    # If specific document requested, filter by document
    if document_id:
        query = query.filter(GeneratedQuestion.document_id == document_id)
    
    if difficulty_filter:
        query = query.filter(GeneratedQuestion.difficulty_level == difficulty_filter)
    
    available_questions = query.all()
    
    if len(available_questions) < num_questions:
        raise HTTPException(
            status_code=400, 
            detail=f"Not enough questions available. Found {len(available_questions)}, requested {num_questions}"
        )
    
    # Create quiz session
    session_id = str(uuid.uuid4())
    quiz_session = QuizSession(
        session_id=session_id,
        user_id=current_user.id,
        course_id=course_id,  # Use course_id instead of stream_id
        document_id=document_id,  # Optional document-specific quiz
        quiz_type="document" if document_id else "course",  # Document or course-wide quiz
        total_questions=num_questions,
        time_limit_minutes=time_limit_minutes,
        started_at=datetime.utcnow()
    )
    
    db.add(quiz_session)
    db.commit()
    db.refresh(quiz_session)
    
    # Select random questions
    import random
    selected_questions = random.sample(available_questions, num_questions)
    
    # Format questions for quiz (no correct answers)
    quiz_questions = [
        {
            "id": q.id,
            "question_type": q.question_type,
            "question_text": q.question_text,
            "options": q.options,
            "difficulty_level": q.difficulty_level
        }
        for q in selected_questions
    ]
    
    return {
        "id": quiz_session.id,
        "session_id": session_id,
        "quiz_type": quiz_session.quiz_type,
        "course_id": course_id,
        "document_id": document_id,
        "total_questions": num_questions,
        "time_limit_minutes": time_limit_minutes,
        "questions": quiz_questions,
        "started_at": quiz_session.started_at
    }


class CourseQuizStartRequest(BaseModel):
    course_id: int
    question_count: Optional[int] = 10
    difficulty_level: Optional[str] = None
    time_limit: Optional[int] = None  # in minutes

@router.post("/course/quiz/start")
def start_course_quiz_session(
    quiz_request: CourseQuizStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a quiz session from all lectures in a course"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can start quiz sessions")
    
    # Extract parameters from request
    course_id = quiz_request.course_id
    num_questions = quiz_request.question_count or 10
    difficulty_filter = quiz_request.difficulty_level
    time_limit_minutes = quiz_request.time_limit
    
    # Verify course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == course_id,
        Enrollment.status == "enrolled"
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    # Get all lectures (livestreams) for this course
    course_streams = db.query(LiveStream).filter(
        LiveStream.course_id == course_id,
        LiveStream.status.in_(["ended", "live"])
    ).all()
    
    if not course_streams:
        raise HTTPException(status_code=404, detail="No lectures found for this course")
    
    stream_ids = [stream.id for stream in course_streams]
    
    # Get available questions from all course lectures
    query = db.query(GeneratedQuestion).filter(
        GeneratedQuestion.stream_id.in_(stream_ids),
        GeneratedQuestion.is_active == True
    )
    
    if difficulty_filter:
        query = query.filter(GeneratedQuestion.difficulty_level == difficulty_filter)
    
    available_questions = query.all()
    
    if len(available_questions) < num_questions:
        raise HTTPException(
            status_code=400, 
            detail=f"Not enough questions available across course lectures. Found {len(available_questions)}, requested {num_questions}"
        )
    
    # Create quiz session (use first stream as representative)
    session_id = str(uuid.uuid4())
    quiz_session = QuizSession(
        session_id=session_id,
        user_id=current_user.id,
        stream_id=course_streams[0].id,  # Use first stream as representative
        quiz_type="course",  # Mark as course-wide quiz
        total_questions=num_questions,
        time_limit_minutes=time_limit_minutes,
        started_at=datetime.utcnow()
    )
    
    db.add(quiz_session)
    db.commit()
    db.refresh(quiz_session)
    
    # Select random questions from across all course lectures
    import random
    selected_questions = random.sample(available_questions, num_questions)
    
    # Format questions for quiz (no correct answers)
    quiz_questions = [
        {
            "id": q.id,
            "question_type": q.question_type,
            "question_text": q.question_text,
            "options": q.options,
            "difficulty_level": q.difficulty_level,
            "topic_tags": q.topic_tags
        }
        for q in selected_questions
    ]
    
    return {
        "id": quiz_session.id,
        "session_id": session_id,
        "quiz_type": "course",
        "total_questions": num_questions,
        "time_limit_minutes": time_limit_minutes,
        "questions": quiz_questions,
        "started_at": quiz_session.started_at
    }


class QuizAnswerRequest(BaseModel):
    question_id: int
    selected_answer: str
    response_time_seconds: Optional[int] = None

@router.post("/quiz/{session_id}/answer")
def submit_answer(
    session_id: int,
    answer_request: QuizAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an answer for a quiz question"""
    
    # Extract parameters
    question_id = answer_request.question_id
    answer = answer_request.selected_answer
    response_time_seconds = answer_request.response_time_seconds
    
    # Get quiz session (convert session_id to string for UUID comparison)
    quiz_session = db.query(QuizSession).filter(
        QuizSession.id == session_id,
        QuizSession.user_id == current_user.id,
        QuizSession.is_completed == False
    ).first()
    
    if not quiz_session:
        raise HTTPException(status_code=404, detail="Quiz session not found or already completed")
    
    # Get question
    question = db.query(GeneratedQuestion).filter(GeneratedQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if already answered
    existing_answer = db.query(QuestionAnswer).filter(
        QuestionAnswer.question_id == question_id,
        QuestionAnswer.user_id == current_user.id,
        QuestionAnswer.quiz_session_id == quiz_session.session_id
    ).first()
    
    if existing_answer:
        raise HTTPException(status_code=400, detail="Question already answered in this session")
    
    # Evaluate answer
    is_correct = answer.strip().lower() == question.correct_answer.strip().lower()
    
    # For multiple choice, handle by option matching
    if question.question_type == "multiple_choice":
        is_correct = answer.strip() in question.options and answer.strip() == question.correct_answer.strip()
    
    # Record answer
    question_answer = QuestionAnswer(
        question_id=question_id,
        user_id=current_user.id,
        student_answer=answer,
        is_correct=is_correct,
        response_time_seconds=response_time_seconds,
        quiz_session_id=quiz_session.session_id
    )
    
    db.add(question_answer)
    
    # Update question statistics
    question.times_used += 1
    if is_correct:
        question.correct_responses += 1
    else:
        question.incorrect_responses += 1
    
    # Update quiz session
    quiz_session.questions_answered += 1
    if is_correct:
        quiz_session.correct_answers += 1
    
    # Check if quiz is complete
    if quiz_session.questions_answered >= quiz_session.total_questions:
        quiz_session.is_completed = True
        quiz_session.completed_at = datetime.utcnow()
        quiz_session.score_percentage = (quiz_session.correct_answers / quiz_session.total_questions) * 100
        quiz_session.is_passed = quiz_session.score_percentage >= quiz_session.passing_score
    
    db.commit()
    
    return {
        "is_correct": is_correct,
        "correct_answer": question.correct_answer if quiz_session.is_completed else None,
        "explanation": question.source_sentence if is_correct else None,
        "quiz_progress": {
            "questions_answered": quiz_session.questions_answered,
            "total_questions": quiz_session.total_questions,
            "current_score": quiz_session.correct_answers,
            "is_completed": quiz_session.is_completed
        }
    }


@router.get("/quiz/{session_id}/results")
def get_quiz_results(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get quiz results for a completed session"""
    
    quiz_session = db.query(QuizSession).filter(
        QuizSession.session_id == session_id,
        QuizSession.user_id == current_user.id
    ).first()
    
    if not quiz_session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    if not quiz_session.is_completed:
        raise HTTPException(status_code=400, detail="Quiz session not completed yet")
    
    # Get detailed answers
    answers = db.query(QuestionAnswer).filter(
        QuestionAnswer.quiz_session_id == session_id,
        QuestionAnswer.user_id == current_user.id
    ).all()
    
    detailed_results = []
    for answer in answers:
        question = answer.question
        detailed_results.append({
            "question_id": question.id,
            "question_text": question.question_text,
            "question_type": question.question_type,
            "student_answer": answer.student_answer,
            "correct_answer": question.correct_answer,
            "is_correct": answer.is_correct,
            "difficulty_level": question.difficulty_level,
            "topic_tags": question.topic_tags,
            "response_time_seconds": answer.response_time_seconds
        })
    
    return {
        "session_id": session_id,
        "quiz_type": quiz_session.quiz_type,
        "total_questions": quiz_session.total_questions,
        "correct_answers": quiz_session.correct_answers,
        "score_percentage": quiz_session.score_percentage,
        "is_passed": quiz_session.is_passed,
        "time_taken_minutes": (quiz_session.completed_at - quiz_session.started_at).total_seconds() / 60,
        "detailed_results": detailed_results,
        "completed_at": quiz_session.completed_at
    }


@router.get("/student-progress")
def get_student_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    course_id: Optional[int] = None
):
    """Get comprehensive student's quiz progress with real calculated statistics"""
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="This endpoint is for students only")
    
    try:
        # Get comprehensive statistics using the new service
        comprehensive_stats = user_statistics_service.get_comprehensive_student_progress(
            current_user.id, course_id
        )
        
        # Get recent quiz sessions for backwards compatibility
        query = db.query(QuizSession).filter(
            QuizSession.user_id == current_user.id,
            QuizSession.is_completed == True
        )
        
        if course_id:
            query = query.join(LiveStream).filter(LiveStream.course_id == course_id)
        
        recent_quiz_sessions = query.order_by(QuizSession.started_at.desc()).limit(10).all()
        
        recent_sessions = [
            {
                "session_id": s.session_id,
                "stream_id": s.stream_id,
                "quiz_type": s.quiz_type,
                "score_percentage": s.score_percentage,
                "is_passed": s.is_passed,
                "completed_at": s.completed_at,
                "total_questions": s.total_questions,
                "correct_answers": s.correct_answers,
                "duration_minutes": (
                    (s.completed_at - s.started_at).total_seconds() / 60 
                    if s.completed_at and s.started_at else None
                )
            }
            for s in recent_quiz_sessions
        ]
        
        # Format response to match expected frontend interface while providing enhanced data
        return {
            "student_id": current_user.id,
            
            # Core statistics (backwards compatible)
            "total_quizzes_taken": comprehensive_stats["total_quizzes_taken"],
            "average_score": comprehensive_stats["average_score"],
            "total_questions_answered": comprehensive_stats["total_questions_answered"],
            "correct_answers": comprehensive_stats["correct_answers"],
            "subjects_studied": comprehensive_stats["subjects_studied"],
            "recent_quiz_scores": comprehensive_stats["recent_quiz_scores"],
            "learning_streak": comprehensive_stats["learning_streak"],
            "time_spent_learning": comprehensive_stats["time_spent_learning"],
            
            # Enhanced statistics
            "accuracy_rate": comprehensive_stats["accuracy_rate"],
            "pass_rate": comprehensive_stats["pass_rate"],
            "performance_trend": comprehensive_stats["performance_trend"],
            "improvement_rate": comprehensive_stats["improvement_rate"],
            "consistency_score": comprehensive_stats["consistency_score"],
            
            # Subject and topic analysis
            "subject_performance": comprehensive_stats["subject_performance"],
            "topic_performance": comprehensive_stats["topic_performance"],
            "strongest_subject": comprehensive_stats["strongest_subject"],
            "weakest_subject": comprehensive_stats["weakest_subject"],
            "subjects_count": comprehensive_stats["subjects_count"],
            
            # Time-based insights
            "average_quiz_duration": comprehensive_stats["average_quiz_duration"],
            "total_study_sessions": comprehensive_stats["total_study_sessions"],
            "study_efficiency": comprehensive_stats["study_efficiency"],
            
            # Engagement metrics
            "longest_streak": comprehensive_stats["longest_streak"],
            "days_active": comprehensive_stats["days_active"],
            "weekly_activity": comprehensive_stats["weekly_activity"],
            "last_activity": comprehensive_stats["last_activity"],
            
            # Difficulty progression
            "difficulty_performance": comprehensive_stats["difficulty_performance"],
            "progression_recommendations": comprehensive_stats["progression_recommendations"],
            "ready_for_harder": comprehensive_stats["ready_for_harder"],
            
            # Metadata
            "last_updated": comprehensive_stats["last_updated"],
            "calculation_method": comprehensive_stats["calculation_method"],
            
            # Recent sessions (backwards compatible)
            "recent_sessions": recent_sessions,
            
            # Legacy compatibility
            "statistics": {
                "total_sessions": comprehensive_stats["total_quizzes_taken"],
                "completed_sessions": comprehensive_stats["total_quizzes_taken"],
                "passed_sessions": int(comprehensive_stats["total_quizzes_taken"] * comprehensive_stats["pass_rate"] / 100),
                "pass_rate": comprehensive_stats["pass_rate"],
                "average_score": comprehensive_stats["average_score"]
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting student progress for user {current_user.id}: {e}")
        # Return basic statistics as fallback
        return {
            "student_id": current_user.id,
            "error": "Could not calculate comprehensive statistics",
            "total_quizzes_taken": 0,
            "average_score": 0.0,
            "subjects_studied": [],
            "recent_quiz_scores": [],
            "learning_streak": 0,
            "time_spent_learning": 0,
            "recent_sessions": []
        }


@router.get("/teacher-analytics")
def get_teacher_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    course_id: Optional[int] = None
):
    """Get teacher analytics for course/student performance"""
    
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="This endpoint is for teachers only")
    
    try:
        from models import Course, Enrollment
        
        # Get courses taught by this teacher
        courses_query = db.query(Course).filter(Course.instructor_id == current_user.id)
        if course_id:
            courses_query = courses_query.filter(Course.id == course_id)
        
        courses = courses_query.all()
        course_ids = [c.id for c in courses]
        
        if not course_ids:
            return {
                "teacher_id": current_user.id,
                "courses_taught": 0,
                "total_students": 0,
                "total_quizzes_generated": 0,
                "average_student_score": 0.0,
                "course_analytics": []
            }
        
        # Get all quiz sessions for courses taught by this teacher
        quiz_sessions = db.query(QuizSession).join(
            LiveStream, QuizSession.stream_id == LiveStream.id
        ).filter(
            LiveStream.course_id.in_(course_ids),
            QuizSession.is_completed == True
        ).all()
        
        # Get all students enrolled in teacher's courses
        enrolled_students = db.query(Enrollment).filter(
            Enrollment.course_id.in_(course_ids),
            Enrollment.status == "enrolled"
        ).all()
        
        # Calculate overall statistics
        total_students = len(set(e.student_id for e in enrolled_students))
        total_quizzes = len(quiz_sessions)
        
        if quiz_sessions:
            valid_scores = [s.score_percentage for s in quiz_sessions if s.score_percentage is not None]
            average_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0.0
        else:
            average_score = 0.0
        
        # Calculate per-course analytics
        course_analytics = []
        for course in courses:
            course_sessions = [s for s in quiz_sessions 
                             if hasattr(s, 'stream') and s.stream.course_id == course.id]
            course_enrollments = [e for e in enrolled_students if e.course_id == course.id]
            
            valid_course_scores = [s.score_percentage for s in course_sessions if s.score_percentage is not None]
            
            course_stats = {
                "course_id": course.id,
                "course_title": course.title,
                "students_enrolled": len(course_enrollments),
                "total_quiz_sessions": len(course_sessions),
                "average_score": (
                    sum(valid_course_scores) / len(valid_course_scores) if valid_course_scores else 0.0
                ),
                "completion_rate": (
                    len([s for s in course_sessions if s.is_completed]) / len(course_sessions) * 100
                    if course_sessions else 0.0
                ),
                "pass_rate": (
                    len([s for s in course_sessions if s.score_percentage and s.score_percentage >= 60]) / len(course_sessions) * 100
                    if course_sessions else 0.0
                )
            }
            course_analytics.append(course_stats)
        
        return {
            "teacher_id": current_user.id,
            "courses_taught": len(courses),
            "total_students": total_students,
            "total_quizzes_generated": total_quizzes,
            "average_student_score": round(average_score, 2),
            "course_analytics": course_analytics,
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting teacher analytics for user {current_user.id}: {e}")
        return {
            "teacher_id": current_user.id,
            "error": "Could not calculate teacher analytics",
            "courses_taught": 0,
            "total_students": 0,
            "total_quizzes_generated": 0,
            "average_student_score": 0.0,
            "course_analytics": []
        }


# Helper function for document-based question generation
async def generate_questions_from_document_content(
    document_content: str,
    document_id: int,
    course_id: int,
    num_mcq: int = 5,
    num_short_answer: int = 3
):
    """Generate questions from document content and store in database"""
    
    try:
        logger.info(f"Starting question generation for document {document_id}")
        
        if not document_content or len(document_content.strip()) < 200:
            logger.error("Document content too short for question generation")
            return {"success": False, "error": "Document content too short"}

        # Use the existing question generation service
        from services.question_generation_service import question_generation_service
        
        # Modify the question generation service to work with documents
        result = await question_generation_service.generate_questions_from_document(
            document_content, document_id, course_id, num_mcq, num_short_answer
        )
        
        logger.info(f"Question generation completed for document {document_id}: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error generating questions for document {document_id}: {e}")
        return {"success": False, "error": str(e)}