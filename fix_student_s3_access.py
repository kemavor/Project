#!/usr/bin/env python3
"""
Fix script for S3 student access issues
"""
import os
import sys
import django
from pathlib import Path

# Add the backend directory to the path
backend_path = Path(__file__).parent / "fastapi-backend"
sys.path.append(str(backend_path))

def fix_environment_variables():
    """Update environment variables for correct S3 bucket"""
    print("Checking environment variables...")
    
    # Check current S3 bucket configuration
    current_bucket = os.getenv("S3_BUCKET_NAME", "visionware-documents")
    print(f"Current S3_BUCKET_NAME: {current_bucket}")
    
    # The documents are actually in visionware-lecture-courses
    correct_bucket = "visionware-lecture-courses"
    
    if current_bucket != correct_bucket:
        print(f"❌ Bucket name mismatch!")
        print(f"   Current: {current_bucket}")
        print(f"   Required: {correct_bucket}")
        print("\n🔧 Fix: Update your environment variables:")
        print(f"   export S3_BUCKET_NAME={correct_bucket}")
        print("   OR add to your .env file:")
        print(f"   S3_BUCKET_NAME={correct_bucket}")
        return False
    else:
        print("✅ S3 bucket name is correct")
        return True

def check_aws_credentials():
    """Check if AWS credentials are configured"""
    print("\nChecking AWS credentials...")
    
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_region = os.getenv("AWS_REGION", "us-east-1")
    
    if aws_access_key and aws_secret_key:
        print("✅ AWS access keys found")
        print(f"   Region: {aws_region}")
        return True
    else:
        print("❌ AWS credentials not found")
        print("🔧 Fix: Set your AWS credentials:")
        print("   export AWS_ACCESS_KEY_ID=your_access_key")
        print("   export AWS_SECRET_ACCESS_KEY=your_secret_key") 
        print("   export AWS_REGION=us-east-1")
        return False

def test_s3_bucket_access():
    """Test if we can access the S3 bucket"""
    print("\nTesting S3 bucket access...")
    
    try:
        import boto3
        from botocore.exceptions import ClientError, NoCredentialsError
        
        # Try to create S3 client
        try:
            s3_client = boto3.client('s3')
            bucket_name = os.getenv("S3_BUCKET_NAME", "visionware-lecture-courses")
            
            # Test bucket access
            response = s3_client.head_bucket(Bucket=bucket_name)
            print(f"✅ S3 bucket '{bucket_name}' is accessible")
            
            # List some objects
            try:
                objects = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=5)
                if 'Contents' in objects:
                    print(f"✅ Found {len(objects['Contents'])} objects in bucket")
                    for obj in objects['Contents'][:3]:
                        print(f"   - {obj['Key']}")
                else:
                    print("⚠️  Bucket is empty or no access to list objects")
                    
                return True
                
            except ClientError as e:
                print(f"⚠️  Can access bucket but cannot list objects: {e}")
                return True  # Bucket exists, access issue might be with listing only
                
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                print(f"❌ Bucket '{bucket_name}' does not exist")
            elif error_code == '403':
                print(f"❌ Access denied to bucket '{bucket_name}'")
                print("🔧 Fix: Check your AWS permissions")
            else:
                print(f"❌ S3 error: {e}")
            return False
            
        except NoCredentialsError:
            print("❌ AWS credentials not configured")
            return False
            
    except ImportError:
        print("❌ boto3 not installed")
        print("🔧 Fix: pip install boto3")
        return False

def create_bucket_policy():
    """Generate the required bucket policy"""
    bucket_name = os.getenv("S3_BUCKET_NAME", "visionware-lecture-courses")
    
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "AllowPreSignedURLAccess",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{bucket_name}/*"
            }
        ]
    }
    
    import json
    policy_file = "s3_bucket_policy.json"
    with open(policy_file, 'w') as f:
        json.dump(policy, f, indent=2)
    
    print(f"\n📄 Created bucket policy file: {policy_file}")
    print("🔧 Apply it with:")
    print(f"   aws s3api put-bucket-policy --bucket {bucket_name} --policy file://{policy_file}")

def main():
    """Main function to run all checks and fixes"""
    print("=== S3 Student Access Fix Script ===\n")
    
    issues_found = []
    
    # Check 1: Environment variables
    if not fix_environment_variables():
        issues_found.append("Environment variables")
    
    # Check 2: AWS credentials
    if not check_aws_credentials():
        issues_found.append("AWS credentials")
    
    # Check 3: S3 bucket access
    if not test_s3_bucket_access():
        issues_found.append("S3 bucket access")
    
    # Generate bucket policy
    create_bucket_policy()
    
    # Summary
    print(f"\n=== Summary ===")
    if issues_found:
        print(f"❌ Issues found: {', '.join(issues_found)}")
        print("\n🔧 Next steps:")
        print("1. Fix the issues listed above")
        print("2. Apply the generated bucket policy")
        print("3. Test student document access again")
    else:
        print("✅ All checks passed!")
        print("If students still can't access documents, apply the bucket policy:")
        print(f"   aws s3api put-bucket-policy --bucket visionware-lecture-courses --policy file://s3_bucket_policy.json")

if __name__ == "__main__":
    main()