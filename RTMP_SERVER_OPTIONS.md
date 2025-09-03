# RTMP Server Options for VisionWare

After removing WebRTC/MediaSoup dependencies, you have two excellent options for RTMP-to-HLS streaming:

## Option 1: Use Existing Node.js RTMP Server (Custom Solution)

### Pros:
- ✅ Already integrated with your VisionWare backend
- ✅ Custom validation with your stream key system
- ✅ Built-in viewer counting and stream management
- ✅ Easy to modify and extend
- ✅ Direct API endpoints for stream monitoring
- ✅ Automatic HLS transcoding with FFmpeg

### Cons:
- ⚠️ Requires Node.js and FFmpeg dependencies
- ⚠️ More complex setup and maintenance
- ⚠️ Custom solution (less community support)

### Setup Instructions:
```bash
# 1. Navigate to rtmp-server directory
cd rtmp-server

# 2. Replace server.js with the updated version
# (Use server-updated.js which removes MediaSoup dependencies)
cp server-updated.js server.js

# 3. Install dependencies
npm install

# 4. Start the server
npm start
```

### URLs:
- **RTMP Ingest**: `rtmp://localhost:1936/live/[STREAM_KEY]`
- **HLS Playback**: `http://localhost:8081/hls/[STREAM_KEY]/index.m3u8`
- **API Health**: `http://localhost:8081/health`
- **Active Streams**: `http://localhost:8081/streams`

---

## Option 2: Use MediaMTX (Recommended for Production)

### Pros:
- ✅ Production-ready, battle-tested
- ✅ Low resource usage
- ✅ Excellent performance and reliability
- ✅ Active development and community support
- ✅ Built-in authentication and security features
- ✅ Comprehensive protocol support
- ✅ Easy configuration via YAML

### Cons:
- ⚠️ Less customization options
- ⚠️ Separate binary to manage
- ⚠️ Webhook integration required for backend communication

### Setup Instructions:
```bash
# 1. Download MediaMTX from GitHub releases
# https://github.com/bluenviron/mediamtx/releases

# 2. Extract binary to project directory

# 3. Use provided configuration
# (mediamtx.yml is already configured)

# 4. Start MediaMTX
./mediamtx        # Linux/macOS
mediamtx.exe      # Windows

# Or use the provided startup scripts
./start_mediamtx.sh      # Linux/macOS
start_mediamtx.bat       # Windows
```

### URLs:
- **RTMP Ingest**: `rtmp://localhost:1936/live/[STREAM_KEY]`
- **HLS Playback**: `http://localhost:8081/hls/[STREAM_KEY]/index.m3u8`
- **API**: `http://localhost:9997`
- **Metrics**: `http://localhost:9998`

---

## Comparison

| Feature | Node.js RTMP Server | MediaMTX |
|---------|--------------------|---------| 
| **Performance** | Good | Excellent |
| **Resource Usage** | Higher (Node.js + FFmpeg) | Lower (Native binary) |
| **Customization** | High | Medium |
| **Reliability** | Good | Excellent |
| **Maintenance** | Higher | Lower |
| **Backend Integration** | Native | Webhook-based |
| **Documentation** | Custom | Extensive |
| **Community** | VisionWare only | Large community |

---

## Recommendation

### For Development:
Either option works well. The Node.js server might be easier to debug and modify.

### For Production:
**MediaMTX is recommended** because:
1. **Better Performance**: Native binary with lower resource usage
2. **Higher Reliability**: Battle-tested in production environments  
3. **Active Maintenance**: Regular updates and security patches
4. **Better Scalability**: Can handle more concurrent streams
5. **Professional Support**: Extensive documentation and community

---

## Migration Path

If you choose MediaMTX:
1. Test with MediaMTX during development
2. Update backend webhook endpoints if needed
3. Deploy MediaMTX in production
4. Remove `rtmp-server` directory after successful migration

If you prefer the Node.js server:
1. Update to `server-updated.js` (MediaSoup removed)
2. Test thoroughly
3. Consider migrating to MediaMTX later if needed

---

## Backend Integration

Both options work with your VisionWare backend:

### Stream Key Validation:
- **Node.js Server**: Direct API calls to `/api/livestream/validate-key/{rtmp_key}`
- **MediaMTX**: Webhook calls to the same endpoint

### Status Updates:
- **Node.js Server**: Direct API calls to `/api/livestream/rtmp-status`
- **MediaMTX**: Webhook calls via `runOnReady` and `runOnNotReady` hooks

### Frontend Integration:
Both servers provide HLS URLs that work with your updated React components:
- `CreateLiveStream.tsx` displays the RTMP server URL and stream key
- `WatchLiveStream.tsx` plays HLS streams from either server

---

## Decision Matrix

Choose **Node.js RTMP Server** if:
- You want maximum customization control
- You prefer JavaScript/Node.js ecosystem
- You want integrated stream management APIs
- You're comfortable maintaining custom code

Choose **MediaMTX** if:
- You want production-ready reliability
- You prefer lower resource usage
- You want community support and documentation
- You plan to scale to many concurrent streams

Both options remove WebRTC/MediaSoup completely and provide clean RTMP-to-HLS architecture for your VisionWare platform.