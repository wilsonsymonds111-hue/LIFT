import { useState } from 'react';
import TemplateModal from '../components/TemplateModal';
import WorkoutSheet from '../components/WorkoutSheet';

const defaultTemplates = [
  { id: 1, name: 'CHEST', lastPerformed: '2026-05-20',
    exercises: 'Incline Bench Press (Barbell), Standing press, Pec Deck (Machine)...', exerciseList: [
    { name: 'Incline Bench Press (Barbell)', sets: 1, muscle: 'Chest', history: [{kg:72,reps:5},{kg:72,reps:6},{kg:72,reps:7},{kg:72,reps:8},{kg:72,reps:10}] },
    { name: 'Standing press', sets: 1, muscle: 'Chest', history: [40,42,45,45,48] },
    { name: 'Pec Deck (Machine)', sets: 1, muscle: 'Chest', history: [50,50,55,55,60] },
    { name: 'Tricep single arm extension', sets: 1, muscle: 'Arms', history: [20,22,22,25,25] },
    { name: 'Single arm overhead cable extension', sets: 1, muscle: 'Arms', history: [15,17,18,20,20] },
    { name: 'Lateral Raise (Dumbbell)', sets: 1, muscle: 'Shoulders', history: [12,12,14,14,16] },
  ]},
  { id: 2, name: 'BACK', lastPerformed: '2026-05-22',
    exercises: 'Isolateral dumbbell rows, Pullover (Machine), Iso-Lateral Row (Machine)...', exerciseList: [
    { name: 'Isolateral Dumbbell Rows', sets: 1, muscle: 'Back', history: [30,32,35,35,38] },
    { name: 'Pullover (Machine)', sets: 1, muscle: 'Back', history: [45,48,50,52,55] },
    { name: 'Iso-Lateral Row (Machine)', sets: 1, muscle: 'Back', history: [60,60,65,68,70] },
    { name: 'Shrug (Barbell)', sets: 1, muscle: 'Shoulders', history: [80,85,85,90,95] },
  ]},
  { id: 3, name: 'LEGS', lastPerformed: '2026-05-18',
    exercises: 'Smith Squat, Romanian Deadlift (Barbell), Standing Calf Raise (Machine)...', exerciseList: [
    { name: 'Smith Squat', sets: 1, muscle: 'Legs', history: [80,85,90,95,100] },
    { name: 'Romanian Deadlift (Barbell)', sets: 1, muscle: 'Legs', history: [70,75,75,80,85] },
    { name: 'Standing Calf Raise (Machine)', sets: 1, muscle: 'Legs', history: [60,60,65,65,70] },
  ]},
];

const exampleTemplates = [
  { id: 4, name: 'Strong 5x5', exercises: 'Squat, Bench Press, Barbell Row...', exerciseList: [
    { name: 'Squat', sets: 5, muscle: 'Legs', history: [90,95,100,100,105] },
    { name: 'Bench Press', sets: 5, muscle: 'Chest', history: [70,72,75,77,80] },
    { name: 'Barbell Row', sets: 5, muscle: 'Back', history: [65,65,70,72,75] },
  ]},
  { id: 5, name: 'Legs', exercises: 'Leg Press, Leg Curl, Leg Extension...', exerciseList: [
    { name: 'Leg Press', sets: 3, muscle: 'Legs', history: [100,110,115,120,125] },
    { name: 'Leg Curl', sets: 3, muscle: 'Legs', history: [40,42,45,45,48] },
    { name: 'Leg Extension', sets: 3, muscle: 'Legs', history: [35,38,40,42,45] },
  ]},
];

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [templates, setTemplates] = useState(() => {
    try {
      const s = localStorage.getItem('workout_templates');
      return s ? JSON.parse(s) : defaultTemplates;
    } catch { return defaultTemplates; }
  });

  const daysAgo = (dateStr) => {
    if (!dateStr) return null;
    // For date-only strings (no time), compare by calendar day to avoid timezone shifts
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    const date = isDateOnly ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = diffMs / 3600000;
    if (diffHrs < 24) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const handleSaveHistory = (id, snapshot, exerciseList) => {
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id !== id) return t;
        const sourceList = exerciseList || t.exerciseList;
        const newList = sourceList.map(ex => {
          const best = snapshot[ex.name];
          if (!best) return ex;
          return { ...ex, history: [...(ex.history || []), { kg: best.kg, reps: best.reps }] };
        });
        return { ...t, exerciseList: newList, lastPerformed: new Date().toISOString() };
      });
      localStorage.setItem('workout_templates', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-background">
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
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition">
          Start an Empty Workout
        </button>
      </div>

      {/* Templates Section */}
      <div className="px-4 py-6">

        {/* My Templates */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">My Templates ({templates.length})</h3>
            <button className="text-muted-foreground hover:text-foreground">⋯</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="bg-card border border-border rounded-lg p-4 cursor-pointer shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200" onClick={() => setSelectedTemplate(template)}>
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-foreground">{template.name}</h4>
                  <button className="text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>⋯</button>
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