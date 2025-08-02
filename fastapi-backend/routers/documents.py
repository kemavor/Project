from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import boto3
import os
import uuid
import mimetypes
from pathlib import Path
from botocore.exceptions import ClientError

from database import get_db
from models import Course, CourseDocument, User
from schemas import CourseDocumentCreate, CourseDocumentResponse, DocumentUploadResponse
from auth import get_current_user
from config import settings

router = APIRouter(tags=["documents"])

# Initialize S3 client with IAM role support


def get_s3_client():
    """Get S3 client using IAM role (EC2) or access keys (local development)"""
    try:
        if settings.use_iam_role:
            # Use IAM role attached to EC2 instance (recommended for production)
            return boto3.client('s3', region_name=settings.aws_region)
        elif settings.aws_access_key_id and settings.aws_secret_access_key:
            # Use access keys (for local development only)
            return boto3.client(
                's3',
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region
            )
        else:
            # No credentials configured - return None for fallback handling
            print(
                "⚠️  AWS credentials not configured. S3 operations will use local storage fallback.")
            return None
    except Exception as e:
        print(f"❌ Error creating S3 client: {e}")
        return None


# Initialize S3 client
s3_client = get_s3_client()


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename"""
    return os.path.splitext(filename)[1].lower()


def get_mime_type(filename: str) -> str:
    """Get MIME type based on file extension"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or 'application/octet-stream'


def upload_to_s3(file_content: bytes, s3_key: str, content_type: str) -> str:
    """Upload file to S3 and return the S3 URL"""
    try:
        # Check if S3 client is available
        if s3_client is None:
            print("📁 S3 not configured, using local storage")
            return upload_to_local_storage(file_content, s3_key, content_type)

        # Try S3 upload
        s3_client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type,
            ACL='private'  # Private by default, can be made public if needed
        )

        # Generate S3 URL
        s3_url = f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{s3_key}"
        print(f"✅ File uploaded to S3: {s3_url}")
        return s3_url
    except ClientError as e:
        print(f"❌ S3 upload failed: {e}")
        print("📁 Falling back to local storage")
        return upload_to_local_storage(file_content, s3_key, content_type)
    except Exception as e:
        print(f"❌ Unexpected error in S3 upload: {e}")
        print("📁 Falling back to local storage")
        return upload_to_local_storage(file_content, s3_key, content_type)


def upload_to_local_storage(file_content: bytes, s3_key: str, content_type: str) -> str:
    """Upload file to local storage for development"""
    try:
        # Create local storage directory
        local_storage_path = Path("./local_course_content")
        local_storage_path.mkdir(exist_ok=True)

        # Create course directory
        course_id = s3_key.split(
            '/')[1] if len(s3_key.split('/')) > 1 else 'unknown'
        course_path = local_storage_path / course_id
        course_path.mkdir(exist_ok=True)

        # Save file locally
        filename = s3_key.split('/')[-1]
        file_path = course_path / filename

        with open(file_path, 'wb') as f:
            f.write(file_content)

        # Return local file URL (for development)
        local_url = f"/local-files/{course_id}/{filename}"
        return local_url
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file locally: {str(e)}"
        )


@router.post("/upload/{course_id}", response_model=DocumentUploadResponse)
async def upload_course_document(
    course_id: int,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    is_public: bool = Form(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a document to a course (teachers only)"""

    # Check if user is a teacher
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can upload documents"
        )

    # Verify course exists and user is the instructor
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    if course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only upload documents to your own courses"
        )

    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )

    # Check file size (max 50MB)
    file_content = await file.read()
    if len(file_content) > 50 * 1024 * 1024:  # 50MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size too large. Maximum size is 50MB"
        )

    # Get file metadata
    original_filename = file.filename
    file_extension = get_file_extension(original_filename)
    mime_type = get_mime_type(original_filename)
    file_size = len(file_content)

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    s3_key = f"course-documents/{course_id}/{unique_filename}"

    try:
        # Upload to S3
        s3_url = upload_to_s3(file_content, s3_key, mime_type)

        # Create database record
        document = CourseDocument(
            course_id=course_id,
            uploaded_by=current_user.id,
            filename=unique_filename,
            original_filename=original_filename,
            file_size=file_size,
            file_type=file_extension.lstrip('.'),
            mime_type=mime_type,
            s3_key=s3_key,
            s3_bucket=settings.s3_bucket_name,
            s3_url=s3_url,
            title=title or original_filename,
            description=description,
            is_public=is_public
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        return DocumentUploadResponse(
            success=True,
            message="Document uploaded successfully",
            document=CourseDocumentResponse.from_orm(document)
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/courses/{course_id}", response_model=List[CourseDocumentResponse])
async def get_course_documents(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all documents for a course"""

    # Verify course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    # Get documents based on user role
    if current_user.role == "teacher" and course.instructor_id == current_user.id:
        # Teachers can see all documents for their courses
        documents = db.query(CourseDocument).filter(
            CourseDocument.course_id == course_id).all()
    else:
        # Students can only see public documents
        documents = db.query(CourseDocument).filter(
            CourseDocument.course_id == course_id,
            CourseDocument.is_public == True
        ).all()

    return [CourseDocumentResponse.from_orm(doc) for doc in documents]


@router.get("/document/{document_id}", response_model=CourseDocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific document"""

    document = db.query(CourseDocument).filter(
        CourseDocument.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Check access permissions
    course = db.query(Course).filter(Course.id == document.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    if current_user.role == "teacher" and course.instructor_id == current_user.id:
        # Teachers can access all documents for their courses
        pass
    elif not document.is_public:
        # Students can only access public documents
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return CourseDocumentResponse.from_orm(document)


@router.delete("/document/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document (teachers only)"""

    document = db.query(CourseDocument).filter(
        CourseDocument.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Check if user is the course instructor
    course = db.query(Course).filter(Course.id == document.course_id).first()
    if not course or course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the course instructor can delete documents"
        )

    try:
        # Delete from S3
        s3_client.delete_object(
            Bucket=document.s3_bucket,
            Key=document.s3_key
        )

        # Delete from database
        db.delete(document)
        db.commit()

        return {"message": "Document deleted successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )


@router.put("/document/{document_id}", response_model=CourseDocumentResponse)
async def update_document(
    document_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    is_public: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update document metadata (teachers only)"""

    try:
        document = db.query(CourseDocument).filter(
            CourseDocument.id == document_id).first()

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Check if user is the course instructor
        course = db.query(Course).filter(
            Course.id == document.course_id).first()
        if not course or course.instructor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update documents for your own courses"
            )

        # Update document fields
        if title is not None:
            document.title = title
        if description is not None:
            document.description = description
        if is_public is not None:
            document.is_public = is_public

        document.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(document)

        return CourseDocumentResponse.from_orm(document)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update document: {str(e)}"
        )
