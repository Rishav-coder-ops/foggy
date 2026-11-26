// src/components/aqi/AQIScoreOverview.jsx
import { Thermometer, Droplets, Wind } from 'lucide-react';
import { CPCB_SPECTRUM_SEGMENTS } from '../../constants/aqiThresholds';

/**
 * Large numerical score card displaying CPCB NAQI rating, spectrum gradient,
 * nearest WAQI reference, and local weather pill.
 */
export default function AQIScoreOverview({ aqiData, cat }) {
  return (
    <div className="lg:col-span-5 rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          National AQI (CPCB Scale)
        </span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${cat.badgeClass}`}>
          {cat.label}
        </span>
      </div>

      <div className="my-4 flex items-baseline gap-3">
        <span
          className="text-6xl md:text-7xl font-extrabold tracking-tight"
          style={{ color: cat.color }}
        >
          {aqiData?.aqi ?? 0}
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Estimated NAQI
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">from PM2.5 & PM10</span>
        </div>
      </div>

      {/* CPCB NAQI Gradient Spectrum Bar (0 - 500) */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden flex">
          {CPCB_SPECTRUM_SEGMENTS.map((seg, i) => (
            <div
              key={i}
              className="h-full"
              style={{ width: seg.widthPct, backgroundColor: seg.color }}
              title={seg.title}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-medium">
          <span>0 (Good)</span>
          <span>100 (Sat)</span>
          <span>200 (Mod)</span>
          <span>300 (Poor)</span>
          <span>400 (V.Poor)</span>
          <span>500 (Sev)</span>
        </div>
      </div>

      {/* Nearest station WAQI reference if available */}
      {aqiData?.waqiReference && (
        <div className="mt-3 p-2 rounded-xl bg-slate-200/60 dark:bg-slate-700/50 text-[10px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <span>Nearest station (WAQI, US EPA scale):</span>
          <span className="font-bold">AQI {aqiData.waqiReference.aqiUS}</span>
        </div>
      )}

      {/* Weather Pill */}
      <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-rose-500" />
          <span>{aqiData?.weather?.temp ?? 24}°C</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-sky-500" />
          <span>{aqiData?.weather?.humidity ?? 68}% Hum</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-4 h-4 text-teal-500" />
          <span>{aqiData?.weather?.windSpeed ?? 3.2} km/h</span>
        </div>
      </div>
    </div>
  );
}
