#!/usr/bin/env python3
"""
Simple test for my-applications endpoint
"""

import requests


def test_my_applications():
    """Test the my-applications endpoint"""

    base_url = "http://localhost:8000"

    print("🔍 Testing my-applications endpoint...")

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

    # Step 2: Test my-applications endpoint
    print("\n2. Testing my-applications endpoint...")
    try:
        response = requests.get(
            f"{base_url}/api/courses/my-applications", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")

        if response.status_code == 200:
            applications = response.json()
            print(f"   ✅ Success! Found {len(applications)} applications")
            for app in applications:
                print(
                    f"     - Course {app.get('course_id')}: {app.get('status')}")
        else:
            print(f"   ❌ Failed: {response.text}")

    except Exception as e:
        print(f"   ❌ Error: {e}")

    return True


if __name__ == "__main__":
    test_my_applications()
