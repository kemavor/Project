# CloudFront Secure Content Access Setup

This guide explains how to set up CloudFront signed URLs for secure content access in your VisionWare application.

## Overview

The system uses CloudFront signed URLs to provide secure, time-limited access to course documents and lecture videos. This ensures that:

- Content is only accessible to authenticated users
- Access is time-limited for security
- Content can be restricted by IP address
- All content is served through CloudFront's global CDN

## Prerequisites

1. **AWS Account** with CloudFront and S3 access
2. **CloudFront Distribution** configured to serve your S3 bucket
3. **CloudFront Key Pair** created in AWS
4. **Private Key** downloaded and securely stored

## Phase 1: AWS CloudFront Setup

### 1. Create CloudFront Distribution

1. Go to AWS CloudFront console
2. Create a new distribution
3. Set origin domain to your S3 bucket
4. Configure behaviors for your content paths:
   - `/courses/*` - Course documents
   - `/lectures/*` - Lecture videos
5. Enable "Restrict Viewer Access" and select "Signed URLs"
6. Note your distribution domain (e.g., `d1234567890abc.cloudfront.net`)

### 2. Create CloudFront Key Pair

1. Go to CloudFront console → Key management
2. Create a new key pair
3. Download the private key file (`.pem`)
4. Note the Key Pair ID

### 3. Configure S3 Bucket

1. Ensure your S3 bucket contains content organized as:
   ```
   your-bucket/
   ├── courses/
   │   ├── year_1/
   │   │   ├── introduction_to_computer_science/
   │   │   │   └── document.pdf
   │   │   └── mathematics_for_computing/
   │   │       └── document.pdf
   │   └── year_2/
   │       └── ...
   └── lectures/
       ├── lecture_001/
       │   └── video.mp4
       └── lecture_002/
           └── video.mp4
   ```

## Phase 2: Environment Configuration

### 1. Set Environment Variables

Add these to your `.env` file or environment:

```bash
# CloudFront Configuration
CLOUDFRONT_DOMAIN=d1234567890abc.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=YOUR_KEY_PAIR_ID

# Private Key (choose one method)
# Method 1: Path to private key file
CLOUDFRONT_PRIVATE_KEY_PATH=/path/to/your/private_key.pem

# Method 2: Private key content (for containerized deployments)
CLOUDFRONT_PRIVATE_KEY_CONTENT="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"

# Optional Settings
CLOUDFRONT_DOCUMENT_EXPIRY=60
CLOUDFRONT_VIDEO_EXPIRY=120
CLOUDFRONT_ENABLE_IP_RESTRICTION=false
```

### 2. Install Dependencies

```bash
pip install boto3 cryptography
```

## Phase 3: Backend Integration

### 1. Update Course Data

Use the management command to update existing courses with CloudFront paths:

```bash
python manage.py update_cloudfront_paths
```

### 2. Test Configuration

Run the CloudFront integration test:

```bash
python test_cloudfront_integration.py
```

### 3. API Endpoints

The following endpoints are now available:

- `GET /api/courses/` - List courses with CloudFront URLs
- `GET /api/courses/{id}/document_access/` - Get secure document access
- `GET /api/courses/{id}/secure_document/` - Get IP-restricted access
- `POST /api/courses/{id}/request_access/` - Request document access

## Phase 4: Frontend Integration

### 1. Secure Document Viewer

The frontend now includes a `SecureDocumentViewer` component that:

- Requests secure access to documents
- Shows access expiration time
- Provides download and view options
- Handles access expiration gracefully

### 2. Course Cards

Course cards now show:

- Secure access badges
- CloudFront signed URLs when available
- Fallback to regular URLs when CloudFront is not configured

## Security Features

### 1. Time-Limited Access

- Document URLs expire after 60 minutes by default
- Video URLs expire after 120 minutes by default
- Configurable expiration times

### 2. IP Address Restriction

- Optional IP address restriction for additional security
- Automatically detects client IP from request headers
- Supports X-Forwarded-For for proxy environments

### 3. Authentication Required

- All endpoints require user authentication
- Additional authorization checks can be added per course

## Usage Examples

### 1. Basic Document Access

```python
# In your Django view
course = Course.objects.get(id=1)
secure_url = course.get_cloudfront_signed_url(expire_minutes=60)
```

### 2. IP-Restricted Access

```python
# With IP restriction
client_ip = request.META.get('REMOTE_ADDR')
secure_url = course.get_document_access_url(
    user_ip=client_ip,
    expire_minutes=60
)
```

### 3. Frontend Usage

```typescript
// In React component
const { getSecureDocumentAccess } = useCourses();
const access = await getSecureDocumentAccess(courseId);
if (access) {
  window.open(access.secure_document_url, "_blank");
}
```

## Troubleshooting

### 1. Configuration Issues

- Run `python test_cloudfront_integration.py` to diagnose issues
- Check environment variables are set correctly
- Verify private key format and permissions

### 2. URL Generation Issues

- Ensure CloudFront distribution is active
- Check Key Pair ID is correct
- Verify private key matches the Key Pair

### 3. Access Issues

- Check user authentication
- Verify course enrollment (if implemented)
- Ensure IP restrictions are configured correctly

## Best Practices

1. **Security**

   - Never commit private keys to source control
   - Use environment variables or AWS Secrets Manager
   - Regularly rotate CloudFront key pairs

2. **Performance**

   - Use appropriate expiration times
   - Cache signed URLs when possible
   - Monitor CloudFront usage and costs

3. **Monitoring**
   - Log access attempts and failures
   - Monitor URL generation performance
   - Track content access patterns

## Advanced Configuration

### Custom Policies

You can create custom CloudFront policies for advanced restrictions:

```python
custom_policy = {
    "Statement": [
        {
            "Resource": f"https://{domain}/{path}",
            "Condition": {
                "DateLessThan": {"AWS:EpochTime": expiry_timestamp},
                "IpAddress": {"AWS:SourceIp": f"{ip}/32"},
                "StringEquals": {"AWS:Referer": "https://yourdomain.com"}
            }
        }
    ]
}
```

### Multiple Distributions

For different content types, you can configure multiple CloudFront distributions:

```python
# In settings
CLOUDFRONT_DOCUMENTS_DOMAIN = "docs.yourdomain.com"
CLOUDFRONT_VIDEOS_DOMAIN = "videos.yourdomain.com"
```

This setup provides a robust, secure content delivery system for your educational platform.
