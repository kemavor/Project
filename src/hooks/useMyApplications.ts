import { useState, useEffect } from "react";
import { apiClient } from "../lib/api";
import { Course } from "./useCourses";

export interface CourseApplication {
  id: number;
  course: Course;
  status: string;
  status_display: string;
  application_date: string;
  decision_date: string | null;
  notes: string;
  gpa: number | null;
  motivation_statement: string;
  student_year: number;
}

export function useMyApplications() {
  const [applications, setApplications] = useState<CourseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getMyApplications();
        
        if (response.error) {
          setError(response.error);
        } else if (response.data) {
          setApplications(response.data as CourseApplication[]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  return { applications, loading, error };
} 