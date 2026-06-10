import { useState, useEffect, useCallback } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { base44 } from '@/api/base44Client';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';

const exampleTemplateIds = ['6a27320b7970367d6da1521b', '6a2732c911e6a46fa1192d44'];

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

export default function Home() {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    const data = await base44.entities.WorkoutTemplate.list('sort_order', 100);
    if (data) setTemplates(data);
    setLoading(false);
  }, []);

  const myTemplates = templates.filter(t => !exampleTemplateIds.includes(t.id));
  const exampleTemplates = templates.filter(t => exampleTemplateIds.includes(t.id));

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const { pullY, refreshing } = usePullToRefresh(loadTemplates);

  const handleDeleteTemplate = async (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    setOpenMenuId(null);
    await base44.entities.WorkoutTemplate.delete(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />

      {/* Page Title */}
      <div className="px-4 pb-2" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
        <h1 className="text-3xl font-extrabold text-gray-900">Workouts</h1>
      </div>

      {/* Quick Start */}
      <div className="px-4 py-4">
        <button
          onClick={() => navigate('/active-workout/empty-' + Date.now())}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
        >
          Start an Empty Workout
        </button>
      </div>

      {/* Templates Section */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">My Current Split ({myTemplates.length})</h3>
          <button
            onClick={() => navigate('/template/new')}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myTemplates.map((template) => (
            <div key={template.id} className="relative bg-card border border-border rounded-lg p-4 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200">
              <div className="flex items-start justify-between mb-3" onClick={() => navigate(`/template/${template.id}`)}>
                <h4 className="font-bold text-foreground flex-1 cursor-pointer">{template.name}</h4>
                <button
                  onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === template.id ? null : template.id); }}
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition flex-shrink-0 select-none -mt-1 -mr-1"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div onClick={() => navigate(`/template/${template.id}`)} className="cursor-pointer">
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.exercises}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  ⏱ {template.lastPerformed ? daysAgo(template.lastPerformed) : 'Not yet performed'}
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

        {myTemplates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium mb-1">No templates yet</p>
            <p className="text-sm">Create your first workout template to get started.</p>
          </div>
        )}
      </div>

      {/* Example Templates */}
      {exampleTemplates.length > 0 && (
        <div className="px-4 py-2 mb-4">
          <h3 className="font-semibold text-foreground mb-4">Example Templates ({exampleTemplates.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleTemplates.map((template) => (
              <div key={template.id} className="bg-card border border-border rounded-lg p-4 cursor-pointer shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200" onClick={() => navigate(`/template/${template.id}`)}>
                <h4 className="font-bold text-foreground mb-2">{template.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{template.exercises}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}