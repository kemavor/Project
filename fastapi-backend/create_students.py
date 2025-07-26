#!/usr/bin/env python3
"""
Create Student Accounts for Testing
"""

import requests
import json


def create_student_accounts():
    """Create student accounts for testing"""

    base_url = "http://localhost:8000"

    print("🚀 Creating Student Accounts")
    print("=" * 40)

    students = [
        {
            "username": "student_john",
            "email": "john.student@university.edu",
            "password": "password123",
            "first_name": "John",
            "last_name": "Student",
            "role": "student"
        },
        {
            "username": "student_sarah",
            "email": "sarah.student@university.edu",
            "password": "password123",
            "first_name": "Sarah",
            "last_name": "Student",
            "role": "student"
        },
        {
            "username": "student_mike",
            "email": "mike.student@university.edu",
            "password": "password123",
            "first_name": "Mike",
            "last_name": "Student",
            "role": "student"
        }
    ]

    created_students = []

    for student in students:
        try:
            print(f"Creating student: {student['username']}...")

            register_response = requests.post(
                f"{base_url}/api/auth/register",
                json=student,
                headers={"Content-Type": "application/json"}
            )

            if register_response.status_code == 200:
                print(f"   ✅ Created successfully")
                created_students.append(student)
            elif register_response.status_code == 400:
                error_data = register_response.json()
                if "already exists" in error_data.get("message", "").lower():
                    print(f"   ⚠️  Already exists")
                    created_students.append(student)
                else:
                    print(f"   ❌ Failed: {error_data.get('message')}")
            else:
                print(f"   ❌ Failed: {register_response.status_code}")

        except Exception as e:
            print(f"   ❌ Error: {e}")

    return created_students


def test_student_login():
    """Test student login"""

    base_url = "http://localhost:8000"

    print(f"\n🧪 Testing Student Login")
    print("=" * 30)

    try:
        login_response = requests.post(
            f"{base_url}/api/auth/login",
            json={"username": "student_john", "password": "password123"},
            headers={"Content-Type": "application/json"}
        )

        if login_response.status_code == 200:
            print(f"✅ Student login successful")
            return True
        else:
            print(f"❌ Student login failed: {login_response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Login test failed: {e}")
        return False


def main():
    """Main function"""
    print("🚀 Student Account Setup")
    print("=" * 40)

    # Create student accounts
    created_students = create_student_accounts()

    # Test login
    login_success = test_student_login()

    if created_students and login_success:
        print(f"\n🎉 Student setup completed!")
        print(f"📋 You can now login with any of these student accounts:")
        for student in created_students:
            print(f"   👤 {student['username']} / {student['password']}")

        print(f"\n💡 Test the application functionality:")
        print(f"   1. Login as a student")
        print(f"   2. Go to /courses")
        print(f"   3. Click 'Apply Now' on any course")
        print(f"   4. Fill out the application form")
    else:
        print(f"\n❌ Student setup failed")


if __name__ == "__main__":
    main()
