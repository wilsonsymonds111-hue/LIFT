import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CreateAccountModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailSignUp = () => {
    if (!email.trim() || !password.trim()) return;
    base44.auth.redirectToLogin(window.location.href);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative bg-card rounded-t-3xl w-full px-5 pt-5 shadow-2xl flex flex-col gap-6 overflow-y-auto border-t border-gray-200 dark:border-border"
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
            onClick={() => base44.auth.loginWithProvider('apple', window.location.pathname)}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm transition active:opacity-80"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Continue with Apple
          </button>

          <button
            onClick={() => base44.auth.loginWithProvider('google', window.location.pathname)}
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

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email & Password */}
          <div className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full border-2 border-border rounded-2xl px-4 py-3 bg-background text-foreground text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              className="w-full border-2 border-border rounded-2xl px-4 py-3 bg-background text-foreground text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition"
            />
            <button
              onClick={handleEmailSignUp}
              disabled={!email.trim() || !password.trim()}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-semibold text-sm transition active:opacity-80"
            >
              Sign Up
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center pb-2">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>,
    document.body
  );
}