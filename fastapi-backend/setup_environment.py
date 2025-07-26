#!/usr/bin/env python3
"""
Environment Setup Script for VisionWare FastAPI Backend
This script helps you configure environment variables for S3 integration.
"""

import os
import sys
from pathlib import Path


def create_env_file():
    """Create .env file with user input"""

    print("🚀 VisionWare Environment Setup")
    print("=" * 50)

    # Determine if this is production or development
    print("\n1. Environment Type:")
    print("   [1] Production (EC2 with IAM Role) - RECOMMENDED")
    print("   [2] Local Development (Access Keys)")

    while True:
        choice = input("\nSelect environment type (1 or 2): ").strip()
        if choice in ['1', '2']:
            break
        print("❌ Please enter 1 or 2")

    is_production = choice == '1'

    # Get common settings
    print("\n2. Common Settings:")

    bucket_name = input(
        "S3 Bucket Name (e.g., visionware-documents): ").strip()
    if not bucket_name:
        bucket_name = "visionware-documents"

    region = input("AWS Region (default: us-east-1): ").strip()
    if not region:
        region = "us-east-1"

    # Get environment-specific settings
    env_content = []

    if is_production:
        print("\n3. Production Settings (IAM Role):")
        print("✅ Using IAM Role - no access keys needed!")

        env_content.extend([
            "# Production Configuration (IAM Role)",
            "USE_IAM_ROLE=true",
            f"AWS_REGION={region}",
            f"S3_BUCKET_NAME={bucket_name}",
            "",
            "# Database Configuration",
            "DATABASE_URL=sqlite:///./visionware.db",
            "",
            "# Security Configuration",
            "SECRET_KEY=your-super-secret-key-change-this-in-production",
            "ALGORITHM=HS256",
            "ACCESS_TOKEN_EXPIRE_MINUTES=30",
            "REFRESH_TOKEN_EXPIRE_DAYS=7",
            "",
            "# CORS Configuration",
            'ALLOWED_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000"]',
            "",
            "# Server Configuration",
            "HOST=127.0.0.1",
            "PORT=8000",
            "DEBUG=false"
        ])

    else:
        print("\n3. Development Settings (Access Keys):")
        print("⚠️  Remember: Access keys are for development only!")

        access_key = input("AWS Access Key ID: ").strip()
        if not access_key:
            print("❌ Access Key ID is required for development")
            return

        secret_key = input("AWS Secret Access Key: ").strip()
        if not secret_key:
            print("❌ Secret Access Key is required for development")
            return

        env_content.extend([
            "# Development Configuration (Access Keys)",
            "USE_IAM_ROLE=false",
            f"AWS_ACCESS_KEY_ID={access_key}",
            f"AWS_SECRET_ACCESS_KEY={secret_key}",
            f"AWS_REGION={region}",
            f"S3_BUCKET_NAME={bucket_name}",
            "",
            "# Database Configuration",
            "DATABASE_URL=sqlite:///./visionware.db",
            "",
            "# Security Configuration",
            "SECRET_KEY=your-super-secret-key-change-this-in-production",
            "ALGORITHM=HS256",
            "ACCESS_TOKEN_EXPIRE_MINUTES=30",
            "REFRESH_TOKEN_EXPIRE_DAYS=7",
            "",
            "# CORS Configuration",
            'ALLOWED_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000"]',
            "",
            "# Server Configuration",
            "HOST=127.0.0.1",
            "PORT=8000",
            "DEBUG=true"
        ])

    # Write .env file
    env_file = Path(".env")

    if env_file.exists():
        overwrite = input(
            f"\n⚠️  .env file already exists. Overwrite? (y/N): ").strip().lower()
        if overwrite != 'y':
            print("❌ Setup cancelled")
            return

    try:
        with open(env_file, 'w') as f:
            f.write('\n'.join(env_content))

        print(f"\n✅ Environment file created: {env_file.absolute()}")

        if is_production:
            print("\n📋 Next Steps for Production:")
            print("1. Create IAM role with S3 permissions")
            print("2. Attach role to your EC2 instance")
            print("3. Create S3 bucket: " + bucket_name)
            print("4. See S3_SETUP.md for detailed instructions")
        else:
            print("\n📋 Next Steps for Development:")
            print("1. Create S3 bucket: " + bucket_name)
            print("2. Ensure your IAM user has S3 permissions")
            print("3. Test with: python test_s3_upload.py")

        print("\n🔒 Security Reminder:")
        if is_production:
            print("✅ Using IAM roles - most secure method")
        else:
            print(
                "⚠️  Using access keys - rotate regularly and never commit to version control")

    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        return


def main():
    """Main function"""
    try:
        create_env_file()
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
