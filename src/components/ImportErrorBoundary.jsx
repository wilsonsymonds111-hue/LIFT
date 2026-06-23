import { Component } from 'react';

/**
 * Error boundary that catches "Failed to fetch dynamically imported module"
 * errors (a known Vite HMR transient issue) and automatically reloads the page
 * so the browser re-fetches the freshly compiled module.
 *
 * Includes loop prevention: if a reload was already attempted recently, shows
 * a manual retry button instead of reloading again.
 */
export default class ImportErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    const isImportError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed');

    if (isImportError) {
      const lastReload = sessionStorage.getItem('importErrorReload');
      const now = Date.now();
      // If we already reloaded within the last 10 seconds, don't loop —
      // show manual retry instead.
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('importErrorReload', String(now));
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  }

  handleManualRetry = () => {
    sessionStorage.removeItem('importErrorReload');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4 px-6">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-slate-800 rounded-full animate-spin" />
          <button
            onClick={this.handleManualRetry}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 active:scale-95 transition"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}