import { useState, useRef, useEffect } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import TemplateModal from '../components/TemplateModal';
import WorkoutSheet from '../components/WorkoutSheet';
import NewTemplateModal from '../components/NewTemplateModal';
import { base44 } from '@/api/base44Client';

// Seed templates — written into code so they always exist regardless of DB changes.
// Each new user gets their own copies created on first open. They can delete them freely.
const SEED_TEMPLATES = [
  {
    name: 'UPPER',
    is_example: true,
    sort_order: 0,
    exercises: 'Incline Smith Press, Standing Chest Press, Dumbell Row, Cable Row, Tricep Pushdown (Cable), Bicep Curl (Dumbbell), Side Lateral Raise...',
    exerciseList: [
      { name: 'Incline Smith Press', sets: 1, muscle: 'Chest', history: [] },
      { name: 'Standing Chest Press', sets: 1, muscle: 'Chest', history: [] },
      { name: 'Dumbell Row', sets: 1, muscle: 'Back', history: [] },
      { name: 'Cable Row', sets: 1, muscle: 'Back', history: [] },
      { name: 'Tricep Pushdown (Cable)', sets: 1, muscle: 'Arms', history: [] },
      { name: 'Bicep Curl (Dumbbell)', sets: 1, muscle: 'Arms', history: [] },
      { name: 'Side Lateral Raise', sets: 1, muscle: 'Shoulders', history: [] },
    ],
  },
  {
    name: 'LEGS & ABS',
    is_example: true,
    sort_order: 1,
    exercises: 'Smith Squat, Romanian Deadlift (Barbell), Leg Extension (Machine), Standing Calf Raise (Machine), Toe to Bar, Cable Crunches...',
    exerciseList: [
      { name: 'Smith Squat', sets: 1, muscle: 'Legs', history: [] },
      { name: 'Romanian Deadlift (Barbell)', sets: 1, muscle: 'Legs', history: [] },
      { name: 'Leg Extension (Machine)', sets: 1, muscle: 'Legs', history: [] },
      { name: 'Standing Calf Raise (Machine)', sets: 1, muscle: 'Legs', history: [] },
      { name: 'Toe to Bar', sets: 1, muscle: 'Other', history: [] },
      { name: 'Cable Crunches', sets: 1, muscle: 'Other', history: [] },
    ],
  },
];

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load templates from DB on mount, seeding example templates for first-time users
  useEffect(() => {
    const loadTemplates = async () => {
      const data = await base44.entities.WorkoutTemplate.list('sort_order', 100);
      if (data && data.length > 0) {
        setTemplates(data);
      } else {
        // First time opening — seed example templates into this user's DB
        const seeded = await Promise.all(
          SEED_TEMPLATES.map(t => base44.entities.WorkoutTemplate.create(t))
        );
        setTemplates(seeded);
      }
      setLoading(false);
    };
    loadTemplates();
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
    <div className="min-h-screen bg-background">
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

      {/* Page Title */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-3xl font-extrabold text-gray-900">Workouts</h1>
      </div>

      {/* Quick Start Section */}
      <div className="px-4 py-4">
      <button
        onClick={() => setActiveWorkout({ id: 'empty-' + Date.now(), name: 'Evening Workout', exerciseList: [] })}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
      >
        Start an Empty Workout
      </button>
      </div>

      {/* Templates Section */}
      <div className="px-4 py-6">

        {/* My Templates */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">My Current Split ({templates.length})</h3>
            <button
              onClick={() => setShowNewTemplate(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Template
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="relative bg-card border border-border rounded-lg p-4 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200">
                <div className="flex items-start justify-between mb-3" onClick={() => setSelectedTemplate(template)}>
                  <h4 className="font-bold text-foreground flex-1 cursor-pointer">{template.name}</h4>
                  <button
                    onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === template.id ? null : template.id); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition flex-shrink-0 -mt-1 -mr-1"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div onClick={() => setSelectedTemplate(template)} className="cursor-pointer">
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.exercises}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    ⏱ {template.lastPerformed ? daysAgo(template.lastPerformed) : template.days}
                  </p>
                </div>
                {openMenuId === template.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                    <div className="absolute top-10 right-3 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[140px]">
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
        {templates.some(t => t.is_example) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Example Templates ({templates.filter(t => t.is_example).length})</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.filter(t => t.is_example).map((template) => (
                <div key={template.id} className="bg-card border border-border rounded-lg p-4 cursor-pointer shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200" onClick={() => setSelectedTemplate(template)}>
                  <h4 className="font-bold text-foreground mb-2">{template.name}</h4>
                  <p className="text-sm text-muted-foreground">{template.exercises}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}