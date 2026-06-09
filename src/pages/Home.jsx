import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Dumbbell, Zap } from 'lucide-react';
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

  const iconColors = ['#30d158', '#0a84ff', '#ff9f0a', '#ff375f', '#bf5af2', '#32ade6'];

  return (
    <div className="min-h-screen pb-10" style={{ background: '#f2f2f7', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
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

      {/* Large iOS-style header */}
      <div className="px-5 pt-14 pb-1">
        <h1 style={{ fontSize: '34px', fontWeight: '700', letterSpacing: '-0.5px', color: '#000', lineHeight: 1.1 }}>
          Summary
        </h1>
      </div>

      <div className="px-4 pt-4 space-y-6">

        {/* Quick Start — styled as a prominent tappable card */}
        <button
          onClick={() => setActiveWorkout({ id: 'empty-' + Date.now(), name: 'Evening Workout', exerciseList: [] })}
          className="w-full text-left bg-white rounded-2xl px-4 py-4 shadow-sm flex items-center gap-3 active:opacity-70 transition"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#0a84ff' }}>
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-[15px]">Quick Start</p>
            <p className="text-sm text-gray-400 mt-0.5">Start an empty workout now</p>
          </div>
          <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* My Current Split */}
        <div>
          <div className="flex items-end justify-between mb-2 px-1">
            <span style={{ fontSize: '20px', fontWeight: '600', color: '#000', letterSpacing: '-0.3px' }}>My Current Split</span>
            <button onClick={() => setShowNewTemplate(true)} className="text-[15px] font-medium" style={{ color: '#0a84ff' }}>
              Edit
            </button>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {templates.map((template, idx) => (
              <div key={template.id} className="relative">
                {idx > 0 && <div className="h-px mx-4" style={{ background: '#e5e5ea' }} />}
                <div
                  className="flex items-center px-4 py-3.5 active:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  {/* Colored icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mr-3"
                    style={{ background: iconColors[idx % iconColors.length] }}
                  >
                    <Dumbbell className="w-4 h-4 text-white" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-[15px]">{template.name}</p>
                      <span className="text-xs flex-shrink-0" style={{ color: '#8e8e93' }}>
                        {template.lastPerformed ? daysAgo(template.lastPerformed) : ''}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5 truncate" style={{ color: '#8e8e93' }}>{template.exercises}</p>
                  </div>

                  <svg className="w-4 h-4 ml-2 flex-shrink-0" style={{ color: '#c7c7cc' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
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
          <p className="text-xs px-2 mt-1.5" style={{ color: '#8e8e93' }}>Tap a template to view details or start your workout.</p>
        </div>

        {/* Example Templates */}
        <div>
          <div className="flex items-end justify-between mb-2 px-1">
            <span style={{ fontSize: '20px', fontWeight: '600', color: '#000', letterSpacing: '-0.3px' }}>Example Templates</span>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {templates.filter(t => exampleTemplateIds.includes(t.id)).map((template, idx) => (
              <div key={template.id}>
                {idx > 0 && <div className="h-px mx-4" style={{ background: '#e5e5ea' }} />}
                <div
                  className="flex items-center px-4 py-3.5 active:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mr-3"
                    style={{ background: iconColors[(idx + 3) % iconColors.length] }}
                  >
                    <Dumbbell className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-[15px]">{template.name}</p>
                    <p className="text-sm mt-0.5 truncate" style={{ color: '#8e8e93' }}>{template.exercises}</p>
                  </div>
                  <svg className="w-4 h-4 ml-2 flex-shrink-0" style={{ color: '#c7c7cc' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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