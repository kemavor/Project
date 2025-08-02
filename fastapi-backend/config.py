from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")
    is_production: bool = environment == "production"

    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./visionware.db")

    # Security
    secret_key: str = os.getenv(
        "SECRET_KEY", "your-super-secret-key-change-this-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    refresh_token_expire_days: int = int(
        os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # CORS - Environment-aware configuration
    allowed_origins: List[str] = [
        # Development
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        # Production - Add your domain here
        "https://visionware.com",
        "https://www.visionware.com",
        "https://app.visionware.com",
        # Allow same-origin requests
        "https://*",
        "http://*"
    ] if not is_production else [
        # Production - Only allow specific domains
        "https://visionware.com",
        "https://www.visionware.com",
        "https://app.visionware.com"
    ]

    # AWS S3 Configuration
    # For EC2 instances: Use IAM roles (recommended)
    # For local development: Use access keys (fallback)
    aws_access_key_id: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret_access_key: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    s3_bucket_name: str = os.getenv("S3_BUCKET_NAME", "visionware-documents")

    # Use IAM roles by default (EC2 best practice)
    # Set to False only for local development with access keys
    use_iam_role: bool = os.getenv("USE_IAM_ROLE", "true").lower() == "true"

    # ECHO Configuration
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    echo_model: str = os.getenv("ECHO_MODEL", "gemini-1.5-flash")
    echo_max_tokens: int = int(os.getenv("ECHO_MAX_TOKENS", "2048"))
    echo_temperature: float = float(os.getenv("ECHO_TEMPERATURE", "0.7"))
    echo_max_history: int = int(os.getenv("ECHO_MAX_HISTORY", "10"))
    echo_course_content_enabled: bool = os.getenv(
        "ECHO_COURSE_CONTENT_ENABLED", "true").lower() == "true"
    echo_analytics_enabled: bool = os.getenv(
        "ECHO_ANALYTICS_ENABLED", "true").lower() == "true"
    echo_voice_enabled: bool = os.getenv(
        "ECHO_VOICE_ENABLED", "false").lower() == "true"
    echo_multilingual_enabled: bool = os.getenv(
        "ECHO_MULTILINGUAL_ENABLED", "false").lower() == "true"

    # Server Configuration
    host: str = os.getenv("HOST", "0.0.0.0" if is_production else "127.0.0.1")
    port: int = int(os.getenv("PORT", "8000"))
    debug: bool = not is_production

    # Production-specific settings
    workers: int = int(os.getenv("WORKERS", "4")) if is_production else 1
    log_level: str = os.getenv(
        "LOG_LEVEL", "INFO" if is_production else "DEBUG")

    # SSL/TLS Configuration (for production)
    ssl_certfile: str = os.getenv("SSL_CERTFILE", "")
    ssl_keyfile: str = os.getenv("SSL_KEYFILE", "")

    # Rate limiting
    rate_limit_per_minute: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

    # File upload limits
    max_file_size: int = int(
        os.getenv("MAX_FILE_SIZE", "50")) * 1024 * 1024  # 50MB default

    # Session configuration
    session_timeout_hours: int = int(os.getenv("SESSION_TIMEOUT_HOURS", "24"))

    class Config:
        env_file = ".env"


settings = Settings()
