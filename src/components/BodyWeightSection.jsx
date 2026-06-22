import { useState, useEffect, memo } from 'react';
import { Scale, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BodyWeightChartModal from './BodyWeightChartModal';

function BodyWeightSection() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [quickWeight, setQuickWeight] = useState('');
  const [saving, setSaving] = useState(false);

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
  const previous = entries[1];
  const trend = !latest || !previous ? null :
    latest.weight > previous.weight ? 'up' :
    latest.weight < previous.weight ? 'down' : 'flat';
  const trendValue = latest && previous ? (latest.weight - previous.weight).toFixed(1) : null;

  const handleQuickLog = async () => {
    const w = parseFloat(quickWeight);
    if (!w || w <= 0) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await base44.entities.BodyWeight.create({ weight: w, date: today });
      setQuickWeight('');
      await fetchEntries();
    } catch (e) {
      console.error('Failed to save body weight:', e);
    }
    setSaving(false);
  };

  // Mini sparkline points
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
      <div className="px-4 py-2">
        <div
          onClick={() => setShowModal(true)}
          className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <Scale className="w-4.5 h-4.5 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Body Weight</p>
                <p className="text-[11px] text-muted-foreground">Tap to view chart & history</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-2">
              {loading ? (
                <div className="h-7 w-20 bg-muted rounded animate-pulse" />
              ) : latest ? (
                <>
                  <span className="text-2xl font-extrabold text-foreground">{latest.weight}</span>
                  <span className="text-sm text-muted-foreground font-medium">kg</span>
                  {trend && (
                    <span className={`flex items-center gap-0.5 text-xs font-semibold ml-1 ${
                      trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-emerald-500' : 'text-muted-foreground'
                    }`}>
                      {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                      {trend === 'down' && <TrendingDown className="w-3 h-3" />}
                      {trend === 'flat' && <Minus className="w-3 h-3" />}
                      {trendValue > 0 && `+${trendValue}`}
                      {trendValue < 0 && trendValue}
                      {trend === 'flat' && '0'}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No data yet</span>
              )}
            </div>

            {sparkPoints && (
              <svg viewBox="0 0 100 20" className="w-24 h-10 flex-shrink-0" preserveAspectRatio="none">
                <polyline
                  points={sparkPoints}
                  fill="none"
                  stroke="rgb(16, 185, 129)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          {/* Quick log */}
          <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
            <input
              type="number"
              step="0.1"
              value={quickWeight}
              onChange={e => setQuickWeight(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleQuickLog()}
              placeholder="Log today's weight (kg)"
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              onClick={handleQuickLog}
              disabled={saving || !quickWeight}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition active:scale-95"
            >
              {saving ? '…' : 'Log'}
            </button>
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