#!/usr/bin/env python
"""
Add sample statistics and learning activities for testing
"""
from database import SessionLocal, engine
from models import Base, User, UserStatistics, LearningActivity
from datetime import datetime, timedelta


def add_sample_statistics():
    """Add sample statistics and activities for testing"""
    db = SessionLocal()

    try:
        # Get the student user
        student = db.query(User).filter(User.username == "student").first()
        if not student:
            print("❌ Student user not found")
            return

        # Check if statistics already exist
        existing_stats = db.query(UserStatistics).filter(
            UserStatistics.user_id == student.id).first()
        if existing_stats:
            print("ℹ️  Statistics already exist for student, updating...")
            # Update existing statistics
            existing_stats.lectures_attended = 12
            existing_stats.flashcards_reviewed = 45
            existing_stats.quizzes_completed = 8
            existing_stats.quiz_average_score = 87.5
            existing_stats.learning_streak_days = 5
            existing_stats.total_study_hours = 24.5
            existing_stats.last_activity = datetime.utcnow()
            existing_stats.streak_start_date = datetime.utcnow() - timedelta(days=4)
        else:
            print("✅ Creating new statistics for student...")
            # Create new statistics
            stats = UserStatistics(
                user_id=student.id,
                lectures_attended=12,
                flashcards_reviewed=45,
                quizzes_completed=8,
                quiz_average_score=87.5,
                learning_streak_days=5,
                total_study_hours=24.5,
                last_activity=datetime.utcnow(),
                streak_start_date=datetime.utcnow() - timedelta(days=4)
            )
            db.add(stats)

        # Clear existing activities and create new ones
        db.query(LearningActivity).filter(
            LearningActivity.user_id == student.id).delete()

        # Create sample learning activities
        activities = [
            LearningActivity(
                user_id=student.id,
                activity_type="lecture",
                duration_minutes=45,
                created_at=datetime.utcnow() - timedelta(days=1)
            ),
            LearningActivity(
                user_id=student.id,
                activity_type="quiz",
                duration_minutes=30,
                score=90.0,
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
            LearningActivity(
                user_id=student.id,
                activity_type="flashcard",
                duration_minutes=15,
                created_at=datetime.utcnow() - timedelta(days=3)
            ),
            LearningActivity(
                user_id=student.id,
                activity_type="lecture",
                duration_minutes=60,
                created_at=datetime.utcnow() - timedelta(days=4)
            ),
            LearningActivity(
                user_id=student.id,
                activity_type="quiz",
                duration_minutes=25,
                score=85.0,
                created_at=datetime.utcnow() - timedelta(days=5)
            ),
            # Add some activities for this week
            LearningActivity(
                user_id=student.id,
                activity_type="lecture",
                duration_minutes=30,
                created_at=datetime.utcnow() - timedelta(hours=2)
            ),
            LearningActivity(
                user_id=student.id,
                activity_type="flashcard",
                duration_minutes=20,
                created_at=datetime.utcnow() - timedelta(hours=1)
            )
        ]

        for activity in activities:
            db.add(activity)

        db.commit()
        print("✅ Sample statistics and activities created successfully!")
        print(f"📊 Student statistics:")
        print(f"   - Lectures attended: 12")
        print(f"   - Flashcards reviewed: 45")
        print(f"   - Quizzes completed: 8")
        print(f"   - Quiz average: 87.5%")
        print(f"   - Learning streak: 5 days")
        print(f"   - Total study hours: 24.5")

    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Adding sample statistics and activities...")
    add_sample_statistics()
    print("✅ Done!")
