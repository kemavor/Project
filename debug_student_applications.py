#!/usr/bin/env python3
"""
Debug Student Applications 422 Error
"""

import requests
import json


def debug_student_applications():
    """Debug the student applications endpoint"""

    base_url = "http://localhost:8000"

    print("🔍 Debugging Student Applications...")

    # Step 1: Authenticate as student
    print("\n1. Authenticating as student...")
    auth_data = {
        "username": "student1",
        "password": "password123"
    }

    try:
        response = requests.post(f"{base_url}/api/auth/login", json=auth_data)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            auth_result = response.json()
            token = auth_result.get('token') or auth_result.get(
                'data', {}).get('token')
            if token:
                headers = {"Authorization": f"Bearer {token}"}
                print(f"   ✅ Authentication successful")
            else:
                print(f"   ❌ No token in response: {auth_result}")
                return False
        else:
            print(f"   ❌ Authentication failed: {response.text}")
            return False

    except Exception as e:
        print(f"   ❌ Error authenticating: {e}")
        return False

    # Step 2: Get available courses
    print("\n2. Getting available courses...")
    try:
        response = requests.get(f"{base_url}/api/courses", headers=headers)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            courses = response.json()
            if isinstance(courses, list) and len(courses) > 0:
                course_id = courses[0]['id']
                print(
                    f"   ✅ Found {len(courses)} courses, using course ID: {course_id}")
            else:
                print(f"   ❌ No courses available: {courses}")
                return False
        else:
            print(f"   ❌ Failed to get courses: {response.text}")
            return False

    except Exception as e:
        print(f"   ❌ Error getting courses: {e}")
        return False

    # Step 3: Check if student already applied
    print("\n3. Checking existing applications...")
    try:
        response = requests.get(
            f"{base_url}/api/applications/my", headers=headers)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            applications = response.json()
            print(f"   📋 Current applications: {applications}")

            # Check if already applied to this course
            for app in applications:
                if app.get('course_id') == course_id:
                    print(f"   ⚠️ Already applied to course {course_id}")
                    # Try a different course
                    if len(courses) > 1:
                        course_id = courses[1]['id']
                        print(f"   🔄 Switching to course ID: {course_id}")
                    else:
                        print(f"   ❌ No other courses available")
                        return False
        else:
            print(f"   ⚠️ Could not check applications: {response.text}")

    except Exception as e:
        print(f"   ⚠️ Error checking applications: {e}")

    # Step 4: Submit application with detailed error checking
    print(f"\n4. Submitting application to course {course_id}...")
    application_data = {
        "student_year": 2,
        "gpa": 3.5,
        "motivation_statement": "I am interested in learning this subject and believe I would be a great addition to this course."
    }

    print(f"   📝 Application data: {json.dumps(application_data, indent=2)}")

    try:
        response = requests.post(
            f"{base_url}/api/courses/{course_id}/apply", json=application_data, headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")

        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Application submitted successfully!")
            print(f"   📋 Application ID: {result.get('id')}")
        elif response.status_code == 422:
            print(f"   ❌ Validation error (422):")
            try:
                error_details = response.json()
                print(
                    f"   📋 Error details: {json.dumps(error_details, indent=2)}")
            except:
                print(f"   📋 Raw error: {response.text}")
        else:
            print(f"   ❌ Unexpected error: {response.text}")

    except Exception as e:
        print(f"   ❌ Error submitting application: {e}")

    # Step 5: Check the applications endpoint structure
    print("\n5. Checking applications endpoint structure...")
    try:
        response = requests.get(
            f"{base_url}/api/applications", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500]}...")

    except Exception as e:
        print(f"   ❌ Error checking applications endpoint: {e}")

    return True


if __name__ == "__main__":
    debug_student_applications()
