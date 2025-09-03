import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, LiveStream, Course } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import {
  Video,
  Copy,
  CheckCircle,
  Play,
  StopCircle,
  Eye,
  Trash2,
  Monitor,
  Server,
  AlertCircle,
  Info,
  Download,
  Radio,
  Settings
} from 'lucide-react';

const CreateLiveStream: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // State management
  const [courses, setCourses] = useState<Course[]>([]);
  const [myStreams, setMyStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingStream, setIsCreatingStream] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    scheduled_at: '',
    max_viewers: 100,
    is_public: true,
    is_recording: false,
  });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'teacher') {
      navigate('/dashboard');
      toast.error('Only teachers can create live streams');
      return;
    }

    fetchCourses();
    fetchMyStreams();
  }, [isAuthenticated, user, navigate]);

  const fetchCourses = async () => {
    try {
      console.log('🔍 Fetching courses...');
      const response = await apiClient.getMyCourses();
      console.log('📚 Courses response:', response);
      if (response.error) {
        console.error('❌ Course fetch error:', response.error);
        toast.error(response.error);
      } else {
        console.log('✅ Courses loaded:', response.data);
        setCourses(response.data || []);
      }
    } catch (error) {
      console.error('❌ Course fetch exception:', error);
      toast.error('Failed to fetch courses');
    }
  };

  const fetchMyStreams = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getMyLiveStreams();
      if (response.error) {
        toast.error(response.error);
      } else {
        setMyStreams(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch streams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Stream title is required');
      return;
    }

    if (!formData.course_id) {
      toast.error('Please select a course');
      return;
    }

    setIsCreatingStream(true);
    try {
      const streamData = {
        ...formData,
        course_id: parseInt(formData.course_id),
        scheduled_at: formData.scheduled_at || undefined,
      };

      const response = await apiClient.createLiveStream(streamData);
      
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Live stream created successfully!');
        setFormData({
          title: '',
          description: '',
          course_id: '',
          scheduled_at: '',
          max_viewers: 100,
          is_public: true,
          is_recording: false,
        });
        fetchMyStreams();
      }
    } catch (error) {
      toast.error('Failed to create stream');
    } finally {
      setIsCreatingStream(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const handleStartStream = async (streamId: number) => {
    try {
      const response = await apiClient.startLiveStream(streamId);
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Stream started successfully!');
        fetchMyStreams();
      }
    } catch (error) {
      toast.error('Failed to start stream');
    }
  };

  const handleStopStream = async (streamId: number) => {
    try {
      const response = await apiClient.stopLiveStream(streamId);
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Stream stopped successfully!');
        fetchMyStreams();
      }
    } catch (error) {
      toast.error('Failed to stop stream');
    }
  };

  const handleDeleteStream = async (streamId: number) => {
    if (!confirm('Are you sure you want to delete this stream?')) {
      return;
    }

    try {
      const response = await apiClient.deleteLiveStream(streamId);
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Stream deleted successfully!');
        fetchMyStreams();
      }
    } catch (error) {
      toast.error('Failed to delete stream');
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isAuthenticated || user?.role !== 'teacher') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RTMP Live Streaming</h1>
          <p className="text-gray-600 font-medium">
            Create and manage your live streams using OBS Studio with RTMP-to-HLS architecture
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create Stream Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Video className="w-5 h-5 mr-2" />
                  Create New Stream
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStream} className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-gray-700 font-medium">Stream Title *</Label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter stream title"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your stream"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="course" className="text-gray-700 font-medium">Course *</Label>
                    <Select
                      value={formData.course_id}
                      onValueChange={(value) => handleInputChange('course_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="scheduled_at" className="text-black font-medium">Scheduled Time (Optional)</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={formData.scheduled_at}
                      onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max_viewers" className="text-black font-medium">Max Viewers</Label>
                    <Input
                      id="max_viewers"
                      type="number"
                      value={formData.max_viewers}
                      onChange={(e) => handleInputChange('max_viewers', parseInt(e.target.value))}
                      min="1"
                      max="1000"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_public"
                      checked={formData.is_public}
                      onCheckedChange={(checked) => handleInputChange('is_public', checked)}
                    />
                    <Label htmlFor="is_public" className="text-black font-medium">Public Stream</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_recording"
                      checked={formData.is_recording}
                      onCheckedChange={(checked) => handleInputChange('is_recording', checked)}
                    />
                    <Label htmlFor="is_recording" className="text-black font-medium">Record to S3</Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isCreatingStream}
                  >
                    {isCreatingStream ? 'Creating...' : 'Create Stream'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* OBS Setup Instructions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center text-black">
                  <Settings className="w-5 h-5 mr-2" />
                  OBS Studio Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-black">1. Download OBS Studio</h4>
                    <p className="text-black">Get it from obsproject.com</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-black">2. Configure Stream Settings</h4>
                    <p className="text-black">Go to Settings → Stream → Custom</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-black">3. Use RTMP Details</h4>
                    <p className="text-black">Copy server URL and stream key from your streams below</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-black">4. Start Streaming</h4>
                    <p className="text-black">Click "Start Streaming" in OBS after setup</p>
                  </div>
                </div>
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Streams are automatically converted to HLS format for web playback with low latency.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* My Streams */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900">
                  <span className="flex items-center">
                    <Monitor className="w-5 h-5 mr-2" />
                    My Live Streams
                  </span>
                  <Badge variant="outline">
                    {myStreams.length} streams
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 font-medium">Loading streams...</p>
                  </div>
                ) : myStreams.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No streams created yet. Create your first stream!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myStreams.map((stream) => (
                      <div key={stream.id} className="border rounded-lg p-4 space-y-3">
                        {/* Stream Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">{stream.title}</h3>
                            {stream.description && (
                              <p className="text-gray-600 text-sm mt-1">{stream.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                              <span>Course: {stream.course?.title}</span>
                              <Badge className={getStatusColor(stream.status)}>
                                {stream.status.toUpperCase()}
                              </Badge>
                              <span className="flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                {stream.viewer_count} viewers
                              </span>
                            </div>
                          </div>
                          
                          {/* Stream Controls */}
                          <div className="flex items-center gap-2">
                            {stream.status === 'scheduled' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/stream/${stream.id}`)}
                                  className="border-gray-300"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Preview
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleStartStream(stream.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Start
                                </Button>
                              </>
                            )}
                            
                            {stream.status === 'live' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/stream/${stream.id}`)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Stream
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleStopStream(stream.id)}
                                >
                                  <StopCircle className="w-4 h-4 mr-1" />
                                  Stop
                                </Button>
                              </>
                            )}

                            {stream.status === 'ended' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/stream/${stream.id}`)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Recording
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteStream(stream.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* RTMP Configuration */}
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <h4 className="font-medium text-sm flex items-center text-gray-800">
                            <Server className="w-4 h-4 mr-2" />
                            RTMP Configuration for OBS
                          </h4>
                          
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs font-medium text-gray-700">Server URL:</label>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-white px-2 py-1 rounded border flex-1 text-gray-900">
                                  rtmp://localhost:1936/live
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard('rtmp://localhost:1936/live', 'Server URL')}
                                  className="px-2"
                                >
                                  {copiedText === 'Server URL' ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-gray-700">Stream Key:</label>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-white px-2 py-1 rounded border flex-1 font-mono text-gray-900">
                                  {stream.rtmp_key}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(stream.rtmp_key, 'Stream Key')}
                                  className="px-2"
                                >
                                  {copiedText === 'Stream Key' ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-700">HLS Playback URL:</label>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-white px-2 py-1 rounded border flex-1 text-gray-900">
                                  {stream.hls_url}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(stream.hls_url, 'HLS URL')}
                                  className="px-2"
                                >
                                  {copiedText === 'HLS URL' ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stream Info */}
                        <div className="text-xs text-black flex justify-between">
                          <span>Created: {formatDateTime(stream.created_at)}</span>
                          {stream.started_at && (
                            <span>Started: {formatDateTime(stream.started_at)}</span>
                          )}
                          {stream.ended_at && (
                            <span>Ended: {formatDateTime(stream.ended_at)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLiveStream;