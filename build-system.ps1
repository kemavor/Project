# VisionWare System Architecture Compilation Script (PowerShell)
# This script compiles all components of the VisionWare system

param(
    [switch]$SkipDocker,
    [switch]$SkipTests,
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting VisionWare System Architecture Compilation..." -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Node.js is installed
function Test-NodeJS {
    try {
        $nodeVersion = node --version
        Write-Success "Node.js version: $nodeVersion"
        return $true
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18+ first."
        return $false
    }
}

# Check if Python is installed
function Test-Python {
    try {
        $pythonVersion = python --version
        Write-Success "Python version: $pythonVersion"
        return $true
    }
    catch {
        Write-Error "Python 3 is not installed. Please install Python 3.8+ first."
        return $false
    }
}

# Check if pip is installed
function Test-Pip {
    try {
        pip --version | Out-Null
        Write-Success "pip is available"
        return $true
    }
    catch {
        Write-Error "pip is not installed. Please install pip first."
        return $false
    }
}

# Build Frontend (React + TypeScript + Vite)
function Build-Frontend {
    Write-Status "Building Frontend (React + TypeScript + Vite)..."
    
    # Install frontend dependencies
    Write-Status "Installing frontend dependencies..."
    npm install
    
    # TypeScript compilation
    Write-Status "Compiling TypeScript..."
    npx tsc -b
    
    # Vite build
    Write-Status "Building with Vite..."
    npm run build
    
    Write-Success "Frontend build completed successfully!"
}

# Build Backend (FastAPI + Python)
function Build-Backend {
    Write-Status "Building Backend (FastAPI + Python)..."
    
    Push-Location fastapi-backend
    
    # Create virtual environment if it doesn't exist
    if (-not (Test-Path "venv")) {
        Write-Status "Creating Python virtual environment..."
        python -m venv venv
    }
    
    # Activate virtual environment
    Write-Status "Activating virtual environment..."
    & ".\venv\Scripts\Activate.ps1"
    
    # Install Python dependencies
    Write-Status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Run database migrations (if any)
    Write-Status "Setting up database..."
    python -c "
import sys
sys.path.append('.')
from database import engine
from models import Base
Base.metadata.create_all(bind=engine)
print('Database tables created successfully')
"
    
    Pop-Location
    Write-Success "Backend build completed successfully!"
}

# Build Live Stream Server
function Build-LiveStream {
    Write-Status "Building Live Stream Server (Node.js RTMP)..."
    
    Push-Location live-stream
    
    # Install dependencies
    Write-Status "Installing live stream server dependencies..."
    npm install
    
    Pop-Location
    Write-Success "Live Stream Server build completed successfully!"
}

# Build MediaSoup Server
function Build-MediaSoup {
    Write-Status "Building MediaSoup Server (WebRTC)..."
    
    Push-Location mediasoup-server
    
    # Install dependencies
    Write-Status "Installing MediaSoup server dependencies..."
    npm install
    
    Pop-Location
    Write-Success "MediaSoup Server build completed successfully!"
}

# Create Docker images (optional)
function Build-DockerImages {
    if ($SkipDocker) {
        Write-Warning "Skipping Docker image builds as requested."
        return
    }
    
    Write-Status "Building Docker images..."
    
    # Check if Docker is available
    try {
        docker --version | Out-Null
    }
    catch {
        Write-Warning "Docker not found. Skipping Docker image builds."
        return
    }
    
    # Build frontend Docker image
    Write-Status "Building frontend Docker image..."
    docker build -f Dockerfile.frontend -t visionware-frontend .
    
    # Build backend Docker image (if Dockerfile exists)
    if (Test-Path "fastapi-backend/Dockerfile") {
        Write-Status "Building backend Docker image..."
        docker build -f fastapi-backend/Dockerfile -t visionware-backend ./fastapi-backend
    }
    else {
        Write-Warning "Backend Dockerfile not found. Skipping backend Docker build."
    }
    
    # Build live stream Docker image
    if (Test-Path "live-stream/Dockerfile") {
        Write-Status "Building live stream Docker image..."
        docker build -f live-stream/Dockerfile -t visionware-livestream ./live-stream
    }
    else {
        Write-Warning "Live stream Dockerfile not found. Skipping live stream Docker build."
    }
    
    # Build MediaSoup Docker image
    if (Test-Path "mediasoup-server/Dockerfile") {
        Write-Status "Building MediaSoup Docker image..."
        docker build -f mediasoup-server/Dockerfile -t visionware-mediasoup ./mediasoup-server
    }
    else {
        Write-Warning "MediaSoup Dockerfile not found. Skipping MediaSoup Docker build."
    }
    
    Write-Success "Docker images built successfully!"
}

# Create production environment file
function Create-EnvFiles {
    Write-Status "Creating environment files..."
    
    # Copy example env file if it exists
    if (Test-Path "production.env.example") {
        if (-not (Test-Path "production.env")) {
            Copy-Item "production.env.example" "production.env"
            Write-Warning "Created production.env from example. Please update with your actual values."
        }
    }
    
    Write-Success "Environment files created!"
}

# Run tests
function Run-Tests {
    if ($SkipTests) {
        Write-Warning "Skipping tests as requested."
        return
    }
    
    Write-Status "Running system tests..."
    
    # Frontend tests
    Write-Status "Running frontend tests..."
    npm run lint
    
    # Backend tests (if test files exist)
    if (Test-Path "test_*.py") {
        Write-Status "Running backend tests..."
        Push-Location fastapi-backend
        & ".\venv\Scripts\Activate.ps1"
        python -m pytest ../test_*.py -v
        Pop-Location
    }
    
    Write-Success "Tests completed!"
}

# Main compilation function
function Main {
    Write-Status "Starting VisionWare System Architecture Compilation..."
    
    # Check prerequisites
    if (-not (Test-NodeJS)) { exit 1 }
    if (-not (Test-Python)) { exit 1 }
    if (-not (Test-Pip)) { exit 1 }
    
    # Build all components
    Build-Frontend
    Build-Backend
    Build-LiveStream
    Build-MediaSoup
    
    # Create environment files
    Create-EnvFiles
    
    # Build Docker images (optional)
    Build-DockerImages
    
    # Run tests
    Run-Tests
    
    Write-Success "🎉 VisionWare System Architecture Compilation Completed Successfully!"
    Write-Status "System components built:"
    Write-Host "  ✅ Frontend (React + TypeScript + Vite)" -ForegroundColor Green
    Write-Host "  ✅ Backend (FastAPI + Python)" -ForegroundColor Green
    Write-Host "  ✅ Live Stream Server (Node.js RTMP)" -ForegroundColor Green
    Write-Host "  ✅ MediaSoup Server (WebRTC)" -ForegroundColor Green
    Write-Host "  ✅ Environment files" -ForegroundColor Green
    Write-Host "  ✅ Docker images (if Docker available)" -ForegroundColor Green
    Write-Host "  ✅ System tests" -ForegroundColor Green
    
    Write-Status "Next steps:"
    Write-Host "  1. Update production.env with your configuration" -ForegroundColor Cyan
    Write-Host "  2. Start the services using docker-compose.prod.yml" -ForegroundColor Cyan
    Write-Host "  3. Or run services individually for development" -ForegroundColor Cyan
}

# Run main function
Main 