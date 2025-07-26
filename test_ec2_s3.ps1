#!/usr/bin/env pwsh

# VisionWare EC2 S3 Integration Test Script
param(
    [Parameter(Mandatory=$true)]
    [string]$EC2_IP,
    
    [Parameter(Mandatory=$false)]
    [string]$KeyPath = "ec2keypair.pem",
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "ubuntu"
)

Write-Host "🧪 Testing S3 Integration on EC2..." -ForegroundColor Green
Write-Host "EC2 IP: $EC2_IP" -ForegroundColor Cyan

try {
    # Test IAM role access
    Write-Host "🔍 Testing IAM role access..." -ForegroundColor Yellow
    ssh -i $KeyPath $Username@$EC2_IP "cd ~/VisionWare/backend && echo 'Testing IAM role metadata access...' && curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/ || echo 'No IAM role attached'"

    # Test AWS credentials
    Write-Host "🔑 Testing AWS credentials..." -ForegroundColor Yellow
    ssh -i $KeyPath $Username@$EC2_IP @"
cd ~/VisionWare/backend
python3 -c "
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
try:
    session = boto3.Session()
    credentials = session.get_credentials()
    if credentials:
        print('✅ AWS credentials found')
        print(f'Access Key: {credentials.access_key[:8]}...')
        print(f'Method: {credentials.method}')
    else:
        print('❌ No AWS credentials found')
except Exception as e:
    print(f'❌ Error: {e}')
"
"@

    # Test S3 connection
    Write-Host "🪣 Testing S3 bucket access..." -ForegroundColor Yellow
    ssh -i $KeyPath $Username@$EC2_IP @"
cd ~/VisionWare/backend
python3 -c "
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
try:
    s3 = boto3.client('s3')
    response = s3.list_objects_v2(Bucket='visionware-lecture-courses', MaxKeys=5)
    if 'Contents' in response:
        print('✅ S3 bucket access successful')
        print(f'Found {len(response[\"Contents\"])} objects')
        for obj in response['Contents'][:3]:
            print(f'  - {obj[\"Key\"]}')
    else:
        print('⚠️ S3 bucket is empty')
except ClientError as e:
    error_code = e.response['Error']['Code']
    if error_code == 'NoSuchBucket':
        print('❌ Bucket \"visionware-lecture-courses\" does not exist')
    elif error_code == 'AccessDenied':
        print('❌ Access denied to bucket')
    else:
        print(f'❌ S3 Error: {error_code}')
except NoCredentialsError:
    print('❌ No AWS credentials configured')
except Exception as e:
    print(f'❌ Unexpected error: {e}')
"
"@

    # Run Django management commands
    Write-Host "🎯 Running Django S3 discovery..." -ForegroundColor Yellow
    ssh -i $KeyPath $Username@$EC2_IP @"
cd ~/VisionWare/backend
echo "Running discover_s3_files management command..."
python3 manage.py discover_s3_files --verbosity=2
"@

    # Check database for courses
    Write-Host "📊 Checking courses in database..." -ForegroundColor Yellow
    ssh -i $KeyPath $Username@$EC2_IP @"
cd ~/VisionWare/backend
python3 manage.py shell -c "
from courses.models import Course
courses = Course.objects.all()
print(f'Total courses in database: {courses.count()}')
for course in courses[:5]:
    print(f'  - {course.name} (Year {course.year})')
"
"@

    # Test API endpoint
    Write-Host "🌐 Testing courses API endpoint..." -ForegroundColor Yellow
    ssh -i $KeyPath $Username@$EC2_IP @"
cd ~/VisionWare/backend
echo "Starting Django server in background..."
python3 manage.py runserver 0.0.0.0:8000 &
SERVER_PID=\$!
sleep 5

echo "Testing API endpoint..."
curl -s http://localhost:8000/api/courses/ | python3 -m json.tool | head -20

echo "Stopping server..."
kill \$SERVER_PID 2>/dev/null || true
"@

    Write-Host "✅ S3 integration test completed!" -ForegroundColor Green

} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 