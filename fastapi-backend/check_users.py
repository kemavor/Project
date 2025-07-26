#!/usr/bin/env python3
"""
Script to check existing users and create a test user.
"""

from database import SessionLocal
from models import User
from auth import get_password_hash


def check_users():
    """Check existing users and create a test user if needed."""

    db = SessionLocal()

    try:
        # Check existing users
        users = db.query(User).all()
        print("📋 Existing users:")
        for user in users:
            print(f"   - {user.username} ({user.email}) - Role: {user.role}")

        # Check if test teacher exists
        test_teacher = db.query(User).filter(
            User.username == "test_teacher").first()

        if not test_teacher:
            print("\n👨‍🏫 Creating test teacher...")
            test_teacher = User(
                username="test_teacher",
                email="test_teacher@visionware.com",
                first_name="Test",
                last_name="Teacher",
                hashed_password=get_password_hash("password123"),
                role="teacher",
                is_active=True,
                is_staff=True
            )
            db.add(test_teacher)
            db.commit()
            db.refresh(test_teacher)
            print(f"✅ Created test teacher: {test_teacher.username}")
        else:
            print(f"✅ Test teacher already exists: {test_teacher.username}")

        # Check if test student exists
        test_student = db.query(User).filter(
            User.username == "test_student").first()

        if not test_student:
            print("\n👨‍🎓 Creating test student...")
            test_student = User(
                username="test_student",
                email="test_student@visionware.com",
                first_name="Test",
                last_name="Student",
                hashed_password=get_password_hash("password123"),
                role="student",
                is_active=True
            )
            db.add(test_student)
            db.commit()
            db.refresh(test_student)
            print(f"✅ Created test student: {test_student.username}")
        else:
            print(f"✅ Test student already exists: {test_student.username}")

        print("\n📝 Test Credentials:")
        print("   Teacher: username=test_teacher, password=password123")
        print("   Student: username=test_student, password=password123")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🔍 Checking VisionWare users...")
    print("=" * 50)
    check_users()
    print("\n" + "=" * 50)
    print("✅ User check completed!")
