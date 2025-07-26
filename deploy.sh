#!/bin/bash

# VisionWare Production Deployment Script
set -e

echo "🚀 Starting VisionWare Production Deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your production environment variables."
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
required_vars=(
    "DJANGO_SECRET_KEY"
    "DB_NAME"
    "DB_USER"
    "DB_PASSWORD"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_STORAGE_BUCKET_NAME"
    "CLOUDFRONT_DOMAIN"
    "CLOUDFRONT_KEY_ID"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set."
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Create SSL certificates directory
mkdir -p nginx/ssl

# Generate self-signed certificate for development (replace with real certs in production)
if [ ! -f nginx/ssl/cert.pem ]; then
    echo "🔐 Generating SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# Build and start services
echo "🐳 Building and starting Docker services..."
docker-compose -f docker-compose.prod.yml build

echo "📦 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create superuser if it doesn't exist
echo "👤 Creating superuser..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py shell << EOF
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@visionware.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
EOF

# Collect static files
echo "📁 Collecting static files..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Check service health
echo "🏥 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your VisionWare application is now running at:"
echo "   - Frontend: https://localhost"
echo "   - Backend API: https://localhost/api/"
echo "   - Admin Panel: https://localhost/api/admin/"
echo ""
echo "🔑 Default admin credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📝 Next steps:"
echo "   1. Update the admin password"
echo "   2. Configure your domain in nginx/nginx.conf"
echo "   3. Replace SSL certificates with real ones"
echo "   4. Set up monitoring and logging"
echo ""
echo "📊 To view logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f" 