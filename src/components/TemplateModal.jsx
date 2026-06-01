import { X } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const HollowDot = (props) => {
  const { cx, cy } = props;
  return (
    <circle cx={cx} cy={cy} r={3} fill="white" stroke="#3b82f6" strokeWidth={1.5} />
  );
};

export default function TemplateModal({ template, onClose, onStartWorkout }) {
  if (!template) return null;

  const handleStart = () => {
    onStartWorkout?.(template);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-3xl w-[90%] max-h-[85vh] flex flex-col shadow-2xl mx-auto">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
          <h2 className="font-bold text-base tracking-wide text-gray-900">{template.name}</h2>
          <button className="text-blue-500 font-semibold text-sm hover:text-blue-600 transition">Edit</button>
        </div>

        {template.days && (
          <p className="px-5 py-2 text-sm text-gray-500">Last Performed: {template.days}</p>
        )}

        {/* Exercise List */}
        <div className="px-5 py-3 space-y-3 overflow-hidden">
          {template.exerciseList?.map((exercise, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm leading-snug">{exercise.sets} × {exercise.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{exercise.muscle}</p>
              </div>

              {/* Mini sparkline */}
              {exercise.history && (
                <div className="w-16 h-8 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={exercise.history.map(v => ({ v }))}>
                      <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={<HollowDot />} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Start Workout Button */}
        <div className="px-5 py-5">
          <button onClick={handleStart} className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-2xl text-base transition">
            Start Workout
          </button>
        </div>
      </div>
    </div>
  );
}