import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const templates = [
    { id: 1, name: 'CHEST', exercises: 'Incline Bench Press (Barbell), Standing press, Pec Deck (Machine), Tricep si...', days: '12 days ago' },
    { id: 2, name: 'BACK', exercises: 'Isolateral dumbbell rows, Pullover (Machine), Iso-Lateral Row (Machine), Shr...', days: '10 days ago' },
    { id: 3, name: 'LEGS', exercises: 'Smith Squat, Romanian Deadlift (Barbell), Standing Calf Raise (Machine...', days: '14 days ago' },
  ];

  const exampleTemplates = [
    { id: 4, name: 'Strong 5x5', exercises: 'Squat, Bench Press, Barbell Row...' },
    { id: 5, name: 'Legs', exercises: 'Leg Press, Leg Curl, Leg Extension...' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">New in 6.0</p>
            <h1 className="text-4xl font-bold text-foreground">Start Workout</h1>
          </div>
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
              <div key={template.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-foreground">{template.name}</h4>
                  <button className="text-muted-foreground hover:text-foreground">⋯</button>
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
              <div key={template.id} className="bg-card border border-border rounded-lg p-4">
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