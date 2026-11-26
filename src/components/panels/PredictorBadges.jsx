// src/components/panels/PredictorBadges.jsx
import { getAQICategory } from '../../../functions/api/aqi-timeline.js';

/**
 * CPCB National AQI Badge renderer (Always text + dot, WCAG AA contrast).
 */
export function CategoryBadge({ aqi, categoryName }) {
  const cat = getAQICategory(aqi != null ? aqi : categoryName);
  const name = categoryName || cat.name;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${cat.badgeClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
      <span>{name}</span>
    </span>
  );
}

/**
 * Compact horizontal preview strip of upcoming 7-day AQI points.
 */
export function Strip7DayPreview({ days = [] }) {
  if (!days || days.length === 0) {
    return (
      <div className="flex gap-1.5 pt-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-10 rounded-xl bg-[#E2E8F0] dark:bg-[#1E293B] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
      {days.slice(0, 7).map((day, idx) => {
        const cat = getAQICategory(day.averageAqi);
        return (
          <div
            key={idx}
            className="flex-1 min-w-[34px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-between border border-[#CBD5E1] dark:border-[#334155] bg-[#E2E8F0] dark:bg-[#1E293B] transition-transform duration-200 motion-safe:hover:-translate-y-0.5"
            title={`${day.dayName}: Estimated NAQI ${day.averageAqi} (${cat.name})`}
          >
            <span className="text-[10px] font-bold text-[#334155] dark:text-[#CBD5E1]">
              {idx === 0 ? 'Today' : day.shortDay}
            </span>
            <div
              className="w-2.5 h-2.5 my-1 rounded-full shadow-xs shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-[11px] font-extrabold text-[#334155] dark:text-[#F8FAFC]">
              {day.averageAqi}
            </span>
          </div>
        );
      })}
    </div>
  );
}
