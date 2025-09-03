#!/bin/bash

echo "Cleaning up WebRTC/MediaSoup files and dependencies from VisionWare..."
echo

# Remove WebRTC/MediaSoup directories
echo "Removing directories..."
if [ -d "mediasoup-server" ]; then
    echo "- Removing mediasoup-server directory..."
    rm -rf "mediasoup-server"
    echo "  ✅ mediasoup-server directory removed"
else
    echo "  ℹ️  mediasoup-server directory not found"
fi

if [ -d "live-stream" ]; then
    echo "- Removing live-stream directory..."
    rm -rf "live-stream"
    echo "  ✅ live-stream directory removed"
else
    echo "  ℹ️  live-stream directory not found"
fi

if [ -d "rtmp-server" ]; then
    echo "- Removing rtmp-server directory..."
    rm -rf "rtmp-server"
    echo "  ✅ rtmp-server directory removed"
else
    echo "  ℹ️  rtmp-server directory not found"
fi

# Remove WebRTC components
echo
echo "Removing WebRTC React components..."
if [ -f "src/components/WebRTCStreaming.tsx" ]; then
    rm "src/components/WebRTCStreaming.tsx"
    echo "  ✅ WebRTCStreaming.tsx removed"
fi

if [ -f "src/components/MediaSoupStreaming.tsx" ]; then
    rm "src/components/MediaSoupStreaming.tsx"
    echo "  ✅ MediaSoupStreaming.tsx removed"
fi

if [ -f "src/components/MediaSoupTest.tsx" ]; then
    rm "src/components/MediaSoupTest.tsx"
    echo "  ✅ MediaSoupTest.tsx removed"
fi

if [ -f "src/components/OBSStreaming.tsx" ]; then
    rm "src/components/OBSStreaming.tsx"
    echo "  ✅ OBSStreaming.tsx removed"
fi

if [ -f "src/components/StreamingModeSelector.tsx" ]; then
    rm "src/components/StreamingModeSelector.tsx"
    echo "  ✅ StreamingModeSelector.tsx removed"
fi

if [ -f "src/components/TranscriptionPanel.tsx" ]; then
    rm "src/components/TranscriptionPanel.tsx"
    echo "  ✅ TranscriptionPanel.tsx removed"
fi

if [ -f "src/components/LiveTranscription.tsx" ]; then
    rm "src/components/LiveTranscription.tsx"
    echo "  ✅ LiveTranscription.tsx removed"
fi

# Remove WebRTC hooks and utilities
echo
echo "Removing WebRTC hooks and utilities..."
if [ -f "src/hooks/useMediaSoup.ts" ]; then
    rm "src/hooks/useMediaSoup.ts"
    echo "  ✅ useMediaSoup.ts removed"
fi

if [ -f "src/lib/webrtc.ts" ]; then
    rm "src/lib/webrtc.ts"
    echo "  ✅ webrtc.ts removed"
fi

if [ -f "src/lib/mediasoup-client.ts" ]; then
    rm "src/lib/mediasoup-client.ts"
    echo "  ✅ mediasoup-client.ts removed"
fi

if [ -f "src/lib/transcription.ts" ]; then
    rm "src/lib/transcription.ts"
    echo "  ✅ transcription.ts removed"
fi

# Remove backend MediaSoup integration
echo
echo "Removing backend MediaSoup files..."
if [ -f "fastapi-backend/routers/mediasoup_integration.py" ]; then
    rm "fastapi-backend/routers/mediasoup_integration.py"
    echo "  ✅ mediasoup_integration.py removed"
fi

if [ -f "fastapi-backend/routers/__pycache__/mediasoup_integration.cpython-312.pyc" ]; then
    rm "fastapi-backend/routers/__pycache__/mediasoup_integration.cpython-312.pyc"
    echo "  ✅ mediasoup_integration.pyc removed"
fi

# Remove old streaming pages
echo
echo "Removing old streaming pages..."
if [ -f "src/pages/CreateLiveStreamOld.tsx" ]; then
    rm "src/pages/CreateLiveStreamOld.tsx"
    echo "  ✅ CreateLiveStreamOld.tsx removed"
fi

if [ -f "src/pages/StreamingDemo.tsx" ]; then
    rm "src/pages/StreamingDemo.tsx"
    echo "  ✅ StreamingDemo.tsx removed"
fi

if [ -f "src/pages/StreamTest.tsx" ]; then
    rm "src/pages/StreamTest.tsx"
    echo "  ✅ StreamTest.tsx removed"
fi

echo
echo "🎉 WebRTC/MediaSoup cleanup completed!"
echo
echo "📋 Next steps:"
echo "1. Run: npm uninstall mediasoup-client socket.io socket.io-client flv.js ws"
echo "2. Run: npm install hls.js"
echo "3. Run the database migration: python migrate_rtmp_fields.py"
echo "4. Start MediaMTX server for RTMP-to-HLS streaming"
echo