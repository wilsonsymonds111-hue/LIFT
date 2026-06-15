import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import ProfileButton from '../components/ProfileButton';
import SplitBuilder from '../components/SplitBuilder';
import SplitModal from '../components/SplitModal';
import SplitCard from '../components/SplitCard';


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
  const [deleteTarget, setDeleteTarget] = useState(null); // group to confirm deletion
  const [activeSplit, setActiveSplit] = useState(null);
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

  const handleMakeMySplitCurrent = async (group) => {
    setMenuOpen(null);

    // Build display data from the group's templates
    const names = group.templates.map(t => t.name.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, ''));
    const uniqueNames = [...new Set(names)];
    const splitName = uniqueNames.join(' / ').toUpperCase();
    const splitData = {
      name: splitName,
      workouts: group.templates.map(t => ({
        name: t.name,
        exercises: (t.exerciseList || []).map(e => ({ name: e.name })),
      })),
      label: `${group.templates.length} workout${group.templates.length > 1 ? 's' : ''}`,
    };

    setSwapping(true);
    setSwappingSplitName(splitData.name);
    setSwappingSplitData(splitData);

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

    if (currentActive.length > 0) {
      const oldNames = currentActive.map(t => t.name.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, ''));
      const oldUniqueNames = [...new Set(oldNames)];
      swapRef.current.oldName = oldUniqueNames.join(' / ').toUpperCase();
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

    try {
      const newGroupId = Date.now().toString();
      const oldGroupId = Date.now().toString() + '_old';
      const deactivateUpdates = currentActive.map(t =>
        base44.entities.WorkoutTemplate.update(t.id, { isActiveSplit: false, splitGroup: oldGroupId })
      );
      await Promise.all(deactivateUpdates);
      const activateUpdates = group.templates.map((t, i) =>
        base44.entities.WorkoutTemplate.update(t.id, {
          isActiveSplit: true,
          splitGroup: newGroupId,
          sort_order: i,
        })
      );
      await Promise.all(activateUpdates);
    } catch (_) {
      setSwapping(false);
      setSwapPhase(null);
    }
  };

  const handleDeleteMySplit = async (group) => {
    setMenuOpen(null);
    const ids = group.templates.map(t => t.id);
    setTemplates(prev => prev.filter(t => !ids.includes(t.id)));
    await Promise.all(ids.map(id => base44.entities.WorkoutTemplate.delete(id)));
  };

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
                <SplitCard
                  key={group.groupId}
                  splitKey={group.groupId}
                  name={group.templates.map(t => t.name.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, '')).join(' • ')}
                  workouts={group.templates.map(t => ({ name: t.name }))}
                  onCardClick={() => setActiveSplit(group.groupId)}
                  onMenuToggle={() => setMenuOpen(menuOpen === group.groupId ? null : group.groupId)}
                  menuRef={el => menuRef.current[group.groupId] = el}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Example Splits Tab */}
      {activeTab === 'examples' && (
        <div className="px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(EXAMPLE_SPLITS_DATA).map(([key, split]) => (
              <SplitCard
                key={key}
                splitKey={key}
                name={split.name}
                workouts={split.workouts}
                onCardClick={() => setActiveSplit(key)}
                onMenuToggle={() => setMenuOpen(menuOpen === key ? null : key)}
                menuRef={el => menuRef.current[key] = el}
                cardRef={el => cardRefs.current[key] = el}
              />
            ))}
          </div>
        </div>
      )}



      {/* Portal menu — uses createPortal to escape overflow-hidden clipping from SwipeableTabs */}
      {menuOpen && createPortal(
        <div
          className="fixed bg-card rounded-2xl shadow-xl border border-border/60 py-1.5 overflow-hidden"
          style={{
            top: `${(() => { const el = menuRef.current[menuOpen]; return el ? el.getBoundingClientRect().bottom + 4 : 0; })()}px`,
            right: `${(() => { const el = menuRef.current[menuOpen]; return el ? window.innerWidth - el.getBoundingClientRect().right : 0; })()}px`,
            zIndex: 100,
          }}
        >
          <button
            onClick={() => {
              setMenuOpen(null);
              if (EXAMPLE_SPLITS_DATA[menuOpen]) {
                handleMakeCurrentSplit(menuOpen);
              } else {
                const g = mySplitGroups.find(x => x.groupId === menuOpen);
                if (g) handleMakeMySplitCurrent(g);
              }
            }}
            disabled={swapping}
            className="w-full text-left px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors"
          >
            Make this my current split
          </button>
          <button
            onClick={() => {
              setMenuOpen(null);
              const g = mySplitGroups.find(x => x.groupId === menuOpen);
              if (g) setDeleteTarget(g);
            }}
            className="w-full text-left px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Delete split from {activeTab === 'mine' ? 'My Splits' : 'Example Splits'}
          </button>
        </div>,
        document.body
      )}

      {/* Delete confirmation */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-card rounded-2xl p-6 mx-5 max-w-sm w-full shadow-2xl border border-border">
            <h3 className="text-lg font-extrabold text-foreground">Delete Split?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete this split from {activeTab === 'mine' ? 'My Splits' : 'Example Splits'}? This cannot be undone.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/70 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => { handleDeleteMySplit(deleteTarget); setDeleteTarget(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
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

      {/* Split detail modal */}
      {activeSplit && (
        <SplitModal
          splitKey={activeSplit}
          onClose={() => setActiveSplit(null)}
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
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(18px)' }}
          >
            {/* ── Phase 1: Current (old) split appears at center ── */}
            {swapPhase === 'popup' && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                  transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
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
                  transition={{ duration: 0.35, ease: [0.5, 0, 0.75, 0] }}
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
                  transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
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