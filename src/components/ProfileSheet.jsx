import { useState } from 'react';
import { X, Moon, Sun, Trash2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ProfileSheet({ onClose, darkMode, onToggleDark }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toLowerCase() !== 'delete') return;
    setDeleting(true);
    try {
      const templates = await base44.entities.WorkoutTemplate.list();
      await Promise.all(templates.map(t => base44.entities.WorkoutTemplate.delete(t.id)));
      base44.auth.logout();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative bg-card rounded-t-3xl w-full px-5 pt-5 shadow-2xl flex flex-col gap-4 overflow-y-auto"
        style={{ maxHeight: '80vh', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {/* Handle + close */}
        <div className="flex justify-center mb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-foreground">Profile</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between bg-muted rounded-2xl px-4 py-3.5">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="w-5 h-5 text-foreground" /> : <Sun className="w-5 h-5 text-foreground" />}
            <span className="font-semibold text-foreground text-sm">Dark Mode</span>
          </div>
          <button
            onClick={onToggleDark}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${darkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Delete account */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-3 bg-red-50 dark:bg-red-950/40 rounded-2xl px-4 py-3.5 transition active:opacity-70"
          >
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/60 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-red-500 text-sm">Delete Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently remove all your data</p>
            </div>
          </button>
        ) : (
          <div className="bg-card border border-red-200 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm font-bold text-red-500">Type <span className="font-extrabold">delete</span> to confirm</p>
            </div>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="delete"
              autoCapitalize="none"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-300 text-center font-semibold"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-muted-foreground bg-muted transition active:opacity-70"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText.trim().toLowerCase() !== 'delete' || deleting}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-500 disabled:opacity-40 transition active:opacity-70"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}