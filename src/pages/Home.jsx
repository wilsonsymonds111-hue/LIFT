import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import ProfileButton from '../components/ProfileButton';
import WeekTracker from '../components/WeekTracker';
import { EXAMPLE_SPLITS_DATA } from '../lib/splitData';

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
  const location = useLocation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef({});

  const loadTemplates = useCallback(async () => {
    const data = await base44.entities.WorkoutTemplate.list('sort_order', 100);
    if (data) setTemplates(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);
  // Re-fetch when navigating back to this tab (e.g., after changing split on Splits tab)
  useEffect(() => {
    if (location.pathname === '/') loadTemplates();
  }, [location.pathname, loadTemplates]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current[menuOpen]?.contains(e.target)) return;
      setMenuOpen(null);
    };
    const timer = setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', close);
    };
  }, [menuOpen]);

  const { pullY, refreshing } = usePullToRefresh(loadTemplates);

  const handleDeleteTemplate = async (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    await base44.entities.WorkoutTemplate.delete(id);
  };

  const handleRemoveFromSplit = async (template) => {
    setMenuOpen(null);
    setTemplates(prev => prev.filter(t => t.id !== template.id));
    await base44.entities.WorkoutTemplate.update(template.id, {
      isActiveSplit: false,
      splitGroup: 'removed_' + Date.now(),
    });
  };

  // --- Split categorization ---
  const hasActiveSplit = templates.some(t => t.isActiveSplit === true);
  const currentSplit = hasActiveSplit
    ? templates.filter(t => t.isActiveSplit === true)
    : templates.filter(t => !t.splitGroup || t.splitGroup === '');

  const currentSplitName = currentSplit.length > 0
    ? currentSplit.map(t => t.name.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, '')).join(' / ').toUpperCase()
    : '';

  // Detect which schedule/split key to use based on the active split's workout names
  const splitDetection = (() => {
    const resolveSchedule = (key) => {
      const defaultSchedule = EXAMPLE_SPLITS_DATA[key]?.schedule;
      try {
        const raw = localStorage.getItem(`splitSchedule_${key}`);
        if (raw) return JSON.parse(raw);
      } catch {}
      return defaultSchedule;
    };

    if (currentSplit.length === 0) return { key: 'full-body', schedule: resolveSchedule('full-body') };
    const names = currentSplit.map(t => (t.name || '').toLowerCase());
    const hasUpper = names.some(n => n.includes('upper'));
    const hasLower = names.some(n => n.includes('lower'));
    const hasPush  = names.some(n => n.includes('push'));
    const hasPull  = names.some(n => n.includes('pull'));
    const hasLegs  = names.some(n => n.includes('legs'));
    const hasFull  = names.some(n => n.includes('full'));

    if (hasFull && !hasUpper && !hasLower) return { key: 'full-body', schedule: resolveSchedule('full-body') };
    if (hasUpper && hasLower && hasPush && hasPull && hasLegs) return { key: 'ul-ppl', schedule: resolveSchedule('ul-ppl') };
    if (hasPush && hasPull && hasLegs) return { key: 'push-pull-legs', schedule: resolveSchedule('push-pull-legs') };
    if (hasUpper && hasLower) return { key: 'upper-lower', schedule: resolveSchedule('upper-lower') };
    return { key: 'full-body', schedule: resolveSchedule('full-body') };
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />

      {/* Page Title */}
      <div className="px-4 pb-3 flex items-center justify-between" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' }}>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground leading-tight">Workouts</h1>
        </div>
        <ProfileButton />
      </div>

      {/* Weekly Tracker */}
      <WeekTracker schedule={splitDetection.schedule} />

      {/* Quick Start */}
      <div className="px-4 py-4">
        <button
          onClick={() => navigate('/active-workout/empty-' + Date.now())}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99]"
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
                  className="relative bg-card border border-blue-400/30 rounded-xl p-4 shadow-lg shadow-blue-500/10 ring-1 ring-blue-400/10 hover:shadow-xl hover:scale-[1.02] transition-all duration-150"
                >
                  {/* Three-dot menu button */}
                  <button
                    ref={el => menuRef.current[template.id] = el}
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === template.id ? null : template.id); }}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition z-10"
                  >
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>

                  <div onClick={() => navigate(`/template/${template.id}`)} className="cursor-pointer">
                    <h4 className="font-bold text-foreground pr-8">{template.name}</h4>
                    <div className="flex flex-wrap gap-1.5 my-3">
                      {(template.exerciseList?.length > 0
                        ? template.exerciseList.map(e => e.name)
                        : (template.exercises || '').split(',').map(s => s.trim()).filter(Boolean)
                      ).map((name, i) => (
                        <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                          {name}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      ⏱ {template.lastPerformed ? relativeTime(template.lastPerformed) : 'Not yet performed'}
                    </p>
                  </div>

                  {/* Dropdown menu */}
                  {menuOpen === template.id && createPortal(
                    (() => {
                      const btn = menuRef.current[template.id];
                      const rect = btn?.getBoundingClientRect();
                      const top = rect ? rect.bottom + 4 : 0;
                      const right = rect ? window.innerWidth - rect.right : 0;
                      return (
                        <div
                          onClick={e => e.stopPropagation()}
                          className="fixed bg-card rounded-xl shadow-2xl border border-border py-1 min-w-[220px]"
                          style={{ top: `${top}px`, right: `${right}px`, zIndex: 100 }}
                        >
                          <button
                            onClick={() => handleRemoveFromSplit(template)}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-muted transition rounded-xl"
                          >
                            Remove from current split
                          </button>
                        </div>
                      );
                    })(),
                    document.body
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


    </div>
  );
}