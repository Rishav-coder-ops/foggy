// src/components/panels/Predictor3hIntervals.jsx
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { CategoryBadge } from './PredictorBadges';
import { get3hSlotStyle } from '../../utils/aqiDisplayHelpers';

/**
 * 3-hour interval breakdown cards (02:00, 05:00, 08:00, 11:00, etc.) for the selected day.
 */
export default function Predictor3hIntervals({ selectedDay }) {
  const intervals = selectedDay?.intervals3h || [];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
        <span>3-Hour Targeted Time Slots</span>
        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-normal">
          Compared to daily mean ({selectedDay?.averageAqi} NAQI)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        {intervals.map((slot, idx) => {
          const isBest = selectedDay?.bestSlot?.time === slot.time;
          const isWorst = selectedDay?.worstSlot?.time === slot.time;
          const styles = get3hSlotStyle(slot, isBest, isWorst);

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md flex flex-col justify-between space-y-2 shadow-xs ${styles.cardClasses}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-mono font-bold tracking-tight ${styles.timeClasses}`}
                  >
                    {slot.time}
                  </span>
                  {isBest && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 dark:bg-emerald-900/90 dark:text-emerald-100 border border-emerald-400 dark:border-emerald-700">
                      ★ Cleanest
                    </span>
                  )}
                  {isWorst && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-950 dark:bg-rose-900/90 dark:text-rose-100 border border-rose-400 dark:border-rose-700">
                      ▲ Peak Smog
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-2xl font-black tracking-tight ${styles.aqiClasses}`}>
                    {slot.aqi}
                  </span>
                  <CategoryBadge aqi={slot.aqi} categoryName={slot.category} />
                </div>

                {/* Comparison with daily average */}
                <div className="flex items-center gap-1 text-[10px] mt-1.5">
                  {slot.diffFromAvg < 0 ? (
                    <span className="text-emerald-800 dark:text-emerald-400 font-semibold flex items-center">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      {Math.abs(slot.diffFromAvg)} pts cleaner than avg
                    </span>
                  ) : slot.diffFromAvg > 0 ? (
                    <span className="text-rose-800 dark:text-rose-400 font-semibold flex items-center">
                      <ArrowUpRight className="w-3.5 h-3.5" />+{slot.diffFromAvg} pts worse than avg
                    </span>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center">
                      <Minus className="w-3.5 h-3.5" /> matches daily avg
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`pt-2 border-t text-[11px] leading-snug font-medium ${styles.adviceClasses}`}
              >
                {slot.advice}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
