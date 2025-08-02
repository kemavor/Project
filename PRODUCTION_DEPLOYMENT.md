# 🚀 VisionWare Production Deployment Guide

This guide provides comprehensive instructions for deploying VisionWare in a production environment with proper security, monitoring, and scalability.

## 📋 Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **CPU**: Minimum 2 cores, Recommended 4+ cores
- **Storage**: Minimum 50GB, Recommended 100GB+ SSD
- **Network**: Stable internet connection

### Software Requirements

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: Latest version
- **SSL Certificate**: Valid SSL certificate for your domain

## 🔧 Pre-Deployment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git unzip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Clone Repository

```bash
git clone https://github.com/your-org/visionware.git
cd visionware
```

### 3. Environment Configuration

```bash
# Copy production environment template
cp production.env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**

```bash
# Environment
ENVIRONMENT=production

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/visionware_prod

# Security
SECRET_KEY=your-super-secure-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=visionware-documents-prod
USE_IAM_ROLE=true

# ECHO Configuration
GEMINI_API_KEY=your-gemini-api-key

# Server Configuration
HOST=0.0.0.0
PORT=8000
WORKERS=4
LOG_LEVEL=INFO

# Redis
REDIS_PASSWORD=secure_redis_password

# Grafana
GRAFANA_PASSWORD=admin123
```

## 🚀 Deployment Steps

### 1. Run Deployment Script

```bash
# Make script executable
chmod +x deploy-production.sh

# Run deployment
./deploy-production.sh
```

### 2. Manual Deployment (Alternative)

```bash
# Create production directories
mkdir -p logs ssl uploads

# Set permissions
chmod 755 logs ssl uploads

# Build and start services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
sleep 30

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend python -m alembic upgrade head

# Create admin user
docker-compose -f docker-compose.prod.yml exec backend python -c "
from database import SessionLocal
from models import User
from auth import get_password_hash

db = SessionLocal()
try:
    admin = db.query(User).filter(User.username == 'admin').first()
    if not admin:
        admin_user = User(
            username='admin',
            email='admin@visionware.com',
            hashed_password=get_password_hash('admin123'),
            role='super_admin',
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print('Admin user created successfully')
    else:
        print('Admin user already exists')
finally:
    db.close()
"
```

## 🔒 Security Configuration

### 1. SSL Certificate Setup

```bash
# For Let's Encrypt (recommended)
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to project directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem

# Set proper permissions
sudo chmod 600 ssl/cert.pem ssl/key.pem
```

### 2. Firewall Configuration

```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Security Headers

The Nginx configuration includes security headers:

- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy
- Content-Security-Policy
- Strict-Transport-Security

## 📊 Monitoring Setup

### 1. Prometheus Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "visionware-backend"
    static_configs:
      - targets: ["backend:8000"]
    metrics_path: "/metrics"

  - job_name: "visionware-frontend"
    static_configs:
      - targets: ["frontend:3000"]

  - job_name: "nginx"
    static_configs:
      - targets: ["nginx:80"]
    metrics_path: "/nginx_status"
```

### 2. Grafana Dashboards

Create `monitoring/grafana/dashboards/dashboard.json`:

```json
{
  "dashboard": {
    "id": null,
    "title": "VisionWare Dashboard",
    "tags": ["visionware"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "API Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

## 🔧 Post-Deployment Configuration

### 1. Change Default Passwords

```bash
# Access the application
# Login with: admin / admin123
# Change the admin password immediately
```

### 2. Configure Email Notifications

```bash
# Add email configuration to .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@your-domain.com
```

### 3. Set Up Backup Strategy

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Database backup
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U visionware visionware_prod > $BACKUP_DIR/db_backup_$DATE.sql

# Uploads backup
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily backup at 2 AM)
echo "0 2 * * * /path/to/visionware/backup.sh" | crontab -
```

## 📈 Scaling Configuration

### 1. Horizontal Scaling

```bash
# Scale backend workers
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale celery workers
docker-compose -f docker-compose.prod.yml up -d --scale celery=2
```

### 2. Load Balancer Setup

For high-traffic deployments, consider using a load balancer:

```nginx
# nginx load balancer configuration
upstream backend_cluster {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Issues**

   ```bash
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs db

   # Test database connection
   docker-compose -f docker-compose.prod.yml exec backend python -c "
   from database import engine
   from sqlalchemy import text
   with engine.connect() as conn:
       result = conn.execute(text('SELECT 1'))
       print('Database connection successful')
   "
   ```

2. **SSL Certificate Issues**

   ```bash
   # Check SSL certificate
   openssl x509 -in ssl/cert.pem -text -noout

   # Test SSL connection
   curl -I https://your-domain.com
   ```

3. **Memory Issues**

   ```bash
   # Check container resource usage
   docker stats

   # Increase memory limits in docker-compose.prod.yml
   ```

### Log Analysis

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Check error logs
tail -f logs/nginx/error.log
tail -f logs/backend/error.log
```

## 🔄 Maintenance

### 1. Regular Updates

```bash
# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Update SSL certificates (Let's Encrypt)
sudo certbot renew
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
docker-compose -f docker-compose.prod.yml restart nginx
```

### 2. Database Maintenance

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend python -m alembic upgrade head

# Database optimization
docker-compose -f docker-compose.prod.yml exec db psql -U visionware -d visionware_prod -c "VACUUM ANALYZE;"
```

### 3. Monitoring Alerts

Set up monitoring alerts for:

- High CPU/Memory usage
- Database connection failures
- SSL certificate expiration
- Disk space usage
- Application errors

## 📞 Support

For production support:

- **Documentation**: Check this guide and inline code comments
- **Logs**: Use the logging commands above
- **Monitoring**: Access Grafana at `https://your-domain.com:3001`
- **Health Checks**: Visit `https://your-domain.com/health`

## ✅ Deployment Checklist

- [ ] Server prepared with Docker and Docker Compose
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Services deployed and running
- [ ] Database migrations completed
- [ ] Admin user created
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Default passwords changed
- [ ] Email notifications configured
- [ ] Documentation updated

---

**🎉 Congratulations! VisionWare is now running in production with enterprise-grade security, monitoring, and scalability.**
