import { useState, useEffect } from "react";
import { apiClient } from "../lib/api";

export interface CourseFile {
  file_type: 'document' | 'video';
  filename: string;
  signed_url: string;
  s3_key: string;
  bucket: string;
  size: number;
  last_modified: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id: number;
  created_at: string;
  updated_at: string;
  is_enrollment_open: boolean;
  credits: number;
  
  // Optional properties that might not be present in all API responses
  name?: string; // Legacy support
  year?: number; // Legacy support
  document_filename?: string; // Legacy support
  signed_url?: string | null; // Legacy support
  can_enroll?: { can_enroll: boolean; message: string }; // Legacy support
  current_user_application?: any; // Legacy support
  max_students?: number; // Legacy support
  enrolled_students_count?: number; // Legacy support
  available_spots?: number; // Legacy support
  prerequisites?: string; // Legacy support
  files?: CourseFile[]; // Legacy support
  instructor?: string; // Legacy support
  
  // Additional properties for compatibility
  cloudfront_url?: string;
  course_name?: string; // Legacy support
  course_description?: string; // Legacy support
  teacher_id?: number; // Legacy support
  cloudfront_signed_url?: string;
  display_url?: string;
}

export interface CourseDocumentAccess {
  hasAccess: boolean;
  reason?: string;
  signedUrl?: string;
  access_expires_at?: string;
  secure_document_url?: string;
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getCourses();
        
        if (response.error) {
          setError(response.error);
        } else if (response.data && Array.isArray(response.data)) {
          setCourses(response.data);
        } else {
          setCourses([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Organize courses by year (if year property exists)
  const coursesByYear = courses.reduce((acc, course) => {
    const year = course.year || 1; // Default to year 1 if not specified
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(course);
    return acc;
  }, {} as Record<number, Course[]>);

  const fetchCoursesByYear = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCourses();
      
      if (response.error) {
        setError(response.error);
      } else if (response.data && Array.isArray(response.data)) {
        setCourses(response.data);
      } else {
        setCourses([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return {
    courses,
    coursesByYear,
    loading,
    error,
    fetchCoursesByYear,
  };
}