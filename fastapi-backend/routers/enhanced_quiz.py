from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db
from auth import get_current_user
from models import (
    User, EnhancedQuizSession, QuizAttemptMCQ, MCQ,
    MasterTopic, SubMasterTopic, SpecificMasterTopic, UserTopicProgress
)
from schemas import (
    QuizStartRequest, QuizSessionResponse, QuizAnswerRequest,
    QuizCompleteRequest, QuizResults, UserDetailsResponse,
    UserQuizStats, LeaderboardEntry, TopicLeaderboard,
    MasterTopicResponse, UserTopicProgressResponse
)
from services.quiz_service import quiz_service

router = APIRouter(prefix="/enhanced-quiz", tags=["Enhanced Quiz"])

@router.post("/start", response_model=QuizSessionResponse)
async def start_quiz(
    quiz_request: QuizStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new quiz session with AI-generated questions"""
    try:
        # Generate questions using Gemini AI
        questions_response = await quiz_service.generate_quiz_questions(
            topic=quiz_request.topic,
            num_questions=quiz_request.num_questions,
            difficulty=quiz_request.difficulty,
            course_id=quiz_request.course_id,
            user_id=current_user.id,
            db=db
        )
        
        if not questions_response.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate questions: {questions_response.get('error', 'Unknown error')}"
            )
        
        if not questions_response.get("questions"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No questions were generated"
            )
        
        # Create quiz session
        quiz_session = quiz_service.create_quiz_session(
            user_id=current_user.id,
            quiz_request=quiz_request,
            questions_data=questions_response,
            db=db
        )
        
        return QuizSessionResponse(
            id=quiz_session.id,
            session_id=quiz_session.session_id,
            topic_name=quiz_session.topic_name,
            difficulty=quiz_session.difficulty,
            num_questions=quiz_session.num_questions,
            time_limit=quiz_session.time_limit,
            status=quiz_session.status,
            current_question_index=quiz_session.current_question_index,
            questions_json=quiz_session.questions_json,
            score=quiz_session.score,
            total_questions=quiz_session.total_questions,
            started_at=quiz_session.started_at
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start quiz: {str(e)}"
        )

@router.get("/session/{session_id}", response_model=QuizSessionResponse)
async def get_quiz_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get quiz session details"""
    quiz_session = db.query(EnhancedQuizSession).filter(
        EnhancedQuizSession.session_id == session_id,
        EnhancedQuizSession.user_id == current_user.id
    ).first()
    
    if not quiz_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz session not found"
        )
    
    return QuizSessionResponse(
        id=quiz_session.id,
        session_id=quiz_session.session_id,
        topic_name=quiz_session.topic_name,
        difficulty=quiz_session.difficulty,
        num_questions=quiz_session.num_questions,
        time_limit=quiz_session.time_limit,
        status=quiz_session.status,
        current_question_index=quiz_session.current_question_index,
        questions_json=quiz_session.questions_json,
        score=quiz_session.score,
        total_questions=quiz_session.total_questions,
        started_at=quiz_session.started_at
    )

@router.post("/answer")
async def submit_answer(
    answer_request: QuizAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit answer for a specific question"""
    result = quiz_service.submit_answer(
        session_id=answer_request.session_id,
        question_index=answer_request.question_index,
        user_answer=answer_request.user_answer,
        time_taken=answer_request.time_taken,
        user_id=current_user.id,
        db=db
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to submit answer")
        )
    
    return {
        "success": True,
        "is_correct": result["is_correct"],
        "correct_answer": result["correct_answer"],
        "message": "Answer submitted successfully"
    }

@router.post("/complete", response_model=QuizResults)
async def complete_quiz(
    complete_request: QuizCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete quiz and get results"""
    try:
        results = quiz_service.complete_quiz(
            session_id=complete_request.session_id,
            total_time_taken=complete_request.total_time_taken,
            user_id=current_user.id,
            db=db
        )
        return results
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete quiz: {str(e)}"
        )

