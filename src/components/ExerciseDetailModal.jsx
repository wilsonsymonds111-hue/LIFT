import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProgressGraph from './ProgressGraph';
import { MUSCLE_COLORS } from '../lib/exercises';

export default function ExerciseDetailModal({ exercise, onClose }) {
  const [tab, setTab] = useState('Charts');
  const [history, setHistory] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch workout history for this exercise across all templates
  useEffect(() => {
    base44.entities.WorkoutTemplate.list('sort_order', 200).then(results => {
      const allHistory = [];
      (results || []).forEach(t => {
        const exData = (t.exerciseList || []).find(e => e.name === exercise.name);
        if (exData?.history?.length) {
          exData.history.forEach(h => {
            allHistory.push(typeof h === 'object' ? { ...h } : { kg: h, reps: 8 });
          });
        }
      });
      allHistory.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      setHistory(allHistory);
      setLoadingHistory(false);
    });
  }, [exercise.name]);

  // Fetch or generate exercise detail (instructions + image)
  useEffect(() => {
    setLoadingDetail(true);
    base44.entities.ExerciseDetail.filter({ name: exercise.name }).then(async (results) => {
      if (results?.length > 0) {
        setDetail(results[0]);
        setLoadingDetail(false);
      } else {
        // Generate instructions via LLM
        try {
          const llmRes = await base44.integrations.Core.InvokeLLM({
            prompt: `Write 4 short, numbered step-by-step instructions for how to perform the "${exercise.name}" exercise at the gym. Keep each step to 1-2 sentences. Be clear and concise. Output format: plain text with each step on a new line starting with the number and a period.`,
          });
          const instructions = llmRes?.data || llmRes || '';
          // Generate an image
          let image_url = '';
          try {
            const imgRes = await base44.integrations.Core.GenerateImage({
              prompt: `A clean, anatomical illustration of a person performing the "${exercise.name}" exercise in a gym, showing proper form. Professional fitness illustration style, white background, high quality instructional diagram.`,
            });
            image_url = imgRes?.data?.url || imgRes?.url || '';
          } catch (_) {}
          const newDetail = await base44.entities.ExerciseDetail.create({
            name: exercise.name,
            instructions,
            image_url,
          });
          setDetail(newDetail);
        } catch (_) {}
        setLoadingDetail(false);
      }
    });
  }, [exercise.name]);

  const allEntries = history.length > 0 ? history : [];
  const isBodyweight = allEntries.length > 0
    ? allEntries.every(h => { const kg = h.kg ?? 0; return kg === 0 || kg == null; })
    : false;

  const colors = MUSCLE_COLORS[exercise.muscle] || MUSCLE_COLORS['Full Body'];

  // Latest set & PR
  const latest = history.length > 0 ? history[history.length - 1] : null;
  const maxKg = history.length > 0 ? Math.max(...history.map(h => h.kg || 0)) : 0;
  const isPR = latest && (latest.kg > 0) && (latest.kg >= maxKg);

  // Compute stats
  const stats = history.length > 0
    ? (() => {
        const kgs = history.map(h => h.kg || 0).filter(k => k > 0);
        const reps = history.map(h => h.reps || 0);
        return {
          sessions: history.length,
          best: isBodyweight ? Math.max(...reps) + ' reps' : Math.max(...kgs) + ' kg',
          avg: isBodyweight
            ? Math.round(reps.reduce((a, b) => a + b, 0) / reps.length) + ' reps'
            : Math.round(kgs.reduce((a, b) => a + b, 0) / kgs.length) + ' kg',
          totalSets: history.length,
        };
      })()
    : null;

  const tabs = ['Charts', 'About'];

  const parseInstructions = (text) => {
    if (!text) return [];
    return text.split('\n').filter(line => /^\d+\./.test(line.trim()));
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative bg-card rounded-3xl w-[92%] max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition">
            <X className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-bold text-lg text-foreground tracking-tight">{exercise.name}</h2>
          <div className="w-10" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mx-5 flex-shrink-0">
          {tabs.map(t => (
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
              ) : detail?.image_url ? (
                <div className="relative w-full aspect-video bg-muted rounded-2xl overflow-hidden">
                  <img src={detail.image_url} alt={exercise.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`w-full aspect-video rounded-2xl flex items-center justify-center ${colors.bg}`}>
                  <span className={`text-5xl font-extrabold ${colors.text}`}>{exercise.name[0]}</span>
                </div>
              )}

              {/* Muscle badge */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>{exercise.muscle}</span>
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
                  {latest && (
                    <p className="text-xs font-semibold text-muted-foreground text-center">
                      Latest set: {isBodyweight ? '' : `${latest.kg} kg × `}{latest.reps} reps{isPR && !isBodyweight ? <span className="text-yellow-500 ml-1">🏆 PR</span> : ''}
                    </p>
                  )}
                  <ProgressGraph history={history} animKey={history.length} animDir="add" isBodyweight={isBodyweight} />
                  {stats && (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Sessions', value: stats.sessions },
                        { label: 'Best', value: stats.best },
                        { label: isBodyweight ? 'Avg Reps' : 'Avg Weight', value: stats.avg },
                      ].map(s => (
                        <div key={s.label} className="bg-muted/60 rounded-xl px-3 py-3 text-center">
                          <p className="text-xl font-extrabold text-foreground">{s.value}</p>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
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