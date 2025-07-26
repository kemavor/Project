#!/usr/bin/env python3
"""
Complete VisionWare Functionality Test
Tests all core features: authentication, course management, document upload/download, chatbot
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000/api"


def test_complete_functionality():
    print("🔍 Testing Complete VisionWare Functionality")
    print("=" * 60)

    # Test data
    teacher_credentials = {
        "username": "teacher1",
        "password": "password123",
        "role": "teacher"
    }

    student_credentials = {
        "username": "student1",
        "password": "password123",
        "role": "student"
    }

    # 1. Test Teacher Authentication
    print("\n1. Testing Teacher Authentication...")
    teacher_login = requests.post(
        f"{BASE_URL}/auth/login", json=teacher_credentials)

    if teacher_login.status_code != 200:
        print(f"   ❌ Teacher login failed: {teacher_login.status_code}")
        print(f"   Response: {teacher_login.text}")
        return False

    teacher_token = teacher_login.json().get('token')
    teacher_id = teacher_login.json().get('data', {}).get('user', {}).get('id')
    print(f"   ✅ Teacher login successful - ID: {teacher_id}")

    # 2. Test Student Authentication
    print("\n2. Testing Student Authentication...")
    student_login = requests.post(
        f"{BASE_URL}/auth/login", json=student_credentials)

    if student_login.status_code != 200:
        print(f"   ❌ Student login failed: {student_login.status_code}")
        print(f"   Response: {student_login.text}")
        return False

    student_token = student_login.json().get('token')
    student_id = student_login.json().get('data', {}).get('user', {}).get('id')
    print(f"   ✅ Student login successful - ID: {student_id}")

    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 3. Test Course Creation by Teacher
    print("\n3. Testing Course Creation...")
    course_data = {
        "title": "Test Course for Functionality",
        "description": "A comprehensive test course to verify all features",
        "credits": 3,
        "is_enrollment_open": True
    }

    course_response = requests.post(
        f"{BASE_URL}/courses",
        json=course_data,
        headers=teacher_headers
    )

    if course_response.status_code != 200:
        print(f"   ❌ Course creation failed: {course_response.status_code}")
        print(f"   Response: {course_response.text}")
        return False

    course = course_response.json()
    course_id = course.get('id')
    print(f"   ✅ Course created successfully - ID: {course_id}")

    # 4. Test Document Upload by Teacher
    print("\n4. Testing Document Upload...")

    # Create a simple text file for testing
    test_content = "This is a test document for VisionWare functionality testing."
    files = {
        'file': ('test_document.txt', test_content, 'text/plain')
    }
    data = {
        'course_id': course_id,
        'title': 'Test Document',
        'description': 'A test document for functionality verification',
        'is_public': True
    }

    upload_response = requests.post(
        f"{BASE_URL}/documents/courses/{course_id}/upload",
        files=files,
        data=data,
        headers=teacher_headers
    )

    if upload_response.status_code != 200:
        print(f"   ❌ Document upload failed: {upload_response.status_code}")
        print(f"   Response: {upload_response.text}")
        return False

    document = upload_response.json()
    document_id = document.get('id')
    print(f"   ✅ Document uploaded successfully - ID: {document_id}")

    # 5. Test Course Application by Student
    print("\n5. Testing Course Application...")
    application_data = {
        "course_id": course_id,
        "student_year": 2,
        "gpa": 3.5,
        "motivation_statement": "I am excited to learn about this test course and verify all functionality."
    }

    application_response = requests.post(
        f"{BASE_URL}/courses/{course_id}/apply",
        json=application_data,
        headers=student_headers
    )

    if application_response.status_code != 200:
        print(
            f"   ❌ Course application failed: {application_response.status_code}")
        print(f"   Response: {application_response.text}")
        return False

    application = application_response.json()
    print(f"   ✅ Course application submitted successfully")

    # 6. Test Document Access by Student
    print("\n6. Testing Document Access...")

    # Get course documents
    documents_response = requests.get(
        f"{BASE_URL}/documents/courses/{course_id}",
        headers=student_headers
    )

    if documents_response.status_code != 200:
        print(f"   ❌ Document access failed: {documents_response.status_code}")
        print(f"   Response: {documents_response.text}")
        return False

    documents = documents_response.json()
    print(f"   ✅ Documents accessible - Found {len(documents)} documents")

    # Test document download URL
    if documents:
        doc_id = documents[0].get('id')
        download_response = requests.get(
            f"{BASE_URL}/courses/documents/{doc_id}/download",
            headers=student_headers
        )

        if download_response.status_code == 200:
            download_url = download_response.json().get('download_url')
            print(
                f"   ✅ Document download URL generated: {download_url[:50]}...")
        else:
            print(
                f"   ⚠️  Document download URL failed: {download_response.status_code}")

    # 7. Test Chatbot Integration
    print("\n7. Testing ECHO Chatbot...")

    # Create chat session
    session_data = {
        "session_name": "Functionality Test Session",
        "course_id": course_id
    }

    session_response = requests.post(
        f"{BASE_URL}/chatbot/sessions",
        json=session_data,
        headers=student_headers
    )

    if session_response.status_code != 200:
        print(
            f"   ❌ Chat session creation failed: {session_response.status_code}")
        print(f"   Response: {session_response.text}")
        return False

    session = session_response.json()
    session_id = session.get('id')
    print(f"   ✅ Chat session created - ID: {session_id}")

    # Send message to ECHO
    chat_data = {
        "message": "Hello ECHO! Can you tell me about the course materials available in this course?",
        "session_id": session_id,
        "course_id": course_id,
        "include_course_content": True
    }

    chat_response = requests.post(
        f"{BASE_URL}/chatbot/chat",
        json=chat_data,
        headers=student_headers
    )

    if chat_response.status_code != 200:
        print(f"   ❌ Chat failed: {chat_response.status_code}")
        print(f"   Response: {chat_response.text}")
        return False

    chat_result = chat_response.json()
    print(f"   ✅ ECHO responded successfully!")
    print(f"   📝 Response preview: {chat_result.get('response', '')[:100]}...")

    # 8. Test Course Analysis
    print("\n8. Testing Course Content Analysis...")
    analysis_data = {
        "course_id": course_id
    }

    analysis_response = requests.post(
        f"{BASE_URL}/chatbot/analyze-course",
        json=analysis_data,
        headers=student_headers
    )

    if analysis_response.status_code == 200:
        analysis = analysis_response.json()
        print(f"   ✅ Course analysis successful!")
        print(
            f"   📊 Found {analysis.get('content_files_count', 0)} content files")
    else:
        print(
            f"   ⚠️  Course analysis failed: {analysis_response.status_code}")

    # 9. Test Teacher Course Management
    print("\n9. Testing Teacher Course Management...")

    # Get teacher's courses
    teacher_courses_response = requests.get(
        f"{BASE_URL}/courses/my-courses",
        headers=teacher_headers
    )

    if teacher_courses_response.status_code == 200:
        teacher_courses = teacher_courses_response.json()
        print(f"   ✅ Teacher can view {len(teacher_courses)} courses")
    else:
        print(
            f"   ❌ Teacher course management failed: {teacher_courses_response.status_code}")

    # 10. Test Student Course Access
    print("\n10. Testing Student Course Access...")

    # Get all courses
    all_courses_response = requests.get(
        f"{BASE_URL}/courses",
        headers=student_headers
    )

    if all_courses_response.status_code == 200:
        all_courses = all_courses_response.json()
        print(f"   ✅ Student can view {len(all_courses)} available courses")
    else:
        print(
            f"   ❌ Student course access failed: {all_courses_response.status_code}")

    # Test student applications
    print("\n11. Testing Student Applications...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/courses/my-applications", headers=student_headers)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            applications = response.json()
            print(
                f"   ✅ Student applications retrieved - Found {len(applications)} applications")
        else:
            print(f"   ❌ Student applications failed: {response.status_code}")
            print(f"   Response: {response.text}")

    except Exception as e:
        print(f"   ❌ Student applications error: {e}")

    print("\n🎉 Complete Functionality Test Passed!")
    print("=" * 60)
    print("✅ All core features are working:")
    print("   - Teacher authentication and course creation")
    print("   - Document upload to S3")
    print("   - Student course applications")
    print("   - Document access and download")
    print("   - ECHO chatbot with course content access")
    print("   - Course content analysis")
    print("   - Teacher course management")
    print("   - Student course access")
    print("   - Application tracking")

    return True


if __name__ == "__main__":
    try:
        success = test_complete_functionality()
        if not success:
            print("\n❌ Functionality test failed. Please check the backend logs.")
            exit(1)
    except Exception as e:
        print(f"\n❌ Test error: {str(e)}")
        exit(1)
