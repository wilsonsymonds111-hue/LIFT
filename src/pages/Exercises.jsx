import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { MUSCLES } from '../lib/exercises';
import { getAllExercises, saveCustomExercise } from '../lib/customExercises';
import { findSimilarExercise, tokenMatchesName } from '../lib/exerciseSearch';
import NoResultsSuggestion from '../components/exercises/NoResultsSuggestion';
import CreateExerciseModal from '../components/exercises/CreateExerciseModal';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getExerciseDetailList } from '../lib/exerciseCache';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import { useLocation } from 'react-router-dom';
import ExerciseList from '../components/ExerciseList';

const ExerciseDetailModal = lazy(() => import('../components/ExerciseDetailModal'));

const SAFE_AREA_PT = { paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' };

export default function Exercises() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseImages, setExerciseImages] = useState({});
  const [customExercisesVersion, setCustomExercisesVersion] = useState(0);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const pageRef = useRef(null);
  const searchBarRef = useRef(null);

  // Sticky search bar: track the scroll container's scrollY to transition the
  // portaled search bar from its natural position (below the title) to pinned
  // at the very top — simulating position:sticky while keeping it above the
  // alphabet blur via the body portal.
  useEffect(() => {
    let el = pageRef.current?.parentElement;
    while (el) {
      const style = getComputedStyle(el);
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) break;
      el = el.parentElement;
    }
    if (!el) return;
    const onScroll = () => {
      if (!searchBarRef.current) return;
      const naturalTop = 72; // 4.5rem — below the title
      const stuckTop = 8;    // 0.5rem — pinned at the very top
      const top = Math.max(stuckTop, naturalTop - el.scrollTop);
      searchBarRef.current.style.top = `calc(env(safe-area-inset-top) + ${top}px)`;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Drag-to-scroll for the muscle filter pills. The swipeable-tab container
  // (App.jsx) sets touch-action: pan-y and captures horizontal drags for
  // tab-swiping; a child can't override that (pan-x ∩ pan-y = none), so native
  // overflow scrolling is blocked. We stop the tab drag from starting and
  // drive the scroll manually with pointer events.
  const pillsRef = useRef(null);
  const pillsDrag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const justDraggedRef = useRef(false);

  const onPillsPointerMove = (e) => {
    if (!pillsDrag.current.active) return;
    const el = pillsRef.current;
    if (!el) return;
    const dx = e.clientX - pillsDrag.current.startX;
    if (Math.abs(dx) > 5) pillsDrag.current.moved = true;
    el.scrollLeft = pillsDrag.current.startScroll - dx;
  };

  const onPillsPointerUp = () => {
    if (pillsDrag.current.moved) {
      justDraggedRef.current = true;
      window.setTimeout(() => { justDraggedRef.current = false; }, 60);
    }
    pillsDrag.current.active = false;
    window.removeEventListener('pointermove', onPillsPointerMove);
    window.removeEventListener('pointerup', onPillsPointerUp);
    window.removeEventListener('pointercancel', onPillsPointerUp);
  };

  const onPillsPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();
    const el = pillsRef.current;
    if (!el) return;
    pillsDrag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
    window.addEventListener('pointermove', onPillsPointerMove);
    window.addEventListener('pointerup', onPillsPointerUp);
    window.addEventListener('pointercancel', onPillsPointerUp);
  };

  const handlePillClick = (m) => {
    if (justDraggedRef.current) return;
    setMuscleFilter(m === muscleFilter ? 'All' : m);
  };

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 100);
  }, []);

  const handleSelectExercise = useCallback((ex) => {
    setSelectedExercise(ex);
  }, []);

  const { data: exerciseHistoryData = {} } = useExerciseHistory();

  const exerciseHistory = useMemo(() => {
    const historyMap = {};
    Object.entries(exerciseHistoryData).forEach(([name, history]) => {
      if (history?.length > 0) {
        historyMap[name] = history
          .map(h => ({ kg: h.kg || 0, v: h.reps || 0, date: h.date || null }))
          .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      }
    });
    return historyMap;
  }, [exerciseHistoryData]);

  useEffect(() => {
    getExerciseDetailList().then(detailResults => {
      const imageMap = {};
      (detailResults || []).forEach(d => {
        if (d.image_url) imageMap[d.name] = d.image_url;
      });
      setExerciseImages(imageMap);
    });
  }, []);

  const [allExercises, setAllExercises] = useState([]);
  useEffect(() => {
    getAllExercises().then(setAllExercises);
  }, [customExercisesVersion]);
  
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) {
      return allExercises.filter(ex => muscleFilter === 'All' || ex.muscle === muscleFilter);
    }
    // Token-based fuzzy search: every query word must match the exercise name.
    // Handles typos like "dumbell" → "dumbbell" via Levenshtein distance.
    // When searching, ignore the muscle filter so all matching exercises appear
    const queryTokens = q.split(/\s+/).filter(Boolean);
    return allExercises.filter(ex =>
      queryTokens.every(token => tokenMatchesName(token, ex.name))
    );
  }, [allExercises, debouncedSearch, muscleFilter]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(ex => {
      const letter = ex.name[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(ex);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const suggestion = useMemo(() => {
    if (filtered.length > 0 || !debouncedSearch.trim()) return null;
    return findSimilarExercise(debouncedSearch, allExercises);
  }, [filtered.length, debouncedSearch, allExercises]);

  const handleSelectSuggestion = useCallback((ex) => {
    setSelectedExercise(ex);
  }, []);

  const handleCreateCustom = useCallback(async () => {
    const raw = debouncedSearch.trim();
    if (!raw) return;
    const capitalizedName = raw.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    setCreating(true);
    try {
      let muscle = 'Full Body';
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `What primary muscle group does the exercise "${capitalizedName}" target? Respond with exactly one word from: Arms, Back, Chest, Core, Full Body, Legs, Shoulders`,
          response_json_schema: {
            type: 'object',
            properties: { muscle: { type: 'string', enum: ['Arms', 'Back', 'Chest', 'Core', 'Full Body', 'Legs', 'Shoulders'] } },
            required: ['muscle'],
          },
        });
        muscle = res?.muscle || 'Full Body';
      } catch {}
      await saveCustomExercise({ name: capitalizedName, muscle });
      setCustomExercisesVersion(v => v + 1);
      setSearch('');
      setDebouncedSearch('');
      setSelectedExercise({ name: capitalizedName, muscle });
    } catch (e) {
      console.error('Failed to create custom exercise:', e);
    } finally {
      setCreating(false);
    }
  }, [debouncedSearch]);

  const handleCreateFromModal = useCallback(async (rawName) => {
    const capitalizedName = rawName.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    setCreating(true);
    try {
      let muscle = 'Full Body';
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `What primary muscle group does the exercise "${capitalizedName}" target? Respond with exactly one word from: Arms, Back, Chest, Core, Full Body, Legs, Shoulders`,
          response_json_schema: {
            type: 'object',
            properties: { muscle: { type: 'string', enum: ['Arms', 'Back', 'Chest', 'Core', 'Full Body', 'Legs', 'Shoulders'] } },
            required: ['muscle'],
          },
        });
        muscle = res?.muscle || 'Full Body';
      } catch {}
      await saveCustomExercise({ name: capitalizedName, muscle });
      setCustomExercisesVersion(v => v + 1);
      setShowCreateModal(false);
      setSelectedExercise({ name: capitalizedName, muscle });
    } catch (e) {
      console.error('Failed to create custom exercise:', e);
    } finally {
      setCreating(false);
    }
  }, []);

  return (
    <div ref={pageRef} className="exercises-gradient pb-24">
      {/* Header */}
      <div className="px-4 pb-3 flex items-center justify-between" style={SAFE_AREA_PT}>
        <h1 className="text-4xl font-extrabold text-foreground leading-tight">Exercises</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-card text-blue-500 dark:text-blue-400 hover:scale-105 active:scale-95 transition-all duration-150 border border-gray-200/70 dark:border-border flex-shrink-0"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Search — portaled to body so it sits above the alphabet blur strip */}
      {createPortal(
        <div
          ref={searchBarRef}
          className={`fixed left-4 right-4 z-[35] ${location.pathname === '/exercises' ? '' : 'hidden'}`}
          style={{ top: 'calc(env(safe-area-inset-top) + 4.5rem)' }}
        >
          <div className="flex items-center gap-2 bg-white/30 dark:bg-white/10 rounded-full px-4 py-3.5 backdrop-filter backdrop-blur-md border border-white/40 dark:border-white/20 shadow-sm">
            <Search className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search exercises"
              className="bg-transparent text-sm flex-1 focus:outline-none text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium"
            />
          </div>
        </div>,
        document.body
      )}
      {/* Spacer to preserve layout flow */}
      <div className="px-4 pb-3" style={{ height: 'calc(1rem + 3.5rem)' }} />

      {/* Filter pills */}
      <div className="pb-3 relative">
        <div
          ref={pillsRef}
          className="px-4 flex gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'pan-x', overscrollBehavior: 'contain' }}
          onPointerDown={onPillsPointerDown}
        >
          {MUSCLES.filter(m => m !== 'All').map(m => (
            <button
              key={m}
              onClick={() => handlePillClick(m)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                muscleFilter === m
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-card text-foreground border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-muted'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

      </div>

      {filtered.length === 0 && debouncedSearch.trim() ? (
        <NoResultsSuggestion
          query={debouncedSearch}
          suggestion={suggestion}
          onSelectSuggestion={handleSelectSuggestion}
          onCreateCustom={handleCreateCustom}
          creating={creating}
        />
      ) : (
        <ExerciseList grouped={grouped} exerciseHistory={exerciseHistory} exerciseImages={exerciseImages} onSelectExercise={handleSelectExercise} />
      )}

      {showCreateModal && (
        <CreateExerciseModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateFromModal}
        />
      )}

      {selectedExercise && (
        <Suspense fallback={null}>
          <ExerciseDetailModal
            exercise={selectedExercise}
            initialImage={exerciseImages[selectedExercise.name]}
            initialHistory={exerciseHistory[selectedExercise.name]?.map(h => ({ kg: h.kg, reps: h.v, date: h.date })) || null}
            onClose={() => setSelectedExercise(null)}
            onExerciseDeleted={() => setCustomExercisesVersion(v => v + 1)}
          />
        </Suspense>
      )}
    </div>
  );
}