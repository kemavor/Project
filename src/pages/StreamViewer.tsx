import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Wifi,
  WifiOff,
  Settings,
  Share2,
  Eye,
  Users,
  Radio,
  Monitor
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StreamData {
  id: number;
  title: string;
  description: string;
  status: string;
  instructor_id: number;
  course_id: number;
  rtmp_key?: string;
  hls_url?: string;
  viewer_count: number;
  started_at?: string;
  is_public: boolean;
  chat_locked?: boolean;
  instructor?: {
    username: string;
    first_name: string;
    last_name: string;
  };
  course?: {
    title: string;
  };
}

const StreamViewer: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [viewerCount, setViewerCount] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);

  // HLS.js integration
  useEffect(() => {
    const loadHLS = async () => {
      if (!streamData?.rtmp_key) return;

      const hlsUrl = `http://localhost:8081/hls/${streamData.rtmp_key}/index.m3u8`;
      
      try {
        // Dynamic import of hls.js
        const Hls = (await import('hls.js')).default;
        
        if (Hls.isSupported()) {
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }
          
          const hls = new Hls({
            debug: false,
            enableWorker: false,
            lowLatencyMode: true,
            backBufferLength: 90,
            liveSyncDurationCount: 3
          });
          
          hlsRef.current = hls;
          hls.loadSource(hlsUrl);
          
          if (videoRef.current) {
            hls.attachMedia(videoRef.current);
          }
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setConnectionStatus('connected');
            setStreamError(null);
            // Auto-play if possible
            if (videoRef.current) {
              videoRef.current.play().catch(() => {
                // Autoplay failed, user interaction required
              });
            }
          });
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS Error:', data);
            if (data.fatal) {
              setConnectionStatus('disconnected');
              setStreamError(`Stream error: ${data.details}`);
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  setStreamError('Network connection error');
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  setStreamError('Media playback error');
                  break;
                default:
                  setStreamError('Stream unavailable');
                  break;
              }
            }
          });
          
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          videoRef.current.src = hlsUrl;
          setConnectionStatus('connected');
        } else {
          setStreamError('HLS not supported in this browser');
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        console.error('Failed to load HLS:', error);
        setStreamError('Failed to initialize video player');
        setConnectionStatus('disconnected');
      }
    };

    loadHLS();
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamData?.rtmp_key]);

  // Fetch stream data
  useEffect(() => {
    const fetchStreamData = async () => {
      if (!streamId) return;
      
      try {
        setIsLoading(true);
        const response = await apiClient.getLiveStream(parseInt(streamId));
        
        if (response.error) {
          toast.error(response.error);
          navigate('/livestream');
          return;
        }
        
        setStreamData(response.data);
      } catch (error) {
        toast.error('Failed to load stream');
        navigate('/livestream');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreamData();
  }, [streamId, navigate]);

  // Poll for viewer count updates
  useEffect(() => {
    if (!streamData?.rtmp_key) return;

    const pollViewerCount = async () => {
      try {
        const response = await fetch('http://localhost:8081/streams');
        const data = await response.json();
        const activeStream = data.activeStreams.find((s: any) => s.streamKey === streamData.rtmp_key);
        if (activeStream) {
          setViewerCount(activeStream.viewers || 0);
          if (!activeStream.hlsReady) {
            setConnectionStatus('connecting');
          }
        }
      } catch (error) {
        console.error('Failed to fetch viewer count:', error);
      }
    };

    pollViewerCount();
    const interval = setInterval(pollViewerCount, 5000);
    return () => clearInterval(interval);
  }, [streamData?.rtmp_key]);

  // Video event handlers
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const copyStreamUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Stream URL copied to clipboard');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Please log in to view this stream.</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading stream...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!streamData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Stream Not Found</h2>
              <p className="text-gray-600 mb-4">The requested stream could not be found.</p>
              <Button onClick={() => navigate('/livestream')}>
                View All Streams
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Stream Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{streamData.title}</h1>
              <p className="text-gray-600 mt-1">
                {streamData.instructor?.first_name} {streamData.instructor?.last_name}
                {streamData.course && ` • ${streamData.course.title}`}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge 
                className={`${
                  streamData.status === 'live' ? 'bg-red-500' : 
                  streamData.status === 'scheduled' ? 'bg-yellow-500' : 'bg-gray-500'
                } text-white`}
              >
                <Radio className="w-3 h-3 mr-1" />
                {streamData.status.toUpperCase()}
              </Badge>
              <div className="flex items-center text-gray-600">
                <Users className="w-4 h-4 mr-1" />
                <span>{viewerCount} viewers</span>
              </div>
              <div className="flex items-center text-gray-600">
                {connectionStatus === 'connected' ? (
                  <Wifi className="w-4 h-4 mr-1 text-green-500" />
                ) : connectionStatus === 'connecting' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-1"></div>
                ) : (
                  <WifiOff className="w-4 h-4 mr-1 text-red-500" />
                )}
                <span className="capitalize">{connectionStatus}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                <div className="relative bg-black rounded-t-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {streamError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                      <div className="text-center text-white">
                        <AlertCircle className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Stream Unavailable</h3>
                        <p className="text-gray-300">{streamError}</p>
                        <Button 
                          variant="outline" 
                          className="mt-4 text-white border-white hover:bg-white hover:text-black"
                          onClick={() => window.location.reload()}
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        className="w-full h-full"
                        controls
                        muted={isMuted}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onVolumeChange={(e) => {
                          const video = e.target as HTMLVideoElement;
                          setVolume(video.volume);
                          setIsMuted(video.muted);
                        }}
                        poster="/api/placeholder/800/450"
                      />
                      
                      {connectionStatus === 'connecting' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="text-center text-white">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                            <p>Connecting to stream...</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Custom Controls */}
                <div className="p-4 bg-gray-900 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePlayPause}
                        className="text-white hover:text-gray-300"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMute}
                        className="text-white hover:text-gray-300"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                      
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyStreamUrl}
                        className="text-white hover:text-gray-300"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleFullscreen}
                        className="text-white hover:text-gray-300"
                      >
                        <Maximize className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Stream Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Stream Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stream Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {streamData.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                      <p className="text-sm text-gray-600">{streamData.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Started</p>
                    <p className="text-sm text-gray-600">
                      {streamData.started_at ? new Date(streamData.started_at).toLocaleString() : 'Not started'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Visibility</p>
                    <Badge variant={streamData.is_public ? 'default' : 'secondary'}>
                      {streamData.is_public ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Teacher Controls */}
              {user?.role === 'teacher' && streamData.instructor_id === user.id && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Stream Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/livestream/create')}
                        className="w-full"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Stream
                      </Button>
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={copyStreamUrl}
                        className="w-full"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Stream URL
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                      <p><strong>Tip:</strong> Use "Manage Stream" to start/stop streaming or copy RTMP settings for OBS.</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Technical Info (for debugging) */}
              {user?.role === 'teacher' && streamData.instructor_id === user.id && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Monitor className="w-4 h-4 mr-2" />
                      Technical Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div>
                      <p className="font-medium">Stream Key:</p>
                      <p className="font-mono bg-gray-100 p-1 rounded break-all">{streamData.rtmp_key}</p>
                    </div>
                    <div>
                      <p className="font-medium">HLS URL:</p>
                      <p className="font-mono bg-gray-100 p-1 rounded break-all">
                        http://localhost:8081/hls/{streamData.rtmp_key}/index.m3u8
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Connection:</p>
                      <p className="capitalize">{connectionStatus}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamViewer;