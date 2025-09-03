import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface QuizStats {
  username: string;
  level: number;
  streak: number;
  total_qv_coins: number;
  master_topics: string[];
  sub_topics: string[];
  specific_topics: string[];
  quiz_stats: {
    total_quizzes: number;
    total_questions_attempted: number;
    total_questions_correct: number;
    overall_accuracy: number;
    total_qv_coins: number;
    current_streak: number;
    favorite_topics: string[];
    recent_performance: Array<{
      topic: string;
      score: number;
      total: number;
      percentage: number;
      date: string;
    }>;
  };
}

interface QuizSession {
  id: number;
  session_id: string;
  topic_name: string;
  difficulty: string;
  num_questions: number;
  time_limit: number;
  status: string;
  current_question_index: number;
  score: number;
  total_questions: number;
  started_at: string;
}

export const useQuizStats = () => {
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user quiz details
      const statsResponse = await apiClient.request('/enhanced-quiz/user-details');
      if (statsResponse.error) {
        console.warn('Quiz stats error:', statsResponse.error);
        setQuizStats(null);
      } else {
        setQuizStats(statsResponse.data);
      }

      // Fetch recent quiz sessions
      const sessionsResponse = await apiClient.request('/enhanced-quiz/my-sessions');
      if (sessionsResponse.error) {
        console.warn('Quiz sessions error:', sessionsResponse.error);
        setRecentSessions([]);
      } else {
        setRecentSessions(sessionsResponse.data || []);
      }

    } catch (err) {
      console.error('Error fetching quiz statistics:', err);
      setError('Failed to load quiz statistics');
      setQuizStats(null);
      setRecentSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizStats();
  }, []);

  const refreshStats = () => {
    fetchQuizStats();
  };

  return {
    quizStats,
    recentSessions,
    loading,
    error,
    refreshStats
  };
};