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
    
    # RTMP-to-HLS streaming settings
    transcription_enabled: bool = True
    auto_summary_enabled: bool = True


class LiveStreamCreate(LiveStreamBase):
    pass


class LiveStreamUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    max_viewers: Optional[int] = Field(None, ge=1, le=1000)
    is_public: Optional[bool] = None
    is_recording: Optional[bool] = None


class LiveStreamResponse(LiveStreamBase):
    id: int
    instructor_id: int
    status: str
    rtmp_key: str
    hls_url: Optional[str] = None
    rtmp_server_url: Optional[str] = None
    viewer_count: int = 0
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration: int = 0
    recording_url: Optional[str] = None
    
    # Video recording information
    video_s3_key: Optional[str] = None
    video_s3_bucket: Optional[str] = None
    video_file_size: Optional[int] = None
    video_duration_seconds: Optional[int] = None
    video_content_type: Optional[str] = None
    recording_started_at: Optional[datetime] = None
    recording_ended_at: Optional[datetime] = None
    
    chat_locked: bool = False
    
    # Additional fields for dashboard display
    instructor_name: Optional[str] = None
    course_name: Optional[str] = None
    
    # WebRTC integration fields
    webrtc_enabled: bool = False
    webrtc_room_id: Optional[str] = None
    whep_url: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, obj):
        """Custom serializer to handle JSON fields and missing attributes"""
        import json
        
        # Helper function to safely get attribute with default value
        def safe_getattr(obj, attr, default=None):
            try:
                return getattr(obj, attr, default)
            except AttributeError:
                return default
        
        # Handle quality_settings JSON field safely
        quality_settings = {}
        try:
            qs = safe_getattr(obj, 'quality_settings')
            if isinstance(qs, str):
                quality_settings = json.loads(qs)
            elif isinstance(qs, dict):
                quality_settings = qs
            elif qs is None:
                quality_settings = {}
        except (json.JSONDecodeError, TypeError):
            quality_settings = {}
        
        data = {
            'id': obj.id,
            'title': obj.title,
            'description': obj.description,
            'course_id': obj.course_id,
            'instructor_id': obj.instructor_id,
            'status': obj.status,
            'rtmp_key': obj.rtmp_key,
            'stream_url': safe_getattr(obj, 'stream_url'),
            'viewer_count': safe_getattr(obj, 'viewer_count', 0),
            'started_at': safe_getattr(obj, 'started_at'),
            'ended_at': safe_getattr(obj, 'ended_at'),
            'duration': safe_getattr(obj, 'duration', 0),
            'recording_url': safe_getattr(obj, 'recording_url'),
            'video_s3_key': safe_getattr(obj, 'video_s3_key'),
            'video_s3_bucket': safe_getattr(obj, 'video_s3_bucket'),
            'video_file_size': safe_getattr(obj, 'video_file_size'),
            'video_duration_seconds': safe_getattr(obj, 'video_duration_seconds'),
            'video_content_type': safe_getattr(obj, 'video_content_type'),
            'recording_started_at': safe_getattr(obj, 'recording_started_at'),
            'recording_ended_at': safe_getattr(obj, 'recording_ended_at'),
            'chat_locked': safe_getattr(obj, 'chat_locked', False),
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
            'scheduled_at': safe_getattr(obj, 'scheduled_at'),
            'max_viewers': safe_getattr(obj, 'max_viewers', 100),
            'is_public': safe_getattr(obj, 'is_public', True),
            'is_recording': safe_getattr(obj, 'is_recording', False),
            'streaming_mode': safe_getattr(obj, 'streaming_mode', 'mediasoup'),
            'transcription_enabled': safe_getattr(obj, 'transcription_enabled', True),
            'auto_summary_enabled': safe_getattr(obj, 'auto_summary_enabled', True),
            'quality_settings': quality_settings,
            # WebRTC fields
            'webrtc_enabled': safe_getattr(obj, 'webrtc_enabled', False),
            'webrtc_room_id': safe_getattr(obj, 'webrtc_room_id'),
        }
        
        # Generate WebRTC URLs if enabled
        if data['webrtc_enabled'] and data['id']:
            mediasoup_base = "http://localhost:3001"
            data['whep_url'] = f"{mediasoup_base}/whep/{data['id']}"
            data['hls_url'] = f"{mediasoup_base}/hls/{data['id']}/stream.m3u8"
        else:
            data['whep_url'] = None
            data['hls_url'] = None
        
        return cls(**data)


