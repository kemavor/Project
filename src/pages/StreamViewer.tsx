import React, { useState, useEffect, useRef } from 'react';
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
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StreamData {
  id: number;
  title: string;
  description: string;
  status: string;
  instructor_id: number;
  course_id: number;
  stream_url?: string;
  viewer_count: number;
  started_at?: string;
  is_public: boolean;
  instructor?: {
    username: string;
    first_name: string;
    last_name: string;
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamId) {
      fetchStreamDetails();
      joinStream();
    }
  }, [streamId]);

  useEffect(() => {
    if (joined) {
      fetchChatMessages();
      fetchQuestions();
      const interval = setInterval(() => {
        fetchChatMessages();
        fetchQuestions();
        fetchStreamStats();
      }, 5000); // Poll every 5 seconds
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
      navigate('/courses');
    } catch (err) {
      toast.error('Failed to leave stream');
    }
  };

  const fetchChatMessages = async () => {
    try {
      const response = await apiClient.getChatMessages(parseInt(streamId!));
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
        setViewerCount((response.data as any)?.current_viewers || 0);
      }
    } catch (err) {
      console.error('Failed to fetch stream stats:', err);
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const response = await apiClient.sendStreamChatMessage(parseInt(streamId!), newMessage);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      setNewMessage('');
      fetchChatMessages(); // Refresh messages
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const askQuestion = async () => {
    if (!newQuestion.trim()) return;
    
    try {
      const response = await apiClient.askQuestion(parseInt(streamId!), newQuestion);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      setNewQuestion('');
      fetchQuestions(); // Refresh questions
      toast.success('Question submitted!');
    } catch (err) {
      toast.error('Failed to submit question');
    }
  };

  const upvoteQuestion = async (questionId: number) => {
    try {
      await apiClient.upvoteQuestion(parseInt(streamId!), questionId);
      fetchQuestions(); // Refresh questions
    } catch (err) {
      toast.error('Failed to upvote question');
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <Button onClick={() => navigate('/courses')}>
              Back to Courses
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{stream.title}</h1>
              <p className="text-gray-600 mt-2">{stream.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant={stream.status === 'live' ? 'default' : 'secondary'}>
                  {stream.status === 'live' ? (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                      LIVE
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      {stream.status}
                    </>
                  )}
                </Badge>
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-1" />
                  {viewerCount} viewers
                </div>
                {stream.instructor && (
                  <div className="text-gray-600">
                    by {stream.instructor.first_name} {stream.instructor.last_name}
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={leaveStream}>
              <X className="w-4 h-4 mr-2" />
              Leave Stream
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="relative bg-black rounded-t-lg">
                  {/* Video Player Placeholder */}
                  <div className="aspect-video bg-gray-900 flex items-center justify-center">
                    {stream.status === 'live' ? (
                      <div className="text-center text-white">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <Play className="w-8 h-8" />
                        </div>
                        <p className="text-lg font-semibold">Live Stream</p>
                        <p className="text-gray-400">Stream is currently live</p>
                        {stream.stream_url && (
                          <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            controls
                            autoPlay
                            muted={isMuted}
                          >
                            <source src={stream.stream_url} type="application/x-mpegURL" />
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-white">
                        <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-semibold">Stream Not Live</p>
                        <p className="text-gray-400">
                          {stream.status === 'scheduled' ? 'Stream will start soon' : 'Stream has ended'}
                        </p>
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
                        {chatMessages.map((message) => (
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
                        ))}
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
                          disabled={!joined}
                        />
                        <Button onClick={sendChatMessage} disabled={!joined || !newMessage.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Q&A Tab */}
                  <TabsContent value="questions" className="h-[500px] flex flex-col">
                    <ScrollArea className="flex-1 px-4" ref={questionsRef}>
                      <div className="space-y-4 pb-4">
                        {questions.map((question) => (
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
                        ))}
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