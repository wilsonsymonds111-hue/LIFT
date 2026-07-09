import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Camera } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ensureExerciseDetail } from '../lib/ensureExerciseDetail';
import { getExerciseDetailList, invalidateExerciseCache } from '../lib/exerciseCache';
import ProgressGraph from './ProgressGraph';
import ExerciseHistoryList from './ExerciseHistoryList';
import { MUSCLE_COLORS } from '../lib/exercises';
import { isCustomExercise, deleteCustomExercise } from '../lib/customExercises';

const TABS = ['Charts', 'About'];

const parseInstructions = (text) => {
  if (!text) return [];
  return text.split('\n').filter(line => /^\d+\./.test(line.trim()));
};

export default function ExerciseDetailModal({ exercise, onClose, initialTab, initialHistory, initialImage, onExerciseDeleted }) {
  const [tab, setTab] = useState(initialTab || 'About');
  const [history, setHistory] = useState(initialHistory || []);
  const [detail, setDetail] = useState(initialImage ? { image_url: initialImage } : null);
  const [loadingDetail, setLoadingDetail] = useState(!initialImage);
  const [loadingHistory, setLoadingHistory] = useState(!initialHistory);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  // Fetch workout history from the Exercise entity — skip if initialHistory provided
  useEffect(() => {
    if (initialHistory) { setLoadingHistory(false); return; }
    base44.entities.Exercise.filter({ name: exercise.name }).then(results => {
      if (results.length > 0) {
        setHistory(results[0].history || []);
      } else {
        setHistory([]);
      }
      setLoadingHistory(false);
    });
  }, [exercise.name, initialHistory]);

  // Fetch or generate exercise detail (instructions + image)
  useEffect(() => {
    // Use cached ExerciseDetail list (already warmed by parent pages) to avoid a fresh API call
    getExerciseDetailList().then(async (cached) => {
      const cachedDetail = (cached || []).find(d => d.name === exercise.name);
      // If we already have instructions in cache, use them immediately
      if (cachedDetail?.instructions) {
        setDetail(prev => ({ ...cachedDetail, image_url: prev?.image_url || cachedDetail.image_url }));
        setLoadingDetail(false);
        return;
      }
      // Set partial detail (image/muscles) if available
      if (cachedDetail?.image_url || initialImage) {
        setDetail(prev => ({ ...prev, image_url: initialImage || cachedDetail?.image_url }));
      }
      // Parallelize: fetch detail record + generate instructions at the same time
      try {
        const [generated, llmRes] = await Promise.all([
          ensureExerciseDetail(exercise.name),
          base44.integrations.Core.InvokeLLM({
            prompt: `Write 4 short, numbered step-by-step instructions for how to perform the "${exercise.name}" exercise at the gym. Keep each step to 1-2 sentences. Be clear and concise. Output format: plain text with each step on a new line starting with the number and a period.`,
          }),
        ]);
        const instructions = llmRes?.data || llmRes || '';
        // Update the existing record with instructions — no need for another filter() call
        if (generated.id) {
          await base44.entities.ExerciseDetail.update(generated.id, { instructions });
        }
        setDetail(prev => ({
          ...prev,
          image_url: generated.image_url || initialImage || prev?.image_url,
          muscles_worked: generated.muscles_worked || prev?.muscles_worked,
          instructions,
        }));
      } catch (_) {}
      setLoadingDetail(false);
    });
  }, [exercise.name, initialImage]);

  const isBodyweight = useMemo(() => {
    const allEntries = history.length > 0 ? history : [];
    return allEntries.length > 0
      ? allEntries.every(h => { const kg = h.kg ?? 0; return kg === 0 || kg == null; })
      : false;
  }, [history]);

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      // Find or create an ExerciseDetail record with the EXACT exercise name
      const allDetails = await getExerciseDetailList();
      const existing = allDetails?.find(d => d.name.toLowerCase() === exercise.name.toLowerCase());
      if (existing) {
        await base44.entities.ExerciseDetail.update(existing.id, { image_url: file_url });
      } else {
        await base44.entities.ExerciseDetail.create({ name: exercise.name, image_url: file_url });
      }
      invalidateExerciseCache();
      setDetail(prev => ({ ...prev, image_url: file_url }));
    } catch (e) {
      console.error('Image upload failed:', e);
    } finally {
      setUploadingImage(false);
    }
  };

  const colors = MUSCLE_COLORS[exercise.muscle] || MUSCLE_COLORS['Full Body'];

  const chartIsBodyweight = isBodyweight;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative bg-card rounded-3xl w-[92%] max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition flex-shrink-0">
            <X className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-bold text-lg text-foreground tracking-tight text-center flex-1 px-2 truncate">{exercise.name}</h2>
          {isCustomExercise(exercise.name) ? (
            <button
              onClick={() => {
                if (window.confirm(`Delete "${exercise.name}" from your exercise list?`)) {
                  deleteCustomExercise(exercise.name);
                  onExerciseDeleted?.();
                  onClose();
                }
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mx-5 flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 pb-3 pt-1 text-sm font-semibold transition-colors ${
                tab === t
                  ? 'text-foreground border-b-2 border-blue-500 -mb-[1px]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto px-5 py-4" style={{ minHeight: '320px' }}>
          {/* About Tab */}
          {tab === 'About' && (
            <div className="space-y-4">
              {/* Image */}
              {loadingDetail ? (
                <div className="w-full aspect-video bg-muted rounded-2xl flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="relative w-full bg-muted rounded-2xl overflow-hidden group">
                  {detail?.image_url ? (
                    <img src={detail.image_url} alt={exercise.name} className="w-full block" loading="lazy" decoding="async" />
                  ) : (
                    <div className={`w-full aspect-video flex items-center justify-center ${colors.bg}`}>
                      <span className={`text-5xl font-extrabold ${colors.text}`}>{exercise.name[0]}</span>
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition"
                    title="Replace image"
                  >
                    {uploadingImage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }}
                    className="hidden"
                  />
                </div>
              )}

              {/* Muscle info */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-foreground">Muscles Worked</p>
                {detail?.muscles_worked && (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.muscles_worked.split(',').map(m => (
                      <span key={m.trim()} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                        {m.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              {loadingDetail ? (
                <div className="space-y-3">
                  <p className="font-bold text-foreground">Instructions</p>
                  <div className="space-y-2">
                    {[1,2,3,4].map(i => <div key={i} className="h-4 bg-muted rounded animate-pulse" />)}
                  </div>
                </div>
              ) : detail?.instructions ? (
                <div>
                  <p className="font-bold text-foreground mb-2">Instructions</p>
                  <ol className="list-decimal list-inside space-y-2">
                    {parseInstructions(detail.instructions).map((line, i) => (
                      <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {line.replace(/^\d+\.\s*/, '')}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No instructions available yet.</p>
              )}
            </div>
          )}

          {/* Charts Tab */}
          {tab === 'Charts' && (
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : history.length > 0 ? (
                <>
                  <ProgressGraph
                    history={history}
                    animKey={`weight-${history.length}`}
                    animDir="add"
                    isBodyweight={chartIsBodyweight}
                    exerciseName={exercise.name}
                  />
                  <ExerciseHistoryList
                    history={history}
                    exerciseName={exercise.name}
                    onEntryDeleted={(updated) => setHistory(updated)}
                  />
                </>
              ) : (
                <p className="text-center text-muted-foreground py-12">No workout history yet. Start a workout to see your progress!</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}