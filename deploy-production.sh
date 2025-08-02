#!/bin/bash

# Production Deployment Script for VisionWare
# This script handles the complete production deployment process

set -e  # Exit on any error

echo "🚀 Starting VisionWare Production Deployment"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error "Production .env file not found!"
    print_warning "Please copy production.env.example to .env and configure it"
    exit 1
fi

# Load environment variables
print_status "Loading environment configuration..."
source .env

# Validate required environment variables
print_status "Validating environment configuration..."

required_vars=(
    "ENVIRONMENT"
    "DATABASE_URL"
    "SECRET_KEY"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "S3_BUCKET_NAME"
    "GEMINI_API_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set"
        exit 1
    fi
done

print_status "Environment validation passed"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Create production directories
print_status "Creating production directories..."
mkdir -p logs
mkdir -p ssl
mkdir -p uploads

# Set proper permissions
print_status "Setting proper permissions..."
chmod 755 logs
chmod 755 ssl
chmod 755 uploads

# Build and start services
print_status "Building Docker images..."
docker-compose -f docker-compose.prod.yml build

print_status "Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend python -m alembic upgrade head

# Create admin user if it doesn't exist
print_status "Setting up initial admin user..."
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

# Health check
print_status "Performing health check..."
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    print_status "Backend health check passed"
else
    print_error "Backend health check failed"
    exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend health check passed"
else
    print_error "Frontend health check failed"
    exit 1
fi

# Setup SSL certificates (if provided)
if [ ! -z "$SSL_CERTFILE" ] && [ ! -z "$SSL_KEYFILE" ]; then
    print_status "Setting up SSL certificates..."
    if [ -f "$SSL_CERTFILE" ] && [ -f "$SSL_KEYFILE" ]; then
        cp "$SSL_CERTFILE" ssl/cert.pem
        cp "$SSL_KEYFILE" ssl/key.pem
        chmod 600 ssl/cert.pem ssl/key.pem
        print_status "SSL certificates configured"
    else
        print_warning "SSL certificate files not found, using HTTP"
    fi
fi

# Setup Nginx configuration
print_status "Configuring Nginx..."
if [ -f "nginx/nginx.prod.conf" ]; then
    cp nginx/nginx.prod.conf nginx/nginx.conf
    print_status "Nginx production configuration applied"
else
    print_warning "Nginx production configuration not found"
fi

# Restart Nginx with new configuration
print_status "Restarting Nginx..."
docker-compose -f docker-compose.prod.yml restart nginx

# Final health check
print_status "Performing final health check..."
sleep 10

if curl -f http://localhost > /dev/null 2>&1; then
    print_status "✅ Production deployment completed successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost (or your domain)"
    echo "   Backend API: http://localhost/api"
    echo "   Admin Panel: http://localhost/admin"
    echo ""
    echo "🔐 Default Admin Credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "⚠️  IMPORTANT: Change the admin password immediately!"
    echo ""
    echo "📊 Monitoring:"
    echo "   Logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "   Status: docker-compose -f docker-compose.prod.yml ps"
    echo ""
else
    print_error "❌ Final health check failed"
    exit 1
fi

echo "🎉 VisionWare is now running in production mode!" 