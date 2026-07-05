import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const SCREENSHOTS = {
  profile: 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/079d21fce_IMG_8160.png',
  settings: 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/56220c5cc_IMG_8161.png',
  export: 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/c13a4caff_IMG_8162.png',
  share: 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/a2f18ca5b_IMG_8163.png',
};

const STEPS = [
  {
    title: 'Open Profile & Settings',
    subtitle: 'Tap the gear icon at the top-left of your Profile screen',
    image: SCREENSHOTS.profile,
    // Gear icon is top-left area
    highlight: { top: '4%', left: '1%', width: '14%', height: '6%' },
  },
  {
    title: 'Find "Export Workouts"',
    subtitle: 'Scroll down to Data Management and tap "Export Workouts"',
    image: SCREENSHOTS.settings,
    // Export Workouts row is near the bottom of the settings list
    highlight: { top: '78%', left: '5%', width: '90%', height: '6%' },
  },
  {
    title: 'Tap "Export Workouts"',
    subtitle: 'Hit the blue Export button to generate your CSV file',
    image: SCREENSHOTS.export,
    // Blue export button near bottom of modal
    highlight: { top: '60%', left: '15%', width: '70%', height: '6%' },
  },
  {
    title: 'Save to Files',
    subtitle: 'Choose "Save to Files" to download the CSV to your phone',
    image: SCREENSHOTS.share,
    // "Save to Files" is the 3rd action in the bottom actions row (Copy, New Quick Note, Save to Files)
    highlight: { top: '80%', left: '64%', width: '20%', height: '11%' },
  },
];

export default function StrongExportGuide({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex flex-col items-center gap-2 py-0">
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

      {/* Screenshot in CSS phone frame */}
      <div className="relative mx-auto" style={{ width: 140, height: 290 }}>
        {/* Phone body */}
        <div className="absolute inset-0 rounded-[1.5rem] bg-[#1A1A1A] shadow-2xl" />
        {/* Side buttons - left */}
        <div className="absolute left-[-2px] top-[14%] w-[2px] h-[7%] rounded-l bg-[#8C8C8C]" />
        <div className="absolute left-[-2px] top-[23%] w-[2px] h-[4%] rounded-l bg-[#8C8C8C]" />
        <div className="absolute left-[-2px] top-[29%] w-[2px] h-[4%] rounded-l bg-[#8C8C8C]" />
        {/* Side button - right */}
        <div className="absolute right-[-2px] top-[22%] w-[2px] h-[9%] rounded-r bg-[#8C8C8C]" />
        {/* Screen */}
        <div className="absolute inset-[3px] rounded-[1.3rem] overflow-hidden z-10 bg-white">
          <img
            src={current.image}
            alt={`Step ${step + 1}: ${current.title}`}
            className="w-full h-full object-cover object-top"
          />
          {/* Pulsing highlight overlay */}
          <div
            className="absolute rounded-lg"
            style={{
              top: current.highlight.top,
              left: current.highlight.left,
              width: current.highlight.width,
              height: current.highlight.height,
            }}
          >
            <div className="absolute inset-0 rounded-lg bg-blue-500/20 animate-ping" />
            <div className="absolute inset-0 rounded-lg border-[3px] border-blue-500 bg-blue-500/10" />
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2 w-[40px] h-[3px] bg-black/30 rounded-full z-20" />
        </div>
      </div>

      {/* Step text */}
      <div className="text-center px-4">
        <p className="text-sm font-bold text-foreground">{current.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{current.subtitle}</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 w-full pt-1">
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