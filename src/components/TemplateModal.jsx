import { X } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';

export default function TemplateModal({ template, onClose }) {
  if (!template) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-3xl w-[90%] max-h-[85vh] flex flex-col shadow-2xl mx-auto mb-8">

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
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4">
          {template.exerciseList?.map((exercise, idx) => (
            <div key={idx} className="flex items-center gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm leading-tight">{exercise.sets} × {exercise.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{exercise.muscle}</p>
              </div>

              {/* Mini chart */}
              {exercise.history && (
                <div className="w-14 h-8 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={exercise.history.map(v => ({ v }))} barSize={4}>
                      <Bar dataKey="v" fill="#3b82f6" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Start Workout Button */}
        <div className="px-5 py-5">
          <button className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-2xl text-base transition">
            Start Workout
          </button>
        </div>
      </div>
    </div>
  );
}