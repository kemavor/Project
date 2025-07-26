from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, time, timedelta
from models import User, Notification, UserNotificationPreferences, Course, Application, LiveStream, CourseDocument, Enrollment
from schemas import NotificationCreate, NotificationResponse
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for handling personalized notifications"""

    @staticmethod
    def get_user_preferences(db: Session, user_id: int) -> Optional[UserNotificationPreferences]:
        """Get user's notification preferences"""
        return db.query(UserNotificationPreferences).filter(
            UserNotificationPreferences.user_id == user_id
        ).first()

    @staticmethod
    def create_default_preferences(db: Session, user_id: int) -> UserNotificationPreferences:
        """Create default notification preferences for a user"""
        preferences = UserNotificationPreferences(
            user_id=user_id,
            course_notifications=True,
            application_notifications=True,
            stream_notifications=True,
            document_notifications=True,
            system_notifications=True,
            achievement_notifications=True,
            low_priority=True,
            normal_priority=True,
            high_priority=True,
            urgent_priority=True,
            email_notifications=True,
            push_notifications=True,
            in_app_notifications=True,
            notification_frequency="immediate",
            enrolled_courses_only=True,
            instructor_courses_only=True
        )
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
        return preferences

    @staticmethod
    def should_send_notification(
        db: Session,
        user_id: int,
        category: str,
        priority: str = "normal",
        related_course_id: Optional[int] = None
    ) -> bool:
        """Determine if a notification should be sent based on user preferences"""
        preferences = NotificationService.get_user_preferences(db, user_id)

        if not preferences:
            # Create default preferences if none exist
            preferences = NotificationService.create_default_preferences(
                db, user_id)

        # Check if user wants this category of notifications
        category_enabled = getattr(
            preferences, f"{category}_notifications", True)
        if not category_enabled:
            return False

        # Check if user wants this priority level
        priority_enabled = getattr(preferences, f"{priority}_priority", True)
        if not priority_enabled:
            return False

        # Check course-specific preferences
        if related_course_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False

            # Check if user is enrolled in the course (for students)
            if user.role == "student" and preferences.enrolled_courses_only:
                enrollment = db.query(Enrollment).filter(
                    and_(
                        Enrollment.student_id == user_id,
                        Enrollment.course_id == related_course_id
                    )
                ).first()
                if not enrollment:
                    return False

            # Check if user is instructor of the course (for teachers)
            elif user.role == "teacher" and preferences.instructor_courses_only:
                course = db.query(Course).filter(
                    and_(
                        Course.id == related_course_id,
                        Course.instructor_id == user_id
                    )
                ).first()
                if not course:
                    return False

        # Check quiet hours
        if preferences.quiet_hours_start and preferences.quiet_hours_end:
            current_time = datetime.now().time()
            if preferences.quiet_hours_start <= preferences.quiet_hours_end:
                # Same day quiet hours (e.g., 22:00 to 08:00)
                if preferences.quiet_hours_start <= current_time <= preferences.quiet_hours_end:
                    return False
            else:
                # Overnight quiet hours (e.g., 22:00 to 08:00)
                if current_time >= preferences.quiet_hours_start or current_time <= preferences.quiet_hours_end:
                    return False

        return True

    @staticmethod
    def create_personalized_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        category: str,
        notification_type: str = "info",
        priority: str = "normal",
        related_course_id: Optional[int] = None,
        related_application_id: Optional[int] = None,
        related_stream_id: Optional[int] = None,
        related_document_id: Optional[int] = None
    ) -> Optional[Notification]:
        """Create a personalized notification if user preferences allow it"""

        # Check if notification should be sent
        if not NotificationService.should_send_notification(
            db, user_id, category, priority, related_course_id
        ):
            logger.info(
                f"Notification skipped for user {user_id} due to preferences")
            return None

        # Get user to determine role-specific targeting
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Create the notification
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            category=category,
            priority=priority,
            related_course_id=related_course_id,
            related_application_id=related_application_id,
            related_stream_id=related_stream_id,
            related_document_id=related_document_id,
            is_personalized=True,
            user_role_target=user.role,
            user_preferences_met=True
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        logger.info(
            f"Personalized notification created for user {user_id}: {title}")
        return notification

    @staticmethod
    def create_course_application_notification(
        db: Session,
        application_id: int,
        action: str  # "approved" or "rejected"
    ) -> Optional[Notification]:
        """Create notification for course application status change"""
        application = db.query(Application).filter(
            Application.id == application_id).first()
        if not application:
            return None

        course = db.query(Course).filter(
            Course.id == application.course_id).first()
        if not course:
            return None

        if action == "approved":
            title = "Course Application Approved! 🎉"
            message = f"Your application for '{course.title}' has been approved. You are now enrolled in the course and can access all course materials."
            notification_type = "success"
            priority = "high"
        else:  # rejected
            title = "Course Application Update"
            message = f"Your application for '{course.title}' was not approved at this time. You can apply for other courses or contact the instructor for more information."
            notification_type = "info"
            priority = "normal"

        return NotificationService.create_personalized_notification(
            db=db,
            user_id=application.student_id,
            title=title,
            message=message,
            category="application",
            notification_type=notification_type,
            priority=priority,
            related_course_id=course.id,
            related_application_id=application.id
        )

    @staticmethod
    def create_course_update_notification(
        db: Session,
        course_id: int,
        update_type: str,  # "new_document", "new_stream", "course_update"
        instructor_id: int
    ) -> List[Notification]:
        """Create notifications for course updates to enrolled students"""
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return []

        # Get all enrolled students
        enrollments = db.query(Enrollment).filter(
            and_(
                Enrollment.course_id == course_id,
                Enrollment.status == "enrolled"
            )
        ).all()

        notifications = []

        if update_type == "new_document":
            title = "New Course Material Available 📚"
            message = f"New course material has been added to '{course.title}'. Check the course documents section to access it."
            category = "document"
        elif update_type == "new_stream":
            title = "New Live Stream Scheduled 📺"
            message = f"A new live stream has been scheduled for '{course.title}'. Check the live streams section for details."
            category = "stream"
        else:  # course_update
            title = "Course Update 📝"
            message = f"The course '{course.title}' has been updated. Check the course page for the latest information."
            category = "course"

        for enrollment in enrollments:
            notification = NotificationService.create_personalized_notification(
                db=db,
                user_id=enrollment.student_id,
                title=title,
                message=message,
                category=category,
                notification_type="info",
                priority="normal",
                related_course_id=course_id
            )
            if notification:
                notifications.append(notification)

        return notifications

    @staticmethod
    def create_stream_notification(
        db: Session,
        stream_id: int,
        notification_type: str  # "starting_soon", "started", "ended"
    ) -> List[Notification]:
        """Create notifications for live stream events"""
        stream = db.query(LiveStream).filter(
            LiveStream.id == stream_id).first()
        if not stream:
            return []

        # Get enrolled students
        enrollments = db.query(Enrollment).filter(
            and_(
                Enrollment.course_id == stream.course_id,
                Enrollment.status == "enrolled"
            )
        ).all()

        notifications = []

        if notification_type == "starting_soon":
            title = "Live Stream Starting Soon! ⏰"
            message = f"The live stream '{stream.title}' is starting in 10 minutes. Join now to participate!"
            category = "stream"
            priority = "high"
        elif notification_type == "started":
            title = "Live Stream Started! 🎥"
            message = f"The live stream '{stream.title}' has started. Join now to participate in the discussion!"
            category = "stream"
            priority = "high"
        else:  # ended
            title = "Live Stream Ended 📺"
            message = f"The live stream '{stream.title}' has ended. Check the recordings section for the replay."
            category = "stream"
            priority = "normal"

        for enrollment in enrollments:
            notification = NotificationService.create_personalized_notification(
                db=db,
                user_id=enrollment.student_id,
                title=title,
                message=message,
                category=category,
                notification_type="info",
                priority=priority,
                related_course_id=stream.course_id,
                related_stream_id=stream_id
            )
            if notification:
                notifications.append(notification)

        return notifications

    @staticmethod
    def create_achievement_notification(
        db: Session,
        user_id: int,
        achievement_type: str,
        achievement_data: Dict[str, Any]
    ) -> Optional[Notification]:
        """Create achievement notifications"""
        achievement_messages = {
            "course_completed": {
                "title": "Course Completed! 🎓",
                "message": f"Congratulations! You have successfully completed '{achievement_data.get('course_title', 'the course')}'. Keep up the great work!",
                "priority": "high"
            },
            "streak_milestone": {
                "title": "Learning Streak! 🔥",
                "message": f"Amazing! You've maintained a {achievement_data.get('days', 0)}-day learning streak. Consistency is key to success!",
                "priority": "normal"
            },
            "quiz_perfect": {
                "title": "Perfect Score! 💯",
                "message": f"Outstanding! You achieved a perfect score on '{achievement_data.get('quiz_title', 'the quiz')}'. Excellent work!",
                "priority": "high"
            },
            "first_stream": {
                "title": "First Live Stream! 🎥",
                "message": f"Congratulations on conducting your first live stream! You're making great progress as an instructor.",
                "priority": "normal"
            }
        }

        if achievement_type not in achievement_messages:
            return None

        achievement_info = achievement_messages[achievement_type]

        return NotificationService.create_personalized_notification(
            db=db,
            user_id=user_id,
            title=achievement_info["title"],
            message=achievement_info["message"],
            category="achievement",
            notification_type="success",
            priority=achievement_info["priority"]
        )

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False,
        category: Optional[str] = None
    ) -> List[Notification]:
        """Get personalized notifications for a user"""
        query = db.query(Notification).filter(Notification.user_id == user_id)

        if unread_only:
            query = query.filter(Notification.read == False)

        if category:
            query = query.filter(Notification.category == category)

        return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def mark_notification_as_read(db: Session, notification_id: int, user_id: int) -> bool:
        """Mark a notification as read"""
        notification = db.query(Notification).filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        ).first()

        if notification:
            notification.read = True
            notification.updated_at = func.now()
            db.commit()
            return True

        return False

    @staticmethod
    def mark_all_notifications_as_read(db: Session, user_id: int) -> int:
        """Mark all notifications as read for a user"""
        result = db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.read == False
            )
        ).update({
            "read": True,
            "updated_at": func.now()
        })

        db.commit()
        return result

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Get count of unread notifications for a user"""
        return db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.read == False
            )
        ).count()

    @staticmethod
    def delete_old_notifications(db: Session, days_old: int = 30) -> int:
        """Delete notifications older than specified days"""
        cutoff_date = datetime.now() - timedelta(days=days_old)
        result = db.query(Notification).filter(
            and_(
                Notification.created_at < cutoff_date,
                Notification.read == True
            )
        ).delete()

        db.commit()
        return result
