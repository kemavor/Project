import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'react-hot-toast';
import {
  Play,
  StopCircle,
  Eye,
  Edit,
  Settings,
  Video,
  Users,
  Calendar,
  Clock,
  Download,
  CheckCircle,
  Copy,
  Key,
  Trash2
} from 'lucide-react';

import { StreamingArchitectureSelector, StreamingArchitecture } from '../components/StreamingArchitectureSelector';
import { useStreamingArchitecture } from '../hooks/useStreamingArchitecture';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id: number;
}

interface LiveStream {
  id: number;
  title: string;
  description?: string;
  course_id: number;
  instructor_id: number;
  status: string;
  stream_key: string;
  stream_url?: string;
  viewer_count: number;
  max_viewers: number;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  duration: number;
  is_public: boolean;
  is_recording: boolean;
  quality_settings: any;
  created_at: string;
  updated_at: string;
  course?: {
    title: string;
  };
}

const CreateLiveStream = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [myStreams, setMyStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedStreamId, setCopiedStreamId] = useState<number | null>(null);
  const [deletingStreamId, setDeletingStreamId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('create');

  // Add streaming architecture management
  const {
    architecture,
    setArchitecture,
    getArchitectureInfo,
    getStreamingConfig
  } = useStreamingArchitecture('mediasoup');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    scheduled_at: '',
    max_viewers: 100,
    is_public: true,
    is_recording: false,
    quality_settings: {
      resolution: '720p',
      frameRate: 30,
      bitrate: 2500
    }
  });

  useEffect(() => {
    if (user?.role !== 'teacher') {
      toast.error('Only teachers can create live streams');
      navigate('/dashboard');
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [coursesData, streamsData] = await Promise.all([
        apiClient.getMyCourses(),
        apiClient.getLiveStreams({ status: 'all' })
      ]);

      // Set courses (already filtered by instructor_id in the API)
      console.log('Courses data:', coursesData);
      setCourses((coursesData.data as Course[]) || []);

      // Filter streams where user is the instructor
      const myStreamsData = ((streamsData.data as LiveStream[]) || []).filter((stream: LiveStream) => stream.instructor_id === user?.id);
      
      console.log('All streams from API:', streamsData.data);
      console.log('My streams (filtered):', myStreamsData);
      console.log('Current user ID:', user?.id);
      console.log('User object:', user);
      console.log('Stream filtering details:');
      console.log('  - User ID type:', typeof user?.id);
      console.log('  - User ID value:', user?.id);
      console.log('  - Stream instructor_id types:', (streamsData.data as LiveStream[])?.map(s => typeof s.instructor_id));
      console.log('  - Stream instructor_id values:', (streamsData.data as LiveStream[])?.map(s => s.instructor_id));
      
      // Show which streams match and which don't
      (streamsData.data as LiveStream[])?.forEach((stream, index) => {
        const matches = stream.instructor_id === user?.id;
        console.log(`  Stream ${index}: ID=${stream.id}, instructor_id=${stream.instructor_id}, matches=${matches}`);
      });
      setMyStreams(myStreamsData);
      
      // Debug: Log available courses
      console.log('Available courses for teacher:', (coursesData.data as Course[]) || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load courses and streams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQualitySettingChange = (setting: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      quality_settings: {
        ...prev.quality_settings,
        [setting]: value
      }
    }));
  };

  const handleArchitectureSelect = (selectedArchitecture: StreamingArchitecture) => {
    setArchitecture(selectedArchitecture);
    toast.success(`Switched to ${selectedArchitecture === 'mediasoup' ? 'Browser-based' : 'Professional'} streaming`);
  };

  const handleCreateStream = async () => {
    if (user?.role !== 'teacher') {
      toast.error('Only teachers can create live streams');
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.course_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate course_id is a valid number
    const courseId = parseInt(formData.course_id);
    if (isNaN(courseId)) {
      toast.error('Please select a valid course');
      return;
    }

    // Validate that the course exists and belongs to the teacher
    const selectedCourse = courses.find(course => course.id === courseId);
    if (!selectedCourse) {
      toast.error('Selected course not found. Please refresh and try again.');
      return;
    }

    if (selectedCourse.instructor_id !== user?.id) {
      toast.error('You can only create streams for your own courses');
      return;
    }

    // Check if teacher has any courses
    if (courses.length === 0) {
      toast.error('You need to create a course first before creating live streams');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get streaming configuration based on selected architecture
      const streamingConfig = getStreamingConfig();
      const architectureInfo = getArchitectureInfo();

      // Format data according to backend schema
      const streamData: any = {
        title: formData.title,
        course_id: courseId, // Use the validated integer
        max_viewers: parseInt(formData.max_viewers.toString()),
        is_public: formData.is_public,
        is_recording: formData.is_recording,
        quality_settings: {
          resolution: formData.quality_settings.resolution,
          frameRate: parseInt(formData.quality_settings.frameRate.toString()),
          bitrate: parseInt(formData.quality_settings.bitrate.toString()),
          architecture: architecture
        }
      };

      // Only add optional fields if they have values
      if (formData.description && formData.description.trim()) {
        streamData.description = formData.description;
      }

      if (formData.scheduled_at) {
        streamData.scheduled_at = new Date(formData.scheduled_at).toISOString();
      }

      console.log('User:', user);
      console.log('Selected course:', selectedCourse);
      console.log('Available courses:', courses);
      console.log('Sending stream data:', streamData);

      const response = await apiClient.createLiveStream(streamData);
      
      if (!response.error) {
        toast.success('Live stream created successfully! Check the "Manage Streams" tab for your stream key.');
        
        // Show architecture-specific instructions
        if (architecture === 'mediasoup') {
          toast.success('Ready to start browser-based streaming!');
        } else {
          toast.success('Configure OBS Studio with the stream key from the "Manage Streams" tab!');
        }
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          course_id: '',
          scheduled_at: '',
          max_viewers: 100,
          is_public: true,
          is_recording: false,
          quality_settings: {
            resolution: '720p',
            frameRate: 30,
            bitrate: 2500
          }
        });
        
        loadData(); // Refresh streams list
        
        // Switch to manage tab to show the new stream
        setActiveTab('manage');
        
        // Log success for debugging
        console.log('✅ Livestream created successfully:', response);
      } else {
        console.error('API Error:', response.error);
        toast.error(`Failed to create live stream: ${response.error}`);
      }
    } catch (error: any) {
      console.error('Error creating stream:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      
      toast.error(`Failed to create live stream: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartStream = async (streamId: number) => {
    try {
      await apiClient.startLiveStream(streamId, formData.quality_settings);
      toast.success('Stream started successfully!');
      loadData();
    } catch (error) {
      console.error('Error starting stream:', error);
      toast.error('Failed to start live stream. Please try again.');
    }
  };

  const handleStopStream = async (streamId: number) => {
    console.log('🛑 Stop button clicked for stream:', streamId);
    console.log('👤 Current user:', user);
    console.log('🔑 Token available:', !!localStorage.getItem('access_token'));
    
    try {
      console.log('🛑 Attempting to stop stream:', streamId);
      const response = await apiClient.stopLiveStream(streamId);
      
      // Check if the response has an error
      if (response.error) {
        console.error('❌ API returned error:', response.error);
        toast.error(response.error);
        return;
      }
      
      console.log('✅ Stream stopped successfully');
      toast.success('Stream stopped successfully!');
      loadData();
    } catch (error: any) {
      console.error('❌ Error stopping stream:', error);
      console.error('📋 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Provide more specific error messages
      if (error.response?.status === 403) {
        toast.error('You can only stop your own streams');
      } else if (error.response?.status === 404) {
        toast.error('Stream not found');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.detail || 'Stream cannot be stopped in its current state';
        toast.error(errorMessage);
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error('Failed to stop live stream. Please try again.');
      }
    }
  };

  const handleEditStream = (stream: LiveStream) => {
    // Navigate to edit page or open edit modal
    navigate(`/livestream/edit/${stream.id}`);
  };

  const handleViewStream = (stream: LiveStream) => {
    navigate(`/livestream/${stream.id}`);
  };

  const handleCopyStreamKey = async (streamKey: string, streamId: number) => {
    try {
      await navigator.clipboard.writeText(streamKey);
      setCopiedStreamId(streamId);
      toast.success('Stream key copied to clipboard!');
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedStreamId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy stream key:', error);
      toast.error('Failed to copy stream key');
    }
  };

  const handleDeleteStream = async (streamId: number, event?: React.MouseEvent) => {
    // Prevent any default form submission
    event?.preventDefault();
    event?.stopPropagation();
    
    console.log('🗑️  Delete button clicked for stream:', streamId);
    console.log('📋 Event details:', event);
    console.log('👤 Current user:', user);
    console.log('🔑 Token available:', !!localStorage.getItem('access_token'));
    
    // Check if user is authenticated
    if (!user) {
      toast.error('Please login to delete streams');
      return;
    }

    // Check if user is a teacher
    if (user.role !== 'teacher') {
      toast.error('Only teachers can delete streams');
      return;
    }

    console.log('✅ User checks passed, showing confirmation dialog');
    setShowDeleteConfirm(streamId);
  };

  const confirmDelete = async (streamId: number) => {
    console.log('✅ Confirm delete called for stream:', streamId);
    setShowDeleteConfirm(null);
    
    try {
      setDeletingStreamId(streamId);
      console.log('🗑️  Attempting to delete stream:', streamId);
      console.log('👤 User:', user);
      console.log('🔑 Token available:', !!localStorage.getItem('access_token'));
      
      await apiClient.deleteLiveStream(streamId);
      console.log('✅ Stream deleted successfully');
      toast.success('Live stream deleted successfully!');
      loadData();
    } catch (error: any) {
      console.error('❌ Error deleting stream:', error);
      console.error('📋 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Provide more specific error messages
      if (error.response?.status === 403) {
        toast.error('You can only delete your own streams');
      } else if (error.response?.status === 404) {
        toast.error('Stream not found');
      } else if (error.response?.status === 400) {
        toast.error('Cannot delete a live stream. Stop it first.');
      } else {
        toast.error('Failed to delete live stream. Please try again.');
      }
    } finally {
      setDeletingStreamId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 text-white">Live</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500 text-white">Scheduled</Badge>;
      case 'ended':
        return <Badge className="bg-gray-500 text-white">Ended</Badge>;
      case 'cancelled':
        return <Badge className="bg-yellow-500 text-white">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Live Stream</h1>
              <p className="text-gray-600 mt-2">Set up a new live streaming session for your students</p>
            </div>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>

          {/* Architecture Selection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Streaming Method
              </CardTitle>
              <CardDescription>
                Choose how you want to stream your lecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StreamingArchitectureSelector
                onSelect={handleArchitectureSelect}
                selectedArchitecture={architecture}
              />
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Create New Stream
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'manage'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manage Streams
            </button>
          </div>

          {activeTab === 'create' ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Stream Creation Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Stream Details</CardTitle>
                  <CardDescription>
                    Configure your live stream settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Stream Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter stream title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="course">Course *</Label>
                      <div className="text-xs text-gray-500 mb-1">
                        {courses.length} course{courses.length !== 1 ? 's' : ''} available
                      </div>
                      <Select
                        value={formData.course_id}
                        onValueChange={(value) => handleInputChange('course_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.length === 0 ? (
                            <SelectItem value="no-courses" disabled>
                              No courses available
                            </SelectItem>
                          ) : (
                            courses.map((course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduled_at">Scheduled Time</Label>
                      <Input
                        id="scheduled_at"
                        type="datetime-local"
                        value={formData.scheduled_at}
                        onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_viewers">Max Viewers</Label>
                      <Input
                        id="max_viewers"
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.max_viewers}
                        onChange={(e) => handleInputChange('max_viewers', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter stream description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="resolution">Resolution</Label>
                      <Select
                        value={formData.quality_settings.resolution}
                        onValueChange={(value) => handleQualitySettingChange('resolution', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="480p">480p</SelectItem>
                          <SelectItem value="720p">720p</SelectItem>
                          <SelectItem value="1080p">1080p</SelectItem>
                          <SelectItem value="4K">4K</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="frameRate">Frame Rate</Label>
                      <Select
                        value={formData.quality_settings.frameRate.toString()}
                        onValueChange={(value) => handleQualitySettingChange('frameRate', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">24 fps</SelectItem>
                          <SelectItem value="30">30 fps</SelectItem>
                          <SelectItem value="60">60 fps</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bitrate">Bitrate (kbps)</Label>
                      <Input
                        id="bitrate"
                        type="number"
                        min="500"
                        max="15000"
                        step="500"
                        value={formData.quality_settings.bitrate}
                        onChange={(e) => handleQualitySettingChange('bitrate', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_public"
                        checked={formData.is_public}
                        onCheckedChange={(checked) => handleInputChange('is_public', checked)}
                      />
                      <Label htmlFor="is_public">Public Stream</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_recording"
                        checked={formData.is_recording}
                        onCheckedChange={(checked) => handleInputChange('is_recording', checked)}
                      />
                      <Label htmlFor="is_recording">Record Stream</Label>
                    </div>
                  </div>

                  {/* Architecture-specific settings */}
                  {architecture === 'rtmp' && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">OBS Studio Configuration</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Server URL:</span>
                          <code className="bg-blue-100 px-2 py-1 rounded">rtmp://localhost:1935/live</code>
                        </div>
                        <div className="flex justify-between">
                          <span>Stream Key:</span>
                          <code className="bg-blue-100 px-2 py-1 rounded">your-stream-id</code>
                        </div>
                        <div className="flex justify-between">
                          <span>Video Bitrate:</span>
                          <span>5000 Kbps</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Audio Bitrate:</span>
                          <span>128 Kbps</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleCreateStream}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating Stream...
                        </div>
                      ) : (
                        'Create Live Stream'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Architecture Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Setup Instructions</CardTitle>
                  <CardDescription>
                    Follow these steps to start streaming
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">{getArchitectureInfo().title}</h4>
                      <p className="text-sm text-gray-600 mb-4">{getArchitectureInfo().description}</p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Setup Steps:</h5>
                      <ol className="space-y-2 text-sm">
                        {getArchitectureInfo().setupInstructions.map((step, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Requirements:</h5>
                      <ul className="space-y-1 text-sm">
                        {getArchitectureInfo().requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {architecture === 'rtmp' && (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h5 className="font-medium text-yellow-900 mb-2">Need OBS Studio?</h5>
                        <p className="text-sm text-yellow-800 mb-3">
                          Download the free OBS Studio software to start professional broadcasting.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open('https://obsproject.com/', '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download OBS Studio
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  My Live Streams
                </CardTitle>
                <CardDescription>
                  Each stream has a unique key for OBS Studio configuration. Click "Copy" to copy the stream key to your clipboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myStreams.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No live streams created yet</p>
                    <p className="text-sm text-gray-500">Create your first stream to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {myStreams.map((stream) => (
                      <Card key={stream.id} className="p-6 relative">
                        <div className="flex items-start justify-between">
                          {/* Left Side - Stream Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <h3 className="font-semibold text-xl">{stream.title}</h3>
                              {getStatusBadge(stream.status)}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{stream.viewer_count}/{stream.max_viewers} viewers</span>
                              </div>
                              
                              {stream.scheduled_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDateTime(stream.scheduled_at)}</span>
                                </div>
                              )}
                              
                              {stream.started_at && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{stream.duration}s</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <Video className="w-4 h-4" />
                                <span>{stream.quality_settings?.resolution || '720p'}</span>
                              </div>
                            </div>
                            
                            {stream.description && (
                              <p className="text-gray-600 mb-4">{stream.description}</p>
                            )}
                            
                            {/* Stream Key Section */}
                            <div className="bg-gray-50 rounded-lg p-4 border">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Key className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">OBS Configuration</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopyStreamKey(stream.stream_key, stream.id)}
                                  className={`flex items-center gap-1 ${
                                    copiedStreamId === stream.id ? 'bg-green-50 border-green-200 text-green-700' : ''
                                  }`}
                                  disabled={copiedStreamId === stream.id}
                                >
                                  {copiedStreamId === stream.id ? (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      Copy Key
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Server URL:</div>
                                  <div className="text-sm font-mono bg-white px-3 py-2 rounded border text-gray-700">
                                    rtmp://localhost:1935/live
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Stream Key:</div>
                                  <div className="text-sm font-mono bg-white px-3 py-2 rounded border text-gray-700 break-all">
                                    {stream.stream_key}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Side - Action Buttons */}
                          <div className="ml-6 flex flex-col gap-2 min-w-[120px]">
                            {/* Stream Control */}
                            {stream.status === 'scheduled' && (
                              <Button
                                onClick={() => handleStartStream(stream.id)}
                                className="flex items-center gap-2 w-full"
                              >
                                <Play className="w-4 h-4" />
                                Start Stream
                              </Button>
                            )}
                            
                            {(stream.status === 'live' || stream.status === 'scheduled' || stream.status === 'paused') && (
                              <Button
                                variant="destructive"
                                onClick={() => handleStopStream(stream.id)}
                                className="flex items-center gap-2 w-full"
                              >
                                <StopCircle className="w-4 h-4" />
                                {stream.status === 'live' ? 'Stop Stream' : 'End Stream'}
                              </Button>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewStream(stream)}
                                className="flex-1"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditStream(stream)}
                                className="flex-1"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  console.log('🔘 Delete button clicked!');
                                  console.log('📋 Button event:', e);
                                  console.log('🎯 Stream ID:', stream.id);
                                  handleDeleteStream(stream.id, e);
                                }}
                                className="flex-1"
                                disabled={deletingStreamId === stream.id}
                                type="button"
                              >
                                {deletingStreamId === stream.id ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Deleting...
                                  </div>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            
                            {/* Delete Confirmation Dialog */}
                            {showDeleteConfirm === stream.id && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
                                <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm mx-4">
                                  <h3 className="text-lg font-semibold mb-2">Delete Stream</h3>
                                  <p className="text-gray-600 mb-4">
                                    Are you sure you want to delete "{stream.title}"? This action cannot be undone.
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowDeleteConfirm(null);
                                      }}
                                      className="flex-1"
                                      type="button"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        confirmDelete(stream.id);
                                      }}
                                      className="flex-1"
                                      type="button"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                            </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreateLiveStream; 