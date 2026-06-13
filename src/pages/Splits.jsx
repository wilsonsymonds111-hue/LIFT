import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SplitDetailModal from '../components/SplitDetailModal';

const EXAMPLE_SPLITS_DATA = {
  'upper-lower': {
    name: 'Upper-Lower Split',
    label: 'Upper • Lower',
    workouts: [
      {
        name: 'Upper Body Workout',
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
        name: 'Lower Body Workout',
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
        name: 'Push Workout',
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
        name: 'Pull Workout',
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
        name: 'Legs Workout',
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

export default function Splits() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSplit, setSelectedSplit] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [swapping, setSwapping] = useState(false);
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

  // If user has no saved splits, auto-switch to examples tab
  useEffect(() => {
    if (!loading && mySplitGroups.length === 0) {
      setActiveTab('examples');
    }
  }, [loading, mySplitGroups.length]);

  const handleMakeCurrentSplit = async (splitKey) => {
    setMenuOpen(null);
    setSwapping(true);
    const splitData = EXAMPLE_SPLITS_DATA[splitKey];
    if (!splitData) { setSwapping(false); return; }

    try {
      const newGroupId = Date.now().toString();
      const oldGroupId = Date.now().toString() + '_old';

      // Load all templates to find current active split
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
    } catch (_) {
      // silently handle
    }
    setSwapping(false);
    navigate('/');
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
      <div className="px-4 pt-4 pb-3" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' }}>
        <h1 className="text-3xl font-extrabold text-foreground leading-tight">Splits</h1>
      </div>

      {/* Top Tabs */}
      <div className="px-4 mb-5">
        <div className="flex bg-muted rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('mine')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'mine'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Splits
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
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
          <div className="text-center py-16 text-muted-foreground">
            <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium mb-1">No saved splits yet</p>
            <p className="text-sm">Your previous splits will appear here.</p>
          </div>
        </div>
      )}

      {/* Example Splits Tab */}
      {activeTab === 'examples' && (
        <div className="px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(EXAMPLE_SPLITS_DATA).map(([key, split]) => (
              <div
                key={key}
                className="bg-card border border-border rounded-xl p-5 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 cursor-pointer" onClick={() => setSelectedSplit(key)}>
                    <h4 className="font-bold text-foreground">{split.name}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {split.workouts.length} workouts — {split.label}
                    </p>
                  </div>
                  <button
                    ref={el => menuRef.current[key] = el}
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === key ? null : key); }}
                    className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted transition flex-shrink-0 select-none -mt-1 -mr-1"
                  >
                    <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="8" cy="3" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="13" r="1.5" />
                    </svg>
                  </button>
                </div>
                <div onClick={() => setSelectedSplit(key)} className="cursor-pointer">
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {split.workouts.map((w, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
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

      {/* Split detail modal */}
      {selectedSplit && (
        <SplitDetailModal
          splitKey={selectedSplit}
          onClose={() => setSelectedSplit(null)}
        />
      )}
    </div>
  );
}