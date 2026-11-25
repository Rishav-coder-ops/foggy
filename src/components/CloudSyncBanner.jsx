// src/components/CloudSyncBanner.jsx
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

export default function CloudSyncBanner() {
  const { syncBlocked, retrySync } = useProfile();

  if (!syncBlocked) return null;

  return (
    <div
      role="alert"
      className="bg-amber-500/15 dark:bg-amber-950/70 border-b border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 z-30 relative"
    >
      <div className="flex items-center gap-2 max-w-4xl">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="leading-relaxed">
          Your browser or an extension seems to be blocking cloud sync. Your saved data may not be
          up to date. Try turning off your ad blocker or Brave Shields for this site.
        </span>
      </div>
      <button
        type="button"
        onClick={retrySync}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry</span>
      </button>
    </div>
  );
}
