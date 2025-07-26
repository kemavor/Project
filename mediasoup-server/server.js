const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mediasoup = require('mediasoup');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// MediaSoup configuration
const config = {
  mediasoup: {
    worker: {
      rtcMinPort: 10000,
      rtcMaxPort: 10100,
      logLevel: 'warn',
      logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp']
    },
    router: {
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000
          }
        },
        {
          kind: 'video',
          mimeType: 'video/H264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'level-asymmetry-allowed': 1
          }
        }
      ]
    },
    webRtcTransport: {
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: '127.0.0.1'
        }
      ],
      initialAvailableOutgoingBitrate: 1000000,
      minimumAvailableOutgoingBitrate: 600000,
      maxSctpMessageSize: 262144,
      maxIncomingBitrate: 1500000
    }
  }
};

let worker;
let router;
let rooms = new Map();

// Initialize MediaSoup worker
async function createWorker() {
  worker = await mediasoup.createWorker({
    logLevel: config.mediasoup.worker.logLevel,
    logTags: config.mediasoup.worker.logTags,
    rtcMinPort: config.mediasoup.worker.rtcMinPort,
    rtcMaxPort: config.mediasoup.worker.rtcMaxPort
  });

  worker.on('died', () => {
    console.error('MediaSoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
    setTimeout(() => process.exit(1), 2000);
  });

  router = await worker.createRouter({ mediaCodecs: config.mediasoup.router.mediaCodecs });
  console.log('MediaSoup worker created with PID:', worker.pid);
}

// Create a new room
function createRoom(roomId) {
  const room = {
    id: roomId,
    router: router,
    peers: new Map(),
    producers: new Map(),
    consumers: new Map()
  };
  rooms.set(roomId, room);
  return room;
}

// Get or create room
function getOrCreateRoom(roomId) {
  let room = rooms.get(roomId);
  if (!room) {
    room = createRoom(roomId);
  }
  return room;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', async (data) => {
    const { roomId, userId } = data;
    const room = getOrCreateRoom(roomId);
    
    socket.join(roomId);
    room.peers.set(socket.id, { userId, socket });
    
    console.log(`User ${userId} joined room ${roomId}`);
    
    // Notify other peers in the room
    socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });
  });

  // Add this handler for RTP capabilities
  socket.on('get-rtp-capabilities', (data, callback) => {
    const { roomId } = data;
    const room = getOrCreateRoom(roomId);
    if (!room || !room.router) {
      callback({ error: 'Room or router not found' });
      return;
    }
    callback(room.router.rtpCapabilities);
  });

  socket.on('create-producer-transport', async (data, callback) => {
    try {
      const { roomId } = data;
      const room = getOrCreateRoom(roomId);
      
      const transport = await room.router.createWebRtcTransport(config.mediasoup.webRtcTransport);
      
      transport.on('dtlsstatechange', (dtlsState) => {
        if (dtlsState === 'closed') {
          console.log('Producer transport closed');
        }
      });

      transport.on('close', () => {
        console.log('Producer transport closed');
      });

      room.peers.get(socket.id).producerTransport = transport;

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      });
    } catch (error) {
      console.error('Error creating producer transport:', error);
      callback({ error: error.message });
    }
  });

  socket.on('connect-producer-transport', async (data, callback) => {
    try {
      const { roomId, dtlsParameters } = data;
      const room = getOrCreateRoom(roomId);
      const peer = room.peers.get(socket.id);
      
      await peer.producerTransport.connect({ dtlsParameters });
      callback({ success: true });
    } catch (error) {
      console.error('Error connecting producer transport:', error);
      callback({ error: error.message });
    }
  });

  socket.on('produce', async (data, callback) => {
    try {
      const { roomId, kind, rtpParameters } = data;
      const room = getOrCreateRoom(roomId);
      const peer = room.peers.get(socket.id);
      
      const producer = await peer.producerTransport.produce({ kind, rtpParameters });
      
      room.producers.set(producer.id, producer);
      peer.producers.set(producer.id, producer);
      
      producer.on('transportclose', () => {
        console.log('Producer transport closed');
      });

      callback({ id: producer.id });
      
      // Notify other peers about new producer
      socket.to(roomId).emit('new-producer', {
        producerId: producer.id,
        kind: producer.kind
      });
    } catch (error) {
      console.error('Error creating producer:', error);
      callback({ error: error.message });
    }
  });

  socket.on('create-consumer-transport', async (data, callback) => {
    try {
      const { roomId } = data;
      const room = getOrCreateRoom(roomId);
      
      const transport = await room.router.createWebRtcTransport(config.mediasoup.webRtcTransport);
      
      transport.on('dtlsstatechange', (dtlsState) => {
        if (dtlsState === 'closed') {
          console.log('Consumer transport closed');
        }
      });

      transport.on('close', () => {
        console.log('Consumer transport closed');
      });

      room.peers.get(socket.id).consumerTransport = transport;

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      });
    } catch (error) {
      console.error('Error creating consumer transport:', error);
      callback({ error: error.message });
    }
  });

  socket.on('connect-consumer-transport', async (data, callback) => {
    try {
      const { roomId, dtlsParameters } = data;
      const room = getOrCreateRoom(roomId);
      const peer = room.peers.get(socket.id);
      
      await peer.consumerTransport.connect({ dtlsParameters });
      callback({ success: true });
    } catch (error) {
      console.error('Error connecting consumer transport:', error);
      callback({ error: error.message });
    }
  });

  socket.on('consume', async (data, callback) => {
    try {
      const { roomId, producerId, rtpCapabilities } = data;
      const room = getOrCreateRoom(roomId);
      const peer = room.peers.get(socket.id);
      
      const consumer = await peer.consumerTransport.consume({
        producerId,
        rtpCapabilities,
        paused: false
      });
      
      room.consumers.set(consumer.id, consumer);
      peer.consumers.set(consumer.id, consumer);
      
      consumer.on('transportclose', () => {
        console.log('Consumer transport closed');
      });

      callback({
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerId: consumer.producerId
      });
    } catch (error) {
      console.error('Error creating consumer:', error);
      callback({ error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up peer from all rooms
    for (const [roomId, room] of rooms) {
      const peer = room.peers.get(socket.id);
      if (peer) {
        // Close all producers
        for (const [producerId, producer] of peer.producers) {
          producer.close();
          room.producers.delete(producerId);
        }
        
        // Close all consumers
        for (const [consumerId, consumer] of peer.consumers) {
          consumer.close();
          room.consumers.delete(consumerId);
        }
        
        // Close transports
        if (peer.producerTransport) {
          peer.producerTransport.close();
        }
        if (peer.consumerTransport) {
          peer.consumerTransport.close();
        }
        
        room.peers.delete(socket.id);
        
        // Notify other peers
        socket.to(roomId).emit('user-left', { socketId: socket.id });
        
        // Remove room if empty
        if (room.peers.size === 0) {
          rooms.delete(roomId);
        }
        
        break;
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    worker: worker ? 'running' : 'not running',
    rooms: rooms.size 
  });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  await createWorker();
  
  server.listen(PORT, () => {
    console.log(`MediaSoup server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
  });
}

startServer().catch(console.error); 