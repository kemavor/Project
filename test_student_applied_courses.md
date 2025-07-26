# Student Applied Courses - Test Guide

## Overview

This guide will help you test the student applied courses functionality where students can view their applied courses and access documents from those courses.

## Prerequisites

- FastAPI backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- Student account created (e.g., `student_john` / `password123`)

## Test Steps

### 1. Login as a Student

1. Go to `http://localhost:5173/login`
2. Login with student credentials:
   - Username: `student_john`
   - Password: `password123`
3. Verify you're logged in as a student

### 2. Apply for a Course (if not already applied)

1. Go to `http://localhost:5173/courses`
2. Find a course you want to apply for
3. Click "Apply Now" button
4. Fill out the application form:
   - Student Year: 2
   - GPA: 3.5
   - Motivation Statement: "I am interested in this course..."
5. Click "Submit Application"
6. Verify you get a success message

### 3. Access Applied Courses Page

1. In the navigation bar, click "My Courses" (should be visible for students)
2. This will take you to `http://localhost:5173/student/applied-courses`
3. Verify the page loads correctly

### 4. Test Applied Courses Page Features

#### 4.1 View All Applied Courses

- You should see a tab called "All" with the number of applications
- Each course card should show:
  - Course title
  - Course description
  - Credits
  - Application status (pending/approved/rejected)
  - Application details (year, GPA, application date)

#### 4.2 Test Status Tabs

- **All**: Shows all your applications
- **Approved**: Shows only approved applications
- **Pending**: Shows only pending applications
- **Rejected**: Shows only rejected applications

#### 4.3 View Application Details

- Each course card should show application information:
  - Student year
  - GPA
  - Application date
  - Current status

#### 4.4 Access Course Documents

- For courses with documents, you should see a "Course Documents" section
- Each document should show:
  - Document title
  - File size
  - File type
  - View and Download buttons

#### 4.5 Test Document Actions

- **View**: Click the eye icon to open document in browser
- **Download**: Click the download icon to download the document
- Verify loading spinners appear during download

### 5. Test Navigation

1. Verify "My Courses" link is visible in navbar for students
2. Verify "Documents" link is also available
3. Test switching between different pages

### 6. Test Empty States

1. If you have no applications, verify the empty state message
2. If you have no documents for a course, verify the "No documents available" message

## Expected Results

### ✅ Success Indicators

- Page loads without errors
- All applied courses are displayed
- Application details are shown correctly
- Status tabs work properly
- Document download/view works
- Navigation is smooth
- Loading states work correctly

### ❌ Error Indicators

- Page doesn't load
- Courses not displayed
- Application details missing
- Document actions don't work
- Navigation errors
- Console errors

## Troubleshooting

### Common Issues

1. **Page not loading**: Check if backend is running
2. **No courses shown**: Verify you have applied for courses
3. **Documents not loading**: Check if teachers have uploaded documents
4. **Download not working**: Check S3 configuration

### Debug Steps

1. Open browser developer tools
2. Check Console for errors
3. Check Network tab for failed requests
4. Verify API endpoints are working

## Backend API Endpoints Used

- `GET /api/courses/my-applications` - Get student's applications
- `GET /api/courses/{id}` - Get course details
- `GET /api/courses/{id}/documents` - Get course documents

## Frontend Routes

- `/student/applied-courses` - Main applied courses page
- `/courses` - Course selection page
- `/student/documents` - General documents page

## Notes

- Students can only see documents for courses they've applied to
- Application status affects document access
- All document actions require proper S3 configuration
- The page is responsive and works on mobile devices
