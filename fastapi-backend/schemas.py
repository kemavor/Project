from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from datetime import time


class RoleType(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

# User Schemas


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: RoleType = RoleType.STUDENT


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    profile_picture: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Authentication Schemas


class LoginRequest(BaseModel):
    username: str
    password: str
    role: Optional[RoleType] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginResponse(BaseModel):
    success: bool
    message: str
    data: dict
    token: str
    refresh: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Course Schemas


class CourseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    is_enrollment_open: bool = True
    credits: int = Field(0, ge=0)


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    is_enrollment_open: Optional[bool] = None
    credits: Optional[int] = Field(None, ge=0)


class CourseResponse(CourseBase):
    id: int
    instructor_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Lecture Schemas


class LectureBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    video_url: Optional[str] = None
    duration: Optional[int] = Field(None, ge=0)  # in minutes
    is_live: bool = False
    scheduled_at: Optional[datetime] = None
    status: str = "draft"


class LectureCreate(LectureBase):
    course_id: int


class LectureUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    video_url: Optional[str] = None
    duration: Optional[int] = Field(None, ge=0)
    is_live: Optional[bool] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None


class LectureResponse(LectureBase):
    id: int
    course_id: int
    instructor_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Application Schemas


class ApplicationBase(BaseModel):
    student_year: Optional[int] = Field(None, ge=1, le=10)
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    motivation_statement: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    student_year: Optional[int] = Field(None, ge=1, le=10)
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    motivation_statement: Optional[str] = None
    status: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    student_year: int
    gpa: float
    motivation_statement: str
    status: str
    created_at: datetime
    updated_at: datetime
    student: Optional[UserResponse] = None
    course: Optional[CourseResponse] = None

    class Config:
        from_attributes = True


class NotificationPreferencesUpdate(BaseModel):
    # Category preferences
    course_notifications: Optional[bool] = None
    application_notifications: Optional[bool] = None
    stream_notifications: Optional[bool] = None
    document_notifications: Optional[bool] = None
    system_notifications: Optional[bool] = None
    achievement_notifications: Optional[bool] = None

    # Priority preferences
    low_priority: Optional[bool] = None
    normal_priority: Optional[bool] = None
    high_priority: Optional[bool] = None
    urgent_priority: Optional[bool] = None

    # Delivery preferences
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    in_app_notifications: Optional[bool] = None

    # Frequency preferences
    notification_frequency: Optional[str] = None  # immediate, daily, weekly

    # Course-specific preferences
    enrolled_courses_only: Optional[bool] = None
    instructor_courses_only: Optional[bool] = None

    # Time preferences
    quiet_hours_start: Optional[time] = None
    quiet_hours_end: Optional[time] = None

    class Config:
        from_attributes = True


class NotificationPreferencesResponse(BaseModel):
    id: int
    user_id: int
    course_notifications: bool
    application_notifications: bool
    stream_notifications: bool
    document_notifications: bool
    system_notifications: bool
    achievement_notifications: bool
    low_priority: bool
    normal_priority: bool
    high_priority: bool
    urgent_priority: bool
    email_notifications: bool
    push_notifications: bool
    in_app_notifications: bool
    notification_frequency: str
    enrolled_courses_only: bool
    instructor_courses_only: bool
    quiet_hours_start: Optional[time] = None
    quiet_hours_end: Optional[time] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    category: str
    priority: str
    read: bool
    created_at: datetime
    updated_at: datetime
    related_course_id: Optional[int] = None
    related_application_id: Optional[int] = None
    related_stream_id: Optional[int] = None
    related_document_id: Optional[int] = None
    is_personalized: bool
    user_role_target: Optional[str] = None
    user_preferences_met: bool

    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"
    category: str = "general"
    priority: str = "normal"
    related_course_id: Optional[int] = None
    related_application_id: Optional[int] = None
    related_stream_id: Optional[int] = None
    related_document_id: Optional[int] = None


class EnrolledCourseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    instructor_id: int
    is_enrollment_open: bool
    credits: int
    created_at: datetime
    updated_at: datetime
    enrolled_at: datetime
    enrollment_status: str
    instructor: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Enrollment Schemas


class EnrollmentBase(BaseModel):
    status: str = "enrolled"


class EnrollmentCreate(EnrollmentBase):
    course_id: int


class EnrollmentUpdate(BaseModel):
    status: Optional[str] = None


class EnrollmentResponse(EnrollmentBase):
    id: int
    student_id: int
    course_id: int
    enrolled_at: datetime

    class Config:
        from_attributes = True

# Error Response Schema


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[dict] = None

# User Statistics Schemas


class UserStatisticsBase(BaseModel):
    lectures_attended: int = 0
    flashcards_reviewed: int = 0
    quizzes_completed: int = 0
    quiz_average_score: float = 0.0
    learning_streak_days: int = 0
    total_study_hours: float = 0.0
    courses_created: int = 0
    lectures_conducted: int = 0
    students_taught: int = 0
    average_rating: float = 0.0


class UserStatisticsResponse(UserStatisticsBase):
    id: int
    user_id: int
    last_activity: Optional[datetime] = None
    streak_start_date: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class LearningActivityBase(BaseModel):
    activity_type: str
    activity_id: Optional[int] = None
    duration_minutes: int = 0
    score: Optional[float] = None
    completed: bool = True


class LearningActivityCreate(LearningActivityBase):
    pass


class LearningActivityResponse(LearningActivityBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Success Response Schema


class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[dict] = None

# Livestream Schemas


class LiveLectureCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    course_id: int
    scheduled_at: Optional[datetime] = None


class LiveLectureUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None


class LiveLectureResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    course_id: int
    instructor_id: int
    is_live: bool
    status: str
    scheduled_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StreamSession(BaseModel):
    lecture_id: int
    instructor_id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    viewer_count: int = 0
    is_active: bool = True


class ChatMessage(BaseModel):
    id: str
    user: str
    message: str
    timestamp: datetime
    lecture_id: int


class ViewerStats(BaseModel):
    lecture_id: int
    viewer_count: int
    is_active: bool
    started_at: Optional[datetime] = None
    duration_minutes: int = 0


# Course Document Schemas
class CourseDocumentBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: bool = True


class CourseDocumentCreate(CourseDocumentBase):
    pass


class CourseDocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class CourseDocumentResponse(CourseDocumentBase):
    id: int
    course_id: int
    uploaded_by: int

    # File metadata
    filename: str
    original_filename: str
    file_size: int
    file_type: str
    mime_type: str

    # S3 metadata
    s3_key: str
    s3_bucket: str
    s3_url: Optional[str] = None
    cloudfront_url: Optional[str] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    success: bool
    message: str
    document: CourseDocumentResponse

# Live Streaming Schemas


class LiveStreamBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    course_id: int
    scheduled_at: Optional[datetime] = None
    max_viewers: int = Field(default=100, ge=1, le=1000)
    is_public: bool = True
    is_recording: bool = False
    quality_settings: Dict[str, Any] = Field(default_factory=dict)


class LiveStreamCreate(LiveStreamBase):
    pass


class LiveStreamUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    max_viewers: Optional[int] = Field(None, ge=1, le=1000)
    is_public: Optional[bool] = None
    is_recording: Optional[bool] = None
    quality_settings: Optional[Dict[str, Any]] = None


class LiveStreamResponse(LiveStreamBase):
    id: int
    instructor_id: int
    status: str
    stream_key: str
    stream_url: Optional[str] = None
    viewer_count: int
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration: int
    recording_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StreamParticipantBase(BaseModel):
    stream_id: int
    user_id: int
    is_moderator: bool = False
    can_chat: bool = True
    can_ask_questions: bool = True


class StreamParticipantCreate(StreamParticipantBase):
    pass


class StreamParticipantResponse(StreamParticipantBase):
    id: int
    joined_at: datetime
    left_at: Optional[datetime] = None
    duration_watched: int

    class Config:
        from_attributes = True


class StreamChatMessageBase(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    message_type: str = Field(
        default="text", pattern="^(text|system|announcement)$")


class StreamChatMessageCreate(StreamChatMessageBase):
    pass


class StreamChatMessageResponse(StreamChatMessageBase):
    id: int
    stream_id: int
    user_id: int
    is_visible: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StreamQuestionBase(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)


class StreamQuestionCreate(StreamQuestionBase):
    pass


class StreamQuestionUpdate(BaseModel):
    is_answered: Optional[bool] = None
    is_visible: Optional[bool] = None
    answer: Optional[str] = None


class StreamQuestionResponse(StreamQuestionBase):
    id: int
    stream_id: int
    user_id: int
    is_answered: bool
    is_visible: bool
    upvotes: int
    answered_at: Optional[datetime] = None
    answered_by: Optional[int] = None
    answer: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StreamAnalyticsResponse(BaseModel):
    id: int
    stream_id: int
    peak_viewers: int
    total_unique_viewers: int
    average_watch_time: float
    chat_messages_count: int
    questions_count: int
    engagement_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class StreamStartRequest(BaseModel):
    quality_settings: Optional[Dict[str, Any]] = None


class StreamStopRequest(BaseModel):
    reason: Optional[str] = None


class StreamJoinRequest(BaseModel):
    user_role: Optional[str] = "viewer"


class StreamLeaveRequest(BaseModel):
    pass


class StreamStatsResponse(BaseModel):
    stream_id: int
    current_viewers: int
    peak_viewers: int
    total_unique_viewers: int
    chat_messages_count: int
    questions_count: int
    average_watch_time: float
    engagement_score: float
    is_live: bool
    duration: int
    started_at: Optional[datetime] = None

# Chatbot Schemas


class ChatSessionBase(BaseModel):
    course_id: Optional[int] = None
    session_name: str = Field(default="New Chat", max_length=100)


class ChatSessionCreate(ChatSessionBase):
    pass


class ChatSessionResponse(ChatSessionBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ChatMessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    role: str = Field(..., pattern="^(user|assistant)$")


class ChatMessageCreate(ChatMessageBase):
    session_id: int


class ChatMessageResponse(ChatMessageBase):
    id: int
    session_id: int
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


class ChatbotRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[int] = None
    course_id: Optional[int] = None
    include_course_content: bool = Field(
        default=True, description="Whether to include course content in context")


class ChatbotResponse(BaseModel):
    response: str
    session_id: int
    message_id: int
    timestamp: datetime
    course_content_used: bool = False
    content_files_count: int = 0
    metadata: Optional[Dict[str, Any]] = None


class CourseAnalysisRequest(BaseModel):
    course_id: int


class CourseAnalysisResponse(BaseModel):
    analysis: str
    content_count: int
    file_types: List[str]
    success: bool
    error: Optional[str] = None
