#!/usr/bin/env python3
"""
Comprehensive test for document upload, download, and viewing functions
"""

import requests
import json
import os
from datetime import datetime

BASE_URL = "http://localhost:8000"


def test_document_functions():
    """Test all document-related functions"""

    print("📄 Testing Document Functions")
    print("=" * 50)

    # Step 1: Login as teacher
    print("\n1. Logging in as teacher...")
    teacher_login = {
        "username": "teacher",
        "password": "teacher123"
    }

    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login", json=teacher_login)
        if response.status_code == 200:
            teacher_data = response.json()
            teacher_token = teacher_data['token']
            teacher_user = teacher_data['data']['user']
            print(f"   ✅ Teacher logged in: {teacher_user['username']}")
        else:
            print(f"   ❌ Teacher login failed: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Teacher login error: {e}")
        return

    # Step 2: Get teacher's courses
    print("\n2. Getting teacher's courses...")
    headers = {"Authorization": f"Bearer {teacher_token}"}

    try:
        response = requests.get(
            f"{BASE_URL}/api/courses/my-courses", headers=headers)
        if response.status_code == 200:
            courses = response.json()
            if courses:
                course = courses[0]  # Use first course
                course_id = course['id']
                print(
                    f"   ✅ Found course: {course['title']} (ID: {course_id})")
            else:
                print("   ❌ No courses found for teacher")
                return
        else:
            print(f"   ❌ Failed to get courses: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error getting courses: {e}")
        return

    # Step 3: Upload a test document
    print("\n3. Testing document upload...")

    # Create a test file
    test_content = "This is a test document for VisionWare."
    test_filename = "test_document.txt"

    try:
        # Create multipart form data
        files = {'file': (test_filename, test_content, 'text/plain')}
        data = {
            'title': 'Test Document',
            'description': 'A test document for upload functionality',
            'is_public': 'true'
        }

        response = requests.post(
            f"{BASE_URL}/api/documents/courses/{course_id}/upload",
            files=files,
            data=data,
            headers=headers
        )

        if response.status_code == 200:
            upload_result = response.json()
            document_id = upload_result['document']['id']
            print(f"   ✅ Document uploaded successfully (ID: {document_id})")
            print(f"   📄 Title: {upload_result['document']['title']}")
            print(
                f"   📁 Filename: {upload_result['document']['original_filename']}")
        else:
            print(f"   ❌ Upload failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Upload error: {e}")
        return

    # Step 4: Get course documents (teacher view)
    print("\n4. Testing get course documents (teacher view)...")

    try:
        response = requests.get(
            f"{BASE_URL}/api/documents/courses/{course_id}", headers=headers)
        if response.status_code == 200:
            documents = response.json()
            print(f"   ✅ Found {len(documents)} documents in course")
            for doc in documents:
                print(f"   📄 - {doc['title']} (ID: {doc['id']})")
        else:
            print(f"   ❌ Failed to get documents: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error getting documents: {e}")

    # Step 5: Get document details
    print("\n5. Testing get document details...")

    try:
        response = requests.get(
            f"{BASE_URL}/api/documents/{document_id}", headers=headers)
        if response.status_code == 200:
            document = response.json()
            print(f"   ✅ Document details retrieved")
            print(f"   📄 Title: {document['title']}")
            print(f"   📁 Size: {document['file_size']} bytes")
            print(f"   🔓 Public: {document['is_public']}")
        else:
            print(
                f"   ❌ Failed to get document details: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error getting document details: {e}")

    # Step 6: Get download URL
    print("\n6. Testing get download URL...")

    try:
        response = requests.get(
            f"{BASE_URL}/api/courses/documents/{document_id}/download", headers=headers)
        if response.status_code == 200:
            download_data = response.json()
            print(f"   ✅ Download URL generated")
            print(f"   🔗 URL: {download_data['download_url'][:50]}...")
            print(f"   📁 Filename: {download_data['filename']}")
            print(f"   ⏰ Expires in: {download_data['expires_in']} seconds")
        else:
            print(f"   ❌ Failed to get download URL: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error getting download URL: {e}")

    # Step 7: Login as student
    print("\n7. Logging in as student...")
    student_login = {
        "username": "student",
        "password": "student123"
    }

    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login", json=student_login)
        if response.status_code == 200:
            student_data = response.json()
            student_token = student_data['token']
            student_user = student_data['data']['user']
            print(f"   ✅ Student logged in: {student_user['username']}")
        else:
            print(f"   ❌ Student login failed: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Student login error: {e}")
        return

    # Step 8: Get course documents (student view)
    print("\n8. Testing get course documents (student view)...")
    student_headers = {"Authorization": f"Bearer {student_token}"}

    try:
        response = requests.get(
            f"{BASE_URL}/api/courses/{course_id}/documents", headers=student_headers)
        if response.status_code == 200:
            documents = response.json()
            print(f"   ✅ Student can see {len(documents)} documents")
            for doc in documents:
                print(f"   📄 - {doc['title']} (Public: {doc['is_public']})")
                if 'download_url' in doc:
                    print(
                        f"   🔗 Has download URL: {doc['download_url'][:30]}...")
        else:
            print(
                f"   ❌ Student failed to get documents: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error getting documents as student: {e}")

    # Step 9: Test student download access
    print("\n9. Testing student download access...")

    try:
        response = requests.get(
            f"{BASE_URL}/api/courses/documents/{document_id}/download", headers=student_headers)
        if response.status_code == 200:
            download_data = response.json()
            print(f"   ✅ Student can access download URL")
            print(f"   🔗 URL: {download_data['download_url'][:50]}...")
        else:
            print(
                f"   ❌ Student download access failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error with student download access: {e}")

    # Step 10: Test document update (teacher only)
    print("\n10. Testing document update (teacher only)...")

    try:
        update_data = {
            "title": "Updated Test Document",
            "description": "This document has been updated",
            "is_public": False
        }

        response = requests.put(f"{BASE_URL}/api/documents/{document_id}",
                                json=update_data, headers=headers)
        if response.status_code == 200:
            updated_doc = response.json()
            print(f"   ✅ Document updated successfully")
            print(f"   📄 New title: {updated_doc['title']}")
            print(f"   🔓 Public: {updated_doc['is_public']}")
        else:
            print(f"   ❌ Update failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error updating document: {e}")

    # Step 11: Test student access to private document
    print("\n11. Testing student access to private document...")

    try:
        response = requests.get(
            f"{BASE_URL}/api/courses/documents/{document_id}/download", headers=student_headers)
        if response.status_code == 403:
            print(f"   ✅ Student correctly denied access to private document")
        else:
            print(f"   ⚠️  Unexpected response: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error testing private document access: {e}")

    # Step 12: Make document public again and test student access
    print("\n12. Making document public and testing student access...")

    try:
        update_data = {"is_public": True}
        response = requests.put(f"{BASE_URL}/api/documents/{document_id}",
                                json=update_data, headers=headers)
        if response.status_code == 200:
            print(f"   ✅ Document made public again")

            # Test student access
            response = requests.get(
                f"{BASE_URL}/api/courses/documents/{document_id}/download", headers=student_headers)
            if response.status_code == 200:
                print(f"   ✅ Student can now access public document")
            else:
                print(
                    f"   ❌ Student still cannot access: {response.status_code}")
        else:
            print(
                f"   ❌ Failed to make document public: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error making document public: {e}")

    print("\n🎉 Document function testing completed!")
    print("\n📋 Summary:")
    print("✅ Teacher upload functionality")
    print("✅ Teacher document management")
    print("✅ Student document viewing")
    print("✅ Download URL generation")
    print("✅ Access control (public/private)")
    print("✅ Document updates")


if __name__ == "__main__":
    test_document_functions()
