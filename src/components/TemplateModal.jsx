import { X } from 'lucide-react';

export default function TemplateModal({ template, onClose }) {
  if (!template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-t-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          <h2 className="font-bold text-lg text-gray-900">{template.name}</h2>
          <button className="text-blue-500 font-medium text-sm hover:text-blue-600 transition">Edit</button>
        </div>

        {template.days && (
          <p className="px-4 pb-3 text-sm text-gray-500">Last Performed: {template.days}</p>
        )}

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {template.exerciseList?.map((exercise, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                  {exercise.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{exercise.sets} × {exercise.name}</p>
                  <p className="text-xs text-gray-500">{exercise.muscle}</p>
                </div>
              </div>
              <button className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-sm font-bold flex-shrink-0">
                ?
              </button>
            </div>
          ))}
        </div>

        {/* Start Workout Button */}
        <div className="px-4 pb-6 pt-2">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition">
            Start Workout
          </button>
        </div>
      </div>
    </div>
  );
}