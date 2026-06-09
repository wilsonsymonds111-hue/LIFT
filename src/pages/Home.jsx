import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Dumbbell, Zap } from 'lucide-react';
import TemplateModal from '../components/TemplateModal';
import WorkoutSheet from '../components/WorkoutSheet';
import NewTemplateModal from '../components/NewTemplateModal';
import { base44 } from '@/api/base44Client';

const defaultTemplates = [
  { id: 1, name: 'CHEST', lastPerformed: null,
    exercises: 'Incline Bench Press (Barbell), Standing press, Pec Deck (Machine)...', exerciseList: [
    { name: 'Incline Bench Press (Barbell)', sets: 1, muscle: 'Chest', history: [] },
    { name: 'Standing press', sets: 1, muscle: 'Chest', history: [] },
    { name: 'Pec Deck (Machine)', sets: 1, muscle: 'Chest', history: [] },
    { name: 'Tricep single arm extension', sets: 1, muscle: 'Arms', history: [] },
    { name: 'Single arm overhead cable extension', sets: 1, muscle: 'Arms', history: [] },
    { name: 'Lateral Raise (Dumbbell)', sets: 1, muscle: 'Shoulders', history: [] },
  ]},
  { id: 2, name: 'BACK', lastPerformed: null,
    exercises: 'Isolateral dumbbell rows, Pullover (Machine), Iso-Lateral Row (Machine)...', exerciseList: [
    { name: 'Isolateral Dumbbell Rows', sets: 1, muscle: 'Back', history: [] },
    { name: 'Pullover (Machine)', sets: 1, muscle: 'Back', history: [] },
    { name: 'Iso-Lateral Row (Machine)', sets: 1, muscle: 'Back', history: [] },
    { name: 'Shrug (Barbell)', sets: 1, muscle: 'Shoulders', history: [] },
  ]},
  { id: 3, name: 'LEGS', lastPerformed: null,
    exercises: 'Smith Squat, Romanian Deadlift (Barbell), Standing Calf Raise (Machine)...', exerciseList: [
    { name: 'Smith Squat', sets: 1, muscle: 'Legs', history: [] },
    { name: 'Romanian Deadlift (Barbell)', sets: 1, muscle: 'Legs', history: [] },
    { name: 'Standing Calf Raise (Machine)', sets: 1, muscle: 'Legs', history: [] },
  ]},
];

