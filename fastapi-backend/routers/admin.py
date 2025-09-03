from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import (
    User,
    Course,
    LiveStream,
    Application,
    Enrollment,
    StreamParticipant,
    StreamChatMessage,
    Question,
    StreamAnalytics,
    Notification,
    UserStatistics,
    LearningActivity,
    ChatSession,
    ChatMessage,
    QuestionAnswer,
    QuizSession,
    SummaryAccess,
    UserNotificationPreferences,
    CourseDocument,
    Lecture,
    StreamTranscription,
    StreamTranscriptionSession,
    LectureTranscription,
    LectureSummary,
    GeneratedQuestion,
)
from schemas import UserResponse, CourseResponse, LiveStreamResponse
from auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


def check_admin_permissions(current_user: User = Depends(get_current_user)):
    """Check if user has admin permissions"""
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can access this endpoint"
        )
    return current_user


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """Get all users with optional filtering"""
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    users = query.offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db)
):
    """Get a specific user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: dict,
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db)
):
    """Update user information"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update allowed fields
    allowed_fields = ["first_name", "last_name", "email", "role", "is_active"]
    for field, value in user_data.items():
        if field in allowed_fields and hasattr(user, field):
            setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db)
):
    """Delete a user and all dependent data to satisfy FK constraints"""
    if current_user.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user is an admin
    if user.role in ["admin", "super_admin"]:
        # Count total admin users
        admin_count = db.query(User).filter(
            User.role.in_(["admin", "super_admin"])
        ).count()

        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last administrator account"
            )

    # Delete associated data first
    try:
        phase = "start"
        # Global user-linked data
        phase = "delete_user_notifications_stats_activity"
        db.query(Notification).filter(Notification.user_id == user_id).delete()
        db.query(UserStatistics).filter(
            UserStatistics.user_id == user_id).delete()
        db.query(LearningActivity).filter(
            LearningActivity.user_id == user_id).delete()
        db.query(QuestionAnswer).filter(
            QuestionAnswer.user_id == user_id).delete()
        db.query(QuizSession).filter(QuizSession.user_id == user_id).delete()
        db.query(SummaryAccess).filter(
            SummaryAccess.user_id == user_id).delete()
        db.query(UserNotificationPreferences).filter(
            UserNotificationPreferences.user_id == user_id).delete()
        db.query(StreamParticipant).filter(
            StreamParticipant.user_id == user_id).delete()
        db.query(StreamChatMessage).filter(
            StreamChatMessage.user_id == user_id).delete()
        # Questions created by the user
        phase = "delete_user_questions_and_answers"
        db.query(Question).filter(Question.user_id == user_id).delete()
        # Questions answered by the user -> set answered_by to NULL
        db.query(Question).filter(Question.answered_by ==
                                  user_id).update({Question.answered_by: None})

        # Chatbot sessions and messages
        phase = "delete_chat_sessions_messages"
        user_sessions = db.query(ChatSession).filter(
            ChatSession.user_id == user_id).all()
        if user_sessions:
            session_ids = [s.id for s in user_sessions]
            db.query(ChatMessage).filter(ChatMessage.session_id.in_(
                session_ids)).delete(synchronize_session=False)
            db.query(ChatSession).filter(ChatSession.id.in_(
                session_ids)).delete(synchronize_session=False)

        # Applications submitted by this user (and related notifications)
        phase = "delete_user_applications"
        user_applications = db.query(Application).filter(
            Application.student_id == user_id).all()
        if user_applications:
            app_ids = [a.id for a in user_applications]
            db.query(Notification).filter(Notification.related_application_id.in_(
                app_ids)).delete(synchronize_session=False)
            db.query(Application).filter(Application.id.in_(
                app_ids)).delete(synchronize_session=False)

        # Enrollments of this user
        phase = "delete_user_enrollments"
        db.query(Enrollment).filter(Enrollment.student_id == user_id).delete()

        # Documents uploaded by this user: delete dependent generated Q/A, notifications, then documents
        phase = "delete_user_documents"
        user_documents = db.query(CourseDocument).filter(
            CourseDocument.uploaded_by == user_id).all()
        if user_documents:
            doc_ids = [d.id for d in user_documents]
            # Generated questions tied to these documents and their answers
            doc_gqs = db.query(GeneratedQuestion.id).filter(
                GeneratedQuestion.document_id.in_(doc_ids)).all()
            if doc_gqs:
                gq_ids = [row[0] for row in doc_gqs]
                db.query(QuestionAnswer).filter(QuestionAnswer.question_id.in_(
                    gq_ids)).delete(synchronize_session=False)
                db.query(GeneratedQuestion).filter(GeneratedQuestion.id.in_(
                    gq_ids)).delete(synchronize_session=False)
            # Notifications referencing these documents
            db.query(Notification).filter(Notification.related_document_id.in_(
                doc_ids)).delete(synchronize_session=False)
            # Delete the documents
            db.query(CourseDocument).filter(CourseDocument.id.in_(
                doc_ids)).delete(synchronize_session=False)

        # Handle livestreams owned by this user (as instructor)
        phase = "delete_instructor_streams"
        instructor_streams = db.query(LiveStream).filter(
            LiveStream.instructor_id == user_id).all()
        for stream in instructor_streams:
            # Delete stream-related rows first
            db.query(StreamParticipant).filter(
                StreamParticipant.stream_id == stream.id).delete()
            db.query(StreamChatMessage).filter(
                StreamChatMessage.stream_id == stream.id).delete()
            db.query(Question).filter(Question.stream_id == stream.id).delete()
            db.query(StreamAnalytics).filter(
                StreamAnalytics.stream_id == stream.id).delete()
            # Generated questions tied to this stream and their answers
            stream_gqs = db.query(GeneratedQuestion.id).filter(
                GeneratedQuestion.stream_id == stream.id).all()
            if stream_gqs:
                gq_ids = [row[0] for row in stream_gqs]
                db.query(QuestionAnswer).filter(QuestionAnswer.question_id.in_(
                    gq_ids)).delete(synchronize_session=False)
                db.query(GeneratedQuestion).filter(GeneratedQuestion.id.in_(
                    gq_ids)).delete(synchronize_session=False)
            db.query(LectureSummary).filter(
                LectureSummary.stream_id == stream.id).delete()
            db.query(LectureTranscription).filter(
                LectureTranscription.stream_id == stream.id).delete()
            db.query(StreamTranscription).filter(
                StreamTranscription.stream_id == stream.id).delete()
            db.query(StreamTranscriptionSession).filter(
                StreamTranscriptionSession.stream_id == stream.id).delete()
            db.query(Notification).filter(
                Notification.related_stream_id == stream.id).delete()
            db.delete(stream)

        # Any lectures authored by this user (safety), regardless of course ownership
        phase = "delete_user_authored_lectures"
        db.query(Lecture).filter(Lecture.instructor_id ==
                                 user_id).delete(synchronize_session=False)

        # If user is a teacher, remove their courses and dependent rows
        phase = "delete_teacher_courses"
        if user.role == "teacher":
            teacher_courses = db.query(Course).filter(
                Course.instructor_id == user_id).all()
            for course in teacher_courses:
                # Delete course-related rows
                # First delete notifications for applications in this course, then applications
                course_apps = db.query(Application).filter(
                    Application.course_id == course.id).all()
                if course_apps:
                    c_app_ids = [a.id for a in course_apps]
                    db.query(Notification).filter(Notification.related_application_id.in_(
                        c_app_ids)).delete(synchronize_session=False)
                    db.query(Application).filter(Application.id.in_(
                        c_app_ids)).delete(synchronize_session=False)

                # Delete notifications referencing course documents, then the documents
                course_docs = db.query(CourseDocument).filter(
                    CourseDocument.course_id == course.id).all()
                if course_docs:
                    c_doc_ids = [d.id for d in course_docs]
                    db.query(Notification).filter(Notification.related_document_id.in_(
                        c_doc_ids)).delete(synchronize_session=False)
                    db.query(CourseDocument).filter(CourseDocument.id.in_(
                        c_doc_ids)).delete(synchronize_session=False)

                db.query(Enrollment).filter(
                    Enrollment.course_id == course.id).delete()
                db.query(Lecture).filter(
                    Lecture.course_id == course.id).delete()
                # Generated questions for this course and answers (if any remain)
                course_gq_ids = [row[0] for row in db.query(GeneratedQuestion.id).filter(
                    GeneratedQuestion.course_id == course.id).all()]
                if course_gq_ids:
                    db.query(QuestionAnswer).filter(QuestionAnswer.question_id.in_(
                        course_gq_ids)).delete(synchronize_session=False)
                    db.query(GeneratedQuestion).filter(GeneratedQuestion.id.in_(
                        course_gq_ids)).delete(synchronize_session=False)
                db.query(Notification).filter(
                    Notification.related_course_id == course.id).delete()
                db.delete(course)

        # Finally delete the user
        phase = "delete_user"
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to delete user at phase '{phase}': {str(e)}")


