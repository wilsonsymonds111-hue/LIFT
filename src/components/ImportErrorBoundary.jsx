import { Component } from 'react';

/**
 * Error boundary that catches "Failed to fetch dynamically imported module"
 * errors (a known Vite HMR transient issue) and automatically reloads the page
 * so the browser re-fetches the freshly compiled module.
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
      // Give Vite a moment to finish recompiling, then reload
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      );
    }
    return this.props.children;
  }
}