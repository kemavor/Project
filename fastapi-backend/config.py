from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./visionware.db"

    # Security
    secret_key: str = "your-super-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    allowed_origins: List[str] = ["http://localhost:5173",
                                  "http://127.0.0.1:5173", "http://localhost:3000"]

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

    # Server
    host: str = "127.0.0.1"
    port: int = 8000
    debug: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
