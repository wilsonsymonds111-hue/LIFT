import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';
import EditTemplateModal from '../components/EditTemplateModal';

const HollowDot = (props) => {
  const { cx, cy } = props;
  return <circle cx={cx} cy={cy} r={3} fill="white" stroke="#3b82f6" strokeWidth={1.5} />;
};

function daysAgo(dateStr) {
  if (!dateStr) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const date = isDateOnly ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    base44.entities.WorkoutTemplate.list('sort_order', 200).then(results => {
      const found = results?.find(t => t.id === id);
      if (found) setTemplate(found);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <p className="text-gray-400">Template not found.</p>
      </div>
    );
  }

  if (showEdit) {
    return (
      <EditTemplateModal
        template={template}
        onClose={() => setShowEdit(false)}
        onSave={async (updated) => {
          await base44.entities.WorkoutTemplate.update(updated.id, updated);
          setTemplate(updated);
          setShowEdit(false);
        }}
      />
    );
  }

  const lastPerformed = template.lastPerformed
    ? `Last Performed: ${daysAgo(template.lastPerformed)}`
    : 'Not performed yet';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" style={{ animation: 'none' }}>
      <div className="relative bg-white rounded-3xl w-[90%] max-h-[85vh] flex flex-col shadow-2xl mx-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
          <h2 className="font-bold text-base tracking-wide text-gray-900">{template.name}</h2>
          <button
            onClick={() => setShowEdit(true)}
            className="text-blue-500 font-semibold text-sm hover:text-blue-600 transition"
          >
            Edit
          </button>
        </div>

        <p className="px-5 pt-3 pb-1 text-sm text-gray-400">{lastPerformed}</p>

        <div className="px-5 py-3 space-y-3 overflow-y-auto flex-1">
          {template.exerciseList?.map((exercise, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm leading-snug">{exercise.sets} × {exercise.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{exercise.muscle}</p>
              </div>
              {exercise.history && exercise.history.length > 0 && (
                <div className="w-16 h-8 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={exercise.history.slice(-3).map(h => ({ v: typeof h === 'object' ? h.kg : h }))}>
                      <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={<HollowDot />} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
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
    </div>
  );
}