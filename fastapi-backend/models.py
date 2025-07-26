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
    stream_key = Column(String, unique=True, default=lambda: str(uuid.uuid4()))
    stream_url = Column(String, nullable=True)
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
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="live_streams")
    instructor = relationship("User", back_populates="live_streams")
    participants = relationship("StreamParticipant", back_populates="stream")
    chat_messages = relationship("StreamChatMessage", back_populates="stream")
    questions = relationship("Question", back_populates="stream")


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


# Add notification preferences relationship to User
User.notification_preferences = relationship(
    "UserNotificationPreferences", back_populates="user", uselist=False)
