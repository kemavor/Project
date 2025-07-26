#!/usr/bin/env python3
"""
Approve Student Application
"""

import requests
import json


def approve_student_application():
    """Approve student's application to access documents"""

    base_url = "http://localhost:8000"

    print("✅ Approving Student Application")
    print("=" * 40)

    try:
        # Step 1: Login as teacher
        print(f"1️⃣ Logging in as prof_williams (teacher)...")
        teacher_login = requests.post(
            f"{base_url}/api/auth/login",
            json={"username": "prof_williams", "password": "password123"},
            headers={"Content-Type": "application/json"}
        )

        if teacher_login.status_code != 200:
            print(f"   ❌ Teacher login failed")
            return False

        teacher_token = teacher_login.json().get("token")
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

        print(f"   ✅ Teacher login successful")

        # Step 2: Get student's application
        print(f"\n2️⃣ Getting student's application...")

        # First, let's see what applications exist
        # We need to check the database or create an endpoint to list applications

        # For now, let's try to approve the application directly
        # We know student_john applied for course ID 1

        # Let's check if there's an endpoint to get applications for a course
        print(f"   📝 Checking applications for course ID 1...")

        # Since we don't have a direct endpoint, let's create a simple approval
        # We'll need to update the application status in the database

        print(f"   ⚠️  No direct API endpoint found for approving applications")
        print(f"   💡 Need to implement application approval endpoint")

        return False

    except Exception as e:
        print(f"❌ Failed: {e}")
        return False


def create_application_approval_endpoint():
    """Create a simple endpoint to approve applications"""

    print(f"\n🔧 Creating Application Approval Endpoint")
    print("=" * 50)

    # This would be added to the backend
    endpoint_code = '''
@router.put("/applications/{application_id}/approve")
async def approve_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve a student application (teacher only)"""
    
    try:
        # Get the application
        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        # Get the course
        course = db.query(Course).filter(Course.id == application.course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Check if current user is the course instructor
        if current_user.role != "teacher" or course.instructor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the course instructor can approve applications"
            )
        
        # Update application status
        application.status = "approved"
        application.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(application)
        
        return ApplicationResponse.model_validate(application)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve application: {str(e)}"
        )
'''

    print(f"   📝 Add this endpoint to fastapi-backend/routers/courses.py")
    print(f"   📝 Import datetime: from datetime import datetime")
    print(f"   📝 Add the route to the router")

    return endpoint_code


def test_with_public_documents():
    """Test download with public documents from other courses"""

    base_url = "http://localhost:8000"

    print(f"\n🧪 Testing with Public Documents")
    print("=" * 40)

    try:
        # Login as student
        print(f"1️⃣ Logging in as student_john...")
        student_login = requests.post(
            f"{base_url}/api/auth/login",
            json={"username": "student_john", "password": "password123"},
            headers={"Content-Type": "application/json"}
        )

        if student_login.status_code != 200:
            print(f"   ❌ Student login failed")
            return False

        student_token = student_login.json().get("token")
        student_headers = {"Authorization": f"Bearer {student_token}"}

        print(f"   ✅ Student login successful")

        # Try to access documents from course 9 (Physics I) which has public documents
        print(f"\n2️⃣ Testing access to public documents from Physics I (Course ID 9)...")

        docs_response = requests.get(
            f"{base_url}/api/courses/9/documents",
            headers=student_headers
        )

        print(f"   📄 Documents Status: {docs_response.status_code}")
        print(f"   📄 Documents Response: {docs_response.text}")

        if docs_response.status_code == 200:
            documents = docs_response.json()
            print(f"   ✅ Found {len(documents)} documents")

            if documents:
                # Test download
                document_id = documents[0]["id"]
                print(
                    f"\n3️⃣ Testing download for document ID {document_id}...")

                download_response = requests.get(
                    f"{base_url}/api/courses/documents/{document_id}/download",
                    headers=student_headers
                )

                print(f"   📄 Download Status: {download_response.status_code}")
                print(f"   📄 Download Response: {download_response.text}")

                if download_response.status_code == 200:
                    print(f"   ✅ Download URL generated successfully")
                    return True
                else:
                    print(f"   ❌ Download failed")
                    return False
            else:
                print(f"   ⚠️  No documents found")
                return False
        else:
            print(f"   ❌ Failed to get documents")
            return False

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def main():
    """Main function"""
    print("🚀 Application Approval and Testing")
    print("=" * 50)

    # Try to approve application (this will fail as endpoint doesn't exist)
    approve_success = approve_student_application()

    # Show the endpoint code needed
    endpoint_code = create_application_approval_endpoint()

    # Test with public documents
    test_success = test_with_public_documents()

    print(f"\n📊 Results:")
    print(f"✅ Approval endpoint: {'NEEDS IMPLEMENTATION'}")
    print(f"✅ Public document test: {'PASS' if test_success else 'FAIL'}")

    if test_success:
        print(f"\n🎉 Public document access works!")
        print(f"✅ Students can access public documents from any course")
        print(f"✅ Download functionality should work for public documents")
    else:
        print(f"\n⚠️  Public document access failed")
        print(f"🔍 Check the logs above for details")


if __name__ == "__main__":
    main()
