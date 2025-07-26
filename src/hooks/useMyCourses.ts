import { useState, useEffect } from "react";
import { apiClient } from "../lib/api";
import { Course } from "./useCourses";

export function useMyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getMyCourses();
        
        if (response.error) {
          setError(response.error);
        } else if (response.data) {
          setCourses(response.data as Course[]);
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