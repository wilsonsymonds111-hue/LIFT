import { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Plus, Trash2, Edit3, Check, Apple } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { base44 } from '@/api/base44Client';
import WeightEntryKeypad from './WeightEntryKeypad';

const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function BodyWeightChartModal({ entries, onClose, onChanged }) {
  const [zoom, setZoom] = useState(() => {
    const stored = localStorage.getItem('bodyWeightZoom');
    return stored ? Number(stored) : 0;
  });
  const [showKeypad, setShowKeypad] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editDate, setEditDate] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef(null);

  const sorted = useMemo(() =>
    [...entries].sort((a, b) => new Date(a.date) - new Date(b.date)),
  [entries]);

  const filtered = useMemo(() => {
    if (sorted.length <= 3) return sorted;
    const showCount = Math.max(3, Math.round(sorted.length * (1 - zoom / 100)));
    return sorted.slice(-showCount);
  }, [sorted, zoom]);

  const handleZoomChange = (value) => {
    const v = value[0];
    setZoom(v);
    localStorage.setItem('bodyWeightZoom', String(v));
  };

  const chartData = useMemo(() =>
    filtered.map(e => ({
      date: new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      weight: e.weight,
      id: e.id,
    })),
  [filtered]);

  const average = filtered.length > 0
    ? (filtered.reduce((s, e) => s + e.weight, 0) / filtered.length).toFixed(2)
    : null;

  const dateRange = filtered.length > 0
    ? `${fmtDate(filtered[0].date)} – ${fmtDate(filtered[filtered.length - 1].date)}`
    : '';

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditWeight(String(entry.weight));
    setEditDate(entry.date);
  };

  const saveEdit = async (entry) => {
    const w = parseFloat(editWeight);
    if (!w || w <= 0) return;
    try {
      await base44.entities.BodyWeight.update(entry.id, { weight: w, date: editDate });
      setEditingId(null);
      onChanged();
    } catch (e) { console.error('Failed to update entry:', e); }
  };

  const handleDelete = async (entry) => {
    try {
      await base44.entities.BodyWeight.delete(entry.id);
      onChanged();
    } catch (e) { console.error('Failed to delete entry:', e); }
  };

  const handleKeypadSave = async (w, date) => {
    try {
      await base44.entities.BodyWeight.create({ weight: w, date });
      setShowKeypad(false);
      onChanged();
    } catch (e) { console.error('Failed to add entry:', e); }
  };

  const handleAppleHealthImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg('');
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const records = [];
      let inBodyMass = false;
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('bodymass') && !lower.includes('startdate')) { inBodyMass = true; continue; }
        if (lower.match(/^[a-z]/i) && !lower.includes(',') && !inBodyMass) continue;
        if (inBodyMass) {
          if (lower.includes('startdate')) continue;
          const parts = line.split(/[,]/).map(p => p.trim());
          let dateStr = null, weightVal = null;
          for (const part of parts) {
            if (part.match(/\d{4}-\d{2}-\d{2}/) && !dateStr) dateStr = part.split(' ')[0];
            if (part.match(/^\d+\.\d+$/) && !weightVal) weightVal = parseFloat(part);
          }
          if (dateStr && weightVal && weightVal > 0 && weightVal < 500) records.push({ date: dateStr, weight: weightVal });
        }
      }
      if (records.length === 0) {
        setImportMsg('No body mass records found in the Apple Health export.');
      } else {
        const byDate = {};
        for (const r of records) byDate[r.date] = r.weight;
        const existingDates = new Set(entries.map(e => e.date));
        const toCreate = Object.entries(byDate).filter(([d]) => !existingDates.has(d)).map(([d, w]) => ({ date: d, weight: w }));
        if (toCreate.length > 0) {
          await base44.entities.BodyWeight.bulkCreate(toCreate);
          setImportMsg(`Imported ${toCreate.length} body weight records from Apple Health.`);
          onChanged();
        } else {
          setImportMsg('All records from Apple Health already exist.');
        }
      }
    } catch (err) {
      console.error('Apple Health import failed:', err);
      setImportMsg('Import failed. Make sure you exported Body Mass data from Apple Health.');
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={onClose}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-auto mb-8 bg-white dark:bg-card rounded-3xl shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-muted active:scale-95 transition">
            <ChevronLeft className="w-6 h-6 text-purple-500" />
          </button>
          <h1 className="text-base font-semibold text-black dark:text-foreground">Weight</h1>
          <button onClick={() => setShowKeypad(true)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-muted active:scale-95 transition">
            <Plus className="w-5 h-5 text-purple-500" />
          </button>
        </div>

      {/* Metric section */}
      <div className="px-4 pb-2 flex-shrink-0">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-muted-foreground tracking-wide">AVERAGE</p>
        {average ? (
          <p className="text-3xl font-bold text-black dark:text-foreground mt-0.5">{average} <span className="text-lg font-medium text-gray-400 dark:text-muted-foreground">kg</span></p>
        ) : (
          <p className="text-3xl font-bold text-gray-300 dark:text-muted-foreground mt-0.5">—</p>
        )}
        {dateRange && <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">{dateRange}</p>}
      </div>

      {/* Chart */}
      <div className="px-4 pb-2 flex-shrink-0">
        {chartData.length > 1 ? (
          <div className="bg-white dark:bg-card rounded-2xl p-3">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" opacity={0.7} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8E8E93' }} tickLine={false} axisLine={false} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: '#8E8E93' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #E5E5EA', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#8E8E93' }}
                />
                <Line type="monotone" dataKey="weight" stroke="#A855F7" strokeWidth={2.5} dot={{ r: 3, fill: '#A855F7' }} activeDot={{ r: 5, fill: '#A855F7' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">Log at least 2 entries to see your trend chart.</p>
          </div>
        )}
      </div>

      {/* Zoom slider */}
      {sorted.length > 1 && (
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold text-gray-400 dark:text-muted-foreground flex-shrink-0">All</span>
            <Slider
              value={[zoom]}
              onValueChange={handleZoomChange}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-[10px] font-semibold text-gray-400 dark:text-muted-foreground flex-shrink-0">Recent</span>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Apple Health Import */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="w-full flex items-center gap-3 bg-white dark:bg-card rounded-2xl px-4 py-3.5 mb-4 shadow-sm transition active:opacity-70 disabled:opacity-50"
        >
          <div className="w-8 h-8 bg-gray-800 dark:bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <Apple className="w-4 h-4 text-white dark:text-gray-800" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-black dark:text-foreground text-sm">Import from Apple Health</p>
            <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">Export your Body Mass data as CSV</p>
          </div>
          {importing && <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleAppleHealthImport} />
        {importMsg && <p className="text-xs text-center text-gray-500 dark:text-muted-foreground mb-4 px-4">{importMsg}</p>}

        {/* History list */}
        <p className="font-semibold text-black dark:text-foreground text-sm mb-2 px-1">History</p>
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-muted-foreground text-center py-6">No entries yet</p>
          ) : (
            entries.map((entry, idx) => (
              <div key={entry.id} className={`flex items-center gap-3 px-4 py-3 ${idx < entries.length - 1 ? 'border-b border-gray-100 dark:border-border' : ''}`}>
                {editingId === entry.id ? (
                  <>
                    <input type="number" step="0.1" value={editWeight} onChange={e => setEditWeight(e.target.value)} className="w-20 border border-gray-200 dark:border-border rounded-lg px-2 py-1 text-sm bg-white dark:bg-background text-black dark:text-foreground focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="flex-1 border border-gray-200 dark:border-border rounded-lg px-2 py-1 text-sm bg-white dark:bg-background text-black dark:text-foreground focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    <button onClick={() => saveEdit(entry)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-500 text-white">
                      <Check className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="font-semibold text-black dark:text-foreground text-sm">{entry.weight} kg</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-muted-foreground">{fmtDate(entry.date)}</span>
                    <button onClick={() => startEdit(entry)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-muted transition">
                      <Edit3 className="w-3.5 h-3.5 text-gray-500 dark:text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(entry)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

        {showKeypad && (
          <WeightEntryKeypad
            onClose={() => setShowKeypad(false)}
            onSave={handleKeypadSave}
          />
        )}
      </div>
    </div>,
    document.body
  );
}