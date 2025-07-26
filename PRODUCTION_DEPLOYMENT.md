# VisionWare Production Deployment Guide

## Overview

This guide will help you deploy VisionWare to production with proper security, performance, and scalability configurations.

## Prerequisites

### 1. Server Requirements

- **CPU**: 2+ cores
- **RAM**: 4GB+
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### 2. Domain & SSL

- Registered domain name
- SSL certificate (Let's Encrypt recommended)
- DNS configured to point to your server

### 3. Cloud Services

- AWS account with S3 bucket
- CloudFront distribution
- PostgreSQL database (RDS or managed service)
- Redis instance (ElastiCache or managed service)

## Environment Setup

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your production values:

```bash
# Django Configuration
DJANGO_SECRET_KEY=your-very-secure-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database Configuration
DB_NAME=visionware_prod
DB_USER=visionware_user
DB_PASSWORD=your-secure-db-password
DB_HOST=your-db-host
DB_PORT=5432

# Redis Configuration
REDIS_URL=redis://your-redis-host:6379/0

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=your-s3-bucket
AWS_S3_REGION_NAME=us-east-1

# CloudFront Configuration
CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net
CLOUDFRONT_KEY_ID=your-cloudfront-key-id
CLOUDFRONT_PRIVATE_KEY_PATH=pkcs8.priv

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Frontend Configuration
VITE_API_URL=https://yourdomain.com/api
VITE_WS_URL=wss://yourdomain.com/ws

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW=3600
```

## AWS Setup

### 1. S3 Bucket Configuration

```bash
# Create S3 bucket
aws s3 mb s3://your-visionware-bucket

# Configure bucket policy for CloudFront
aws s3api put-bucket-policy --bucket your-visionware-bucket --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-visionware-bucket/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::your-account-id:distribution/your-distribution-id"
        }
      }
    }
  ]
}'
```

### 2. CloudFront Distribution

1. Create CloudFront distribution
2. Set origin to your S3 bucket
3. Configure origin access control
4. Enable HTTPS only
5. Set up custom domain with SSL certificate

### 3. IAM User for Application

```bash
# Create IAM user
aws iam create-user --user-name visionware-app

# Attach policies
aws iam attach-user-policy --user-name visionware-app --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-user-policy --user-name visionware-app --policy-arn arn:aws:iam::aws:policy/CloudFrontFullAccess

# Create access keys
aws iam create-access-key --user-name visionware-app
```

## Database Setup

### PostgreSQL (RDS)

```sql
-- Create database
CREATE DATABASE visionware_prod;

-- Create user
CREATE USER visionware_user WITH PASSWORD 'your-secure-password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE visionware_prod TO visionware_user;
```

### Redis (ElastiCache)

1. Create ElastiCache cluster
2. Configure security groups
3. Note the endpoint URL

## SSL Certificate Setup

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt update
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

## Deployment

### 1. Clone Repository

```bash
git clone https://github.com/your-username/visionware.git
cd visionware
```

### 2. Configure Nginx

Update `nginx/nginx.conf` with your domain:

```nginx
server_name yourdomain.com www.yourdomain.com;
```

### 3. Run Deployment Script

```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test endpoints
curl https://yourdomain.com/health/
curl https://yourdomain.com/api/
```

## Post-Deployment

### 1. Security Hardening

```bash
# Update admin password
docker-compose -f docker-compose.prod.yml exec backend python manage.py shell
```

```python
from django.contrib.auth.models import User
admin = User.objects.get(username='admin')
admin.set_password('your-secure-admin-password')
admin.save()
```

### 2. Backup Setup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Database backup
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Media files backup
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz media/

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab
echo "0 2 * * * /path/to/visionware/backup.sh" | crontab -
```

### 3. Monitoring Setup

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Set up log rotation
sudo logrotate -f /etc/logrotate.conf
```

### 4. SSL Auto-Renewal

```bash
# Add to crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f docker-compose.prod.yml restart nginx" | crontab -
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, is_read);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_applications_status ON course_applications(status);
```

### 2. Caching Configuration

```python
# In production.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
            }
        },
        'KEY_PREFIX': 'visionware',
        'TIMEOUT': 300,
    }
}
```

### 3. CDN Configuration

- Configure CloudFront caching rules
- Set up cache invalidation for content updates
- Enable compression

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   ```bash
   # Check database connectivity
   docker-compose -f docker-compose.prod.yml exec backend python manage.py dbshell
   ```

2. **Static Files Not Loading**

   ```bash
   # Recollect static files
   docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
   ```

3. **WebSocket Connection Issues**

   ```bash
   # Check WebSocket logs
   docker-compose -f docker-compose.prod.yml logs websocket
   ```

4. **SSL Certificate Issues**
   ```bash
   # Test SSL configuration
   openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
   ```

### Log Analysis

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f backend

# View nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx

# View database logs
docker-compose -f docker-compose.prod.yml logs -f db
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3 --scale celery=2
```

### Load Balancer Setup

- Use AWS Application Load Balancer
- Configure health checks
- Set up auto-scaling groups

## Maintenance

### Regular Tasks

- Monitor disk space and logs
- Update dependencies monthly
- Review security patches
- Test backup restoration
- Monitor performance metrics

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

## Support

For issues and questions:

- Check the logs first
- Review this deployment guide
- Create an issue on GitHub
- Contact the development team

---

**Remember**: Always test changes in a staging environment before applying to production!
