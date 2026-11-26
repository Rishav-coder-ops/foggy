// src/components/aqi/AQICardHeader.jsx
import { MapPin, RefreshCw } from 'lucide-react';

/**
 * Top header of the AQI card displaying location names, model coordinates,
 * source status (Live/Cached/Simulation), and refresh control.
 */
export default function AQICardHeader({ aqiData, locationTitle, loading = false, onRefresh }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5" />
          <span>Atmospheric Monitoring Station</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
          {locationTitle || aqiData?.city || 'Kolkata, West Bengal'}
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-1.5 leading-relaxed">
          <span>{locationTitle || aqiData?.city || 'Location'}</span>
          {aqiData?.requestedCoords?.lat != null && aqiData?.requestedCoords?.lon != null && (
            <>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span>
                requested {Number(aqiData.requestedCoords.lat).toFixed(2)}N,{' '}
                {Number(aqiData.requestedCoords.lon).toFixed(2)}E
              </span>
            </>
          )}
          {aqiData?.gridPoint?.lat != null && aqiData?.gridPoint?.lon != null ? (
            <>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span>
                grid point {Number(aqiData.gridPoint.lat).toFixed(2)}N,{' '}
                {Number(aqiData.gridPoint.lon).toFixed(2)}E
              </span>
            </>
          ) : aqiData?.latitude != null && aqiData?.longitude != null ? (
            <>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span>
                grid point {Number(aqiData.latitude).toFixed(2)}N,{' '}
                {Number(aqiData.longitude).toFixed(2)}E
              </span>
            </>
          ) : null}
          <span className="text-slate-400 dark:text-slate-500">•</span>
          <span>updated {aqiData?.updatedAt || 'Just now'}</span>
          {aqiData?.dominantPollutant && (
            <>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span>dominant {aqiData.dominantPollutant}</span>
            </>
          )}
        </p>
      </div>

      {/* Source Badge with transparency & Refresh Button */}
      <div className="shrink-0 flex items-center gap-2 self-start md:self-center flex-wrap">
        {aqiData?.isMock ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Simulation Mode (Sample Data)</span>
          </div>
        ) : aqiData?.isStaleLive ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span>Open-Meteo CAMS Model (Cached)</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Open-Meteo CAMS Model (Live)</span>
          </div>
        )}

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Refresh AQI reading"
          aria-label="Refresh AQI reading"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500' : ''}`} />
        </button>
      </div>
    </div>
  );
}
