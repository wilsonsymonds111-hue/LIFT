import { useState, useEffect, useCallback } from 'react';
import { Plus, MoreVertical, UserCircle, Zap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import TemplateDetailModal from '../components/TemplateDetailModal';
import ProfileSheet from '../components/ProfileSheet';

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
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const handleToggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('darkMode', String(next));
  };

  const loadTemplates = useCallback(async () => {
    const data = await base44.entities.WorkoutTemplate.list('sort_order', 100);
    if (data) setTemplates(data);
    setLoading(false);
  }, []);

  const myTemplates = templates;

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
        <div className="w-8 h-8 border-4 border-muted border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />

      {/* Header */}
      <div className="px-5 flex items-center justify-between" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))', paddingBottom: '0.75rem' }}>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Workouts</h1>
        <button
          onClick={() => setShowProfile(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground text-background active:scale-90 transition-transform"
        >
          <UserCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Start */}
      <div className="px-5 pt-2 pb-5">
        <button
          onClick={() => navigate('/active-workout/empty-' + Date.now())}
          className="w-full flex items-center justify-between bg-blue-500 active:bg-blue-600 text-white font-bold py-4 px-5 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-500/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-base">Start Empty Workout</span>
          </div>
          <ChevronRight className="w-5 h-5 opacity-70" />
        </button>
      </div>

      {/* My Templates */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-foreground">My Split</h2>
            <p className="text-xs text-muted-foreground">{myTemplates.length} workout{myTemplates.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => navigate('/template/new')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-foreground text-background text-xs font-bold transition active:scale-95"
          >
            <Plus className="w-3 h-3" />
            New
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {myTemplates.map((template) => (
            <div
              key={template.id}
              className="relative bg-card border border-border rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-foreground text-base leading-snug flex-1 pr-2">{template.name}</h4>
                  <button
                    onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === template.id ? null : template.id); }}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted transition flex-shrink-0 -mt-0.5 -mr-1"
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{template.exercises}</p>
              </div>
              <div className="px-4 pb-3 flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  {template.lastPerformed ? `Last: ${daysAgo(template.lastPerformed)}` : 'Not yet performed'}
                </span>
              </div>

              {openMenuId === template.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
                  <div className="absolute top-10 right-3 z-20 bg-card rounded-xl shadow-xl border border-border py-1 min-w-[150px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition"
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
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">🏋️</div>
            <p className="text-base font-semibold mb-1">No templates yet</p>
            <p className="text-sm">Tap "New" to create your first split.</p>
          </div>
        )}
      </div>

      {showProfile && (
        <ProfileSheet
          onClose={() => setShowProfile(false)}
          darkMode={darkMode}
          onToggleDark={handleToggleDark}
        />
      )}

      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onSave={(updated) => {
            setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
            setSelectedTemplate(updated);
          }}
          onStartWorkout={(id) => navigate(`/active-workout/${id}`)}
        />
      )}
    </div>
  );
}