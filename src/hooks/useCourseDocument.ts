import { useState, useEffect } from 'react';

interface CourseDocument {
  id: number;
  name: string;
  year: number;
  description: string;
  cloudfront_signed_url?: string;
  secure_document_url?: string;
  document_filename?: string;
  access_expires_at?: string;
}

interface UseCourseDocumentReturn {
  course: CourseDocument | null;
  loading: boolean;
  error: string | null;
  documentUrl: string | null;
  refresh: () => void;
}

export const useCourseDocument = (courseId: number): UseCourseDocumentReturn => {
  const [course, setCourse] = useState<CourseDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  const fetchCourseDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/courses/${courseId}/document_access/`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Course document not found');
        } else if (response.status === 403) {
          throw new Error('Access denied to course document');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      setCourse(data);
      
      // Use the secure document URL (preferred) or fallback to cloudfront_signed_url
      const url = data.secure_document_url || data.cloudfront_signed_url;
      setDocumentUrl(url);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course document';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseDocument();
    }
  }, [courseId]);

  const refresh = () => {
    fetchCourseDocument();
  };

  return {
    course,
    loading,
    error,
    documentUrl,
    refresh,
  };
};

export default useCourseDocument; 