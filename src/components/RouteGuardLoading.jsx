// src/components/RouteGuardLoading.jsx
// Visible loading state with a 10s timeout and clear error/retry/sign-out controls
import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, LogOut, Loader2 } from 'lucide-react';
import MascotAvatar from './MascotAvatar';
import { useAuth } from '../context/AuthContext';

export default function RouteGuardLoading({ message = 'Verifying session & air profile...' }) {
  const { logout } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 10000); // 10-second timeout

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    window.location.href = '/auth';
  };

  if (timedOut) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Connection Taking Longer Than Expected
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              We could not connect to authentication or profile services within 10 seconds. You can retry the connection or sign out to return to the login page.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleRetry}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
      <MascotAvatar size="md" className="animate-bounce mb-1" />
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
        <span>{message}</span>
      </div>
    </div>
  );
}
