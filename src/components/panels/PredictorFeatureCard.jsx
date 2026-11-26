// src/components/panels/PredictorFeatureCard.jsx
import { Calendar } from 'lucide-react';
import { Strip7DayPreview } from './PredictorBadges';

/**
 * Feature card preview for the 7-Day AQI Predictor on the Landing Page.
 */
export default function PredictorFeatureCard({ cardRef, isOpen, onOpen, days = [] }) {
  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label="Open 7-Day AQI Predictor panel"
      className="interactive-card rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-3 cursor-pointer group hover:border-sky-400 dark:hover:border-sky-500/60 hover:shadow-glow-ozone focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-300 motion-safe:hover:-translate-y-1.5 motion-safe:active:scale-[0.98] flex flex-col justify-between"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:rotate-3 shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            7-Day Atmospheric Model
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
          7-Day AQI Predictor
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Multi-day CAMS forecast model tracks incoming atmospheric inversions and weather fronts,
          helping you schedule outdoor activities and commute swaps in advance.
        </p>

        {/* Compact 7-Day Preview Strip */}
        <div className="pt-1">
          <Strip7DayPreview days={days} />
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-sky-600 dark:text-sky-400">
        <span>Click to explore 7-day forecast</span>
        <span className="text-slate-400 group-hover:text-sky-500 transition-all duration-300 motion-safe:group-hover:translate-x-1.5">
          →
        </span>
      </div>
    </div>
  );
}
