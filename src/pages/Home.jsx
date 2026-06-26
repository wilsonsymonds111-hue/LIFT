import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, CalendarPlus, Plus, Moon } from 'lucide-react';
import CalendarSyncModal from '../components/CalendarSyncModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import ProfileButton from '../components/ProfileButton';
import SyncBanner from '../components/SyncBanner';
import WeekTracker from '../components/WeekTracker';
import BodyWeightSection from '../components/BodyWeightSection';
import TemplateCard from '../components/TemplateCard';
import { useWorkoutTemplates, invalidateWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { generateWorkoutICS } from '../lib/icsGenerator';

const SplitModal = lazy(() => import('../components/SplitModal'));

// Default cycle patterns: { onDays, offDays } for known split types
const SPLIT_CYCLES = {
  'push-pull-legs': { onDays: 3, offDays: 1 },
  'upper-lower': { onDays: 2, offDays: 1 },
  'ul-ppl': { onDays: 5, offDays: 1 },
  'full-body': { onDays: 1, offDays: 1 },
};

// --- Module-level schedule helpers (run fresh every render, no stale memo) ---

// Build a 7-day schedule starting from TODAY (index 0 = today) using a continuous
// cycle across real calendar days. This avoids the old Mon–Sun week model, which
// forced pre-start days to rest and produced consecutive rest days at the week wrap.
function cycleToSchedule(onDays, offDays, startDayIdx) {
  const cycleLength = onDays + offDays;
  const now = new Date();
  const todayMonSun = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const todayAbs = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  const startAbs = todayAbs - todayMonSun + startDayIdx;
  const schedule = [];
  for (let k = 0; k < 7; k++) {
    const offset = (todayAbs + k) - startAbs;
    const pos = ((offset % cycleLength) + cycleLength) % cycleLength;
    schedule.push(pos < onDays ? 1 : 0);
  }
  return schedule;
}

// On-day index (0-based from the cycle start) for the k-th display day (0 = today).
// Lets workouts rotate correctly across a continuous cycle that drifts past week boundaries.
function onDayIndexForDisplay(k, startDayIdx, onDays, offDays) {
  const cycleLength = onDays + offDays;
  const now = new Date();
  const todayMonSun = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const todayAbs = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  const startAbs = todayAbs - todayMonSun + startDayIdx;
  const offset = (todayAbs + k) - startAbs;
  const pos = ((offset % cycleLength) + cycleLength) % cycleLength;
  const cycleNum = Math.floor(offset / cycleLength);
  return cycleNum * onDays + pos;
}

function resolveSchedule(key, workoutCount, groupId) {
  const todayIndex = new Date().getDay();
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;

  const defaultCycle = SPLIT_CYCLES[key];
  let onDays = defaultCycle ? defaultCycle.onDays : null;
  let offDays = defaultCycle ? defaultCycle.offDays : null;

  // Check localStorage for user customizations — overrides defaults even for known types.
  // Try both the split key (stored by RestFrequencyConfirmModal) and the group ID.
  let savedStartDayIndex = null;
  try {
    const keysToTry = [key, groupId].filter(Boolean);
    for (const k of keysToTry) {
      const cycleRaw = localStorage.getItem(`splitCycle_${k}`);
      if (cycleRaw) {
        const parsed = JSON.parse(cycleRaw);
        onDays = Number(parsed.onDays) || onDays;
        offDays = Number(parsed.offDays) || offDays;
        savedStartDayIndex = Number(parsed.startDayIndex);
        break;
      }
    }
  } catch {}

  if (!onDays) onDays = Math.max(workoutCount, 1);
  if (!offDays) offDays = 1;

  // Use the user's chosen cycle start day if they saved one; otherwise start from today.
  const startDayIndex = (savedStartDayIndex !== null && !isNaN(savedStartDayIndex)) ? savedStartDayIndex : todayMonSun;

  const schedule = cycleToSchedule(onDays, offDays, startDayIndex);
  return { schedule, startDayIndex, onDays, offDays };
}

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
  const [showSplitEditor, setShowSplitEditor] = useState(false);
  const [cycleVersion, setCycleVersion] = useState(0);
  const menuRef = useRef({});
  const splitMenuBtnRef = useRef(null);

  // Listen for schedule changes from outside Home (e.g., rest-day prompt after workout)
  useEffect(() => {
    const handler = () => setCycleVersion(v => v + 1);
    window.addEventListener('scheduleChanged', handler);
    return () => window.removeEventListener('scheduleChanged', handler);
  }, []);

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

  // --- Split categorization (computed fresh every render — no stale memo) ---

  const { currentSplit, currentSplitName } = useMemo(() => {
    const hasActive = templates.some(t => t.isActiveSplit === true);
    const split = hasActive
      ? templates.filter(t => t.isActiveSplit === true)
      : templates.filter(t => !t.splitGroup || t.splitGroup === '');

    // Prefer the first template's splitName, then check all templates for a shared splitName,
    // then fall back to joining individual workout names
    const name = split.length > 0
      ? (split[0]?.splitName || split.find(t => t.splitName)?.splitName || [...new Set(split.map(t => t.name.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, '')))].join(' / ')).toUpperCase()
      : '';

    return { currentSplit: [...split].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)), currentSplitName: name };
  }, [templates]);

  // Compute schedule fresh every render — no caching that could go stale
  const groupId = currentSplit.length > 0 ? currentSplit[0].splitGroup : null;
  const names = currentSplit.map(t => (t.name || '').toLowerCase());
  const hasUpper = names.some(n => n.includes('upper'));
  const hasLower = names.some(n => n.includes('lower'));
  const hasPush  = names.some(n => n.includes('push'));
  const hasPull  = names.some(n => n.includes('pull'));
  const hasLegs  = names.some(n => n.includes('legs'));
  const hasFull  = names.some(n => n.includes('full'));

  let splitKey, workoutCount;
  if (currentSplit.length === 0) {
    splitKey = 'full-body';
    workoutCount = 0;
  } else if (hasUpper && hasLower && hasPush && hasPull && hasLegs) {
    splitKey = 'ul-ppl';
    workoutCount = currentSplit.length;
  } else if (hasPush && hasPull && hasLegs) {
    splitKey = 'push-pull-legs';
    workoutCount = currentSplit.length;
  } else if (hasUpper && hasLower) {
    splitKey = 'upper-lower';
    workoutCount = currentSplit.length;
  } else if (hasFull && !hasUpper && !hasLower) {
    splitKey = 'full-body';
    workoutCount = currentSplit.length;
  } else {
    splitKey = 'full-body';
    workoutCount = currentSplit.length;
  }

  const splitDetection = useMemo(
    () => ({ key: splitKey, ...resolveSchedule(splitKey, workoutCount, groupId) }),
    [splitKey, workoutCount, groupId, cycleVersion]
  );

  const { schedule, startDayIndex, onDays, offDays } = splitDetection;
  const sorted = currentSplit;

  // schedule is today-first (index 0 = today). Map each on-day to a workout by
  // counting on-days from the cycle start across the continuous cycle.
  const dayWorkoutNames = useMemo(() => {
    const names = [];
    for (let k = 0; k < 7; k++) {
      if (schedule[k] && sorted.length > 0) {
        const onDayIdx = onDayIndexForDisplay(k, startDayIndex, onDays, offDays);
        const workoutIdx = ((onDayIdx % sorted.length) + sorted.length) % sorted.length;
        names.push(sorted[workoutIdx]?.name?.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, '') || '');
      } else {
        names.push(null);
      }
    }
    return names;
  }, [schedule, startDayIndex, sorted, onDays, offDays]);

  // Enhance schedule with completion status (2 = today's workout completed).
  // Today is display index 0.
  const scheduleWithCompletions = useMemo(() => {
    const _now = new Date();
    const todayStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
    return schedule.map((status, k) => {
      if (status < 1 || sorted.length === 0) return status;
      if (k !== 0) return 1; // only today can be "completed"
      const onDayIdx = onDayIndexForDisplay(k, startDayIndex, onDays, offDays);
      const workoutIdx = ((onDayIdx % sorted.length) + sorted.length) % sorted.length;
      const template = sorted[workoutIdx];
      const completed = template?.lastPerformed?.slice(0, 10) === todayStr;
      return completed ? 2 : 1;
    });
  }, [schedule, startDayIndex, sorted, onDays, offDays]);

  // Which workout (index into sorted) is today's; -1 if today is a rest day.
  const todayWorkoutIndex = useMemo(() => {
    if (schedule[0] < 1 || sorted.length === 0) return -1;
    const onDayIdx = onDayIndexForDisplay(0, startDayIndex, onDays, offDays);
    return ((onDayIdx % sorted.length) + sorted.length) % sorted.length;
  }, [schedule, startDayIndex, sorted, onDays, offDays]);

  const handleCalendarSyncConfirm = useCallback((hour) => {
    setShowCalendarSync(false);
    const ics = generateWorkoutICS({
      splitName: currentSplitName,
      workouts: currentSplit.map(t => ({ name: t.name })),
      onDays: splitDetection.onDays,
      offDays: splitDetection.offDays,
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
    <div className="health-gradient pb-28">
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
      <WeekTracker schedule={scheduleWithCompletions} cycleLabel={cycleLabel} startDayIndex={splitDetection.startDayIndex} workoutNames={dayWorkoutNames} />

      {/* Body Weight Tracker */}
      <BodyWeightSection />

      {/* Sync Banner */}
      <SyncBanner />

      {/* ==================== CURRENT SPLIT ==================== */}
      <div className="px-4 py-2">
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-breathe shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
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
            {currentSplit.map((template, idx) => {
              const _now = new Date();
              const todayStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
              const isCompleted = template.lastPerformed?.slice(0, 10) === todayStr;
              return (
              <TemplateCard
                key={template.id}
                template={template}
                isTodayCard={idx === todayWorkoutIndex}
                isCompleted={isCompleted}
                accent={accent}
                isMenuOpen={menuOpen === template.id}
                onToggleMenu={handleToggleMenu}
                menuRef={menuRef}
                onRemove={handleRemoveFromSplit}
              />
              );
            })}
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
                  onClick={() => { setSplitMenuOpen(false); setShowSplitEditor(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition rounded-xl flex items-center gap-2"
                >
                  <Moon className="w-4 h-4 text-blue-500" />
                  Edit rest frequency
                </button>
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

      {showSplitEditor && groupId && (
        <Suspense fallback={null}>
          <SplitModal
            splitKey={groupId}
            isActiveSplit
            onClose={() => setShowSplitEditor(false)}
            onCycleSaved={() => { setCycleVersion(v => v + 1); invalidateWorkoutTemplates(queryClient); }}
            onMakeCurrent={async () => {
              setShowSplitEditor(false);
              invalidateWorkoutTemplates(queryClient);
            }}
          />
        </Suspense>
      )}

    </div>
  );
}