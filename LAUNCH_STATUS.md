# VisionWare Application Launch Status

## 🚀 Services Status

### ✅ Running Services

1. **Backend (FastAPI)** - Port 8000

   - Status: ✅ RUNNING
   - URL: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/api/health

2. **Frontend (React + Vite)** - Port 5173

   - Status: ✅ RUNNING
   - URL: http://localhost:5173
   - Development server with hot reload

3. **Live Stream Server (RTMP)** - Port 1935

   - Status: ✅ RUNNING
   - RTMP URL: rtmp://localhost:1935/live
   - HLS URL: http://localhost:8000/hls

4. **MediaSoup Server (WebRTC)** - Port 3000
   - Status: 🔄 STARTING
   - WebRTC signaling server
   - Socket.IO connections

## 🧪 Testing Features

### Frontend Features to Test

- [ ] User Authentication (Login/Register)
- [ ] Course Management
- [ ] Live Streaming Interface
- [ ] Chat System
- [ ] File Upload
- [ ] ECHO AI Assistant
- [ ] Real-time Notifications

### Backend API Endpoints to Test

- [ ] Authentication: `/api/auth/login`, `/api/auth/register`
- [ ] Courses: `/api/courses/`
- [ ] Live Streams: `/api/livestreams/`
- [ ] ECHO: `/api/echo/`
- [ ] File Upload: `/api/upload/`
- [ ] Health Check: `/api/health`

### Live Streaming Features to Test

- [ ] RTMP Stream Ingestion
- [ ] HLS Playback
- [ ] WebRTC Connections
- [ ] Stream Management
- [ ] Viewer Count

## 🔗 Quick Access Links

### Main Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Streaming Services

- **RTMP Server**: rtmp://localhost:1935/live
- **HLS Streams**: http://localhost:8000/hls
- **WebRTC Server**: http://localhost:3000

### Development Tools

- **Backend Logs**: Check terminal for FastAPI logs
- **Frontend DevTools**: Browser developer tools
- **Database**: SQLite file in `fastapi-backend/visionware.db`

## 🛠️ Testing Commands

### Test Backend Health

```bash
curl http://localhost:8000/api/health
```

### Test Frontend

```bash
# Open in browser
http://localhost:5173
```

### Test Live Stream

```bash
# Using OBS Studio
# Stream URL: rtmp://localhost:1935/live
# Stream Key: your_stream_key
```

## 📊 Monitoring

### Check Service Status

```powershell
# Check all ports
netstat -ano | findstr ":8000\|:5173\|:1935\|:3000"

# Check processes
tasklist | findstr "python\|node"
```

### Log Locations

- **Backend**: Terminal running FastAPI
- **Frontend**: Browser console
- **Live Stream**: Terminal running RTMP server
- **MediaSoup**: Terminal running WebRTC server

## 🚨 Troubleshooting

### If Services Don't Start

1. Check if ports are already in use
2. Verify Node.js and Python are installed
3. Check dependencies are installed
4. Review error messages in terminals

### Common Issues

- **Port 8000 in use**: Kill existing process or change port
- **Frontend not loading**: Check if Vite dev server started
- **Streaming issues**: Verify RTMP server is running
- **Database errors**: Check SQLite file permissions

## 🎯 Next Steps

1. **Open Frontend**: Navigate to http://localhost:5173
2. **Test Authentication**: Try login/register
3. **Test Live Streaming**: Use OBS to stream to RTMP server
4. **Test ECHO AI**: Access AI assistant features
5. **Test File Upload**: Upload course materials
6. **Test Real-time Features**: Chat, notifications

## 📝 Notes

- All services are running in development mode
- Hot reload is enabled for frontend and backend
- Database is SQLite (can be upgraded to PostgreSQL for production)
- Environment variables can be configured in `.env` file
- For production deployment, use Docker Compose

---

**Last Updated**: $(Get-Date)
**Status**: All core services running successfully
