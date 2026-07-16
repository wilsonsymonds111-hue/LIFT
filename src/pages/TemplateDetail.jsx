import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { useQueryClient } from '@tanstack/react-query';
import EditTemplateModal from '../components/EditTemplateModal';

function relativeTime(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 60000) return 'Just now';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(true);
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

  const listRef = useRef(null);
  const [fontScale, setFontScale] = useState(1);

  const exerciseCount = template?.exerciseList?.length ?? 0;

  // Auto-shrink the exercise list so all content fits without scrolling.
  // The list uses em-based sizing so a single fontSize on the container scales everything.
  const measure = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    // Reset to natural size to measure true content height
    el.style.fontSize = '';
    const available = el.clientHeight;
    const content = el.scrollHeight;
    if (content > available && available > 0) {
      const scale = Math.max(0.5, available / content);
      setFontScale(scale);
    } else {
      setFontScale(1);
    }
  }, []);

  useEffect(() => {
    // rAF ensures the modal layout has settled before measuring
    const raf = requestAnimationFrame(measure);
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [measure, exerciseCount]);

  if (!template) {
    return createPortal(
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
        {fetchFailed ? (
          <p className="text-muted-foreground">Workout not found</p>
        ) : (
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        )}
      </div>,
      document.body
    );
  }

  if (showEdit) {
    return (
      <EditTemplateModal
        template={template}
        onClose={() => setShowEdit(false)}
        onSave={async (updated) => {
          await base44.entities.WorkoutTemplate.update(updated.id, updated);
          queryClient.invalidateQueries({ queryKey: ['workoutTemplates'] });
          setShowEdit(false);
        }}
      />
    );
  }

  const lastPerformed = template.lastPerformed
    ? `Last Performed: ${relativeTime(template.lastPerformed)}`
    : 'Not performed yet';

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="relative bg-card rounded-3xl w-[90%] max-w-sm h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-bold text-base tracking-wide text-foreground">{template.name}</h2>
          <button
            onClick={() => setShowEdit(true)}
            className="text-blue-500 font-semibold text-sm hover:text-blue-600 transition"
          >
            Edit
          </button>
        </div>

        <p className="px-5 pt-3 pb-1 text-sm text-muted-foreground">{lastPerformed}</p>

        <div
          ref={listRef}
          className="px-5 py-3 flex-1 min-h-0 overflow-hidden"
          style={{ fontSize: `${fontScale}rem` }}
        >
          <div className="space-y-[0.75em]">
            {template.exerciseList?.map((exercise, idx) => (
            <div key={idx} className="flex items-center gap-[0.75em]">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground leading-snug" style={{ fontSize: '0.875em' }}>{exercise.sets || 2} × {exercise.name}</p>
                <p className="text-muted-foreground mt-[0.15em]" style={{ fontSize: '0.75em' }}>{exercise.muscle}</p>
              </div>
            </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-5">
          <button
            onClick={() => navigate(`/active-workout/${template.id}`)}
            className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-2xl text-base transition"
          >
            Start Workout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}