const exampleTemplateIds = ['6a27320b7970367d6da1521b', '6a2732c911e6a46fa1192d44'];

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load templates from DB on mount
  useEffect(() => {
    base44.entities.WorkoutTemplate.list('sort_order', 100).then(data => {
      if (data && data.length > 0) {
        setTemplates(data);
      }
      setLoading(false);
    });
  }, []);

  const daysAgo = (dateStr) => {
    if (!dateStr) return null;
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    const date = isDateOnly ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    const timeStr = isDateOnly ? '' : ' at ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    if (diffDays === 0) return 'Today' + timeStr;
    if (diffDays === 1) return 'Yesterday' + timeStr;
    return `${diffDays} days ago${timeStr}`;
  };

  const handleDeleteTemplate = async (id) => {
    await base44.entities.WorkoutTemplate.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    setOpenMenuId(null);
  };

  const handleSaveHistory = async (id, snapshot, exerciseList) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    const today = new Date().toISOString().slice(0, 10);
    const sessionList = exerciseList || template.exerciseList;
    const newList = sessionList.map(ex => {
      const best = snapshot[ex.name];
      if (!best) return ex;
      return { ...ex, history: [...(ex.history || []), { kg: best.kg, reps: best.reps, date: today }] };
    });
    const updated = { ...template, exerciseList: newList, lastPerformed: new Date().toISOString() };
    await base44.entities.WorkoutTemplate.update(id, updated);
    setTemplates(prev => prev.map(t => t.id === id ? updated : t));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const iconColors = ['#30d158', '#0a84ff', '#ff9f0a', '#ff375f', '#bf5af2', '#32ade6'];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen pb-16" style={{ background: '#f2f2f7', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif' }}>
      {showNewTemplate && (
        <NewTemplateModal
          onClose={() => setShowNewTemplate(false)}
          onSave={async (template) => {
            const created = await base44.entities.WorkoutTemplate.create({ ...template, sort_order: templates.length });
            setTemplates(prev => [...prev, created]);
            setShowNewTemplate(false);
          }}
        />
      )}
      <TemplateModal
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onStartWorkout={(t) => { setActiveWorkout(t); setSelectedTemplate(null); }}
        onSaveEdit={async (updated) => {
          await base44.entities.WorkoutTemplate.update(updated.id, updated);
          setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
          setSelectedTemplate(updated);
        }}
      />
      <WorkoutSheet
        key={activeWorkout?.id}
        template={activeWorkout}
        onFinish={() => setActiveWorkout(null)}
        onSaveHistory={handleSaveHistory}
      />

      {/* iOS large title header */}
      <div style={{ background: '#f2f2f7', paddingTop: '56px', paddingBottom: '4px', paddingLeft: '20px', paddingRight: '20px' }}>
        <p style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '400', marginBottom: '2px' }}>{today}</p>
        <h1 style={{ fontSize: '34px', fontWeight: '700', letterSpacing: '-0.8px', color: '#000', lineHeight: '1.1' }}>Summary</h1>
      </div>

      {/* Favourites label */}
      <div style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '20px', paddingBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '17px', fontWeight: '600', color: '#000', letterSpacing: '-0.2px' }}>Favourites</span>
        <button onClick={() => setShowNewTemplate(true)} style={{ fontSize: '15px', fontWeight: '400', color: '#0a84ff' }}>Edit</button>
      </div>

      {/* Favourites cards — one per template, Apple Health style */}
      <div style={{ paddingLeft: '16px', paddingRight: '16px', display: 'flex', flexDirection: 'column', gap: '1px', background: '#e5e5ea', borderRadius: '12px', overflow: 'hidden', margin: '0 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {templates.map((template, idx) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            style={{ background: '#fff', padding: '12px 16px', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: iconColors[idx % iconColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Dumbbell style={{ width: '11px', height: '11px', color: '#fff' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: iconColors[idx % iconColors.length], letterSpacing: '0.1px' }}>{template.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: '#8e8e93' }}>
                  {template.lastPerformed ? daysAgo(template.lastPerformed) : 'Never'}
                </span>
                <svg style={{ width: '14px', height: '14px', color: '#c7c7cc', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div style={{ marginTop: '6px' }}>
              <p style={{ fontSize: '22px', fontWeight: '700', color: '#000', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                {template.exerciseList?.length ?? 0} <span style={{ fontSize: '15px', fontWeight: '400', color: '#3c3c43' }}>exercises</span>
              </p>
              <p style={{ fontSize: '13px', color: '#8e8e93', marginTop: '1px' }} className="truncate">{template.exercises}</p>
            </div>
            {openMenuId === template.id && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
                <div style={{ position: 'absolute', top: '36px', right: '12px', zIndex: 20, background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0', padding: '4px 0', minWidth: '160px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '14px', color: '#ff3b30', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Delete Template
                  </button>
                </div>
              </>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === template.id ? null : template.id); }}
              style={{ position: 'absolute', bottom: '10px', right: '12px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <MoreVertical style={{ width: '15px', height: '15px', color: '#c7c7cc' }} />
            </button>
          </div>
        ))}
      </div>

      {/* Quick Start */}
      <div style={{ padding: '20px 16px 0' }}>
        <button
          onClick={() => setActiveWorkout({ id: 'empty-' + Date.now(), name: 'Evening Workout', exerciseList: [] })}
          style={{ width: '100%', background: '#fff', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0a84ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap style={{ width: '17px', height: '17px', color: '#fff', fill: '#fff' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#000', margin: 0 }}>Quick Start</p>
            <p style={{ fontSize: '13px', color: '#8e8e93', margin: 0, marginTop: '1px' }}>Start an empty workout now</p>
          </div>
          <svg style={{ width: '14px', height: '14px', color: '#c7c7cc', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Example Templates */}
      <div style={{ padding: '24px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '17px', fontWeight: '600', color: '#000', letterSpacing: '-0.2px' }}>Example Templates</span>
      </div>
      <div style={{ margin: '0 16px', background: '#e5e5ea', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {templates.filter(t => exampleTemplateIds.includes(t.id)).map((template, idx) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            style={{ background: '#fff', padding: '12px 16px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: iconColors[(idx + 3) % iconColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Dumbbell style={{ width: '11px', height: '11px', color: '#fff' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: iconColors[(idx + 3) % iconColors.length] }}>{template.name}</span>
              </div>
              <svg style={{ width: '14px', height: '14px', color: '#c7c7cc' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#000', letterSpacing: '-0.5px', marginTop: '6px', lineHeight: 1.15 }}>
              {template.exerciseList?.length ?? 0} <span style={{ fontSize: '15px', fontWeight: '400', color: '#3c3c43' }}>exercises</span>
            </p>
            <p style={{ fontSize: '13px', color: '#8e8e93', marginTop: '1px' }} className="truncate">{template.exercises}</p>
          </div>
        ))}
      </div>

    </div>
  );
}