import { useState, useEffect } from "react";
import { apiClient, EnrolledCourse } from "../lib/api";
import { Course } from "./useCourses";

export function useMyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getEnrolledCourses();
        
        if (response.error) {
          setError(response.error);
        } else if (response.data) {
          // Extract course data from enrolled course structure
          const extractedCourses = (response.data as EnrolledCourse[]).map((enrolledCourse) => ({
            ...enrolledCourse.course,
            enrolled_at: enrolledCourse.enrolled_at,
            enrollment_status: enrolledCourse.enrollment_status
          }));
          setCourses(extractedCourses);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return { courses, loading, error };
} 