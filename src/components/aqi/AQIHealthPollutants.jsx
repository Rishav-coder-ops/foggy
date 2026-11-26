// src/components/aqi/AQIHealthPollutants.jsx
import { Shield } from 'lucide-react';
import { getMaskAdvisory, formatPollutants } from '../../utils/aqiDisplayHelpers';

/**
 * Health guidance banner, mask usage recommendation, and 24-hour pollutant breakdown.
 */
export default function AQIHealthPollutants({ aqiData }) {
  const mask = getMaskAdvisory(aqiData?.aqi);
  const pollutantList = formatPollutants(aqiData?.pollutants);

  return (
    <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
      {/* Main Health Advisory Banner with official CPCB health statements */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
          <Shield className="w-4 h-4 text-sky-500" />
          <span>CPCB Health Guidance & Impact</span>
        </div>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          {aqiData?.healthImpact ||
            aqiData?.advisory ||
            'Air quality is monitored continuously according to CPCB guidelines.'}
        </p>
        {aqiData?.advisory && aqiData?.advisory !== aqiData?.healthImpact && (
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{aqiData.advisory}</p>
        )}
      </div>

      {/* Mask Recommendation Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/50 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">😷</span>
          <div>
            <p className="font-bold text-sky-900 dark:text-sky-200">{mask.title}</p>
            <p className="text-sky-700 dark:text-sky-300/80 text-[11px]">{mask.subtitle}</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2 py-1 rounded-md">
          {mask.urgency}
        </span>
      </div>

      {/* Pollutant Breakdown Grid */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
          Key Pollutant Concentrations (24-Hour Average)
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {pollutantList.map((p) => (
            <div
              key={p.label}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-center"
            >
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {p.label}
              </div>
              <div
                className={`text-sm font-extrabold mt-0.5 ${p.isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}
              >
                {p.val}
              </div>
              <div className="text-[9px] text-slate-600 dark:text-slate-400">{p.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Attribution & Official CPCB Guidance Note */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-1">
        <p>
          <strong>Attribution:</strong> Air quality data: Open-Meteo.com, based on Copernicus
          Atmosphere Monitoring Service (CAMS) model data.
        </p>
        <p className="italic">
          Estimated from modelled data; official CPCB station readings may differ. Check the
          official CPCB bulletin or the SAMEER app for authoritative values.
        </p>
      </div>
    </div>
  );
}
