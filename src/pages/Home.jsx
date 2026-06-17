import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { MoreHorizontal, CalendarPlus } from 'lucide-react';
import CalendarSyncModal from '../components/CalendarSyncModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import ProfileButton from '../components/ProfileButton';
import WeekTracker from '../components/WeekTracker';
import { useWorkoutTemplates, invalidateWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { EXAMPLE_SPLITS_DATA } from '../lib/splitData';
import { generateWorkoutICS } from '../lib/icsGenerator';

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

const estimateDuration = (exerciseCount) => {
  const mins = Math.round((exerciseCount * 8) / 5) * 5;
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
};

const SPLIT_ACCENTS = {
  'upper-lower': {
    hex: '#2A8FFF',
    tint: 'rgba(30, 100, 220, 0.18)',
    cardClasses: 'border border-blue-400/30 hover:ring-2 hover:ring-blue-500 shadow-blue-500/10 ring-blue-400/10',
    tagClasses: 'bg-muted text-muted-foreground',
    dotClass: 'bg-blue-500',
  },
  'push-pull-legs': {
    hex: '#43A047',
    tint: 'rgba(50, 140, 50, 0.18)',
    cardClasses: 'border border-emerald-400/30 hover:ring-2 hover:ring-emerald-500 shadow-emerald-500/10 ring-emerald-400/10',
    tagClasses: 'bg-muted text-muted-foreground',
    dotClass: 'bg-emerald-500',
  },
  'full-body': {
    hex: '#8E24AA',
    tint: 'rgba(120, 30, 150, 0.18)',
    cardClasses: 'border border-purple-400/30 hover:ring-2 hover:ring-purple-500 shadow-purple-500/10 ring-purple-400/10',
    tagClasses: 'bg-muted text-muted-foreground',
    dotClass: 'bg-purple-500',
  },
  'ul-ppl': {
    hex: '#F57C00',
    tint: 'rgba(220, 100, 0, 0.18)',
    cardClasses: 'border border-amber-400/30 hover:ring-2 hover:ring-amber-500 shadow-amber-500/10 ring-amber-400/10',
    tagClasses: 'bg-muted text-muted-foreground',
    dotClass: 'bg-amber-500',
  },
};

const SAFE_AREA_PT = { paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' };
const GRID_CV = { contentVisibility: 'auto', containIntrinsicSize: 'auto 160px' };

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: templates = [], isLoading: loading } = useWorkoutTemplates();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(null);
  const [splitMenuOpen, setSplitMenuOpen] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const menuRef = useRef({});
  const splitMenuBtnRef = useRef(null);

  // Re-fetch when navigating back to this tab (e.g., after changing split on Splits tab)
  useEffect(() => {
    if (location.pathname === '/') invalidateWorkoutTemplates(queryClient);
  }, [location.pathname, queryClient]);

  // Close menus on outside click
  useEffect(() => {
    if (!menuOpen && !splitMenuOpen) return;
    const close = (e) => {
      if (menuRef.current[menuOpen]?.contains(e.target)) return;
      if (splitMenuBtnRef.current?.contains(e.target)) return;
      setMenuOpen(null);
      setSplitMenuOpen(false);
    };
    const timer = setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', close);
    };
  }, [menuOpen, splitMenuOpen]);

  const { pullY, refreshing } = usePullToRefresh(() => invalidateWorkoutTemplates(queryClient));

  const handleRemoveFromSplit = async (template) => {
    setMenuOpen(null);
    // Optimistically update cache
    queryClient.setQueryData(['workoutTemplates'], (prev) => prev?.filter(t => t.id !== template.id));
    await base44.entities.WorkoutTemplate.update(template.id, {
      isActiveSplit: false,
      splitGroup: 'removed_' + Date.now(),
    });
    invalidateWorkoutTemplates(queryClient);
  };

  const handleSyncToCalendar = () => {
    setSplitMenuOpen(false);
    setShowCalendarSync(true);
  };

  const handleCalendarSyncConfirm = (hour) => {
    setShowCalendarSync(false);
    const ics = generateWorkoutICS({
      splitName: currentSplitName,
      workouts: currentSplit.map(t => ({ name: t.name })),
      schedule: splitDetection.schedule,
      startDayIndex: splitDetection.startDayIndex,
      workoutHour: hour,
    });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lift-workouts.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Split categorization ---
  const { currentSplit, currentSplitName, splitDetection } = useMemo(() => {
    const hasActive = templates.some(t => t.isActiveSplit === true);
    const split = hasActive
      ? templates.filter(t => t.isActiveSplit === true)
      : templates.filter(t => !t.splitGroup || t.splitGroup === '');

    const splitName = split.length > 0
      ? split.map(t => t.name.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, '')).join(' / ').toUpperCase()
      : '';

    const resolveSchedule = (key) => {
      const defaultSchedule = EXAMPLE_SPLITS_DATA[key]?.schedule;
      const todayIndex = new Date().getDay();
      const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;
      try {
        const cycleRaw = localStorage.getItem(`splitCycle_${key}`);
        if (cycleRaw) {
          const { onDays, offDays, startDayIndex } = JSON.parse(cycleRaw);
          const cycleLength = onDays + offDays;
          const schedule = [];
          for (let i = 0; i < 7; i++) {
            const pos = ((i - startDayIndex) % cycleLength + cycleLength) % cycleLength;
            schedule.push(pos < onDays ? 1 : 0);
          }
          return { schedule, startDayIndex };
        }
        const raw = localStorage.getItem(`splitSchedule_${key}`);
        if (raw) return { schedule: JSON.parse(raw), startDayIndex: todayMonSun };
      } catch {}
      if (defaultSchedule) {
        let maxOn = 0, maxOff = 0, curOn = 0, curOff = 0;
        for (let i = 0; i < defaultSchedule.length; i++) {
          if (defaultSchedule[i] >= 1) { curOn++; if (curOff > maxOff) maxOff = curOff; curOff = 0; }
          else { curOff++; if (curOn > maxOn) maxOn = curOn; curOn = 0; }
        }
        if (curOn > maxOn) maxOn = curOn;
        if (curOff > maxOff) maxOff = curOff;
        const onDays = maxOn || 1;
        const offDays = maxOff || 1;
        const startDayIndex = todayMonSun;
        const cycleLength = onDays + offDays;
        const schedule = [];
        for (let i = 0; i < 7; i++) {
          const pos = ((i - startDayIndex) % cycleLength + cycleLength) % cycleLength;
          schedule.push(pos < onDays ? 1 : 0);
        }
        return { schedule, startDayIndex };
      }
      return { schedule: defaultSchedule || [], startDayIndex: todayMonSun };
    };

    let detection;
    if (split.length === 0) {
      detection = { key: 'full-body', ...resolveSchedule('full-body') };
    } else {
      const names = split.map(t => (t.name || '').toLowerCase());
      const hasUpper = names.some(n => n.includes('upper'));
      const hasLower = names.some(n => n.includes('lower'));
      const hasPush  = names.some(n => n.includes('push'));
      const hasPull  = names.some(n => n.includes('pull'));
      const hasLegs  = names.some(n => n.includes('legs'));
      const hasFull  = names.some(n => n.includes('full'));

      if (hasFull && !hasUpper && !hasLower) detection = { key: 'full-body', ...resolveSchedule('full-body') };
      else if (hasUpper && hasLower && hasPush && hasPull && hasLegs) detection = { key: 'ul-ppl', ...resolveSchedule('ul-ppl') };
      else if (hasPush && hasPull && hasLegs) detection = { key: 'push-pull-legs', ...resolveSchedule('push-pull-legs') };
      else if (hasUpper && hasLower) detection = { key: 'upper-lower', ...resolveSchedule('upper-lower') };
      else detection = { key: 'full-body', ...resolveSchedule('full-body') };
    }

    return { currentSplit: split, currentSplitName: splitName, splitDetection: detection };
  }, [templates]);

  const accent = useMemo(() => SPLIT_ACCENTS[splitDetection.key] || SPLIT_ACCENTS['full-body'], [splitDetection.key]);

  const glowStyles = useMemo(() => ({
    outer: { background: `radial-gradient(ellipse at center, ${accent.hex}18 0%, ${accent.hex}0A 50%, transparent 70%)` },
    middle: { background: `radial-gradient(ellipse at center, ${accent.hex}18 0%, transparent 60%)` },
    inner: { background: `radial-gradient(ellipse at center, ${accent.hex}0C 0%, transparent 50%)` },
  }), [accent.hex]);

  const isApple = useMemo(() => {
    const ua = navigator.userAgent || '';
    return /(iPhone|iPad|iPod|Macintosh|Mac OS X)/i.test(ua) && !/Android/i.test(ua);
  }, []);

  const cycleLabel = useMemo(() => {
    const key = splitDetection.key;
    const defaultSchedule = EXAMPLE_SPLITS_DATA[key]?.schedule;
    try {
      const cycleRaw = localStorage.getItem(`splitCycle_${key}`);
      if (cycleRaw) {
        const { onDays, offDays } = JSON.parse(cycleRaw);
        const onPart = `${onDays} day${onDays !== 1 ? 's' : ''} on`;
        const offPart = `${offDays} day${offDays !== 1 ? 's' : ''} off`;
        return `${onPart}, ${offPart}`;
      }
    } catch {}
    if (defaultSchedule) {
      let maxOn = 0, maxOff = 0, curOn = 0, curOff = 0;
      for (let i = 0; i < defaultSchedule.length; i++) {
        if (defaultSchedule[i] >= 1) { curOn++; if (curOff > maxOff) maxOff = curOff; curOff = 0; }
        else { curOff++; if (curOn > maxOn) maxOn = curOn; curOn = 0; }
      }
      if (curOn > maxOn) maxOn = curOn;
      if (curOff > maxOff) maxOff = curOff;
      const onDays = maxOn || 1;
      const offDays = maxOff || 1;
      const onPart = `${onDays} day${onDays !== 1 ? 's' : ''} on`;
      const offPart = `${offDays} day${offDays !== 1 ? 's' : ''} off`;
      return `${onPart}, ${offPart}`;
    }
    return null;
  }, [splitDetection.key]);

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
      <div className="px-4 pb-3 flex items-center justify-between" style={SAFE_AREA_PT}>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground leading-tight">Workouts</h1>
        </div>
        <ProfileButton />
      </div>

      {/* Weekly Tracker */}
      <WeekTracker schedule={splitDetection.schedule} cycleLabel={cycleLabel} startDayIndex={splitDetection.startDayIndex} />

      {/* Quick Start */}
      <div className="px-4 py-4">
        <button
          onClick={() => navigate('/active-workout/empty-' + Date.now())}
          className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 text-sm"
        >
          Start an Empty Workout
        </button>
      </div>

      {/* ==================== CURRENT SPLIT (Spotlight) ==================== */}
      <div className="relative px-4 py-2">
        {/* Multi-layered glow for depth — dynamic hue based on split type */}
        <div className="absolute -inset-12 rounded-[4rem] blur-3xl pointer-events-none" style={glowStyles.outer} />
        <div className="absolute -inset-4 rounded-[2.5rem] blur-2xl pointer-events-none" style={glowStyles.middle} />
        <div className="absolute inset-0 rounded-[2rem] blur-xl pointer-events-none" style={glowStyles.inner} />

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className={`w-2 h-2 rounded-full ${accent.dotClass}`}
                />
                <h3 className="font-semibold text-foreground text-sm">Current Split</h3>
              </div>
              {currentSplitName && (
                <h2 className="text-xl font-extrabold text-foreground tracking-tight">{currentSplitName}</h2>
              )}
            </div>
            {currentSplit.length > 0 && (
              <button
                ref={splitMenuBtnRef}
                onClick={(e) => { e.stopPropagation(); setSplitMenuOpen(!splitMenuOpen); setMenuOpen(null); }}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition flex-shrink-0"
              >
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {currentSplit.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={GRID_CV}>
              {currentSplit.map((template) => (
                <div
                  key={template.id}
                  className={`relative bg-card rounded-xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-150 ${accent.cardClasses}`}
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
                    <p className="text-sm text-muted-foreground mt-2">
                      {(() => {
                        const count = template.exerciseList?.length || (template.exercises || '').split(',').filter(Boolean).length;
                        return estimateDuration(count);
                      })()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
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

        {/* Split header dropdown menu */}
        {splitMenuOpen && createPortal(
          (() => {
            const btn = splitMenuBtnRef.current;
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
                  onClick={handleSyncToCalendar}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition rounded-xl flex items-center gap-2"
                >
                  <CalendarPlus className={`w-4 h-4 ${accent.dotClass.replace('bg-', 'text-')}`} />
                  {isApple ? 'Sync to Apple Calendar' : 'Sync to Android Calendar'}
                </button>
              </div>
            );
          })(),
          document.body
        )}
      </div>

      {showCalendarSync && (
        <CalendarSyncModal
          onClose={() => setShowCalendarSync(false)}
          onSync={handleCalendarSyncConfirm}
        />
      )}

    </div>
  );
}