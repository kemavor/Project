const NodeMediaServer = require('node-media-server');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

// Configuration for RTMP-to-HLS only (MediaSoup removed)
const config = {
  rtmp: {
    port: 1936,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8080,  // Changed to avoid conflict with Express server
    mediaroot: './media',
    allow_origin: '*'
  },
  auth: {
    api_user: 'admin',
    api_pass: 'admin123'
  },
  // FastAPI backend connection  
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:8000'
  },
  // HLS transcoding settings
  hls: {
    time: 2,           // 2 second segments for low latency
    list_size: 6,      // Keep 6 segments in playlist
    start_number: 1,
    delete_threshold: 10
  }
};

// Express app for API endpoints
const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

// Serve media files with proper CORS headers for HLS
app.use('/media', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range');
  next();
}, express.static(path.join(__dirname, 'media')));

// Store active streams
const activeStreams = new Map();
const streamMetadata = new Map();

// RTMP Server
const nms = new NodeMediaServer(config);

// Enhanced stream authentication
nms.on('preConnect', (id, args) => {
  console.log(`[${id}] RTMP connection attempt:`, args);
});

// Stream publishing events
nms.on('prePublish', async (id, StreamPath, args) => {
  console.log(`[${id}] Pre-publish event:`, StreamPath, args);
  
  // Extract stream key from path: /live/STREAM_KEY
  const streamKey = StreamPath.split('/').pop();
  
  try {
    // Validate stream key with FastAPI backend
    const isValid = await validateStreamKey(streamKey);
    
    if (!isValid) {
      console.log(`[${id}] Invalid stream key: ${streamKey}`);
      return false; // Reject the stream
    }
    
    console.log(`[${id}] Valid stream key accepted: ${streamKey}`);
    
    // Store stream metadata
    streamMetadata.set(streamKey, {
      id,
      StreamPath,
      startTime: new Date(),
      isLive: false
    });
    
  } catch (error) {
    console.error(`[${id}] Stream validation error:`, error);
    return false; // Reject on error
  }
});

nms.on('postPublish', async (id, StreamPath, args) => {
  const streamKey = StreamPath.split('/').pop();
  console.log(`[${id}] Stream started: ${streamKey}`);
  
  // Update stream status
  const metadata = streamMetadata.get(streamKey);
  if (metadata) {
    metadata.isLive = true;
    streamMetadata.set(streamKey, metadata);
  }
  
  // Store active stream
  activeStreams.set(streamKey, {
    id,
    StreamPath,
    startTime: new Date(),
    viewers: 0,
    hlsReady: false
  });
  
  try {
    // Notify FastAPI backend that stream is live
    await notifyStreamStatus(streamKey, 'live');
    
    // Start HLS transcoding
    startHLSTranscoding(streamKey, StreamPath);
    
  } catch (error) {
    console.error(`[${id}] Post-publish setup error:`, error);
  }
});

nms.on('donePublish', async (id, StreamPath, args) => {
  const streamKey = StreamPath.split('/').pop();
  console.log(`[${id}] Stream ended: ${streamKey}`);
  
  // Update stream status
  const metadata = streamMetadata.get(streamKey);
  if (metadata) {
    metadata.isLive = false;
    metadata.endTime = new Date();
  }
  
  // Cleanup stream
  const stream = activeStreams.get(streamKey);
  if (stream?.ffmpegProcess) {
    console.log(`Stopping FFmpeg process for stream: ${streamKey}`);
    stream.ffmpegProcess.kill('SIGINT');
  }
  
  // Remove from active streams
  activeStreams.delete(streamKey);
  
  try {
    // Notify backend that stream ended
    await notifyStreamStatus(streamKey, 'ended');
    
    // Cleanup HLS files after a delay (optional)
    setTimeout(() => cleanupHLSFiles(streamKey), 30000); // 30 seconds delay
    
  } catch (error) {
    console.error(`[${id}] Stream end cleanup error:`, error);
  }
});

