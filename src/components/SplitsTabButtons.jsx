import { memo } from 'react';

const SplitsTabButtons = memo(function SplitsTabButtons({ activeTab, setActiveTab }) {
  return (
    <div className="px-4 mb-5">
      <div className="flex bg-white/60 dark:bg-card/60 rounded-full p-1 gap-1 shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-950/50">
        <button
          onClick={() => setActiveTab('mine')}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
            activeTab === 'mine'
              ? 'bg-white dark:bg-card text-blue-600 dark:text-blue-400 shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          My Splits
        </button>
        <button
          onClick={() => setActiveTab('examples')}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
            activeTab === 'examples'
              ? 'bg-white dark:bg-card text-blue-600 dark:text-blue-400 shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Example Splits
        </button>
      </div>
    </div>
  );
});

export default SplitsTabButtons;