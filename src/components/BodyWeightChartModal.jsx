import { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Plus, Trash2, Edit3, Check, Apple, Target, AlertCircle, Zap, BicepsFlexed } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Dot } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { base44 } from '@/api/base44Client';
import WeightEntryKeypad from './WeightEntryKeypad';

const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const kgToLbs = (kg) => parseFloat((kg * 2.20462).toFixed(2));
const lbsToKg = (lbs) => parseFloat((lbs / 2.20462).toFixed(2));

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
  const [unit, setUnit] = useState(() => localStorage.getItem('weightUnit') || 'kg');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalMode, setGoalMode] = useState(() => localStorage.getItem('goalMode') || 'cutting');
  const [goalWeight, setGoalWeight] = useState('');
  const [goalData, setGoalData] = useState(null);
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [goalError, setGoalError] = useState('');
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

  const handleSetGoal = async () => {
    if (!goalWeight) {
      setGoalError('Please enter a goal weight');
      return;
    }
    const latest = entries[entries.length - 1];
    if (!latest) {
      setGoalError('Log at least one entry first');
      return;
    }
    const goalWeightKg = unit === 'lbs' ? lbsToKg(parseFloat(goalWeight)) : parseFloat(goalWeight);
    if (goalWeightKg <= 0) {
      setGoalError('Goal weight must be positive');
      return;
    }

    setLoadingGoal(true);
    setGoalError('');
    try {
      const changeKg = goalWeightKg - latest.weight;
      const direction = changeKg < 0 ? 'lose' : 'gain';
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `A user wants to ${direction} weight from ${latest.weight}kg to ${goalWeightKg}kg. At a safe rate of 0.5kg per week, is this a realistic goal? Respond with a brief confirmation (1 sentence) about whether this goal is achievable at 0.5kg/week pace.`,
      });
      const daysToGoal = Math.ceil(Math.abs(changeKg) / 0.5 * 7);
      const goalDate = new Date(latest.date);
      goalDate.setDate(goalDate.getDate() + daysToGoal);
      setGoalData({ 
        current: latest.weight, 
        goal: goalWeightKg, 
        weeklyChange: changeKg < 0 ? -0.5 : 0.5, 
        daysToGoal, 
        goalDate: goalDate.toISOString().split('T')[0], 
        confirmation: res 
      });
      setShowGoalModal(false);
      setGoalWeight('');
    } catch (e) {
      setGoalError('Failed to get AI confirmation. Try again.');
      console.error(e);
    } finally {
      setLoadingGoal(false);
    }
  };

  const chartData = useMemo(() => {
    const data = filtered.map(e => ({
      date: new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      weight: unit === 'lbs' ? kgToLbs(e.weight) : e.weight,
      id: e.id,
    }));
    
    // Add AI goal projected points if set
    if (goalData) {
      const startDate = new Date(entries.find(en => en.date === entries.sort((a, b) => new Date(a.date) - new Date(b.date))[0].date).date);
      const endDate = new Date(goalData.goalDate);
      const weeks = (endDate - startDate) / (1000 * 60 * 60 * 24 * 7);
      for (let w = 1; w <= Math.ceil(weeks); w++) {
        const projDate = new Date(startDate.getTime() + w * 7 * 24 * 60 * 60 * 1000);
        const projWeight = goalData.current + (goalData.weeklyChange * w);
        data.push({
          date: projDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          weightProjection: unit === 'lbs' ? kgToLbs(projWeight) : projWeight,
          isProjection: true,
        });
      }
    }
    return data.sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      return aDate - bDate;
    });
  }, [filtered, unit, goalData, entries]);

  const average = filtered.length > 0
    ? (filtered.reduce((s, e) => s + e.weight, 0) / filtered.length).toFixed(2)
    : null;

  const displayAverage = useMemo(() => {
    if (!average) return null;
    return unit === 'lbs' ? kgToLbs(parseFloat(average)).toFixed(2) : average;
  }, [average, unit]);

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

        {/* Cutting / Bulking toggle */}
        <div className="flex justify-center px-4 pb-2 flex-shrink-0">
          <div className="inline-flex bg-gray-100 dark:bg-muted rounded-full p-0.5">
            <button
              onClick={() => { setGoalMode('cutting'); localStorage.setItem('goalMode', 'cutting'); }}
              className={`flex items-center justify-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold transition ${
                goalMode === 'cutting' ? 'bg-white dark:bg-card text-amber-500 shadow-sm' : 'text-gray-400 dark:text-muted-foreground'
              }`}
            >
              <Zap className="w-2.5 h-2.5" /> Cutting
            </button>
            <button
              onClick={() => { setGoalMode('bulking'); localStorage.setItem('goalMode', 'bulking'); }}
              className={`flex items-center justify-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold transition ${
                goalMode === 'bulking' ? 'bg-white dark:bg-card text-blue-500 shadow-sm' : 'text-gray-400 dark:text-muted-foreground'
              }`}
            >
              <BicepsFlexed className="w-2.5 h-2.5" /> Bulking
            </button>
          </div>
        </div>

      {/* Metric section with unit toggle */}
       <div className="px-4 pb-2 flex-shrink-0">
         <div className="flex items-center justify-between mb-2">
           <p className="text-[11px] font-semibold text-gray-500 dark:text-muted-foreground tracking-wide">AVERAGE</p>
           <button
             onClick={() => {
               const newUnit = unit === 'kg' ? 'lbs' : 'kg';
               setUnit(newUnit);
               localStorage.setItem('weightUnit', newUnit);
             }}
             className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground hover:bg-gray-200 dark:hover:bg-muted/80 transition"
           >
             {unit === 'kg' ? 'kg' : 'lbs'}
           </button>
         </div>
         {displayAverage ? (
           <p className="text-3xl font-bold text-black dark:text-foreground mt-0.5">{displayAverage} <span className="text-lg font-medium text-gray-400 dark:text-muted-foreground">{unit}</span></p>
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
                <Line type="monotone" dataKey="weight" stroke="#A855F7" strokeWidth={2.5} dot={{ r: 4, fill: '#A855F7', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#A855F7', stroke: '#fff', strokeWidth: 2 }} />
                {goalData && <Line type="monotone" dataKey="weightProjection" stroke="#e9d5ff" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} dot={{ r: 5, fill: '#fff', fillOpacity: 0.6, stroke: '#e9d5ff', strokeWidth: 1.5, strokeDasharray: '3 2' }} activeDot={{ r: 5, fill: '#c4b5fd', stroke: '#fff', strokeWidth: 2 }} connectNulls={true} isAnimationActive={false} />}
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

      {/* Goal section */}
      {goalData && (
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-700/30">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Goal: {goalData.goal} {unit} by {goalData.goalDate}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">{goalData.weeklyChange > 0 ? '+' : ''}{goalData.weeklyChange} {unit}/week</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 italic">{goalData.confirmation}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* AI Goal setter */}
        {entries.length > 0 && (
          <button
            onClick={() => setShowGoalModal(!showGoalModal)}
            className="w-full flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40 rounded-2xl px-4 py-3.5 mb-4 border border-blue-200/50 dark:border-purple-700/30 transition active:opacity-70"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-black dark:text-foreground text-sm">Set Weight Goal</p>
              <p className="text-xs text-gray-600 dark:text-muted-foreground mt-0.5">At 0.5kg/week pace</p>
            </div>
          </button>
        )}

        {showGoalModal && (
          <div className="bg-white dark:bg-card rounded-2xl px-4 py-4 mb-4 border border-gray-200 dark:border-border">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-muted-foreground">Target weight at 0.5kg/week</p>
              <input
                type="number"
                step="0.1"
                placeholder={`Goal weight (${unit})`}
                value={goalWeight}
                onChange={e => setGoalWeight(e.target.value)}
                className="w-full border border-gray-200 dark:border-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-background text-black dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
              />
              {goalError && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 rounded-lg p-2.5 border border-red-200 dark:border-red-700/30">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300">{goalError}</p>
                </div>
              )}
              <button
                onClick={handleSetGoal}
                disabled={loadingGoal}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
              >
                {loadingGoal ? 'Confirming...' : 'Set Goal'}
              </button>
            </div>
          </div>
        )}

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
                      <span className="font-semibold text-black dark:text-foreground text-sm">{unit === 'lbs' ? kgToLbs(entry.weight).toFixed(2) : entry.weight} {unit}</span>
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