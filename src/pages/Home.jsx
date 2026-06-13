import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import TemplateDetailModal from '../components/TemplateDetailModal';
import ProfileSheet from '../components/ProfileSheet';

const relativeTime = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 60000) return 'Just now';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

export default function Home() {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('profilePhoto') || null);

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

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const { pullY, refreshing } = usePullToRefresh(loadTemplates);

  const handleDeleteTemplate = async (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    setOpenMenuId(null);
    await base44.entities.WorkoutTemplate.delete(id);
  };

  // --- Split categorization ---
  const hasActiveSplit = templates.some(t => t.isActiveSplit === true);
  const currentSplit = hasActiveSplit
    ? templates.filter(t => t.isActiveSplit === true)
    : templates.filter(t => !t.splitGroup || t.splitGroup === '');

  const currentSplitName = currentSplit.length > 0
    ? currentSplit.map(t => t.name.replace(/ Workout$/, '').replace(/ Body$/, '')).join(' / ').toUpperCase()
    : '';

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
      <div className="px-4 pb-3 flex items-center justify-between" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' }}>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground leading-tight">Workouts</h1>
        </div>
        <button
          onClick={() => setShowProfile(true)}
          className="w-10 h-10 rounded-full overflow-hidden shadow-md active:scale-95 transition-transform flex-shrink-0 border-2 border-border"
        >
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary">
              <UserCircle className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </button>
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

      {/* ==================== CURRENT SPLIT (Spotlight) ==================== */}
      <div className="relative px-4 py-2">
        {/* Multi-layered glow for depth */}
        <div className="absolute -inset-12 bg-gradient-to-br from-blue-500/10 via-blue-400/6 to-cyan-400/4 rounded-[4rem] blur-3xl pointer-events-none" />
        <div className="absolute -inset-4 bg-blue-400/8 rounded-[2.5rem] blur-2xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-400/5 rounded-[2rem] blur-xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="w-2 h-2 rounded-full bg-blue-500"
                />
                <h3 className="font-semibold text-foreground text-sm">Current Split</h3>
              </div>
              {currentSplitName && (
                <h2 className="text-xl font-extrabold text-foreground tracking-tight">{currentSplitName}</h2>
              )}
            </div>
          </div>

          {currentSplit.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSplit.map((template) => (
                <div
                  key={template.id}
                  className="relative bg-card border border-blue-400/30 rounded-xl p-4 shadow-lg shadow-blue-500/10 ring-1 ring-blue-400/10 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3" onClick={() => setSelectedTemplate(template)}>
                    <h4 className="font-bold text-foreground flex-1 cursor-pointer">{template.name}</h4>
                    <button
                      onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === template.id ? null : template.id); }}
                      className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition flex-shrink-0 select-none -mt-1 -mr-1"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div onClick={() => setSelectedTemplate(template)} className="cursor-pointer">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.exercises}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      ⏱ {template.lastPerformed ? relativeTime(template.lastPerformed) : 'Not yet performed'}
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
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-1">No current split</p>
              <p className="text-sm">Go to the Splits tab to choose one.</p>
            </div>
          )}
        </div>
      </div>

      {showProfile && (
        <ProfileSheet
          onClose={() => setShowProfile(false)}
          darkMode={darkMode}
          onToggleDark={handleToggleDark}
          profilePhoto={profilePhoto}
          onPhotoChange={setProfilePhoto}
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