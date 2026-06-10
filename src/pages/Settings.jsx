import { useState } from 'react';
import { Trash2, AlertTriangle, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BottomNav from '../components/BottomNav';

export default function Settings() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toLowerCase() !== 'delete') return;
    setDeleting(true);
    try {
      // Clear all workout templates for this user
      const templates = await base44.entities.WorkoutTemplate.list();
      await Promise.all(templates.map(t => base44.entities.WorkoutTemplate.delete(t.id)));
      // Log out
      base44.auth.logout();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-3xl font-extrabold text-gray-900">Settings</h1>
      </div>

      <div className="px-4 mt-6">
        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-100">
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Danger Zone</p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-between px-4 py-4 select-none active:bg-red-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-red-600 text-sm">Delete Account</p>
                <p className="text-xs text-gray-400 mt-0.5">Permanently remove all your data</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); }} />
          <div className="relative bg-white rounded-t-3xl w-full px-6 pt-6 pb-10 shadow-2xl" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 text-center mb-2">Delete Account</h2>
            <p className="text-sm text-gray-500 text-center mb-1">This will permanently delete:</p>
            <ul className="text-sm text-gray-600 mb-5 space-y-1 mt-2">
              <li className="flex items-center gap-2"><span className="text-red-400">•</span> All your workout templates</li>
              <li className="flex items-center gap-2"><span className="text-red-400">•</span> All exercise history and PRs</li>
              <li className="flex items-center gap-2"><span className="text-red-400">•</span> Your account permanently</li>
            </ul>
            <p className="text-xs text-gray-400 mb-2 text-center">Type <span className="font-bold text-gray-700">delete</span> to confirm</p>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-300 text-center font-semibold"
              autoCapitalize="none"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={confirmText.trim().toLowerCase() !== 'delete' || deleting}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition disabled:opacity-40 bg-red-500 active:bg-red-600 select-none"
            >
              {deleting ? 'Deleting…' : 'Delete My Account'}
            </button>
            <button
              onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); }}
              className="w-full py-3 mt-2 rounded-2xl font-semibold text-sm text-gray-500 active:bg-gray-100 transition select-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}