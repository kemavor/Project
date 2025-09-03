import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface RecentLecture {
  id: number;
  title: string;
  description?: string;
  course_id: number;
  instructor_id: number;
  status: string;
  duration?: number;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  course?: {
    id: number;
    title: string;
    description?: string;
  };
  instructor?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export const useRecentLectures = (limit: number = 5) => {
  const [lectures, setLectures] = useState<RecentLecture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRecentLectures = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getRecentLectures(limit);
      if (response.data && Array.isArray(response.data)) {
        setLectures(response.data);
      } else {
        setLectures([]);
      }
    } catch (err) {
      console.error('Error fetching recent lectures:', err);
      setError('Failed to fetch recent lectures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentLectures();
  }, [user?.id, limit]);

  const refreshLectures = () => {
    fetchRecentLectures();
  };

  return {
    lectures,
    loading,
    error,
    refreshLectures
  };
}; 