from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserStatistics, LearningActivity
from schemas import UserStatisticsResponse, LearningActivityCreate, LearningActivityResponse
from auth import get_current_active_user

router = APIRouter(prefix="/statistics", tags=["statistics"])


def get_or_create_user_statistics(db: Session, user_id: int) -> UserStatistics:
    """Get or create user statistics"""
    stats = db.query(UserStatistics).filter(
        UserStatistics.user_id == user_id).first()
    if not stats:
        stats = UserStatistics(user_id=user_id)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats


def update_learning_streak(db: Session, user_id: int):
    """Update user's learning streak"""
    stats = get_or_create_user_statistics(db, user_id)

    # Get today's activities
    today = datetime.utcnow().date()
    today_activities = db.query(LearningActivity).filter(
        LearningActivity.user_id == user_id,
        LearningActivity.created_at >= today
    ).count()

    if today_activities > 0:
        # User had activity today
        if not stats.streak_start_date:
            stats.streak_start_date = datetime.utcnow()
        elif stats.streak_start_date.date() < today - timedelta(days=1):
            # Streak was broken, restart
            stats.streak_start_date = datetime.utcnow()
            stats.learning_streak_days = 1
        else:
            # Continue streak
            if stats.streak_start_date:
                days_since_start = (datetime.utcnow() -
                                    stats.streak_start_date).days + 1
                stats.learning_streak_days = days_since_start

    stats.last_activity = datetime.utcnow()
    db.commit()
    return stats


@router.get("/user", response_model=UserStatisticsResponse)
async def get_user_statistics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's statistics"""
    stats = get_or_create_user_statistics(db, current_user.id)
    return stats


@router.post("/activity", response_model=LearningActivityResponse)
async def record_learning_activity(
    activity: LearningActivityCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Record a learning activity"""
    try:
        # Create learning activity
        db_activity = LearningActivity(
            user_id=current_user.id,
            activity_type=activity.activity_type,
            activity_id=activity.activity_id,
            duration_minutes=activity.duration_minutes,
            score=activity.score,
            completed=activity.completed
        )
        db.add(db_activity)
        db.commit()
        db.refresh(db_activity)

        # Update user statistics
        stats = get_or_create_user_statistics(db, current_user.id)

        # Update specific metrics based on activity type
        if activity.activity_type == "lecture":
            stats.lectures_attended += 1
        elif activity.activity_type == "flashcard":
            stats.flashcards_reviewed += 1
        elif activity.activity_type == "quiz":
            stats.quizzes_completed += 1
            if activity.score is not None:
                # Update average score
                total_score = stats.quiz_average_score * \
                    (stats.quizzes_completed - 1) + activity.score
                stats.quiz_average_score = total_score / stats.quizzes_completed
        elif activity.activity_type == "course" and current_user.role == "teacher":
            stats.courses_created += 1
        elif activity.activity_type == "lecture" and current_user.role == "teacher":
            stats.lectures_conducted += 1

        # Update study hours
        stats.total_study_hours += activity.duration_minutes / 60.0

        # Update learning streak
        update_learning_streak(db, current_user.id)

        return db_activity

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record activity: {str(e)}"
        )


@router.get("/activities", response_model=List[LearningActivityResponse])
async def get_user_activities(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get user's recent learning activities"""
    activities = db.query(LearningActivity).filter(
        LearningActivity.user_id == current_user.id
    ).order_by(LearningActivity.created_at.desc()).limit(limit).all()

    return activities


@router.get("/weekly-progress")
async def get_weekly_progress(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's weekly learning progress"""
    today = datetime.utcnow()
    week_start = today - timedelta(days=today.weekday())

    weekly_data = []
    for i in range(7):
        day_start = week_start + timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        # Get activities for this day
        day_activities = db.query(LearningActivity).filter(
            LearningActivity.user_id == current_user.id,
            LearningActivity.created_at >= day_start,
            LearningActivity.created_at < day_end
        ).all()

        total_hours = sum(
            activity.duration_minutes for activity in day_activities) / 60.0
        completed_activities = len(day_activities)

        weekly_data.append({
            "day": day_start.strftime("%a"),
            "hours": round(total_hours, 1),
            "completed": completed_activities
        })

    return weekly_data


@router.post("/reset-streak")
async def reset_learning_streak(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reset user's learning streak (for testing)"""
    stats = get_or_create_user_statistics(db, current_user.id)
    stats.learning_streak_days = 0
    stats.streak_start_date = None
    db.commit()

    return {"message": "Learning streak reset successfully"}
