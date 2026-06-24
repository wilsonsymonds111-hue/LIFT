import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { EXERCISE_HISTORY_KEY } from './useExerciseHistory';
import { getExerciseDetailList } from '@/lib/exerciseCache';

// Warm up the data caches for tabs the user hasn't opened yet, so switching
// to Splits/Exercises is instant. Runs during idle time to avoid competing
// with the first paint of the Home tab.
export function usePrefetchData() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const prefetch = () => {
      queryClient.prefetchQuery({
        queryKey: EXERCISE_HISTORY_KEY,
        queryFn: async () => {
          const results = await base44.entities.Exercise.list('name', 200);
          const map = {};
          (results || []).forEach(ex => { map[ex.name] = ex.history || []; });
          return map;
        },
        staleTime: 5 * 60 * 1000,
      });
      getExerciseDetailList();
    };
    const hasRIC = typeof requestIdleCallback === 'function';
    const id = hasRIC ? requestIdleCallback(prefetch, { timeout: 5000 }) : setTimeout(prefetch, 2000);
    return () => (hasRIC ? cancelIdleCallback(id) : clearTimeout(id));
  }, [queryClient]);
}