#!/usr/bin/env python3
"""
Configure S3 Bucket for VisionWare Document Uploads
This script checks and configures your S3 bucket for proper upload functionality.
"""

import boto3
import json
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import os

load_dotenv()


def configure_s3_bucket():
    """Configure S3 bucket for document uploads"""

    print("🔧 Configuring S3 Bucket for VisionWare")
    print("=" * 50)

    # Get configuration
    bucket_name = os.getenv("S3_BUCKET_NAME")
    region = os.getenv("AWS_REGION", "us-east-1")

    if not bucket_name:
        print("❌ S3_BUCKET_NAME not found in environment variables")
        return False

    print(f"📦 Bucket: {bucket_name}")
    print(f"🌍 Region: {region}")

    # Initialize S3 client
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=region
        )
        print("✅ S3 client initialized")
    except Exception as e:
        print(f"❌ Failed to initialize S3 client: {e}")
        return False

    # 1. Check bucket exists and is accessible
    print(f"\n1. Checking bucket access...")
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        print(f"   ✅ Bucket '{bucket_name}' exists and is accessible")
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchBucket':
            print(f"   ❌ Bucket '{bucket_name}' does not exist")
            print(f"   💡 Please create the bucket in AWS S3 Console")
            return False
        elif error_code == 'AccessDenied':
            print(f"   ❌ Access denied to bucket '{bucket_name}'")
            print(f"   💡 Check your IAM permissions")
            return False
        else:
            print(f"   ❌ Error accessing bucket: {e}")
            return False

    # 2. Check bucket ownership
    print(f"\n2. Checking bucket ownership...")
    try:
        response = s3_client.get_bucket_ownership_controls(Bucket=bucket_name)
        print(f"   ✅ Bucket ownership controls configured")
    except ClientError as e:
        if e.response['Error']['Code'] == 'OwnershipControlsNotFoundError':
            print(f"   ⚠️  No ownership controls found (this is usually OK)")
        else:
            print(f"   ⚠️  Could not check ownership controls: {e}")

    # 3. Configure CORS for web uploads
    print(f"\n3. Configuring CORS...")
    cors_configuration = {
        'CORSRules': [
            {
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                'AllowedOrigins': ['*'],  # In production, specify your domain
                'ExposeHeaders': ['ETag'],
                'MaxAgeSeconds': 3000
            }
        ]
    }

    try:
        s3_client.put_bucket_cors(
            Bucket=bucket_name, CORSConfiguration=cors_configuration)
        print(f"   ✅ CORS configured successfully")
    except ClientError as e:
        print(f"   ⚠️  Could not configure CORS: {e}")

    # 4. Check bucket policy
    print(f"\n4. Checking bucket policy...")
    try:
        response = s3_client.get_bucket_policy(Bucket=bucket_name)
        policy = json.loads(response['Policy'])
        print(f"   ✅ Bucket policy exists")

        # Check if policy allows uploads
        has_upload_permission = False
        for statement in policy.get('Statement', []):
            if 's3:PutObject' in statement.get('Action', []):
                has_upload_permission = True
                break

        if has_upload_permission:
            print(f"   ✅ Policy allows uploads")
        else:
            print(f"   ⚠️  Policy may not allow uploads")

    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchBucketPolicy':
            print(f"   ℹ️  No bucket policy found (using IAM permissions)")
        else:
            print(f"   ⚠️  Could not check bucket policy: {e}")

    # 5. Test upload permissions
    print(f"\n5. Testing upload permissions...")
    test_key = f"test/visionware-config-test-{os.getpid()}.txt"
    test_content = b"VisionWare S3 Configuration Test"

    try:
        # Test upload
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content,
            ContentType='text/plain'
        )
        print(f"   ✅ Upload test successful: {test_key}")

        # Test download
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        print(f"   ✅ Download test successful")

        # Clean up
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)
        print(f"   ✅ Cleanup successful")

    except ClientError as e:
        print(f"   ❌ Upload test failed: {e}")
        return False

    # 6. Recommended IAM policy
    print(f"\n6. IAM Policy Recommendation:")
    print(f"   Make sure your IAM user has this policy:")

    recommended_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    f"arn:aws:s3:::{bucket_name}",
                    f"arn:aws:s3:::{bucket_name}/*"
                ]
            }
        ]
    }

    print(f"   {json.dumps(recommended_policy, indent=2)}")

    print(f"\n🎉 S3 bucket configuration completed!")
    print(f"✅ Your bucket '{bucket_name}' is ready for document uploads")

    return True


def main():
    """Main function"""
    try:
        success = configure_s3_bucket()
        if success:
            print(f"\n🚀 Ready to test document uploads!")
            print(f"💡 Run: python test_s3_upload.py")
        else:
            print(f"\n❌ Please fix the issues above before proceeding")
    except KeyboardInterrupt:
        print(f"\n\n❌ Configuration cancelled by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")


if __name__ == "__main__":
    main()
