// src/components/family/CarePlanDiurnalSlots.jsx
import { Clock } from 'lucide-react';

export default function CarePlanDiurnalSlots({ timeSlots = [] }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-sky-500" />
        <span>Diurnal Inversion Schedule &amp; Lifestyle Swaps</span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {timeSlots.map((ts, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-xs flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">{ts.slot}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                {ts.forecastBadge}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              {ts.guidance}
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              ⚡ {ts.lifestyleAdjustment}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
