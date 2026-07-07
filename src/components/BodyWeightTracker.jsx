import { useState, useEffect } from 'react';
import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BodyWeightTracker() {
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    base44.entities.BodyWeight.list('-date', 30).then(results => {
      setEntries(results || []);
    }).catch(() => {});
  }, []);

  const latest = entries[0];
  const previous = entries[1];
  const trend = !latest || !previous ? null :
    latest.weight > previous.weight ? 'up' :
    latest.weight < previous.weight ? 'down' : 'flat';

  const handleSave = async () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const entry = await base44.entities.BodyWeight.create({ weight: w, date: today });
      setEntries(prev => [entry, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
      setWeight('');
    } catch (e) {
      console.error('Failed to save body weight:', e);
    }
    setSaving(false);
  };

  return (
    <div className="bg-white dark:bg-card rounded-2xl px-4 py-3.5 border border-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center flex-shrink-0">
          <Scale className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm">Body Weight</p>
          {latest ? (
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{latest.weight} kg</p>
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
              {trend === 'flat' && <Minus className="w-3 h-3 text-muted-foreground" />}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No weight logged yet</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="Weight (kg)"
          className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSave}
          disabled={saving || !weight}
          className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition active:scale-95"
        >
          {saving ? '…' : 'Log'}
        </button>
      </div>
    </div>
  );
}