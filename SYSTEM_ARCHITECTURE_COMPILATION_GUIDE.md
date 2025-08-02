# VisionWare System Architecture Compilation Guide

## Overview

VisionWare is a comprehensive educational platform with the following system architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React + TS)  │◄──►│   (FastAPI)     │◄──►│   (SQLite/PG)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Live Stream   │    │   MediaSoup     │    │   Redis Cache   │
│   (RTMP)        │    │   (WebRTC)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## System Components

### 1. Frontend (React + TypeScript + Vite)

- **Location**: `/src`
- **Technology**: React 18, TypeScript, Vite, Tailwind CSS
- **Build Command**: `npm run build`
- **Dependencies**: See `package.json`

### 2. Backend (FastAPI + Python)

- **Location**: `/fastapi-backend`
- **Technology**: FastAPI, SQLAlchemy, Pydantic
- **Build Command**: `pip install -r requirements.txt`
- **Dependencies**: See `fastapi-backend/requirements.txt`

### 3. Live Stream Server (Node.js RTMP)

- **Location**: `/live-stream`
- **Technology**: Node.js, node-media-server
- **Build Command**: `npm install`
- **Dependencies**: See `live-stream/package.json`

### 4. MediaSoup Server (WebRTC)

- **Location**: `/mediasoup-server`
- **Technology**: Node.js, MediaSoup, Socket.IO
- **Build Command**: `npm install`
- **Dependencies**: See `mediasoup-server/package.json`

## Quick Compilation Commands

### For Windows (PowerShell)

```powershell
# Full system compilation
.\build-system.ps1

# Skip Docker builds
.\build-system.ps1 -SkipDocker

# Skip tests
.\build-system.ps1 -SkipTests

# Skip both Docker and tests
.\build-system.ps1 -SkipDocker -SkipTests
```

### For Linux/macOS (Bash)

```bash
# Make script executable
chmod +x build-system.sh

# Full system compilation
./build-system.sh

# Run with specific options
./build-system.sh --skip-docker --skip-tests
```

## Manual Compilation Steps

### 1. Frontend Compilation

```bash
# Install dependencies
npm install

# TypeScript compilation
npx tsc -b

# Build with Vite
npm run build
```

### 2. Backend Compilation

```bash
cd fastapi-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python -c "
import sys
sys.path.append('.')
from database import engine
from models import Base
Base.metadata.create_all(bind=engine)
print('Database tables created successfully')
"
```

### 3. Live Stream Server Compilation

```bash
cd live-stream

# Install dependencies
npm install
```

### 4. MediaSoup Server Compilation

```bash
cd mediasoup-server

# Install dependencies
npm install
```

## Docker Compilation

### Frontend Docker Image

```bash
docker build -f Dockerfile.frontend -t visionware-frontend .
```

### Backend Docker Image (if Dockerfile exists)

```bash
docker build -f fastapi-backend/Dockerfile -t visionware-backend ./fastapi-backend
```

### Live Stream Docker Image (if Dockerfile exists)

```bash
docker build -f live-stream/Dockerfile -t visionware-livestream ./live-stream
```

### MediaSoup Docker Image

```bash
docker build -f mediasoup-server/Dockerfile -t visionware-mediasoup ./mediasoup-server
```

## Production Deployment

### Using Docker Compose

```bash
# Copy environment file
cp production.env.example production.env

# Edit environment variables
nano production.env

# Start all services
docker-compose -f docker-compose.prod.yml up -d
```

### Individual Service Deployment

#### Frontend (Nginx)

```bash
# Build frontend
npm run build

# Serve with nginx
docker run -d -p 80:80 -v $(pwd)/dist:/usr/share/nginx/html nginx:alpine
```

#### Backend (FastAPI)

```bash
cd fastapi-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Live Stream Server

```bash
cd live-stream
npm start
```

#### MediaSoup Server

```bash
cd mediasoup-server
npm start
```

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/visionware
POSTGRES_DB=visionware_prod
POSTGRES_USER=visionware
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_URL=redis://:password@localhost:6379/0
REDIS_PASSWORD=secure_redis_password

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name

# Security
SECRET_KEY=your_secret_key

# AI/ML Services
GEMINI_API_KEY=your_gemini_api_key
ECHO_MODEL=gemini-1.5-flash
ECHO_MAX_TOKENS=2048
ECHO_TEMPERATURE=0.7

# Application Settings
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
WORKERS=4
LOG_LEVEL=INFO
RATE_LIMIT_PER_MINUTE=60
MAX_FILE_SIZE=50
SESSION_TIMEOUT_HOURS=24
```

## System Requirements

### Minimum Requirements

- **Node.js**: 18.0.0+
- **Python**: 3.8+
- **RAM**: 4GB
- **Storage**: 10GB
- **CPU**: 2 cores

### Recommended Requirements

- **Node.js**: 20.0.0+
- **Python**: 3.11+
- **RAM**: 8GB
- **Storage**: 50GB
- **CPU**: 4 cores
- **Docker**: 20.10+

## Troubleshooting

### Common Issues

#### 1. Node.js Version Issues

```bash
# Check Node.js version
node --version

# Install Node.js 18+ if needed
# Windows: Download from https://nodejs.org/
# Linux: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
# macOS: brew install node@18
```

#### 2. Python Virtual Environment Issues

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

#### 3. Database Connection Issues

```bash
# Check if database is accessible
python -c "import sqlite3; print('SQLite OK')"

# For PostgreSQL
psql -h localhost -U visionware -d visionware_prod
```

#### 4. Port Conflicts

```bash
# Check what's using port 8000
netstat -tulpn | grep :8000

# Kill process if needed
kill -9 <PID>
```

### Log Files

- **Frontend**: Check browser console
- **Backend**: `/logs/backend.log`
- **Live Stream**: `/logs/livestream.log`
- **MediaSoup**: `/logs/mediasoup.log`

## Development vs Production

### Development Mode

```bash
# Frontend
npm run dev

# Backend
cd fastapi-backend
uvicorn main:app --reload

# Live Stream
cd live-stream
npm run dev

# MediaSoup
cd mediasoup-server
npm run dev
```

### Production Mode

```bash
# Use Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or individual services
docker run -d visionware-frontend
docker run -d visionware-backend
docker run -d visionware-livestream
docker run -d visionware-mediasoup
```

## Monitoring and Health Checks

### Health Check Endpoints

- **Frontend**: `http://localhost:80`
- **Backend**: `http://localhost:8000/api/health`
- **Live Stream**: `http://localhost:1935`
- **MediaSoup**: `http://localhost:3000/health`

### Monitoring Commands

```bash
# Check all services
docker ps

# Check logs
docker logs visionware-backend
docker logs visionware-frontend

# Check resource usage
docker stats
```

## Security Considerations

### Production Security Checklist

- [ ] Update all default passwords
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Database backup strategy

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Update dependencies
2. **Monthly**: Security patches
3. **Quarterly**: Performance review
4. **Annually**: Architecture review

### Backup Strategy

```bash
# Database backup
pg_dump visionware_prod > backup_$(date +%Y%m%d).sql

# File uploads backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Configuration backup
cp production.env backup_env_$(date +%Y%m%d)
```

This compilation guide provides everything needed to build and deploy the VisionWare system architecture successfully.
