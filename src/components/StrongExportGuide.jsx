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
    highlight: { top: '58%', left: '20%', width: '60%', height: '9%' },
  },
  {
    title: 'Save to Files',
    subtitle: 'Choose "Save to Files" to download the CSV to your phone',
    image: SCREENSHOTS.share,
    // Save to Files is in the actions row near the bottom
    highlight: { top: '72%', left: '62%', width: '16%', height: '12%' },
  },
];

export default function StrongExportGuide({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex flex-col items-center gap-3 py-1">
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

      {/* Screenshot in phone frame */}
      <div className="relative mx-auto" style={{ width: 150, height: 315 }}>
        {/* Phone frame PNG (transparent screen) */}
        <img
          src="https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/69b193eac_image.png"
          alt="iPhone frame"
          className="absolute inset-0 w-full h-full object-contain z-30 pointer-events-none"
        />
        {/* Screen content */}
        <div className="absolute rounded-[2rem] overflow-hidden z-10 bg-white" style={{ top: '1.5%', left: '4%', right: '4%', bottom: '1.5%' }}>
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
        </div>
      </div>

      {/* Step text */}
      <div className="text-center px-4">
        <p className="text-sm font-bold text-foreground">{current.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{current.subtitle}</p>
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