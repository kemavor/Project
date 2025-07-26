import { useState, useEffect, useCallback, useRef } from 'react';
import { mediaSoupClient } from '../lib/mediasoup-client';

interface UseMediaSoupOptions {
  serverUrl?: string;
  roomId?: string;
  userId?: string;
}

interface MediaSoupState {
  isConnected: boolean;
  isBroadcasting: boolean;
  isViewing: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: string;
  error: string | null;
}

export const useMediaSoup = (options: UseMediaSoupOptions = {}) => {
  const {
    serverUrl = 'http://localhost:3001',
    roomId,
    userId
  } = options;

  const [state, setState] = useState<MediaSoupState>({
    isConnected: false,
    isBroadcasting: false,
    isViewing: false,
    localStream: null,
    remoteStream: null,
    connectionState: 'disconnected',
    error: null
  });

  const isConnectingRef = useRef(false);

  // Set up event callbacks
  useEffect(() => {
    mediaSoupClient.onLocalStreamCallback((stream) => {
      setState(prev => ({
        ...prev,
        localStream: stream,
        isBroadcasting: true
      }));
    });

    mediaSoupClient.onRemoteStreamCallback((stream) => {
      setState(prev => ({
        ...prev,
        remoteStream: stream,
        isViewing: true
      }));
    });

    mediaSoupClient.onConnectionStateChangeCallback((connectionState) => {
      setState(prev => ({
        ...prev,
        connectionState
      }));
    });

    return () => {
      // Cleanup callbacks
      mediaSoupClient.onLocalStreamCallback(() => {});
      mediaSoupClient.onRemoteStreamCallback(() => {});
      mediaSoupClient.onConnectionStateChangeCallback(() => {});
    };
  }, []);

  const connect = useCallback(async () => {
    if (!roomId || !userId || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;
    setState(prev => ({ ...prev, error: null }));

    try {
      await mediaSoupClient.connect({
        serverUrl,
        roomId,
        userId
      });

      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionState: 'connected'
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect'
      }));
    } finally {
      isConnectingRef.current = false;
    }
  }, [serverUrl, roomId, userId]);

  const disconnect = useCallback(() => {
    mediaSoupClient.disconnect();
    setState({
      isConnected: false,
      isBroadcasting: false,
      isViewing: false,
      localStream: null,
      remoteStream: null,
      connectionState: 'disconnected',
      error: null
    });
  }, []);

  const startBroadcasting = useCallback(async (stream?: MediaStream) => {
    if (!state.isConnected) {
      setState(prev => ({
        ...prev,
        error: 'Not connected to MediaSoup server'
      }));
      return;
    }

    try {
      let mediaStream = stream;
      
      if (!mediaStream) {
        // Get user media if no stream provided (use lower constraints for compatibility)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });
        console.log('Got local stream:', mediaStream);
        mediaStream.getTracks().forEach(track => {
          track.onended = () => console.log('Track ended:', track);
        });
      }

      await mediaSoupClient.startBroadcasting(mediaStream);
      
      setState(prev => ({
        ...prev,
        localStream: mediaStream || null,
        isBroadcasting: true,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start broadcasting'
      }));
    }
  }, [state.isConnected]);

  const startViewing = useCallback(async () => {
    if (!state.isConnected) {
      setState(prev => ({
        ...prev,
        error: 'Not connected to MediaSoup server'
      }));
      return;
    }

    try {
      await mediaSoupClient.startViewing();
      setState(prev => ({
        ...prev,
        isViewing: true,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start viewing'
      }));
    }
  }, [state.isConnected]);

  const stopBroadcasting = useCallback(() => {
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    
    setState(prev => ({
      ...prev,
      localStream: null,
      isBroadcasting: false
    }));
  }, [state.localStream]);

  const stopViewing = useCallback(() => {
    setState(prev => ({
      ...prev,
      remoteStream: null,
      isViewing: false
    }));
  }, []);

  const getConnectionStats = useCallback(() => {
    return mediaSoupClient.getConnectionStats();
  }, []);

  // Auto-connect when roomId and userId are provided
  useEffect(() => {
    if (roomId && userId && !state.isConnected && !isConnectingRef.current) {
      connect();
    }
  }, [roomId, userId, state.isConnected, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect, // Expose connect so it can be called from the component
    disconnect,
    startBroadcasting,
    startViewing,
    stopBroadcasting,
    stopViewing,
    getConnectionStats
  };
}; 