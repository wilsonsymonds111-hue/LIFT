import { useState } from 'react';
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
  const [showEdit, setShowEdit] = useState(false);
  const queryClient = useQueryClient();

  // Reuse React Query cache from Home page — data is already loaded, no refetch
  const { data: templates } = useWorkoutTemplates();
  const template = templates?.find(t => t.id === id);

  if (!template) {
    return createPortal(
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="relative bg-card rounded-3xl w-[90%] max-w-sm max-h-[85vh] flex flex-col shadow-2xl">
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

        <div className="px-5 py-3 space-y-3 overflow-y-auto flex-1">
          {template.exerciseList?.map((exercise, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm leading-snug">{exercise.sets || 2} × {exercise.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{exercise.muscle}</p>
            </div>
          </div>
          ))}
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