// src/components/ErrorBoundary.jsx
// Top-level React Error Boundary to catch render crashes and prevent blank screens.
import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import MascotAvatar from './MascotAvatar';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected rendering error occurred.';

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
          <div className="max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl text-center space-y-6">
            {/* Avatar & Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <MascotAvatar size="lg" mood="listening" />
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-rose-500 text-white shadow-md">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Title & Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Something Went Foggy
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                We encountered an unexpected interface error. Don't worry, your saved household
                profiles and air quality data are completely safe.
              </p>
            </div>

            {/* Error Detail Pill */}
            <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-left text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Error Details</span>
              </div>
              <p className="font-mono text-[11px] text-rose-700 dark:text-rose-400 break-words">
                {errorMessage}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <a
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Back to Home</span>
              </a>
            </div>

            {/* Helpful Note */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Need assistance? Email our support desk at{' '}
              <a
                href="mailto:support.foggy@gmail.com"
                className="text-sky-600 dark:text-sky-400 underline font-medium"
              >
                support.foggy@gmail.com
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