# Video recording schemas
class VideoRecordingRequest(BaseModel):
    """Request to start/stop video recording"""
    action: str  # "start" or "stop"
    quality: Optional[str] = "720p"  # Video quality setting


class VideoChunkUpload(BaseModel):
    """Schema for uploading video chunks during live streaming"""
    stream_id: int
    chunk_number: int
    chunk_data: bytes


class VideoRecordingResponse(BaseModel):
    """Response for video recording operations"""
    success: bool
    message: str
    recording_url: Optional[str] = None
    s3_key: Optional[str] = None
    file_size: Optional[int] = None


class RecordedLectureResponse(BaseModel):
    """Response for recorded lecture information"""
    id: int
    title: str
    description: Optional[str] = None
    course_id: int
    instructor_name: str
    recording_url: str
    video_duration_seconds: Optional[int] = None
    file_size: Optional[int] = None
    created_at: datetime
    
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

    class Config:
        from_attributes = True


class ChatLockRequest(BaseModel):
    locked: bool = Field(..., description="Whether to lock or unlock the chat")


# Transcription Schemas

class StreamTranscriptionBase(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    language: str = Field(default="en", max_length=10)
    start_time: Optional[float] = Field(None, ge=0.0)
    end_time: Optional[float] = Field(None, ge=0.0)
    duration: Optional[float] = Field(None, ge=0.0)
    speaker_id: Optional[str] = None
    is_final: bool = Field(default=False)
    segment_index: int = Field(default=0, ge=0)


class StreamTranscriptionCreate(StreamTranscriptionBase):
    stream_id: int


class StreamTranscriptionUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=1, max_length=10000)
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    language: Optional[str] = Field(None, max_length=10)
    start_time: Optional[float] = Field(None, ge=0.0)
    end_time: Optional[float] = Field(None, ge=0.0)
    duration: Optional[float] = Field(None, ge=0.0)
    speaker_id: Optional[str] = None
    is_final: Optional[bool] = None
    segment_index: Optional[int] = Field(None, ge=0)


class StreamTranscriptionResponse(StreamTranscriptionBase):
    id: int
    stream_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StreamTranscriptionSessionBase(BaseModel):
    model_name: str = Field(default="base", max_length=50)
    language: str = Field(default="en", max_length=10)
    is_active: bool = Field(default=True)


class StreamTranscriptionSessionCreate(StreamTranscriptionSessionBase):
    stream_id: int


class StreamTranscriptionSessionUpdate(BaseModel):
    model_name: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, max_length=10)
    is_active: Optional[bool] = None
    ended_at: Optional[datetime] = None


class StreamTranscriptionSessionResponse(StreamTranscriptionSessionBase):
    id: int
    stream_id: int
    total_segments: int
    average_confidence: float
    processing_time_ms: float
    started_at: datetime
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TranscriptionRequest(BaseModel):
    audio_data: str = Field(..., description="Base64 encoded audio data")
    sample_rate: int = Field(default=16000, ge=8000, le=48000)
    language: Optional[str] = Field(None, max_length=10)
    model_name: Optional[str] = Field(None, max_length=50)


class TranscriptionResponse(BaseModel):
    text: str
    confidence: float
    language: str
    processing_time_ms: float
    model_name: str
    success: bool = True
    error: Optional[str] = None


class StreamTranscriptionStats(BaseModel):
    stream_id: int
    total_segments: int
    average_confidence: float
    total_duration: float
    languages_detected: List[str]
    is_active: bool
    last_transcription_at: Optional[datetime] = None


# Lecture Summary Schemas

class LectureSummaryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    summary: str = Field(..., min_length=10)
    key_points: List[str] = Field(default_factory=list)
    topics_covered: List[str] = Field(default_factory=list)


class LectureSummaryCreate(LectureSummaryBase):
    stream_id: int
    course_id: int
    transcription_segments_count: int = 0
    total_transcription_duration: float = 0.0


class LectureSummaryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    summary: Optional[str] = Field(None, min_length=10)
    key_points: Optional[List[str]] = None
    topics_covered: Optional[List[str]] = None


class LectureSummaryResponse(LectureSummaryBase):
    id: int
    stream_id: int
    course_id: int
    generated_by: str
    confidence_score: float
    word_count: int
    transcription_segments_count: int
    total_transcription_duration: float
    generated_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SummaryAccessCreate(BaseModel):
    summary_id: int
    view_duration: int = 0
    is_bookmarked: bool = False


