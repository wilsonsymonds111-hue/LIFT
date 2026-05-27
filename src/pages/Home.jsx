import { useState } from 'react';
import { Search } from 'lucide-react';
import TemplateModal from '../components/TemplateModal';

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    { id: 1, name: 'CHEST', days: '12 days ago', exercises: 'Incline Bench Press (Barbell), Standing press, Pec Deck (Machine)...', exerciseList: [
      { name: 'Incline Bench Press (Barbell)', sets: 1, muscle: 'Chest' },
      { name: 'Standing press', sets: 1, muscle: 'Chest' },
      { name: 'Pec Deck (Machine)', sets: 1, muscle: 'Chest' },
      { name: 'Tricep single arm extension', sets: 1, muscle: 'Arms' },
      { name: 'Single arm overhead cable extension', sets: 1, muscle: 'Arms' },
      { name: 'Lateral Raise (Dumbbell)', sets: 1, muscle: 'Shoulders' },
    ]},
    { id: 2, name: 'BACK', days: '10 days ago', exercises: 'Isolateral dumbbell rows, Pullover (Machine), Iso-Lateral Row (Machine)...', exerciseList: [
      { name: 'Isolateral Dumbbell Rows', sets: 1, muscle: 'Back' },
      { name: 'Pullover (Machine)', sets: 1, muscle: 'Back' },
      { name: 'Iso-Lateral Row (Machine)', sets: 1, muscle: 'Back' },
      { name: 'Shrug (Barbell)', sets: 1, muscle: 'Shoulders' },
    ]},
    { id: 3, name: 'LEGS', days: '14 days ago', exercises: 'Smith Squat, Romanian Deadlift (Barbell), Standing Calf Raise (Machine)...', exerciseList: [
      { name: 'Smith Squat', sets: 1, muscle: 'Legs' },
      { name: 'Romanian Deadlift (Barbell)', sets: 1, muscle: 'Legs' },
      { name: 'Standing Calf Raise (Machine)', sets: 1, muscle: 'Legs' },
    ]},
  ];

  const exampleTemplates = [
    { id: 4, name: 'Strong 5x5', exercises: 'Squat, Bench Press, Barbell Row...', exerciseList: [
      { name: 'Squat', sets: 5, muscle: 'Legs' },
      { name: 'Bench Press', sets: 5, muscle: 'Chest' },
      { name: 'Barbell Row', sets: 5, muscle: 'Back' },
    ]},
    { id: 5, name: 'Legs', exercises: 'Leg Press, Leg Curl, Leg Extension...', exerciseList: [
      { name: 'Leg Press', sets: 3, muscle: 'Legs' },
      { name: 'Leg Curl', sets: 3, muscle: 'Legs' },
      { name: 'Leg Extension', sets: 3, muscle: 'Legs' },
    ]},
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <TemplateModal template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />

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
              <div key={template.id} className="bg-card border border-border rounded-lg p-4 cursor-pointer" onClick={() => setSelectedTemplate(template)}>
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
              <div key={template.id} className="bg-card border border-border rounded-lg p-4 cursor-pointer" onClick={() => setSelectedTemplate(template)}>
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