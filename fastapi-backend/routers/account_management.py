from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
import json
import os
import zipfile
from typing import List, Optional
import uuid

from database import get_db
from models import (
    User, AccountDeletionSchedule, UserDataExport, Course, Enrollment,
    Application, LiveStream, CourseDocument, Notification, ChatSession,
    ChatMessage, UserStatistics, LearningActivity, StreamParticipant,
    StreamChatMessage, Question, QuestionAnswer, GeneratedQuestion,
    QuizSession, SummaryAccess, UserNotificationPreferences
)
from auth import get_current_user, get_current_active_user
from schemas import SuccessResponse

router = APIRouter(prefix="/account", tags=["Account Management"])


# Pydantic models for request/response


class SoftDeleteRequest(BaseModel):
    reason: Optional[str] = None


class ScheduleDeletionRequest(BaseModel):
    scheduled_date: datetime
    deletion_type: str = "hard"  # hard, soft
    reason: Optional[str] = None
    notify_before_deletion: bool = True
    notification_days_before: int = 7


class CancelDeletionRequest(BaseModel):
    reason: Optional[str] = None


class DataExportRequest(BaseModel):
    export_type: str = "full"  # full, profile, learning_data, documents
    include_sensitive_data: bool = False
    data_format: str = "json"  # json, csv, pdf


class DeletionScheduleResponse(BaseModel):
    id: int
    scheduled_deletion_date: datetime
    deletion_type: str
    reason: Optional[str]
    status: str
    created_at: datetime


class DataExportResponse(BaseModel):
    id: int
    export_type: str
    status: str
    progress_percentage: int
    download_url: Optional[str]
    expires_at: Optional[datetime]
    created_at: datetime


@router.post("/soft-delete", response_model=SuccessResponse)
async def soft_delete_account(
    request: SoftDeleteRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Soft delete user account (reversible)"""
    try:
        # Check if user is an admin and prevent soft deletion of last admin
        if current_user.role in ["admin", "super_admin"]:
            admin_count = db.query(User).filter(
                and_(
                    User.role.in_(["admin", "super_admin"]),
                    User.is_deleted == False
                )
            ).count()

            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot soft delete the last administrator account"
                )

        # Soft delete the user
        current_user.is_deleted = True
        current_user.deleted_at = func.now()
        current_user.deletion_reason = request.reason
        current_user.deletion_type = "soft"
        current_user.is_active = False

        # Cancel any pending deletion schedules
        db.query(AccountDeletionSchedule).filter(
            and_(
                AccountDeletionSchedule.user_id == current_user.id,
                AccountDeletionSchedule.status == "scheduled"
            )
        ).update({
            "status": "cancelled",
            "cancelled_at": func.now(),
            "cancellation_reason": "Account soft deleted"
        })

        db.commit()

        return SuccessResponse(
            success=True,
            message="Account soft deleted successfully. You can reactivate it within 30 days."
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to soft delete account: {str(e)}"
        )


@router.post("/reactivate", response_model=SuccessResponse)
async def reactivate_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reactivate a soft-deleted account"""
    try:
        if not current_user.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is not soft deleted"
            )

        # Check if 30 days have passed since deletion
        if current_user.deleted_at and (datetime.utcnow() - current_user.deleted_at).days > 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account cannot be reactivated after 30 days"
            )

        # Reactivate the account
        current_user.is_deleted = False
        current_user.deleted_at = None
        current_user.deletion_reason = None
        current_user.deletion_type = None
        current_user.is_active = True

        db.commit()

        return SuccessResponse(
            success=True,
            message="Account reactivated successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reactivate account: {str(e)}"
        )


