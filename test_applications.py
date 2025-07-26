#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000/api"

# Login as student
login_data = {
    "username": "student1",
    "password": "password123"
}

login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
print(f"Login status: {login_response.status_code}")

if login_response.status_code == 200:
    token = login_response.json().get('token')
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test applications endpoint
    apps_response = requests.get(f"{BASE_URL}/courses/my-applications", headers=headers)
    print(f"Applications status: {apps_response.status_code}")
    print(f"Applications response: {apps_response.text}")
else:
    print(f"Login failed: {login_response.text}") 