// Viewer connection events
nms.on('prePlay', (id, StreamPath, args) => {
  console.log(`[${id}] Viewer connecting to: ${StreamPath}`);
  const streamKey = StreamPath.split('/').pop();
  
  // Update viewer count
  const stream = activeStreams.get(streamKey);
  if (stream) {
    stream.viewers++;
  }
});

nms.on('donePlay', (id, StreamPath, args) => {
  console.log(`[${id}] Viewer disconnected from: ${StreamPath}`);
  const streamKey = StreamPath.split('/').pop();
  
  // Update viewer count
  const stream = activeStreams.get(streamKey);
  if (stream && stream.viewers > 0) {
    stream.viewers--;
  }
});

// Validate stream key with FastAPI backend
async function validateStreamKey(streamKey) {
  try {
    const response = await axios.get(
      `${config.backend.url}/api/livestream/validate-key/${streamKey}`,
      { timeout: 5000 }
    );
    return response.data.valid === true;
  } catch (error) {
    console.warn('Stream key validation failed, allowing for development:', error.message);
    // In development, allow all stream keys if backend is unavailable
    return process.env.NODE_ENV !== 'production';
  }
}

// Notify FastAPI backend of stream status changes
async function notifyStreamStatus(streamKey, status) {
  try {
    await axios.post(
      `${config.backend.url}/api/livestream/rtmp-status`,
      {
        streamKey,
        status,
        timestamp: new Date().toISOString()
      },
      { timeout: 5000 }
    );
  } catch (error) {
    console.warn('Failed to notify backend of stream status:', error.message);
  }
}

// Start HLS transcoding (MediaSoup bridge removed)
function startHLSTranscoding(streamKey, streamPath) {
  console.log(`Starting HLS transcoding for stream: ${streamKey}`);
  
  // Create FFmpeg process to convert RTMP to HLS
  const rtmpUrl = `rtmp://127.0.0.1:${config.rtmp.port}${streamPath}`;
  const outputDir = path.join(__dirname, 'media', streamKey);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Convert RTMP to HLS with compatible settings
  const ffmpegProcess = ffmpeg(rtmpUrl)
    .addOptions([
      '-c:v libx264',
      '-c:a aac',
      '-ac 2',
      '-strict -2',
      '-crf 23',
      '-profile:v baseline',
      '-maxrate 2000k',
      '-bufsize 4000k',
      '-pix_fmt yuv420p',
      `-hls_time ${config.hls.time}`,
      `-hls_list_size ${config.hls.list_size}`,
      '-hls_flags delete_segments',
      '-f hls'
    ])
    .output(path.join(outputDir, 'index.m3u8'))
    .on('start', (commandLine) => {
      console.log(`FFmpeg started for ${streamKey}:`, commandLine);
    })
    .on('error', (err) => {
      console.error(`FFmpeg error for ${streamKey}:`, err);
      // Mark HLS as failed
      const stream = activeStreams.get(streamKey);
      if (stream) {
        stream.hlsReady = false;
        stream.error = err.message;
      }
    })
    .on('end', () => {
      console.log(`FFmpeg ended for ${streamKey}`);
      const stream = activeStreams.get(streamKey);
      if (stream) {
        stream.hlsReady = false;
      }
    })
    .on('progress', (progress) => {
      // Update stream with HLS ready status after first segment
      const stream = activeStreams.get(streamKey);
      if (stream && !stream.hlsReady) {
        const playlistPath = path.join(outputDir, 'index.m3u8');
        if (fs.existsSync(playlistPath)) {
          stream.hlsReady = true;
          console.log(`HLS playlist ready for stream: ${streamKey}`);
        }
      }
    })
    .run();
  
  // Store FFmpeg process for cleanup
  const stream = activeStreams.get(streamKey);
  if (stream) {
    stream.ffmpegProcess = ffmpegProcess;
  }
}

