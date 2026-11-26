// src/components/aqi/AQILocationErrorCard.jsx
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Renders location verification failure card when coordinates exceed the 60km sanity boundary.
 */
export default function AQILocationErrorCard({
  aqiData,
  locationTitle,
  loading = false,
  onRefresh
}) {
  return (
    <div className="rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 p-6 md:p-8 shadow-soft dark:shadow-soft-dark transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              <span>Location Verification Guard</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
              Unable to verify air data for {locationTitle || aqiData?.city || 'Location'}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              {aqiData.message ||
                'The atmospheric model grid point did not match your requested coordinates within the 60 km accuracy boundary.'}
            </p>
            {aqiData.distanceKm && (
              <p className="text-[11px] font-mono text-amber-900 dark:text-amber-200 mt-1">
                Measured distance: <strong>{aqiData.distanceKm} km</strong> (exceeds 60 km sanity
                threshold)
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
          <a
            href="/settings"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-colors"
          >
            Update my location
          </a>
        </div>
      </div>
    </div>
  );
}
