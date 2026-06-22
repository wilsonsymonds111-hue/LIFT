import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const EXERCISE_HISTORY_KEY = ['exercise-history'];

export function useExerciseHistory() {
  return useQuery({
    queryKey: EXERCISE_HISTORY_KEY,
    queryFn: async () => {
      const results = await base44.entities.Exercise.list('name', 200);
      const map = {};
      (results || []).forEach(ex => {
        map[ex.name] = ex.history || [];
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}