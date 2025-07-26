#!/usr/bin/env python
"""
Setup initial data for VisionWare FastAPI backend
"""
from database import SessionLocal, engine
from models import Base, User, RoleType, UserStatistics, LearningActivity
from auth import get_password_hash
from datetime import datetime, timedelta


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")


def create_test_users():
    """Create test users"""
    db = SessionLocal()

    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("ℹ️  Users already exist, skipping user creation")
            return

        # Create test users
        test_users = [
            {
                "username": "student",
                "email": "student@visionware.com",
                "password": "student123",
                "first_name": "John",
                "last_name": "Student",
                "role": RoleType.STUDENT,
                "is_active": True
            },
            {
                "username": "teacher",
                "email": "teacher@visionware.com",
                "password": "teacher123",
                "first_name": "Sarah",
                "last_name": "Teacher",
                "role": RoleType.TEACHER,
                "is_active": True,
                "is_staff": True
            },
            {
                "username": "admin",
                "email": "admin@visionware.com",
                "password": "admin123",
                "first_name": "Admin",
                "last_name": "User",
                "role": RoleType.ADMIN,
                "is_active": True,
                "is_staff": True,
                "is_superuser": True
            }
        ]

        for user_data in test_users:
            hashed_password = get_password_hash(user_data["password"])
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=hashed_password,
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                role=user_data["role"],
                is_active=user_data["is_active"],
                is_staff=user_data.get("is_staff", False),
                is_superuser=user_data.get("is_superuser", False),
                created_at=datetime.utcnow()
            )
            db.add(user)
            print(
                f"✅ Created user: {user_data['username']} ({user_data['password']})")

            db.commit()
        print("✅ All test users created successfully!")

        # Create sample statistics and activities
        create_sample_statistics(db)

    except Exception as e:
        print(f"❌ Error creating users: {e}")
        db.rollback()
    finally:
        db.close()


def create_sample_statistics(db: SessionLocal):
    """Create sample statistics and activities for testing"""
    try:
        # Get the student user
        student = db.query(User).filter(User.username == "student").first()
        if not student:
            print("⚠️  Student user not found, skipping sample data creation")
            return

        # Create user statistics
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
            )
        ]

        for activity in activities:
            db.add(activity)

        db.commit()
        print("✅ Sample statistics and activities created successfully!")

    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()


def main():
    """Main setup function"""
    print("🚀 Setting up VisionWare FastAPI backend...")

    # Create tables
    create_tables()

    # Create test users
    create_test_users()

    print("\n🎉 Setup complete!")
    print("\n📋 Test Users:")
    print("  student / student123")
    print("  teacher / teacher123")
    print("  admin / admin123")
    print("\n🌐 API Documentation: http://127.0.0.1:8000/docs")
    print("🔗 Health Check: http://127.0.0.1:8000/health")


if __name__ == "__main__":
    main()
