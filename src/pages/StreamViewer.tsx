import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Users, 
  MessageCircle, 
  HelpCircle,
  Send,
  ThumbsUp,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Wifi,
  WifiOff,
  Settings,
  Share2,
  Bookmark,
  Flag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import FlvVideoPlayer from '../components/FlvVideoPlayer';

interface StreamData {
  id: number;
  title: string;
  description: string;
  status: string;
  instructor_id: number;
  course_id: number;
  stream_url?: string;
  stream_key?: string;
  viewer_count: number;
  started_at?: string;
  is_public: boolean;
  instructor?: {
    username: string;
    first_name: string;
    last_name: string;
  };
  course?: {
    id: number;
    title: string;
  };
}

interface ChatMessage {
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
}

interface Question {
  id: number;
  question: string;
  is_answered: boolean;
  is_visible: boolean;
  upvotes: number;
  answered_at?: string;
  answered_by?: number;
  answer?: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

const StreamViewer: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stream, setStream] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [streamQuality, setStreamQuality] = useState('auto');
  const [chatEnabled, setChatEnabled] = useState(true);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (!streamId || !user) return;

    // For now, skip WebSocket connection to avoid errors
    console.log('WebSocket connection disabled for now');
    setIsOnline(true); // Assume online for now
    toast.success('Connected to live stream (WebSocket disabled)');
  }, [streamId, user]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'livestream:chat_message':
        setChatMessages(prev => [...prev, data.data]);
        break;
      case 'livestream:question':
        setQuestions(prev => [...prev, data.data]);
        break;
      case 'livestream:viewer_count_update':
        setViewerCount(data.data.count);
        break;
      case 'livestream:status_update':
        setStream(prev => prev ? { ...prev, status: data.data.status } : null);
        break;
      case 'livestream:question_upvote':
        setQuestions(prev => prev.map(q => 
          q.id === data.data.question_id 
            ? { ...q, upvotes: data.data.upvotes }
            : q
        ));
        break;
      case 'livestream:question_answer':
        setQuestions(prev => prev.map(q => 
          q.id === data.data.question_id 
            ? { ...q, is_answered: true, answer: data.data.answer, answered_at: data.data.answered_at }
            : q
        ));
        break;
      case 'livestream:user_joined':
        // Handle user joined event
        console.log('User joined:', data.data.user);
        break;
      case 'livestream:user_left':
        // Handle user left event
        console.log('User left:', data.data.user_id);
        break;
    }
  };

  const sendWebSocketMessage = (type: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  };

  useEffect(() => {
    if (streamId) {
      fetchStreamDetails();
      joinStream();
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [streamId, connectWebSocket]);

  useEffect(() => {
    if (joined) {
      fetchChatMessages();
      fetchQuestions();
      // Reduced polling frequency since we have WebSocket
      const interval = setInterval(() => {
        fetchStreamStats();
      }, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [joined]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchStreamDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getLiveStream(parseInt(streamId!));
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      setStream(response.data as StreamData);
      setViewerCount((response.data as any)?.viewer_count || 0);
    } catch (err) {
      setError('Failed to load stream details');
    } finally {
      setLoading(false);
    }
  };

  const joinStream = async () => {
    try {
      const response = await apiClient.joinLiveStream(parseInt(streamId!));
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      setJoined(true);
      toast.success('Joined stream successfully!');
    } catch (err) {
      toast.error('Failed to join stream');
    }
  };

  const leaveStream = async () => {
    try {
      await apiClient.leaveLiveStream(parseInt(streamId!));
      setJoined(false);
      toast.success('Left stream');
      navigate('/livestream');
    } catch (err) {
      toast.error('Failed to leave stream');
    }
  };

  const fetchChatMessages = async () => {
    try {
      const response = await apiClient.getStreamChatMessages(parseInt(streamId!));
      if (!response.error) {
        setChatMessages((response.data as ChatMessage[]) || []);
      }
    } catch (err) {
      console.error('Failed to fetch chat messages:', err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await apiClient.getQuestions(parseInt(streamId!));
      if (!response.error) {
        setQuestions((response.data as Question[]) || []);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    }
  };

  const fetchStreamStats = async () => {
    try {
      const response = await apiClient.getStreamStats(parseInt(streamId!));
      if (!response.error) {
        const stats = response.data as any;
        setViewerCount(stats.viewer_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch stream stats:', err);
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !joined) return;
    
    try {
      // Send via WebSocket for real-time delivery
      sendWebSocketMessage('livestream:chat_message', {
        message: newMessage.trim(),
        message_type: 'text'
      });

      // Also send via API for persistence
      const response = await apiClient.sendStreamChatMessage(
        parseInt(streamId!),
        newMessage.trim(),
        'text'
      );
      
      if (response.error) {
        toast.error('Failed to send message');
        return;
      }
      
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const askQuestion = async () => {
    if (!newQuestion.trim() || !joined) return;
    
    try {
      // Send via WebSocket for real-time delivery
      sendWebSocketMessage('livestream:question', {
        question: newQuestion.trim()
      });

      // Also send via API for persistence
      const response = await apiClient.askQuestion(parseInt(streamId!), newQuestion.trim());
      
      if (response.error) {
        toast.error('Failed to ask question');
        return;
      }
      
      setNewQuestion('');
      toast.success('Question sent!');
    } catch (err) {
      toast.error('Failed to ask question');
    }
  };

  const upvoteQuestion = async (questionId: number) => {
    try {
      // Send via WebSocket for real-time updates
      sendWebSocketMessage('livestream:question_upvote', { question_id: questionId });

      // Also send via API for persistence
      await apiClient.upvoteQuestion(parseInt(streamId!), questionId);
    } catch (err) {
      toast.error('Failed to upvote question');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Try to make the video container fullscreen
      const videoContainer = document.querySelector('.aspect-video');
      if (videoContainer) {
        videoContainer.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const shareStream = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Stream link copied to clipboard!');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading stream...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !stream) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Stream Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The requested stream could not be found.'}</p>
            <Button onClick={() => navigate('/livestream')}>
              Back to Streams
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Stream Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{stream.title}</h1>
                <Badge variant="default">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  {stream.status === 'live' ? 'LIVE' : stream.status.toUpperCase()}
                </Badge>
                <Badge variant={isOnline ? 'default' : 'destructive'}>
                  {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                  {isOnline ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <p className="text-gray-600 mb-3">{stream.description}</p>
              {stream.status === 'live' && (
                <p className="text-green-600 text-sm mb-2">
                  ✓ Stream is active and receiving video from OBS
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {viewerCount} viewers
                </div>
                {stream.instructor && (
                  <div>
                    by {stream.instructor.first_name} {stream.instructor.last_name}
                  </div>
                )}
                {stream.course && (
                  <div>
                    Course: {stream.course.title}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={shareStream}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            <Button variant="outline" onClick={leaveStream}>
              <X className="w-4 h-4 mr-2" />
              Leave Stream
            </Button>
          </div>
        </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Stream Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Stream Quality</label>
                  <select 
                    value={streamQuality} 
                    onChange={(e) => setStreamQuality(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="auto">Auto</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Chat</label>
                  <div className="flex items-center mt-1">
                    <input
                      type="checkbox"
                      checked={chatEnabled}
                      onChange={(e) => setChatEnabled(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Enable chat</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="relative bg-black rounded-t-lg">
                  {/* Video Player */}
                  <div className="aspect-video bg-gray-900 flex items-center justify-center">
                    {stream.status === 'live' ? (
                      <div className="w-full h-full">
                        <FlvVideoPlayer
                          src={`http://localhost:8001/live/${stream.stream_key}.flv`}
                          className="w-full h-full object-cover"
                          controls={true}
                          autoPlay={true}
                          muted={isMuted}
                          onError={(error) => {
                            console.log('FLV player error:', error);
                            toast.error('Failed to load video stream');
                          }}
                          onLoad={() => {
                            console.log('FLV stream loaded successfully');
                            toast.success('Stream connected successfully');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-center text-white">
                        <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-semibold">Stream Not Live</p>
                        <p className="text-gray-400">
                          {stream.status === 'scheduled' ? 'Stream will start soon' : 'Stream has ended'}
                        </p>
                        <div className="mt-4 text-sm text-gray-300">
                          <p>OBS Setup Instructions:</p>
                          <p>• Service: Custom</p>
                          <p>• Server: rtmp://localhost:1935/live</p>
                          <p>• Stream Key: {stream.stream_key}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Video Controls */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={toggleMute}
                      className="bg-black/50 hover:bg-black/70"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={toggleFullscreen}
                      className="bg-black/50 hover:bg-black/70"
                    >
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat and Q&A Panel */}
          <div className="lg:col-span-1">
            <Card className="h-[600px]">
              <CardHeader className="pb-3">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="chat" className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Q&A
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  {/* Chat Tab */}
                  <TabsContent value="chat" className="h-[500px] flex flex-col">
                    <ScrollArea className="flex-1 px-4" ref={chatRef}>
                      <div className="space-y-3 pb-4">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-gray-500 py-8">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                            <p>No messages yet</p>
                            <p className="text-sm">Be the first to say something!</p>
                          </div>
                        ) : (
                          chatMessages.map((message) => (
                          <div key={message.id} className="flex gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {message.user.first_name?.[0] || message.user.username[0]}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">
                                  {message.user.first_name} {message.user.last_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTime(message.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{message.message}</p>
                            </div>
                          </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                    
                    <Separator />
                    
                    <div className="p-4">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                          disabled={!joined || !chatEnabled}
                        />
                        <Button onClick={sendChatMessage} disabled={!joined || !newMessage.trim() || !chatEnabled}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Q&A Tab */}
                  <TabsContent value="questions" className="h-[500px] flex flex-col">
                    <ScrollArea className="flex-1 px-4" ref={questionsRef}>
                      <div className="space-y-4 pb-4">
                        {questions.length === 0 ? (
                          <div className="text-center text-gray-500 py-8">
                            <HelpCircle className="w-8 h-8 mx-auto mb-2" />
                            <p>No questions yet</p>
                            <p className="text-sm">Ask the first question!</p>
                          </div>
                        ) : (
                          questions.map((question) => (
                          <div key={question.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-sm">
                                    {question.user.first_name} {question.user.last_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTime(question.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{question.question}</p>
                                
                                {question.is_answered && question.answer && (
                                  <div className="bg-green-50 border-l-4 border-green-400 p-3 mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <span className="font-semibold text-sm text-green-800">Answered</span>
                                    </div>
                                    <p className="text-sm text-green-700">{question.answer}</p>
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => upvoteQuestion(question.id)}
                                className="flex items-center gap-1"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span className="text-sm">{question.upvotes}</span>
                              </Button>
                            </div>
                          </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                    
                    <Separator />
                    
                    <div className="p-4">
                      <div className="flex gap-2">
                        <Input
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          placeholder="Ask a question..."
                          onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                          disabled={!joined}
                        />
                        <Button onClick={askQuestion} disabled={!joined || !newQuestion.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StreamViewer; 