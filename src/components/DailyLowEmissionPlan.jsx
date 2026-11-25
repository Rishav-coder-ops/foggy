import { Bus, Sun, Calendar } from 'lucide-react';
import ImpactBadge from './ImpactBadge';

/**
 * Reusable Daily Low-Emission Plan routine cards shared between Dashboard and Search AQI pages.
 */
export default function DailyLowEmissionPlan({
  cityName = 'your city',
  locationTitle = '',
  isSimulated = false,
  children = null
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5">
            {isSimulated
              ? `Daily Low-Emission Plan for ${cityName}`
              : "Today's Low-Emission Daily Routine"}
          </h2>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {isSimulated
            ? `Simulated for ${locationTitle || cityName} • Live CAMS data`
            : `Tailored for ${locationTitle || cityName} • Updated hourly`}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Routine Card 1: Commute */}
        <div className="interactive-card rounded-2xl p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
                <Bus className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Commute: Prioritize Enclosed Public Transit
              </h3>
            </div>
            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50 px-2 py-0.5 rounded-full">
              7:30 AM
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Winter inversions trap vehicular exhaust at bumper height. Riding the air-conditioned
            Metro or electric bus bypasses direct street-level PM2.5 inhalation and cuts personal
            emissions.
          </p>

          <ImpactBadge
            co2Saved="~2.4 kg CO2 saved"
            pmReduced="-65% PM2.5 inhaled"
            costTradeoff="~₹180 fuel & parking saved"
          />
        </div>

        {/* Routine Card 2: Outdoor Activity */}
        <div className="interactive-card rounded-2xl p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
                <Sun className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Outdoor Timing: Shift Exercise to 1:30 PM – 3:30 PM
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
              Safest Window
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Solar radiation breaks the morning ground thermal inversion lid between 1:00 PM and 3:30
            PM, providing the cleanest dispersion window for essential errands and outdoor
            activities.
          </p>

          <ImpactBadge healthBenefit="Avoids ground smog spike" pmReduced="-35% ground PM2.5" />
        </div>

        {children}
      </div>
    </div>
  );
}
