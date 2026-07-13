import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';

export const EXERCISE_HISTORY_KEY = ['exercise-history'];

export function useExerciseHistory() {
  return useQuery({
    queryKey: EXERCISE_HISTORY_KEY,
    queryFn: async () => {
      const results = await base44.entities.Exercise.list('name', 500);
      const history = {};
      const notes = {};
      // Case-insensitive merge — combines history from duplicate entities
      // so the UI always shows the full history regardless of casing
      const byLowerName = {};
      (results || []).forEach(ex => {
        const key = ex.name.toLowerCase();
        if (!byLowerName[key]) byLowerName[key] = [];
        byLowerName[key].push(...(ex.history || []));
      });
      // Return maps keyed by the original casing the app uses (title-cased)
      (results || []).forEach(ex => {
        if (!history[ex.name]) {
          history[ex.name] = byLowerName[ex.name.toLowerCase()] || [];
          notes[ex.name] = ex.note || '';
        }
      });
      return { history, notes };
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function invalidateExerciseHistoryCache() {
  queryClientInstance.invalidateQueries({ queryKey: EXERCISE_HISTORY_KEY });
}