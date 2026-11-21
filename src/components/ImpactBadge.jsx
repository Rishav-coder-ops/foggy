// src/components/ImpactBadge.jsx
import { Leaf, ShieldCheck, DollarSign, Clock } from 'lucide-react';

export default function ImpactBadge({
  co2Saved = null,
  pmReduced = null,
  healthBenefit = null,
  costTradeoff = null,
  timeTradeoff = null,
  className = ''
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs font-medium ${className}`}>
      {co2Saved && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 shadow-xs">
          <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{co2Saved}</span>
        </span>
      )}

      {pmReduced && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-100/90 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300/80 dark:border-sky-700/60 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>{pmReduced}</span>
        </span>
      )}

      {healthBenefit && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 shadow-xs">
          <span>🩺 {healthBenefit}</span>
        </span>
      )}

      {costTradeoff && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300/80 dark:border-indigo-700/60 shadow-xs">
          <DollarSign className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          <span>{costTradeoff}</span>
        </span>
      )}

      {timeTradeoff && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 shadow-xs">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{timeTradeoff}</span>
        </span>
      )}
    </div>
  );
}
