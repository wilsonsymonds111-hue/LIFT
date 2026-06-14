import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import ProfileButton from '../components/ProfileButton';
import SplitBuilder from '../components/SplitBuilder';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { EXAMPLE_SPLITS_DATA } from '../lib/splitData';



export default function Splits() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  const [swapping, setSwapping] = useState(false);
  const [swapPhase, setSwapPhase] = useState(null); // null | 'popup' | 'swap' | 'success'
  const [swappingSplitName, setSwappingSplitName] = useState('');
  const [swappingSplitData, setSwappingSplitData] = useState(null);
  const swapRef = useRef({ oldName: '', oldData: null, newName: '', newData: null });
  const [swapOriginRect, setSwapOriginRect] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const menuRef = useRef({});
  const cardRefs = useRef({});

  // Default to "examples" on first visit, otherwise remember preference
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('splitsActiveTab');
    return stored || 'examples';
  });

  useEffect(() => {
    localStorage.setItem('splitsActiveTab', activeTab);
  }, [activeTab]);

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

  const loadTemplates = useCallback(async () => {
    const data = await base44.entities.WorkoutTemplate.list('sort_order', 100);
    if (data) {
      // Only show saved splits: non-active, has a splitGroup, and not archived (_old)
      setTemplates(data.filter(t =>
        t.isActiveSplit !== true &&
        t.splitGroup &&
        !t.splitGroup.endsWith('_old')
      ));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // Phase transitions: success → navigate
  useEffect(() => {
    if (swapPhase === 'success') {
      const t = setTimeout(() => {
        setSwapping(false);
        setSwapPhase(null);
        navigate('/');
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [swapPhase, swapOriginRect, navigate]);

  // Group templates by splitGroup
  const splitGroups = templates.reduce((acc, t) => {
    const key = t.splitGroup || '__ungrouped__' + t.id;
    if (!acc[key]) acc[key] = { groupId: key, templates: [] };
    acc[key].templates.push(t);
    return acc;
  }, {});

  const mySplitGroups = Object.values(splitGroups);

  // If user has no saved splits, auto-switch to examples tab (unless builder is open or user just chose "mine")
  useEffect(() => {
    if (!loading && mySplitGroups.length === 0 && !showBuilder && activeTab !== 'mine') {
      setActiveTab('examples');
    }
  }, [loading, mySplitGroups.length, showBuilder, activeTab]);

  const handleMakeCurrentSplit = async (splitKey) => {
    setMenuOpen(null);
    const splitData = EXAMPLE_SPLITS_DATA[splitKey];
    if (!splitData) return;

    // Capture the card's screen position
    const cardEl = cardRefs.current[splitKey];
    if (cardEl) {
      const r = cardEl.getBoundingClientRect();
      setSwapOriginRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      // Fallback: start from center at smaller scale
      setSwapOriginRect(null);
    }

    setSwapping(true);
    setSwappingSplitName(splitData.name);
    setSwappingSplitData(splitData);

    // Fetch once, store in ref (immune to React batching) for the animation
    let allTemplates;
    try {
      allTemplates = await base44.entities.WorkoutTemplate.list('sort_order', 100);
    } catch (_) {
      setSwapping(false);
      return;
    }

    const currentActive = allTemplates.filter(
      t => t.isActiveSplit === true || (!t.splitGroup || t.splitGroup === '')
    );

    // Store old split in ref — guaranteed correct, won't get clobbered by state batching
    if (currentActive.length > 0) {
      const names = currentActive.map(t => t.name.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, ''));
      const uniqueNames = [...new Set(names)];
      swapRef.current.oldName = uniqueNames.join(' / ').toUpperCase();
      swapRef.current.oldData = {
        workouts: currentActive.map(t => ({ name: t.name })),
        label: `${currentActive.length} workout${currentActive.length > 1 ? 's' : ''}`,
      };
    } else {
      swapRef.current.oldName = 'No Current Split';
      swapRef.current.oldData = { workouts: [], label: '' };
    }
    swapRef.current.newName = splitData.name;
    swapRef.current.newData = splitData;

    setSwapPhase('popup');

    // Run DB migration in background while animation plays
    try {
      const newGroupId = Date.now().toString();
      const oldGroupId = Date.now().toString() + '_old';
      const updates = currentActive.map(t =>
        base44.entities.WorkoutTemplate.update(t.id, { isActiveSplit: false, splitGroup: oldGroupId })
      );
      await Promise.all(updates);
      const newTemplates = splitData.workouts.map((w, i) => ({
        name: w.name,
        exercises: w.exercises.map(e => e.name).join(', '),
        exerciseList: w.exercises.map(e => ({ ...e, history: [] })),
        lastPerformed: null,
        sort_order: i,
        isActiveSplit: true,
        splitGroup: newGroupId,
      }));
      await base44.entities.WorkoutTemplate.bulkCreate(newTemplates);
    } catch (_) {
      setSwapping(false);
      setSwapPhase(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pb-3 flex items-center justify-between" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' }}>
        <h1 className="text-3xl font-extrabold text-foreground leading-tight">Workout Splits</h1>
        <ProfileButton />
      </div>

      {/* Top Tabs */}
      <div className="px-4 mb-5">
        <div className="flex bg-muted rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('mine')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'mine'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Splits
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'examples'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Example Splits
          </button>
        </div>
      </div>

      {/* My Splits Tab */}
      {activeTab === 'mine' && (
        <div className="px-4">
          <button
            onClick={() => setShowBuilder(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Split
          </button>
          {mySplitGroups.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {mySplitGroups.map((group) => (
                <div key={group.groupId} className="relative" style={{ paddingBottom: 12 }}>
                  {/* Stacked shadow cards behind */}
                  <div className="absolute top-3 left-1 right-1 bottom-0 bg-card border-[3px] border-gray-300/60 dark:border-gray-600/50 rounded-2xl pointer-events-none" />
                  <div className="absolute top-1.5 left-0.5 right-0.5 bottom-1.5 bg-card border-[3px] border-gray-300/80 dark:border-gray-600/70 rounded-2xl pointer-events-none" />
                  <div
                    className="relative bg-card border-[3px] border-gray-400 dark:border-gray-500 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.45)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:scale-[1.01] transition-all duration-150 cursor-pointer"
                    onClick={() => navigate(`/split/${group.groupId}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-foreground text-base tracking-tight uppercase">
                          {group.templates.map(t => t.name.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, '')).join(' / ')}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.templates.length} workout{group.templates.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {group.templates.map((t, i) => (
                        <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Example Splits Tab */}
      {activeTab === 'examples' && (
        <div className="px-4 relative">
          {/* Subtle neutral glow behind cards */}
          <div className="absolute -inset-x-8 -inset-y-8 bg-gradient-to-br from-slate-100/60 via-transparent to-slate-200/40 dark:from-slate-800/30 dark:via-transparent dark:to-slate-700/20 rounded-[3rem] blur-3xl pointer-events-none" />
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(EXAMPLE_SPLITS_DATA).map(([key, split]) => (
              <div key={key} className="relative" style={{ paddingBottom: 12 }}>
                {/* Stacked shadow cards behind */}
                <div className="absolute top-3 left-1 right-1 bottom-0 bg-card border-[3px] border-gray-300/60 dark:border-gray-600/50 rounded-2xl pointer-events-none" />
                <div className="absolute top-1.5 left-0.5 right-0.5 bottom-1.5 bg-card border-[3px] border-gray-300/80 dark:border-gray-600/70 rounded-2xl pointer-events-none" />
                <div
                  key={key}
                  ref={el => cardRefs.current[key] = el}
                  className="relative bg-card border-[3px] border-gray-400 dark:border-gray-500 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.45)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:scale-[1.01] transition-all duration-150 cursor-pointer group"
                  onClick={() => navigate(`/split/${key}`)}
                >

                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-foreground text-base tracking-tight uppercase">{split.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {split.workouts.length} workout{split.workouts.length > 1 ? 's' : ''} — {split.label}
                      </p>
                    </div>
                    <button
                      ref={el => menuRef.current[key] = el}
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === key ? null : key); }}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition flex-shrink-0 select-none -mt-1 -mr-1 group/btn"
                    >
                      <svg className="w-4 h-4 text-muted-foreground group-hover/btn:text-foreground transition-colors" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="8" cy="3" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="8" cy="13" r="1.5" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {split.workouts.map((w, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                        {w.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portal menu */}
      {menuOpen && createPortal(
        (() => {
          const btn = menuRef.current[menuOpen];
          const rect = btn?.getBoundingClientRect();
          const top = rect ? rect.bottom + 4 : 0;
          const right = rect ? window.innerWidth - rect.right : 0;
          return (
            <div
              onClick={e => e.stopPropagation()}
              className="fixed bg-card rounded-xl shadow-2xl border border-border py-1 min-w-[200px]"
              style={{ top: `${top}px`, right: `${right}px`, zIndex: 100 }}
            >
              <button
                onClick={() => handleMakeCurrentSplit(menuOpen)}
                disabled={swapping}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition rounded-xl disabled:opacity-50"
              >
                {swapping ? 'Applying…' : 'Make this my current split'}
              </button>
            </div>
          );
        })(),
        document.body
      )}

      {/* Split builder */}
      {showBuilder && (
        <SplitBuilder
          onClose={() => setShowBuilder(false)}
          onSaved={() => {
            setShowBuilder(false);
            loadTemplates();
            setActiveTab('mine');
            localStorage.setItem('splitsActiveTab', 'mine');
          }}
        />
      )}

      {/* Split swap animation overlay — portaled to body to escape SwipeableTabs transform context */}
      {createPortal(
        <AnimatePresence>
          {swapPhase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(18px)' }}
          >
            {/* ── Phase 1: Current (old) split appears at center ── */}
            {swapPhase === 'popup' && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                onAnimationComplete={() => setSwapPhase('swap')}
                className="bg-card border border-border/50 rounded-2xl p-5 shadow-2xl ring-1 ring-black/5 dark:ring-white/5"
                style={{ width: 340 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-foreground text-base tracking-tight uppercase">
                      {swapRef.current.oldName || 'Current Split'}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {swapRef.current.oldData?.workouts?.length || 0} workout{(swapRef.current.oldData?.workouts?.length || 0) !== 1 ? 's' : ''} — {swapRef.current.oldData?.label || ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {swapRef.current.oldData?.workouts?.map((w, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                      {w.name}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Phase 2: Old slides left, new stamps over it from right ── */}
            {(swapPhase === 'swap' || swapPhase === 'success') && (
              <div className="relative pointer-events-none" style={{ width: 340 }}>
                {/* Old split slides out to the left */}
                <motion.div
                  initial={{ x: 0, opacity: 1, scale: 1 }}
                  animate={{ x: -window.innerWidth, opacity: 0.6, scale: 0.92, rotate: -4 }}
                  transition={{ duration: 0.55, ease: [0.5, 0, 0.75, 0] }}
                  className="absolute left-0 top-0 w-full bg-card border border-border/50 rounded-2xl p-5 shadow-2xl ring-1 ring-black/5 dark:ring-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-foreground text-base tracking-tight uppercase">
                        {swapRef.current.oldName || 'Current Split'}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {swapRef.current.oldData?.workouts?.length || 0} workout{(swapRef.current.oldData?.workouts?.length || 0) !== 1 ? 's' : ''} — {swapRef.current.oldData?.label || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {swapRef.current.oldData?.workouts?.map((w, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                        {w.name}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* New split stamps in from the right */}
                <motion.div
                  initial={{ x: window.innerWidth, opacity: 0, scale: 0.9, rotate: 3 }}
                  animate={{ x: 0, opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.55, ease: [0.33, 1, 0.68, 1] }}
                  onAnimationComplete={() => {
                    if (swapPhase === 'swap') setSwapPhase('success');
                  }}
                  className="absolute left-0 top-0 w-full bg-card rounded-2xl p-5 shadow-2xl ring-1 ring-black/5 dark:ring-white/5 overflow-hidden"
                >
                  {swapPhase === 'success' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.25 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 bg-emerald-400 rounded-2xl pointer-events-none"
                    />
                  )}
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-foreground text-base tracking-tight uppercase">
                          {swapRef.current.newName}
                        </h4>
                        {swapPhase === 'success' && (
                          <motion.div
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
                            className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
                          >
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 relative z-10">
                        {swapRef.current.newData?.workouts?.length || 0} workout{(swapRef.current.newData?.workouts?.length || 0) > 1 ? 's' : ''} — {swapRef.current.newData?.label}
                      </p>
                      {swapPhase === 'success' && (
                        <motion.p
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.4 }}
                          className="text-xs font-semibold text-emerald-500 mt-1 relative z-10"
                        >
                          Now your current split
                        </motion.p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-4 relative z-10">
                    {swapRef.current.newData?.workouts?.map((w, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                        {w.name}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}