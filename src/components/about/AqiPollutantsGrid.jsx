// src/components/about/AqiPollutantsGrid.jsx
import { CPCB_POLLUTANTS } from '../../constants/about/aboutData';

export default function AqiPollutantsGrid() {
  return (
    <div className="pt-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
        Monitored Pollutants & National Ambient Air Quality Standards (NAAQS)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {CPCB_POLLUTANTS.map((pol) => (
          <div
            key={pol.code}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sky-600 dark:text-sky-400">
                {pol.code}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Standard: {pol.limit24h}
              </span>
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200">{pol.name}</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              <strong>Primary Sources:</strong> {pol.source}
            </p>
            <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
              <strong>Health Impact:</strong> {pol.impact}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