@router.get("/user-details", response_model=UserDetailsResponse)
async def get_user_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user quiz details and progress"""
    
    try:
        # Get user's topic progress
        progress_records = db.query(UserTopicProgress).filter(
            UserTopicProgress.user_id == current_user.id
        ).all()
    
        # Aggregate stats
        total_qv_coins = sum(p.total_qv_coins for p in progress_records)
        total_questions_attempted = sum(p.questions_attempted for p in progress_records)
        total_questions_correct = sum(p.questions_correct for p in progress_records)
        current_streak = max((p.streak for p in progress_records), default=0)
        max_level = max((p.level for p in progress_records), default=1)
        
        # Get completed quiz sessions
        completed_sessions = db.query(EnhancedQuizSession).filter(
            EnhancedQuizSession.user_id == current_user.id,
            EnhancedQuizSession.status == 'completed'
        ).count()
        
        # Calculate overall accuracy
        overall_accuracy = (total_questions_correct / total_questions_attempted * 100) if total_questions_attempted > 0 else 0
        
        # Get recent performance (last 10 quizzes)
        recent_sessions = db.query(EnhancedQuizSession).filter(
            EnhancedQuizSession.user_id == current_user.id,
            EnhancedQuizSession.status == 'completed'
        ).order_by(desc(EnhancedQuizSession.completed_at)).limit(10).all()
        
        recent_performance = []
        for session in recent_sessions:
            percentage = (session.score / session.total_questions * 100) if session.total_questions > 0 else 0
            recent_performance.append({
                "topic": session.topic_name,
                "score": session.score,
                "total": session.total_questions,
                "percentage": round(percentage, 2),
                "date": session.completed_at.isoformat() if session.completed_at else None
            })
        
        # Get favorite topics (most practiced)
        topic_counts = {}
        for progress in progress_records:
            if hasattr(progress, 'specific_topic') and progress.specific_topic and hasattr(progress.specific_topic, 'name'):
                topic_counts[progress.specific_topic.name] = progress.questions_attempted
        
        favorite_topics = sorted(topic_counts.keys(), key=lambda x: topic_counts[x], reverse=True)[:5]
        
        # Get topic names from progress - with safe access
        master_topics = []
        sub_topics = []
        specific_topics = []
        
        for progress in progress_records:
            try:
                if hasattr(progress, 'master_topic') and progress.master_topic and hasattr(progress.master_topic, 'name'):
                    master_topics.append(progress.master_topic.name)
                if hasattr(progress, 'sub_topic') and progress.sub_topic and hasattr(progress.sub_topic, 'name'):
                    sub_topics.append(progress.sub_topic.name)
                if hasattr(progress, 'specific_topic') and progress.specific_topic and hasattr(progress.specific_topic, 'name'):
                    specific_topics.append(progress.specific_topic.name)
            except AttributeError:
                continue
        
        # Remove duplicates
        master_topics = list(set(master_topics))
        sub_topics = list(set(sub_topics))
        specific_topics = list(set(specific_topics))
        
        quiz_stats = UserQuizStats(
            total_quizzes=completed_sessions,
            total_questions_attempted=total_questions_attempted,
            total_questions_correct=total_questions_correct,
            overall_accuracy=round(overall_accuracy, 2),
            total_qv_coins=total_qv_coins,
            current_streak=current_streak,
            favorite_topics=favorite_topics,
            recent_performance=recent_performance
        )
        
        return UserDetailsResponse(
            username=current_user.username,
            level=max_level,
            streak=current_streak,
            total_qv_coins=total_qv_coins,
            master_topics=master_topics,
            sub_topics=sub_topics,
            specific_topics=specific_topics,
            quiz_stats=quiz_stats
        )
        
    except Exception as e:
        print(f"Error in get_user_details: {e}")
        # Return default values for new user
        return UserDetailsResponse(
            username=current_user.username,
            level=1,
            streak=0,
            total_qv_coins=0,
            master_topics=[],
            sub_topics=[],
            specific_topics=[],
            quiz_stats=UserQuizStats(
                total_quizzes=0,
                total_questions_attempted=0,
                total_questions_correct=0,
                overall_accuracy=0.0,
                total_qv_coins=0,
                current_streak=0,
                favorite_topics=[],
                recent_performance=[]
            )
        )

@router.get("/my-sessions", response_model=List[QuizSessionResponse])
async def get_my_quiz_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Get user's quiz sessions"""
    try:
        sessions = db.query(EnhancedQuizSession).filter(
            EnhancedQuizSession.user_id == current_user.id
        ).order_by(desc(EnhancedQuizSession.started_at)).limit(limit).all()
        
        return [
            QuizSessionResponse(
                id=session.id,
                session_id=session.session_id,
                topic_name=session.topic_name,
                difficulty=session.difficulty,
                num_questions=session.num_questions,
                time_limit=session.time_limit,
                status=session.status,
                current_question_index=session.current_question_index,
                score=session.score,
                total_questions=session.total_questions,
                started_at=session.started_at
            )
            for session in sessions
        ]
    except Exception as e:
        print(f"Error in get_my_quiz_sessions: {e}")
        # Return empty list instead of error for now
        return []