@router.post("/schedule-deletion", response_model=DeletionScheduleResponse)
async def schedule_account_deletion(
    request: ScheduleDeletionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Schedule account deletion for a future date"""
    try:
        if request.scheduled_date <= datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Scheduled deletion date must be in the future"
            )

        existing_schedule = db.query(AccountDeletionSchedule).filter(
            and_(
                AccountDeletionSchedule.user_id == current_user.id,
                AccountDeletionSchedule.status == "scheduled"
            )
        ).first()

        if existing_schedule:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account already has a scheduled deletion"
            )

        deletion_schedule = AccountDeletionSchedule(
            user_id=current_user.id,
            scheduled_deletion_date=request.scheduled_date,
            deletion_type=request.deletion_type,
            reason=request.reason,
            notify_before_deletion=request.notify_before_deletion,
            notification_days_before=request.notification_days_before
        )

        db.add(deletion_schedule)
        db.commit()
        db.refresh(deletion_schedule)

        return DeletionScheduleResponse(
            id=deletion_schedule.id,
            scheduled_deletion_date=deletion_schedule.scheduled_deletion_date,
            deletion_type=deletion_schedule.deletion_type,
            reason=deletion_schedule.reason,
            status=deletion_schedule.status,
            created_at=deletion_schedule.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule account deletion: {str(e)}"
        )


@router.get("/deletion-schedule", response_model=Optional[DeletionScheduleResponse])
async def get_deletion_schedule(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's deletion schedule"""
    try:
        schedule = db.query(AccountDeletionSchedule).filter(
            and_(
                AccountDeletionSchedule.user_id == current_user.id,
                AccountDeletionSchedule.status == "scheduled"
            )
        ).first()

        if not schedule:
            return None

        return DeletionScheduleResponse(
            id=schedule.id,
            scheduled_deletion_date=schedule.scheduled_deletion_date,
            deletion_type=schedule.deletion_type,
            reason=schedule.reason,
            status=schedule.status,
            created_at=schedule.created_at
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get deletion schedule: {str(e)}"
        )


@router.post("/cancel-deletion", response_model=SuccessResponse)
async def cancel_scheduled_deletion(
    request: CancelDeletionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel scheduled account deletion"""
    try:
        schedule = db.query(AccountDeletionSchedule).filter(
            and_(
                AccountDeletionSchedule.user_id == current_user.id,
                AccountDeletionSchedule.status == "scheduled"
            )
        ).first()

        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No scheduled deletion found"
            )

        schedule.status = "cancelled"
        schedule.cancelled_at = func.now()
        schedule.cancellation_reason = request.reason

        db.commit()

        return SuccessResponse(
            success=True,
            message="Scheduled deletion cancelled successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel scheduled deletion: {str(e)}"
        )


@router.post("/export-data", response_model=DataExportResponse)
async def request_data_export(
    request: DataExportRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Request user data export"""
    try:
        existing_export = db.query(UserDataExport).filter(
            and_(
                UserDataExport.user_id == current_user.id,
                UserDataExport.status.in_(["pending", "processing"])
            )
        ).first()

        if existing_export:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Data export already in progress"
            )

        export_record = UserDataExport(
            user_id=current_user.id,
            export_type=request.export_type,
            include_sensitive_data=request.include_sensitive_data,
            data_format=request.data_format
        )

        db.add(export_record)
        db.commit()
        db.refresh(export_record)

        return DataExportResponse(
            id=export_record.id,
            export_type=export_record.export_type,
            status=export_record.status,
            progress_percentage=export_record.progress_percentage,
            download_url=export_record.download_url,
            expires_at=export_record.expires_at,
            created_at=export_record.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to request data export: {str(e)}"
        )


@router.get("/export-status/{export_id}", response_model=DataExportResponse)
async def get_export_status(
    export_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get data export status"""
    try:
        export_record = db.query(UserDataExport).filter(
            and_(
                UserDataExport.id == export_id,
                UserDataExport.user_id == current_user.id
            )
        ).first()

        if not export_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export not found"
            )

        return DataExportResponse(
            id=export_record.id,
            export_type=export_record.export_type,
            status=export_record.status,
            progress_percentage=export_record.progress_percentage,
            download_url=export_record.download_url,
            expires_at=export_record.expires_at,
            created_at=export_record.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get export status: {str(e)}"
        )
