from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import uuid
from pathlib import Path
import asyncio
import time

from database import get_db
from models import User, ChatSession, ChatMessage, Course
from schemas import (
    ChatSessionCreate, ChatSessionResponse, ChatMessageResponse,
    ChatbotRequest, ChatbotResponse, CourseAnalysisRequest, CourseAnalysisResponse
)
from auth import get_current_user
from services.gemini_service import gemini_service

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.get("/status")
async def get_echo_status():
    """Get ECHO system status and configuration"""
    try:
        # Add timeout protection for status check
        status_info = await asyncio.wait_for(
            asyncio.to_thread(gemini_service.get_echo_status),
            timeout=10.0
        )
        return {
            "status": "success",
            "data": status_info,
            "message": "ECHO status retrieved successfully"
        }
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ECHO status check timed out. The service may be experiencing high demand."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get ECHO status: {str(e)}"
        )


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat session"""
    try:
        # Verify course exists if provided
        if session_data.course_id:
            course = db.query(Course).filter(
                Course.id == session_data.course_id).first()
            if not course:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Course not found"
                )

        # Create new session
        db_session = ChatSession(
            user_id=current_user.id,
            course_id=session_data.course_id,
            session_name=session_data.session_name
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)

        return ChatSessionResponse(
            id=db_session.id,
            user_id=db_session.user_id,
            course_id=db_session.course_id,
            session_name=db_session.session_name,
            is_active=db_session.is_active,
            created_at=db_session.created_at,
            updated_at=db_session.updated_at,
            message_count=0
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat session: {str(e)}"
        )


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chat sessions for the current user"""
    try:
        sessions = db.query(ChatSession).filter(
            ChatSession.user_id == current_user.id,
            ChatSession.is_active == True
        ).order_by(ChatSession.updated_at.desc()).all()

        session_responses = []
        for session in sessions:
            message_count = db.query(ChatMessage).filter(
                ChatMessage.session_id == session.id
            ).count()

            session_responses.append(ChatSessionResponse(
                id=session.id,
                user_id=session.user_id,
                course_id=session.course_id,
                session_name=session.session_name,
                is_active=session.is_active,
                created_at=session.created_at,
                updated_at=session.updated_at,
                message_count=message_count
            ))

        return session_responses
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chat sessions: {str(e)}"
        )


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages for a specific chat session"""
    try:
        # Verify session belongs to user
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        ).first()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )

        messages = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.timestamp.asc()).all()

        return [
            ChatMessageResponse(
                id=msg.id,
                session_id=msg.session_id,
                role=msg.role,
                content=msg.content,
                timestamp=msg.timestamp,
                metadata=msg.message_metadata
            )
            for msg in messages
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chat messages: {str(e)}"
        )


@router.post("/chat", response_model=ChatbotResponse)
async def chat_with_ai(
    request: ChatbotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to ECHO and get a response"""
    try:
        # Check ECHO status first
        echo_status = gemini_service.get_echo_status()
        if not echo_status.get('model_available'):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ECHO AI service is currently unavailable. Please try again later."
            )

        # Get or create session
        if request.session_id:
            session = db.query(ChatSession).filter(
                ChatSession.id == request.session_id,
                ChatSession.user_id == current_user.id
            ).first()
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat session not found"
                )
        else:
            # Create new session
            session = ChatSession(
                user_id=current_user.id,
                course_id=request.course_id,
                session_name=f"ECHO Chat - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            )
            db.add(session)
            db.commit()
            db.refresh(session)

        # Get course info if course_id is provided
        course_info = None
        if request.course_id:
            course = db.query(Course).filter(
                Course.id == request.course_id).first()
            if course:
                course_info = {
                    'title': course.title,
                    'description': course.description,
                    'credits': course.credits
                }

        # Get conversation history
        history = db.query(ChatMessage).filter(
            ChatMessage.session_id == session.id
        ).order_by(ChatMessage.timestamp.desc()).limit(10).all()

        conversation_history = [
            {
                'role': msg.role,
                'content': msg.content
            }
            for msg in reversed(history)  # Reverse to get chronological order
        ]

        # Save user message
        user_message = ChatMessage(
            session_id=session.id,
            role="user",
            content=request.message
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)

        # Get ECHO response with course context
        # Add timeout protection for ECHO response
        try:
            # Set a timeout for the ECHO response (30 seconds)
            echo_response = await asyncio.wait_for(
                asyncio.to_thread(
                    gemini_service.chat_with_context,
                    message=request.message,
                    course_id=request.course_id,
                    conversation_history=conversation_history,
                    course_info=course_info,
                    db_session=db
                ),
                timeout=30.0
            )
        except asyncio.TimeoutError:
            # If ECHO times out, return a helpful error message
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ECHO is taking longer than expected to respond. This may be due to high demand on Google's servers. Please try again in a moment."
            )
        except Exception as e:
            # Handle other ECHO errors
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"ECHO encountered an error: {str(e)}. Please try again later."
            )

        # Save ECHO response
        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=echo_response['response'],
            message_metadata={
                'course_content_used': echo_response.get('course_content_used', False),
                'content_files_count': echo_response.get('content_files_count', 0),
                'success': echo_response.get('success', False),
                'model_used': echo_response.get('model_used', 'unknown'),
                'tokens_used': echo_response.get('tokens_used', None)
            }
        )
        db.add(assistant_message)

        # Update session timestamp
        session.updated_at = datetime.now()

        db.commit()
        db.refresh(assistant_message)

        return ChatbotResponse(
            response=echo_response['response'],
            session_id=session.id,
            message_id=assistant_message.id,
            timestamp=assistant_message.timestamp,
            course_content_used=echo_response.get(
                'course_content_used', False),
            content_files_count=echo_response.get('content_files_count', 0),
            metadata=assistant_message.message_metadata
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )


