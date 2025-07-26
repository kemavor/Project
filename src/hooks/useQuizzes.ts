import { useQuery } from '@tanstack/react-query';
import { fetchQuizzes, fetchCourseQuizzes } from '../lib/api';

export function useQuizzes() {
  return useQuery({ queryKey: ['quizzes'], queryFn: fetchQuizzes });
}

export function useCourseQuizzes(courseId: number) {
  return useQuery({ queryKey: ['courseQuizzes', courseId], queryFn: () => fetchCourseQuizzes(courseId), enabled: !!courseId });
} 