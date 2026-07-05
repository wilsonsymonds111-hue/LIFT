import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const STEPS = [
  {
    title: 'Open Profile',
    subtitle: 'Tap the Profile tab at the bottom-right',
    mockup: 'profile',
  },
  {
    title: 'Open Settings',
    subtitle: 'Tap the gear icon at the top-right',
    mockup: 'settings',
  },
  {
    title: 'Export CSV',
    subtitle: 'Scroll down and tap "Export CSV"',
    mockup: 'export',
  },
  {
    title: 'Save the File',
    subtitle: 'Choose "Save to Files" or share to yourself',
    mockup: 'share',
  },
  {
    title: 'Upload Here',
    subtitle: 'Come back and select your CSV file',
    mockup: 'done',
  },
];

// Pulsing highlight ring — draws attention to the tap target
function TapHighlight({ className = '', size = 'w-12 h-12' }) {
  return (
    <div className={`absolute ${className}`}>
      <div className={`relative ${size}`}>
        <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
        <div className={`absolute inset-0 ${size} rounded-full border-[3px] border-blue-500 bg-blue-500/10`} />
      </div>
    </div>
  );
}

function PhoneFrame({ children }) {
  return (
    <div className="relative mx-auto" style={{ width: 200, height: 380 }}>
      {/* Phone body */}
      <div className="absolute inset-0 rounded-[2.5rem] bg-zinc-900 shadow-2xl border-[3px] border-zinc-700" />
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-zinc-900 rounded-b-2xl z-20" />
      {/* Screen */}
      <div className="absolute inset-[6px] rounded-[2.2rem] bg-zinc-950 overflow-hidden z-10">
        {children}
      </div>
    </div>
  );
}

// --- Strong app screen mockups ---

function ProfileScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white">
      {/* Status bar */}
      <div className="h-6" />
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-bold">Profile</span>
        <div className="relative">
          {/* Gear icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 10v6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m10 0h6M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24" />
          </svg>
          <TapHighlight className="top-1/2 -translate-y-1/2 right-[-8px]" size="w-7 h-7" />
        </div>
      </div>
      {/* Avatar + name */}
      <div className="flex flex-col items-center py-4 gap-2">
        <div className="w-14 h-14 rounded-full bg-orange-500/30 border-2 border-orange-500 flex items-center justify-center">
          <span className="text-lg font-bold text-orange-400">W</span>
        </div>
        <span className="text-xs font-semibold">Wilson</span>
      </div>
      {/* Stats row */}
      <div className="flex justify-around px-4 py-2">
        {['Workouts', 'Volume', 'PRs'].map(s => (
          <div key={s} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-bold">0</span>
            <span className="text-[7px] text-zinc-500">{s}</span>
          </div>
        ))}
      </div>
      {/* Bottom nav */}
      <div className="mt-auto flex justify-around py-2 border-t border-zinc-800 bg-zinc-950">
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-4 h-4 rounded bg-zinc-700" />
          <span className="text-[6px] text-zinc-500">Home</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-4 h-4 rounded bg-zinc-700" />
          <span className="text-[6px] text-zinc-500">Workouts</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 relative">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span className="text-[6px] text-orange-500 font-bold">Profile</span>
          <TapHighlight className="top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2" size="w-10 h-10" />
        </div>
      </div>
    </div>
  );
}

function SettingsScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white">
      <div className="h-6" />
      {/* Back + title */}
      <div className="px-4 py-3 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span className="text-sm font-bold">Settings</span>
      </div>
      {/* Settings list */}
      <div className="flex-1 px-3 space-y-0">
        {['Account', 'Notifications', 'Units', 'App Settings'].map(item => (
          <div key={item} className="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] text-zinc-300">{item}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        ))}
        {/* Export CSV — highlighted */}
        <div className="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between relative bg-blue-500/5">
          <span className="text-[10px] text-white font-semibold">Export CSV</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <TapHighlight className="top-1/2 -translate-y-1/2 left-0 right-0" size="w-full h-9" />
        </div>
        {['Import CSV', 'About'].map(item => (
          <div key={item} className="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] text-zinc-300">{item}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportScreen() {
  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white items-center justify-center gap-3 px-4">
      <div className="h-6 w-full" />
      {/* Export icon */}
      <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
      </div>
      <p className="text-[10px] font-bold text-center">Exporting…</p>
      <p className="text-[8px] text-zinc-500 text-center">Your CSV file is being prepared</p>
      {/* Progress bar */}
      <div className="w-3/4 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className="w-2/3 h-full bg-orange-500 rounded-full" />
      </div>
    </div>
  );
}

function ShareScreen() {
  const apps = [
    { label: 'AirDrop', color: 'bg-blue-500' },
    { label: 'Mail', color: 'bg-blue-600' },
    { label: 'Messages', color: 'bg-green-500' },
    { label: 'Save to Files', color: 'bg-yellow-500' },
  ];
  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white justify-end">
      <div className="h-6" />
      <div className="flex-1" />
      {/* Share sheet */}
      <div className="bg-zinc-900 rounded-t-2xl px-3 pt-3 pb-4 relative">
        <div className="w-8 h-1 rounded-full bg-zinc-700 mx-auto mb-3" />
        <p className="text-[9px] font-semibold text-zinc-400 mb-3 text-center">Share CSV</p>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {apps.map(app => (
            <div key={app.label} className="flex flex-col items-center gap-1 relative">
              <div className={`w-9 h-9 rounded-xl ${app.color} flex items-center justify-center`}>
                {app.label === 'Save to Files' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                )}
              </div>
              <span className="text-[6px] text-zinc-400 text-center leading-tight">{app.label}</span>
              {app.label === 'Save to Files' && (
                <TapHighlight className="top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2" size="w-11 h-11" />
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-800 pt-2 mt-1">
          <div className="text-center text-[8px] text-zinc-500">Cancel</div>
        </div>
      </div>
    </div>
  );
}

function DoneScreen({ onUpload }) {
  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white items-center justify-center gap-4 px-4">
      <div className="h-6" />
      {/* CSV file icon */}
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
        <span className="text-[10px] font-bold text-emerald-400">CSV</span>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold">File Ready!</p>
        <p className="text-[8px] text-zinc-500 mt-1">strong_export.csv</p>
      </div>
      <button
        onClick={onUpload}
        className="px-6 py-2 rounded-xl bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1.5 active:scale-95 transition"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        Select File
      </button>
    </div>
  );
}

function Mockup({ type, onUpload }) {
  switch (type) {
    case 'profile': return <PhoneFrame><ProfileScreen /></PhoneFrame>;
    case 'settings': return <PhoneFrame><SettingsScreen /></PhoneFrame>;
    case 'export': return <PhoneFrame><ExportScreen /></PhoneFrame>;
    case 'share': return <PhoneFrame><ShareScreen /></PhoneFrame>;
    case 'done': return <PhoneFrame><DoneScreen onUpload={onUpload} /></PhoneFrame>;
    default: return null;
  }
}

export default function StrongExportGuide({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Step indicator */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? 'w-6 bg-blue-500' : i < step ? 'w-1.5 bg-blue-400' : 'w-1.5 bg-zinc-300 dark:bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Phone mockup */}
      <Mockup type={current.mockup} onUpload={onComplete} />

      {/* Step text */}
      <div className="text-center px-4">
        <p className="text-sm font-bold text-foreground">{current.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{current.subtitle}</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 w-full">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm transition active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}
        {!isLast ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm transition active:scale-95"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            I've Got the File
          </button>
        )}
      </div>
    </div>
  );
}