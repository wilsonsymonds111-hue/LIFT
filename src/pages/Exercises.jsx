import { Search } from 'lucide-react';

export default function Exercises() {
  const exercises = [
    { id: 1, name: 'Bench Press', muscle: 'Chest' },
    { id: 2, name: 'Squat', muscle: 'Legs' },
    { id: 3, name: 'Deadlift', muscle: 'Back' },
    { id: 4, name: 'Dumbbell Rows', muscle: 'Back' },
    { id: 5, name: 'Leg Press', muscle: 'Legs' },
    { id: 6, name: 'Pull-ups', muscle: 'Back' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Exercises</h1>
          </div>
          <button className="p-2 hover:bg-secondary rounded-lg transition">
            <Search className="w-6 h-6 text-primary" />
          </button>
        </div>
      </div>

      {/* Exercises List */}
      <div className="px-4 space-y-3">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="bg-card border border-border rounded-lg p-4 hover:bg-secondary/50 transition cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{exercise.name}</h3>
                <p className="text-sm text-muted-foreground">{exercise.muscle}</p>
              </div>
              <button className="text-muted-foreground hover:text-foreground">⋯</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}