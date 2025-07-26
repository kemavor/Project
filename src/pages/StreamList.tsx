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
  X
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

  // Efficient filtered streams using memoization
  const filteredStreams = useMemo(() => {
    if (!searchTerm.trim()) return streams;
    
    return StreamSearch.searchStreams(streams, searchTerm, {
      fuzzy: true,
      threshold: 0.7,
      sortBy: 'relevance'
    });
  }, [streams, searchTerm]);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        setLoading(true);
        
        // Fetch all streams
        const streamsResponse = await apiClient.getLiveStreams();
        if (streamsResponse.error) {
          setError(streamsResponse.error);
          return;
        }
        
        const streamsData = (streamsResponse.data as StreamData[]) || [];
        setStreams(streamsData);

        // Fetch active streams
        const activeStreamsResponse = await apiClient.getActiveLiveStreams();
        if (!activeStreamsResponse.error) {
          const activeData = (activeStreamsResponse.data as StreamData[]) || [];
          setActiveStreams(activeData);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch streams');
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
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
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: 'secondary' as const, text: 'Scheduled' },
      live: { variant: 'default' as const, text: 'Live' },
      ended: { variant: 'destructive' as const, text: 'Ended' },
      cancelled: { variant: 'outline' as const, text: 'Cancelled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading live streams...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Live Streams</h1>
            <p className="text-muted-foreground">Join live lectures and interactive sessions</p>
          </div>
          {user?.role === 'teacher' && (
            <Button onClick={handleCreateStream} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Stream
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Streams
            </CardTitle>
            <CardDescription>
              Find streams by title, description, or instructor name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search streams by title, description, or instructor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {searchTerm && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={clearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button type="submit" onClick={handleSearch}>
                  Search
                </Button>
              </div>

              {/* Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Search className="inline h-3 w-3 mr-2 text-gray-400" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active Filters Display */}
            {searchTerm && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">Search results for:</span>
                <Badge variant="secondary" className="gap-1">
                  "{searchTerm}"
                  <button
                    onClick={clearSearch}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Streams */}
        {activeStreams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-red-500" />
                Live Now
              </CardTitle>
              <CardDescription>
                Currently active streams you can join
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeStreams.map((stream) => (
                  <Card key={stream.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg truncate">{stream.title}</h3>
                        <Badge variant="default" className="flex-shrink-0">
                          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                          Live
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {stream.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {stream.current_viewers}/{stream.max_viewers}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(stream.scheduled_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {stream.instructor?.first_name} {stream.instructor?.last_name}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleJoinStream(stream.id)}
                          className="flex items-center gap-1"
                        >
                          <Play className="h-3 w-3" />
                          Join
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Streams */}
        <Card>
          <CardHeader>
            <CardTitle>All Streams</CardTitle>
            <CardDescription>
              Browse all available live streams
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStreams.length === 0 ? (
              <div className="text-center py-12">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No streams found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No streams are currently available.'}
                </p>
                {searchTerm && (
                  <Button onClick={clearSearch} variant="outline">
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStreams.map((stream) => (
                  <Card key={stream.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg truncate">{stream.title}</h3>
                        {getStatusBadge(stream.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {stream.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {stream.current_viewers}/{stream.max_viewers}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(stream.scheduled_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {stream.instructor?.first_name} {stream.instructor?.last_name}
                        </span>
                        {stream.status === 'live' ? (
                          <Button
                            size="sm"
                            onClick={() => handleJoinStream(stream.id)}
                            className="flex items-center gap-1"
                          >
                            <Play className="h-3 w-3" />
                            Join
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleJoinStream(stream.id)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StreamList; 