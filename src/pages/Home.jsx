import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { MoreHorizontal, CalendarPlus, Plus } from 'lucide-react';
import CalendarSyncModal from '../components/CalendarSyncModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import ProfileButton from '../components/ProfileButton';
import SyncBanner from '../components/SyncBanner';
import WeekTracker from '../components/WeekTracker';
import TemplateCard from '../components/TemplateCard';
import { useWorkoutTemplates, invalidateWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { generateWorkoutICS } from '../lib/icsGenerator';

const SPLIT_ACCENTS = {
  'upper-lower': {
    hex: '#2A8FFF',
    tint: 'rgba(30, 100, 220, 0.18)',
    cardClasses: 'border-2 border-border hover:border-blue-500',
    tagClasses: 'bg-muted text-muted-foreground',
    dotClass: 'bg-blue-500',
  },
  'push-pull-legs': {
    hex: '#43A047',
    tint: 'rgba(50, 140, 50, 0.18)',
    cardClasses: 'border-2 border-border hover:border-emerald-500',
    tagClasses: 'bg-muted text-muted-foreground',
    dotClass: 'bg-emerald-500',
  },
  'full-body': {
    hex: '#8E24AA',
    tint: 'rgba(120, 30, 150, 0.18)',
    cardClasses: 'border-2 border-border hover:border-purple-500',
    tagClasses: 'bg-muted text-muted-foreground',
    dotClass: 'bg-purple-500',
  },
  'ul-ppl': {
    hex: '#F57C00',
    tint: 'rgba(220, 100, 0, 0.18)',
    cardClasses: 'border-2 border-border hover:border-amber-500',
    tagClasses: 'bg-muted text-muted-foreground',
    dotClass: 'bg-amber-500',
  },
};

const SAFE_AREA_PT = { paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' };

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

  const handleToggleMenu = useCallback((templateId) => {
    setMenuOpen(prev => prev === templateId ? null : templateId);
  }, []);

  const handleRemoveFromSplit = useCallback(async (template) => {
    setMenuOpen(null);
    queryClient.setQueryData(['workoutTemplates'], (prev) => prev?.filter(t => t.id !== template.id));
    await base44.entities.WorkoutTemplate.update(template.id, {
      isActiveSplit: false,
      splitGroup: 'removed_' + Date.now(),
    });
    invalidateWorkoutTemplates(queryClient);
  }, [queryClient]);

  const handleSyncToCalendar = useCallback(() => {
    setSplitMenuOpen(false);
    setShowCalendarSync(true);
  }, []);

  // --- Split categorization ---
  const { currentSplit, currentSplitName, splitDetection, dayWorkoutNames, todayWorkoutIndex } = useMemo(() => {
    const hasActive = templates.some(t => t.isActiveSplit === true);
    const split = hasActive
      ? templates.filter(t => t.isActiveSplit === true)
      : templates.filter(t => !t.splitGroup || t.splitGroup === '');

    const splitName = split.length > 0
      ? (split[0]?.splitName || [...new Set(split.map(t => t.name.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, '')))].join(' / ')).toUpperCase()
      : '';

    const resolveSchedule = (key, workoutCount, groupId) => {
      const todayIndex = new Date().getDay();
      const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;
      let onDays, offDays, startDayIndex;
      // Try groupId first (for custom splits), then detection key
      const keysToTry = [groupId, key].filter(Boolean);
      try {
        for (const k of keysToTry) {
          // Clear any stale splitSchedule that could override the cycle
          localStorage.removeItem(`splitSchedule_${k}`);
          const cycleRaw = localStorage.getItem(`splitCycle_${k}`);
          if (cycleRaw) {
            const parsed = JSON.parse(cycleRaw);
            onDays = Number(parsed.onDays);
            offDays = Number(parsed.offDays);
            startDayIndex = Number(parsed.startDayIndex);
            break;
          }
        }
      } catch {}
      // Use the actual workout count to determine training days
      onDays = onDays || Math.max(workoutCount, 1);
      offDays = offDays || 1;
      startDayIndex = startDayIndex != null ? startDayIndex : todayMonSun;
      const cycleLength = onDays + offDays;
      const schedule = [];
      for (let i = 0; i < 7; i++) {
        const daysFromStart = i >= startDayIndex ? i - startDayIndex : i + 7 - startDayIndex;
        const pos = daysFromStart % cycleLength;
        schedule.push(pos < onDays ? 1 : 0);
      }
      return { schedule, startDayIndex, onDays, offDays };
    };

    const sorted = [...split].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const groupId = split.length > 0 ? split[0].splitGroup : null;

    let detection;
    if (split.length === 0) {
      detection = { key: 'full-body', ...resolveSchedule('full-body', 0, null) };
    } else {
      const names = split.map(t => (t.name || '').toLowerCase());
      const hasUpper = names.some(n => n.includes('upper'));
      const hasLower = names.some(n => n.includes('lower'));
      const hasPush  = names.some(n => n.includes('push'));
      const hasPull  = names.some(n => n.includes('pull'));
      const hasLegs  = names.some(n => n.includes('legs'));
      const hasFull  = names.some(n => n.includes('full'));

      if (hasFull && !hasUpper && !hasLower) detection = { key: 'full-body', ...resolveSchedule('full-body', split.length, groupId) };
      else if (hasUpper && hasLower && hasPush && hasPull && hasLegs) detection = { key: 'ul-ppl', ...resolveSchedule('ul-ppl', split.length, groupId) };
      else if (hasPush && hasPull && hasLegs) detection = { key: 'push-pull-legs', ...resolveSchedule('push-pull-legs', split.length, groupId) };
      else if (hasUpper && hasLower) detection = { key: 'upper-lower', ...resolveSchedule('upper-lower', split.length, groupId) };
      else detection = { key: 'full-body', ...resolveSchedule('full-body', split.length, groupId) };
    }

    // Map workout names to each day of the week (Mon=0 ... Sun=6)
    const { schedule, startDayIndex, onDays, offDays } = detection;
    const cycleLength = (onDays || 1) + (offDays || 1);
    const dayWorkoutNames = schedule.map((on, i) => {
      if (on && sorted.length > 0) {
        const daysFromStart = i >= startDayIndex ? i - startDayIndex : i + 7 - startDayIndex;
        const dayInCycle = daysFromStart % cycleLength;
        const workoutIdx = dayInCycle % sorted.length;
        return sorted[workoutIdx]?.name?.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, '') || '';
      }
      return null;
    });

    // Which workout card (by sort_order index) is today's
    const todayMonSun = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const todayDaysFromStart = todayMonSun >= startDayIndex ? todayMonSun - startDayIndex : todayMonSun + 7 - startDayIndex;
    const todayInCycle = todayDaysFromStart % cycleLength;
    const todayWorkoutIndex = schedule[todayMonSun] >= 1 && sorted.length > 0
      ? (todayInCycle % sorted.length)
      : -1;

    return { currentSplit: sorted, currentSplitName: splitName, splitDetection: detection, dayWorkoutNames, todayWorkoutIndex };
  }, [templates]);

  const handleCalendarSyncConfirm = useCallback((hour) => {
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
  }, [currentSplitName, currentSplit, splitDetection]);

  const accent = useMemo(() => SPLIT_ACCENTS[splitDetection.key] || SPLIT_ACCENTS['full-body'], [splitDetection.key]);

  const isApple = useMemo(() => {
    const ua = navigator.userAgent || '';
    return /(iPhone|iPad|iPod|Macintosh|Mac OS X)/i.test(ua) && !/Android/i.test(ua);
  }, []);

  const cycleLabel = useMemo(() => {
    const { onDays, offDays } = splitDetection;
    if (onDays != null && offDays != null) {
      const onPart = `${onDays} day${onDays !== 1 ? 's' : ''} on`;
      const offPart = `${offDays} day${offDays !== 1 ? 's' : ''} off`;
      return `${onPart}, ${offPart}`;
    }
    return null;
  }, [splitDetection]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />

      {/* Page Title */}
      <div className="px-4 pb-3 flex items-center justify-between" style={SAFE_AREA_PT}>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground leading-tight">Workouts</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/active-workout/empty-' + Date.now())}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition"
            aria-label="Start an Empty Workout"
          >
            <Plus className="w-5 h-5" />
          </button>
          <ProfileButton />
        </div>
      </div>

      {/* Weekly Tracker */}
      <WeekTracker schedule={splitDetection.schedule} cycleLabel={cycleLabel} startDayIndex={splitDetection.startDayIndex} workoutNames={dayWorkoutNames} />

      {/* Sync Banner */}
      <SyncBanner />

      {/* ==================== CURRENT SPLIT ==================== */}
      <div className="px-4 py-2">
        <div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSplit.map((template, idx) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isTodayCard={idx === todayWorkoutIndex}
                  accent={accent}
                  isMenuOpen={menuOpen === template.id}
                  onToggleMenu={handleToggleMenu}
                  menuRef={menuRef}
                  onRemove={handleRemoveFromSplit}
                />
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