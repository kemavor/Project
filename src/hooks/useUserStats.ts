import { useQuery } from '@tanstack/react-query';
import { fetchUserStats } from '../lib/api';

export function useUserStats(userId: number) {
  return useQuery({ queryKey: ['userStats', userId], queryFn: () => fetchUserStats(userId), enabled: !!userId });
} 