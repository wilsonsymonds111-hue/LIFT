import { RefreshCw } from 'lucide-react';

export default function PullToRefreshIndicator({ pullY, refreshing }) {
  const opacity = Math.min(pullY / 70, 1);
  const rotate = (pullY / 70) * 180;

  if (pullY <= 0 && !refreshing) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
      style={{ transform: `translateY(${refreshing ? 48 : pullY - 12}px)`, transition: refreshing ? 'transform 0.2s ease' : 'none' }}
    >
      <div
        className="w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center"
        style={{ opacity }}
      >
        <RefreshCw
          className={`w-5 h-5 text-blue-500 ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? 'none' : `rotate(${rotate}deg)` }}
        />
      </div>
    </div>
  );
}