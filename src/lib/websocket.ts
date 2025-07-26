import toast from 'react-hot-toast'
import type { Transcription } from './api'

// Change this to your backend IP if not running frontend and backend on the same machine
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000' // <-- update to your backend IP

export interface WebSocketEvents {
  // Lecture events
  'lecture:transcription': {
    id: number;
    timestamp: string;
    speaker: string;
    text: string;
  };
  'lecture:viewer_count_update': {
    lectureId: string;
    count: number;
  };
  'lecture:chat_message': {
    id: string;
    user: string;
    message: string;
    timestamp: string;
    avatar?: string;
  };
  'lecture:status_change': {
    lectureId: string;
    status: 'scheduled' | 'live' | 'ended';
  };
  'lecture:leave': {
    lectureId: string;
    userId: string;
  };
  'lecture:question': {
    id: string;
    user: string;
    question: string;
    timestamp: string;
    upvotes: number;
    answered: boolean;
  };
  'lecture:poll_vote': {
    pollId: string;
    optionId: string;
    userId: string;
  };

  // WebRTC events
  'webrtc:signal': {
    type: 'offer' | 'answer' | 'candidate';
    payload: any;
    from?: string;
    to?: string;
    lectureId: string;
  };
  'webrtc:start': {
    lectureId: string;
    userId: string;
  };
  'webrtc:stop': {
    lectureId: string;
    userId: string;
  };
  'webrtc:join': {
    lectureId: string;
    userId: string;
  };

  // User events
  'notification:new': (data: { id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }) => void
  'user:online_status': (data: { userId: string; online: boolean }) => void

  // System events
  'system:maintenance': (data: { message: string; scheduledAt: string }) => void

  // Collaboration events
  'collaboration:user_joined': (data: { userId: string; userName: string; lectureId: string }) => void
  'collaboration:user_left': (data: { userId: string; userName: string; lectureId: string }) => void
  'collaboration:question_asked': (data: { userId: string; userName: string; question: string; lectureId: string }) => void
}

export type WebSocketEventHandler<T extends keyof WebSocketEvents> = (data: WebSocketEvents[T]) => void;

class WebSocketService {
  private socket: WebSocket | null = null
  private connectionRetries = 0
  private maxRetries = 5
  private retryDelay = 1000
  private isConnected = false
  private eventHandlers: Map<string, Set<Function>> = new Map()
  private currentLectureId: string | null = null
  private authToken: string | null = null
  private isAuthenticated = false
  private autoConnect = false

  constructor() {
    // Don't auto-connect - wait for authentication
    // this.checkAuthStatus() // Disabled auto-connection to prevent errors
  }

  private checkAuthStatus() {
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      this.authToken = token
      this.isAuthenticated = true
      this.autoConnect = true
      this.connect()
    }
  }

  public setAuthToken(token: string) {
    this.authToken = token
    this.isAuthenticated = true
    this.autoConnect = true
    this.connect()
  }

  public clearAuth() {
    this.authToken = null
    this.isAuthenticated = false
    this.autoConnect = false
    this.disconnect()
  }

  private connect() {
    // Only connect if authenticated
    if (!this.isAuthenticated || !this.authToken) {
      console.log('WebSocket: Not authenticated, skipping connection')
      return
    }

    // Add auth token to WebSocket URL
    const wsUrl = `${WS_URL}/ws/lecture/?token=${this.authToken}`
    this.socket = new WebSocket(wsUrl)

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.onopen = () => {
      console.log('WebSocket connected')
      this.isConnected = true
      this.connectionRetries = 0
      toast.success('Connected to real-time services')

      // Rejoin lecture if we were in one
      if (this.currentLectureId) {
        this.joinLecture(this.currentLectureId)
      }
    }

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.reason)
      this.isConnected = false

      // Only attempt to reconnect if authenticated and not explicitly closed
      if (this.isAuthenticated && !event.wasClean) {
        this.handleReconnection()
      } else if (event.code === 1000) { // Normal closure
        toast.error('Disconnected from server')
      } else { // Abnormal closure
        toast.error('Disconnected from real-time services unexpectedly')
        if (this.isAuthenticated) {
          this.handleReconnection()
        }
      }
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      if (this.isAuthenticated) {
        this.handleReconnection()
      }
    }

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        const eventType = message.type
        const data = message.data

        if (eventType) {
          const listeners = this.eventHandlers.get(eventType) || new Set()
          listeners.forEach((listener) => listener(data))
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
  }

  private handleReconnection() {
    if (!this.isAuthenticated) return
    
    if (this.connectionRetries < this.maxRetries) {
      this.connectionRetries++
      const delay = this.retryDelay * Math.pow(2, this.connectionRetries - 1)

      console.log(`Attempting to reconnect (${this.connectionRetries}/${this.maxRetries}) in ${delay}ms`)

      setTimeout(() => {
        this.connect() // Attempt to reconnect
      }, delay)
    } else {
      toast.error('Lost connection to real-time services')
    }
  }

  // Public methods
  public on<T extends keyof WebSocketEvents>(event: T, handler: WebSocketEventHandler<T>) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)?.add(handler)
  }

  public off<T extends keyof WebSocketEvents>(event: T, handler: WebSocketEventHandler<T>) {
    this.eventHandlers.get(event)?.delete(handler)
  }

  public emit<T extends keyof WebSocketEvents>(event: T, data: WebSocketEvents[T]) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify({ type: event, data: data }))
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event)
    }
  }

  // Lecture-specific methods
  public joinLecture(lectureId: string) {
    this.currentLectureId = lectureId
    if (this.socket && this.isConnected) {
      this.emit('webrtc:join', { lectureId: lectureId, userId: 'anonymous' }) // Assuming userId is sent from backend
    }
  }

  public leaveLecture(lectureId: string) {
    if (this.currentLectureId === lectureId) {
      this.currentLectureId = null
    }
  }

  public askQuestion(lectureId: string, question: string) {
    this.emit('lecture:question', {
      id: Date.now().toString(),
      user: 'anonymous', // This should be the actual user
      question: question,
      timestamp: new Date().toISOString(),
      upvotes: 0,
      answered: false
    })
  }

  public sendMessage(lectureId: string, message: string) {
    this.emit('lecture:chat_message', {
      id: Date.now().toString(),
      user: 'anonymous', // This should be the actual user
      message: message,
      timestamp: new Date().toISOString()
    })
  }

  public votePoll(lectureId: string, pollId: string, optionId: string) {
    this.emit('lecture:poll_vote', {
      pollId: pollId,
      optionId: optionId,
      userId: 'anonymous' // This should be the actual user
    })
  }

  public isConnectedToServer(): boolean {
    return this.isConnected
  }

  public getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.socket?.readyState === WebSocket.OPEN) return 'connected'
    if (this.socket?.readyState === WebSocket.CONNECTING) return 'connecting'
    return 'disconnected'
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnecting')
      this.socket = null
    }
    this.isConnected = false
  }

  public reconnect() {
    this.disconnect()
    setTimeout(() => {
      this.connect()
    }, 1000)
  }
}

export const wsService = new WebSocketService()