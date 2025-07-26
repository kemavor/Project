import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen, 
  Search, 
  Filter,
  Calendar,
  Clock,
  FileText,
  Eye,
  Download,
  Star,
  X
} from 'lucide-react';
import { SearchUtils } from '@/lib/searchUtils';

interface Summary {
  id: number;
  title: string;
  content: string;
  course_name: string;
  instructor: string;
  created_at: string;
  updated_at: string;
  rating: number;
  views: number;
  downloads: number;
  tags: string[];
  type: 'lecture' | 'chapter' | 'topic' | 'exam';
}

const Summaries: React.FC = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockSummaries: Summary[] = [
    {
      id: 1,
        title: "Introduction to Machine Learning",
        content: "Comprehensive summary of machine learning fundamentals including supervised and unsupervised learning algorithms.",
        course_name: "CS 101",
        instructor: "Dr. Sarah Chen",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        rating: 4.5,
        views: 1250,
        downloads: 340,
        tags: ["machine learning", "algorithms", "supervised learning"],
        type: "lecture"
    },
    {
      id: 2,
        title: "Neural Network Architecture",
        content: "Detailed explanation of neural network layers, activation functions, and backpropagation.",
        course_name: "CS 201",
        instructor: "Prof. Michael Brown",
        created_at: "2024-01-20T10:00:00Z",
        updated_at: "2024-01-20T10:00:00Z",
        rating: 4.8,
        views: 890,
        downloads: 210,
        tags: ["neural networks", "deep learning", "backpropagation"],
        type: "chapter"
    },
    {
      id: 3,
        title: "Database Design Principles",
        content: "Key concepts in database design including normalization, relationships, and optimization.",
        course_name: "CS 301",
        instructor: "Dr. Emily Davis",
        created_at: "2024-01-25T10:00:00Z",
        updated_at: "2024-01-25T10:00:00Z",
        rating: 4.2,
        views: 650,
        downloads: 180,
        tags: ["databases", "normalization", "SQL"],
        type: "topic"
      }
    ];

    setSummaries(mockSummaries);
    setLoading(false);
  }, []);

  // Debounced search suggestions
  const debouncedSearchSuggestions = useMemo(
    () => SearchUtils.debounce((query: string) => {
      if (query.length >= 2) {
        const suggestions = SearchUtils.getSuggestions(summaries, query, 5);
        setSearchSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300),
    [summaries]
  );

  // Update suggestions when search term changes
  useEffect(() => {
    debouncedSearchSuggestions(searchTerm);
  }, [searchTerm, debouncedSearchSuggestions]);

  // Efficient filtered summaries using memoization
  const filteredSummaries = useMemo(() => {
    let filtered = summaries;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(summary => {
        const searchLower = searchTerm.toLowerCase();
        return (
          summary.title.toLowerCase().includes(searchLower) ||
          summary.content.toLowerCase().includes(searchLower) ||
          summary.course_name.toLowerCase().includes(searchLower) ||
          summary.instructor.toLowerCase().includes(searchLower) ||
          summary.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter(summary => summary.type === selectedType);
    }

    // Apply course filter
    if (selectedCourse) {
      filtered = filtered.filter(summary => summary.course_name === selectedCourse);
    }

    return filtered;
  }, [summaries, searchTerm, selectedType, selectedCourse]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedType(null);
    setSelectedCourse(null);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  const handleViewSummary = (summary: Summary) => {
    // Implement view functionality
    console.log('Viewing summary:', summary.title);
  };

  const handleDownloadSummary = (summary: Summary) => {
    // Implement download functionality
    console.log('Downloading summary:', summary.title);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      lecture: { variant: 'default' as const, text: 'Lecture' },
      chapter: { variant: 'secondary' as const, text: 'Chapter' },
      topic: { variant: 'outline' as const, text: 'Topic' },
      exam: { variant: 'destructive' as const, text: 'Exam' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.topic;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const uniqueCourses = useMemo(() => {
    return Array.from(new Set(summaries.map(s => s.course_name)));
  }, [summaries]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(summaries.map(s => s.type)));
  }, [summaries]);

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading summaries...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500 rounded-2xl">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Study Summaries</h1>
              <p className="text-muted-foreground text-lg">
                Access comprehensive summaries and study materials
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
            <CardDescription>Find summaries by title, content, course, or instructor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <div className="flex gap-4">
          <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                    type="text"
                    placeholder="Search summaries by title, content, course, or instructor..."
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
                <Button type="submit">
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
            </form>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Filters:
              </div>
              
              {/* Type Filter */}
              <div className="flex gap-2">
                <Button
                  variant={selectedType === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                >
                  All Types
                </Button>
                {uniqueTypes.map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Course Filter */}
              <div className="flex gap-2">
                <Button
                  variant={selectedCourse === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCourse(null)}
                >
                  All Courses
                </Button>
                {uniqueCourses.map((course) => (
                  <Button
                    key={course}
                    variant={selectedCourse === course ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCourse(course)}
                  >
                    {course}
                  </Button>
                ))}
              </div>
                </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedType || selectedCourse) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedType && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {selectedType}
                    <button
                      onClick={() => setSelectedType(null)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedCourse && (
                  <Badge variant="secondary" className="gap-1">
                    Course: {selectedCourse}
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}
            </CardContent>
          </Card>

        {/* Summaries Display */}
          <Card>
          <CardHeader>
            <CardTitle>Study Summaries</CardTitle>
            <CardDescription>
              {filteredSummaries.length} summary{filteredSummaries.length !== 1 ? 'ies' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSummaries.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No summaries found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button onClick={clearSearch} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSummaries.map((summary) => (
            <Card key={summary.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg line-clamp-2">{summary.title}</h3>
                        {getTypeBadge(summary.type)}
                  </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {summary.content}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{summary.course_name}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span>{summary.rating}</span>
                  </div>
                </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {summary.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {summary.downloads}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(summary.created_at)}
                  </span>
                </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {summary.instructor}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSummary(summary)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownloadSummary(summary)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                </div>

                      {summary.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                          {summary.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                          {summary.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                              +{summary.tags.length - 3} more
                    </Badge>
                  )}
                </div>
                      )}
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

export default Summaries;