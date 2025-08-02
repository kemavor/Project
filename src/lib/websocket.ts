import toast from 'react-hot-toast'
import type { Transcription } from './api'

// Change this to your backend IP if not running frontend and backend on the same machine
// Use secure WebSocket if available, fallback to regular WebSocket
const getWebSocketUrl = () => {
  // In development, use the Vite proxy for WebSocket connections
  if (import.meta.env.DEV) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  
  // In production, use the environment variable or default to backend
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return import.meta.env.VITE_WS_URL || `${protocol}//localhost:8000`;
};
const WS_URL = getWebSocketUrl();

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

  // Livestream events
  'livestream:chat_message': {
    id: number;
    message: string;
    message_type: string;
    user: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
    };
    created_at: string;
  };
  'livestream:question': {
    id: number;
    question: string;
    is_answered: boolean;
    is_visible: boolean;
    upvotes: number;
    user: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
    };
    created_at: string;
  };
  'livestream:question_upvote': {
    question_id: number;
    upvotes: number;
  };
  'livestream:question_answer': {
    question_id: number;
    answer: string;
    answered_at: string;
  };
  'livestream:viewer_count_update': {
    stream_id: number;
    count: number;
  };
  'livestream:status_update': {
    stream_id: number;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  };
  'livestream:user_joined': {
    stream_id: number;
    user: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
    };
  };
  'livestream:user_left': {
    stream_id: number;
    user_id: number;
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
  'collaboration:user_left': (data: { userId: string; lectureId: string }) => void
  'collaboration:message': (data: { userId: string; message: string; lectureId: string }) => void
}

class WebSocketService {
  private socket: WebSocket | null = null
  private isConnected = false
  private isAuthenticated = false
  private authToken: string | null = null
  private currentLectureId: string | null = null
  private currentStreamId: string | null = null
  private connectionRetries = 0
  private maxRetries = 3
  private retryDelay = 2000
  private eventHandlers = new Map<string, Set<Function>>()

  constructor() {
    // Check for existing auth token on initialization
    this.authToken = localStorage.getItem('access_token')
    this.isAuthenticated = !!this.authToken

    if (this.isAuthenticated) {
      this.connect()
    }
  }

