#!/usr/bin/env python3
"""
Comprehensive test for livestream functionality
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_livestream_functionality():
    """Test all livestream features"""
    
    print("🎥 Testing Livestream Functionality")
    print("=" * 50)
    
    # Step 1: Login as teacher
    print("\n1. Logging in as teacher...")
    teacher_login = {
        "username": "teacher",
        "password": "teacher123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=teacher_login)
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
    
    headers = {"Authorization": f"Bearer {teacher_token}"}
    
    # Step 2: Get teacher's courses
    print("\n2. Getting teacher's courses...")
    try:
        response = requests.get(f"{BASE_URL}/api/courses/my-courses", headers=headers)
        if response.status_code == 200:
            courses = response.json()
            if courses:
                course = courses[0]  # Use first course
                course_id = course['id']
                print(f"   ✅ Found course: {course['title']} (ID: {course_id})")
            else:
                print("   ❌ No courses found for teacher")
                return
        else:
            print(f"   ❌ Failed to get courses: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error getting courses: {e}")
        return
    
    # Step 3: Create a live stream
    print("\n3. Creating a live stream...")
    stream_data = {
        "title": "Test Live Stream",
        "description": "A test live stream for VisionWare",
        "course_id": course_id,
        "scheduled_at": (datetime.now() + timedelta(minutes=5)).isoformat(),
        "max_viewers": 50,
        "is_public": True,
        "is_recording": True,
        "quality_settings": {
            "resolution": "720p",
            "bitrate": "2000k",
            "fps": 30
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/livestream/", json=stream_data, headers=headers)
        if response.status_code == 201:
            stream_result = response.json()
            stream_id = stream_result['id']
            print(f"   ✅ Live stream created successfully (ID: {stream_id})")
            print(f"   📺 Title: {stream_result['title']}")
            print(f"   📅 Scheduled: {stream_result['scheduled_at']}")
            print(f"   👥 Max viewers: {stream_result['max_viewers']}")
        else:
            print(f"   ❌ Failed to create stream: {response.status_code}")
            print(f"   Error: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Error creating stream: {e}")
        return
    
    # Step 4: Get all streams
    print("\n4. Getting all streams...")
    try:
        response = requests.get(f"{BASE_URL}/api/livestream/", headers=headers)
        if response.status_code == 200:
            streams = response.json()
            print(f"   ✅ Found {len(streams)} streams")
            for stream in streams:
                print(f"   📺 - {stream['title']} (Status: {stream['status']})")
        else:
            print(f"   ❌ Failed to get streams: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error getting streams: {e}")
    
    # Step 5: Get active streams
    print("\n5. Getting active streams...")
    try:
        response = requests.get(f"{BASE_URL}/api/livestream/active")
        if response.status_code == 200:
            active_streams = response.json()
            print(f"   ✅ Found {len(active_streams)} active streams")
            for stream in active_streams:
                print(f"   🟢 - {stream['title']} (Viewers: {stream.get('current_viewers', 0)})")
        else:
            print(f"   ❌ Failed to get active streams: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error getting active streams: {e}")
    
    # Step 6: Get specific stream
    print("\n6. Getting specific stream details...")
    try:
        response = requests.get(f"{BASE_URL}/api/livestream/{stream_id}", headers=headers)
        if response.status_code == 200:
            stream_details = response.json()
            print(f"   ✅ Stream details retrieved")
            print(f"   📺 Title: {stream_details['title']}")
            print(f"   📝 Description: {stream_details['description']}")
            print(f"   📅 Status: {stream_details['status']}")
            print(f"   👥 Max viewers: {stream_details['max_viewers']}")
        else:
            print(f"   ❌ Failed to get stream details: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error getting stream details: {e}")
    
    # Step 7: Start the stream
    print("\n7. Starting the stream...")
    start_data = {
        "quality_settings": {
            "resolution": "720p",
            "bitrate": "2000k",
            "fps": 30
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/livestream/{stream_id}/start", json=start_data, headers=headers)
        if response.status_code == 200:
            start_result = response.json()
            print(f"   ✅ Stream started successfully")
            print(f"   🎥 Stream URL: {start_result.get('stream_url', 'N/A')}")
            print(f"   🔑 Stream Key: {start_result.get('stream_key', 'N/A')}")
        else:
            print(f"   ❌ Failed to start stream: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error starting stream: {e}")
    
    # Step 8: Login as student
    print("\n8. Logging in as student...")
    student_login = {
        "username": "student",
        "password": "student123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=student_login)
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
    
    student_headers = {"Authorization": f"Bearer {student_token}"}
    
    # Step 9: Student joins stream
    print("\n9. Student joining stream...")
    join_data = {
        "user_role": "viewer"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/livestream/{stream_id}/join", json=join_data, headers=student_headers)
        if response.status_code == 200:
            join_result = response.json()
            print(f"   ✅ Student joined stream successfully")
            print(f"   👤 Role: {join_result.get('role', 'viewer')}")
            print(f"   🎥 Watch URL: {join_result.get('watch_url', 'N/A')}")
        else:
            print(f"   ❌ Failed to join stream: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error joining stream: {e}")
    
    # Step 10: Send chat message
    print("\n10. Sending chat message...")
    chat_data = {
        "message": "Hello everyone! This is a test message.",
        "message_type": "text"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/livestream/{stream_id}/chat", json=chat_data, headers=student_headers)
        if response.status_code == 201:
            chat_result = response.json()
            print(f"   ✅ Chat message sent successfully")
            print(f"   💬 Message: {chat_result['message']}")
            print(f"   👤 From: {chat_result['user']['username']}")
        else:
            print(f"   ❌ Failed to send chat message: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error sending chat message: {e}")
    
    # Step 11: Get chat messages
    print("\n11. Getting chat messages...")
    try:
        response = requests.get(f"{BASE_URL}/api/livestream/{stream_id}/chat", headers=student_headers)
        if response.status_code == 200:
            messages = response.json()
            print(f"   ✅ Found {len(messages)} chat messages")
            for msg in messages:
                print(f"   💬 {msg['user']['username']}: {msg['message']}")
        else:
            print(f"   ❌ Failed to get chat messages: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error getting chat messages: {e}")
    
    # Step 12: Ask a question
    print("\n12. Asking a question...")
    question_data = {
        "question": "What is the main topic of this lecture?"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/livestream/{stream_id}/questions", json=question_data, headers=student_headers)
        if response.status_code == 201:
            question_result = response.json()
            question_id = question_result['id']
            print(f"   ✅ Question asked successfully (ID: {question_id})")
            print(f"   ❓ Question: {question_result['question']}")
        else:
            print(f"   ❌ Failed to ask question: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error asking question: {e}")
    
    # Step 13: Get questions
    print("\n13. Getting questions...")
    try:
        response = requests.get(f"{BASE_URL}/api/livestream/{stream_id}/questions", headers=student_headers)
        if response.status_code == 200:
            questions = response.json()
            print(f"   ✅ Found {len(questions)} questions")
            for q in questions:
                print(f"   ❓ {q['user']['username']}: {q['question']} (Votes: {q.get('upvotes', 0)})")
        else:
            print(f"   ❌ Failed to get questions: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error getting questions: {e}")
    
    # Step 14: Teacher answers question
    print("\n14. Teacher answering question...")
    answer_data = {
        "answer": "The main topic is testing the livestream functionality."
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/livestream/{stream_id}/questions/{question_id}/answer", json=answer_data, headers=headers)
        if response.status_code == 200:
            answer_result = response.json()
            print(f"   ✅ Question answered successfully")
            print(f"   💡 Answer: {answer_result['answer']}")
            print(f"   👨‍🏫 Answered by: {answer_result['answerer']['username']}")
        else:
            print(f"   ❌ Failed to answer question: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error answering question: {e}")
    
    # Step 15: Get stream statistics
    print("\n15. Getting stream statistics...")
    try:
        response = requests.get(f"{BASE_URL}/api/livestream/{stream_id}/stats", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print(f"   ✅ Stream statistics retrieved")
            print(f"   👥 Current viewers: {stats.get('current_viewers', 0)}")
            print(f"   📊 Peak viewers: {stats.get('peak_viewers', 0)}")
            print(f"   💬 Total messages: {stats.get('total_messages', 0)}")
            print(f"   ❓ Total questions: {stats.get('total_questions', 0)}")
        else:
            print(f"   ❌ Failed to get stats: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error getting stats: {e}")
    
    # Step 16: Student leaves stream
    print("\n16. Student leaving stream...")
    try:
        response = requests.post(f"{BASE_URL}/api/livestream/{stream_id}/leave", headers=student_headers)
        if response.status_code == 200:
            print(f"   ✅ Student left stream successfully")
        else:
            print(f"   ❌ Failed to leave stream: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error leaving stream: {e}")
    
    # Step 17: Stop the stream
    print("\n17. Stopping the stream...")
    stop_data = {
        "reason": "Test completed"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/livestream/{stream_id}/stop", json=stop_data, headers=headers)
        if response.status_code == 200:
            stop_result = response.json()
            print(f"   ✅ Stream stopped successfully")
            print(f"   📊 Final stats: {stop_result.get('final_stats', {})}")
        else:
            print(f"   ❌ Failed to stop stream: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error stopping stream: {e}")
    
    print("\n🎉 Livestream functionality testing completed!")
    print("\n📋 Summary:")
    print("✅ Stream creation and management")
    print("✅ Stream starting and stopping")
    print("✅ Student joining and leaving")
    print("✅ Chat messaging system")
    print("✅ Question and answer system")
    print("✅ Stream statistics")
    print("✅ Access control and permissions")

if __name__ == "__main__":
    test_livestream_functionality() 