@echo off
echo Starting VisionWare RTMP Server...
echo ================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm modules are installed
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Create media directory if it doesn't exist
if not exist media mkdir media

REM Copy .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
)

echo.
echo Starting RTMP server...
echo RTMP URL: rtmp://localhost:1935/live
echo HTTP API: http://localhost:8080
echo Health Check: http://localhost:8080/health
echo.

REM Start the server
npm start