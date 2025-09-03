from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, JSON, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum
import uuid

Base = declarative_base()


class RoleType(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    role = Column(String, default=RoleType.STUDENT, nullable=False)
    is_active = Column(Boolean, default=True)
    is_staff = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    last_login = Column(DateTime, nullable=True)

    # Security fields
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, default=func.now())
    last_login_ip = Column(String, nullable=True)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String, nullable=True)

    # Soft deletion fields - temporarily commented out to fix login
    # is_deleted = Column(Boolean, default=False)
    # deleted_at = Column(DateTime, nullable=True)
    # deletion_reason = Column(String, nullable=True)
    # deletion_type = Column(String, nullable=True)  # immediate, scheduled, soft

    # Profile fields
    bio = Column(Text, nullable=True)
    age = Column(Integer, nullable=True)
    profile_picture = Column(String, nullable=True)

    # Relationships
    courses = relationship("Course", back_populates="instructor")
    enrollments = relationship("Enrollment", back_populates="student")
    lectures = relationship("Lecture", back_populates="instructor")
    applications = relationship("Application", back_populates="student")
    statistics = relationship(
        "UserStatistics", back_populates="user", uselist=False)
    learning_activities = relationship(
        "LearningActivity", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    uploaded_documents = relationship(
        "CourseDocument", back_populates="uploader")
    live_streams = relationship("LiveStream", back_populates="instructor")
    stream_participants = relationship(
        "StreamParticipant", back_populates="user")
    chat_messages = relationship("StreamChatMessage", back_populates="user")
    notification_preferences = relationship(
        "UserNotificationPreferences", back_populates="user", uselist=False)
    # Temporarily comment out problematic relationships to fix startup
    # deletion_schedules = relationship(
    #     "AccountDeletionSchedule", foreign_keys="[AccountDeletionSchedule.user_id]", back_populates="user")
    # data_exports = relationship("UserDataExport", back_populates="user")


class UserStatistics(Base):
    __tablename__ = "user_statistics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Learning metrics
    lectures_attended = Column(Integer, default=0)
    flashcards_reviewed = Column(Integer, default=0)
    quizzes_completed = Column(Integer, default=0)
    quiz_average_score = Column(Float, default=0.0)
    learning_streak_days = Column(Integer, default=0)
    total_study_hours = Column(Float, default=0.0)

    # Teacher metrics (if applicable)
    courses_created = Column(Integer, default=0)
    lectures_conducted = Column(Integer, default=0)
    students_taught = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)

    # Timestamps
    last_activity = Column(DateTime, nullable=True)
    streak_start_date = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="statistics")


class LearningActivity(Base):
    __tablename__ = "learning_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # lecture, quiz, flashcard, course
    activity_type = Column(String, nullable=False)
    # ID of the specific lecture/quiz/etc
    activity_id = Column(Integer, nullable=True)
    duration_minutes = Column(Integer, default=0)
    score = Column(Float, nullable=True)  # For quizzes
    completed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("User", back_populates="learning_activities")


class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_enrollment_open = Column(Boolean, default=True)
    credits = Column(Integer, default=3)

    # Relationships
    instructor = relationship("User", back_populates="courses")
    enrollments = relationship("Enrollment", back_populates="course")
    lectures = relationship("Lecture", back_populates="course")
    applications = relationship("Application", back_populates="course")
    documents = relationship("CourseDocument", back_populates="course")
    live_streams = relationship("LiveStream", back_populates="course")
    notifications = relationship("Notification", back_populates="course")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    enrolled_at = Column(DateTime, default=func.now())
    status = Column(String, default="enrolled")  # enrolled, completed, dropped

    # Relationships
    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")  # success, warning, info, error
    # course, application, stream, document, system, achievement
    category = Column(String, default="general")
    priority = Column(String, default="normal")  # low, normal, high, urgent
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    related_course_id = Column(
        Integer, ForeignKey("courses.id"), nullable=True)
    related_application_id = Column(
        Integer, ForeignKey("applications.id"), nullable=True)
    related_stream_id = Column(
        Integer, ForeignKey("live_streams.id"), nullable=True)
    related_document_id = Column(
        Integer, ForeignKey("course_documents.id"), nullable=True)

    # Personalization fields
    is_personalized = Column(Boolean, default=True)
    # student, teacher, admin, all
    user_role_target = Column(String, nullable=True)
    user_preferences_met = Column(Boolean, default=True)

    # Relationships
    user = relationship("User", back_populates="notifications")
    course = relationship("Course", back_populates="notifications")
    application = relationship("Application", back_populates="notifications")
    stream = relationship("LiveStream")
    document = relationship("CourseDocument")


