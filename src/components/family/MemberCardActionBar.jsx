// src/components/family/MemberCardActionBar.jsx
import { Shield, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export default function MemberCardActionBar({
  member,
  isPlanOpen,
  onTogglePlan,
  onPersonalize
}) {
  return (
    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onTogglePlan(member.id)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
      >
        <Shield className="w-3.5 h-3.5 text-sky-500" />
        <span>{isPlanOpen ? "Hide Today's Care Plan" : "View Today's Care Plan"}</span>
        {isPlanOpen ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onPersonalize(member)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-300/60 dark:border-sky-800 transition-all cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Personalise with Foggy</span>
      </button>
    </div>
  );
}