  // Authentication methods
  setAuthToken(token: string) {
    this.authToken = token
    this.isAuthenticated = true
    localStorage.setItem('access_token', token)
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Reconnect with new token
      this.socket.close()
    } else {
    this.connect()
    }
  }

  clearAuthToken() {
    this.authToken = null
    this.isAuthenticated = false
    // Don't remove access_token from localStorage here - let AuthContext handle that
    // localStorage.removeItem('access_token')
    
    if (this.socket) {
      this.socket.close()
    }
  }

  // Connection management
  private validateWebSocketUrl(url: string): boolean {
    // Ensure the URL is a valid WebSocket URL
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      console.error('Invalid WebSocket URL:', url);
      return false;
    }
    return true;
  }

  private connect() {
    // Only connect if authenticated
    if (!this.isAuthenticated || !this.authToken) {
      console.log('WebSocket: Not authenticated, skipping connection')
      return
    }

    // Don't create multiple connections
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      console.log('WebSocket: Connection already exists, skipping')
      return
    }

    try {
    // Add auth token to WebSocket URL
      const wsUrl = `${WS_URL}/ws/?token=${this.authToken}`
      
      // Validate the WebSocket URL before creating connection
      if (!this.validateWebSocketUrl(wsUrl)) {
        console.error('Invalid WebSocket URL, skipping connection');
        return;
      }
      
      console.log('WebSocket: Attempting to connect to:', wsUrl)
    this.socket = new WebSocket(wsUrl)

    this.setupEventListeners()
    } catch (error) {
      console.error('WebSocket: Failed to create connection:', error)
      // Don't show error toast for WebSocket connection failures - they shouldn't affect user data
      // toast.error('Failed to connect to real-time services')
    }
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.onopen = () => {
      console.log('WebSocket connected successfully')
      this.isConnected = true
      this.connectionRetries = 0
      // Don't show success toast - WebSocket connection is not critical for user data
      // toast.success('Connected to real-time services')

      // Rejoin lecture/stream if we were in one
      if (this.currentLectureId) {
        this.joinLecture(this.currentLectureId)
      }
      if (this.currentStreamId) {
        this.joinLivestream(this.currentStreamId)
      }
    }

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.reason, 'Code:', event.code)
      this.isConnected = false

      // Only attempt to reconnect if authenticated and not explicitly closed
      if (this.isAuthenticated && !event.wasClean && event.code !== 1000) {
        this.handleReconnection()
      } else if (event.code === 1000) { // Normal closure
        // Don't show error for normal closure - WebSocket is not critical for user data
        // toast.error('Disconnected from server')
      } else { // Abnormal closure
        // Don't show error for WebSocket disconnection - it shouldn't affect user data
        // toast.error('Disconnected from real-time services unexpectedly')
        if (this.isAuthenticated) {
          this.handleReconnection()
        }
      }
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      // Don't automatically reconnect on error, let onclose handle it
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
    if (this.connectionRetries >= this.maxRetries) {
      console.error('Max reconnection attempts reached')
      toast.error('Failed to reconnect to real-time services')
      return
    }

      this.connectionRetries++
    const delay = this.retryDelay * this.connectionRetries

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.connectionRetries})`)

      setTimeout(() => {
      if (this.isAuthenticated) {
        this.connect()
      }
      }, delay)
  }

  // Event handling
  on<T extends keyof WebSocketEvents>(event: T, callback: WebSocketEvents[T]) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(callback as Function)
  }

  off<T extends keyof WebSocketEvents>(event: T, callback: WebSocketEvents[T]) {
    const listeners = this.eventHandlers.get(event)
    if (listeners) {
      listeners.delete(callback as Function)
    }
  }

  // Emit events
  emit(event: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: event, data }))
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event)
    }
  }

  // Lecture methods
  joinLecture(lectureId: string) {
    this.currentLectureId = lectureId
    this.emit('lecture:join', { lectureId })
  }

  leaveLecture(lectureId: string) {
    this.emit('lecture:leave', { lectureId })
    if (this.currentLectureId === lectureId) {
      this.currentLectureId = null
    }
  }

  sendLectureMessage(lectureId: string, message: string) {
    this.emit('lecture:chat_message', { lectureId, message })
  }

  askLectureQuestion(lectureId: string, question: string) {
    this.emit('lecture:question', { lectureId, question })
  }

  // Livestream methods - Note: Backend doesn't handle join/leave events
  // These are handled automatically by the backend when connecting to /ws/livestream/{stream_id}
  joinLivestream(streamId: string) {
    this.currentStreamId = streamId
    // Backend automatically handles join when connecting to the stream-specific endpoint
    console.log('Joined livestream:', streamId)
  }

  leaveLivestream(streamId: string) {
    if (this.currentStreamId === streamId) {
      this.currentStreamId = null
    }
    // Backend automatically handles leave when disconnecting
    console.log('Left livestream:', streamId)
  }

  sendLivestreamChatMessage(streamId: string, message: string, messageType: string = 'text') {
    this.emit('livestream:chat_message', { streamId, message, messageType })
  }

  askLivestreamQuestion(streamId: string, question: string) {
    this.emit('livestream:question', { streamId, question })
  }

  upvoteLivestreamQuestion(streamId: string, questionId: number) {
    this.emit('livestream:question_upvote', { streamId, questionId })
  }

  answerLivestreamQuestion(streamId: string, questionId: number, answer: string) {
    this.emit('livestream:question_answer', { streamId, questionId, answer })
  }

  // WebRTC methods
  sendWebRTCSignal(lectureId: string, signal: any, to?: string) {
    this.emit('webrtc:signal', { lectureId, signal, to })
  }

  startWebRTCBroadcast(lectureId: string) {
    this.emit('webrtc:start', { lectureId })
  }

  stopWebRTCBroadcast(lectureId: string) {
    this.emit('webrtc:stop', { lectureId })
  }

  // Utility methods
  isConnectedToServer() {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN
  }

  getConnectionState() {
    if (!this.socket) return 'disconnected'
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
    return 'disconnected'
      default:
        return 'unknown'
    }
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'User initiated disconnect')
    }
    this.isConnected = false
    this.currentLectureId = null
    this.currentStreamId = null
    this.eventHandlers.clear()
  }
}

// Create singleton instance
export const wsService = new WebSocketService()

// Export for use in components
export default wsService