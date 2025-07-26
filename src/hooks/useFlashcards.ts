import { useQuery } from '@tanstack/react-query';
import { fetchFlashcards, fetchCourseFlashcards } from '../lib/api';

export function useFlashcards() {
  return useQuery({ queryKey: ['flashcards'], queryFn: fetchFlashcards });
}

export function useCourseFlashcards(courseId: number) {
  return useQuery({ queryKey: ['courseFlashcards', courseId], queryFn: () => fetchCourseFlashcards(courseId), enabled: !!courseId });
} 