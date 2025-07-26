import { wsService } from './websocket'

interface RTCMessage {
  type: 'offer' | 'answer' | 'candidate'
  payload: any
  from?: string
  to?: string
}

interface StreamQuality {
  label: string;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null
  private stream: MediaStream | null = null
  private isInitiator = false
  private lectureId: string | null = null
  private userId: string | null = null
  private mediaRecorder: MediaRecorder | null = null

  constructor() {
    this.setupWebRTCEvents()
  }

  private setupWebRTCEvents() {
    wsService.on('webrtc:signal', this.handleSignaling.bind(this))
    wsService.on('webrtc:start', this.handleStreamStart.bind(this))
    wsService.on('webrtc:stop', this.handleStreamStop.bind(this))
  }

  private async createPeerConnection() {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }

    try {
      this.peerConnection = new RTCPeerConnection(configuration)

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate:', event.candidate)
          this.sendSignaling({
            type: 'candidate',
            payload: event.candidate,
            from: this.userId || undefined,
            to: this.isInitiator ? 'viewers' : 'broadcaster'
          })
        }
      }

      this.peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind)
        if (!this.isInitiator) {
          const [remoteStream] = event.streams
          this.stream = remoteStream
          this.dispatchStreamEvent(remoteStream)
        }
      }

      this.peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', this.peerConnection?.connectionState)
        if (this.peerConnection?.connectionState === 'failed') {
          console.error('WebRTC connection failed')
          this.stopStream()
        }
      }

      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', this.peerConnection?.iceConnectionState)
      }

      return this.peerConnection
    } catch (error) {
      console.error('Error creating peer connection:', error)
      throw error
    }
  }

  private async handleSignaling(message: RTCMessage) {
    if (!this.peerConnection) {
      await this.createPeerConnection()
    }

    switch (message.type) {
      case 'offer':
        if (!this.isInitiator) {
          await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(message.payload))
          const answer = await this.peerConnection!.createAnswer()
          await this.peerConnection!.setLocalDescription(answer)
          this.sendSignaling({
            type: 'answer',
            payload: answer,
            from: this.userId || undefined,
            to: message.from
          })
        }
        break

      case 'answer':
        if (this.isInitiator) {
          await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(message.payload))
        }
        break

      case 'candidate':
        if (this.peerConnection!.remoteDescription) {
          await this.peerConnection!.addIceCandidate(new RTCIceCandidate(message.payload))
        }
        break
    }
  }

  private sendSignaling(message: RTCMessage) {
    wsService.emit('webrtc:signal', {
      ...message,
      lectureId: this.lectureId || ''
    })
  }

  private handleStreamStart(data: { lectureId: string }) {
    console.log('Stream started:', data.lectureId)
  }

  private handleStreamStop(data: { lectureId: string }) {
    if (data.lectureId === this.lectureId) {
      this.stopStream()
    }
  }

  private dispatchStreamEvent(stream: MediaStream) {
    const event = new CustomEvent('streamReceived', { detail: { stream } })
    window.dispatchEvent(event)
  }

  // Public methods
  public async startBroadcast(lectureId: string, userId: string, quality?: StreamQuality) {
    this.lectureId = lectureId
    this.userId = userId
    this.isInitiator = true

    try {
      // Get user media with quality constraints
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: quality?.width || 1920 },
          height: { ideal: quality?.height || 1080 },
          frameRate: { ideal: quality?.frameRate || 30 }
        },
        audio: true
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints)

      await this.createPeerConnection()

      // Add tracks to peer connection
      this.stream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.stream!)
      })

      // Create and send offer
      const offer = await this.peerConnection!.createOffer()
      await this.peerConnection!.setLocalDescription(offer)
      this.sendSignaling({
        type: 'offer',
        payload: offer,
        from: userId,
        to: 'viewers'
      })

      // Notify backend that stream has started
      wsService.emit('webrtc:start', { lectureId, userId })

      return this.stream
    } catch (error) {
      console.error('Error starting broadcast:', error)
      throw error
    }
  }

  public async joinStream(lectureId: string, userId: string) {
    this.lectureId = lectureId
    this.userId = userId
    this.isInitiator = false

    await this.createPeerConnection()
    wsService.emit('webrtc:join', { lectureId, userId })
  }

  public stopStream() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
      this.mediaRecorder = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.isInitiator && this.lectureId) {
      wsService.emit('webrtc:stop', { lectureId: this.lectureId, userId: this.userId || 'unknown' })
    }

    this.lectureId = null
    this.userId = null
    this.isInitiator = false
  }

  public getStream() {
    return this.stream
  }

  public getPeerConnection() {
    return this.peerConnection
  }

  public isStreaming() {
    return this.stream !== null && this.peerConnection !== null
  }

  public getConnectionStats() {
    if (!this.peerConnection) return null
    
    return this.peerConnection.getStats()
  }
}

export const webRTCService = new WebRTCService()
export default webRTCService 