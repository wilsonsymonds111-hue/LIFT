import { useState } from 'react';
import { Plus } from 'lucide-react';
import TemplateModal from '../components/TemplateModal';
import WorkoutSheet from '../components/WorkoutSheet';
import NewTemplateModal from '../components/NewTemplateModal';

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

const exampleTemplates = [
  { id: 4, name: 'Strong 5x5', exercises: 'Squat, Bench Press, Barbell Row...', exerciseList: [
    { name: 'Squat', sets: 5, muscle: 'Legs', history: [] },
    { name: 'Bench Press', sets: 5, muscle: 'Chest', history: [] },
    { name: 'Barbell Row', sets: 5, muscle: 'Back', history: [] },
  ]},
  { id: 5, name: 'Legs', exercises: 'Leg Press, Leg Curl, Leg Extension...', exerciseList: [
    { name: 'Leg Press', sets: 3, muscle: 'Legs', history: [] },
    { name: 'Leg Curl', sets: 3, muscle: 'Legs', history: [] },
    { name: 'Leg Extension', sets: 3, muscle: 'Legs', history: [] },
  ]},
];

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [templates, setTemplates] = useState(() => {
    try {
      const s = localStorage.getItem('workout_templates');
      return s ? JSON.parse(s) : defaultTemplates;
    } catch { return defaultTemplates; }
  });

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

  const handleSaveHistory = (id, snapshot, exerciseList) => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id !== id) return t;
        const today = new Date().toISOString().slice(0, 10);
        // Use the full exerciseList from the workout session (includes newly added exercises)
        // Fall back to existing template list if not provided
        const sessionList = exerciseList || t.exerciseList;
        const newList = sessionList.map(ex => {
          const best = snapshot[ex.name];
          if (!best) return ex;
          return { ...ex, history: [...(ex.history || []), { kg: best.kg, reps: best.reps, date: today }] };
        });
        return { ...t, exerciseList: newList, lastPerformed: new Date().toISOString() };
      });
      localStorage.setItem('workout_templates', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {showNewTemplate && (
        <NewTemplateModal
          onClose={() => setShowNewTemplate(false)}
          onSave={(template) => {
            setTemplates(prev => { const updated = [...prev, template]; localStorage.setItem('workout_templates', JSON.stringify(updated)); return updated; });
            setShowNewTemplate(false);
          }}
        />
      )}
      <TemplateModal
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onStartWorkout={(t) => { setActiveWorkout(t); setSelectedTemplate(null); }}
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
            <h3 className="font-semibold text-foreground">My Templates ({templates.length})</h3>
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
              <div key={template.id} className="bg-card border border-border rounded-lg p-4 cursor-pointer shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200" onClick={() => setSelectedTemplate(template)}>
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-foreground">{template.name}</h4>

                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.exercises}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  ⏱ {template.lastPerformed ? daysAgo(template.lastPerformed) : template.days}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Example Templates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Example Templates ({exampleTemplates.length})</h3>
            <button className="text-muted-foreground hover:text-foreground">⋯</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleTemplates.map((template) => (
              <div key={template.id} className="bg-card border border-border rounded-lg p-4 cursor-pointer shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200" onClick={() => setSelectedTemplate(template)}>
                <h4 className="font-bold text-foreground mb-2">{template.name}</h4>
                <p className="text-sm text-muted-foreground">{template.exercises}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}