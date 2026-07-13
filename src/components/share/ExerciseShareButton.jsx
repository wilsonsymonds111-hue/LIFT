import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import StoryShareSheet from './StoryShareSheet';

const INSTAGRAM_ICON_URL = 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/427c77c15_image.png';

export default function ExerciseShareButton({ exercise, sessionResults, pr, exerciseImage }) {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowSheet(true)}
        className="w-7 h-7 flex items-center justify-center rounded-lg transition flex-shrink-0 hover:opacity-80 overflow-hidden"
        aria-label="Share to Instagram"
      >
        <img src={INSTAGRAM_ICON_URL} alt="Share to Instagram" className="w-5 h-5 object-contain" />
      </button>
      <AnimatePresence>
        {showSheet && (
          <StoryShareSheet
            key="story-share-sheet"
            exercise={exercise}
            sessionResults={sessionResults}
            pr={pr}
            exerciseImage={exerciseImage}
            onClose={() => setShowSheet(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}