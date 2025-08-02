# OBS Streaming Setup Guide

## 🎥 **OBS Configuration for VisionWare Streaming**

### **Step 1: OBS Settings**

1. **Open OBS Studio**
2. **Go to Settings** → **Stream**
3. **Configure the following:**

#### **Stream Settings:**

- **Service**: `Custom`
- **Server**: `rtmp://localhost:1935/live`
- **Stream Key**: Use the stream key from your VisionWare dashboard

### **Step 2: Get Your Stream Key**

1. **Open VisionWare** in your browser
2. **Go to "Create Live Stream"** page
3. **Click "Manage Streams"** tab
4. **Find your stream** and click **"Copy Key"** button
5. **Copy the stream key** (it looks like: `845a280d-c29b-4698-ad00-f1e5e7593a56`)

### **Step 3: Configure OBS**

#### **In OBS Stream Settings:**

- **Server**: `rtmp://localhost:1935/live`
- **Stream Key**: `[Your Stream Key from VisionWare]`

#### **Example Configuration:**

```
Server: rtmp://localhost:1935/live
Stream Key: 845a280d-c29b-4698-ad00-f1e5e7593a56
```

### **Step 4: Video Settings (Recommended)**

#### **Output Settings:**

- **Output Mode**: `Advanced`
- **Encoder**: `x264` or `NVENC` (if you have NVIDIA GPU)
- **Rate Control**: `CBR`
- **Bitrate**: `2500 Kbps` (for 720p)
- **Keyframe Interval**: `2 seconds`
- **Preset**: `veryfast` (for x264) or `P1` (for NVENC)

#### **Video Settings:**

- **Base Resolution**: `1920x1080`
- **Output Resolution**: `1280x720` (720p)
- **Downscale Filter**: `Bicubic`
- **FPS**: `30`

### **Step 5: Audio Settings**

- **Sample Rate**: `44.1 kHz`
- **Channels**: `Stereo`
- **Audio Bitrate**: `128 Kbps`

### **Step 6: Test Your Stream**

1. **Click "Start Streaming"** in OBS
2. **Check OBS status** - should show "Live" with green indicator
3. **Go to VisionWare** and check if stream appears as "Live"
4. **Viewers can watch** at: `http://localhost:8000/live/[stream-key]`

## 🔧 **Troubleshooting**

### **"Failed to connect to server" Error**

#### **Check 1: RTMP Server Status**

```bash
# Check if RTMP server is running
netstat -an | findstr :1935
```

**Should show**: `TCP 0.0.0.0:1935 LISTENING`

#### **Check 2: Start RTMP Server**

If server is not running:

```bash
cd live-stream
npm start
```

#### **Check 3: Firewall Issues**

- **Windows Firewall** might block port 1935
- **Add exception** for OBS and Node.js
- **Or temporarily disable** firewall for testing

#### **Check 4: Server Configuration**

- **Server URL**: Must be exactly `rtmp://localhost:1935/live`
- **Stream Key**: Must match the one from VisionWare dashboard
- **No spaces** or extra characters

### **Common Issues & Solutions**

#### **Issue 1: "Connection refused"**

**Solution**: RTMP server not running

```bash
cd live-stream
npm start
```

#### **Issue 2: "Authentication failed"**

**Solution**: Wrong stream key

- Copy the exact stream key from VisionWare
- No extra spaces or characters

#### **Issue 3: "Network timeout"**

**Solution**: Firewall blocking connection

- Add OBS to Windows Firewall exceptions
- Or use `127.0.0.1` instead of `localhost`

#### **Issue 4: "Stream not appearing in VisionWare"**

**Solution**: Check stream status

- Ensure stream is "Live" in VisionWare
- Check if stream key matches exactly

## 📊 **Monitoring Your Stream**

### **OBS Indicators:**

- **Green "Live" indicator**: Stream is active
- **Red "Disconnected"**: Connection failed
- **Yellow "Reconnecting"**: Network issues

### **VisionWare Dashboard:**

- **Stream Status**: Should show "Live"
- **Viewer Count**: Updates in real-time
- **Stream Duration**: Shows how long you've been streaming

### **Viewer Access:**

- **HLS Stream**: `http://localhost:8001/live/[stream-key]/index.m3u8`
- **DASH Stream**: `http://localhost:8001/live/[stream-key]/index.mpd`

## 🚀 **Advanced Configuration**

### **For Better Quality:**

- **Bitrate**: Increase to 4000-6000 Kbps for 1080p
- **Keyframe Interval**: 2 seconds for better compatibility
- **Audio**: 160 Kbps for better sound quality

### **For Lower Latency:**

- **Keyframe Interval**: 1 second
- **GOP Size**: 30 frames
- **Buffer Size**: 1000ms

### **For Stability:**

- **Use CBR** (Constant Bitrate)
- **Enable "Enforce streaming service encoder settings"**
- **Set "Max B-frames" to 0**

## ✅ **Success Checklist**

- [ ] RTMP server running on port 1935
- [ ] OBS configured with correct server URL
- [ ] Stream key copied from VisionWare
- [ ] OBS shows "Live" status
- [ ] VisionWare shows stream as "Live"
- [ ] No firewall blocking connection
- [ ] Stream key matches exactly

## 🆘 **Need Help?**

If you're still having issues:

1. **Check the console** for RTMP server logs
2. **Verify OBS settings** match the guide exactly
3. **Test with a simple stream** first (no complex scenes)
4. **Check Windows Event Viewer** for network errors
5. **Try restarting** both OBS and the RTMP server

**RTMP Server Logs**: Look for connection events in the terminal where you started the server.
