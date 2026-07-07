import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';

export const EXERCISE_HISTORY_KEY = ['exercise-history'];

export function useExerciseHistory() {
  return useQuery({
    queryKey: EXERCISE_HISTORY_KEY,
    queryFn: async () => {
      const results = await base44.entities.Exercise.list('name', 500);
      const map = {};
      (results || []).forEach(ex => {
        map[ex.name] = ex.history || [];
      });
      return map;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function invalidateExerciseHistoryCache() {
  queryClientInstance.invalidateQueries({ queryKey: EXERCISE_HISTORY_KEY });
}