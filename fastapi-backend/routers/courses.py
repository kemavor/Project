from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Course, User, Application, CourseDocument, Enrollment, Notification
from schemas import CourseCreate, CourseResponse, CourseUpdate, ApplicationCreate, ApplicationResponse
from auth import get_current_user
import boto3
from botocore.exceptions import ClientError
from config import settings
from sqlalchemy import func
from schemas import EnrolledCourseResponse, UserResponse
from services.notification_service import NotificationService

router = APIRouter(prefix="/courses", tags=["courses"])


def generate_presigned_url(bucket_name: str, object_key: str, expiration: int = 3600) -> str:
    """Generate a pre-signed URL for S3 object access"""
    try:
        if settings.use_iam_role:
            s3_client = boto3.client('s3', region_name=settings.aws_region)
        else:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region
            )

        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': object_key},
            ExpiresIn=expiration
        )
        return presigned_url
    except ClientError as e:
        print(f"Error generating presigned URL: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error generating presigned URL: {e}")
        return None


@router.get("/", response_model=List[CourseResponse])
async def get_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all courses"""
    try:
        courses = db.query(Course).all()
        return [
            CourseResponse(
                id=course.id,
                title=course.title,
                description=course.description,
                instructor_id=course.instructor_id,
                is_enrollment_open=course.is_enrollment_open,
                credits=course.credits,
                created_at=course.created_at,
                updated_at=course.updated_at
            )
            for course in courses
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch courses: {str(e)}"
        )


@router.get("/my-courses", response_model=List[CourseResponse])
async def get_my_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get courses created by the current user (teachers only)"""
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access their courses"
        )

    try:
        courses = db.query(Course).filter(
            Course.instructor_id == current_user.id).all()
        return [
            CourseResponse(
                id=course.id,
                title=course.title,
                description=course.description,
                instructor_id=course.instructor_id,
                is_enrollment_open=course.is_enrollment_open,
                credits=course.credits,
                created_at=course.created_at,
                updated_at=course.updated_at
            )
            for course in courses
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch your courses: {str(e)}"
        )


@router.get("/enrolled-courses", response_model=List[EnrolledCourseResponse])
async def get_enrolled_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get courses that the current user is enrolled in (students only)"""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access enrolled courses"
        )

    try:
        # Get enrollments with course and instructor details
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.status == "enrolled"
        ).all()

        enrolled_courses = []
        for enrollment in enrollments:
            # Get the course with instructor details
            course = db.query(Course).filter(
                Course.id == enrollment.course_id).first()
            if course:
                # Get instructor details
                instructor = db.query(User).filter(
                    User.id == course.instructor_id).first()
                instructor_data = None
                if instructor:
                    instructor_data = UserResponse(
                        id=instructor.id,
                        username=instructor.username,
                        email=instructor.email,
                        first_name=instructor.first_name,
                        last_name=instructor.last_name,
                        role=instructor.role,
                        is_active=instructor.is_active
                    )

                enrolled_courses.append(EnrolledCourseResponse(
                    id=course.id,
                    title=course.title,
                    description=course.description,
                    instructor_id=course.instructor_id,
                    is_enrollment_open=course.is_enrollment_open,
                    credits=course.credits,
                    created_at=course.created_at,
                    updated_at=course.updated_at,
                    enrolled_at=enrollment.enrolled_at,
                    enrollment_status=enrollment.status,
                    instructor=instructor_data
                ))

        return enrolled_courses
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch enrolled courses: {str(e)}"
        )


@router.post("/", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new course (teachers only)"""
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create courses"
        )

    try:
        course = Course(
            title=course_data.title,
            description=course_data.description,
            instructor_id=current_user.id,
            is_enrollment_open=course_data.is_enrollment_open,
            credits=course_data.credits
        )

        db.add(course)
        db.commit()
        db.refresh(course)

        return CourseResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            instructor_id=course.instructor_id,
            is_enrollment_open=course.is_enrollment_open,
            credits=course.credits,
            created_at=course.created_at,
            updated_at=course.updated_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create course: {str(e)}"
        )


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_data: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a course (instructor only)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    if course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the instructor can update this course"
        )

    try:
        # Update fields if provided
        if course_data.title is not None:
            course.title = course_data.title
        if course_data.description is not None:
            course.description = course_data.description
        if course_data.is_enrollment_open is not None:
            course.is_enrollment_open = course_data.is_enrollment_open
        if course_data.credits is not None:
            course.credits = course_data.credits

        db.commit()
        db.refresh(course)

        return CourseResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            instructor_id=course.instructor_id,
            is_enrollment_open=course.is_enrollment_open,
            credits=course.credits,
            created_at=course.created_at,
            updated_at=course.updated_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update course: {str(e)}"
        )


@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a course (instructor only)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    if course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the instructor can delete this course"
        )

    try:
        db.delete(course)
        db.commit()
        return {"message": "Course deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete course: {str(e)}"
        )


