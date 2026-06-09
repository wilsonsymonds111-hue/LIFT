import { useState, useRef, useEffect } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import TemplateModal from '../components/TemplateModal';
import WorkoutSheet from '../components/WorkoutSheet';
import NewTemplateModal from '../components/NewTemplateModal';
import { base44 } from '@/api/base44Client';

const defaultTemplates = [
  { id: 1, name: 'CHEST', lastPerformed: null,
    exercises: 'Incline Bench Press (Barbell), Standing press, Pec Deck (Machine)...', exerciseList: [
    { name: 'Incline Bench Press (Barbell)', sets: 1, muscle: 'Chest', history: [] },
    { name: 'Standing press', sets: 1, muscle: 'Chest', history: [] },
    { name: 'Pec Deck (Machine)', sets: 1, muscle: 'Chest', history: [] },
    { name: 'Tricep single arm extension', sets: 1, muscle: 'Arms', history: [] },
    { name: 'Single arm overhead cable extension', sets: 1, muscle: 'Arms', history: [] },
    { name: 'Lateral Raise (Dumbbell)', sets: 1, muscle: 'Shoulders', history: [] },
  ]},
  { id: 2, name: 'BACK', lastPerformed: null,
    exercises: 'Isolateral dumbbell rows, Pullover (Machine), Iso-Lateral Row (Machine)...', exerciseList: [
    { name: 'Isolateral Dumbbell Rows', sets: 1, muscle: 'Back', history: [] },
    { name: 'Pullover (Machine)', sets: 1, muscle: 'Back', history: [] },
    { name: 'Iso-Lateral Row (Machine)', sets: 1, muscle: 'Back', history: [] },
    { name: 'Shrug (Barbell)', sets: 1, muscle: 'Shoulders', history: [] },
  ]},
  { id: 3, name: 'LEGS', lastPerformed: null,
    exercises: 'Smith Squat, Romanian Deadlift (Barbell), Standing Calf Raise (Machine)...', exerciseList: [
    { name: 'Smith Squat', sets: 1, muscle: 'Legs', history: [] },
    { name: 'Romanian Deadlift (Barbell)', sets: 1, muscle: 'Legs', history: [] },
    { name: 'Standing Calf Raise (Machine)', sets: 1, muscle: 'Legs', history: [] },
  ]},
];

const exampleTemplateIds = ['6a27320b7970367d6da1521b', '6a2732c911e6a46fa1192d44'];

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load templates from DB on mount
  useEffect(() => {
    base44.entities.WorkoutTemplate.list('sort_order', 100).then(data => {
      if (data && data.length > 0) {
        setTemplates(data);
      }
      setLoading(false);
    });
  }, []);

  const daysAgo = (dateStr) => {
    if (!dateStr) return null;
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    const date = isDateOnly ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    const timeStr = isDateOnly ? '' : ' at ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    if (diffDays === 0) return 'Today' + timeStr;
    if (diffDays === 1) return 'Yesterday' + timeStr;
    return `${diffDays} days ago${timeStr}`;
  };

  const handleDeleteTemplate = async (id) => {
    await base44.entities.WorkoutTemplate.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    setOpenMenuId(null);
  };

  const handleSaveHistory = async (id, snapshot, exerciseList) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    const today = new Date().toISOString().slice(0, 10);
    const sessionList = exerciseList || template.exerciseList;
    const newList = sessionList.map(ex => {
      const best = snapshot[ex.name];
      if (!best) return ex;
      return { ...ex, history: [...(ex.history || []), { kg: best.kg, reps: best.reps, date: today }] };
    });
    const updated = { ...template, exerciseList: newList, lastPerformed: new Date().toISOString() };
    await base44.entities.WorkoutTemplate.update(id, updated);
    setTemplates(prev => prev.map(t => t.id === id ? updated : t));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f2f2f7' }}>
      {showNewTemplate && (
        <NewTemplateModal
          onClose={() => setShowNewTemplate(false)}
          onSave={async (template) => {
            const created = await base44.entities.WorkoutTemplate.create({ ...template, sort_order: templates.length });
            setTemplates(prev => [...prev, created]);
            setShowNewTemplate(false);
          }}
        />
      )}
      <TemplateModal
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onStartWorkout={(t) => { setActiveWorkout(t); setSelectedTemplate(null); }}
        onSaveEdit={async (updated) => {
          await base44.entities.WorkoutTemplate.update(updated.id, updated);
          setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
          setSelectedTemplate(updated);
        }}
      />
      <WorkoutSheet
        key={activeWorkout?.id}
        template={activeWorkout}
        onFinish={() => setActiveWorkout(null)}
        onSaveHistory={handleSaveHistory}
      />

      {/* Header */}
      <div className="px-4 pt-12 pb-2">
        <h1 className="text-3xl font-bold text-gray-900" style={{ letterSpacing: '-0.5px' }}>Workouts</h1>
      </div>

      <div className="px-4 py-3 space-y-8">

        {/* Quick Start */}
        <div>
          <button
            onClick={() => setActiveWorkout({ id: 'empty-' + Date.now(), name: 'Evening Workout', exerciseList: [] })}
            className="w-full bg-blue-500 active:bg-blue-600 text-white font-semibold py-3.5 rounded-2xl text-base transition"
          >
            Start an Empty Workout
          </button>
        </div>

        {/* My Current Split */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[17px] font-semibold text-gray-900">My Current Split</span>
            <button
              onClick={() => setShowNewTemplate(true)}
              className="flex items-center gap-1 text-blue-500 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {templates.map((template, idx) => (
              <div key={template.id} className="relative">
                {idx > 0 && <div className="h-px bg-gray-100 mx-4" />}
                <div
                  className="flex items-center justify-between px-4 py-4 active:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold text-gray-900 text-[15px]">{template.name}</p>
                    <p className="text-sm text-gray-400 mt-0.5 truncate">{template.exercises}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {template.lastPerformed ? `Last performed ${daysAgo(template.lastPerformed)}` : 'Not performed yet'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === template.id ? null : template.id); }}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                {openMenuId === template.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                    <div className="absolute top-10 right-3 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px]">
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 font-medium hover:bg-red-50 transition"
                      >
                        Delete Template
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Example Templates */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[17px] font-semibold text-gray-900">Example Templates</span>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {templates.filter(t => exampleTemplateIds.includes(t.id)).map((template, idx, arr) => (
              <div key={template.id}>
                {idx > 0 && <div className="h-px bg-gray-100 mx-4" />}
                <div
                  className="flex items-center justify-between px-4 py-4 active:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold text-gray-900 text-[15px]">{template.name}</p>
                    <p className="text-sm text-gray-400 mt-0.5 truncate">{template.exercises}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}