import { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, TrendingDown, Minus, Trash2, Edit3, Check, Apple, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { base44 } from '@/api/base44Client';

export default function BodyWeightChartModal({ entries, onClose, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editDate, setEditDate] = useState('');
  const [adding, setAdding] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef(null);

  const sorted = useMemo(() =>
    [...entries].sort((a, b) => new Date(a.date) - new Date(b.date)),
  [entries]);

  const chartData = useMemo(() =>
    sorted.map(e => ({
      date: new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      weight: e.weight,
      id: e.id,
    })),
  [sorted]);

  const latest = entries[0];
  const previous = entries[1];
  const trend = !latest || !previous ? null :
    latest.weight > previous.weight ? 'up' :
    latest.weight < previous.weight ? 'down' : 'flat';
  const trendValue = latest && previous ? (latest.weight - previous.weight).toFixed(1) : null;

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
    } catch (e) {
      console.error('Failed to update entry:', e);
    }
  };

  const handleDelete = async (entry) => {
    try {
      await base44.entities.BodyWeight.delete(entry.id);
      onChanged();
    } catch (e) {
      console.error('Failed to delete entry:', e);
    }
  };

  const handleAdd = async () => {
    const w = parseFloat(newWeight);
    if (!w || w <= 0 || !newDate) return;
    try {
      await base44.entities.BodyWeight.create({ weight: w, date: newDate });
      setNewWeight('');
      setNewDate(new Date().toISOString().slice(0, 10));
      setAdding(false);
      onChanged();
    } catch (e) {
      console.error('Failed to add entry:', e);
    }
  };

  // Apple Health CSV import
  // Apple Health export format: each record type has a header row, then data rows
  // BodyMass records: StartDate, EndDate, Value (kg)
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
        // Apple Health CSV has section headers like "BodyMass,kg,Apple Watch,..."
        // and data rows with StartDate, EndDate, Value
        const lower = line.toLowerCase();
        if (lower.includes('bodymass') && !lower.includes('startdate')) {
          inBodyMass = true;
          continue;
        }
        // New record type section starts
        if (lower.match(/^[a-z]/i) && !lower.includes(',') && !inBodyMass) continue;

        if (inBodyMass) {
          // Check if it's a header line
          if (lower.includes('startdate')) continue;
          // Try to parse: could be comma or tab separated
          const parts = line.split(/[,]/).map(p => p.trim());
          // Apple Health format: StartDate, EndDate, Value or similar
          // Find the date and value
          let dateStr = null;
          let weightVal = null;

          for (const part of parts) {
            // Match date
            if (part.match(/\d{4}-\d{2}-\d{2}/) && !dateStr) {
              dateStr = part.split(' ')[0];
            }
            // Match weight value (decimal number)
            if (part.match(/^\d+\.\d+$/) && !weightVal) {
              weightVal = parseFloat(part);
            }
          }

          if (dateStr && weightVal && weightVal > 0 && weightVal < 500) {
            records.push({ date: dateStr, weight: weightVal });
          }
        }
      }

      if (records.length === 0) {
        setImportMsg('No body mass records found in the Apple Health export.');
      } else {
        // Deduplicate by date, keeping the latest
        const byDate = {};
        for (const r of records) {
          byDate[r.date] = r.weight;
        }

        // Check existing dates to avoid duplicates
        const existingDates = new Set(entries.map(e => e.date));
        const toCreate = Object.entries(byDate)
          .filter(([date]) => !existingDates.has(date))
          .map(([date, weight]) => ({ date, weight }));

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
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative bg-background rounded-t-3xl w-full shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-foreground">Body Weight</h2>
            {latest && (
              <span className="flex items-center gap-1 text-sm font-semibold">
                <span className="text-foreground">{latest.weight} kg</span>
                {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-red-400" />}
                {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />}
                {trend === 'flat' && <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
                {trendValue > 0 && <span className="text-red-400 text-xs">+{trendValue}</span>}
                {trendValue < 0 && <span className="text-emerald-500 text-xs">{trendValue}</span>}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {/* Chart */}
          {chartData.length > 1 ? (
            <div className="bg-card border border-border rounded-2xl p-4 mb-4">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="rgb(16, 185, 129)" strokeWidth={2.5} dot={{ r: 3, fill: 'rgb(16, 185, 129)' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 mb-4 text-center">
              <p className="text-sm text-muted-foreground">Log at least 2 entries to see your trend chart.</p>
            </div>
          )}

          {/* Apple Health Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 mb-4 transition active:opacity-70 disabled:opacity-50"
          >
            <div className="w-8 h-8 bg-gray-800 dark:bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <Apple className="w-4 h-4 text-white dark:text-gray-800" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-foreground text-sm">Import from Apple Health</p>
              <p className="text-xs text-muted-foreground mt-0.5">Export your Body Mass data as CSV from the Health app</p>
            </div>
            {importing && <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleAppleHealthImport}
          />
          {importMsg && (
            <p className="text-xs text-center text-muted-foreground mb-4 px-4">{importMsg}</p>
          )}

          {/* Add new entry */}
          {adding ? (
            <div className="bg-card border border-border rounded-2xl p-4 mb-4">
              <p className="font-semibold text-foreground text-sm mb-3">Add Entry</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  placeholder="Weight (kg)"
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-xl font-semibold text-sm text-muted-foreground bg-muted transition active:opacity-70">Cancel</button>
                <button onClick={handleAdd} disabled={!newWeight} className="flex-1 py-2 rounded-xl font-bold text-sm text-white bg-emerald-500 disabled:opacity-40 transition active:opacity-70">Save</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl py-3 mb-4 transition active:opacity-70"
            >
              <Plus className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">Add Entry</span>
            </button>
          )}

          {/* History list */}
          <div>
            <p className="font-semibold text-foreground text-sm mb-2">History</p>
            <div className="space-y-2">
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No entries yet</p>
              ) : (
                entries.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                    {editingId === entry.id ? (
                      <>
                        <input
                          type="number"
                          step="0.1"
                          value={editWeight}
                          onChange={e => setEditWeight(e.target.value)}
                          className="w-20 border border-border rounded-lg px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                        <input
                          type="date"
                          value={editDate}
                          onChange={e => setEditDate(e.target.value)}
                          className="flex-1 border border-border rounded-lg px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                        <button onClick={() => saveEdit(entry)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500 text-white">
                          <Check className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <span className="font-bold text-foreground text-sm">{entry.weight} kg</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <button onClick={() => startEdit(entry)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition">
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
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
        </div>
      </div>
    </div>,
    document.body
  );
}