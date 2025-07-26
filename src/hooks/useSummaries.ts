import { useQuery } from '@tanstack/react-query';
import { fetchSummaries, fetchCourseSummaries } from '../lib/api';

export function useSummaries() {
  return useQuery({ queryKey: ['summaries'], queryFn: fetchSummaries });
}

export function useCourseSummaries(courseId: number) {
  return useQuery({ queryKey: ['courseSummaries', courseId], queryFn: () => fetchCourseSummaries(courseId), enabled: !!courseId });
} 