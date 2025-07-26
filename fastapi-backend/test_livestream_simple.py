#!/usr/bin/env python3
"""
Simple test for livestream functionality
"""

import requests
import json

BASE_URL = "http://localhost:8000"


def test_livestream_basic():
    """Test basic livestream functionality"""

    print("🎥 Testing Basic Livestream Functionality")
    print("=" * 40)

    # Test 1: Check if server is running
    print("\n1. Checking server connectivity...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("   ✅ Server is running")
        else:
            print(f"   ❌ Server error: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Cannot connect to server: {e}")
        return

    # Test 2: Test livestream endpoints without auth
    print("\n2. Testing livestream endpoints...")

    # Test active streams endpoint (should work without auth)
    try:
        response = requests.get(f"{BASE_URL}/api/livestream/active")
        print(f"   Active streams endpoint: {response.status_code}")
        if response.status_code == 200:
            streams = response.json()
            print(f"   Found {len(streams)} active streams")
        else:
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")

    # Test 3: Test authentication
    print("\n3. Testing authentication...")
    try:
        login_data = {
            "username": "teacher",
            "password": "teacher123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            token = data['token']
            print("   ✅ Teacher login successful")

            # Test authenticated livestream endpoint
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(
                f"{BASE_URL}/api/livestream/", headers=headers)
            print(f"   Livestream list endpoint: {response.status_code}")
            if response.status_code == 200:
                streams = response.json()
                print(f"   Found {len(streams)} streams")
            else:
                print(f"   Response: {response.text}")
        else:
            print(f"   ❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Authentication error: {e}")


if __name__ == "__main__":
    test_livestream_basic()
