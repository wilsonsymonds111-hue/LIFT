import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const QUERY_KEY = ['workoutTemplates'];

export function useWorkoutTemplates() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => base44.entities.WorkoutTemplate.list('sort_order', 100),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function invalidateWorkoutTemplates(queryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEY });
}