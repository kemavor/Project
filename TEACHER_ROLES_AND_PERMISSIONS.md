# Teacher Roles and Permissions Guide

## Overview
This document outlines the roles, permissions, and API access patterns for teachers in the VisionWare educational platform.

## User Roles

### Role Types
- **STUDENT**: Can enroll in courses, access course content, participate in live streams
- **TEACHER**: Can create/manage courses, upload documents, conduct live streams, manage applications
- **ADMIN**: Full system access, user management
- **SUPER_ADMIN**: Highest level access

## Teacher-Specific Permissions

### 1. Course Management
**✅ Teachers CAN:**
- Create new courses (`POST /api/courses/`)
- View their own courses (`GET /api/courses/my-courses`)
- Update their courses (`PUT /api/courses/{course_id}`)
- Delete their courses (`DELETE /api/courses/{course_id}`)
- View all courses (`GET /api/courses/`)

**❌ Teachers CANNOT:**
- Access enrolled courses endpoint (`GET /api/courses/enrolled-courses`) - This is for students only

### 2. Document Management
**✅ Teachers CAN:**
- Upload documents to their courses (`POST /api/documents/courses/{course_id}/upload`)
- View documents in their courses (`GET /api/documents/courses/{course_id}`)
- Update document metadata (`PUT /api/documents/document/{document_id}`)
- Delete documents (`DELETE /api/documents/document/{document_id}`)

**🔒 Restrictions:**
- Can only upload to courses they instruct
- Must be authenticated as a teacher

### 3. Application Management
**✅ Teachers CAN:**
- View applications for their courses (`GET /api/courses/course-applications`)
- Approve applications (`PUT /api/courses/applications/{application_id}/approve`)
- Reject applications (`PUT /api/courses/applications/{application_id}/reject`)

### 4. Live Stream Management
**✅ Teachers CAN:**
- Create live streams (`POST /api/livestream/`)
- Start/stop streams (`POST /api/livestream/{stream_id}/start`)
- View stream statistics (`GET /api/livestream/{stream_id}/stats`)
- Manage stream participants

### 5. ECHO Chatbot Access
**✅ Teachers CAN:**
- Access chatbot status (`GET /api/chatbot/status`)
- View chat sessions (`GET /api/chatbot/sessions`)
- Send messages to ECHO (`POST /api/chatbot/chat` or `POST /api/chatbot/send`)
- Analyze course content (`POST /api/chatbot/analyze-course`)

### 6. Statistics and Analytics
**✅ Teachers CAN:**
- View their statistics (`GET /api/statistics/user`)
- Record learning activities (`POST /api/statistics/activity`)
- View weekly progress (`GET /api/statistics/weekly-progress`)

### 7. Notifications
**✅ Teachers CAN:**
- View notifications (`GET /api/notifications/`)
- Mark notifications as read (`PUT /api/notifications/{notification_id}/read`)
- Manage notification preferences (`GET /api/preferences`)

## API Testing Guidelines

### Authentication
```python
# Login as teacher
login_data = {
    "username": "test_teacher",  # Use username, not email
    "password": "password123"
}
```

### Common Error Patterns

#### 1. 403 Forbidden - Role-Based Access
```json
{
    "detail": "Only students can access enrolled courses"
}
```
**Solution**: Use `/api/courses/my-courses` instead of `/api/courses/enrolled-courses`

#### 2. 403 Forbidden - Course Ownership
```json
{
    "detail": "You can only upload documents to your own courses"
}
```
**Solution**: Ensure the course `instructor_id` matches the authenticated teacher's ID

#### 3. 404 Not Found - Course/Document Not Found
```json
{
    "detail": "Course not found"
}
```
**Solution**: Verify the course ID exists and the teacher has access

### Testing Strategy

#### 1. Use Teacher Account for Teacher-Specific Endpoints
```python
# ✅ Correct - Teacher testing teacher endpoints
teacher_login = {
    "username": "test_teacher",
    "password": "password123"
}

# ❌ Wrong - Teacher testing student endpoints
# This will cause 403 errors
```

#### 2. Test Course-Specific Endpoints with Valid Course IDs
```python
# ✅ Test with courses that exist and belong to the teacher
GET /api/courses/my-courses  # Get teacher's courses first
GET /api/documents/courses/{valid_course_id}  # Use valid course ID
```

#### 3. Handle Missing Data Gracefully
```python
# Documents endpoint may return 404 if no documents exist
# This is expected behavior, not an error
```

## Current Test Results Summary

### ✅ Working Endpoints (Teacher Account)
- Health check (`GET /health`)
- Authentication (`POST /api/auth/login`)
- Course listing (`GET /api/courses/`)
- My courses (`GET /api/courses/my-courses`)
- Notifications (`GET /api/notifications/`)
- ECHO chatbot (`GET /api/chatbot/status`, `GET /api/chatbot/sessions`)
- Statistics (`GET /api/statistics/user`)
- Live streams (`GET /api/livestream/`)

### ⚠️ Expected Failures (Teacher Account)
- Enrolled courses (`GET /api/courses/enrolled-courses`) - 403 (Expected)
- Course documents (`GET /api/documents/courses/1`) - 404 (No documents exist)
- Notification preferences (`GET /api/preferences`) - 405 (Routing issue)

### 🔧 Remaining Issues to Fix
1. **Notification Preferences**: Fix routing to resolve 405 error
2. **Course Documents**: Create test data or handle empty results properly
3. **Student Testing**: Create separate tests for student-specific endpoints

## Best Practices

### 1. Role-Based Testing
- Test teacher endpoints with teacher accounts
- Test student endpoints with student accounts
- Don't mix roles in the same test session

### 2. Data Validation
- Verify course ownership before testing course-specific endpoints
- Handle empty results gracefully (404 for missing documents is normal)
- Use valid IDs from the database

### 3. Error Handling
- 403 errors often indicate role/permission issues
- 404 errors may indicate missing data (not always a bug)
- 405 errors indicate routing/method issues

### 4. Authentication
- Always use fresh tokens (they expire)
- Use correct field names (`username` not `email`)
- Include proper headers for authenticated requests 