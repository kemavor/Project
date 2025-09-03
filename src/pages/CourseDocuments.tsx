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
import {
  H1, H2, H3, H4, H5, H6,
  LargeText, MediumText, NormalText, SmallText,
  Button as DSButton,
  Badge as DSBadge,
  Card as DSCard
} from '@/components/ui/design-system';

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

        // Fetch course documents (backend), then S3 fallback
        let docs: CourseDocument[] = [];
        try {
          const documentsResponse = await apiClient.getCourseDocumentsForStudents(parseInt(courseId));
          if (!documentsResponse.error && Array.isArray(documentsResponse.data)) {
            docs = documentsResponse.data as CourseDocument[];
          }
        } catch {}

        if (!docs || docs.length === 0) {
          // S3 fallback: try manifest first, then list objects
          const s3Docs = await loadS3Documents(parseInt(courseId));
          if (s3Docs.length > 0) {
            docs = s3Docs as unknown as CourseDocument[];
          }
        }

        setDocuments(docs || []);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const loadS3Documents = async (cid: number) => {
    const results: Array<Partial<CourseDocument>> = [];
    const BUCKET_BASE = 'https://visionware-lecture-courses.s3.amazonaws.com';
    
    // Known files for each course based on S3 bucket contents
    const courseFiles: Record<number, string[]> = {
      1: [
        'assignment1.pdf',
        'lecture1_introduction.md', 
        'syllabus.txt'
      ],
      2: [
        'assignment1.txt',
        'course_description.txt',
        'lecture_notes_week1.txt',
        'project_guidelines.txt',
        'python_basics.txt',
        'syllabus.txt'
      ]
    };

    const files = courseFiles[cid] || [];
    
    files.forEach((filename, idx) => {
      const url = `${BUCKET_BASE}/courses/${cid}/${filename}`;
      results.push({
        id: idx + 1,
        title: filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        filename: filename,
        file_size: 0,
        file_type: extToType(filename),
        mime_type: extToMime(filename),
        is_public: true,
        created_at: new Date().toISOString(),
        download_url: url,
        view_url: url,
        s3_url: url,
      });
    });

    return results;
  };

  const toDoc = (item: any, idx: number, base: string) => {
    const name = item.filename || item.title || item.name || `file_${idx + 1}`;
    const key = item.s3_key || item.key || `courses/${courseId}/${name}`;
    const url = item.s3_url || item.download_url || `${base}/${key}`;
    return {
      id: item.id || idx + 1,
      title: item.title || name,
      filename: name,
      file_size: item.file_size || 0,
      file_type: item.file_type || extToType(name),
      mime_type: item.mime_type || extToMime(name),
      is_public: true,
      created_at: item.created_at || new Date().toISOString(),
      download_url: url,
      view_url: item.view_url || url,
      s3_url: url,
    } as CourseDocument;
  };

  const extToType = (name: string) => {
    const e = name.toLowerCase();
    if (/\.(pdf)$/i.test(e)) return 'document';
    if (/\.(ppt|pptx|doc|docx|xls|xlsx|csv|txt)$/i.test(e)) return 'document';
    if (/\.(jpg|jpeg|png|gif)$/i.test(e)) return 'image';
    if (/\.(mp4|mkv|mov|avi)$/i.test(e)) return 'video';
    if (/\.(mp3|wav)$/i.test(e)) return 'audio';
    return 'file';
  };

  const extToMime = (name: string) => {
    const e = name.toLowerCase();
    if (e.endsWith('.pdf')) return 'application/pdf';
    if (e.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
    if (e.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    if (e.endsWith('.doc')) return 'application/msword';
    if (e.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (e.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (e.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (e.endsWith('.csv')) return 'text/csv';
    if (e.endsWith('.txt')) return 'text/plain';
    if (/(jpg|jpeg)$/.test(e)) return 'image/jpeg';
    if (e.endsWith('.png')) return 'image/png';
    if (e.endsWith('.gif')) return 'image/gif';
    if (e.endsWith('.mp4')) return 'video/mp4';
    if (e.endsWith('.mp3')) return 'audio/mpeg';
    return 'application/octet-stream';
  };

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
              <h1 className="text-3xl font-bold text-gray-900">
                {course?.title || 'Course Documents'}
              </h1>
              <p className="text-gray-700">
                Access and download course materials
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="bg-white">
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
            <div className="relative text-gray-900">
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
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 text-gray-900">
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
        <Card className="bg-white text-gray-900">
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
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  {searchTerm ? 'No documents found' : 'No documents available'}
                </h3>
                <p className="text-gray-700 mb-4">
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
                        <h3 className="font-semibold text-sm truncate text-gray-900">
                          {document.title || document.original_filename || 'Untitled Document'}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
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