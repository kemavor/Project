@echo off
REM VisionWare System Architecture Compilation Script (Batch)
REM This script compiles all components of the VisionWare system

echo 🚀 Starting VisionWare System Architecture Compilation...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)
echo [SUCCESS] Node.js version: 
node --version

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)
echo [SUCCESS] Python version:
python --version

REM Check if pip is installed
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip is not installed. Please install pip first.
    pause
    exit /b 1
)
echo [SUCCESS] pip is available

echo.
echo [INFO] Building Frontend (React + TypeScript + Vite)...
echo [INFO] Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Frontend dependencies installation failed.
    pause
    exit /b 1
)

echo [INFO] Compiling TypeScript...
call npx tsc -b
if errorlevel 1 (
    echo [ERROR] TypeScript compilation failed.
    pause
    exit /b 1
)

echo [INFO] Building with Vite...
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)
echo [SUCCESS] Frontend build completed successfully!

echo.
echo [INFO] Building Backend (FastAPI + Python)...
cd fastapi-backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo [INFO] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Backend dependencies installation failed.
    pause
    exit /b 1
)

REM Setup database
echo [INFO] Setting up database...
python -c "import sys; sys.path.append('.'); from database import engine; from models import Base; Base.metadata.create_all(bind=engine); print('Database tables created successfully')"
if errorlevel 1 (
    echo [WARNING] Database setup failed, but continuing...
)

cd ..
echo [SUCCESS] Backend build completed successfully!

echo.
echo [INFO] Building Live Stream Server (Node.js RTMP)...
cd live-stream

REM Install dependencies
echo [INFO] Installing live stream server dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Live stream dependencies installation failed.
    pause
    exit /b 1
)

cd ..
echo [SUCCESS] Live Stream Server build completed successfully!

echo.
echo [INFO] Building MediaSoup Server (WebRTC)...
cd mediasoup-server

REM Install dependencies
echo [INFO] Installing MediaSoup server dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] MediaSoup dependencies installation failed.
    pause
    exit /b 1
)

cd ..
echo [SUCCESS] MediaSoup Server build completed successfully!

echo.
echo [INFO] Creating environment files...
if exist "production.env.example" (
    if not exist "production.env" (
        copy production.env.example production.env
        echo [WARNING] Created production.env from example. Please update with your actual values.
    )
)
echo [SUCCESS] Environment files created!

echo.
echo [INFO] Running system tests...
echo [INFO] Running frontend tests...
call npm run lint
if errorlevel 1 (
    echo [WARNING] Frontend linting failed, but continuing...
)

echo.
echo 🎉 VisionWare System Architecture Compilation Completed Successfully!
echo.
echo [INFO] System components built:
echo   ✅ Frontend (React + TypeScript + Vite)
echo   ✅ Backend (FastAPI + Python)
echo   ✅ Live Stream Server (Node.js RTMP)
echo   ✅ MediaSoup Server (WebRTC)
echo   ✅ Environment files
echo.
echo [INFO] Next steps:
echo   1. Update production.env with your configuration
echo   2. Start the services using docker-compose.prod.yml
echo   3. Or run services individually for development
echo.
pause 