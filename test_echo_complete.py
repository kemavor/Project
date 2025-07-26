#!/usr/bin/env python3
"""
Complete ECHO Experience Test
Tests the full ECHO chatbot functionality with proper authentication
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000/api"


def test_echo_complete():
    print("🤖 Testing Complete ECHO Experience")
    print("=" * 50)

    # Test data
    student_credentials = {
        "username": "student1",
        "password": "password123",
        "role": "student"
    }

    # 1. Login as student
    print("1. Logging in as student...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login", json=student_credentials)

    if login_response.status_code != 200:
        print(f"   ❌ Login failed: {login_response.status_code}")
        print(f"   Response: {login_response.text}")
        return False

    login_data = login_response.json()
    token = login_data.get('token')
    user_id = login_data.get('data', {}).get('user', {}).get('id')

    if not token or not user_id:
        print("   ❌ Login response missing token or user_id")
        return False

    print(f"   ✅ Login successful - User ID: {user_id}")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a new chat session
    print("\n2. Creating new chat session...")
    session_data = {
        "session_name": "Test ECHO Session",
        "course_id": None  # No specific course for general chat
    }

    session_response = requests.post(
        f"{BASE_URL}/chatbot/sessions",
        json=session_data,
        headers=headers
    )

    if session_response.status_code != 200:
        print(f"   ❌ Session creation failed: {session_response.status_code}")
        print(f"   Response: {session_response.text}")
        return False

    session_data = session_response.json()
    session_id = session_data.get('id')
    print(f"   ✅ Chat session created - Session ID: {session_id}")

    # 3. Send a message to ECHO
    print("\n3. Sending message to ECHO...")
    chat_data = {
        "message": "Hello ECHO! Can you tell me about your capabilities as an Educational Context Handler Oracle?",
        "session_id": session_id,
        "course_id": None,
        "include_course_content": False
    }

    chat_response = requests.post(
        f"{BASE_URL}/chatbot/chat",
        json=chat_data,
        headers=headers
    )

    if chat_response.status_code != 200:
        print(f"   ❌ Chat failed: {chat_response.status_code}")
        print(f"   Response: {chat_response.text}")
        return False

    chat_result = chat_response.json()
    print(f"   ✅ ECHO responded successfully!")
    print(f"   📝 Response preview: {chat_result.get('response', '')[:100]}...")

    # 4. Get chat messages
    print("\n4. Retrieving chat messages...")
    messages_response = requests.get(
        f"{BASE_URL}/chatbot/sessions/{session_id}/messages",
        headers=headers
    )

    if messages_response.status_code != 200:
        print(f"   ❌ Failed to get messages: {messages_response.status_code}")
        return False

    messages = messages_response.json()
    print(f"   ✅ Retrieved {len(messages)} messages")

    # 5. Get all chat sessions
    print("\n5. Getting all chat sessions...")
    sessions_response = requests.get(
        f"{BASE_URL}/chatbot/sessions",
        headers=headers
    )

    if sessions_response.status_code != 200:
        print(f"   ❌ Failed to get sessions: {sessions_response.status_code}")
        return False

    sessions = sessions_response.json()
    print(f"   ✅ Retrieved {len(sessions)} chat sessions")

    # 6. Send another message to test conversation flow
    print("\n6. Testing conversation flow...")
    follow_up_data = {
        "message": "Thank you! How can you help me with my studies?",
        "session_id": session_id,
        "course_id": None,
        "include_course_content": False
    }

    follow_up_response = requests.post(
        f"{BASE_URL}/chatbot/chat",
        json=follow_up_data,
        headers=headers
    )

    if follow_up_response.status_code != 200:
        print(f"   ❌ Follow-up chat failed: {follow_up_response.status_code}")
        return False

    print(f"   ✅ ECHO responded to follow-up question!")

    # 7. Test session deletion
    print("\n7. Testing session deletion...")
    delete_response = requests.delete(
        f"{BASE_URL}/chatbot/sessions/{session_id}",
        headers=headers
    )

    if delete_response.status_code != 200:
        print(f"   ❌ Session deletion failed: {delete_response.status_code}")
        return False

    print(f"   ✅ Chat session deleted successfully!")

    print("\n🎉 Complete ECHO Experience Test Passed!")
    print("=" * 50)
    print("✅ All ECHO functionality is working correctly:")
    print("   - Authentication and authorization")
    print("   - Chat session creation and management")
    print("   - AI conversation with ECHO")
    print("   - Message history retrieval")
    print("   - Session cleanup")
    print("\n🚀 ECHO is ready for students to use!")

    return True


if __name__ == "__main__":
    try:
        success = test_echo_complete()
        if not success:
            print("\n❌ ECHO test failed. Please check the backend logs.")
            exit(1)
    except Exception as e:
        print(f"\n❌ Test error: {str(e)}")
        exit(1)
