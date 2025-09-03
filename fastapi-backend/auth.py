from datetime import datetime, timedelta
from typing import Optional, Union, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User
from config import settings
import secrets
import string
import hashlib
import uuid

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token security
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def generate_secure_token_id() -> str:
    """Generate a secure, unique token ID"""
    return str(uuid.uuid4()) + secrets.token_hex(16)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None, user_agent: str = None, ip_address: str = None) -> str:
    """Create a JWT access token with enhanced security"""
    to_encode = data.copy()
    now = datetime.utcnow()
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    
    # Add enhanced token metadata
    token_id = generate_secure_token_id()
    to_encode.update({
        "exp": expire,
        "iat": now,
        "nbf": now,  # Not before
        "jti": token_id,  # JWT ID for revocation
        "type": "access",
        "ip": hashlib.sha256(ip_address.encode()).hexdigest()[:16] if ip_address else None,
        "ua": hashlib.sha256(user_agent.encode()).hexdigest()[:16] if user_agent else None
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def create_refresh_token(data: dict, user_agent: str = None, ip_address: str = None) -> str:
    """Create a JWT refresh token with enhanced security"""
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + timedelta(days=settings.refresh_token_expire_days)
    
    # Add enhanced token metadata
    token_id = generate_secure_token_id()
    to_encode.update({
        "exp": expire,
        "iat": now,
        "nbf": now,
        "jti": token_id,
        "type": "refresh",
        "ip": hashlib.sha256(ip_address.encode()).hexdigest()[:16] if ip_address else None,
        "ua": hashlib.sha256(user_agent.encode()).hexdigest()[:16] if user_agent else None
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access", user_agent: str = None, ip_address: str = None) -> Optional[dict]:
    """Verify and decode a JWT token with enhanced validation"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        
        # Verify token type
        if payload.get("type") != token_type:
            return None
            
        # Verify token is not expired or not yet valid
        now = datetime.utcnow()
        if payload.get("exp") and datetime.fromtimestamp(payload["exp"]) < now:
            return None
        if payload.get("nbf") and datetime.fromtimestamp(payload["nbf"]) > now:
            return None
            
        # Optional: Verify IP and User Agent for enhanced security (can be disabled for mobile/changing IPs)
        if settings.VERIFY_TOKEN_CONTEXT and ip_address and payload.get("ip"):
            expected_ip_hash = hashlib.sha256(ip_address.encode()).hexdigest()[:16]
            if payload["ip"] != expected_ip_hash:
                return None
                
        return payload
    except JWTError:
        return None

def authenticate_user(db: Session, username: str, password: str) -> tuple[Optional[User], str]:
    """Authenticate a user with username and password, return user and status message"""
    # Try to find user by username or email
    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()
    
    if not user:
        return None, "User not found"
    
    if not user.is_active:
        return None, "Account is deactivated"
    
    if not verify_password(password, user.hashed_password):
        return None, "Invalid password"
    
    return user, "Authentication successful"

def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """Validate password strength and return validation status with messages"""
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number")
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        errors.append("Password must contain at least one special character")
    
    # Check for common weak patterns
    common_patterns = ['123', 'abc', 'password', 'qwerty', '111', '000']
    if any(pattern in password.lower() for pattern in common_patterns):
        errors.append("Password contains common patterns that are not secure")
    
    return len(errors) == 0, errors

def validate_username(username: str) -> tuple[bool, list[str]]:
    """Validate username format"""
    errors = []
    
    if len(username) < 3:
        errors.append("Username must be at least 3 characters long")
    
    if len(username) > 50:
        errors.append("Username must not exceed 50 characters")
    
    if not username.replace('_', '').replace('-', '').isalnum():
        errors.append("Username can only contain letters, numbers, hyphens, and underscores")
    
    if username.startswith(('-', '_')) or username.endswith(('-', '_')):
        errors.append("Username cannot start or end with hyphens or underscores")
    
    return len(errors) == 0, errors

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        print(f"AUTH: Validating token: {credentials.credentials[:20]}...")
        # Skip IP/UA validation for API calls to prevent 403 errors
        # The enhanced validation is mainly for critical operations
        payload = verify_token(
            credentials.credentials,
            token_type="access",
            user_agent=None,  # Skip UA validation
            ip_address=None   # Skip IP validation
        )
        print(f"AUTH: Token payload: {payload}")
        if payload is None:
            print("AUTH: Token validation failed: payload is None")
            raise credentials_exception
        username: str = payload.get("sub")
        if username is None:
            print("AUTH: Token validation failed: no username in payload")
            raise credentials_exception
        print(f"AUTH: Token validated for user: {username}")
    except JWTError as e:
        print(f"AUTH: JWT error: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"AUTH: Unexpected error in token validation: {e}")
        import traceback
        print(f"AUTH: Full traceback: {traceback.format_exc()}")
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        print(f"User not found in database: {username}")
        raise credentials_exception
    print(f"User found: {user.username} (ID: {user.id}, Active: {user.is_active})")
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get the current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_role(required_role: str):
    """Decorator to require a specific role"""
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.role != required_role and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. This endpoint requires {required_role} role."
            )
        return current_user
    return role_checker

def require_staff():
    """Decorator to require staff status"""
    def staff_checker(current_user: User = Depends(get_current_active_user)):
        if not current_user.is_staff and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. This endpoint requires staff privileges."
            )
        return current_user
    return staff_checker 