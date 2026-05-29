import { useState } from 'react';
import { Search } from 'lucide-react';
import TemplateModal from '../components/TemplateModal';
import WorkoutSheet from '../components/WorkoutSheet';

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);

  const templates = [
    { id: 1, name: 'CHEST', days: '12 days ago', exercises: 'Incline Bench Press (Barbell), Standing press, Pec Deck (Machine)...', exerciseList: [
      { name: 'Incline Bench Press (Barbell)', sets: 1, muscle: 'Chest', history: [60,65,65,70,72] },
      { name: 'Standing press', sets: 1, muscle: 'Chest', history: [40,42,45,45,48] },
      { name: 'Pec Deck (Machine)', sets: 1, muscle: 'Chest', history: [50,50,55,55,60] },
      { name: 'Tricep single arm extension', sets: 1, muscle: 'Arms', history: [20,22,22,25,25] },
      { name: 'Single arm overhead cable extension', sets: 1, muscle: 'Arms', history: [15,17,18,20,20] },
      { name: 'Lateral Raise (Dumbbell)', sets: 1, muscle: 'Shoulders', history: [12,12,14,14,16] },
    ]},
    { id: 2, name: 'BACK', days: '10 days ago', exercises: 'Isolateral dumbbell rows, Pullover (Machine), Iso-Lateral Row (Machine)...', exerciseList: [
      { name: 'Isolateral Dumbbell Rows', sets: 1, muscle: 'Back', history: [30,32,35,35,38] },
      { name: 'Pullover (Machine)', sets: 1, muscle: 'Back', history: [45,48,50,52,55] },
      { name: 'Iso-Lateral Row (Machine)', sets: 1, muscle: 'Back', history: [60,60,65,68,70] },
      { name: 'Shrug (Barbell)', sets: 1, muscle: 'Shoulders', history: [80,85,85,90,95] },
    ]},
    { id: 3, name: 'LEGS', days: '14 days ago', exercises: 'Smith Squat, Romanian Deadlift (Barbell), Standing Calf Raise (Machine)...', exerciseList: [
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <TemplateModal
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onStartWorkout={(t) => { setActiveWorkout(t); setSelectedTemplate(null); }}
      />
      <WorkoutSheet template={activeWorkout} onFinish={() => setActiveWorkout(null)} />

      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-foreground">Start Workout</h1>
          <button className="p-2 hover:bg-secondary rounded-lg transition">
            <Search className="w-6 h-6 text-primary" />
          </button>
        </div>
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
            <h3 className="font-semibold text-foreground">My Templates (3)</h3>
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
                  ⏱ {template.days}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Example Templates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Example Templates (5)</h3>
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