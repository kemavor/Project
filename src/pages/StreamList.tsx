import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
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
  Bookmark
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { toast } from 'react-hot-toast';
import { StreamSearch, SearchUtils } from '../lib/searchUtils';
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

const StreamList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [activeStreams, setActiveStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [refreshing, setRefreshing] = useState(false);

  // Debounced search suggestions
  const debouncedSearchSuggestions = useMemo(
    () => SearchUtils.debounce((query: string) => {
      if (query.length >= 2) {
        const suggestions = SearchUtils.getSuggestions(streams, query, 5);
        setSearchSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300),
    [streams]
  );

  // Update suggestions when search term changes
  useEffect(() => {
    debouncedSearchSuggestions(searchTerm);
  }, [searchTerm, debouncedSearchSuggestions]);

  // Efficient filtered and sorted streams using memoization
  const filteredStreams = useMemo(() => {
    let filtered = streams;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(stream => stream.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = StreamSearch.searchStreams(filtered, searchTerm, {
        fuzzy: true,
        threshold: 0.7,
        sortBy: 'relevance'
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
        case 'popular':
          return (b.viewer_count || 0) - (a.viewer_count || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'instructor':
          return (a.instructor?.first_name || '').localeCompare(b.instructor?.first_name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [streams, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all streams
      const streamsResponse = await apiClient.getLiveStreams();
      if (streamsResponse.error) {
        setError(streamsResponse.error);
        return;
      }
      
      const streamsData = (streamsResponse.data as StreamData[]) || [];
      setStreams(streamsData);

      // Fetch active streams separately for real-time updates
      const activeResponse = await apiClient.getActiveLiveStreams();
      if (!activeResponse.error) {
        const activeData = (activeResponse.data as StreamData[]) || [];
        setActiveStreams(activeData);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
      setError('Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  const refreshStreams = async () => {
    setRefreshing(true);
    await fetchStreams();
    setRefreshing(false);
    toast.success('Streams refreshed!');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  const handleJoinStream = (streamId: number) => {
    navigate(`/livestream/${streamId}`);
  };

  const handleCreateStream = () => {
    navigate('/livestream/create');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 0) {
      return 'Started';
    } else if (diffInHours < 24) {
      return `In ${diffInHours}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            LIVE
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'ended':
        return (
          <Badge variant="outline">
            <X className="w-3 h-3 mr-1" />
            Ended
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <X className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStreamCard = (stream: StreamData) => (
    <Card key={stream.id} className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {stream.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {stream.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {getStatusBadge(stream.status)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Stream Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              {stream.instructor && (
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {stream.instructor.first_name} {stream.instructor.last_name}
                </div>
              )}
              {stream.course && (
                <div className="flex items-center">
                  <Bookmark className="w-4 h-4 mr-1" />
                  {stream.course.title}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {stream.viewer_count || 0} viewers
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(stream.scheduled_at)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {stream.status === 'live' ? (
              <Button 
                onClick={() => handleJoinStream(stream.id)}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Join Live Stream
              </Button>
            ) : stream.status === 'scheduled' ? (
              <Button 
                onClick={() => handleJoinStream(stream.id)}
                variant="outline"
                className="flex-1"
              >
                <Clock className="w-4 h-4 mr-2" />
                Join When Live
              </Button>
            ) : (
              <Button 
                variant="outline" 
                disabled
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Stream Ended
              </Button>
            )}
            
            <Button variant="ghost" size="sm">
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading streams...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Streams</h1>
            <p className="text-gray-600 mt-2">Discover and join live educational streams</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={refreshStreams}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {user?.role === 'teacher' && (
              <Button onClick={handleCreateStream}>
                <Plus className="w-4 h-4 mr-2" />
                Create Stream
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search streams, instructors, or courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </form>
            
            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Streams</option>
                <option value="live">Live Now</option>
                <option value="scheduled">Scheduled</option>
                <option value="ended">Ended</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="title">Title A-Z</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-500">
              {filteredStreams.length} stream{filteredStreams.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <X className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Active Streams Section */}
        {activeStreams.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              Live Now ({activeStreams.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeStreams.map(stream => getStreamCard(stream))}
            </div>
          </div>
        )}

        {/* All Streams Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {activeStreams.length > 0 ? 'All Streams' : 'Available Streams'}
          </h2>
          
          {filteredStreams.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No streams found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No streams are currently available'
                }
              </p>
              {user?.role === 'teacher' && (
                <Button onClick={handleCreateStream}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Stream
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStreams.map(stream => getStreamCard(stream))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StreamList; 