import { useState, useEffect, memo } from 'react';
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

  // Mini sparkline
  const sparkPoints = entries.length > 1
    ? (() => {
        const reversed = [...entries].reverse();
        const weights = reversed.map(e => e.weight);
        const min = Math.min(...weights);
        const max = Math.max(...weights);
        const range = max - min || 1;
        return reversed.map((e, i) => {
          const x = (i / (reversed.length - 1)) * 100;
          const y = 20 - ((e.weight - min) / range) * 16 - 2;
          return `${x},${y}`;
        }).join(' ');
      })()
    : null;

  return (
    <>
      <div className="px-4 py-1.5">
        <div
          onClick={() => setShowModal(true)}
          className="bg-white dark:bg-card rounded-[20px] p-3.5 shadow-sm cursor-pointer active:scale-[0.98] transition"
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

            {sparkPoints && (
              <svg viewBox="0 0 100 20" className="w-14 h-7 flex-shrink-0" preserveAspectRatio="none">
                <polyline
                  points={sparkPoints}
                  fill="none"
                  stroke="rgb(168, 85, 247)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
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