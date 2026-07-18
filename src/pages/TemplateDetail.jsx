import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { useQueryClient } from '@tanstack/react-query';
import EditTemplateModal from '../components/EditTemplateModal';
import TemplateDetailSkeleton from '../components/skeletons/TemplateDetailSkeleton';

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Reuse React Query cache from Home page — data is already loaded, no refetch
  const { data: templates, isLoading: templatesLoading } = useWorkoutTemplates();
  const cachedTemplate = templates?.find(t => t.id === id);

  // Fallback: if the template isn't in the cache (e.g. just created from an
  // example split), fetch it directly by ID instead of spinning forever.
  const [fetchedTemplate, setFetchedTemplate] = useState(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    if (cachedTemplate || !id) { setFetchedTemplate(null); setFetchFailed(false); return; }
    if (templatesLoading) return;
    setFetchedTemplate(null);
    setFetchFailed(false);
    base44.entities.WorkoutTemplate.get(id)
      .then(t => setFetchedTemplate(t))
      .catch(() => setFetchFailed(true));
  }, [id, cachedTemplate, templatesLoading]);

  const template = cachedTemplate || fetchedTemplate;

  if (!template) {
    return createPortal(
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
        {fetchFailed ? (
          <p className="text-muted-foreground">Workout not found</p>
        ) : (
          <TemplateDetailSkeleton />
        )}
      </div>,
      document.body
    );
  }

  return (
    <EditTemplateModal
      template={template}
      onClose={() => navigate('/')}
      onSave={async (updated) => {
        await base44.entities.WorkoutTemplate.update(updated.id, updated);
        queryClient.invalidateQueries({ queryKey: ['workoutTemplates'] });
        navigate('/');
      }}
    />
  );
}