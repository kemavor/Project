# 🎥 VisionWare Livestream Setup Guide

## ✅ Current Status

**Good News!** Your RTMP server is running correctly and OBS was successfully streaming to it. The stream key `ed9f5295-7052-419b-94c6-e1531aa2c970` is working.

## 🔧 OBS Studio Configuration

### **Step 1: Open OBS Studio**
1. Launch OBS Studio
2. Go to **Settings** → **Stream**

### **Step 2: Configure Stream Settings**
- **Service**: `Custom`
- **Server**: `rtmp://localhost:1935/live`
- **Stream Key**: `ed9f5295-7052-419b-94c6-e1531aa2c970`

### **Step 3: Video Settings (Recommended)**
- **Base Resolution**: 1920x1080
- **Output Resolution**: 1280x720 (for better performance)
- **FPS**: 30
- **Video Encoder**: x264 (software) or NVENC (if you have NVIDIA GPU)

### **Step 4: Audio Settings**
- **Sample Rate**: 48kHz
- **Channels**: Stereo
- **Audio Codec**: AAC

## 🚀 Starting Your Stream

1. **Add Sources** in OBS:
   - **Display Capture** (to capture your screen)
   - **Webcam** (if you want to show your face)
   - **Audio Input Capture** (for microphone)

2. **Click "Start Streaming"** in OBS
3. **Check OBS Status**: Should show "Live" in the bottom right

## 📺 Viewing Your Stream

### **In VisionWare Frontend**
- Go to your stream page in VisionWare
- The video player should automatically load the stream
- If you see "Stream Setup Required", make sure OBS is streaming

### **Direct URLs (for testing)**
- **HLS Stream**: `http://localhost:8001/live/ed9f5295-7052-419b-94c6-e1531aa2c970/index.m3u8`
- **DASH Stream**: `http://localhost:8001/live/ed9f5295-7052-419b-94c6-e1531aa2c970/index.mpd`

## 🔍 Troubleshooting

### **If OBS shows "Failed to connect to server":**
1. ✅ **RTMP Server is running** (confirmed)
2. ✅ **Port 1935 is open** (confirmed)
3. ✅ **Stream key is correct** (confirmed)

**Try these steps:**
- Restart OBS Studio
- Check Windows Firewall settings
- Try using `127.0.0.1` instead of `localhost` in the server URL

### **If VisionWare shows "Waiting for stream to start":**
1. Make sure OBS is actively streaming
2. Check the browser console for any errors
3. Try refreshing the page

### **If video doesn't play in VisionWare:**
1. Check if the HLS stream URL is accessible
2. Try opening the HLS URL directly in a new browser tab
3. Check browser console for video errors

## 📊 Current Configuration

- **RTMP Server**: Running on port 1935 ✅
- **HTTP Server**: Running on port 8001 ✅
- **FastAPI Backend**: Running on port 8000 ✅
- **Stream Key**: `ed9f5295-7052-419b-94c6-e1531aa2c970` ✅

## 🎯 Next Steps

1. **Start OBS Studio** and configure with the settings above
2. **Click "Start Streaming"** in OBS
3. **Check VisionWare** - the video should appear automatically
4. **Test the stream** by speaking or moving around

## 📞 Support

If you encounter any issues:
1. Check the RTMP server logs for connection details
2. Check the browser console for frontend errors
3. Verify OBS is showing "Live" status

---

**Ready to go live! 🎬** 