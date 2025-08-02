from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_user
from models import User, UserNotificationPreferences
from schemas import NotificationPreferencesUpdate, NotificationPreferencesResponse
from services.notification_service import NotificationService
from sqlalchemy import func

router = APIRouter(tags=["notification_preferences"])


@router.get("/preferences", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's notification preferences"""
    preferences = NotificationService.get_user_preferences(db, current_user.id)

    if not preferences:
        # Create default preferences if none exist
        preferences = NotificationService.create_default_preferences(
            db, current_user.id)

    return NotificationPreferencesResponse(
        id=preferences.id,
        user_id=preferences.user_id,
        course_notifications=preferences.course_notifications,
        application_notifications=preferences.application_notifications,
        stream_notifications=preferences.stream_notifications,
        document_notifications=preferences.document_notifications,
        system_notifications=preferences.system_notifications,
        achievement_notifications=preferences.achievement_notifications,
        low_priority=preferences.low_priority,
        normal_priority=preferences.normal_priority,
        high_priority=preferences.high_priority,
        urgent_priority=preferences.urgent_priority,
        email_notifications=preferences.email_notifications,
        push_notifications=preferences.push_notifications,
        in_app_notifications=preferences.in_app_notifications,
        notification_frequency=preferences.notification_frequency,
        enrolled_courses_only=preferences.enrolled_courses_only,
        instructor_courses_only=preferences.instructor_courses_only,
        quiet_hours_start=preferences.quiet_hours_start,
        quiet_hours_end=preferences.quiet_hours_end,
        created_at=preferences.created_at,
        updated_at=preferences.updated_at
    )


@router.put("/preferences", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    preferences_data: NotificationPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's notification preferences"""
    preferences = NotificationService.get_user_preferences(db, current_user.id)

    if not preferences:
        # Create default preferences if none exist
        preferences = NotificationService.create_default_preferences(
            db, current_user.id)

    # Update fields if provided
    if preferences_data.course_notifications is not None:
        preferences.course_notifications = preferences_data.course_notifications
    if preferences_data.application_notifications is not None:
        preferences.application_notifications = preferences_data.application_notifications
    if preferences_data.stream_notifications is not None:
        preferences.stream_notifications = preferences_data.stream_notifications
    if preferences_data.document_notifications is not None:
        preferences.document_notifications = preferences_data.document_notifications
    if preferences_data.system_notifications is not None:
        preferences.system_notifications = preferences_data.system_notifications
    if preferences_data.achievement_notifications is not None:
        preferences.achievement_notifications = preferences_data.achievement_notifications

    if preferences_data.low_priority is not None:
        preferences.low_priority = preferences_data.low_priority
    if preferences_data.normal_priority is not None:
        preferences.normal_priority = preferences_data.normal_priority
    if preferences_data.high_priority is not None:
        preferences.high_priority = preferences_data.high_priority
    if preferences_data.urgent_priority is not None:
        preferences.urgent_priority = preferences_data.urgent_priority

    if preferences_data.email_notifications is not None:
        preferences.email_notifications = preferences_data.email_notifications
    if preferences_data.push_notifications is not None:
        preferences.push_notifications = preferences_data.push_notifications
    if preferences_data.in_app_notifications is not None:
        preferences.in_app_notifications = preferences_data.in_app_notifications

    if preferences_data.notification_frequency is not None:
        preferences.notification_frequency = preferences_data.notification_frequency
    if preferences_data.enrolled_courses_only is not None:
        preferences.enrolled_courses_only = preferences_data.enrolled_courses_only
    if preferences_data.instructor_courses_only is not None:
        preferences.instructor_courses_only = preferences_data.instructor_courses_only

    if preferences_data.quiet_hours_start is not None:
        preferences.quiet_hours_start = preferences_data.quiet_hours_start
    if preferences_data.quiet_hours_end is not None:
        preferences.quiet_hours_end = preferences_data.quiet_hours_end

    preferences.updated_at = func.now()

    db.commit()
    db.refresh(preferences)

    return NotificationPreferencesResponse(
        id=preferences.id,
        user_id=preferences.user_id,
        course_notifications=preferences.course_notifications,
        application_notifications=preferences.application_notifications,
        stream_notifications=preferences.stream_notifications,
        document_notifications=preferences.document_notifications,
        system_notifications=preferences.system_notifications,
        achievement_notifications=preferences.achievement_notifications,
        low_priority=preferences.low_priority,
        normal_priority=preferences.normal_priority,
        high_priority=preferences.high_priority,
        urgent_priority=preferences.urgent_priority,
        email_notifications=preferences.email_notifications,
        push_notifications=preferences.push_notifications,
        in_app_notifications=preferences.in_app_notifications,
        notification_frequency=preferences.notification_frequency,
        enrolled_courses_only=preferences.enrolled_courses_only,
        instructor_courses_only=preferences.instructor_courses_only,
        quiet_hours_start=preferences.quiet_hours_start,
        quiet_hours_end=preferences.quiet_hours_end,
        created_at=preferences.created_at,
        updated_at=preferences.updated_at
    )


@router.post("/preferences/reset")
async def reset_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset user's notification preferences to defaults"""
    # Delete existing preferences
    existing_preferences = NotificationService.get_user_preferences(
        db, current_user.id)
    if existing_preferences:
        db.delete(existing_preferences)
        db.commit()

    # Create new default preferences
    preferences = NotificationService.create_default_preferences(
        db, current_user.id)

    return {
        "success": True,
        "message": "Notification preferences reset to defaults"
    }
