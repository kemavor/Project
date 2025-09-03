import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Search, 
  Filter,
  Play, 
  Users, 
  Clock, 
  Calendar,
  Video,
  Eye,
  Plus,
  X,
  RefreshCw,
  Star,
  TrendingUp,
  Bookmark,
  Radio,
  Wifi,
  WifiOff
} from 'lucide-react';
import { apiClient } from '../lib/api';
import Navbar from '../components/Navbar';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface StreamData {
  id: number;
  title: string;
  description: string;
  instructor_id: number;
  scheduled_at: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  max_viewers: number;
  current_viewers: number;
  viewer_count: number;
  rtmp_key?: string;
  hls_url?: string;
  is_public: boolean;
  instructor?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  course?: {
    id: number;
    title: string;
  };
}

interface LiveStreamStatus {
  streamKey: string;
  id: string;
  startTime: string;
  viewers: number;
  hlsReady: boolean;
  hlsUrl: string;
}

const StreamList: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [liveStreamStatus, setLiveStreamStatus] = useState<Map<string, LiveStreamStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'viewers' | 'alphabetical'>('recent');

  // Fetch streams from database
  const fetchStreams = async () => {
    try {
      const response = await apiClient.getAllLiveStreams();
      if (response.error) {
        toast.error(response.error);
        return;
      }
      setStreams(response.data || []);
    } catch (error) {
      toast.error('Failed to load streams');
      console.error('Error fetching streams:', error);
    }
  };

  // Fetch live stream status from RTMP server
  const fetchLiveStatus = async () => {
    try {
      const response = await fetch('http://localhost:8081/streams');
      const data = await response.json();
      
      const statusMap = new Map<string, LiveStreamStatus>();
      data.activeStreams.forEach((stream: LiveStreamStatus) => {
        statusMap.set(stream.streamKey, stream);
      });
      setLiveStreamStatus(statusMap);
    } catch (error) {
      console.error('Failed to fetch live stream status:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStreams(), fetchLiveStatus()]);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Poll for live status updates
  useEffect(() => {
    const interval = setInterval(fetchLiveStatus, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Get stream with live status
  const getStreamWithLiveStatus = (stream: StreamData) => {
    const liveStatus = stream.rtmp_key ? liveStreamStatus.get(stream.rtmp_key) : null;
    return {
      ...stream,
      isActuallyLive: !!liveStatus?.hlsReady,
      liveViewers: liveStatus?.viewers || 0,
      liveStatus: liveStatus
    };
  };

  // Filter and sort streams
  const filteredAndSortedStreams = useMemo(() => {
    let filtered = streams.filter(stream => {
      const matchesSearch = stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           stream.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (stream.instructor?.first_name + ' ' + stream.instructor?.last_name).toLowerCase().includes(searchTerm.toLowerCase());
      
      const streamWithStatus = getStreamWithLiveStatus(stream);
      
      if (statusFilter === 'live') {
        return matchesSearch && streamWithStatus.isActuallyLive;
      } else if (statusFilter === 'scheduled') {
        return matchesSearch && stream.status === 'scheduled' && !streamWithStatus.isActuallyLive;
      } else if (statusFilter === 'ended') {
        return matchesSearch && stream.status === 'ended';
      }
      
      return matchesSearch;
    });

    // Sort streams
    filtered.sort((a, b) => {
      const aWithStatus = getStreamWithLiveStatus(a);
      const bWithStatus = getStreamWithLiveStatus(b);
      
      // Always prioritize live streams
      if (aWithStatus.isActuallyLive && !bWithStatus.isActuallyLive) return -1;
      if (!aWithStatus.isActuallyLive && bWithStatus.isActuallyLive) return 1;
      
      switch (sortBy) {
        case 'viewers':
          return (bWithStatus.liveViewers || 0) - (aWithStatus.liveViewers || 0);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
      }
    });

    return filtered;
  }, [streams, liveStreamStatus, searchTerm, statusFilter, sortBy]);

  const handleJoinStream = (streamId: number) => {
    navigate(`/stream/${streamId}`);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusBadge = (stream: StreamData) => {
    const streamWithStatus = getStreamWithLiveStatus(stream);
    
    if (streamWithStatus.isActuallyLive) {
      return (
        <Badge className="bg-red-500 text-white flex items-center">
          <Radio className="w-3 h-3 mr-1" />
          LIVE
        </Badge>
      );
    }
    
    switch (stream.status) {
      case 'scheduled':
        return <Badge className="bg-yellow-500 text-white">Scheduled</Badge>;
      case 'ended':
        return <Badge className="bg-gray-500 text-white">Ended</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-700 text-white">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Please log in to view live streams.</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Streams</h1>
              <p className="text-gray-600">Join live lectures and educational content</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  fetchStreams();
                  fetchLiveStatus();
                }}
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              {user?.role === 'teacher' && (
                <Button onClick={() => navigate('/livestream/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Stream
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search streams, instructors, or courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="live">Live Now</option>
                <option value="scheduled">Scheduled</option>
                <option value="ended">Ended</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="viewers">Most Viewers</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Radio className="w-8 h-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm font-bold text-gray-600">Live Streams</p>
                    <p className="text-2xl font-bold text-black">
                      {streams.filter(s => getStreamWithLiveStatus(s).isActuallyLive).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-bold text-gray-600">Total Viewers</p>
                    <p className="text-2xl font-bold text-black">
                      {Array.from(liveStreamStatus.values()).reduce((sum, status) => sum + status.viewers, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-bold text-gray-600">Scheduled</p>
                    <p className="text-2xl font-bold text-black">
                      {streams.filter(s => s.status === 'scheduled' && !getStreamWithLiveStatus(s).isActuallyLive).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stream List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading streams...</p>
            </div>
          </div>
        ) : filteredAndSortedStreams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No streams found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No streams are currently available'
                }
              </p>
              {user?.role === 'teacher' && (
                <Button onClick={() => navigate('/livestream/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Stream
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedStreams.map((stream) => {
              const streamWithStatus = getStreamWithLiveStatus(stream);
              return (
                <Card key={stream.id} className={`hover:shadow-lg transition-shadow ${streamWithStatus.isActuallyLive ? 'ring-2 ring-red-500' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate">
                          {stream.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {stream.instructor?.first_name} {stream.instructor?.last_name}
                          {stream.course && (
                            <span className="text-blue-600 ml-2">• {stream.course.title}</span>
                          )}
                        </CardDescription>
                      </div>
                      {getStatusBadge(stream)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {stream.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {stream.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDateTime(stream.scheduled_at)}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{streamWithStatus.liveViewers}</span>
                        </div>
                        <div className="flex items-center">
                          {streamWithStatus.isActuallyLive ? (
                            <Wifi className="w-4 h-4 text-green-500 mr-1" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-gray-400 mr-1" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {stream.is_public ? (
                          <Badge variant="outline" className="text-xs">Public</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Private</Badge>
                        )}
                      </div>
                      
                      <Button 
                        size="sm"
                        onClick={() => handleJoinStream(stream.id)}
                        disabled={stream.status === 'cancelled'}
                        className={streamWithStatus.isActuallyLive ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        {streamWithStatus.isActuallyLive ? 'Join Live' : 'View'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamList;