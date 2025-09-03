import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, LiveStream } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Users,
  Clock,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

// HLS.js types
declare global {
  interface Window {
    Hls: any;
  }
}

const WatchLiveStream: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  
  // State management
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [connectionState, setConnectionState] = useState<'connected' | 'connecting' | 'error'>('connecting');
  const [viewers, setViewers] = useState(0);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [hlsSupported, setHlsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchStream();
  }, [isAuthenticated, streamId]);

  // Initialize HLS.js
  useEffect(() => {
    // Load HLS.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    script.onload = () => {
      setHlsSupported(window.Hls?.isSupported());
      initializePlayer();
    };
    script.onerror = () => {
      setError('Failed to load HLS.js library');
    };
    document.head.appendChild(script);

    return () => {
      cleanupPlayer();
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [stream]);

  // Fetch stream details
  const fetchStream = async () => {
    if (!streamId) {
      setError('Invalid stream ID');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.getLiveStream(parseInt(streamId));
      
      if (response.error) {
        setError(response.error);
      } else {
        setStream(response.data || null);
      }
    } catch (error) {
      setError('Failed to fetch stream details');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize HLS player
  const initializePlayer = () => {
    if (!stream || !videoRef.current || !window.Hls) return;

    cleanupPlayer();

    try {
      if (window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 3,
          maxFragLookUpTolerance: 0.25,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 5,
          liveDurationInfinity: true,
        });

        hlsRef.current = hls;

        hls.loadSource(stream.hls_url);
        hls.attachMedia(videoRef.current);

        // HLS events
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS manifest parsed successfully');
          setConnectionState('connected');
          setError(null);
          setRetryAttempts(0);
        });

        hls.on(window.Hls.Events.FRAG_LOADED, () => {
          setIsBuffering(false);
        });

        hls.on(window.Hls.Events.FRAG_LOADING, () => {
          setIsBuffering(true);
        });

        hls.on(window.Hls.Events.ERROR, (event, data) => {
          console.error('HLS Error:', data);
          
          if (data.fatal) {
            setConnectionState('error');
            
            switch (data.type) {
              case window.Hls.ErrorTypes.NETWORK_ERROR:
                setError('Network error: Unable to load stream');
                handleRetry();
                break;
              case window.Hls.ErrorTypes.MEDIA_ERROR:
                setError('Media error: Stream format not supported');
                hls.recoverMediaError();
                break;
              default:
                setError('Fatal error occurred while playing stream');
                break;
            }
          }
        });

        hls.on(window.Hls.Events.FRAG_BUFFERED, () => {
          setIsBuffering(false);
        });

      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        videoRef.current.src = stream.hls_url;
        setConnectionState('connected');
        setError(null);
      } else {
        setError('HLS not supported in this browser');
      }
    } catch (error) {
      console.error('Error initializing player:', error);
      setError('Failed to initialize video player');
    }
  };

  // Cleanup player
  const cleanupPlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  // Retry connection
  const handleRetry = () => {
    if (retryAttempts < 3) {
      setTimeout(() => {
        setRetryAttempts(prev => prev + 1);
        setConnectionState('connecting');
        initializePlayer();
      }, 2000 * (retryAttempts + 1));
    }
  };

  // Video event handlers
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeToggle = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getConnectionIcon = () => {
    switch (connectionState) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting': return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'error': return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500 text-white';
      case 'scheduled': return 'bg-yellow-500 text-white';
      case 'ended': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-black font-medium">Loading stream...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stream) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Stream Not Found</h2>
                            <p className="text-black font-medium mb-4">The requested stream could not be found.</p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                {/* Video Container */}
                <div className="relative bg-black aspect-video rounded-t-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls={false}
                    autoPlay
                    muted={isMuted}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onWaiting={() => setIsBuffering(true)}
                    onCanPlay={() => setIsBuffering(false)}
                  >
                    Your browser does not support the video tag.
                  </video>

                  {/* Loading Overlay */}
                  {(isBuffering || connectionState === 'connecting') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-white text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>
                          {connectionState === 'connecting' ? 'Connecting to stream...' : 'Buffering...'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Overlay */}
                  {error && connectionState === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                      <div className="text-white text-center p-6">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                        <h3 className="text-lg font-semibold mb-2">Stream Error</h3>
                        <p className="mb-4">{error}</p>
                        <Button
                          onClick={handleRetry}
                          variant="outline"
                          className="text-white border-white hover:bg-white hover:text-black"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry ({3 - retryAttempts} attempts left)
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Custom Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <div className="flex items-center gap-4">
                      {/* Play/Pause */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={isPlaying ? handlePause : handlePlay}
                        className="text-white hover:bg-white hover:bg-opacity-20"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>

                      {/* Volume */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleVolumeToggle}
                          className="text-white hover:bg-white hover:bg-opacity-20"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-16 accent-white"
                        />
                      </div>

                      {/* Time */}
                      <div className="text-white text-sm">
                        {formatTime(currentTime)} / {duration ? formatTime(duration) : 'LIVE'}
                      </div>

                      {/* Connection Status */}
                      <div className="flex items-center gap-2 text-white">
                        {getConnectionIcon()}
                        <span className="text-sm">{connectionState}</span>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Fullscreen */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleFullscreen}
                        className="text-white hover:bg-white hover:bg-opacity-20"
                      >
                        <Maximize className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stream Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold mb-2">{stream.title}</h1>
                      {stream.description && (
                        <p className="text-black font-medium mb-3">{stream.description}</p>
                      )}
                                              <div className="flex items-center gap-4 text-sm text-black">
                        <span>Course: {stream.course?.title}</span>
                        <Badge className={getStatusColor(stream.status)}>
                          {stream.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <Users className="w-5 h-5" />
                        {stream.viewer_count} viewers
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stream Details Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Stream Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Status</h4>
                  <Badge className={getStatusColor(stream.status)}>
                    {stream.status.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Course</h4>
                  <p className="text-sm">{stream.course?.title}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Instructor</h4>
                  <p className="text-sm">{stream.course?.instructor_name || 'Unknown'}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Created</h4>
                  <p className="text-sm">{new Date(stream.created_at).toLocaleString()}</p>
                </div>

                {stream.started_at && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Started</h4>
                    <p className="text-sm">{new Date(stream.started_at).toLocaleString()}</p>
                  </div>
                )}

                {stream.ended_at && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Ended</h4>
                    <p className="text-sm">{new Date(stream.ended_at).toLocaleString()}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Viewers</h4>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{stream.viewer_count} / {stream.max_viewers}</span>
                  </div>
                </div>

                {stream.is_recording && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      This stream is being recorded and will be available for later viewing.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Technical Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>HLS Support:</span>
                  <span>{hlsSupported ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <span className="flex items-center gap-1">
                    {getConnectionIcon()}
                    {connectionState}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Retry Attempts:</span>
                  <span>{retryAttempts}/3</span>
                </div>
                <div className="flex justify-between">
                  <span>Stream URL:</span>
                  <span className="truncate max-w-[100px]" title={stream.hls_url}>
                    {stream.hls_url.split('/').pop()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchLiveStream;