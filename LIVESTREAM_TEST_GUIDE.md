# 🎥 Live Streaming Feature - Complete Test Guide

## 🚀 **Overview**

The live streaming feature allows teachers to create, manage, and conduct live lectures with real-time interaction capabilities including chat, questions, and viewer management.

## 📋 **Prerequisites**

### **Backend Setup:**

1. **Create Database Tables:**

   ```bash
   cd backend
   python create_livestream_tables.py
   ```

2. **Start Backend Server:**
   ```bash
   cd backend
   python main.py
   ```

### **Frontend Setup:**

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Start Frontend Server:**
   ```bash
   npm run dev
   ```

## 👥 **Test Accounts Setup**

### **Create Teacher Account:**

1. Go to `http://localhost:5173/register`
2. Create account with role: `teacher`
3. Example:
   - Email: `teacher@test.com`
   - Password: `password123`
   - Role: `teacher`

### **Create Student Account:**

1. Go to `http://localhost:5173/register`
2. Create account with role: `student`
3. Example:
   - Email: `student@test.com`
   - Password: `password123`
   - Role: `student`

### **Create Course:**

1. Login as teacher
2. Go to `http://localhost:5173/teacher/courses`
3. Create a new course

## 🧪 **Test Scenarios**

### **1. Teacher - Create Live Stream**

#### **Test Steps:**

1. **Login as Teacher:**
   - Go to `http://localhost:5173/login`
   - Login with teacher credentials

2. **Access Create Stream Page:**
   - Navigate to `http://localhost:5173/livestream/create`
   - Verify page loads correctly

3. **Fill Stream Details:**
   - **Title:** "Introduction to Live Streaming"
   - **Description:** "Learn the basics of live streaming in education"
   - **Course:** Select your created course
   - **Scheduled Time:** Set to 1 hour from now
   - **Max Viewers:** 50
   - **Quality Settings:**
     - Resolution: 720p
     - Frame Rate: 30 fps
     - Bitrate: 2500 kbps
   - **Options:** Enable "Public Stream" and "Record Stream"

4. **Create Stream:**
   - Click "Create Stream"
   - Verify success message
   - Verify stream appears in "Manage Streams" tab

#### **Expected Results:**

- ✅ Stream created successfully
- ✅ Stream appears in manage tab with "Scheduled" status
- ✅ Stream key generated automatically
- ✅ All form fields reset after creation

### **2. Teacher - Manage Live Streams**

#### **Test Steps:**

1. **View Stream List:**
   - Switch to "Manage Streams" tab
   - Verify created stream appears in list

2. **Start Stream:**
   - Click "Start" button on scheduled stream
   - Verify status changes to "Live"
   - Verify start time recorded

3. **View Stream Details:**
   - Click "View" button
   - Verify stream details page loads
   - Verify viewer count shows 0 initially

4. **Stop Stream:**
   - Click "Stop" button on live stream
   - Verify status changes to "Ended"
   - Verify duration calculated correctly

#### **Expected Results:**

- ✅ Stream status updates correctly
- ✅ Start/stop functionality works
- ✅ Duration calculation accurate
- ✅ Stream details accessible

### **3. Student - Join Live Stream**

#### **Test Steps:**

1. **Login as Student:**
   - Go to `http://localhost:5173/login`
   - Login with student credentials

2. **View Active Streams:**
   - Go to `http://localhost:5173/live-lectures`
   - Verify active streams appear in list

3. **Join Stream:**
   - Click on a live stream
   - Verify join functionality works
   - Verify viewer count increases

#### **Expected Results:**

- ✅ Student can see active streams
- ✅ Join functionality works
- ✅ Viewer count updates in real-time

### **4. Real-time Chat Functionality**

#### **Test Steps:**

1. **Teacher Side:**
   - Start a live stream
   - Send a chat message
   - Verify message appears in chat

2. **Student Side:**
   - Join the live stream
   - Send a chat message
   - Verify message appears for teacher

3. **Chat Features:**
   - Test different message types (text, system, announcement)
   - Test message visibility settings
   - Test chat moderation features

#### **Expected Results:**

- ✅ Real-time chat works
- ✅ Messages appear instantly
- ✅ Different message types supported
- ✅ Chat moderation works

### **5. Question & Answer System**

#### **Test Steps:**

1. **Student Asks Question:**
   - Join live stream as student
   - Ask a question
   - Verify question appears in Q&A section

2. **Question Upvoting:**
   - Other students upvote the question
   - Verify upvote count increases
   - Verify questions sorted by upvotes

3. **Teacher Answers:**
   - Teacher answers the question
   - Verify answer appears
   - Verify question marked as answered

#### **Expected Results:**

- ✅ Question submission works
- ✅ Upvoting system functional
- ✅ Teacher can answer questions
- ✅ Q&A moderation works

### **6. Stream Analytics**

#### **Test Steps:**

1. **View Stream Stats:**
   - Access stream statistics
   - Verify metrics displayed:
     - Current viewers
     - Peak viewers
     - Total unique viewers
     - Chat messages count
     - Questions count
     - Average watch time
     - Engagement score

