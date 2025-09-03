@echo off
echo Starting MediaMTX for VisionWare RTMP-to-HLS streaming...
echo.

REM Check if mediamtx exists
if not exist "mediamtx.exe" (
    echo ERROR: mediamtx.exe not found in current directory.
    echo Please download MediaMTX from: https://github.com/bluenviron/mediamtx/releases
    echo Extract it to this directory and try again.
    pause
    exit /b 1
)

REM Check if config exists
if not exist "mediamtx.yml" (
    echo ERROR: mediamtx.yml configuration file not found.
    echo This file should be in the same directory as mediamtx.exe
    pause
    exit /b 1
)

echo Configuration found: mediamtx.yml
echo Starting MediaMTX server...
echo.
echo RTMP Server: rtmp://localhost:1936/live
echo HLS Server: http://localhost:8081
echo API: http://localhost:9997
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start MediaMTX
mediamtx.exe

pause