class Lecture(Base):
    __tablename__ = "lectures"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    video_url = Column(String, nullable=True)
    duration = Column(Integer, nullable=True)  # in minutes
    is_live = Column(Boolean, default=False)
    scheduled_at = Column(DateTime, nullable=True)
    # draft, published, live, completed
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="lectures")
    instructor = relationship("User", back_populates="lectures")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    student_year = Column(Integer, nullable=False)
    gpa = Column(Float, nullable=False)
    motivation_statement = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("User", back_populates="applications")
    course = relationship("Course", back_populates="applications")
    notifications = relationship("Notification", back_populates="application")


class CourseDocument(Base):
    __tablename__ = "course_documents"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # File metadata
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    file_type = Column(String, nullable=False)  # pdf, doc, ppt, etc.
    mime_type = Column(String, nullable=False)

    # S3 metadata
    s3_key = Column(String, nullable=False)
    s3_bucket = Column(String, nullable=False)
    s3_url = Column(String, nullable=True)  # Direct S3 URL
    # CloudFront URL if configured
    cloudfront_url = Column(String, nullable=True)

    # Document info
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True)  # Whether students can access

    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="documents")
    uploader = relationship("User", back_populates="uploaded_documents")


# Add applications relationship to Course
Course.applications = relationship("Application", back_populates="course")

# Live Streaming Models


class LiveStream(Base):
    __tablename__ = "live_streams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # scheduled, live, ended, cancelled
    status = Column(String, default="scheduled")
    rtmp_key = Column(String, unique=True, default=lambda: str(uuid.uuid4()))
    hls_url = Column(String, nullable=True)  # HLS playback URL
    viewer_count = Column(Integer, default=0)
    max_viewers = Column(Integer, default=100)
    scheduled_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    duration = Column(Integer, default=0)  # in seconds
    quality_settings = Column(JSON, default=dict)
    is_public = Column(Boolean, default=True)
    is_recording = Column(Boolean, default=False)
    recording_url = Column(String, nullable=True)

    # Video recording storage (S3)
    video_s3_key = Column(String, nullable=True)  # S3 key for recorded video
    video_s3_bucket = Column(String, nullable=True)  # S3 bucket name
    # Video file size in bytes
    video_file_size = Column(Integer, nullable=True)
    video_duration_seconds = Column(
        Integer, nullable=True)  # Actual video duration
    video_content_type = Column(String, nullable=True)  # Video MIME type
    recording_started_at = Column(
        DateTime, nullable=True)  # When recording started
    recording_ended_at = Column(
        DateTime, nullable=True)  # When recording ended

    chat_locked = Column(Boolean, default=False)

    # RTMP-to-HLS streaming architecture
    rtmp_server_url = Column(
        String, default="rtmp://localhost:1936/live")  # RTMP ingest URL

    # Post-processing settings (for recorded lectures)
    transcription_enabled = Column(Boolean, default=True)
    auto_summary_enabled = Column(Boolean, default=True)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="live_streams")
    instructor = relationship("User", back_populates="live_streams")
    participants = relationship("StreamParticipant", back_populates="stream")
    chat_messages = relationship("StreamChatMessage", back_populates="stream")
    questions = relationship("Question", back_populates="stream")
    transcription = relationship(
        "LectureTranscription", back_populates="stream", uselist=False)

    @property
    def quality_settings_dict(self):
        """Convert quality_settings JSON string to dict for serialization"""
        if isinstance(self.quality_settings, str):
            try:
                import json
                return json.loads(self.quality_settings)
            except (json.JSONDecodeError, TypeError):
                return {}
        return self.quality_settings if self.quality_settings else {}


