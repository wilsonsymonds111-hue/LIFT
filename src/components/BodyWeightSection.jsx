import { useState, useEffect, memo, useMemo } from 'react';
import { Scale, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BodyWeightChartModal from './BodyWeightChartModal';

function BodyWeightSection() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchEntries = async () => {
    try {
      const results = await base44.entities.BodyWeight.list('-date', 30);
      setEntries(results || []);
    } catch {
      setEntries([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const latest = entries[0];
  const dateLabel = latest?.date
    ? new Date(latest.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '';

  // Mini sparkline — matches the exercise card style (blue line, blue dots, gold latest dot)
  const sparkline = useMemo(() => {
    if (entries.length < 2) return null;
    const reversed = [...entries].reverse();
    const weights = reversed.map(e => e.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min || 1;
    const W = 64, H = 24, PAD = 4;
    const innerW = W - PAD * 2;
    const innerH = H - PAD * 2;
    const total = weights.length;
    const stepX = total === 1 ? 0 : innerW / (total - 1);
    const pts = weights.map((v, i) => ({
      x: PAD + (total === 1 ? innerW / 2 : i * stepX),
      y: PAD + innerH - ((v - min) / range) * innerH,
    }));
    const dotIndices = [];
    const step = Math.max(1, Math.ceil(total / 5));
    for (let i = 0; i < total; i += step) dotIndices.push(i);
    if (!dotIndices.includes(total - 1)) dotIndices.push(total - 1);
    return { pts, dotIndices };
  }, [entries]);

  return (
    <>
      <div className="px-4 py-1.5">
        <div
          onClick={() => setShowModal(true)}
          className="bg-white dark:bg-card rounded-[20px] p-3.5 cursor-pointer active:scale-[0.98] transition"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/40 rounded-md flex items-center justify-center">
                <Scale className="w-3 h-3 text-purple-500" />
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-muted-foreground">Weight</span>
            </div>
            <div className="flex items-center gap-0.5">
              {dateLabel && <span className="text-xs text-gray-400 dark:text-muted-foreground">{dateLabel}</span>}
              <ChevronRight className="w-3 h-3 text-gray-400 dark:text-muted-foreground" />
            </div>
          </div>

          {/* Body */}
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              {loading ? (
                <div className="h-6 w-16 bg-gray-100 dark:bg-muted rounded animate-pulse" />
              ) : latest ? (
                <>
                  <span className="text-2xl font-bold text-black dark:text-foreground">{latest.weight}</span>
                  <span className="text-xs text-gray-400 dark:text-muted-foreground font-medium">kg</span>
                </>
              ) : (
                <span className="text-sm text-gray-400 dark:text-muted-foreground">Tap to log</span>
              )}
            </div>

            {sparkline && (
              <svg width={64} height={24} viewBox="0 0 64 24" className="flex-shrink-0 block" overflow="visible">
                <polyline
                  points={sparkline.pts.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {sparkline.dotIndices.filter(i => i !== sparkline.pts.length - 1).map((idx, n) => (
                  <circle key={n} cx={sparkline.pts[idx].x} cy={sparkline.pts[idx].y} r={1.8} fill="#A855F7" stroke="white" strokeWidth={0.8} />
                ))}
                <circle cx={sparkline.pts[sparkline.pts.length - 1].x} cy={sparkline.pts[sparkline.pts.length - 1].y} r={2.5} fill="#d4a017" stroke="white" strokeWidth={0.8} />
              </svg>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <BodyWeightChartModal
          entries={entries}
          onClose={() => setShowModal(false)}
          onChanged={fetchEntries}
        />
      )}
    </>
  );
}

export default memo(BodyWeightSection);