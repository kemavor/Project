import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Shield, Clock, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { Course, CourseDocumentAccess } from '../hooks/useCourses';
import { useCourses } from '../hooks/useCourses';

interface SecureDocumentViewerProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

export const SecureDocumentViewer: React.FC<SecureDocumentViewerProps> = ({
  course,
  isOpen,
  onClose,
}) => {
  const { courses, loading: coursesLoading, error: coursesError } = useCourses();
  const [documentAccess, setDocumentAccess] = useState<CourseDocumentAccess | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessExpired, setAccessExpired] = useState(false);

  const fetchSecureAccess = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For now, simulate secure access
      const mockAccess: CourseDocumentAccess = {
        hasAccess: true,
        signedUrl: `https://visionware-lecture-courses.s3.amazonaws.com/courses/${course.id}/document.pdf`,
        access_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        secure_document_url: `https://visionware-lecture-courses.s3.amazonaws.com/courses/${course.id}/document.pdf`
      };
      setDocumentAccess(mockAccess);
      setAccessExpired(false);
    } catch (err) {
      setError('Error accessing secure document');
    } finally {
      setLoading(false);
    }
  };

  const requestAccess = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For now, simulate access request
      const mockAccess: CourseDocumentAccess = {
        hasAccess: true,
        signedUrl: `https://visionware-lecture-courses.s3.amazonaws.com/courses/${course.id}/document.pdf`,
        access_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        secure_document_url: `https://visionware-lecture-courses.s3.amazonaws.com/courses/${course.id}/document.pdf`
      };
      setDocumentAccess(mockAccess);
      setAccessExpired(false);
    } catch (err) {
      setError('Error requesting document access');
    } finally {
      setLoading(false);
    }
  };

  const checkAccessExpiry = () => {
    if (documentAccess?.access_expires_at) {
      const expiryTime = new Date(documentAccess.access_expires_at);
      const now = new Date();
      if (now > expiryTime) {
        setAccessExpired(true);
      }
    }
  };

  useEffect(() => {
    if (isOpen && course) {
      fetchSecureAccess();
    }
  }, [isOpen, course]);

  useEffect(() => {
    // Check access expiry every minute
    const interval = setInterval(checkAccessExpiry, 60000);
    return () => clearInterval(interval);
  }, [documentAccess]);

  const handleOpenDocument = () => {
    if (documentAccess?.secure_document_url) {
      window.open(documentAccess.secure_document_url, '_blank');
    }
  };

  const handleDownload = async () => {
    if (documentAccess?.secure_document_url) {
      try {
        // Fetch the file content and create a blob for download
        const fileResponse = await fetch(documentAccess.secure_document_url);
        if (!fileResponse.ok) {
          throw new Error('Failed to fetch file');
        }
        
        const blob = await fileResponse.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `${course.name || course.title || 'document'}.pdf`;
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

  const formatExpiryTime = (expiryString: string) => {
    const expiry = new Date(expiryString);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins <= 0) return 'Expired';
    if (diffMins < 60) return `${diffMins} minutes`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hours`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Secure Document Access
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">{course.name}</h3>
            <p className="text-gray-600 text-sm">{course.description}</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Securing document access...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Access Error</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <Button 
                onClick={requestAccess} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Access Granted */}
          {documentAccess && !accessExpired && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Access Granted</span>
                </div>
                <p className="text-green-600 text-sm mt-1">
                  Your secure access has been granted successfully.
                </p>
              </div>

              {/* Expiry Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Access expires in: {documentAccess.access_expires_at ? formatExpiryTime(documentAccess.access_expires_at) : 'Unknown'}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={handleOpenDocument} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Document
                </Button>
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Security Notice:</strong> This document is accessed through a secure, 
                  time-limited URL. The access will expire automatically for your security.
                </p>
              </div>
            </div>
          )}

          {/* Access Expired */}
          {accessExpired && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Access Expired</span>
              </div>
              <p className="text-yellow-600 text-sm mt-1">
                Your secure access has expired. Click below to request new access.
              </p>
              <Button 
                onClick={requestAccess} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Request New Access
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 