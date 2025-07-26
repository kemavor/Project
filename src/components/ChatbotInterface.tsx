import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Send, 
  MessageSquare, 
  BookOpen, 
  Brain, 
  Trash2, 
  Plus,
  Bot,
  User,
  FileText,
  Lightbulb,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ECHOWelcome from './ECHOWelcome';

interface ChatSession {
  id: number;
  user_id: number;
  course_id?: number;
  session_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: any;
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id?: number;
}

const ChatbotInterface: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState('chat');
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
    loadCourses();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      setShowWelcome(false);
    }
  }, [sessions]);

  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id);
    }
  }, [currentSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const response = await apiClient.getChatSessions();
      if (!response.error && response.data && Array.isArray(response.data)) {
        setSessions(response.data);
        if (response.data.length > 0 && !currentSession) {
          setCurrentSession(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load chat sessions');
    }
  };

  const loadCourses = async () => {
    try {
      const response = await apiClient.getMyCourses();
      if (!response.error) {
        setCourses(response.data || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadMessages = async (sessionId: number) => {
    try {
      const response = await apiClient.getChatMessages(sessionId);
      if (!response.error && response.data && Array.isArray(response.data)) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const createNewSession = async () => {
    try {
      const sessionData = {
        course_id: selectedCourseId,
        session_name: `Chat ${new Date().toLocaleDateString()}`
      };
      
      const response = await apiClient.createChatSession(sessionData);
      if (!response.error && response.data) {
        const newSession = response.data as ChatSession;
        setSessions(prev => [newSession, ...prev]);
        setCurrentSession(newSession);
        setMessages([]);
        toast.success('New chat session created');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create new session');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;

    const messageToSend = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: Date.now(),
      session_id: currentSession.id,
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await apiClient.sendChatMessage({
        message: messageToSend,
        session_id: currentSession.id,
        course_id: currentSession.course_id,
        include_course_content: true
      });

      if (!response.error && response.data) {
        const data = response.data as any;
        const assistantMessage: ChatMessage = {
          id: data.message_id || Date.now(),
          session_id: data.session_id || currentSession.id,
          role: 'assistant',
          content: data.response || 'No response received',
          timestamp: data.timestamp || new Date().toISOString(),
          metadata: data.metadata
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Update session message count
        setSessions(prev => prev.map(s => 
          s.id === currentSession.id 
            ? { ...s, message_count: s.message_count + 2, updated_at: new Date().toISOString() }
            : s
        ));
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: number) => {
    try {
      const response = await apiClient.deleteChatSession(sessionId);
      if (!response.error) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSession?.id === sessionId) {
          setCurrentSession(sessions.find(s => s.id !== sessionId) || null);
        }
        toast.success('Chat session deleted');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCourseName = (courseId?: number) => {
    if (!courseId) return 'General Chat';
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'Unknown Course';
  };

  const handleStartChat = () => {
    setShowWelcome(false);
    if (sessions.length === 0) {
      createNewSession();
    }
  };

  if (showWelcome) {
    return (
      <ECHOWelcome onStartChat={handleStartChat} />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ECHO</h1>
          <p className="text-lg text-gray-600 mb-1">Educational Context Handler Oracle</p>
          <p className="text-sm text-gray-500">Your intelligent AI learning assistant that processes, understands, and reflects back knowledge</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Chat Sessions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Session Controls */}
              <div className="space-y-2">
                <Select value={selectedCourseId?.toString()} onValueChange={(value) => setSelectedCourseId(value ? parseInt(value) : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General Chat</SelectItem>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={createNewSession} className="w-full" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>

              {/* Sessions List */}
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        currentSession?.id === session.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setCurrentSession(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {session.session_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getCourseName(session.course_id)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {session.message_count} messages
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {formatTimestamp(session.updated_at)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                {currentSession ? currentSession.session_name : 'Select a chat session'}
                {currentSession?.course_id && (
                  <Badge variant="outline" className="ml-2">
                    {getCourseName(currentSession.course_id)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages Area */}
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-gray-900'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs opacity-70">
                                {formatTimestamp(message.timestamp)}
                              </span>
                              {message.role === 'assistant' && message.metadata?.course_content_used && (
                                <Badge variant="outline" className="text-xs">
                                  <FileText className="w-3 h-3 mr-1" />
                                  Course content used
                                </Badge>
                              )}
                              {message.role === 'assistant' && (
                                <span className="text-xs font-medium text-blue-600">— ECHO</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-blue-600 ml-2">ECHO is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                  placeholder="Ask ECHO anything about your coursework..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInterface; 