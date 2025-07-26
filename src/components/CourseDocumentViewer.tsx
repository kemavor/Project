import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, FileText, Video, Download, ExternalLink } from 'lucide-react';

interface CourseDocument {
  id: number;
  name: string;
  year: number;
  description: string;
  cloudfront_signed_url?: string;
  secure_document_url?: string;
  document_filename?: string;
}

interface CourseDocumentViewerProps {
  courseId: number;
  onError?: (error: string) => void;
}

const CourseDocumentViewer: React.FC<CourseDocumentViewerProps> = ({ 
  courseId, 
  onError 
}) => {
  const [course, setCourse] = useState<CourseDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchCourseDocument();
  }, [courseId]);

  const fetchCourseDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course with signed URL
      const response = await fetch(`/api/courses/${courseId}/document_access/`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCourse(data);
      
      // Use the secure document URL
      const url = data.secure_document_url || data.cloudfront_signed_url;
      setDocumentUrl(url);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course document';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (filename?: string, url?: string) => {
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase();
      if (['mp4', 'avi', 'mov', 'webm'].includes(ext || '')) return 'video';
      if (['pdf'].includes(ext || '')) return 'pdf';
      if (['doc', 'docx'].includes(ext || '')) return 'document';
    }
    
    if (url) {
      if (url.includes('.mp4') || url.includes('.avi') || url.includes('.mov')) return 'video';
      if (url.includes('.pdf')) return 'pdf';
      if (url.includes('.doc') || url.includes('.docx')) return 'document';
    }
    
    return 'document';
  };

  const renderDocumentViewer = () => {
    if (!documentUrl) return null;

    const fileType = getFileType(course?.document_filename, documentUrl);

    switch (fileType) {
      case 'video':
        return (
          <div className="w-full">
            <video 
              controls 
              className="w-full h-auto max-h-96 rounded-lg"
              src={documentUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full">
            <iframe
              src={documentUrl}
              className="w-full h-96 rounded-lg border"
              title="PDF Document"
            />
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              This document type cannot be previewed directly.
            </p>
            <Button 
              onClick={() => window.open(documentUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Document
            </Button>
          </div>
        );
    }
  };

  const handleDownload = async () => {
    if (documentUrl) {
      try {
        // Fetch the file content and create a blob for download
        const fileResponse = await fetch(documentUrl);
        if (!fileResponse.ok) {
          throw new Error('Failed to fetch file');
        }
        
        const blob = await fileResponse.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = course?.document_filename || 'document';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download error:', error);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading course document...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <p>Error loading course document:</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!course) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-600">
            <p>No course document found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{course.name}</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(documentUrl!, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </Button>
          </div>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Year {course.year} • {course.description}
        </p>
      </CardHeader>
      <CardContent>
        {renderDocumentViewer()}
      </CardContent>
    </Card>
  );
};

export default CourseDocumentViewer; 