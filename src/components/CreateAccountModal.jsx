import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CreateAccountModal({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative bg-card rounded-t-3xl w-full px-5 pt-5 shadow-2xl flex flex-col gap-6 overflow-y-auto"
        style={{ maxHeight: '80vh', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {/* X close button — top left */}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-muted self-start"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>

        <div className="text-center px-4">
          <h2 className="text-xl font-extrabold text-foreground mb-1">Create an account</h2>
          <p className="text-sm text-muted-foreground">
            Save your data to the cloud and access it from any device.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm transition active:opacity-80"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05 1.47-3.36 1.47-1.33 0-2.53-.52-3.62-1.54-1.09-1.03-1.64-2.26-1.64-3.7s.55-2.62 1.64-3.64c1.09-1.02 2.3-1.54 3.62-1.54 1.31 0 2.38.52 3.36 1.47l-1.21 1.16c-.63-.59-1.38-.88-2.27-.88-.92 0-1.72.33-2.38.98-.65.64-.98 1.46-.98 2.45s.33 1.8.98 2.44c.66.65 1.46.98 2.38.98.89 0 1.64-.29 2.27-.88l1.21 1.16z"/>
              <path d="M18.5 15.5h2v-3h-2v-2h-3v2h-2v3h2v2h3v-2z" fill="currentColor" opacity="0.7"/>
            </svg>
            Continue with Apple
          </button>

          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl border-2 border-border bg-card hover:bg-muted text-foreground font-semibold text-sm transition active:opacity-80"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center pb-2">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>,
    document.body
  );
}