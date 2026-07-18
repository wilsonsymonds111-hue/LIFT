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
      getExerciseDetailList().then(results => {
        const map = {};
        (results || []).forEach(d => {
          if (d.image_url) map[d.name.toLowerCase()] = d.image_url;
        });
        if (Object.keys(map).length > 0) {
          saveCachedImageMap(map);

          // Only preload images for exercises that appear in the user's
          // workout templates — avoids downloading ~100 images the user
          // may never see. If templates aren't loaded yet, skip preloading;
          // WorkoutSheet loads images on demand when a workout is opened.
          const templates = queryClient.getQueryData(['workoutTemplates']) || [];
          const templateNames = new Set();
          (templates || []).forEach(t => {
            (t.exerciseList || []).forEach(ex => templateNames.add(ex.name.toLowerCase()));
          });
          if (templateNames.size > 0) {
            Object.entries(map).forEach(([name, url]) => {
              if (templateNames.has(name)) { const img = new Image(); img.src = url; }
            });
          }
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
    // Start image map fetch immediately — it's a single lightweight API call
    // and the actual image preloading (new Image()) is non-blocking.
    prefetch();
    return;
  }, [queryClient]);
}