// Cleanup HLS files
function cleanupHLSFiles(streamKey) {
  const outputDir = path.join(__dirname, 'media', streamKey);
  
  if (fs.existsSync(outputDir)) {
    try {
      fs.rmSync(outputDir, { recursive: true, force: true });
      console.log(`Cleaned up HLS files for stream: ${streamKey}`);
    } catch (error) {
      console.error(`Failed to cleanup HLS files for ${streamKey}:`, error);
    }
  }
}

// API Endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'visionware-rtmp-server',
    version: '2.0.0',
    architecture: 'rtmp-to-hls',
    activeStreams: activeStreams.size,
    config: {
      rtmp_port: config.rtmp.port,
      http_port: config.http.port,
      hls_enabled: true,
      mediasoup_enabled: false
    }
  });
});

app.get('/streams', (req, res) => {
  const streams = Array.from(activeStreams.entries()).map(([key, data]) => ({
    streamKey: key,
    id: data.id,
    startTime: data.startTime,
    viewers: data.viewers,
    hlsReady: data.hlsReady,
    error: data.error,
    hlsUrl: `http://localhost:${config.http.port}/hls/${key}/index.m3u8`
  }));
  
  res.json({
    activeStreams: streams,
    totalStreams: streams.length
  });
});

app.get('/stream/:streamKey', (req, res) => {
  const streamKey = req.params.streamKey;
  const stream = activeStreams.get(streamKey);
  
  if (!stream) {
    return res.status(404).json({ error: 'Stream not found' });
  }
  
  res.json({
    streamKey,
    id: stream.id,
    startTime: stream.startTime,
    viewers: stream.viewers,
    hlsReady: stream.hlsReady,
    error: stream.error,
    hlsUrl: `http://localhost:${config.http.port}/hls/${streamKey}/index.m3u8`
  });
});

// Get HLS playlist for a stream
app.get('/hls/:streamKey/index.m3u8', (req, res) => {
  const streamKey = req.params.streamKey;
  const playlistPath = path.join(__dirname, 'media', streamKey, 'index.m3u8');
  
  if (fs.existsSync(playlistPath)) {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(playlistPath);
  } else {
    res.status(404).json({ error: 'Playlist not found or stream not ready' });
  }
});

// Get HLS segments
app.get('/hls/:streamKey/:segment', (req, res) => {
  const { streamKey, segment } = req.params;
  const segmentPath = path.join(__dirname, 'media', streamKey, segment);
  
  if (fs.existsSync(segmentPath)) {
    res.setHeader('Content-Type', 'video/MP2T');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache segments for 24 hours
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(segmentPath);
  } else {
    res.status(404).json({ error: 'Segment not found' });
  }
});

// Cleanup on shutdown
process.on('SIGINT', () => {
  console.log('Shutting down RTMP server...');
  
  // Stop all active FFmpeg processes
  for (const [streamKey, stream] of activeStreams) {
    if (stream.ffmpegProcess) {
      console.log(`Stopping FFmpeg process for stream: ${streamKey}`);
      stream.ffmpegProcess.kill('SIGINT');
    }
  }
  
  nms.stop();
  server.close();
  process.exit(0);
});

// Start servers
const HTTP_PORT = process.env.HTTP_PORT || 8081;

server.listen(HTTP_PORT, () => {
  console.log(`🚀 VisionWare RTMP-to-HLS Server started`);
  console.log(`📺 RTMP Server: rtmp://localhost:${config.rtmp.port}/live`);
  console.log(`🌐 HTTP API: http://localhost:${HTTP_PORT}`);
  console.log(`📊 Health Check: http://localhost:${HTTP_PORT}/health`);
  console.log(`📋 Active Streams: http://localhost:${HTTP_PORT}/streams`);
  console.log(`🎬 HLS Playback: http://localhost:${HTTP_PORT}/hls/[STREAM_KEY]/index.m3u8`);
  console.log(`🎯 Backend URL: ${config.backend.url}`);
  console.log('');
  console.log('MediaSoup integration removed - Pure RTMP-to-HLS architecture');
  console.log('Ready for OBS Studio streaming!');
});

nms.run();

// Export for testing
module.exports = { nms, app, activeStreams };