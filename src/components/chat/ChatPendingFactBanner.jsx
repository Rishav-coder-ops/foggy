// src/components/chat/ChatPendingFactBanner.jsx
import { Sparkles, X } from 'lucide-react';

export default function ChatPendingFactBanner({ pendingFact, onAccept, onDismiss }) {
  if (!pendingFact) return null;

  return (
    <div className="p-2.5 px-3 bg-sky-50 dark:bg-sky-950/70 border-b border-sky-200 dark:border-sky-800 text-[11px] flex items-center justify-between gap-2 shrink-0 animate-fade-in">
      <div className="flex items-center gap-1.5 truncate">
        <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
        <span className="truncate text-slate-700 dark:text-slate-200">
          Save:{' '}
          <strong>
            {pendingFact.name
              ? `${pendingFact.name} (${pendingFact.condition || 'Health detail'})`
              : pendingFact.detail || 'Detail'}
          </strong>
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onAccept(pendingFact.id)}
          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500 hover:bg-sky-600 text-white"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => onDismiss(pendingFact.id)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
