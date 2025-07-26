import React, { useRef, useEffect } from 'react';
import { useMediaSoup } from '../hooks/useMediaSoup';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Video, Mic, MicOff, VideoOff, Users, Wifi, WifiOff } from 'lucide-react';

interface MediaSoupTestProps {
  roomId?: string;
  userId?: string;
}

export const MediaSoupTest: React.FC<MediaSoupTestProps> = ({ 
  roomId = 'test-room-1', 
}) => {
  // Generate a stable userId for the session
  const userIdRef = useRef('user-' + Math.random().toString(36).substr(2, 9));
  const userId = userIdRef.current;
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    isConnected,
    isBroadcasting,
    isViewing,
    localStream,
    remoteStream,
    connectionState,
    error,
    startBroadcasting,
    startViewing,
    stopBroadcasting,
    stopViewing,
    getConnectionStats,
    connect
  } = useMediaSoup({
    roomId,
    userId
  });

  // Add this useEffect to call connect() on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Set video sources when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleStartBroadcasting = async () => {
    try {
      await startBroadcasting();
    } catch (error) {
      console.error('Failed to start broadcasting:', error);
    }
  };

  const handleStartViewing = async () => {
    try {
      await startViewing();
    } catch (error) {
      console.error('Failed to start viewing:', error);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            MediaSoup Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Badge variant="outline">
              <div className={`w-2 h-2 rounded-full mr-2 ${getConnectionStatusColor()}`} />
              {connectionState}
            </Badge>
            <Badge variant="outline">
              <Users className="w-3 h-3 mr-1" />
              Room: {roomId}
            </Badge>
            <Badge variant="outline">
              User: {userId}
            </Badge>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleStartBroadcasting}
              disabled={!isConnected || isBroadcasting}
              className="flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Start Broadcasting
            </Button>
            
            <Button
              onClick={stopBroadcasting}
              disabled={!isBroadcasting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <VideoOff className="w-4 h-4" />
              Stop Broadcasting
            </Button>

            <Button
              onClick={handleStartViewing}
              disabled={!isConnected || isViewing}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Start Viewing
            </Button>

            <Button
              onClick={stopViewing}
              disabled={!isViewing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MicOff className="w-4 h-4" />
              Stop Viewing
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Local Stream</CardTitle>
              </CardHeader>
              <CardContent>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-48 bg-black rounded"
                />
                <div className="mt-2 text-sm text-muted-foreground">
                  {localStream ? `${localStream.getTracks().length} tracks` : 'No stream'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Remote Stream</CardTitle>
              </CardHeader>
              <CardContent>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-48 bg-black rounded"
                />
                <div className="mt-2 text-sm text-muted-foreground">
                  {remoteStream ? `${remoteStream.getTracks().length} tracks` : 'No stream'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-sm text-muted-foreground">
            <div>Connection Stats:</div>
            <pre className="mt-2 p-2 bg-muted rounded text-xs">
              {JSON.stringify(getConnectionStats(), null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 