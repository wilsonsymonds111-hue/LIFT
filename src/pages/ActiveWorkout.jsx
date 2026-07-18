import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { saveWorkout, syncOfflineQueue } from '../lib/offlineQueue';
import { loadWorkoutSession } from '../lib/workoutSession';
import WorkoutSheet from '../components/WorkoutSheet';
import ActiveWorkoutSkeleton from '../components/skeletons/ActiveWorkoutSkeleton';

export default function ActiveWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: templates } = useWorkoutTemplates();
  const [savedSession] = useState(() => loadWorkoutSession());

  const isEmpty = id.startsWith('empty-');
  const template = isEmpty
    ? { id, name: 'Evening Workout', exerciseList: [] }
    : templates?.find(t => t.id === id);

  const handleSaveHistory = async (templateId, snapshot, exerciseList) => {
    if (templateId.startsWith('empty-')) return;
    await saveWorkout(templateId, snapshot, exerciseList);
  };

  // Sync any queued workouts when back online
  useEffect(() => {
    const onOnline = () => { syncOfflineQueue(); };
    window.addEventListener('online', onOnline);
    if (navigator.onLine) { syncOfflineQueue(); }
    return () => window.removeEventListener('online', onOnline);
  }, []);

  if (!template) {
    return <ActiveWorkoutSkeleton />;
  }

  return (
    <WorkoutSheet
      key={template?.id}
      template={template}
      savedSession={savedSession}
      onFinish={() => navigate('/', { replace: true })}
      onSaveHistory={handleSaveHistory}
    />
  );
}