@router.get("/courses", response_model=List[CourseResponse])
def get_all_courses(
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    instructor_id: Optional[int] = None,
    is_enrollment_open: Optional[bool] = None
):
    """Get all courses with optional filtering"""
    query = db.query(Course)

    if instructor_id:
        query = query.filter(Course.instructor_id == instructor_id)
    if is_enrollment_open is not None:
        query = query.filter(Course.is_enrollment_open == is_enrollment_open)

    courses = query.offset(skip).limit(limit).all()
    return courses


@router.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db)
):
    """Get a specific course by ID"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.put("/courses/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_data: dict,
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db)
):
    """Update course information"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Update allowed fields
    allowed_fields = ["title", "description", "is_enrollment_open", "credits"]
    for field, value in course_data.items():
        if field in allowed_fields and hasattr(course, field):
            setattr(course, field, value)

    db.commit()
    db.refresh(course)
    return course


@router.delete("/courses/{course_id}")
def delete_course(
    course_id: int,
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db)
):
    """Delete a course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check if course has enrollments
    enrollments = db.query(Enrollment).filter(
        Enrollment.course_id == course_id).count()
    if enrollments > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete course with active enrollments"
        )

    db.delete(course)
    db.commit()
    return {"message": "Course deleted successfully"}


@router.get("/livestreams", response_model=List[LiveStreamResponse])
def get_all_livestreams(
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    instructor_id: Optional[int] = None
):
    """Get all livestreams with optional filtering"""
    query = db.query(LiveStream)

    if status:
        query = query.filter(LiveStream.status == status)
    if instructor_id:
        query = query.filter(LiveStream.instructor_id == instructor_id)

    livestreams = query.offset(skip).limit(limit).all()
    return livestreams


@router.get("/livestreams/{stream_id}", response_model=LiveStreamResponse)
def get_livestream(
    stream_id: int,
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db)
):
    """Get a specific livestream by ID"""
    livestream = db.query(LiveStream).filter(
        LiveStream.id == stream_id).first()
    if not livestream:
        raise HTTPException(status_code=404, detail="Livestream not found")
    return livestream


@router.put("/livestreams/{stream_id}", response_model=LiveStreamResponse)
def update_livestream(
    stream_id: int,
    stream_data: dict,
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db)
):
    """Update livestream information"""
    livestream = db.query(LiveStream).filter(
        LiveStream.id == stream_id).first()
    if not livestream:
        raise HTTPException(status_code=404, detail="Livestream not found")

    # Update allowed fields
    allowed_fields = ["title", "description",
                      "status", "is_public", "max_viewers"]
    for field, value in stream_data.items():
        if field in allowed_fields and hasattr(livestream, field):
            setattr(livestream, field, value)

    db.commit()
    db.refresh(livestream)
    return livestream


@router.delete("/livestreams/{stream_id}")
def delete_livestream(
    stream_id: int,
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db)
):
    """Delete a livestream (admin only)"""
    livestream = db.query(LiveStream).filter(
        LiveStream.id == stream_id).first()
    if not livestream:
        raise HTTPException(status_code=404, detail="Livestream not found")

    # Check if livestream is currently live
    if livestream.status == "live":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a live stream. Stop it first."
        )

    try:
        # Delete related records first (cascade delete)
        # Delete stream participants
        db.query(StreamParticipant).filter(
            StreamParticipant.stream_id == stream_id).delete()

        # Delete chat messages
        db.query(StreamChatMessage).filter(
            StreamChatMessage.stream_id == stream_id).delete()

        # Delete questions
        db.query(Question).filter(Question.stream_id == stream_id).delete()

        # Delete analytics if they exist
        db.query(StreamAnalytics).filter(
            StreamAnalytics.stream_id == stream_id).delete()

        # Delete the stream itself
        db.delete(livestream)
        db.commit()

        return {"message": "Livestream deleted successfully"}

    except Exception as e:
        db.rollback()
        print(f"Error deleting stream {stream_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete stream: {str(e)}"
        )


@router.delete("/livestreams/clear-ended")
def clear_ended_livestreams(
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db)
):
    """Clear all ended livestreams"""
    try:
        # First check if there are any ended livestreams
        ended_streams = db.query(LiveStream).filter(
            LiveStream.status == "ended"
        ).all()

        if not ended_streams:
            return {
                "message": "No ended livestreams to clear",
                "deleted_count": 0
            }

        deleted_count = 0
        for stream in ended_streams:
            # Delete related records first
            db.query(StreamParticipant).filter(
                StreamParticipant.stream_id == stream.id
            ).delete()

            db.query(StreamChatMessage).filter(
                StreamChatMessage.stream_id == stream.id
            ).delete()

            db.query(Question).filter(
                Question.stream_id == stream.id
            ).delete()

            db.query(StreamAnalytics).filter(
                StreamAnalytics.stream_id == stream.id
            ).delete()

            # Delete the stream itself
            db.delete(stream)
            deleted_count += 1

        db.commit()
        return {
            "message": f"Successfully cleared {deleted_count} ended livestreams",
            "deleted_count": deleted_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear ended livestreams: {str(e)}"
        )


@router.get("/applications")
def get_all_applications(
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
):
    """Get all course applications"""
    query = db.query(Application)

    if status:
        query = query.filter(Application.status == status)

    applications = query.offset(skip).limit(limit).all()
    return applications


@router.get("/stats")
def get_admin_stats(
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db)
):
    """Get platform statistics"""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_courses = db.query(Course).count()
    total_livestreams = db.query(LiveStream).count()
    pending_applications = db.query(Application).filter(
        Application.status == "pending").count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_courses": total_courses,
        "total_livestreams": total_livestreams,
        "pending_applications": pending_applications,
        "system_health": "healthy"
    }


@router.get("/system/health")
def get_system_health(
    current_user: User = Depends(check_admin_permissions),
    db: Session = Depends(get_db)
):
    """Get system health status"""
    try:
        # Test database connection
        db.execute("SELECT 1")

        # Check for any critical issues
        critical_issues = []

        # Check for users with invalid roles
        invalid_roles = db.query(User).filter(
            ~User.role.in_(["student", "teacher", "admin", "super_admin"])
        ).count()
        if invalid_roles > 0:
            critical_issues.append(f"{invalid_roles} users with invalid roles")

        # Check for orphaned records
        orphaned_courses = db.query(Course).filter(
            ~Course.instructor_id.in_(db.query(User.id))
        ).count()
        if orphaned_courses > 0:
            critical_issues.append(
                f"{orphaned_courses} courses with invalid instructors")

        health_status = "healthy" if not critical_issues else "warning"

        return {
            "status": health_status,
            "database": "connected",
            "issues": critical_issues,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
