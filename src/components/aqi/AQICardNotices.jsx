// src/components/aqi/AQICardNotices.jsx
import { AlertTriangle, Info, RefreshCw } from 'lucide-react';

/**
 * Renders warning or notice banners when serving cached fallback or simulation mock data.
 */
export default function AQICardNotices({ aqiData, loading = false, onRefresh }) {
  return (
    <>
      {/* Persistent Cache Stale Notice */}
      {aqiData?.isStaleLive && aqiData?.liveNotice && (
        <div className="mt-3 p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <span>{aqiData.liveNotice}</span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/60 dark:hover:bg-sky-800 text-sky-900 dark:text-sky-200 transition-colors shrink-0 cursor-pointer"
          >
            Retry Live
          </button>
        </div>
      )}

      {/* Simulation Mode Banner with Short Reason and Retry Button */}
      {aqiData?.isMock && (
        <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold">Simulation Mode (Sample Data): </span>
              <span>
                {aqiData.simulationReason ||
                  'Live telemetry temporarily unavailable from upstream.'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 active:scale-95 text-white transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Retry Live Data</span>
          </button>
        </div>
      )}
    </>
  );
}
