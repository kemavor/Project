#!/usr/bin/env python3
"""
Create Multiple Teacher Accounts for VisionWare
This script creates several teacher accounts to test document upload functionality.
"""

import requests
import json
from datetime import datetime


def create_teacher_accounts():
    """Create multiple teacher accounts"""

    base_url = "http://localhost:8000"

    # Teacher accounts to create
    teachers = [
        {
            "username": "prof_smith",
            "password": "password123",
            "email": "smith@university.edu",
            "first_name": "Dr. Sarah",
            "last_name": "Smith",
            "role": "teacher"
        },
        {
            "username": "prof_johnson",
            "password": "password123",
            "email": "johnson@university.edu",
            "first_name": "Prof. Michael",
            "last_name": "Johnson",
            "role": "teacher"
        },
        {
            "username": "prof_williams",
            "password": "password123",
            "email": "williams@university.edu",
            "first_name": "Dr. Emily",
            "last_name": "Williams",
            "role": "teacher"
        },
        {
            "username": "prof_brown",
            "password": "password123",
            "email": "brown@university.edu",
            "first_name": "Prof. David",
            "last_name": "Brown",
            "role": "teacher"
        },
        {
            "username": "prof_davis",
            "password": "password123",
            "email": "davis@university.edu",
            "first_name": "Dr. Lisa",
            "last_name": "Davis",
            "role": "teacher"
        }
    ]

    print("👨‍🏫 Creating Teacher Accounts for VisionWare")
    print("=" * 50)

    created_teachers = []

    for teacher in teachers:
        try:
            print(
                f"\n📝 Creating teacher: {teacher['first_name']} {teacher['last_name']}")

            # Register the teacher
            response = requests.post(
                f"{base_url}/api/auth/register",
                json=teacher,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                print(f"   ✅ Teacher account created successfully")
                created_teachers.append(teacher)
            else:
                print(f"   ❌ Failed to create account: {response.status_code}")
                print(f"   Response: {response.text}")

        except Exception as e:
            print(f"   ❌ Error creating teacher: {e}")

    print(f"\n📊 Summary:")
    print(f"   Total teachers to create: {len(teachers)}")
    print(f"   Successfully created: {len(created_teachers)}")

    if created_teachers:
        print(f"\n🎓 Created Teacher Accounts:")
        for teacher in created_teachers:
            print(
                f"   👤 {teacher['username']} ({teacher['first_name']} {teacher['last_name']})")
            print(f"      Email: {teacher['email']}")
            print(f"      Password: {teacher['password']}")
            print()

    return created_teachers


def create_sample_courses_for_teachers():
    """Create sample courses for the teachers"""

    base_url = "http://localhost:8000"

    # Sample courses for each teacher
    teacher_courses = {
        "prof_smith": [
            {"title": "Advanced Mathematics",
                "description": "Advanced mathematical concepts and applications", "credits": 4},
            {"title": "Calculus III",
                "description": "Multivariable calculus and vector analysis", "credits": 3}
        ],
        "prof_johnson": [
            {"title": "Computer Science Fundamentals",
                "description": "Introduction to programming and algorithms", "credits": 4},
            {"title": "Data Structures",
                "description": "Advanced data structures and algorithms", "credits": 3}
        ],
        "prof_williams": [
            {"title": "Physics I",
                "description": "Classical mechanics and thermodynamics", "credits": 4},
            {"title": "Quantum Physics",
                "description": "Introduction to quantum mechanics", "credits": 3}
        ],
        "prof_brown": [
            {"title": "Chemistry I",
                "description": "General chemistry principles", "credits": 4},
            {"title": "Organic Chemistry",
                "description": "Organic chemistry and reactions", "credits": 3}
        ],
        "prof_davis": [
            {"title": "English Literature",
                "description": "Classic and modern literature analysis", "credits": 3},
            {"title": "Creative Writing",
                "description": "Creative writing techniques and practice", "credits": 3}
        ]
    }

    print("📚 Creating Sample Courses for Teachers")
    print("=" * 50)

    for username, courses in teacher_courses.items():
        print(f"\n👨‍🏫 Creating courses for {username}:")

        # Login as the teacher
        login_response = requests.post(
            f"{base_url}/api/auth/login",
            json={"username": username, "password": "password123"},
            headers={"Content-Type": "application/json"}
        )

        if login_response.status_code != 200:
            print(f"   ❌ Failed to login as {username}")
            continue

        token = login_response.json().get("token")
        headers = {"Authorization": f"Bearer {token}",
                   "Content-Type": "application/json"}

        # Create courses
        for course in courses:
            try:
                response = requests.post(
                    f"{base_url}/api/courses",
                    json=course,
                    headers=headers
                )

                if response.status_code == 200:
                    course_data = response.json()
                    print(
                        f"   ✅ Created: {course['title']} (ID: {course_data.get('id', 'N/A')})")
                else:
                    print(
                        f"   ❌ Failed to create course: {response.status_code}")

            except Exception as e:
                print(f"   ❌ Error creating course: {e}")


def test_upload_for_all_teachers():
    """Test document upload for all teachers"""

    base_url = "http://localhost:8000"

    teachers = [
        "prof_smith", "prof_johnson", "prof_williams", "prof_brown", "prof_davis"
    ]

    print("🧪 Testing Document Upload for All Teachers")
    print("=" * 50)

    for username in teachers:
        print(f"\n👨‍🏫 Testing upload for {username}:")

        try:
            # Login
            login_response = requests.post(
                f"{base_url}/api/auth/login",
                json={"username": username, "password": "password123"},
                headers={"Content-Type": "application/json"}
            )

            if login_response.status_code != 200:
                print(f"   ❌ Failed to login")
                continue

            token = login_response.json().get("token")
            headers = {"Authorization": f"Bearer {token}"}

            # Get teacher's courses
            courses_response = requests.get(
                f"{base_url}/api/courses/my-courses",
                headers=headers
            )

            if courses_response.status_code != 200:
                print(f"   ❌ Failed to get courses")
                continue

            courses = courses_response.json()

            if not courses:
                print(f"   ⚠️  No courses found")
                continue

            course_id = courses[0]["id"]
            print(
                f"   📚 Using course: {courses[0]['title']} (ID: {course_id})")

            # Test upload
            test_content = f"Test document for {username} - {datetime.now()}"
            files = {"file": ("test-document.txt", test_content, "text/plain")}
            data = {
                "title": f"Test Document - {username}",
                "description": f"Test document uploaded by {username}",
                "is_public": "true"
            }

            upload_response = requests.post(
                f"{base_url}/api/documents/courses/{course_id}/upload",
                files=files,
                data=data,
                headers={"Authorization": f"Bearer {token}"}
            )

            if upload_response.status_code == 200:
                result = upload_response.json()
                print(
                    f"   ✅ Upload successful! Document ID: {result.get('document', {}).get('id', 'N/A')}")
            else:
                print(f"   ❌ Upload failed: {upload_response.status_code}")
                print(f"   Response: {upload_response.text}")

        except Exception as e:
            print(f"   ❌ Error testing upload: {e}")


def main():
    """Main function"""
    try:
        print("🚀 VisionWare Teacher Account Setup")
        print("=" * 50)

        # Step 1: Create teacher accounts
        created_teachers = create_teacher_accounts()

        if created_teachers:
            # Step 2: Create sample courses
            create_sample_courses_for_teachers()

            # Step 3: Test upload functionality
            test_upload_for_all_teachers()

            print(f"\n🎉 Setup completed!")
            print(f"📋 You can now login with any of these teacher accounts:")
            for teacher in created_teachers:
                print(f"   👤 {teacher['username']} / {teacher['password']}")

            print(f"\n💡 Test the upload functionality:")
            print(f"   1. Login as any teacher")
            print(f"   2. Go to /teacher/courses")
            print(f"   3. Click 'Upload Doc' on any course")
            print(f"   4. Upload a document")

        else:
            print(f"\n❌ No teacher accounts were created")

    except Exception as e:
        print(f"\n❌ Setup failed: {e}")


if __name__ == "__main__":
    main()
