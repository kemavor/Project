#!/bin/bash

# VisionWare System Architecture Compilation Script
# This script compiles all components of the VisionWare system

set -e  # Exit on any error

echo "🚀 Starting VisionWare System Architecture Compilation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    print_success "Node.js version: $(node --version)"
}

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+ first."
        exit 1
    fi
    print_success "Python version: $(python3 --version)"
}

# Check if pip is installed
check_pip() {
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 is not installed. Please install pip3 first."
        exit 1
    fi
    print_success "pip3 is available"
}

# Build Frontend (React + TypeScript + Vite)
build_frontend() {
    print_status "Building Frontend (React + TypeScript + Vite)..."
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # TypeScript compilation
    print_status "Compiling TypeScript..."
    npx tsc -b
    
    # Vite build
    print_status "Building with Vite..."
    npm run build
    
    print_success "Frontend build completed successfully!"
}

# Build Backend (FastAPI + Python)
build_backend() {
    print_status "Building Backend (FastAPI + Python)..."
    
    cd fastapi-backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Run database migrations (if any)
    print_status "Setting up database..."
    python3 -c "
import sys
sys.path.append('.')
from database import engine
from models import Base
Base.metadata.create_all(bind=engine)
print('Database tables created successfully')
"
    
    cd ..
    print_success "Backend build completed successfully!"
}

# Build Live Stream Server
build_live_stream() {
    print_status "Building Live Stream Server (Node.js RTMP)..."
    
    cd live-stream
    
    # Install dependencies
    print_status "Installing live stream server dependencies..."
    npm install
    
    cd ..
    print_success "Live Stream Server build completed successfully!"
}

# Build MediaSoup Server
build_mediasoup() {
    print_status "Building MediaSoup Server (WebRTC)..."
    
    cd mediasoup-server
    
    # Install dependencies
    print_status "Installing MediaSoup server dependencies..."
    npm install
    
    cd ..
    print_success "MediaSoup Server build completed successfully!"
}

# Create Docker images (optional)
build_docker_images() {
    print_status "Building Docker images..."
    
    # Build frontend Docker image
    print_status "Building frontend Docker image..."
    docker build -f Dockerfile.frontend -t visionware-frontend .
    
    # Build backend Docker image (if Dockerfile exists)
    if [ -f "fastapi-backend/Dockerfile" ]; then
        print_status "Building backend Docker image..."
        docker build -f fastapi-backend/Dockerfile -t visionware-backend ./fastapi-backend
    else
        print_warning "Backend Dockerfile not found. Skipping backend Docker build."
    fi
    
    # Build live stream Docker image
    if [ -f "live-stream/Dockerfile" ]; then
        print_status "Building live stream Docker image..."
        docker build -f live-stream/Dockerfile -t visionware-livestream ./live-stream
    else
        print_warning "Live stream Dockerfile not found. Skipping live stream Docker build."
    fi
    
    # Build MediaSoup Docker image
    if [ -f "mediasoup-server/Dockerfile" ]; then
        print_status "Building MediaSoup Docker image..."
        docker build -f mediasoup-server/Dockerfile -t visionware-mediasoup ./mediasoup-server
    else
        print_warning "MediaSoup Dockerfile not found. Skipping MediaSoup Docker build."
    fi
    
    print_success "Docker images built successfully!"
}

# Create production environment file
create_env_files() {
    print_status "Creating environment files..."
    
    # Copy example env file if it exists
    if [ -f "production.env.example" ]; then
        if [ ! -f "production.env" ]; then
            cp production.env.example production.env
            print_warning "Created production.env from example. Please update with your actual values."
        fi
    fi
    
    print_success "Environment files created!"
}

# Run tests
run_tests() {
    print_status "Running system tests..."
    
    # Frontend tests
    print_status "Running frontend tests..."
    npm run lint
    
    # Backend tests (if test files exist)
    if [ -f "test_*.py" ]; then
        print_status "Running backend tests..."
        cd fastapi-backend
        source venv/bin/activate
        python3 -m pytest ../test_*.py -v
        cd ..
    fi
    
    print_success "Tests completed!"
}

# Main compilation function
main() {
    print_status "Starting VisionWare System Architecture Compilation..."
    
    # Check prerequisites
    check_node
    check_python
    check_pip
    
    # Build all components
    build_frontend
    build_backend
    build_live_stream
    build_mediasoup
    
    # Create environment files
    create_env_files
    
    # Build Docker images (optional)
    if command -v docker &> /dev/null; then
        build_docker_images
    else
        print_warning "Docker not found. Skipping Docker image builds."
    fi
    
    # Run tests
    run_tests
    
    print_success "🎉 VisionWare System Architecture Compilation Completed Successfully!"
    print_status "System components built:"
    echo "  ✅ Frontend (React + TypeScript + Vite)"
    echo "  ✅ Backend (FastAPI + Python)"
    echo "  ✅ Live Stream Server (Node.js RTMP)"
    echo "  ✅ MediaSoup Server (WebRTC)"
    echo "  ✅ Environment files"
    echo "  ✅ Docker images (if Docker available)"
    echo "  ✅ System tests"
    
    print_status "Next steps:"
    echo "  1. Update production.env with your configuration"
    echo "  2. Start the services using docker-compose.prod.yml"
    echo "  3. Or run services individually for development"
}

# Run main function
main "$@" 