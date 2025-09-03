@echo off
title VisionWare - Starting All Servers
echo ========================================
echo VisionWare Complete Streaming Platform
echo ========================================
echo.
echo Starting all servers for OBS/RTMP streaming...
echo.

REM Check if we're in the right directory
if not exist "fastapi-backend" (
    echo ERROR: Please run this script from the VisionWare root directory
    pause
    exit /b 1
)

echo [1/3] Starting FastAPI Backend...
start "VisionWare Backend" cmd /k "cd fastapi-backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

echo [2/3] Starting RTMP Server...
start "VisionWare RTMP" cmd /k "cd rtmp-server && (if not exist node_modules npm install) && npm start"
timeout /t 3 /nobreak >nul

echo [3/3] Starting React Frontend...
start "VisionWare Frontend" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ✅ All servers are starting up!
echo.
echo 🌐 Frontend:     http://localhost:5173
echo 🐍 Backend:      http://localhost:8000
echo 📺 RTMP Server:  rtmp://localhost:1936/live
echo 🎮 RTMP API:     http://localhost:8081
echo.
echo 📋 Health Checks:
echo    Backend:     http://localhost:8000/docs
echo    RTMP API:    http://localhost:8081/health
echo    RTMP Streams: http://localhost:8081/streams
echo.
echo 📖 Setup Guide: OBS_RTMP_SETUP_GUIDE.md
echo.
echo Press any key to close this window...
pause >nul