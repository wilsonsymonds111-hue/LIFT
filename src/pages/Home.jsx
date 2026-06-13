import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, MoreVertical, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import TemplateDetailModal from '../components/TemplateDetailModal';
import ProfileSheet from '../components/ProfileSheet';
import SplitDetailModal from '../components/SplitDetailModal';

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

const EXAMPLE_SPLITS_DATA = {
  'upper-lower': {
    name: 'Upper-Lower Split',
    label: 'Upper • Lower',
    workouts: [
      {
        name: 'Upper Body',
        exercises: [
          { name: 'Bench Press (Barbell)', muscle: 'Chest', sets: 4 },
          { name: 'Overhead Press (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Pull Up', muscle: 'Back', sets: 3 },
          { name: 'Barbell Row', muscle: 'Back', sets: 3 },
          { name: 'Lateral Raise (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Bicep Curl (Dumbbell)', muscle: 'Arms', sets: 3 },
          { name: 'Tricep Pushdown (Cable)', muscle: 'Arms', sets: 3 },
          { name: 'Face Pull', muscle: 'Shoulders', sets: 3 },
        ],
      },
      {
        name: 'Lower Body',
        exercises: [
          { name: 'Squat (Barbell)', muscle: 'Legs', sets: 4 },
          { name: 'Deadlift (Barbell)', muscle: 'Back', sets: 3 },
          { name: 'Leg Press', muscle: 'Legs', sets: 3 },
          { name: 'Leg Curl (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Leg Extension (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Calf Raise (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Crunch', muscle: 'Core', sets: 3 },
          { name: 'Plank', muscle: 'Core', sets: 3 },
        ],
      },
    ],
  },
  'push-pull-legs': {
    name: 'Push-Pull-Legs',
    label: 'Push • Pull • Legs',
    workouts: [
      {
        name: 'Push',
        exercises: [
          { name: 'Bench Press (Barbell)', muscle: 'Chest', sets: 4 },
          { name: 'Incline Bench Press (Dumbbell)', muscle: 'Chest', sets: 3 },
          { name: 'Dumbbell Fly', muscle: 'Chest', sets: 3 },
          { name: 'Overhead Press (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Lateral Raise (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Tricep Pushdown (Cable)', muscle: 'Arms', sets: 3 },
          { name: 'Skull Crusher', muscle: 'Arms', sets: 3 },
        ],
      },
      {
        name: 'Pull',
        exercises: [
          { name: 'Deadlift (Barbell)', muscle: 'Back', sets: 4 },
          { name: 'Pull Up', muscle: 'Back', sets: 3 },
          { name: 'Barbell Row', muscle: 'Back', sets: 3 },
          { name: 'Seated Row (Machine)', muscle: 'Back', sets: 3 },
          { name: 'Face Pull', muscle: 'Shoulders', sets: 3 },
          { name: 'Bicep Curl (Dumbbell)', muscle: 'Arms', sets: 3 },
          { name: 'Hammer Curl', muscle: 'Arms', sets: 3 },
        ],
      },
      {
        name: 'Legs',
        exercises: [
          { name: 'Squat (Barbell)', muscle: 'Legs', sets: 4 },
          { name: 'Romanian Deadlift (Barbell)', muscle: 'Legs', sets: 3 },
          { name: 'Leg Press', muscle: 'Legs', sets: 3 },
          { name: 'Leg Curl (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Leg Extension (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Calf Raise (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Crunch', muscle: 'Core', sets: 3 },
          { name: 'Plank', muscle: 'Core', sets: 3 },
        ],
      },
    ],
  },
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
  const [selectedSplit, setSelectedSplit] = useState(null);
  const [exampleMenuOpen, setExampleMenuOpen] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapOverlay, setSwapOverlay] = useState(null);
  const oldSplitRef = useRef([]);
  const exampleMenuRef = useRef({});
  const exampleCardRefs = useRef({});
  const currentSplitSectionRef = useRef(null);

  useEffect(() => {
    if (!exampleMenuOpen) return;
    const close = (e) => {
      if (exampleMenuRef.current[exampleMenuOpen]?.contains(e.target)) return;
      setExampleMenuOpen(null);
    };
    const timer = setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', close);
    };
  }, [exampleMenuOpen]);

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

  const remainingTemplates = templates.filter(t => !currentSplit.includes(t));

  const splitGroups = remainingTemplates.reduce((acc, t) => {
    const key = t.splitGroup || '__ungrouped__' + t.id;
    if (!acc[key]) acc[key] = { groupId: key, templates: [] };
    acc[key].templates.push(t);
    return acc;
  }, {});

  const mySplitGroups = Object.values(splitGroups);

  const currentSplitName = currentSplit.length > 0
    ? currentSplit.map(t => t.name).join(' / ').toUpperCase()
    : '';

  const handleMakeCurrentSplit = async (splitKey) => {
    setExampleMenuOpen(null);
    const splitData = EXAMPLE_SPLITS_DATA[splitKey];
    if (!splitData) return;

    const sourceEl = exampleCardRefs.current[splitKey];
    const gridEl = currentSplitSectionRef.current;
    const sourceRect = sourceEl?.getBoundingClientRect();
    const gridRect = gridEl?.getBoundingClientRect();

    oldSplitRef.current = [...currentSplit];
    const newGroupId = Date.now().toString();
    const oldGroupId = Date.now().toString() + '_old';

    if (sourceRect && gridRect && currentSplit.length > 0) {
      // Start old-cards-shaking animation
      setIsSwapping(true);

      // Show the flying overlay — it manages its own stages internally
      setSwapOverlay({
        sourceRect,
        gridRect,
        splitData,
        splitKey,
        onComplete: async () => {
          // After animation finishes: update DB and reload
          const updates = currentSplit.map(t =>
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
          await loadTemplates();
          setSwapOverlay(null);
          setIsSwapping(false);
        },
      });
    } else {
      // Simple swap without animation
      const updates = currentSplit.map(t =>
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
      await loadTemplates();
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
    <div className="min-h-screen bg-background pb-10">
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
        <div className="absolute -inset-8 bg-blue-500/5 rounded-[3rem] blur-3xl pointer-events-none" />

        <div className="relative" ref={currentSplitSectionRef}>
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
            <button
              onClick={() => navigate('/template/new')}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Template
            </button>
          </div>

          {(currentSplit.length > 0 || isSwapping) ? (
            <AnimatePresence mode="wait">
              {isSwapping ? (
                <motion.div
                  key="exiting"
                  exit={{ x: -120, opacity: 0, y: 200 }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.6, 1] }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {oldSplitRef.current.map((template, i) => (
                    <motion.div
                      key={template.id}
                      animate={isSwapping ? {
                        x: [0, -8, 8, -6, 4, 0, -60],
                        opacity: [1, 1, 1, 1, 1, 0.6, 0],
                      } : {}}
                      transition={{ duration: 0.55, delay: i * 0.06, ease: 'easeIn' }}
                      className="bg-card/60 border border-border rounded-lg p-4 shadow-sm"
                    >
                      <h4 className="font-bold text-foreground/60">{template.name}</h4>
                      <p className="text-sm text-muted-foreground/60 mt-1 line-clamp-2">{template.exercises}</p>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="entering"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {currentSplit.map((template) => (
                    <div
                      key={template.id}
                      className="relative bg-card border border-blue-500/20 rounded-lg p-4 shadow-lg shadow-blue-500/5"
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
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-1">No current split</p>
              <p className="text-sm">Choose an example split below to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MY SPLITS ==================== */}
      {mySplitGroups.length > 0 && (
        <div className="px-4 py-2 mb-4">
          <h3 className="font-semibold text-foreground mb-4">My Splits ({mySplitGroups.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mySplitGroups.map((group) => (
              <div
                key={group.groupId}
                onClick={() => setSelectedTemplate(group.templates[0])}
                className="bg-card border border-border rounded-lg p-4 cursor-pointer shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                <h4 className="font-bold text-foreground mb-2">
                  {group.templates.length} workout{group.templates.length !== 1 ? 's' : ''}
                </h4>
                <div className="flex flex-wrap gap-1 mb-2">
                  {group.templates.map(t => (
                    <span key={t.id} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {t.name}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {group.templates.map(t => t.exercises).join(' | ').slice(0, 80)}…
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== EXAMPLE SPLITS ==================== */}
      <div className="px-4 py-2 mb-4">
        <h3 className="font-semibold text-foreground mb-4">Example Splits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(EXAMPLE_SPLITS_DATA).map(([key, split]) => (
            <div
              key={key}
              ref={el => exampleCardRefs.current[key] = el}
              className="bg-card border border-border rounded-xl p-5 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 cursor-pointer" onClick={() => setSelectedSplit(key)}>
                  <h4 className="font-bold text-foreground">{split.name}</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">{split.workouts.length} workouts — {split.label}</p>
                </div>
                <button
                  ref={el => exampleMenuRef.current[key] = el}
                  onClick={e => { e.stopPropagation(); setExampleMenuOpen(exampleMenuOpen === key ? null : key); }}
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition flex-shrink-0 select-none -mt-1 -mr-1"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div onClick={() => setSelectedSplit(key)} className="cursor-pointer">
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {split.workouts.map((w, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{w.name}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portal-rendered example split menu */}
      {exampleMenuOpen && createPortal(
        (() => {
          const btn = exampleMenuRef.current[exampleMenuOpen];
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
                onClick={() => handleMakeCurrentSplit(exampleMenuOpen)}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition rounded-xl"
              >
                Make this my current split
              </button>
            </div>
          );
        })(),
        document.body
      )}

      {/* Swap Animation Overlay */}
      {swapOverlay && createPortal(
        <SwapAnimationOverlay overlay={swapOverlay} />,
        document.body
      )}

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

      {selectedSplit && (
        <SplitDetailModal
          splitKey={selectedSplit}
          onClose={() => setSelectedSplit(null)}
        />
      )}
    </div>
  );
}

// ==================== Swap Animation Overlay Component ====================
function SwapAnimationOverlay({ overlay }) {
  const { sourceRect, gridRect, splitData, onComplete } = overlay;
  const [stage, setStage] = useState('fly-up');
  const workouts = splitData.workouts;

  // Calculate destination center and deltas
  const destCenterX = gridRect.left + gridRect.width / 2;
  const destCenterY = gridRect.top + gridRect.height / 2;
  const cardCenterX = sourceRect.left + sourceRect.width / 2;
  const cardCenterY = sourceRect.top + sourceRect.height / 2;
  const flyDeltaX = destCenterX - cardCenterX;
  const flyDeltaY = destCenterY - cardCenterY;

  // Grid positions for stamp phase
  const columns = window.innerWidth >= 768 ? 2 : 1;
  const gap = 16;
  const headerH = 52;
  const cellW = (gridRect.width - (columns - 1) * gap) / columns;
  const cellH = 140;

  // Auto-advance stages
  useEffect(() => {
    if (stage === 'fly-up') {
      const t = setTimeout(() => setStage('break'), 550);
      return () => clearTimeout(t);
    }
    if (stage === 'break') {
      const t = setTimeout(() => setStage('stamp'), 350);
      return () => clearTimeout(t);
    }
    if (stage === 'stamp') {
      const t = setTimeout(() => onComplete?.(), 550);
      return () => clearTimeout(t);
    }
  }, [stage, onComplete]);

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Flying card — visible during fly-up and break */}
      {(stage === 'fly-up' || stage === 'break') && (
        <motion.div
          className="bg-card border-2 border-blue-400 rounded-2xl p-4 shadow-2xl absolute"
          style={{
            left: sourceRect.left,
            top: sourceRect.top,
            width: sourceRect.width,
            minHeight: sourceRect.height,
          }}
          initial={{ x: 0, y: 0, opacity: 0.6, scale: 1 }}
          animate={
            stage === 'break'
              ? { x: flyDeltaX, y: flyDeltaY, opacity: 0, scale: 1.12 }
              : { x: flyDeltaX, y: flyDeltaY, opacity: 0.9, scale: 1.02 }
          }
          transition={{
            x: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
            y: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
            opacity: stage === 'break' ? { duration: 0.25 } : { duration: 0.3 },
          }}
        >
          <h4 className="font-bold text-foreground text-sm">{splitData.name}</h4>
          <p className="text-xs text-muted-foreground mt-1">{splitData.label}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {workouts.map((w, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                {w.name}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Mini workout cards — visible during break and stamp */}
      {(stage === 'break' || stage === 'stamp') &&
        workouts.map((workout, i) => {
          // Calculate where this card should land in the grid (viewport coords)
          const col = i % columns;
          const row = Math.floor(i / columns);
          const stampX = gridRect.left + col * (cellW + gap);
          const stampY = gridRect.top + headerH + row * (cellH + gap);

          // Burst position (spread outward from center)
          const burstAngle = (i / workouts.length) * Math.PI * 2 - Math.PI / 2;
          const burstR = 90 + i * 15;
          const burstCX = destCenterX + Math.cos(burstAngle) * burstR;
          const burstCY = destCenterY + Math.sin(burstAngle) * burstR;

          // Deltas from center
          const burstDX = burstCX - destCenterX;
          const burstDY = burstCY - destCenterY;
          const stampDX = stampX - destCenterX;
          const stampDY = stampY - destCenterY;

          return (
            <motion.div
              key={`mini-${i}`}
              className="bg-card border border-blue-500/30 rounded-xl p-3 shadow-xl flex flex-col justify-center absolute"
              style={{
                left: destCenterX,
                top: destCenterY,
                width: cellW * 0.7,
              }}
              initial={{ x: -((cellW * 0.7) / 2), y: -(cellH / 2), opacity: 0, scale: 0.3 }}
              animate={
                stage === 'stamp'
                  ? { x: stampDX, y: stampDY, opacity: 1, scale: 1 }
                  : { x: burstDX - (cellW * 0.35), y: burstDY - (cellH * 0.4), opacity: 0.9, scale: 0.8 }
              }
              transition={
                stage === 'stamp'
                  ? {
                      x: { duration: 0.45, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
                      y: { duration: 0.45, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
                      scale: { duration: 0.55, delay: i * 0.08, type: 'spring', stiffness: 200, damping: 16 },
                      opacity: { duration: 0.2, delay: i * 0.08 },
                    }
                  : { duration: 0.35, delay: i * 0.05, ease: 'easeOut' }
              }
            >
              <p className="font-extrabold text-foreground text-sm">{workout.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {workout.exercises.length} exercises
              </p>
              <div className="flex flex-wrap gap-0.5 mt-1.5">
                {workout.exercises.slice(0, 3).map((ex, j) => (
                  <span key={j} className="text-[9px] px-1 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {ex.name.split(' (')[0]}
                  </span>
                ))}
                {workout.exercises.length > 3 && (
                  <span className="text-[9px] text-muted-foreground">+{workout.exercises.length - 3}</span>
                )}
              </div>
            </motion.div>
          );
        })}
    </div>
  );
}