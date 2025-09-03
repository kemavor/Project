import { useState, useEffect } from 'react';
import { useMyCourses } from './useMyCourses';
import { useAuth } from '@/contexts/AuthContext';

export interface CourseProgress {
  id: number;
  title: string;
  progress: number;
  lectures: number;
  completed: number;
  nextLecture?: string;
  lastActivity?: string;
}

export const useCourseProgress = () => {
  const { courses, loading: coursesLoading, error: coursesError } = useMyCourses();
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || coursesLoading) return;

    const calculateProgress = () => {
      setLoading(true);
      setError(null);

      try {
        // For now, we'll use mock progress data since we don't have real progress tracking
        // In a real implementation, this would come from the API
        const progressData: CourseProgress[] = courses.map((course, index) => ({
          id: course.id,
          title: course.title || course.name || 'Untitled Course',
          progress: Math.floor(Math.random() * 40) + 30, // Mock progress between 30-70%
          lectures: Math.floor(Math.random() * 15) + 8, // Mock lecture count
          completed: Math.floor(Math.random() * 10) + 3, // Mock completed lectures
          nextLecture: `Lecture ${Math.floor(Math.random() * 5) + 1}`,
          lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }));

        setCourseProgress(progressData);
      } catch (err) {
        setError('Failed to calculate course progress');
        console.error('Error calculating course progress:', err);
      } finally {
        setLoading(false);
      }
    };

    calculateProgress();
  }, [courses, coursesLoading, user?.id]);

  return {
    courseProgress,
    loading: loading || coursesLoading,
    error: error || coursesError
  };
}; 