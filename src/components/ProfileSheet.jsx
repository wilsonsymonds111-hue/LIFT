import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Moon, Sun, Trash2, AlertTriangle, Camera, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import FeedbackModal from './FeedbackModal';
import { useNavVisibility } from '@/lib/NavContext';

import { memo } from 'react';

const ProfileSheet = memo(function ProfileSheet({ onClose, darkMode, onToggleDark, profilePhoto, onPhotoChange }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const { setHideNav } = useNavVisibility();

  // Hide bottom nav while profile sheet is open
  useEffect(() => {
    setHideNav(true);
    return () => setHideNav(false);
  }, [setHideNav]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      localStorage.setItem('profilePhoto', file_url);
      await base44.auth.updateMe({ profilePhoto: file_url });
      onPhotoChange(file_url);
    } catch {}
    setUploading(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative bg-card rounded-t-3xl w-full px-5 pt-5 shadow-2xl flex flex-col gap-4 overflow-y-auto"
        style={{ maxHeight: '80vh', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {/* Handle */}
        <div className="flex justify-center mb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-foreground">Profile</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Photo upload */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-4 border-background shadow-lg">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary">
                  <span className="text-3xl font-extrabold text-primary-foreground">?</span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md transition active:scale-95"
            >
              {uploading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {profilePhoto ? 'Tap camera to change photo' : 'Add a profile photo'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        {/* Feedback & Support */}
        <button
          onClick={() => setShowFeedback(true)}
          className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3.5 transition active:opacity-70"
        >
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground text-sm">Feedback & Support</p>
            <p className="text-xs text-muted-foreground mt-0.5">Chat with AI or message the developer</p>
          </div>
        </button>

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

        {showFeedback && (
          <FeedbackModal onClose={() => setShowFeedback(false)} />
        )}
      </div>
    </div>,
    document.body
  );
});

export default ProfileSheet;