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
  const [swapPhase, setSwapPhase] = useState(null); // null | 'loading' | 'success'
  const [swappingSplitName, setSwappingSplitName] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const menuRef = useRef({});

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
      // Only show non-active templates (saved splits)
      setTemplates(data.filter(t => t.isActiveSplit !== true));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // Group templates by splitGroup
  const splitGroups = templates.reduce((acc, t) => {
    const key = t.splitGroup || '__ungrouped__' + t.id;
    if (!acc[key]) acc[key] = { groupId: key, templates: [] };
    acc[key].templates.push(t);
    return acc;
  }, {});

  const mySplitGroups = Object.values(splitGroups);

  // If user has no saved splits, auto-switch to examples tab (unless builder is open)
  useEffect(() => {
    if (!loading && mySplitGroups.length === 0 && !showBuilder) {
      setActiveTab('examples');
    }
  }, [loading, mySplitGroups.length, showBuilder]);

  const handleMakeCurrentSplit = async (splitKey) => {
    setMenuOpen(null);
    setSwapping(true);
    const splitData = EXAMPLE_SPLITS_DATA[splitKey];
    if (!splitData) { setSwapping(false); return; }

    setSwappingSplitName(splitData.name);
    setSwapPhase('loading');

    try {
      const newGroupId = Date.now().toString();
      const oldGroupId = Date.now().toString() + '_old';

      const allTemplates = await base44.entities.WorkoutTemplate.list('sort_order', 100);
      const currentActive = allTemplates.filter(
        t => t.isActiveSplit === true || (!t.splitGroup || t.splitGroup === '')
      );

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

      // Show success state with time to appreciate it then navigate
      setSwapPhase('success');
      setTimeout(() => {
        setSwapping(false);
        setSwapPhase(null);
        navigate('/');
      }, 2200);
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
            className="w-full mt-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Split
          </button>
        </div>
      )}

      {/* Example Splits Tab */}
      {activeTab === 'examples' && (
        <div className="px-4 relative">
          {/* Subtle neutral glow behind cards */}
          <div className="absolute -inset-x-8 -inset-y-8 bg-gradient-to-br from-slate-100/60 via-transparent to-slate-200/40 dark:from-slate-800/30 dark:via-transparent dark:to-slate-700/20 rounded-[3rem] blur-3xl pointer-events-none" />
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(EXAMPLE_SPLITS_DATA).map(([key, split]) => (
              <div
                key={key}
                className="relative bg-card border border-border/50 rounded-2xl p-5 shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-150 cursor-pointer group ring-1 ring-black/5 dark:ring-white/5"
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

      {/* Swap transition overlay */}
      <AnimatePresence>
        {swapPhase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)' }}
          >
            <motion.div
              key={swapPhase}
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: -8 }}
              transition={{ duration: 0.55, ease: [0.25, 0.6, 0.35, 1] }}
              className="bg-card rounded-3xl px-8 py-10 shadow-2xl flex flex-col items-center gap-6 max-w-[340px] w-[90%] relative overflow-hidden"
            >
              {/* Subtle glow ring on success */}
              {swapPhase === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.3, 1.8] }}
                  transition={{ duration: 1.8, ease: 'easeOut', delay: 0.1 }}
                  className="absolute inset-0 rounded-3xl bg-emerald-400/20 pointer-events-none"
                />
              )}

              {swapPhase === 'loading' ? (
                <>
                  {/* Pulsing ring spinner */}
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                      className="w-20 h-20 rounded-full border-[3px] border-blue-100 dark:border-blue-900/40 border-t-blue-500"
                    />
                    <motion.div
                      animate={{ rotate: -360, scale: [1, 1.08, 0.92, 1] }}
                      transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                      className="absolute inset-1 rounded-full border-[2px] border-blue-200/60 dark:border-blue-700/30"
                    />
                    <motion.div
                      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                    </motion.div>
                  </div>

                  {/* Staggered text entrance */}
                  <div className="text-center space-y-2">
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Applying split
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.25 }}
                      className="text-2xl font-extrabold text-foreground uppercase tracking-tight leading-tight"
                    >
                      {swappingSplitName}
                    </motion.p>
                  </div>

                  {/* Progress dots */}
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3, ease: 'easeInOut' }}
                        className="w-2 h-2 rounded-full bg-blue-400"
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Success icon with ripple rings */}
                  <div className="relative">
                    {/* Outer ripple */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
                      className="absolute inset-0 rounded-full bg-emerald-400/30"
                    />
                    {/* Middle ripple */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      className="absolute inset-0 rounded-full bg-emerald-300/25"
                    />
                    {/* Checkmark circle */}
                    <motion.div
                      initial={{ scale: 0, rotate: -120 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
                      className="relative z-10 w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.35 }}
                      >
                        <Check className="w-10 h-10 text-white" strokeWidth={3} />
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Success text staggered */}
                  <div className="text-center space-y-1.5">
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.5 }}
                      className="text-2xl font-extrabold text-foreground uppercase tracking-tight leading-tight"
                    >
                      {swappingSplitName}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.65 }}
                      className="text-sm font-semibold text-emerald-500"
                    >
                      Now your current split
                    </motion.p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}