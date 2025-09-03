import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export function useEnrolledCoursesWithLectures() {
  return useQuery({ 
    queryKey: ['enrolledCoursesWithLectures'], 
    queryFn: () => apiClient.getEnrolledCoursesWithLectures() 
  });
}

export function useStudentProgress() {
  return useQuery({ 
    queryKey: ['studentProgress'], 
    queryFn: () => apiClient.getStudentProgress() 
  });
}

export function useGeneratedQuestions(streamId: number) {
  return useQuery({ 
    queryKey: ['generatedQuestions', streamId], 
    queryFn: () => apiClient.getGeneratedQuestions(streamId), 
    enabled: !!streamId 
  });
}

// Legacy hooks for backwards compatibility
export function useQuizzes() {
  return { data: [], isLoading: false, error: null };
}

export function useCourseQuizzes(courseId: number) {
  return { data: [], isLoading: false, error: null };
} 