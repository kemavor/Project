from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import User, ChatSession, ChatMessage, Course
from schemas import (
    ChatSessionCreate, ChatSessionResponse, ChatMessageResponse,
    ChatbotRequest, ChatbotResponse, CourseAnalysisRequest, CourseAnalysisResponse
)
from auth import get_current_user
from services.gemini_service import gemini_service

router = APIRouter(tags=["chatbot"])


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
    """Send a message to the AI chatbot and get a response"""
    try:
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
                session_name=f"Chat - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
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

        # Get AI response with course context
        ai_response = gemini_service.chat_with_context(
            message=request.message,
            course_id=request.course_id,
            conversation_history=conversation_history
        )

        # Save AI response
        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=ai_response['response'],
            message_metadata={
                'course_content_used': ai_response.get('course_content_used', False),
                'content_files_count': ai_response.get('content_files_count', 0),
                'success': ai_response.get('success', False)
            }
        )
        db.add(assistant_message)

        # Update session timestamp
        session.updated_at = datetime.now()

        db.commit()
        db.refresh(assistant_message)

        return ChatbotResponse(
            response=ai_response['response'],
            session_id=session.id,
            message_id=assistant_message.id,
            timestamp=assistant_message.timestamp,
            course_content_used=ai_response.get('course_content_used', False),
            content_files_count=ai_response.get('content_files_count', 0),
            metadata=assistant_message.message_metadata
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )


@router.post("/analyze-course", response_model=CourseAnalysisResponse)
async def analyze_course_content(
    request: CourseAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze course content and provide insights"""
    try:
        # Verify course exists
        course = db.query(Course).filter(
            Course.id == request.course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )

        # Analyze course content using Gemini
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

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze course content: {str(e)}"
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

        return {"message": "Chat session deleted successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete chat session: {str(e)}"
        )
