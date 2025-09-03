@echo off
echo Restarting VisionWare Backend Server...
cd /d "C:\Users\D E L L\Desktop\VisionWare\fastapi-backend"
taskkill /f /im python.exe 2>nul
timeout /t 2 /nobreak > nul
echo Starting server with WebSocket support...
python main.py
pause