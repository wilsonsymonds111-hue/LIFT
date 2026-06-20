import { memo, useRef, useCallback } from 'react';
import ExerciseRow from './ExerciseRow';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const ExerciseList = memo(function ExerciseList({ grouped, exerciseHistory, exerciseImages, onSelectExercise }) {
  const sectionRefs = useRef({});

  const scrollToLetter = useCallback((letter) => {
    const el = sectionRefs.current[letter];
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const availableLetters = grouped.map(([l]) => l);

  return (
    <div className="relative">
      <div className="pl-4 pr-10">
        {grouped.map(([letter, exs]) => (
          <div key={letter} ref={el => sectionRefs.current[letter] = el}>
            <div className="py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-background sticky top-0">
              {letter}
            </div>
            {exs.map(ex => (
            <ExerciseRow
              key={ex.name}
              exercise={ex}
              exerciseHistory={exerciseHistory}
              exerciseImages={exerciseImages}
              onClick={() => onSelectExercise(ex)}
            />
            ))}
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-10">No exercises found</p>
        )}
      </div>

      {availableLetters.length > 0 && (
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
      )}
    </div>
  );
});

export default ExerciseList;