@router.post("/{course_id}/apply", response_model=ApplicationResponse)
async def apply_for_course(
    course_id: int,
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Apply for a course (students only)"""

    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can apply for courses"
        )

    try:
        # Check if course exists and is open for enrollment
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )

        if not course.is_enrollment_open:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course is not open for enrollment"
            )

        # Check if student already applied
        existing_application = db.query(Application).filter(
            Application.student_id == current_user.id,
            Application.course_id == course_id
        ).first()

        if existing_application:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already applied for this course"
            )

        # Create application
        application = Application(
            student_id=current_user.id,
            course_id=course_id,
            student_year=application_data.student_year,
            gpa=application_data.gpa,
            motivation_statement=application_data.motivation_statement,
            status="pending"
        )

        db.add(application)
        db.commit()
        db.refresh(application)

        return ApplicationResponse.model_validate(application)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply for course: {str(e)}"
        )


@router.get("/{course_id}/documents", response_model=List[dict])
async def get_course_documents_for_students(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get course documents that students can access"""

    try:
        # Check if course exists
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )

        # Get public documents or documents for enrolled students
        documents_query = db.query(CourseDocument).filter(
            CourseDocument.course_id == course_id,
            CourseDocument.is_public == True
        )

        # If user is a student, also check if they're enrolled or have applied
        if current_user.role == "student":
            # Check if student is enrolled
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == course_id,
                Enrollment.status == "enrolled"
            ).first()

            # If not enrolled, only show public documents
            if not enrollment:
                documents_query = documents_query.filter(
                    CourseDocument.is_public == True)

        documents = documents_query.all()

        # Format response
        document_list = []
        for doc in documents:
            # Generate pre-signed URLs for secure access
            presigned_url = generate_presigned_url(
                doc.s3_bucket, doc.s3_key, expiration=3600)

            document_data = {
                "id": doc.id,
                "title": doc.title or doc.original_filename,
                "filename": doc.original_filename,
                "file_size": doc.file_size,
                "file_type": doc.file_type,
                "mime_type": doc.mime_type,
                "is_public": doc.is_public,
                "created_at": doc.created_at,
                "download_url": presigned_url,  # Pre-signed URL for download
                "view_url": presigned_url  # Pre-signed URL for viewing
            }
            document_list.append(document_data)

        return document_list

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch course documents: {str(e)}"
        )


@router.get("/documents/{document_id}/download")
async def get_document_download_url(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a pre-signed download URL for a specific document"""

    try:
        # Get the document
        document = db.query(CourseDocument).filter(
            CourseDocument.id == document_id).first()
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check if user has access to this document
        course = db.query(Course).filter(
            Course.id == document.course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )

        # For students, check if they're enrolled or document is public
        if current_user.role == "student":
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == document.course_id,
                Enrollment.status == "enrolled"
            ).first()

            if not enrollment and not document.is_public:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this document"
                )

        # Generate pre-signed URL or local file URL
        if document.s3_url and document.s3_url.startswith('http'):
            # S3 file - generate pre-signed URL
            presigned_url = generate_presigned_url(
                document.s3_bucket, document.s3_key, expiration=3600)

            if not presigned_url:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to generate download URL"
                )
        else:
            # Local file - create direct URL
            presigned_url = f"http://localhost:8000{document.s3_url}"

        return {
            "download_url": presigned_url,
            "filename": document.original_filename,
            "file_size": document.file_size,
            "expires_in": 3600
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}"
        )


@router.get("/my-applications", response_model=List[ApplicationResponse])
async def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's course applications"""

    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their applications"
        )

    try:
        applications = db.query(Application).filter(
            Application.student_id == current_user.id
        ).all()

        return [ApplicationResponse.model_validate(app) for app in applications]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch applications: {str(e)}"
        )


@router.get("/course-applications", response_model=List[ApplicationResponse])
async def get_course_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get applications for courses taught by the current teacher"""

    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view course applications"
        )

    try:
        # Get all courses taught by this teacher
        teacher_courses = db.query(Course).filter(
            Course.instructor_id == current_user.id
        ).all()

        course_ids = [course.id for course in teacher_courses]

        # Get all applications for these courses
        applications = db.query(Application).filter(
            Application.course_id.in_(course_ids)
        ).all()

        return [ApplicationResponse.model_validate(app) for app in applications]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch course applications: {str(e)}"
        )


@router.put("/applications/{application_id}/approve")
async def approve_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve a student application for a course"""

    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can approve applications"
        )

    try:
        # Get the application
        application = db.query(Application).filter(
            Application.id == application_id
        ).first()

        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )

        # Check if the current user is the instructor of the course
        course = db.query(Course).filter(
            Course.id == application.course_id
        ).first()

        if not course or course.instructor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only approve applications for your own courses"
            )

        # Update application status
        application.status = "approved"
        application.updated_at = func.now()

        # Create enrollment
        enrollment = Enrollment(
            student_id=application.student_id,
            course_id=application.course_id,
            status="enrolled"
        )
        db.add(enrollment)

        # Create personalized notification for the student
        notification = NotificationService.create_course_application_notification(
            db=db,
            application_id=application.id,
            action="approved"
        )

        db.commit()

        return {
            "success": True,
            "message": "Application approved and student enrolled successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve application: {str(e)}"
        )


@router.put("/applications/{application_id}/reject")
async def reject_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject a student application for a course"""

    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can reject applications"
        )

    try:
        # Get the application
        application = db.query(Application).filter(
            Application.id == application_id
        ).first()

        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )

        # Check if the current user is the instructor of the course
        course = db.query(Course).filter(
            Course.id == application.course_id
        ).first()

        if not course or course.instructor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only reject applications for your own courses"
            )

        # Update application status
        application.status = "rejected"
        application.updated_at = func.now()

        # Create personalized notification for the student
        notification = NotificationService.create_course_application_notification(
            db=db,
            application_id=application.id,
            action="rejected"
        )

        db.commit()

        return {
            "success": True,
            "message": "Application rejected successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject application: {str(e)}"
        )


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific course by ID"""
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )

        return CourseResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            instructor_id=course.instructor_id,
            is_enrollment_open=course.is_enrollment_open,
            credits=course.credits,
            created_at=course.created_at,
            updated_at=course.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch course: {str(e)}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch course: {str(e)}"
        )
