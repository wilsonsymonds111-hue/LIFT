import { useState, useRef, useEffect } from 'react';
import { Trophy, Clock, Share, X } from 'lucide-react';
import { playCompleteChime } from '../../lib/workoutSounds';
import RestDayPromptModal from '../RestDayPromptModal';
import InstagramShareInstructions from './InstagramShareInstructions';
import { makeTodayWorkoutDay } from '../../lib/restDayCheck';

function InstagramIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="2" fill="none"/>
      <circle cx="17.5" cy="6.5" r="1" fill="white"/>
    </svg>
  );
}

function Star({ size = 24, delay = 0 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
      className="text-yellow-400 animate-bounce"
      style={{ animationDelay: `${delay}ms`, animationDuration: '0.6s', animationIterationCount: 3 }}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

export default function SummaryScreen({ template, exercises, prs, bestSets, durationDisplay, onDone, isRestDay, allTemplates }) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const cardRef = useRef(null);
  const listRef = useRef(null);
  const igStickerRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [igSharing, setIgSharing] = useState(false);
  const [igImageUrl, setIgImageUrl] = useState(null);
  const [shimmer, setShimmer] = useState(false);
  const [showRestDayPrompt, setShowRestDayPrompt] = useState(false);

  const prSet = new Set(prs.map(p => p.name));

  const handleDone = () => {
    if (isRestDay && !showRestDayPrompt) {
      setShowRestDayPrompt(true);
      return;
    }
    onDone();
  };

  const handleConfirmRestDayChange = () => {
    makeTodayWorkoutDay(allTemplates);
    onDone();
  };

  const handleCancelRestDayChange = () => {
    onDone();
  };

  useEffect(() => {
    setTimeout(() => setShimmer(true), 200);
    playCompleteChime();
  }, []);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      // Temporarily expand the scrollable list so the screenshot captures all exercises
      const list = listRef.current;
      const prevOverflow = list?.style.overflow;
      const prevMaxHeight = list?.style.maxHeight;
      if (list) { list.style.overflow = 'visible'; list.style.maxHeight = 'none'; }
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
      if (list) { list.style.overflow = prevOverflow; list.style.maxHeight = prevMaxHeight; }
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'workout.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `${template.name} Workout` });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = 'workout.png'; a.click();
          URL.revokeObjectURL(url);
        }
        setSharing(false);
      }, 'image/png');
    } catch { setSharing(false); }
  };

  const handleInstagramShare = async () => {
    if (!igStickerRef.current) return;
    setIgSharing(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(igStickerRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        width: 390,
        height: 844,
      });
      const url = canvas.toDataURL('image/png');
      setIgImageUrl(url);
      setIgSharing(false);
    } catch { setIgSharing(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto">
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative bg-gray-50 rounded-3xl w-[92%] max-w-sm max-h-[88vh] flex flex-col shadow-2xl overflow-y-auto"
          style={{ animation: 'none' }}>

          <div className="flex items-center justify-between px-4 pt-4 pb-1 flex-shrink-0">
            <button onClick={handleDone} className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition">
              <X className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-end gap-1">
              <Star size={22} delay={0} />
              <Star size={30} delay={120} />
              <Star size={22} delay={240} />
            </div>
            <button onClick={handleShare} disabled={sharing} className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition">
              <Share className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="text-center px-4 pb-3 flex-shrink-0">
            <h1 className="text-2xl font-extrabold text-gray-900">Well Done!</h1>
            <p className="text-gray-500 text-sm mt-0.5">You crushed your {template.name} workout!</p>
          </div>

          <div ref={cardRef}
            className={`mx-4 mb-4 bg-white rounded-2xl border-2 overflow-hidden relative flex-shrink-0 ${shimmer ? 'gold-shimmer' : ''}`}
            style={{ borderColor: '#FFD700', boxShadow: '0 0 20px rgba(255,215,0,0.3)' }}>

            <div className="px-4 pt-4 pb-2 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-gray-900 text-lg tracking-wide">{template.name}</h2>
                  <p className="text-gray-500 text-xs mt-0.5">{today}</p>
                </div>
                <div className="text-3xl">🏆</div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{durationDisplay}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-yellow-600">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{prs.length} PR{prs.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-yellow-200" />

            <div ref={listRef} className="px-4 pt-3 pb-4 space-y-2">
              {exercises.map((ex, i) => {
                const best = bestSets[ex.name];
                const isPR = prSet.has(ex.name);
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs text-gray-700 font-medium leading-snug">{ex.sets} × {ex.name}</span>
                      {isPR && (
                        <span className="flex-shrink-0 text-[10px] font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full leading-none">PR</span>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-gray-500 font-semibold">
                      {best ? (best.kg ? `${best.kg} kg × ${best.reps}` : `${best.reps} reps`) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-4 pb-5 flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={handleInstagramShare}
              disabled={igSharing}
              className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-2xl text-sm transition active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(90deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
            >
              <InstagramIcon size={20} />
              {igSharing ? 'Preparing…' : 'Share to Instagram Story'}
            </button>
            <button
              onClick={handleDone}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-2xl text-sm transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <div
        ref={igStickerRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '390px',
          height: '844px',
          background: 'transparent',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 28px 50px',
          boxSizing: 'border-box',
        }}
      >
        <div>
          {template.name.split(' ').map((word, wi) => (
            <div key={wi} style={{
              fontSize: '56px',
              fontWeight: '900',
              lineHeight: 1.05,
              letterSpacing: '-1px',
              color: wi % 2 === 1 ? '#FFD700' : '#ffffff',
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
              textTransform: 'uppercase',
            }}>{word}</div>
          ))}
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#aaaaaa', letterSpacing: '4px', textTransform: 'uppercase', marginTop: '6px', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>WORKOUT</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px 10px' }}>
              <span style={{ fontSize: '13px', color: '#ccc' }}>📅</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{today}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px 10px' }}>
              <span style={{ fontSize: '13px', color: '#ccc' }}>⏱</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{durationDisplay}</span>
            </div>
            {prs.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFD700', borderRadius: '10px', padding: '6px 10px' }}>
                <span style={{ fontSize: '13px' }}>🏆</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#000' }}>{prs.length} PR</span>
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)', margin: '24px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {exercises.map((ex, i) => {
              const best = bestSets[ex.name];
              const isPR = prSet.has(ex.name);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '16px' }}>💪</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', lineHeight: 1.3, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>{ex.sets} × {ex.name}</div>
                    </div>
                    {isPR && (
                      <div style={{ background: '#FFD700', borderRadius: '6px', padding: '2px 7px', flexShrink: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#000' }}>PR</span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '13px', color: '#aaa', fontWeight: '600', flexShrink: 0, marginLeft: '8px', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
                    {best ? (best.kg ? `${best.kg} kg × ${best.reps}` : `${best.reps} reps`) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
          {[
            { label: 'DURATION', value: durationDisplay, emoji: '⏱' },
            { label: "PR'S HIT", value: prs.length, emoji: '🏆' },
            { label: 'EXERCISES', value: exercises.length, emoji: '🏋️' },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1,
              padding: '14px 8px',
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFD700', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {igImageUrl && (
        <InstagramShareInstructions
          imageUrl={igImageUrl}
          onClose={() => setIgImageUrl(null)}
        />
      )}

      {showRestDayPrompt && (
        <RestDayPromptModal
          onConfirm={handleConfirmRestDayChange}
          onCancel={handleCancelRestDayChange}
        />
      )}
    </>
  );
}