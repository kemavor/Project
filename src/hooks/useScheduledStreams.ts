import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface ScheduledStream {
  id: number;
  title: string;
  description: string;
  course_id: number;
  instructor_id: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  duration?: number;
  is_public: boolean;
  instructor_name: string;
  course_name: string;
  viewer_count: number;
}

export const useScheduledStreams = () => {
  const [scheduledStreams, setScheduledStreams] = useState<ScheduledStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduledStreams = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.request('/livestream/schedule');
      if (response.error) {
        setError(response.error);
        setScheduledStreams([]);
      } else {
        setScheduledStreams(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching scheduled streams:', err);
      setError('Failed to load scheduled streams');
      setScheduledStreams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledStreams();
  }, []);

  const refreshStreams = () => {
    fetchScheduledStreams();
  };

  return {
    scheduledStreams,
    loading,
    error,
    refreshStreams
  };
};