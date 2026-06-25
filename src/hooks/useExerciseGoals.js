import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';

export const EXERCISE_GOALS_KEY = ['exercise-goals'];

export function useExerciseGoals() {
  return useQuery({
    queryKey: EXERCISE_GOALS_KEY,
    queryFn: async () => {
      const results = await base44.entities.Exercise.list('name', 200);
      const map = {};
      (results || []).forEach(ex => {
        if (ex.goal) map[ex.name] = ex.goal;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function invalidateExerciseGoalsCache() {
  queryClientInstance.invalidateQueries({ queryKey: EXERCISE_GOALS_KEY });
}