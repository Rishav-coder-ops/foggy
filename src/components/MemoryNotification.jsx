// src/components/MemoryNotification.jsx
import { Sparkles, Check, X } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

export default function MemoryNotification() {
  const { pendingFacts, acceptPendingFact, dismissPendingFact } = useProfile();

  if (!pendingFacts || pendingFacts.length === 0) {
    return null;
  }

  const current = pendingFacts[0];

  const formatFactSummary = (f) => {
    if (f.type === 'family') {
      return `Family Member: ${f.name || 'Member'} (${f.condition || 'Sensitive Health Condition'})`;
    }
    if (f.type === 'home' || f.type === 'lifestyle') {
      return `${f.key ? f.key.toUpperCase() : 'Home detail'}: ${f.value}`;
    }
    return f.detail || 'New household context detected';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 animate-bounce-short">
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-sky-400/50 dark:border-sky-500/40 p-4 shadow-xl dark:shadow-soft-dark backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                Foggy Memory Suggestion
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                {pendingFacts.length > 1 ? `1 of ${pendingFacts.length}` : 'Just now'}
              </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {formatFactSummary(current)}
            </p>

            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Would you like Foggy to remember this so future advice automatically accounts for it?
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => acceptPendingFact(current.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save to Profile</span>
              </button>

              <button
                type="button"
                onClick={() => dismissPendingFact(current.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Dismiss</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
