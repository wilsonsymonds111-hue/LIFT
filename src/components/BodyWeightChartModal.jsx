import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit3, Check, Apple, Target, Flag, AlertCircle, Zap, BicepsFlexed, Info, Pencil, Dumbbell, Flame, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Dot } from 'recharts';
import { base44 } from '@/api/base44Client';
import WeightEntryKeypad from './WeightEntryKeypad';
import CheckeredFlagIcon from './CheckeredFlagIcon';

const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const kgToLbs = (kg) => parseFloat((kg * 2.20462).toFixed(2));
const lbsToKg = (lbs) => parseFloat((lbs / 2.20462).toFixed(2));

export default function BodyWeightChartModal({ entries, onClose, onChanged, prediction, muscleLoading, refreshing, fatLossG, onRecalculate }) {
  const [timeFrame, setTimeFrame] = useState(() => localStorage.getItem('bodyWeightTimeFrame') || '6M');
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
  const [goalRate, setGoalRate] = useState('0.5');
  const [showRateHelp, setShowRateHelp] = useState(false);
  const [showWeighInTip, setShowWeighInTip] = useState(false);
  const [showMuscleInfo, setShowMuscleInfo] = useState(false);
  const [showFatInfo, setShowFatInfo] = useState(false);
  const [goalData, setGoalData] = useState(() => {
    try {
      const raw = localStorage.getItem('bodyWeightGoal');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [goalError, setGoalError] = useState('');
  const fileInputRef = useRef(null);

  // Persist the goal to the user entity so it survives across sessions and
  // devices. localStorage is only a fallback for guest mode.
  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.bodyWeightGoal) {
        setGoalData(user.bodyWeightGoal);
        localStorage.setItem('bodyWeightGoal', JSON.stringify(user.bodyWeightGoal));
      }
    }).catch(() => {});
  }, []);

  const sorted = useMemo(() =>
    [...entries].sort((a, b) => new Date(a.date) - new Date(b.date)),
  [entries]);

  const filtered = useMemo(() => {
    if (sorted.length === 0) return sorted;
    const ranges = { 'D': 1, 'W': 7, 'M': 30, '6M': 180, 'Y': 365 };
    const days = ranges[timeFrame] || 180;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - days);
    const result = sorted.filter(e => new Date(e.date + 'T00:00:00') >= cutoff);
    // If too few entries in the selected range, fall back to most recent entries
    if (result.length < 2 && sorted.length >= 2) {
      return sorted.slice(-Math.min(sorted.length, 3));
    }
    return result;
  }, [sorted, timeFrame]);

  const handleSetGoal = () => {
    if (!goalWeight) {
      setGoalError('Please enter a goal weight');
      return;
    }
    const latest = entries[0];
    if (!latest) {
      setGoalError('Log at least one entry first');
      return;
    }
    const goalWeightKg = unit === 'lbs' ? lbsToKg(parseFloat(goalWeight)) : parseFloat(goalWeight);
    if (goalWeightKg <= 0) {
      setGoalError('Goal weight must be positive');
      return;
    }
    const rate = Math.max(0.1, parseFloat(goalRate) || 0.5);
    const changeKg = goalWeightKg - latest.weight;
    const weeksToGoal = Math.ceil(Math.abs(changeKg) / rate);
    const daysToGoal = weeksToGoal * 7;
    const goalDate = new Date(latest.date);
    goalDate.setDate(goalDate.getDate() + daysToGoal);
    const newGoal = {
      current: latest.weight,
      goal: goalWeightKg,
      weeklyChange: changeKg < 0 ? -rate : rate,
      daysToGoal,
      goalDate: goalDate.toISOString().split('T')[0],
    };
    setGoalData(newGoal);
    localStorage.setItem('bodyWeightGoal', JSON.stringify(newGoal));
    base44.auth.updateMe({ bodyWeightGoal: newGoal }).catch(() => {});
    setShowGoalModal(false);
    setGoalWeight('');
  };

  const handleDeleteGoal = () => {
    setGoalData(null);
    localStorage.removeItem('bodyWeightGoal');
    base44.auth.updateMe({ bodyWeightGoal: null }).catch(() => {});
  };

  const chartData = useMemo(() => {
    const data = filtered.map((e, i) => ({
      date: e.date,
      dateLabel: new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' }),
      weight: unit === 'lbs' ? kgToLbs(e.weight) : e.weight,
      id: e.id,
      isLatest: i === filtered.length - 1,
    }));
    
    // Add goal projection: a dotted line from the most recent recorded weight
    // forward to the target. Attach the projection start to the last actual
    // data point so the dotted line connects seamlessly to the solid history.
    if (goalData) {
      const recent = filtered[filtered.length - 1];
      if (recent && data.length > 0) {
        const rate = Math.abs(goalData.weeklyChange);
        const weeks = Math.max(1, Math.ceil(Math.abs(goalData.goal - recent.weight) / rate));
        const startDate = new Date(recent.date + 'T00:00:00');
        data[data.length - 1].weightProjection = unit === 'lbs' ? kgToLbs(recent.weight) : recent.weight;
        for (let w = 1; w <= weeks; w++) {
          const projDate = new Date(startDate.getTime() + w * 7 * 24 * 60 * 60 * 1000);
          const projWeight = recent.weight + (goalData.weeklyChange * w);
          data.push({
            date: projDate.toISOString().split('T')[0],
            dateLabel: projDate.toLocaleDateString('en-GB', { month: 'short' }),
            weightProjection: unit === 'lbs' ? kgToLbs(projWeight) : projWeight,
          });
        }
      }
    }
    return data.sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      return aDate - bDate;
    });
  }, [filtered, unit, goalData, entries]);

  const latestEntry = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  const displayLatest = useMemo(() => {
    if (!latestEntry) return null;
    return unit === 'lbs' ? kgToLbs(latestEntry.weight).toFixed(2) : String(latestEntry.weight);
  }, [latestEntry, unit]);

  const latestDateLabel = latestEntry ? fmtDate(latestEntry.date) : '';

  let weeksAway = null;
  if (goalData && latestEntry) {
    const rate = Math.abs(goalData.weeklyChange);
    weeksAway = rate > 0 ? Math.max(0, Math.ceil(Math.abs(goalData.goal - latestEntry.weight) / rate)) : 0;
  }

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
      <div
        className="relative w-full max-w-2xl mx-auto bg-white dark:bg-card rounded-t-3xl shadow-2xl flex flex-col h-[calc(100dvh-2.5rem)] mt-10"
        style={{}}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-muted ring-1 ring-black/5 dark:ring-white/10 active:scale-95 transition">
            <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-black dark:text-foreground">Bodyweight</h1>
          <button onClick={() => setShowKeypad(true)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-muted ring-1 ring-black/5 dark:ring-white/10 active:scale-95 transition">
            <Plus className="w-5 h-5 text-gray-900 dark:text-foreground" />
          </button>
        </div>

        {/* Cutting / Bulking toggle */}
        <div className="flex justify-center px-4 pb-2 flex-shrink-0">
          <div className="inline-flex bg-gray-100 dark:bg-muted rounded-full p-0.5">
            <button
              onClick={() => { setGoalMode('cutting'); localStorage.setItem('goalMode', 'cutting'); }}
              className={`flex items-center justify-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                goalMode === 'cutting' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400 dark:text-muted-foreground'
              }`}
            >
              <Zap className="w-2.5 h-2.5" /> Cutting
            </button>
            <button
              onClick={() => { setGoalMode('bulking'); localStorage.setItem('goalMode', 'bulking'); }}
              className={`flex items-center justify-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                goalMode === 'bulking' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 dark:text-muted-foreground'
              }`}
            >
              <BicepsFlexed className="w-2.5 h-2.5" /> Bulking
            </button>
          </div>
        </div>

      {/* Scrollable body: chart + lists scroll under the sticky header & toggle */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
      {/* Metric section with unit toggle */}
       <div className="pb-2 pt-1">
         <div className="flex items-center justify-between mb-2">
           <p className="text-[11px] font-semibold text-gray-500 dark:text-muted-foreground tracking-wide">LATEST</p>
           <div className="inline-flex bg-gray-100 dark:bg-muted rounded-full p-0.5">
             <button
               onClick={() => { setUnit('kg'); localStorage.setItem('weightUnit', 'kg'); }}
               className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition ${unit === 'kg' ? 'bg-white dark:bg-card text-gray-900 dark:text-foreground shadow-sm' : 'text-gray-400 dark:text-muted-foreground'}`}
             >kg</button>
             <button
               onClick={() => { setUnit('lbs'); localStorage.setItem('weightUnit', 'lbs'); }}
               className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition ${unit === 'lbs' ? 'bg-white dark:bg-card text-gray-900 dark:text-foreground shadow-sm' : 'text-gray-400 dark:text-muted-foreground'}`}
             >lbs</button>
           </div>
         </div>
         {displayLatest ? (
           <p className="text-3xl font-bold text-black dark:text-foreground mt-0.5">{displayLatest} <span className="text-lg font-medium text-gray-400 dark:text-muted-foreground">{unit}</span></p>
         ) : (
           <p className="text-3xl font-bold text-gray-300 dark:text-muted-foreground mt-0.5">—</p>
         )}
         {latestDateLabel && <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">{latestDateLabel}</p>}
         </div>

         {/* Muscle Gain + Fat Loss */}
         <div className="pb-3">
         <div className="flex gap-2">
         <div className="flex-1 bg-white dark:bg-card rounded-2xl p-3 border border-gray-100 dark:border-border shadow-sm relative">
           <div className="flex items-center justify-between mb-1">
             <div className="flex items-center gap-1.5">
               <Dumbbell className="w-3.5 h-3.5 text-gray-400 dark:text-muted-foreground" />
               <p className="text-[11px] font-semibold text-gray-500 dark:text-muted-foreground">Muscle Gain</p>
             </div>
             {prediction && (
               <button
                 onClick={(e) => { e.stopPropagation(); setShowMuscleInfo(v => !v); }}
                 className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-muted transition flex-shrink-0"
               >
                 <Info className="w-3 h-3 text-gray-400 dark:text-muted-foreground" />
               </button>
             )}
           </div>
           {muscleLoading ? (
             <div className="h-6 w-14 bg-gray-100 dark:bg-muted rounded animate-pulse" />
           ) : prediction ? (
             <p className="text-xl font-bold text-gray-900 dark:text-foreground">{prediction.muscleGainG}<span className="text-xs font-medium text-gray-400 dark:text-muted-foreground"> g</span></p>
           ) : (
             <p className="text-sm text-gray-400 dark:text-muted-foreground">No data</p>
           )}
           {showMuscleInfo && prediction && (
             <>
               <div className="fixed inset-0 z-20" onClick={() => setShowMuscleInfo(false)} />
               <div className="absolute left-2 top-full mt-2 w-[200px] z-30 bg-white dark:bg-card rounded-xl shadow-lg border border-gray-100 dark:border-border p-3">
                 <div className="absolute -top-1.5 left-3 w-3 h-3 bg-white dark:bg-card border-l border-t border-gray-100 dark:border-border rotate-45" />
                 <p className="text-[11px] leading-relaxed text-gray-600 dark:text-muted-foreground relative">An estimate of how much muscle you've gained, based on your bodyweight trend, strength progress on compound lifts, and training consistency. This is an approximation, not a precise measurement.</p>
               </div>
             </>
           )}
         </div>
         <div className="flex-1 bg-white dark:bg-card rounded-2xl p-3 border border-gray-100 dark:border-border shadow-sm relative">
           <div className="flex items-center justify-between mb-1">
             <div className="flex items-center gap-1.5">
               <Flame className="w-3.5 h-3.5 text-gray-400 dark:text-muted-foreground" />
               <p className="text-[11px] font-semibold text-gray-500 dark:text-muted-foreground">Fat Loss</p>
             </div>
             {prediction && (
               <button
                 onClick={(e) => { e.stopPropagation(); setShowFatInfo(v => !v); }}
                 className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-muted transition flex-shrink-0"
               >
                 <Info className="w-3 h-3 text-gray-400 dark:text-muted-foreground" />
               </button>
             )}
           </div>
           {muscleLoading ? (
             <div className="h-6 w-14 bg-gray-100 dark:bg-muted rounded animate-pulse" />
           ) : prediction ? (
             <p className="text-xl font-bold text-gray-900 dark:text-foreground">{fatLossG}<span className="text-xs font-medium text-gray-400 dark:text-muted-foreground"> g</span></p>
           ) : (
             <p className="text-sm text-gray-400 dark:text-muted-foreground">No data</p>
           )}
           {showFatInfo && prediction && (
             <>
               <div className="fixed inset-0 z-20" onClick={() => setShowFatInfo(false)} />
               <div className="absolute right-2 top-full mt-2 w-[200px] z-30 bg-white dark:bg-card rounded-xl shadow-lg border border-gray-100 dark:border-border p-3">
                 <div className="absolute -top-1.5 right-3 w-3 h-3 bg-white dark:bg-card border-r border-t border-gray-100 dark:border-border rotate-45" />
                 <p className="text-[11px] leading-relaxed text-gray-600 dark:text-muted-foreground relative">An estimate of how much fat you've lost, based on your bodyweight trend and training data. This is an approximation — actual fat loss depends on diet, consistency, and other lifestyle factors.</p>
               </div>
             </>
           )}
           </div>
         </div>
         </div>

         {/* Time frame pills — full-width Apple Health style */}
         <div className="pb-3">
           <div className="flex bg-gray-100 dark:bg-muted rounded-full p-0.5 gap-0.5">
             {['D', 'W', 'M', '6M', 'Y'].map(tf => (
               <button
                 key={tf}
                 onClick={() => { setTimeFrame(tf); localStorage.setItem('bodyWeightTimeFrame', tf); }}
                 className={`flex-1 py-1 rounded-full text-[11px] font-semibold transition ${
                   timeFrame === tf
                     ? 'bg-white dark:bg-card text-gray-900 dark:text-foreground shadow-sm'
                     : 'text-gray-400 dark:text-muted-foreground'
                 }`}
               >
                 {tf}
               </button>
             ))}
           </div>
         </div>

         {/* Chart */}
         <div className="pb-2">
        {chartData.length > 1 ? (
          <div className="bg-white dark:bg-card rounded-2xl px-1 py-3">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" opacity={0.7} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: '#8E8E93' }} tickLine={false} axisLine={false} interval="equidistantPreserveStartEnd" minTickGap={25} />
                <YAxis orientation="right" allowDecimals={false} tickCount={5} tick={{ fontSize: 10, fill: '#8E8E93' }} tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #E5E5EA', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#8E8E93' }}
                />
                <Line type="monotone" dataKey="weight" stroke={goalMode === 'cutting' ? '#f97316' : '#3b82f6'} strokeWidth={2.5} dot={(props) => { if (props.payload.weight == null) return false; return <circle cx={props.cx} cy={props.cy} r={props.payload.isLatest ? 5 : 4} fill={props.payload.isLatest ? (goalMode === 'cutting' ? '#ea580c' : '#2563eb') : (goalMode === 'cutting' ? '#f97316' : '#3b82f6')} stroke="#fff" strokeWidth={2} />; }} activeDot={{ r: 6, fill: goalMode === 'cutting' ? '#ea580c' : '#2563eb', stroke: '#fff', strokeWidth: 2 }} animationDuration={200} animationEasing="ease-out" />
                {goalData && <Line type="linear" dataKey="weightProjection" stroke={goalMode === 'cutting' ? '#fed7aa' : '#bfdbfe'} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} dot={(props) => { if (props.payload.weight != null) return false; return <circle cx={props.cx} cy={props.cy} r={5} fill="#fff" fillOpacity={0.6} stroke={goalMode === 'cutting' ? '#fed7aa' : '#bfdbfe'} strokeWidth={1.5} strokeDasharray="3 2" />; }} activeDot={{ r: 5, fill: goalMode === 'cutting' ? '#fdba74' : '#93c5fd', stroke: '#fff', strokeWidth: 2 }} connectNulls={true} isAnimationActive={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">Log at least 2 entries to see your trend chart.</p>
          </div>
        )}
      </div>



      {/* Goal section */}
      {goalData && (
        <div className="pb-3">
          <div className="relative bg-gray-50 dark:bg-muted/50 rounded-2xl p-4 border border-gray-200 dark:border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-900 dark:bg-primary">
                <CheckeredFlagIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">Goal: {goalData.goal} {unit}</p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">{weeksAway} weeks away</p>
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-xs text-gray-600 dark:text-muted-foreground font-medium">{goalData.weeklyChange > 0 ? '+' : ''}{goalData.weeklyChange} {unit}/week</p>
                  <button onClick={() => setShowRateHelp(v => !v)} className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-200 dark:bg-muted text-gray-500 dark:text-muted-foreground text-[10px] font-bold flex-shrink-0">?</button>
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button onClick={() => setShowWeighInTip(v => !v)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-muted transition">
                  <Info className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                </button>
                <button onClick={() => setShowGoalModal(true)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-muted transition">
                  <Pencil className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                </button>
                <button onClick={handleDeleteGoal} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition">
                  <Trash2 className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Tap-outside backdrop to dismiss popovers */}
            {(showRateHelp || showWeighInTip) && (
              <div className="fixed inset-0 z-20" onClick={() => { setShowRateHelp(false); setShowWeighInTip(false); }} />
            )}

            {/* Floating rate-help popover */}
            {showRateHelp && (
              <div className="absolute left-4 top-full mt-2 w-[260px] z-30 bg-white dark:bg-card rounded-xl shadow-lg border border-gray-100 dark:border-border p-3">
                <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white dark:bg-card border-l border-t border-gray-100 dark:border-border rotate-45" />
                <p className="text-[11px] leading-relaxed text-gray-600 dark:text-muted-foreground relative">0.5kg per week is the optimal rate for both weight loss and gain. Faster changes risk muscle loss, fatigue and rebound weight gain, while slower progress is hard to sustain — this pace is safe, effective and easier to maintain long-term.</p>
              </div>
            )}

            {/* Floating weigh-in tip popover */}
            {showWeighInTip && (
              <div className="absolute right-4 top-full mt-2 w-[240px] z-30 bg-white dark:bg-card rounded-xl shadow-lg border border-gray-100 dark:border-border p-3">
                <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white dark:bg-card border-r border-t border-gray-100 dark:border-border rotate-45" />
                <p className="text-[11px] leading-relaxed text-gray-600 dark:text-muted-foreground relative">Weigh in once a week — daily readings swing with water weight &amp; hydration.</p>
              </div>
            )}
          </div>
        </div>
      )}

        {/* AI Goal setter */}
        {!goalData && entries.length > 0 && (
          <button
            onClick={() => setShowGoalModal(!showGoalModal)}
            className="w-full flex items-center gap-3 bg-white dark:bg-card rounded-2xl px-4 py-3.5 mb-4 border border-gray-200 dark:border-border shadow-sm transition active:opacity-70"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-900 dark:bg-primary">
              <CheckeredFlagIcon className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-black dark:text-foreground text-sm">Set Weight Goal</p>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">Set your target &amp; weekly pace</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 dark:text-muted-foreground flex-shrink-0" />
          </button>
        )}

        {showGoalModal && (
          <div className="bg-white dark:bg-card rounded-2xl px-4 py-4 mb-4 border border-gray-200 dark:border-border">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-muted-foreground">Target weight</p>
              <input
                type="number"
                step="0.1"
                placeholder={`Goal weight (${unit})`}
                value={goalWeight}
                onChange={e => setGoalWeight(e.target.value)}
                className="w-full border border-gray-200 dark:border-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-background text-black dark:text-foreground focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-400"
              />
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-gray-600 dark:text-muted-foreground">Rate per week ({unit})</p>
                <button type="button" onClick={() => setShowRateHelp(v => !v)} className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-200 dark:bg-muted text-gray-500 dark:text-muted-foreground text-[10px] font-bold flex-shrink-0">?</button>
              </div>
              {showRateHelp && (
                <p className="text-[11px] text-gray-500 dark:text-muted-foreground bg-gray-50 dark:bg-muted/50 rounded-lg p-2.5 -mt-1">0.5kg per week is the optimal rate for both weight loss and gain. Faster changes risk muscle loss, fatigue and rebound weight gain, while slower progress is hard to sustain — this pace is safe, effective and easier to maintain long-term.</p>
              )}
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="0.5"
                value={goalRate}
                onChange={e => setGoalRate(e.target.value)}
                className="w-full border border-gray-200 dark:border-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-background text-black dark:text-foreground focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-400"
              />
              {goalError && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 rounded-lg p-2.5 border border-red-200 dark:border-red-700/30">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300">{goalError}</p>
                </div>
              )}
              <button
                onClick={handleSetGoal}
                className="w-full bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-primary/90 text-white font-semibold py-2.5 rounded-lg transition"
              >
                Set Goal
              </button>
            </div>
          </div>
        )}

        {/* Apple Health Import */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="w-full flex items-center gap-3 bg-gray-100 dark:bg-card rounded-2xl px-4 py-3.5 mb-4 border border-gray-200 dark:border-border shadow-sm transition active:opacity-70 disabled:opacity-50"
        >
          <img src="https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/b393a622b_image.png" alt="Apple Health" className="w-10 h-10 rounded-[10px] object-cover flex-shrink-0 shadow-sm" />
          <div className="text-left flex-1">
            <p className="font-semibold text-black dark:text-foreground text-sm">Import from Apple Health</p>
            <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">Export your Body Mass data as CSV</p>
          </div>
          {importing ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" /> : <ChevronRight className="w-5 h-5 text-gray-300 dark:text-muted-foreground flex-shrink-0" />}
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