@router.post("/send", response_model=ChatbotResponse)
async def send_chat_message(
    request: ChatbotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to ECHO (alias for /chat endpoint)"""
    # Redirect to the existing chat endpoint
    return await chat_with_ai(request, current_user, db)


@router.post("/analyze-course", response_model=CourseAnalysisResponse)
async def analyze_course_content(
    request: CourseAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze course content and provide insights"""
    try:
        # Check if analytics is enabled
        echo_status = gemini_service.get_echo_status()
        if not echo_status.get('analytics_enabled'):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ECHO analytics is currently disabled"
            )

        # Verify course exists
        course = db.query(Course).filter(
            Course.id == request.course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )

        # Analyze course content using ECHO
        analysis = gemini_service.analyze_course_content(request.course_id)

        if analysis['success']:
            return CourseAnalysisResponse(
                analysis=analysis['analysis'],
                content_count=analysis['content_count'],
                file_types=analysis['file_types'],
                success=True
            )
        else:
            return CourseAnalysisResponse(
                analysis="",
                content_count=0,
                file_types=[],
                success=False,
                error=analysis.get('error', 'Unknown error')
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze course content: {str(e)}"
        )


@router.post("/chat-with-files", response_model=ChatbotResponse)
async def chat_with_files(
    session_id: int = Form(...),
    message: str = Form(...),
    course_id: Optional[int] = Form(None),
    files: List[UploadFile] = File([]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with ECHO using uploaded files (images, documents, etc.)"""
    try:
        # Verify session exists and belongs to user
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
            ChatSession.is_active == True
        ).first()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )

        # Create uploads directory if it doesn't exist
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)

        # Process uploaded files
        file_info = []
        for file in files:
            if file.filename:
                # Generate unique filename
                file_extension = Path(file.filename).suffix
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                file_path = uploads_dir / unique_filename

                # Save file
                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)

                file_info.append({
                    "original_name": file.filename,
                    "saved_path": str(file_path),
                    "file_size": len(content),
                    "content_type": file.content_type
                })

        # Get course info if course_id is provided
        course_info = None
        if course_id:
            course = db.query(Course).filter(Course.id == course_id).first()
            if course:
                course_info = {
                    "title": course.title,
                    "description": course.description,
                    "credits": getattr(course, 'credits', None)
                }

        # Process message with files using ECHO
        response = gemini_service.chat_with_files(
            message=message,
            files=file_info,
            course_id=course_id,
            conversation_history=None,  # Could be enhanced to include history
            course_info=course_info,
            db_session=db
        )

        if response.get('success', False):
            # Save user message
            user_message = ChatMessage(
                session_id=session_id,
                role='user',
                content=message,
                metadata={
                    'files_uploaded': len(file_info),
                    'file_names': [f['original_name'] for f in file_info]
                }
            )
            db.add(user_message)

            # Save assistant response
            assistant_message = ChatMessage(
                session_id=session_id,
                role='assistant',
                content=response['response'],
                metadata={
                    'course_content_used': response.get('course_content_used', False),
                    'content_files_count': response.get('content_files_count', 0),
                    'files_processed': len(file_info)
                }
            )
            db.add(assistant_message)

            # Update session
            session.updated_at = datetime.utcnow()
            db.commit()

            return ChatbotResponse(
                response=response['response'],
                success=True,
                course_content_used=response.get('course_content_used', False),
                content_files_count=response.get('content_files_count', 0),
                files_processed=len(file_info)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=response.get(
                    'error', 'Failed to process message with files')
            )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message with files: {str(e)}"
        )


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat session (soft delete)"""
    try:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        ).first()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )

        session.is_active = False
        db.commit()

        return {"message": "ECHO chat session deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete chat session: {str(e)}"
        )


@router.post("/sessions/{session_id}/rename")
async def rename_chat_session(
    session_id: int,
    new_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rename a chat session"""
    try:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        ).first()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )

        session.session_name = new_name
        session.updated_at = datetime.now()
        db.commit()

        return {"message": "ECHO chat session renamed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rename chat session: {str(e)}"
        )
