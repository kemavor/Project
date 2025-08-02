import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Download, 
  Eye, 
  FileText, 
  FileImage, 
  FileVideo, 
  FileAudio, 
  FileArchive, 
  FileCode,
  File,
  Calendar,
  User,
  ArrowLeft,
  X
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { CourseDocument } from '@/types/course';
import { toast } from 'react-hot-toast';
import { DocumentSearch, SearchUtils } from '@/lib/searchUtils';

const CourseDocuments: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<any>(null);
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloading, setDownloading] = useState<number | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search suggestions
  const debouncedSearchSuggestions = useMemo(
    () => SearchUtils.debounce((query: string) => {
      if (query.length >= 2) {
        const suggestions = SearchUtils.getSuggestions(documents, query, 5);
        setSearchSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300),
    [documents]
  );

  // Update suggestions when search term changes
  useEffect(() => {
    debouncedSearchSuggestions(searchTerm);
  }, [searchTerm, debouncedSearchSuggestions]);

  // Efficient filtered documents using memoization
  const filteredDocuments = useMemo(() => {
    if (!searchTerm.trim()) return documents;
    
    return DocumentSearch.searchDocuments(documents, searchTerm, {
      fuzzy: true,
      threshold: 0.7,
      sortBy: 'relevance'
    });
  }, [documents, searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        
        // Fetch course details
        const courseResponse = await apiClient.getCourse(parseInt(courseId));
        if (courseResponse.error) {
          setError(courseResponse.error);
          return;
        }
        setCourse(courseResponse.data);

        // Fetch course documents
        const documentsResponse = await apiClient.getCourseDocumentsForStudents(parseInt(courseId));
        if (documentsResponse.error) {
          setError(documentsResponse.error);
          return;
        }
        setDocuments(documentsResponse.data || []);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleDownload = async (docItem: CourseDocument) => {
    try {
      console.log('Starting download for document:', docItem);
      setDownloading(docItem.id);

      if (docItem.download_url) {
        console.log('Download URL found:', docItem.download_url);

        // Fetch the file content and create a blob for download
        const fileResponse = await fetch(docItem.download_url);
        console.log('File response status:', fileResponse.status);

        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch file: ${fileResponse.status} ${fileResponse.statusText}`);
        }

        const blob = await fileResponse.blob();
        console.log('Blob created, size:', blob.size);

        const url = window.URL.createObjectURL(blob);
        console.log('Blob URL created:', url);

        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = docItem.original_filename || docItem.filename;
        link.style.display = 'none';
        document.body.appendChild(link);

        console.log('Triggering download for:', link.download);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        window.URL.revokeObjectURL(url);

        toast.success('Document downloaded successfully!');
      } else {
        console.error('No download URL available for document:', docItem);
        toast.error('Download URL not available');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleView = (docItem: CourseDocument) => {
    if (docItem.download_url) {
      window.open(docItem.download_url, '_blank');
    } else {
      toast.error('View URL not available');
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-5 w-5" />;
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('gif')) return <FileImage className="h-5 w-5" />;
    if (type.includes('video') || type.includes('mp4') || type.includes('avi') || type.includes('mov')) return <FileVideo className="h-5 w-5" />;
    if (type.includes('audio') || type.includes('mp3') || type.includes('wav')) return <FileAudio className="h-5 w-5" />;
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return <FileArchive className="h-5 w-5" />;
    if (type.includes('code') || type.includes('js') || type.includes('py') || type.includes('java')) return <FileCode className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading course documents...</span>
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {course?.title || 'Course Documents'}
              </h1>
              <p className="text-muted-foreground">
                Access and download course materials
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Documents
            </CardTitle>
            <CardDescription>
              Find specific documents by name, type, or description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search documents by name, type, or description..."
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

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Course Documents</CardTitle>
            <CardDescription>
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No documents found' : 'No documents available'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? 'Try adjusting your search terms.'
                    : 'Documents will appear here once they are uploaded by your instructor.'}
                </p>
                {searchTerm && (
                  <Button onClick={clearSearch} variant="outline">
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        {getFileIcon(document.file_type || 'unknown')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {document.title || document.original_filename || 'Untitled Document'}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="truncate">
                            {document.original_filename || document.filename || 'Unknown file'}
                          </span>
                          <span>{formatFileSize(document.file_size || 0)}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {document.created_at ? new Date(document.created_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                          {(document.file_type || 'unknown').toUpperCase()}
                          {document.uploader && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {document.uploader.first_name} {document.uploader.last_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(document)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(document)}
                        disabled={downloading === document.id}
                        className="flex items-center gap-1"
                      >
                        {downloading === document.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CourseDocuments; 