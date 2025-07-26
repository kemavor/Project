# 🎥 VisionWare Broadcasting Setup Guide

This guide will help you set up professional broadcasting for your VisionWare lectures using third-party software.

## 📋 **Overview**

VisionWare supports multiple broadcasting methods:

1. **Browser-based (WebRTC)** - Built-in, no additional software needed
2. **OBS Studio** - Free, professional broadcasting software
3. **Streamlabs OBS** - Free, with built-in overlays and alerts
4. **Other RTMP-compatible software** - XSplit, Wirecast, vMix, etc.

## 🚀 **Quick Start Options**

### Option 1: Browser-based Broadcasting (Easiest)

- ✅ No additional software needed
- ✅ Works immediately
- ✅ Good for basic lectures
- ❌ Limited to browser capabilities
- ❌ Single camera/microphone only

### Option 2: OBS Studio (Recommended)

- ✅ Professional quality
- ✅ Multiple video/audio sources
- ✅ Screen sharing
- ✅ Picture-in-picture
- ✅ Recording while streaming
- ✅ Free and open-source
- ❌ Requires setup

### Option 3: Streamlabs OBS

- ✅ All OBS features plus overlays
- ✅ Chat integration
- ✅ Professional streaming features
- ✅ Free
- ❌ Requires setup

## 🛠️ **Setup Instructions**

### **Step 1: Start Your RTMP Server**

First, make sure your RTMP server is running:

```bash
# Navigate to your project directory
cd VisionWare

# Start the RTMP server
cd live-stream
docker-compose up -d
```

### **Step 2: Get Your Stream Information**

When you start a lecture as an instructor, you'll see:

- **Stream URL**: `rtmp://your-server:1935/live`
- **Stream Key**: Your lecture ID
- **Full RTMP URL**: `rtmp://your-server:1935/live/lecture-id`

### **Step 3: Choose Your Broadcasting Software**

#### **A. OBS Studio Setup**

1. **Download OBS Studio**

   - Visit: https://obsproject.com/
   - Download and install for your operating system

2. **Configure Stream Settings**

   - Open OBS Studio
   - Go to `Settings → Stream`
   - Select `Custom` as service
   - Enter your Stream URL and Stream Key from VisionWare

3. **Recommended Settings**

   ```
   Video Bitrate: 5000 Kbps
   Audio Bitrate: 128 Kbps
   FPS: 30
   Resolution: 1920x1080
   ```

4. **Add Sources**

   - Click `+` in Sources panel
   - Add `Video Capture Device` for your camera
   - Add `Audio Input Capture` for your microphone
   - Add `Display Capture` for screen sharing

5. **Start Streaming**
   - Click `Start Streaming` in OBS
   - Your stream will appear in VisionWare

#### **B. Streamlabs OBS Setup**

1. **Download Streamlabs OBS**

   - Visit: https://streamlabs.com/
   - Download and install

2. **Configure Custom RTMP**

   - Open Streamlabs OBS
   - Go to `Settings → Stream`
   - Select `Custom` as platform
   - Enter your Stream URL and Stream Key

3. **Add Overlays (Optional)**

   - Use built-in overlays for professional look
   - Add chat integration
   - Configure alerts and notifications

4. **Start Streaming**
   - Click `Go Live`
   - Your stream will appear in VisionWare

#### **C. Other Software**

Any RTMP-compatible software will work:

- **XSplit Broadcaster** (Paid)
- **Wirecast** (Paid)
- **vMix** (Paid)
- **FFmpeg** (Command line)
- **ManyCam** (Free/Paid)

Use the same Stream URL and Stream Key configuration.

## 🎯 **Advanced Features**

### **Multiple Quality Streams**

Your RTMP server automatically creates multiple quality variants:

- **1080p**: 5000 Kbps
- **720p**: 2500 Kbps
- **480p**: 1000 Kbps

### **HLS and DASH Support**

For better compatibility, your server also provides:

- **HLS**: `http://your-server:8080/hls/lecture-id.m3u8`
- **DASH**: `http://your-server:8080/dash/lecture-id.mpd`

### **Screen Sharing**

In OBS/Streamlabs:

1. Add `Display Capture` source
2. Select your monitor or application window
3. Use `Window Capture` for specific applications

### **Picture-in-Picture**

1. Add your camera as `Video Capture Device`
2. Add screen capture as `Display Capture`
3. Resize and position sources as needed
4. Use `Transform` to adjust size and position

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Stream won't start**

   - Check RTMP server is running
   - Verify Stream URL and Key are correct
   - Check firewall settings

2. **Poor video quality**

   - Increase bitrate in broadcasting software
   - Check internet connection
   - Reduce resolution if needed

3. **Audio issues**

   - Check microphone permissions
   - Verify audio source in broadcasting software
   - Test audio levels

4. **High latency**
   - Use lower bitrate
   - Check network connection
   - Consider using HLS instead of RTMP

### **Performance Tips**

1. **Hardware Requirements**

   - CPU: Intel i5 or AMD Ryzen 5 (minimum)
   - RAM: 8GB (minimum), 16GB (recommended)
   - Internet: 10 Mbps upload (minimum)

2. **Software Settings**

   - Use hardware encoding (NVENC/QuickSync)
   - Set appropriate bitrate for your connection
   - Close unnecessary applications

3. **Network Optimization**
   - Use wired connection when possible
   - Close other streaming applications
   - Check for network congestion

## 📱 **Mobile Broadcasting**

For mobile devices, consider:

- **Larix Broadcaster** (iOS/Android)
- **OBS Camera** (iOS/Android)
- **Streamlabs Mobile** (iOS/Android)

Configure with the same RTMP settings.

## 🎨 **Professional Setup**

### **Recommended OBS Scene Setup**

1. **Main Scene**

   - Camera (full screen)
   - Logo overlay (corner)
   - Title overlay (top)

2. **Screen Share Scene**

   - Display capture (full screen)
   - Camera (picture-in-picture)
   - Logo overlay

3. **Picture-in-Picture Scene**
   - Display capture (main)
   - Camera (small overlay)
   - Logo overlay

### **Audio Setup**

1. **Microphone**

   - Use USB microphone for better quality
   - Add noise suppression filter
   - Add compressor filter

2. **System Audio**
   - Capture system audio for screen sharing
   - Mix with microphone audio
   - Set appropriate levels

## 🔒 **Security Considerations**

1. **Stream Keys**

   - Keep stream keys private
   - Rotate keys regularly
   - Use authentication when possible

2. **Network Security**
   - Use HTTPS for web interface
   - Configure firewall rules
   - Monitor for unauthorized access

## 📞 **Support**

If you need help:

1. Check the troubleshooting section above
2. Review OBS/Streamlabs documentation
3. Check VisionWare documentation
4. Contact support with specific error messages

## 🎉 **Getting Started**

1. **For Beginners**: Start with browser-based streaming
2. **For Regular Use**: Set up OBS Studio
3. **For Professional Use**: Use Streamlabs OBS with overlays
4. **For Advanced Users**: Customize with multiple scenes and sources

Happy Broadcasting! 🎥✨