2. **Real-time Updates:**
   - Monitor stats during live stream
   - Verify real-time updates

#### **Expected Results:**

- ✅ All metrics calculated correctly
- ✅ Real-time updates work
- ✅ Analytics data accurate

### **7. Stream Quality Management**

#### **Test Steps:**

1. **Quality Settings:**
   - Test different resolution settings
   - Test different frame rates
   - Test different bitrates

2. **Quality Switching:**
   - Change quality during stream
   - Verify quality changes applied

#### **Expected Results:**

- ✅ Quality settings configurable
- ✅ Quality changes work
- ✅ Settings saved correctly

### **8. Recording Functionality**

#### **Test Steps:**

1. **Enable Recording:**
   - Create stream with recording enabled
   - Start stream
   - Verify recording starts

2. **Access Recording:**
   - Stop stream
   - Verify recording available
   - Test recording playback

#### **Expected Results:**

- ✅ Recording starts when enabled
- ✅ Recording saved correctly
- ✅ Recording accessible after stream

## 🔧 **API Endpoint Testing**

### **Test All Endpoints:**

```bash
# Create live stream
curl -X POST "http://localhost:8000/api/livestream/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Stream",
    "description": "Test description",
    "course_id": 1,
    "max_viewers": 50,
    "is_public": true,
    "is_recording": false
  }'

# Get active streams
curl -X GET "http://localhost:8000/api/livestream/active" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Start stream
curl -X POST "http://localhost:8000/api/livestream/1/start" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quality_settings": {"resolution": "720p"}}'

# Join stream
curl -X POST "http://localhost:8000/api/livestream/1/join" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stream_id": 1, "user_id": 1}'

# Send chat message
curl -X POST "http://localhost:8000/api/livestream/1/chat" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stream_id": 1,
    "message": "Hello everyone!",
    "message_type": "text"
  }'

# Ask question
curl -X POST "http://localhost:8000/api/livestream/1/questions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stream_id": 1,
    "question": "What is the main topic today?"
  }'

# Get stream stats
curl -X GET "http://localhost:8000/api/livestream/1/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 **Common Issues & Troubleshooting**

### **Issue 1: Database Connection Error**

**Symptoms:** Backend fails to start
**Solution:**

- Check PostgreSQL is running
- Verify database credentials in `main.py`
- Run `python create_livestream_tables.py`

### **Issue 2: CORS Error**

**Symptoms:** Frontend can't connect to backend
**Solution:**

- Check CORS settings in `main.py`
- Verify frontend URL is in allowed origins

### **Issue 3: Authentication Error**

**Symptoms:** API calls return 401/403
**Solution:**

- Verify user is logged in
- Check JWT token is valid
- Ensure user has correct role permissions

### **Issue 4: Stream Not Starting**

**Symptoms:** Start button doesn't work
**Solution:**

- Check stream status in database
- Verify user is stream instructor
- Check backend logs for errors

### **Issue 5: Real-time Features Not Working**

**Symptoms:** Chat/messages not updating
**Solution:**

- Check WebSocket connection
- Verify WebSocket endpoint is working
- Check browser console for errors

## 📊 **Performance Testing**

### **Load Testing:**

1. **Multiple Viewers:**
   - Join stream with 10+ students
   - Monitor performance
   - Check viewer count accuracy

2. **Chat Load:**
   - Send 100+ messages rapidly
   - Verify chat performance
   - Check message ordering

3. **Question Load:**
   - Submit 50+ questions
   - Test upvoting system
   - Verify sorting works

### **Stress Testing:**

1. **Concurrent Users:**
   - Test with maximum viewers
   - Monitor system resources
   - Check for bottlenecks

2. **Long Streams:**
   - Run stream for 2+ hours
   - Monitor memory usage
   - Check for memory leaks

## ✅ **Success Criteria**

### **Functional Requirements:**

- ✅ Teachers can create live streams
- ✅ Students can join live streams
- ✅ Real-time chat works
- ✅ Q&A system functional
- ✅ Stream analytics accurate
- ✅ Recording works
- ✅ Quality settings configurable

### **Non-Functional Requirements:**

- ✅ Low latency (< 2 seconds)
- ✅ High availability (99% uptime)
- ✅ Scalable (100+ concurrent viewers)
- ✅ Secure (authentication required)
- ✅ Responsive UI

## 🎯 **Next Steps**

After successful testing:

1. **Deploy to Production:**
   - Set up production database
   - Configure production environment
   - Deploy backend and frontend

2. **Monitor & Optimize:**
   - Set up monitoring
   - Track performance metrics
   - Optimize based on usage

3. **Feature Enhancements:**
   - Add screen sharing
   - Implement breakout rooms
   - Add whiteboard functionality
   - Integrate with external streaming services

## 📞 **Support**

If you encounter issues:

1. **Check Logs:**
   - Backend logs in terminal
   - Frontend console logs
   - Database logs

2. **Verify Setup:**
   - All prerequisites met
   - Dependencies installed
   - Services running

3. **Test Incrementally:**
   - Test each component separately
   - Verify API endpoints individually
   - Check database connections

**Happy Testing! 🎥✨**