class StreamParticipant(Base):
    __tablename__ = "stream_participants"

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(Integer, ForeignKey("live_streams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=func.now())
    left_at = Column(DateTime, nullable=True)
    duration_watched = Column(Integer, default=0)  # in seconds
    is_moderator = Column(Boolean, default=False)
    can_chat = Column(Boolean, default=True)
    can_ask_questions = Column(Boolean, default=True)

    # Relationships
    stream = relationship("LiveStream", back_populates="participants")
    user = relationship("User", back_populates="stream_participants")


class StreamChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(Integer, ForeignKey("live_streams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    message_type = Column(String, default="text")  # text, system, announcement
    is_visible = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    stream = relationship("LiveStream", back_populates="chat_messages")
    user = relationship("User", back_populates="chat_messages")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(Integer, ForeignKey("live_streams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(Text, nullable=False)
    is_answered = Column(Boolean, default=False)
    is_visible = Column(Boolean, default=True)
    upvotes = Column(Integer, default=0)
    answered_at = Column(DateTime, nullable=True)
    answered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    answer = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    stream = relationship("LiveStream", back_populates="questions")
    user = relationship("User", foreign_keys=[user_id], backref="questions")
    answerer = relationship("User", foreign_keys=[
                            answered_by], backref="answered_questions")


class StreamAnalytics(Base):
    __tablename__ = "stream_analytics"

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(Integer, ForeignKey("live_streams.id"), nullable=False)
    peak_viewers = Column(Integer, default=0)
    total_unique_viewers = Column(Integer, default=0)
    average_watch_time = Column(Float, default=0.0)  # in minutes
    chat_messages_count = Column(Integer, default=0)
    questions_count = Column(Integer, default=0)
    engagement_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=func.now())


# Recorded Lecture Processing Models

class LectureTranscription(Base):
    __tablename__ = "lecture_transcriptions"

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(Integer, ForeignKey(
        "live_streams.id"), nullable=False, unique=True)

    # Transcription content
    full_transcript = Column(Text, nullable=True)  # Complete transcript
    transcript_chunks = Column(JSON, nullable=True)  # Timestamped chunks

    # Processing status
    # pending, processing, completed, failed
    status = Column(String, default="pending")
    audio_extracted = Column(Boolean, default=False)
    transcription_completed = Column(Boolean, default=False)
    summary_completed = Column(Boolean, default=False)
    questions_generated = Column(Boolean, default=False)

    # File information
    # Temporary audio file path
    audio_file_path = Column(String, nullable=True)
    audio_duration_seconds = Column(Integer, nullable=True)

    # Processing metadata
    whisper_model_used = Column(String, default="base")
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    stream = relationship("LiveStream", back_populates="transcription")
    summary = relationship(
        "LectureSummary", back_populates="transcription", uselist=False)


class LectureSummary(Base):
    __tablename__ = "lecture_summaries"

    id = Column(Integer, primary_key=True, index=True)
    transcription_id = Column(Integer, ForeignKey(
        "lecture_transcriptions.id"), nullable=False, unique=True)
    stream_id = Column(Integer, ForeignKey("live_streams.id"), nullable=False)

    # Summary content
    summary_text = Column(Text, nullable=True)
    key_points = Column(JSON, nullable=True)  # List of key points
    topics_covered = Column(JSON, nullable=True)  # List of main topics

    # Summary metadata
    summary_length = Column(String, default="medium")  # short, medium, long
    model_used = Column(String, default="t5-small")
    confidence_score = Column(Float, nullable=True)

    # Processing info
    processing_time_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    transcription = relationship(
        "LectureTranscription", back_populates="summary")
    stream = relationship("LiveStream")


# New Chatbot Models


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    session_name = Column(String, default="New Chat")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    course = relationship("Course")
    messages = relationship("ChatMessage", back_populates="session")


class ChatMessage(Base):
    __tablename__ = "chatbot_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String)  # user, assistant
    content = Column(Text)
    timestamp = Column(DateTime, default=func.now())
    # Store additional info like course content used
    message_metadata = Column(JSON)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")


class UserNotificationPreferences(Base):
    __tablename__ = "user_notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"),
                     nullable=False, unique=True)

    # Category preferences
    course_notifications = Column(Boolean, default=True)
    application_notifications = Column(Boolean, default=True)
    stream_notifications = Column(Boolean, default=True)
    document_notifications = Column(Boolean, default=True)
    system_notifications = Column(Boolean, default=True)
    achievement_notifications = Column(Boolean, default=True)

    # Priority preferences
    low_priority = Column(Boolean, default=True)
    normal_priority = Column(Boolean, default=True)
    high_priority = Column(Boolean, default=True)
    urgent_priority = Column(Boolean, default=True)

    # Delivery preferences
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    in_app_notifications = Column(Boolean, default=True)

    # Frequency preferences
    notification_frequency = Column(
        String, default="immediate")  # immediate, daily, weekly

    # Course-specific preferences
    enrolled_courses_only = Column(Boolean, default=True)
    instructor_courses_only = Column(Boolean, default=True)

    # Time preferences
    quiet_hours_start = Column(Time, nullable=True)
    quiet_hours_end = Column(Time, nullable=True)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="notification_preferences")


class StreamTranscription(Base):
    __tablename__ = "stream_transcriptions"

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(Integer, ForeignKey("live_streams.id"), nullable=False)
    session_id = Column(Integer, ForeignKey(
        "stream_transcription_sessions.id"), nullable=True)

    # Transcription data
    text = Column(Text, nullable=False)
    confidence = Column(Float, default=0.0)  # Confidence score from Whisper
    language = Column(String, default="en")  # Detected language

    # Timing information
    # Start time in seconds from stream start
    start_time = Column(Float, nullable=True)
    # End time in seconds from stream start
    end_time = Column(Float, nullable=True)
    duration = Column(Float, nullable=True)    # Duration in seconds

    # Metadata
    # If speaker identification is available
    speaker_id = Column(String, nullable=True)
    # Whether this is a final transcription
    is_final = Column(Boolean, default=False)
    # Order of transcription segments
    segment_index = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    stream = relationship("LiveStream", backref="transcriptions")


class StreamTranscriptionSession(Base):
    __tablename__ = "stream_transcription_sessions"

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(Integer, ForeignKey("live_streams.id"), nullable=False)

    # Session configuration
    model_name = Column(String, default="base")  # Whisper model used
    language = Column(String, default="en")      # Target language
    is_active = Column(Boolean, default=True)    # Whether session is active

    # Performance metrics
    total_segments = Column(Integer, default=0)
    average_confidence = Column(Float, default=0.0)
    processing_time_ms = Column(Float, default=0.0)  # Average processing time

    # Timestamps
    started_at = Column(DateTime, default=func.now())
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    stream = relationship("LiveStream", backref="transcription_sessions")
    transcriptions = relationship(
        "StreamTranscription", backref="session", foreign_keys="StreamTranscription.session_id")


class SummaryAccess(Base):
    __tablename__ = "summary_access"

    id = Column(Integer, primary_key=True, index=True)
    summary_id = Column(Integer, ForeignKey(
        "lecture_summaries.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Access tracking
    accessed_at = Column(DateTime, default=func.now())
    view_duration = Column(Integer, default=0)  # in seconds
    is_bookmarked = Column(Boolean, default=False)

    # Relationships
    summary = relationship("LectureSummary", backref="access_records")
    user = relationship("User", backref="summary_accesses")


# Question Generation Models

class GeneratedQuestion(Base):
    __tablename__ = "generated_questions"

    id = Column(Integer, primary_key=True, index=True)
    # Optional for backwards compatibility
    stream_id = Column(Integer, ForeignKey("live_streams.id"), nullable=True)
    # New: Support document-based questions
    document_id = Column(Integer, ForeignKey(
        "course_documents.id"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"),
                       nullable=False)  # Direct course reference

    # Question content
    # multiple_choice, short_answer, true_false
    question_type = Column(String, nullable=False)
    question_text = Column(Text, nullable=False)
    correct_answer = Column(Text, nullable=False)
    options = Column(JSON, default=list)  # For multiple choice questions

    # Question metadata
    difficulty_level = Column(String, default="medium")  # easy, medium, hard
    topic_tags = Column(JSON, default=list)  # Topics/subjects covered
    # AI confidence in question quality
    confidence_score = Column(Float, default=0.0)

    # Generation info
    # Original sentence used for generation
    source_sentence = Column(Text, nullable=True)
    generation_method = Column(String, default="nlp")  # nlp, manual, hybrid

    # Usage statistics
    times_used = Column(Integer, default=0)
    correct_responses = Column(Integer, default=0)
    incorrect_responses = Column(Integer, default=0)

    # Status and timestamps
    is_active = Column(Boolean, default=True)
    is_reviewed = Column(Boolean, default=False)  # Human review status
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    stream = relationship("LiveStream", backref="generated_questions")
    document = relationship("CourseDocument", backref="generated_questions")
    course = relationship("Course", backref="generated_questions")
    answers = relationship("QuestionAnswer", back_populates="question")


class QuestionAnswer(Base):
    __tablename__ = "question_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey(
        "generated_questions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Answer content
    student_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    response_time_seconds = Column(Integer, nullable=True)

    # Context
    quiz_session_id = Column(String, nullable=True)  # If part of a quiz
    attempt_number = Column(Integer, default=1)

    # Timestamps
    answered_at = Column(DateTime, default=func.now())

    # Relationships
    question = relationship("GeneratedQuestion", back_populates="answers")
    user = relationship("User", backref="question_answers")


class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True,
                        nullable=False)  # UUID for session
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stream_id = Column(Integer, ForeignKey("live_streams.id"),
                       nullable=True)  # Legacy support
    course_id = Column(Integer, ForeignKey("courses.id"),
                       nullable=True)  # Course-based quizzes
    document_id = Column(Integer, ForeignKey(
        "course_documents.id"), nullable=True)  # Document-based quizzes

    # Quiz configuration
    # practice, assessment, review
    quiz_type = Column(String, default="practice")
    total_questions = Column(Integer, nullable=False)
    questions_answered = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)

    # Session metadata
    time_limit_minutes = Column(Integer, nullable=True)
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)

    # Results
    score_percentage = Column(Float, nullable=True)
    passing_score = Column(Float, default=70.0)
    is_passed = Column(Boolean, nullable=True)

    # Relationships
    user = relationship("User", backref="quiz_sessions")
    stream = relationship("LiveStream", backref="quiz_sessions")
    course = relationship("Course", backref="quiz_sessions")
    document = relationship("CourseDocument", backref="quiz_sessions")


# Add notification preferences relationship to User
User.notification_preferences = relationship(
    "UserNotificationPreferences", back_populates="user", uselist=False)


# Temporarily commented out to fix login
# class AccountDeletionSchedule(Base):
#     __tablename__ = "account_deletion_schedules"
# 
#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
# 
#     # Scheduling information
#     scheduled_deletion_date = Column(DateTime, nullable=False)
#     deletion_type = Column(String, default="hard")  # hard, soft
#     reason = Column(Text, nullable=True)
# 
#     # Status tracking
#     # scheduled, processing, completed, cancelled
#     status = Column(String, default="scheduled")
#     processed_at = Column(DateTime, nullable=True)
#     cancelled_at = Column(DateTime, nullable=True)
#     cancelled_by = Column(Integer, ForeignKey("users.id"), nullable=True)
#     cancellation_reason = Column(Text, nullable=True)
# 
#     # Notification settings
#     notify_before_deletion = Column(Boolean, default=True)
#     # Days before deletion to send notification
#     notification_days_before = Column(Integer, default=7)
# 
#     # Timestamps
#     created_at = Column(DateTime, default=func.now())
#     updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
# 
#     # Relationships
#     user = relationship("User", foreign_keys=[user_id])
#     cancelled_by_user = relationship("User", foreign_keys=[cancelled_by])


# Temporarily commented out to fix login
# class UserDataExport(Base):
#     __tablename__ = "user_data_exports"
# 
#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
# 
#     # Export configuration
#     # full, profile, learning_data, documents
#     export_type = Column(String, default="full")
#     include_sensitive_data = Column(Boolean, default=False)
#     data_format = Column(String, default="json")  # json, csv, pdf
# 
#     # File information
#     file_path = Column(String, nullable=True)
#     file_size = Column(Integer, nullable=True)  # in bytes
#     download_url = Column(String, nullable=True)
#     expires_at = Column(DateTime, nullable=True)
# 
#     # Status tracking
#     # pending, processing, completed, failed
#     status = Column(String, default="pending")
#     progress_percentage = Column(Integer, default=0)
#     error_message = Column(Text, nullable=True)
# 
#     # Processing timestamps
#     requested_at = Column(DateTime, default=func.now())
#     processing_started_at = Column(DateTime, nullable=True)
#     completed_at = Column(DateTime, nullable=True)
# 
#     # Data included in export
#     included_data = Column(JSON, nullable=True)  # List of data types included
# 
#     # Timestamps
#     created_at = Column(DateTime, default=func.now())
#     updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
# 
#     # Relationships
#     user = relationship("User")


# ============ ENHANCED QUIZ SYSTEM MODELS ============

class MasterTopic(Base):
    """Main topic categories for organizing quiz content"""
    __tablename__ = "master_topics"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    sub_topics = relationship("SubMasterTopic", back_populates="master_topic")
    user_progress = relationship("UserTopicProgress", back_populates="master_topic")

class SubMasterTopic(Base):
    """Sub-categories within master topics"""
    __tablename__ = "sub_master_topics"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    master_topic_id = Column(Integer, ForeignKey("master_topics.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    master_topic = relationship("MasterTopic", back_populates="sub_topics")
    specific_topics = relationship("SpecificMasterTopic", back_populates="sub_topic")
    user_progress = relationship("UserTopicProgress", back_populates="sub_topic")

class SpecificMasterTopic(Base):
    """Specific topic areas within sub-categories"""
    __tablename__ = "specific_master_topics"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    sub_topic_id = Column(Integer, ForeignKey("sub_master_topics.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)  # Link to courses
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    sub_topic = relationship("SubMasterTopic", back_populates="specific_topics")
    course = relationship("Course")
    mcqs = relationship("MCQ", back_populates="specific_topic")
    user_progress = relationship("UserTopicProgress", back_populates="specific_topic")

class UserTopicProgress(Base):
    """Track user progress across different topic levels"""
    __tablename__ = "user_topic_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    master_topic_id = Column(Integer, ForeignKey("master_topics.id"), nullable=True)
    sub_topic_id = Column(Integer, ForeignKey("sub_master_topics.id"), nullable=True)
    specific_topic_id = Column(Integer, ForeignKey("specific_master_topics.id"), nullable=True)
    
    # Progress metrics
    level = Column(Integer, default=1)
    streak = Column(Integer, default=0)
    total_qv_coins = Column(Integer, default=0)
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    last_activity = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User")
    master_topic = relationship("MasterTopic", back_populates="user_progress")
    sub_topic = relationship("SubMasterTopic", back_populates="user_progress")
    specific_topic = relationship("SpecificMasterTopic", back_populates="user_progress")

class MCQ(Base):
    """Multiple Choice Questions with AI-generated content"""
    __tablename__ = "mcqs"
    
    id = Column(Integer, primary_key=True, index=True)
    question_data = Column(JSON, nullable=False)  # Stores questions, options, answers
    difficulty = Column(String(10), default='Easy')  # Easy, Medium, Hard
    time_limit = Column(Integer, default=300)  # Time in seconds
    specific_topic_id = Column(Integer, ForeignKey("specific_master_topics.id"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)  # Direct course link
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Teacher who created
    created_at = Column(DateTime, default=func.now())
    
    # AI generation metadata
    ai_generated = Column(Boolean, default=True)
    generation_prompt = Column(Text, nullable=True)
    ai_model_used = Column(String(50), default='gemini-1.5-flash')
    
    # Relationships
    specific_topic = relationship("SpecificMasterTopic", back_populates="mcqs")
    course = relationship("Course")
    creator = relationship("User")
    quiz_attempts = relationship("QuizAttemptMCQ", back_populates="mcq")

class EnhancedQuizSession(Base):
    """Enhanced quiz session with topic-based organization"""
    __tablename__ = "enhanced_quiz_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    specific_topic_id = Column(Integer, ForeignKey("specific_master_topics.id"), nullable=True)
    
    # Quiz configuration
    topic_name = Column(String(200), nullable=False)
    difficulty = Column(String(10), nullable=False)
    num_questions = Column(Integer, nullable=False)
    time_limit = Column(Integer, default=600)  # Total time in seconds
    
    # Session state
    status = Column(String(20), default='active')  # active, completed, abandoned
    current_question_index = Column(Integer, default=0)
    questions_json = Column(JSON)  # Store generated questions
    
    # Results
    score = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    time_taken = Column(Integer, default=0)
    qv_coins_earned = Column(Integer, default=0)
    
    # Timestamps
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User")
    course = relationship("Course")
    specific_topic = relationship("SpecificMasterTopic")
    attempts = relationship("QuizAttemptMCQ", back_populates="quiz_session")

class QuizAttemptMCQ(Base):
    """Individual question attempts within a quiz session"""
    __tablename__ = "quiz_attempt_mcqs"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_session_id = Column(Integer, ForeignKey("enhanced_quiz_sessions.id"), nullable=False)
    mcq_id = Column(Integer, ForeignKey("mcqs.id"), nullable=True)  # Reference to stored MCQ
    question_index = Column(Integer, nullable=False)
    
    # Question data (stored for each attempt)
    question_text = Column(Text, nullable=False)
    options_json = Column(JSON, nullable=False)  # List of options
    correct_answer = Column(Text, nullable=False)
    user_answer = Column(Text, nullable=True)
    
    # Attempt results
    is_correct = Column(Boolean, default=False)
    time_taken = Column(Integer, default=0)  # Time for this question
    answered_at = Column(DateTime, nullable=True)
    
    # Relationships
    quiz_session = relationship("EnhancedQuizSession", back_populates="attempts")
    mcq = relationship("MCQ", back_populates="quiz_attempts")
