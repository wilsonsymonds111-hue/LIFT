import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { EXERCISE_HISTORY_KEY } from './useExerciseHistory';
import { getExerciseDetailList, saveCachedImageMap } from '../lib/exerciseCache';
// Warm up the data caches for tabs the user hasn't opened yet, so switching
// to Splits/Exercises is instant. Runs during idle time to avoid competing
// with the first paint of the Home tab.
export function usePrefetchData() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const prefetch = () => {
      // Warm the exercise detail image cache during idle time so the
      // ExercisePicker shows images instantly on first open.
      // Also persist to localStorage so workout images load instantly.
      getExerciseDetailList().then(results => {
        const map = {};
        (results || []).forEach(d => {
          if (d.image_url) map[d.name.toLowerCase()] = d.image_url;
        });
        if (Object.keys(map).length > 0) {
          saveCachedImageMap(map);
          // Preload actual image files into the browser HTTP cache so they
          // render instantly when a workout is opened
          Object.values(map).forEach(url => { const img = new Image(); img.src = url; });
        }
      });
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
    };
    const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
    const id = ric(prefetch);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, [queryClient]);
}