// src/components/panels/PredictorTrendChart.jsx
import { TrendingUp } from 'lucide-react';
import { getAQICategory } from '../../../functions/api/aqi-timeline.js';
import { getTrajectoryStats } from '../../utils/aqiDisplayHelpers';

/**
 * 7-Day Daily Mean Trajectory spark chart with interactive day column selection.
 */
export default function PredictorTrendChart({ days = [], selectedDayIndex, onSelectDay }) {
  const stats = getTrajectoryStats(days);

  return (
    <div className="p-4 rounded-2xl bg-[#E2E8F0] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#334155] dark:text-[#F8FAFC] flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>7-Day Daily Mean Trajectory (CPCB NAQI)</span>
        </span>
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono">
          Min: {stats.minAqi} • Max: {stats.maxAqi} NAQI
        </span>
      </div>

      <div className="flex items-end gap-2 h-16 pt-2">
        {days.map((day, idx) => {
          const isSelected = idx === selectedDayIndex;
          const cat = getAQICategory(day.averageAqi);
          const heightPct = Math.max(20, Math.min(100, Math.round((day.averageAqi / 500) * 100)));

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDay(idx)}
              className={`flex-1 flex flex-col items-center justify-end h-full gap-1 p-1 rounded-xl transition-all duration-200 cursor-pointer motion-safe:hover:-translate-y-0.5 ${
                isSelected
                  ? 'bg-sky-200/90 dark:bg-sky-950/90 ring-2 ring-sky-500'
                  : 'hover:bg-slate-300/70 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[9px] font-bold text-[#334155] dark:text-[#F8FAFC]">
                {day.averageAqi}
              </span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: cat.color,
                  opacity: isSelected ? 1 : 0.8
                }}
              />
              <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300">
                {idx === 0 ? 'Today' : day.shortDay}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-600 dark:text-slate-400 italic pt-1 text-center">
        *Forecast confidence is highest for Today & Tomorrow; accuracy decreases for days further
        ahead as atmospheric dynamics evolve.
      </p>
    </div>
  );
}
