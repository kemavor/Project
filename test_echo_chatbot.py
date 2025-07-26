#!/usr/bin/env python3
"""
Test ECHO Chatbot functionality
"""

import requests
import json


def test_echo_chatbot():
    """Test ECHO chatbot endpoints"""

    base_url = "http://localhost:8000"

    print("🤖 Testing ECHO Chatbot...")

    # First, authenticate as a student
    print("\n0. Authenticating...")
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

    # Test 1: Create chat session
    print("\n1. Creating chat session...")
    session_data = {
        "course_id": 1,
        "session_name": "Test Session"
    }

    try:
        response = requests.post(
            f"{base_url}/api/chatbot/sessions", json=session_data, headers=headers)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            session = response.json()
            session_id = session['id']
            print(f"   ✅ Session created - ID: {session_id}")
        else:
            print(f"   ❌ Failed to create session: {response.text}")
            return False

    except Exception as e:
        print(f"   ❌ Error creating session: {e}")
        return False

    # Test 2: Send message to ECHO
    print("\n2. Sending message to ECHO...")
    message_data = {
        "message": "What topics are covered in this course?",
        "session_id": session_id,
        "course_id": 1,
        "include_course_content": True
    }

    try:
        response = requests.post(
            f"{base_url}/api/chatbot/chat", json=message_data, headers=headers)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ ECHO responded successfully!")
            print(
                f"   📝 Response: {result.get('response', 'No response')[:200]}...")
            print(
                f"   📊 Course content used: {result.get('course_content_used', False)}")
            print(
                f"   📁 Content files: {result.get('content_files_count', 0)}")
        else:
            print(f"   ❌ Failed to get response: {response.text}")

    except Exception as e:
        print(f"   ❌ Error sending message: {e}")

    # Test 3: Analyze course content
    print("\n3. Analyzing course content...")

    try:
        analyze_data = {"course_id": 1}
        response = requests.post(
            f"{base_url}/api/chatbot/analyze-course", json=analyze_data, headers=headers)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Course analysis successful!")
            print(
                f"   📊 Content files found: {result.get('content_files_count', 0)}")
            print(
                f"   📝 Analysis: {result.get('analysis', 'No analysis')[:200]}...")
        else:
            print(f"   ❌ Failed to analyze course: {response.text}")

    except Exception as e:
        print(f"   ❌ Error analyzing course: {e}")

    return True


if __name__ == "__main__":
    test_echo_chatbot()
