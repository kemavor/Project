#!/usr/bin/env python3
"""
Script to create a sample course for testing live lectures.
This will create a course that teachers can use to create live lectures.
"""

from auth import get_password_hash
from models import Course, User, Base
from database import engine, SessionLocal
import sys
import os
from datetime import datetime

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def create_sample_course():
    """Create a sample course for testing live lectures."""

    # Create database tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if we have any users (teachers)
        users = db.query(User).filter(User.role == "teacher").all()

        if not users:
            print("No teachers found. Creating a sample teacher...")

            # Create a sample teacher
            teacher = User(
                username="sample_teacher",
                email="teacher@visionware.com",
                first_name="Sample",
                last_name="Teacher",
                hashed_password=get_password_hash("password123"),
                role="teacher",
                is_active=True,
                is_staff=True
            )
            db.add(teacher)
            db.commit()
            db.refresh(teacher)
            print(f"Created sample teacher: {teacher.username}")
        else:
            teacher = users[0]
            print(f"Using existing teacher: {teacher.username}")

        # Check if sample course already exists
        existing_course = db.query(Course).filter(
            Course.title == "Introduction to Computer Science").first()

        if existing_course:
            print("Sample course already exists!")
            return existing_course

        # Create sample course
        sample_course = Course(
            title="Introduction to Computer Science",
            description="A comprehensive introduction to computer science concepts, programming fundamentals, and software development principles. This course covers basic programming, algorithms, data structures, and problem-solving techniques.",
            instructor_id=teacher.id,
            is_enrollment_open=True,
            credits=3,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        db.add(sample_course)
        db.commit()
        db.refresh(sample_course)

        print(f"✅ Sample course created successfully!")
        print(f"   Course ID: {sample_course.id}")
        print(f"   Title: {sample_course.title}")
        print(f"   Instructor: {teacher.first_name} {teacher.last_name}")
        print(f"   Credits: {sample_course.credits}")
        print(f"   Enrollment Open: {sample_course.is_enrollment_open}")

        return sample_course

    except Exception as e:
        print(f"❌ Error creating sample course: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_sample_student():
    """Create a sample student for testing."""

    db = SessionLocal()

    try:
        # Check if sample student already exists
        existing_student = db.query(User).filter(
            User.username == "sample_student").first()

        if existing_student:
            print("Sample student already exists!")
            return existing_student

        # Create sample student
        student = User(
            username="sample_student",
            email="student@visionware.com",
            first_name="Sample",
            last_name="Student",
            hashed_password=get_password_hash("password123"),
            role="student",
            is_active=True
        )

        db.add(student)
        db.commit()
        db.refresh(student)

        print(f"✅ Sample student created successfully!")
        print(f"   Username: {student.username}")
        print(f"   Email: {student.email}")
        print(f"   Role: {student.role}")

        return student

    except Exception as e:
        print(f"❌ Error creating sample student: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🎓 Creating sample data for VisionWare...")
    print("=" * 50)

    # Create sample course
    course = create_sample_course()

    print("\n" + "=" * 50)

    # Create sample student
    student = create_sample_student()

    print("\n" + "=" * 50)
    print("✅ Sample data created successfully!")
    print("\n📝 Login Credentials:")
    print("   Teacher: username=sample_teacher, password=password123")
    print("   Student: username=sample_student, password=password123")
    print("\n🎥 You can now test live lecture creation with the sample course!")
