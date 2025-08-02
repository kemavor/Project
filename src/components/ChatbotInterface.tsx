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
  Clock,
  Image
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ECHOWelcome from './ECHOWelcome';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
      const response = await apiClient.getCourses();
      if (!response.error && response.data && Array.isArray(response.data)) {
        setCourses(response.data);
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
        // Scroll to bottom after messages are loaded
        setTimeout(() => {
          scrollToBottom();
        }, 200);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const createNewSession = async () => {
    try {
      const response = await apiClient.createChatSession({
        session_name: `ECHO Chat - ${new Date().toLocaleString()}`,
        course_id: selectedCourseId
      });

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
    
    // Scroll to bottom after user message
    setTimeout(() => {
      scrollToBottom();
    }, 100);

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
        
        // Scroll to bottom after assistant message
        setTimeout(() => {
          scrollToBottom();
        }, 100);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const sendMessageWithFiles = async () => {
    if (!inputMessage.trim() && selectedFiles.length === 0) return;
    if (!currentSession) return;

    setIsLoading(true);
    setIsUploading(true);

    try {
      const response = await apiClient.sendChatMessageWithFiles({
        session_id: currentSession.id,
        message: inputMessage || "Please analyze these files",
        course_id: currentSession.course_id,
        files: selectedFiles
      });

      if (response.success) {
        // Add user message with files
        const userMessage: ChatMessage = {
          id: Date.now(),
          session_id: currentSession.id,
          role: 'user',
          content: inputMessage || `Uploaded ${selectedFiles.length} file(s)`,
          timestamp: new Date().toISOString(),
          metadata: {
            files_uploaded: selectedFiles.length,
            file_names: selectedFiles.map(f => f.name)
          }
        };

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: Date.now() + 1,
          session_id: currentSession.id,
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
          metadata: {
            course_content_used: response.course_content_used,
            content_files_count: response.content_files_count,
            files_processed: response.files_processed
          }
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setInputMessage('');
        setSelectedFiles([]);

        // Update session message count
        setSessions(prev => prev.map(s => 
          s.id === currentSession.id 
            ? { ...s, message_count: s.message_count + 2, updated_at: new Date().toISOString() }
            : s
        ));

        // Scroll to bottom after messages
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        toast.error('Failed to send message with files');
      }
    } catch (error) {
      console.error('Error sending message with files:', error);
      toast.error('Failed to send message with files');
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  if (showWelcome) {
    return (
      <ECHOWelcome onStartChat={handleStartChat} />
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">ECHO</h1>
            <p className="text-sm text-gray-500">Educational Context Handler Oracle</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Badge variant="outline" className="text-xs">
            2.5 Flash
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Chat Sessions */}
        <div className={`${showSidebar ? 'block' : 'hidden'} lg:block w-80 border-r border-gray-200 bg-gray-50 flex flex-col`}>
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-3">
              <Select value={selectedCourseId?.toString() || "general"} onValueChange={(value) => setSelectedCourseId(value === "general" ? undefined : parseInt(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select course (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Chat</SelectItem>
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
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentSession?.id === session.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
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
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Messages */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-4 space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to ECHO</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Your intelligent AI learning assistant. Ask me anything about your coursework, 
                      and I'll help you understand and learn more effectively.
                    </p>
                  </div>
                )}
                
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md'
                      } px-4 py-3`}
                    >
                      <div className="flex items-start gap-3">
                        {message.role === 'assistant' && (
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <MessageSquare className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${message.role === 'user' ? 'prose-user' : 'prose-assistant'}`}>
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                // Custom styling for markdown elements
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                strong: ({ children }) => (
                                  <strong className={`font-semibold ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                                    {children}
                                  </strong>
                                ),
                                em: ({ children }) => (
                                  <em className={`italic ${message.role === 'user' ? 'text-gray-100' : 'text-gray-800'}`}>
                                    {children}
                                  </em>
                                ),
                                code: ({ children, className }) => {
                                  const isInline = !className;
                                  if (message.role === 'user') {
                                    return isInline ? (
                                      <code className="bg-white bg-opacity-20 px-1 py-0.5 rounded text-sm font-mono text-white">{children}</code>
                                    ) : (
                                      <code className="block bg-white bg-opacity-20 p-3 rounded-lg text-sm font-mono text-white overflow-x-auto">{children}</code>
                                    );
                                  } else {
                                    return isInline ? (
                                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
                                    ) : (
                                      <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono text-gray-800 overflow-x-auto">{children}</code>
                                    );
                                  }
                                },
                                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                li: ({ children }) => (
                                  <li className={message.role === 'user' ? 'text-white' : 'text-gray-700'}>
                                    {children}
                                  </li>
                                ),
                                h1: ({ children }) => (
                                  <h1 className={`text-lg font-bold mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className={`text-base font-semibold mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className={`text-sm font-semibold mb-1 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                                    {children}
                                  </h3>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className={`border-l-4 pl-4 italic mb-2 ${
                                    message.role === 'user' 
                                      ? 'border-white border-opacity-30 text-gray-100' 
                                      : 'border-blue-200 text-gray-700'
                                  }`}>
                                    {children}
                                  </blockquote>
                                ),
                                table: ({ children }) => (
                                  <div className="overflow-x-auto mb-2">
                                    <table className={`min-w-full border ${
                                      message.role === 'user' 
                                        ? 'border-white border-opacity-30' 
                                        : 'border-gray-200'
                                    }`}>
                                      {children}
                                    </table>
                                  </div>
                                ),
                                th: ({ children }) => (
                                  <th className={`border px-3 py-2 font-semibold text-left ${
                                    message.role === 'user' 
                                      ? 'border-white border-opacity-30 bg-white bg-opacity-10 text-white' 
                                      : 'border-gray-200 bg-gray-50 text-gray-900'
                                  }`}>
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className={`border px-3 py-2 ${
                                    message.role === 'user' 
                                      ? 'border-white border-opacity-30 text-white' 
                                      : 'border-gray-200 text-gray-900'
                                  }`}>
                                    {children}
                                  </td>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
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
                            {message.role === 'user' && message.metadata?.files_uploaded && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                {message.metadata.files_uploaded} file(s) uploaded
                              </Badge>
                            )}
                            {message.role === 'assistant' && message.metadata?.files_processed && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                {message.metadata.files_processed} file(s) processed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600 ml-2">ECHO is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-4xl mx-auto">
              {/* File Upload Area */}
              {selectedFiles.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Selected Files ({selectedFiles.length})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFiles([])}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 truncate max-w-48">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && (selectedFiles.length > 0 ? sendMessageWithFiles() : sendMessage())}
                    placeholder={selectedFiles.length > 0 ? "Ask ECHO about these files..." : "Ask ECHO anything about your coursework..."}
                    disabled={isLoading}
                    className="w-full pr-12 py-3 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={handleImageUpload}
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={selectedFiles.length > 0 ? sendMessageWithFiles : sendMessage}
                  disabled={(!inputMessage.trim() && selectedFiles.length === 0) || isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl"
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* Input Options */}
              <div className="flex items-center gap-2 mt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onClick={handleImageUpload}
                >
                  <Image className="w-3 h-3 mr-1" />
                  Upload Files
                </Button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.md,.py,.js,.html,.css,.json,.csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white px-6 py-2">
        <p className="text-xs text-gray-500 text-center">
          ECHO can make mistakes, so double-check important information
        </p>
      </div>
    </div>
  );
};

export default ChatbotInterface; 