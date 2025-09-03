from pydantic import BaseModel, validator
from typing import Optional
from config import settings
from auth import (
    authenticate_user, get_password_hash, create_access_token,
    create_refresh_token, get_current_active_user, verify_token,
    validate_password_strength, validate_username
)
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User, Course, LiveStream, Application, Enrollment
from schemas import (
    UserCreate, UserResponse, LoginRequest, LoginResponse,
    UserUpdate, ErrorResponse, SuccessResponse
)
import re
import sys
import os
import secrets
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


router = APIRouter(prefix="/auth", tags=["authentication"])


class RefreshTokenRequest(BaseModel):
    refresh_token: str


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def is_account_locked(user: User) -> bool:
    """Check if user account is locked due to failed login attempts"""
    if not user.locked_until:
        return False
    return datetime.utcnow() < user.locked_until

def handle_failed_login(db: Session, user: User) -> None:
    """Handle failed login attempt - increment counter and lock if needed"""
    user.failed_login_attempts += 1
    
    if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
        user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
    
    db.commit()

def reset_login_attempts(db: Session, user: User, ip_address: str) -> None:
    """Reset failed login attempts on successful login"""
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    user.last_login_ip = ip_address
    db.commit()

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Authenticate user and return JWT tokens with enhanced security"""
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")
    
    try:
        # Input validation
        if not login_data.username or not login_data.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Missing credentials",
                    "errors": ["Username and password are required"],
                    "type": "validation_error"
                }
            )

        # Authenticate user (returns user and status message)
        user, auth_message = authenticate_user(db, login_data.username, login_data.password)

        if not user:
            # Check if we found a user to increment failed attempts
            potential_user = db.query(User).filter(
                (User.username == login_data.username) | (User.email == login_data.username)
            ).first()
            
            if potential_user:
                handle_failed_login(db, potential_user)
                
                # Provide specific error messages
                remaining_attempts = settings.MAX_LOGIN_ATTEMPTS - potential_user.failed_login_attempts
                if potential_user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail={
                            "message": "Account temporarily locked",
                            "errors": [f"Too many failed login attempts. Account locked for {settings.LOGIN_LOCKOUT_MINUTES} minutes."],
                            "type": "account_locked",
                            "locked_until": potential_user.locked_until.isoformat() if potential_user.locked_until else None
                        }
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail={
                            "message": auth_message,
                            "errors": [f"Invalid credentials. {remaining_attempts} attempts remaining."],
                            "type": "authentication_failed",
                            "remaining_attempts": remaining_attempts
                        }
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "message": "Invalid credentials",
                        "errors": ["No account found with these credentials"],
                        "type": "authentication_failed"
                    }
                )

        # Check if account is locked
        if is_account_locked(user):
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail={
                    "message": "Account temporarily locked",
                    "errors": [f"Account locked due to multiple failed login attempts. Try again after {user.locked_until.strftime('%Y-%m-%d %H:%M:%S')}"],
                    "type": "account_locked",
                    "locked_until": user.locked_until.isoformat()
                }
            )

        # Check if account is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": "Account deactivated",
                    "errors": ["Your account has been deactivated. Please contact support."],
                    "type": "account_deactivated"
                }
            )

        # Check role if specified
        if login_data.role and user.role != login_data.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": "Access denied",
                    "errors": [f"This login portal is for {login_data.role.title()}s only. Your account is registered as a {user.role.title()}."],
                    "type": "role_mismatch",
                    "user_role": user.role,
                    "required_role": login_data.role
                }
            )

        # Successful authentication - reset failed attempts and update login info
        reset_login_attempts(db, user, client_ip)

        # Create enhanced tokens with security metadata
        access_token = create_access_token(
            data={"sub": user.username, "user_id": user.id, "role": user.role},
            user_agent=user_agent,
            ip_address=client_ip
        )
        refresh_token = create_refresh_token(
            data={"sub": user.username, "user_id": user.id, "role": user.role},
            user_agent=user_agent,
            ip_address=client_ip
        )

        # Prepare user data
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_staff": user.is_staff,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email_verified": user.email_verified,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }

        return LoginResponse(
            success=True,
            message=f"Welcome back, {user.first_name or user.username}! Login successful.",
            data={"user": user_data},
            token=access_token,
            refresh=refresh_token
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")  # Log the error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Login service temporarily unavailable",
                "errors": ["Please try again in a few moments. If the problem persists, contact support."],
                "type": "server_error"
            }
        )


def validate_email_format(email: str) -> bool:
    """Validate email format using regex"""
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_pattern, email) is not None

@router.post("/register", response_model=SuccessResponse)
async def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user with comprehensive validation"""
    client_ip = get_client_ip(request)
    validation_errors = []
    
    try:
        # Comprehensive input validation
        
        # Validate username
        if not user_data.username:
            validation_errors.append("Username is required")
        else:
            username_valid, username_errors = validate_username(user_data.username)
            if not username_valid:
                validation_errors.extend(username_errors)
        
        # Validate email
        if not user_data.email:
            validation_errors.append("Email is required")
        elif not validate_email_format(user_data.email):
            validation_errors.append("Please enter a valid email address")
        
        # Validate password
        if not user_data.password:
            validation_errors.append("Password is required")
        elif settings.REQUIRE_PASSWORD_COMPLEXITY:
            password_valid, password_errors = validate_password_strength(user_data.password)
            if not password_valid:
                validation_errors.extend(password_errors)
        
        # Validate names
        if not user_data.first_name or len(user_data.first_name.strip()) < 2:
            validation_errors.append("First name must be at least 2 characters long")
        
        if not user_data.last_name or len(user_data.last_name.strip()) < 2:
            validation_errors.append("Last name must be at least 2 characters long")
        
        # Validate role
        valid_roles = ['student', 'teacher', 'admin']
        if user_data.role not in valid_roles:
            validation_errors.append(f"Role must be one of: {', '.join(valid_roles)}")
        
        # If there are validation errors, return them
        if validation_errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Registration validation failed",
                    "errors": validation_errors,
                    "type": "validation_error"
                }
            )
        
        # Check for existing username (case-insensitive)
        existing_user = db.query(User).filter(
            User.username.ilike(user_data.username.lower())
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Username not available",
                    "errors": ["This username is already taken. Please choose a different one."],
                    "type": "username_exists",
                    "field": "username"
                }
            )

        # Check for existing email (case-insensitive)
        existing_email = db.query(User).filter(
            User.email.ilike(user_data.email.lower())
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Email already registered",
                    "errors": ["An account with this email address already exists. Try logging in instead."],
                    "type": "email_exists",
                    "field": "email"
                }
            )

        # Create new user
        hashed_password = get_password_hash(user_data.password)
        
        # Generate email verification token
        verification_token = secrets.token_urlsafe(32)
        
        db_user = User(
            username=user_data.username.lower().strip(),
            email=user_data.email.lower().strip(),
            hashed_password=hashed_password,
            first_name=user_data.first_name.strip().title(),
            last_name=user_data.last_name.strip().title(),
            role=user_data.role,
            is_active=True,
            email_verified=False,  # Require email verification
            email_verification_token=verification_token,
            last_login_ip=client_ip,
            password_changed_at=datetime.utcnow()
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # TODO: Send verification email
        # await send_verification_email(db_user.email, verification_token)

        return SuccessResponse(
            success=True,
            message=f"Welcome to VisionWare, {db_user.first_name}! Your account has been created successfully.",
            data={
                "user_id": db_user.id,
                "username": db_user.username,
                "email": db_user.email,
                "requires_verification": not db_user.email_verified,
                "next_steps": [
                    "Check your email for a verification link",
                    "Complete your profile setup",
                    "Explore available courses"
                ]
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {str(e)}")  # Log the error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Registration service temporarily unavailable",
                "errors": ["Please try again in a few moments. If the problem persists, contact support."],
                "type": "server_error"
            }
        )


@router.get("/user", response_model=dict)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    try:
        user_data = {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "is_staff": current_user.is_staff,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "bio": current_user.bio,
            "age": current_user.age,
            "profile_picture": current_user.profile_picture,
            "created_at": current_user.created_at,
            "last_login": current_user.last_login
        }

        return {
            "success": True,
            "data": user_data
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )


@router.put("/user", response_model=SuccessResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    try:
        # Update user fields
        update_data = user_update.dict(exclude_unset=True)

        for field, value in update_data.items():
            setattr(current_user, field, value)

        current_user.updated_at = datetime.utcnow()
        db.commit()

        return SuccessResponse(
            success=True,
            message="Profile updated successfully"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.post("/refresh", response_model=dict)
async def refresh_token(
    refresh_token_data: RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token with enhanced security"""
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")
    
    try:
        print(f"🔄 Refresh token request from IP: {client_ip}, UA: {user_agent[:50]}...")
        print(f"🔑 Refresh token received: {refresh_token_data.refresh_token[:20]}...")
        
        # Validate that refresh token exists
        if not refresh_token_data.refresh_token or refresh_token_data.refresh_token.strip() == "":
            print("❌ Empty or missing refresh token")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Refresh token required",
                    "errors": ["No refresh token provided"],
                    "type": "missing_token"
                }
            )
        
        # Verify refresh token with relaxed context validation for better UX
        # Skip IP/UA validation for refresh tokens to allow mobile/changing IPs
        payload = verify_token(
            refresh_token_data.refresh_token, 
            token_type="refresh",
            user_agent=None,  # Skip UA validation for refresh
            ip_address=None   # Skip IP validation for refresh
        )
        
        print(f"🔍 Refresh token payload: {payload}")
        
        if not payload:
            print("❌ Token verification failed - invalid or expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "message": "Invalid or expired refresh token",
                    "errors": ["Please log in again to continue"],
                    "type": "token_invalid"
                }
            )

        username = payload.get("sub")
        user_id = payload.get("user_id")
        
        # Verify user exists and is active
        user = db.query(User).filter(User.username == username, User.id == user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "message": "User not found",
                    "errors": ["The account associated with this token no longer exists"],
                    "type": "user_not_found"
                }
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": "Account deactivated",
                    "errors": ["Your account has been deactivated. Please contact support."],
                    "type": "account_deactivated"
                }
            )
        
        # Check if account is locked
        if is_account_locked(user):
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail={
                    "message": "Account temporarily locked",
                    "errors": [f"Account locked until {user.locked_until.strftime('%Y-%m-%d %H:%M:%S')}"],
                    "type": "account_locked",
                    "locked_until": user.locked_until.isoformat()
                }
            )

        # Create new access token with enhanced security
        new_access_token = create_access_token(
            data={"sub": username, "user_id": user.id, "role": user.role},
            user_agent=user_agent,
            ip_address=client_ip
        )
        
        # Optionally create new refresh token for token rotation
        new_refresh_token = create_refresh_token(
            data={"sub": username, "user_id": user.id, "role": user.role},
            user_agent=user_agent,
            ip_address=client_ip
        )

        # Update user's last activity
        user.last_login = datetime.utcnow()
        user.last_login_ip = client_ip
        db.commit()

        print(f"✅ Token refresh successful for user: {user.username}")

        return {
            "success": True,
            "message": "Token refreshed successfully",
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,  # Token rotation for enhanced security
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "email_verified": user.email_verified
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Token refresh error: {str(e)}")  # Log the error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Token refresh service temporarily unavailable",
                "errors": ["Please try logging in again"],
                "type": "server_error"
            }
        )


@router.post("/logout", response_model=SuccessResponse)
async def logout():
    """Logout user (client should discard tokens)"""
    return SuccessResponse(
        success=True,
        message="Logout successful"
    )


class DeleteAccountRequest(BaseModel):
    password: str


@router.post("/delete", response_model=SuccessResponse)
async def delete_account(
    delete_request: DeleteAccountRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete user account and all associated data"""
    try:
        # Verify password
        if not authenticate_user(db, current_user.username, delete_request.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )

        # Check if user is an admin and prevent self-deletion
        if current_user.role in ["admin", "super_admin"]:
            # Count total admin users
            admin_count = db.query(User).filter(
                User.role.in_(["admin", "super_admin"])
            ).count()

            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete the last administrator account"
                )

        # Delete associated data
        # 1. Delete course applications
        db.query(Application).filter(
            Application.student_id == current_user.id).delete()

        # 2. Delete course enrollments
        db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id).delete()

        # 3. Delete livestreams created by the user
        db.query(LiveStream).filter(
            LiveStream.instructor_id == current_user.id).delete()

        # 4. Delete courses created by the user (if they're a teacher)
        if current_user.role == "teacher":
            # First delete enrollments for courses created by this teacher
            teacher_courses = db.query(Course).filter(
                Course.instructor_id == current_user.id).all()
            for course in teacher_courses:
                db.query(Enrollment).filter(
                    Enrollment.course_id == course.id).delete()
                db.query(Application).filter(
                    Application.course_id == course.id).delete()

            # Then delete the courses
            db.query(Course).filter(
                Course.instructor_id == current_user.id).delete()

        # 5. Finally delete the user
        db.delete(current_user)
        db.commit()

        return SuccessResponse(
            success=True,
            message="Account deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )
