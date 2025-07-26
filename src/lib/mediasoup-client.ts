import { io, Socket } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import { Device } from 'mediasoup-client';

interface MediaSoupConfig {
  serverUrl: string;
  roomId: string;
  userId: string;
}

interface ProducerTransport {
  id: string;
  iceParameters: any;
  iceCandidates: any;
  dtlsParameters: any;
}

interface ConsumerTransport {
  id: string;
  iceParameters: any;
  iceCandidates: any;
  dtlsParameters: any;
}

interface Producer {
  id: string;
  kind: 'audio' | 'video';
}

interface Consumer {
  id: string;
  kind: 'audio' | 'video';
  rtpParameters: any;
  type: string;
  producerId: string;
}

// Use any for MediaSoup types to avoid import issues
type MediaSoupTransport = any;
type MediaSoupProducer = any;
type MediaSoupConsumer = any;

class MediaSoupClient {
  private socket: Socket | null = null;
  private device: Device | null = null;
  private sendTransport: MediaSoupTransport | null = null;
  private recvTransport: MediaSoupTransport | null = null;
      private producers: Map<string, MediaSoupProducer> = new Map();
    private consumers: Map<string, MediaSoupConsumer> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private config: MediaSoupConfig | null = null;
  private isConnected = false;

  // Event callbacks
  private onLocalStream: ((stream: MediaStream | null) => void) | null = null;
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChange: ((state: string) => void) | null = null;

  constructor() {
    // MediaSoup client is now available via import
    console.log('MediaSoup client loaded');
  }

  public async connect(config: MediaSoupConfig): Promise<void> {
    console.log('Calling connect() with config:', config);
    this.config = config;
    
    try {
      // Connect to MediaSoup server
      this.socket = io(config.serverUrl);
      
      this.socket.on('connect', () => {
        console.log('Connected to MediaSoup server');
        this.isConnected = true;
        this.joinRoom();
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from MediaSoup server');
        this.isConnected = false;
        this.cleanup();
      });

      this.socket.on('error', (error: any) => {
        console.error('MediaSoup socket error:', error);
      });

      // Set up event handlers
      this.setupEventHandlers();

    } catch (error) {
      console.error('Failed to connect to MediaSoup server:', error);
      throw error;
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('user-joined', (data: { userId: string; socketId: string }) => {
      console.log('User joined:', data);
    });

    this.socket.on('user-left', (data: { socketId: string }) => {
      console.log('User left:', data);
      // Handle user leaving
    });

    this.socket.on('new-producer', async (data: { producerId: string; kind: string }) => {
      console.log('New producer:', data);
      await this.consume(data.producerId, data.kind as 'audio' | 'video');
    });
  }

  private joinRoom() {
    if (!this.socket || !this.config) return;
    console.log('Emitting join-room', { roomId: this.config.roomId, userId: this.config.userId });
    this.socket.emit('join-room', {
      roomId: this.config.roomId,
      userId: this.config.userId
    });
  }

  public async startBroadcasting(stream?: MediaStream): Promise<void> {
    if (!this.socket || !this.config) {
      throw new Error('Not connected to MediaSoup server');
    }

    // Use provided stream or get a new one with lower constraints
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });
      } catch (err) {
        if (this.onLocalStream) {
          this.onLocalStream(null);
        }
        throw new Error('Could not start video source');
      }
    }

    this.localStream = stream;

    try {
      // Create producer transport
      const producerTransport = await this.createProducerTransport();
      this.sendTransport = producerTransport;

      // Create producers for each track
      for (const track of stream.getTracks()) {
        await this.createProducer(track);
      }

      // Notify local stream callback
      if (this.onLocalStream) {
        this.onLocalStream(stream);
      }

    } catch (error) {
      console.error('Failed to start broadcasting:', error);
      throw error;
    }
  }

  public async startViewing(): Promise<void> {
    if (!this.socket || !this.config) {
      throw new Error('Not connected to MediaSoup server');
    }

    try {
      // Create consumer transport
      const consumerTransport = await this.createConsumerTransport();
      this.recvTransport = consumerTransport;

    } catch (error) {
      console.error('Failed to start viewing:', error);
      throw error;
    }
  }

  private async createProducerTransport(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }
      console.log('Emitting create-producer-transport', { roomId: this.config!.roomId });
      this.socket.emit('create-producer-transport', {
        roomId: this.config!.roomId
      }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        this.createTransport(response, 'send', resolve, reject);
      });
    });
  }

  private async createConsumerTransport(): Promise<MediaSoupTransport> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }
      console.log('Emitting create-consumer-transport', { roomId: this.config!.roomId });
      this.socket.emit('create-consumer-transport', {
        roomId: this.config!.roomId
      }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        this.createReceiveTransport(response, resolve, reject);
      });
    });
  }

  private async createReceiveTransport(
    transportOptions: any,
    resolve: (transport: MediaSoupTransport) => void,
    reject: (error: Error) => void
  ) {
    try {
      if (!this.device) {
        this.device = new mediasoupClient.Device();
      }

      const transport = this.device.createRecvTransport(transportOptions);

      transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          this.socket!.emit('connect-consumer-transport', {
            roomId: this.config!.roomId,
            dtlsParameters
          }, (response: any) => {
            if (response.error) {
              errback(new Error(response.error));
            } else {
              callback();
            }
          });
        } catch (error) {
          errback(error as Error);
        }
      });

      transport.on('connectionstatechange', (state: string) => {
        console.log('Receive transport connection state:', state);
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(state);
        }
      });

      resolve(transport);
    } catch (error) {
      reject(error as Error);
    }
  }

  private async createTransport(
    transportOptions: any,
    direction: 'send' | 'recv',
    resolve: (transport: MediaSoupTransport) => void,
    reject: (error: Error) => void
  ) {
    try {
      if (!this.device) {
        // Create device if not exists
        this.device = new mediasoupClient.Device();
      }

      if (!this.device.loaded) {
        // Get RTP capabilities from server
        console.log('Emitting get-rtp-capabilities', { roomId: this.config!.roomId });
        const rtpCapabilities = await new Promise((resolve, reject) => {
          this.socket!.emit('get-rtp-capabilities', { roomId: this.config!.roomId }, (data: any) => {
            if (data.error) reject(data.error);
            else resolve(data);
          });
        });
        await this.device.load({ routerRtpCapabilities: rtpCapabilities as any });
      }

      const transport = this.device.createSendTransport(transportOptions);

      transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          const eventName = direction === 'send' ? 'connect-producer-transport' : 'connect-consumer-transport';
          console.log('Emitting', eventName, { roomId: this.config!.roomId, dtlsParameters });
          this.socket!.emit(eventName, {
            roomId: this.config!.roomId,
            dtlsParameters
          }, (response: any) => {
            if (response.error) {
              errback(new Error(response.error));
            } else {
              callback();
            }
          });
        } catch (error) {
          errback(error as Error);
        }
      });

      transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          console.log('Emitting produce', { roomId: this.config!.roomId, kind, rtpParameters });
          this.socket!.emit('produce', {
            roomId: this.config!.roomId,
            kind,
            rtpParameters
          }, (response: any) => {
            if (response.error) {
              errback(new Error(response.error));
            } else {
              callback({ id: response.id });
            }
          });
        } catch (error) {
          errback(error as Error);
        }
      });

      transport.on('connectionstatechange', (state: string) => {
        console.log('Transport connection state:', state);
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(state);
        }
      });

      resolve(transport);
    } catch (error) {
      reject(error as Error);
    }
  }

  private async createProducer(track: MediaStreamTrack): Promise<void> {
    if (!this.sendTransport) {
      throw new Error('Send transport not created');
    }

    try {
      const producer = await this.sendTransport.produce(track);
      this.producers.set(producer.id, producer);
      
      console.log('Created producer:', producer.id, 'for track:', track.kind);
    } catch (error) {
      console.error('Failed to create producer:', error);
      throw error;
    }
  }

  private async consume(producerId: string, kind: 'audio' | 'video'): Promise<void> {
    if (!this.recvTransport || !this.device) {
      throw new Error('Receive transport or device not created');
    }

    try {
      const consumer = await this.recvTransport.consume({
        producerId,
        rtpCapabilities: this.device.rtpCapabilities,
        paused: false
      });
      
      this.consumers.set(consumer.id, consumer);
      
      // Create a MediaStream from the consumer
      const stream = new MediaStream([consumer.track]);
      this.remoteStream = stream;
      
      // Notify remote stream callback
      if (this.onRemoteStream) {
        this.onRemoteStream(stream);
      }
      
      console.log('Created consumer:', consumer.id, 'for track:', kind);
    } catch (error) {
      console.error('Failed to create consumer:', error);
      throw error;
    }
  }

  public disconnect(): void {
    this.cleanup();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private cleanup(): void {
    // Close all producers
    for (const [id, producer] of this.producers) {
      try {
        (producer as any).close?.();
      } catch (error) {
        console.warn('Error closing producer:', error);
      }
    }
    this.producers.clear();

    // Close all consumers
    for (const [id, consumer] of this.consumers) {
      try {
        (consumer as any).close?.();
      } catch (error) {
        console.warn('Error closing consumer:', error);
      }
    }
    this.consumers.clear();

    // Close transports
    if (this.sendTransport && this.sendTransport.close) {
      this.sendTransport.close();
      this.sendTransport = null;
    }

    if (this.recvTransport && this.recvTransport.close) {
      this.recvTransport.close();
      this.recvTransport = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.remoteStream = null;
    this.isConnected = false;
  }

  // Event setters
  public onLocalStreamCallback(callback: (stream: MediaStream | null) => void): void {
    this.onLocalStream = callback;
  }

  public onRemoteStreamCallback(callback: (stream: MediaStream) => void): void {
    this.onRemoteStream = callback;
  }

  public onConnectionStateChangeCallback(callback: (state: string) => void): void {
    this.onConnectionStateChange = callback;
  }

  // Getters
  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  public getConnectionStats(): any {
    return {
      isConnected: this.isConnected,
      producersCount: this.producers.size,
      consumersCount: this.consumers.size,
      hasLocalStream: !!this.localStream,
      hasRemoteStream: !!this.remoteStream
    };
  }
}

// Export singleton instance
export const mediaSoupClient = new MediaSoupClient(); 