class SummaryAccessResponse(BaseModel):
    id: int
    summary_id: int
    user_id: int
    accessed_at: datetime
    view_duration: int
    is_bookmarked: bool

    class Config:
        from_attributes = True


class CourseSummariesResponse(BaseModel):
    course_id: int
    course_title: str
    summaries: List[LectureSummaryResponse]
    total_summaries: int
    total_duration: float  # Total duration of all lectures


# ============ ENHANCED QUIZ SCHEMAS ============

class MasterTopicBase(BaseModel):
    name: str
    description: Optional[str] = None

class MasterTopicCreate(MasterTopicBase):
    pass

class MasterTopicResponse(MasterTopicBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubMasterTopicBase(BaseModel):
    name: str
    description: Optional[str] = None
    master_topic_id: int

class SubMasterTopicCreate(SubMasterTopicBase):
    pass

class SubMasterTopicResponse(SubMasterTopicBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class SpecificMasterTopicBase(BaseModel):
    name: str
    description: Optional[str] = None
    sub_topic_id: int
    course_id: Optional[int] = None

class SpecificMasterTopicCreate(SpecificMasterTopicBase):
    pass

class SpecificMasterTopicResponse(SpecificMasterTopicBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============ QUIZ SCHEMAS ============

class QuizStartRequest(BaseModel):
    topic: str
    difficulty: str = "Easy"  # Easy, Medium, Hard
    num_questions: int = 10
    course_id: Optional[int] = None
    time_limit: Optional[int] = 600  # seconds

class MCQQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str

class QuizGenerationRequest(BaseModel):
    topic: str
    num_questions: int = 5
    difficulty: str = "Easy"
    course_id: Optional[int] = None
    time_limit: Optional[int] = 300

class MCQCreate(BaseModel):
    question_data: Dict[str, Any]  # JSON containing questions
    difficulty: str = "Easy"
    time_limit: int = 300
    specific_topic_id: Optional[int] = None
    course_id: Optional[int] = None
    generation_prompt: Optional[str] = None

class MCQResponse(BaseModel):
    id: int
    question_data: Dict[str, Any]
    difficulty: str
    time_limit: int
    ai_generated: bool
    ai_model_used: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class QuizSessionResponse(BaseModel):
    id: int
    session_id: str
    topic_name: str
    difficulty: str
    num_questions: int
    time_limit: int
    status: str
    current_question_index: int
    questions_json: Optional[Dict[str, Any]] = None
    score: int
    total_questions: int
    started_at: datetime
    
    class Config:
        from_attributes = True

class QuestionAnswer(BaseModel):
    question_index: int
    user_answer: str

class QuizAnswerRequest(BaseModel):
    session_id: str
    question_index: int
    user_answer: str
    time_taken: Optional[int] = 0

class QuizCompleteRequest(BaseModel):
    session_id: str
    total_time_taken: int

class QuizResults(BaseModel):
    session_id: str
    score: int
    total_questions: int
    percentage: float
    time_taken: int
    qv_coins_earned: int
    questions_breakdown: List[Dict[str, Any]]
    difficulty: str
    topic_name: str
    completed_at: datetime

class UserTopicProgressResponse(BaseModel):
    id: int
    user_id: int
    master_topic_id: Optional[int]
    sub_topic_id: Optional[int] 
    specific_topic_id: Optional[int]
    level: int
    streak: int
    total_qv_coins: int
    questions_attempted: int
    questions_correct: int
    accuracy_percentage: float
    last_activity: datetime
    
    class Config:
        from_attributes = True

class UserQuizStats(BaseModel):
    total_quizzes: int
    total_questions_attempted: int
    total_questions_correct: int
    overall_accuracy: float
    total_qv_coins: int
    current_streak: int
    favorite_topics: List[str]
    recent_performance: List[Dict[str, Any]]

class LeaderboardEntry(BaseModel):
    username: str
    total_coins: int
    level: int
    streak: int
    accuracy: float

class TopicLeaderboard(BaseModel):
    topic_name: str
    topic_level: str  # master, sub, specific
    leaderboard: List[LeaderboardEntry]

# ============ USER DETAIL SCHEMAS ============

class UserDetailsResponse(BaseModel):
    username: str
    level: int
    streak: int
    total_qv_coins: int
    master_topics: List[str]
    sub_topics: List[str] 
    specific_topics: List[str]
    quiz_stats: UserQuizStats
