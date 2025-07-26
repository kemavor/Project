# S3 Setup Guide for VisionWare

This guide will help you set up AWS S3 for document storage in VisionWare using AWS best practices.

## Prerequisites

1. AWS Account
2. AWS CLI installed and configured (optional but recommended)

## Production Setup (EC2 with IAM Roles) - RECOMMENDED

### Step 1: Create S3 Bucket

1. Go to AWS S3 Console
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `visionware-documents-yourname`)
4. Select your preferred region
5. Keep default settings for now
6. Click "Create bucket"

### Step 2: Create IAM Role for EC2

1. Go to AWS IAM Console
2. Click "Roles" → "Create role"
3. Select "AWS service" → "EC2"
4. Click "Next: Permissions"
5. Click "Create policy" and use this JSON:

```json
{
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
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

6. Name the policy: `VisionWareS3Access`
7. Attach this policy to your role
8. Name the role: `VisionWareEC2Role`

### Step 3: Attach Role to EC2 Instance

1. Go to EC2 Console
2. Select your instance
3. Click "Actions" → "Security" → "Modify IAM role"
4. Select the `VisionWareEC2Role` you created
5. Click "Update IAM role"

### Step 4: Configure Environment Variables

Create a `.env` file in the `fastapi-backend` directory:

```env
# AWS S3 Configuration (Production - IAM Role)
USE_IAM_ROLE=true
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name_here

# Other settings...
DATABASE_URL=sqlite:///./visionware.db
SECRET_KEY=your-super-secret-key-change-this-in-production
```

## Local Development Setup (Access Keys)

### Step 1: Create S3 Bucket (same as above)

### Step 2: Create IAM User for Development

1. Go to AWS IAM Console
2. Click "Users" → "Add user"
3. Enter username: `visionware-dev-user`
4. Select "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search for and select `AmazonS3FullAccess` (or create a custom policy with minimal permissions)
8. Complete the user creation
9. **Save the Access Key ID and Secret Access Key**

### Step 3: Configure Environment Variables

Create a `.env` file in the `fastapi-backend` directory:

```env
# AWS S3 Configuration (Local Development - Access Keys)
USE_IAM_ROLE=false
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name_here

# Other settings...
DATABASE_URL=sqlite:///./visionware.db
SECRET_KEY=your-super-secret-key-change-this-in-production
```

## Step 5: Install Dependencies

```bash
cd fastapi-backend
pip install -r requirements.txt
```

## Step 6: Test the Setup

1. Start the FastAPI server:

```bash
cd fastapi-backend
python main.py
```

2. In another terminal, run the test script:

```bash
cd fastapi-backend
python test_s3_upload.py
```

## Security Best Practices

### ✅ **Production (EC2)**

- **Use IAM Roles**: Never store access keys on EC2 instances
- **Least Privilege**: Only grant necessary S3 permissions
- **VPC Security**: Use private subnets and security groups
- **CloudTrail**: Enable logging for audit trails

### ✅ **Local Development**

- **Temporary Keys**: Rotate access keys regularly
- **Environment Variables**: Never commit keys to version control
- **Limited Permissions**: Use custom policies with minimal access

### ✅ **General**

- **Bucket Encryption**: Enable server-side encryption
- **Versioning**: Enable bucket versioning for data protection
- **Lifecycle Policies**: Set up automatic cleanup of old files
- **CloudFront**: Use CDN for better performance (optional)

## IAM Role vs Access Keys Comparison

| Aspect            | IAM Role (EC2)     | Access Keys (Local) |
| ----------------- | ------------------ | ------------------- |
| **Security**      | ✅ Most Secure     | ⚠️ Less Secure      |
| **Management**    | ✅ Automatic       | ❌ Manual Rotation  |
| **Best Practice** | ✅ AWS Recommended | ❌ Development Only |
| **Setup**         | ⚠️ More Complex    | ✅ Simpler          |
| **Production**    | ✅ Use This        | ❌ Never Use        |

## Troubleshooting

### Common Issues:

1. **Access Denied (IAM Role)**:
   - Check if role is attached to EC2 instance
   - Verify role has correct S3 permissions
   - Check bucket name in policy

2. **Access Denied (Access Keys)**:
   - Verify access keys are correct
   - Check IAM user permissions
   - Ensure bucket exists and is accessible

3. **Bucket Not Found**:
   - Verify bucket name and region
   - Check if bucket exists in correct region

### Testing Commands:

```bash
# Test IAM role (on EC2)
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Test AWS credentials
aws sts get-caller-identity

# List S3 buckets
aws s3 ls

# Test bucket access
aws s3 ls s3://your-bucket-name
```

## File Size Limits

- Maximum file size: 50MB
- Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF
- Files are stored with unique names to prevent conflicts

## Cost Considerations

- S3 Standard storage: ~$0.023 per GB per month
- Data transfer: ~$0.09 per GB (outbound)
- Consider S3 Intelligent Tiering for cost optimization
- IAM roles have no additional cost

## Migration from Access Keys to IAM Role

If you're currently using access keys and want to migrate to IAM roles:

1. Create the IAM role as described above
2. Attach the role to your EC2 instance
3. Update your `.env` file: `USE_IAM_ROLE=true`
4. Remove access key environment variables
5. Restart your FastAPI application
6. Test the upload functionality
7. Delete the IAM user (optional, for cleanup)
