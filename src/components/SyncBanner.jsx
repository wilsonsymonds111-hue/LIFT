import { useState } from 'react';
import { Cloud, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function SyncBanner() {
  const { isGuest, handleCreateAccount } = useAuth();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('syncBannerDismissed') === 'true');

  if (!isGuest || dismissed) return null;

  return (
    <div className="mx-4 mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/10" />
      <div className="relative flex items-start gap-3">
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">Sync across devices</p>
          <p className="text-white/80 text-xs mt-1 leading-relaxed">
            Your data lives on this device. Create a free account to save everything to the cloud and access it anywhere.
          </p>
          <button
            onClick={handleCreateAccount}
            className="mt-3 px-4 py-2 bg-white text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-50 transition active:scale-95"
          >
            Create Account
          </button>
        </div>
        <button
          onClick={() => { setDismissed(true); localStorage.setItem('syncBannerDismissed', 'true'); }}
          className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 hover:bg-white/25 transition"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}