@router.get("/topics", response_model=List[MasterTopicResponse])
async def get_available_topics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all available topics for quizzes"""
    topics = db.query(MasterTopic).all()
    
    return [
        MasterTopicResponse(
            id=topic.id,
            name=topic.name,
            description=topic.description,
            created_at=topic.created_at
        )
        for topic in topics
    ]

@router.get("/leaderboard/{topic_level}")
async def get_leaderboard(
    topic_level: str,  # master, sub, specific
    topic_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get leaderboard for a specific topic level"""
    
    if topic_level not in ['master', 'sub', 'specific']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Topic level must be 'master', 'sub', or 'specific'"
        )
    
    # Build query based on topic level
    query = db.query(
        User.username,
        func.sum(UserTopicProgress.total_qv_coins).label('total_coins'),
        func.max(UserTopicProgress.level).label('max_level'),
        func.max(UserTopicProgress.streak).label('max_streak'),
        func.avg(
            UserTopicProgress.questions_correct * 100.0 / 
            func.nullif(UserTopicProgress.questions_attempted, 0)
        ).label('accuracy')
    ).join(UserTopicProgress)
    
    if topic_level == 'master' and topic_id:
        query = query.filter(UserTopicProgress.master_topic_id == topic_id)
    elif topic_level == 'sub' and topic_id:
        query = query.filter(UserTopicProgress.sub_topic_id == topic_id)
    elif topic_level == 'specific' and topic_id:
        query = query.filter(UserTopicProgress.specific_topic_id == topic_id)
    
    results = query.group_by(User.username).order_by(
        desc('total_coins')
    ).limit(limit).all()
    
    leaderboard = []
    for result in results:
        leaderboard.append(LeaderboardEntry(
            username=result.username,
            total_coins=result.total_coins or 0,
            level=result.max_level or 1,
            streak=result.max_streak or 0,
            accuracy=round(result.accuracy or 0, 2)
        ))
    
    return {
        "topic_level": topic_level,
        "topic_id": topic_id,
        "leaderboard": leaderboard
    }

@router.get("/progress", response_model=List[UserTopicProgressResponse])
async def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's detailed topic progress"""
    progress_records = db.query(UserTopicProgress).filter(
        UserTopicProgress.user_id == current_user.id
    ).all()
    
    return [
        UserTopicProgressResponse(
            id=progress.id,
            user_id=progress.user_id,
            master_topic_id=progress.master_topic_id,
            sub_topic_id=progress.sub_topic_id,
            specific_topic_id=progress.specific_topic_id,
            level=progress.level,
            streak=progress.streak,
            total_qv_coins=progress.total_qv_coins,
            questions_attempted=progress.questions_attempted,
            questions_correct=progress.questions_correct,
            accuracy_percentage=round(
                (progress.questions_correct / progress.questions_attempted * 100) 
                if progress.questions_attempted > 0 else 0, 2
            ),
            last_activity=progress.last_activity
        )
        for progress in progress_records
    ]

@router.delete("/session/{session_id}")
async def delete_quiz_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a quiz session (for abandoned sessions)"""
    quiz_session = db.query(EnhancedQuizSession).filter(
        EnhancedQuizSession.session_id == session_id,
        EnhancedQuizSession.user_id == current_user.id
    ).first()
    
    if not quiz_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz session not found"
        )
    
    # Delete associated attempts
    db.query(QuizAttemptMCQ).filter(
        QuizAttemptMCQ.quiz_session_id == quiz_session.id
    ).delete()
    
    # Delete session
    db.delete(quiz_session)
    db.commit()
    
    return {"message": "Quiz session deleted successfully"}