import { memo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import ExerciseRow from './ExerciseRow';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const ExerciseList = memo(function ExerciseList({ grouped, exerciseHistory, exerciseImages, onSelectExercise }) {
  const sectionRefs = useRef({});

  const scrollToLetter = useCallback((letter) => {
    const el = sectionRefs.current[letter];
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // The tab content div uses `contain: layout`, which makes it the containing
  // block for fixed descendants — so a fixed legend scrolls with the content.
  // Portal it to the body so it stays fixed to the viewport, and only show it
  // on the exercises page (the list stays mounted on other tabs).
  const isExercisesPage = useLocation().pathname === '/exercises';
  const availableLetters = grouped.map(([l]) => l);
  const showLegend = isExercisesPage && availableLetters.length > 0;

  return (
    <div className="relative">
      <div className="px-2">
        {grouped.map(([letter, exs]) => (
          <div
            key={letter}
            ref={el => sectionRefs.current[letter] = el}
            style={{ contentVisibility: 'auto', containIntrinsicSize: `auto ${exs.length * 60}px` }}
          >
            <div className="pt-4 pb-1.5 px-3 text-lg font-bold text-black dark:text-foreground">
              {letter}
            </div>
            <div className="mx-1">
            {exs.map((ex, idx) => (
            <ExerciseRow
              key={ex.name}
              exercise={ex}
              exerciseHistory={exerciseHistory}
              exerciseImages={exerciseImages}
              onSelect={onSelectExercise}
              isLast={idx === exs.length - 1}
            />
            ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-10">No exercises found</p>
        )}
      </div>

      {showLegend && createPortal(
        <>
          {/* Thin vertical fade strip — blurs content overlapping the alphabet legend */}
          <div
            className="fixed top-1/2 -translate-y-1/2 right-0 w-10 pointer-events-none z-20 backdrop-blur-sm bg-gradient-to-l from-background via-background/50 to-transparent dark:from-background dark:via-background/50"
            style={{
              height: '600px',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to right, transparent 0%, black 45%, black 100%)',
              maskComposite: 'intersect',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to right, transparent 0%, black 45%, black 100%)',
              WebkitMaskComposite: 'source-in',
            }}
          />
          <div className="fixed right-1 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-30">
            {LETTERS.map(l => {
              const exists = availableLetters.includes(l);
              return (
                <button
                  key={l}
                  onClick={() => exists && scrollToLetter(l)}
                  className={`text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-sm transition ${
                    exists
                      ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950'
                      : 'text-muted-foreground/30'
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
});

export default ExerciseList;