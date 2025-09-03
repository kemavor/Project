# MediaMTX Setup Guide for VisionWare RTMP-to-HLS Streaming

This guide explains how to set up MediaMTX media server for the VisionWare platform's new RTMP-to-HLS streaming architecture.

## What is MediaMTX?

MediaMTX is a real-time media server and proxy that supports multiple protocols including RTMP, HLS, WebRTC, and more. It will receive RTMP streams from OBS Studio and transcode them to HLS format for web browser playback.

## Installation

### Windows

1. Download MediaMTX from the official releases:
   ```
   https://github.com/bluenviron/mediamtx/releases
   ```

2. Extract the downloaded archive to your desired location (e.g., `C:\mediamtx\`)

3. Copy the `mediamtx.yml` configuration file from the VisionWare project root to the MediaMTX directory

### Linux/macOS

1. Download the appropriate binary:
   ```bash
   # Linux AMD64
   wget https://github.com/bluenviron/mediamtx/releases/latest/download/mediamtx_v1.5.0_linux_amd64.tar.gz
   tar -xzf mediamtx_v1.5.0_linux_amd64.tar.gz
   
   # macOS
   wget https://github.com/bluenviron/mediamtx/releases/latest/download/mediamtx_v1.5.0_darwin_amd64.tar.gz
   tar -xzf mediamtx_v1.5.0_darwin_amd64.tar.gz
   ```

2. Make it executable and move to your preferred location:
   ```bash
   chmod +x mediamtx
   sudo mv mediamtx /usr/local/bin/
   ```

3. Copy the configuration file:
   ```bash
   cp mediamtx.yml /usr/local/etc/mediamtx.yml
   ```

## Configuration

The provided `mediamtx.yml` configuration file includes:

- **RTMP Server**: Listens on port 1936 for OBS streams
- **HLS Server**: Serves HLS streams on port 8081
- **Stream Hooks**: Automatically notifies the VisionWare backend when streams start/stop
- **CORS Headers**: Allows web browsers to access HLS streams
- **Low Latency**: Configured for minimal delay

## Running MediaMTX

### Windows
```cmd
cd C:\mediamtx\
mediamtx.exe
```

### Linux/macOS
```bash
# If installed system-wide
mediamtx

# Or from local directory
./mediamtx
```

## Testing the Setup

1. **Start MediaMTX**: Run the server as described above
2. **Check Status**: Visit `http://localhost:8081` to see the HLS server status
3. **API Status**: Visit `http://localhost:9997` for the API endpoint

## OBS Studio Configuration

When teachers create a stream in VisionWare, they receive:

- **Server URL**: `rtmp://localhost:1936/live`  
- **Stream Key**: A unique UUID (e.g., `abc123-def456-ghi789`)

Configure OBS with these settings:
1. Go to Settings → Stream
2. Service: Custom
3. Server: `rtmp://localhost:1936/live`
4. Stream Key: [Use the key from VisionWare]

## Stream URLs

After OBS connects, the stream becomes available at:
- **HLS URL**: `http://localhost:8081/hls/[STREAM_KEY]/index.m3u8`
- **HLS Segments**: `http://localhost:8081/hls/[STREAM_KEY]/`

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   - Change RTMP port from 1936 to 1937 in `mediamtx.yml`
   - Change HLS port from 8081 to 8082 in `mediamtx.yml`
   - Update VisionWare backend URLs accordingly

2. **CORS Errors**:
   - Ensure `hlsAllowOrigin: "*"` is set in configuration
   - Check browser console for specific CORS errors

3. **Stream Not Starting**:
   - Check MediaMTX logs for connection errors
   - Verify OBS is using correct RTMP URL and stream key
   - Ensure firewalls allow traffic on ports 1936 and 8081

4. **Backend Not Receiving Hooks**:
   - Verify VisionWare FastAPI server is running on port 8000
   - Check that curl is installed and accessible
   - Review MediaMTX logs for hook execution errors

### Logs and Monitoring

- MediaMTX logs are written to `mediamtx.log`
- API endpoint at `http://localhost:9997` provides server status
- Metrics available at `http://localhost:9998`

## Production Considerations

For production deployment:

1. **SSL/HTTPS**: Configure certificates for secure streaming
2. **Authentication**: Enable proper authentication for RTMP publishing
3. **Recording**: Enable recording to files or S3
4. **Load Balancing**: Use multiple MediaMTX instances behind a load balancer
5. **CDN**: Distribute HLS streams via CDN for global reach

## Integration with VisionWare

The MediaMTX server automatically:

1. **Validates Stream Keys**: Checks with VisionWare backend
2. **Updates Stream Status**: Notifies when streams start/stop
3. **Provides HLS URLs**: Students can watch via web browsers
4. **Handles Multiple Streams**: Supports concurrent streaming

The VisionWare backend handles all the complex logic while MediaMTX focuses purely on media transcoding and delivery.