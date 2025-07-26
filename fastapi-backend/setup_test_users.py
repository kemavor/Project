#!/usr/bin/env python3
"""
Setup test users for ECHO testing
"""

from config import settings
from auth import get_password_hash
from models import User, Base
from database import engine, SessionLocal
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def setup_test_users():
    """Create test users if they don't exist"""

    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Test student user
        student = db.query(User).filter(User.username == "student1").first()
        if not student:
            student = User(
                username="student1",
                email="student1@test.com",
                hashed_password=get_password_hash("password123"),
                first_name="Test",
                last_name="Student",
                role="student",
                is_active=True
            )
            db.add(student)
            print("✅ Created test student user: student1/password123")
        else:
            print("✅ Test student user already exists")

        # Test teacher user
        teacher = db.query(User).filter(User.username == "teacher1").first()
        if not teacher:
            teacher = User(
                username="teacher1",
                email="teacher1@test.com",
                hashed_password=get_password_hash("password123"),
                first_name="Test",
                last_name="Teacher",
                role="teacher",
                is_active=True
            )
            db.add(teacher)
            print("✅ Created test teacher user: teacher1/password123")
        else:
            print("✅ Test teacher user already exists")

        db.commit()
        print("\n🎉 Test users setup complete!")
        print("You can now test ECHO with:")
        print("  - Student: student1 / password123")
        print("  - Teacher: teacher1 / password123")

    except Exception as e:
        db.rollback()
        print(f"❌ Error setting up test users: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    setup_test_users()
