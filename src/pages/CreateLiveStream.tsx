import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  Video,
  Calendar,
  Users,
  Settings,
  Play,
  StopCircle,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create');

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
      setCourses((coursesData.data as Course[]) || []);

      // Filter streams where user is the instructor
      const myStreamsData = ((streamsData.data as LiveStream[]) || []).filter((stream: LiveStream) => stream.instructor_id === user?.id);
      setMyStreams(myStreamsData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.course_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const streamData = {
        ...formData,
        course_id: parseInt(formData.course_id),
        max_viewers: parseInt(formData.max_viewers.toString()),
        scheduled_at: formData.scheduled_at || undefined
      };

      const newStream = await apiClient.createLiveStream(streamData);
      toast.success('Live stream created successfully!');
      
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

      // Refresh streams list
      loadData();
      
      // Switch to manage tab
      setActiveTab('manage');
    } catch (error) {
      console.error('Error creating stream:', error);
      toast.error('Failed to create live stream. Please try again.');
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
    try {
      await apiClient.stopLiveStream(streamId);
      toast.success('Stream stopped successfully!');
      loadData();
    } catch (error) {
      console.error('Error stopping stream:', error);
      toast.error('Failed to stop live stream. Please try again.');
    }
  };

  const handleEditStream = (stream: LiveStream) => {
    // Navigate to edit page or open edit modal
    navigate(`/livestream/edit/${stream.id}`);
  };

  const handleViewStream = (stream: LiveStream) => {
    navigate(`/livestream/${stream.id}`);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Stream Management</h1>
          <p className="text-gray-600">Create and manage your live streaming sessions</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Create Stream
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Manage Streams
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Create New Live Stream
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
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

                  <div className="flex justify-end">
                    <Button type="submit" className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Create Stream
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  My Live Streams
                </CardTitle>
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
                      <Card key={stream.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{stream.title}</h3>
                              {getStatusBadge(stream.status)}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
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
                              <p className="text-gray-600 mt-2">{stream.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {stream.status === 'scheduled' && (
                              <Button
                                size="sm"
                                onClick={() => handleStartStream(stream.id)}
                                className="flex items-center gap-1"
                              >
                                <Play className="w-4 h-4" />
                                Start
                              </Button>
                            )}
                            
                            {stream.status === 'live' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleStopStream(stream.id)}
                                className="flex items-center gap-1"
                              >
                                <StopCircle className="w-4 h-4" />
                                Stop
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewStream(stream)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStream(stream)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CreateLiveStream; 