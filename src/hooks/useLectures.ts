import { useQuery } from '@tanstack/react-query';
import { fetchLectures, fetchCourseLectures } from '../lib/api';

export function useLectures() {
  return useQuery({ queryKey: ['lectures'], queryFn: fetchLectures });
}

export function useCourseLectures(courseId: number) {
  return useQuery({ queryKey: ['courseLectures', courseId], queryFn: () => fetchCourseLectures(courseId), enabled: !!courseId });
} 