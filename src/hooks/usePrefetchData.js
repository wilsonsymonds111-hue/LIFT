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
          const results = await base44.entities.Exercise.list('name', 500);
          const map = {};
          (results || []).forEach(ex => { map[ex.name] = ex.history || []; });
          return map;
        },
        staleTime: 5 * 60 * 1000,
      });
      getExerciseDetailList();
    };
    const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
    const id = ric(prefetch);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, [queryClient]);
}