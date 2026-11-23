// src/components/AQICard.jsx
// Atmospheric Monitoring Station Card using CPCB National AQI Scale (0-500)
import { useState } from 'react';
import { Search, Wind, Thermometer, Droplets, Shield, RefreshCw, MapPin, AlertTriangle } from 'lucide-react';
import { INDIAN_METROS } from '../services/api';
import { getAQICategory } from '../../shared/aqi.js';
import { AQI_CATEGORIES } from '../../shared/constants.js';

const PRESET_CITIES = INDIAN_METROS.map((m) => m.name);

export default function AQICard({
  aqiData,
  onCityChange,
  loading = false,
  onRefresh,
  showSearch = true,
  locationTitle = null
}) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim() && onCityChange) {
      onCityChange(searchInput.trim());
      setSearchInput('');
    }
  };

  const cat = getAQICategory(aqiData?.aqi != null ? aqiData.aqi : aqiData?.category);

  // Error State: Location resolution failure or grid point sanity mismatch (>60km)
  if (aqiData?.error) {
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
                  Measured distance: <strong>{aqiData.distanceKm} km</strong> (exceeds 60 km sanity threshold)
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

  return (
    <div className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark transition-all">
      {/* Top Header: City Selector & Live Source Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Atmospheric Monitoring Station</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
            {locationTitle || aqiData?.city || 'Kolkata, West Bengal'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2">
            <span>
              Place:{' '}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                {locationTitle || aqiData?.city || 'Location'}
              </strong>
            </span>
            {aqiData?.requestedCoords?.lat != null && aqiData?.requestedCoords?.lon != null && (
              <>
                <span>•</span>
                <span>
                  Requested: {Number(aqiData.requestedCoords.lat).toFixed(2)}°N,{' '}
                  {Number(aqiData.requestedCoords.lon).toFixed(2)}°E
                </span>
              </>
            )}
            {aqiData?.gridPoint?.lat != null && aqiData?.gridPoint?.lon != null ? (
              <>
                <span>•</span>
                <span>
                  Grid point: {Number(aqiData.gridPoint.lat).toFixed(2)}°N,{' '}
                  {Number(aqiData.gridPoint.lon).toFixed(2)}°E (Model grid point: {Number(aqiData.gridPoint.lat).toFixed(2)}N, {Number(aqiData.gridPoint.lon).toFixed(2)}E • Updated {aqiData?.updatedAt || 'Just now'})
                </span>
              </>
            ) : aqiData?.latitude != null && aqiData?.longitude != null ? (
              <>
                <span>•</span>
                <span>
                  Grid point: {Number(aqiData.latitude).toFixed(2)}°N,{' '}
                  {Number(aqiData.longitude).toFixed(2)}°E (Model grid point: {Number(aqiData.latitude).toFixed(2)}N, {Number(aqiData.longitude).toFixed(2)}E • Updated {aqiData?.updatedAt || 'Just now'})
                </span>
              </>
            ) : null}
            <span>•</span>
            <span>Updated {aqiData?.updatedAt || 'Just now'}</span>
            <span>•</span>
            <span>
              Dominant Pollutant:{' '}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                {aqiData?.dominantPollutant || 'PM2.5'}
              </strong>
            </span>
          </p>
        </div>

        {/* Source Badge with transparency */}
        <div className="flex items-center gap-2 flex-wrap">
          {aqiData?.isMock ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Simulation Mode (Sample Data)</span>
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
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh AQI reading"
            aria-label="Refresh AQI reading"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* City Search Bar & Indian Metro Quick Picks (Rendered only when showSearch is true) */}
      {showSearch && (
        <div className="mt-4 flex flex-col gap-2.5">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search any city in India (e.g., Kolkata, Mumbai, Delhi...)"
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition-all shadow-xs cursor-pointer"
            >
              Check City
            </button>
          </form>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto sm:flex-wrap pb-1 scrollbar-none">
            <span className="font-medium mr-1 shrink-0">Indian Metros:</span>
            {PRESET_CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCityChange && onCityChange(c)}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
                  aqiData?.city?.toLowerCase().includes(c.toLowerCase())
                    ? 'bg-sky-500 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main AQI Display Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Large Score Card */}
        <div className="lg:col-span-5 rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              National AQI (CPCB Scale)
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border ${cat.badgeClass}`}
            >
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
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                from PM2.5 & PM10
              </span>
            </div>
          </div>

          {/* CPCB NAQI Gradient Spectrum Bar (0 - 500) */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden flex">
              <div
                className="h-full w-[10%]"
                style={{ backgroundColor: AQI_CATEGORIES.GOOD.color }}
                title="Good (0-50)"
              />
              <div
                className="h-full w-[10%]"
                style={{ backgroundColor: AQI_CATEGORIES.SATISFACTORY.color }}
                title="Satisfactory (51-100)"
              />
              <div
                className="h-full w-[20%]"
                style={{ backgroundColor: AQI_CATEGORIES.MODERATE.color }}
                title="Moderate (101-200)"
              />
              <div
                className="h-full w-[20%]"
                style={{ backgroundColor: AQI_CATEGORIES.POOR.color }}
                title="Poor (201-300)"
              />
              <div
                className="h-full w-[20%]"
                style={{ backgroundColor: AQI_CATEGORIES.VERY_POOR.color }}
                title="Very Poor (301-400)"
              />
              <div
                className="h-full w-[20%]"
                style={{ backgroundColor: AQI_CATEGORIES.SEVERE.color }}
                title="Severe (401-500)"
              />
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

        {/* Health Advisory & Key Pollutants */}
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
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                {aqiData.advisory}
              </p>
            )}
          </div>

          {/* Mask Recommendation Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/50 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">😷</span>
              <div>
                <p className="font-bold text-sky-900 dark:text-sky-200">
                  {aqiData?.aqi > 200
                    ? 'Certified N95 / FFP2 Mask Advised Outdoors'
                    : aqiData?.aqi > 100
                      ? 'Mask Recommended for Sensitive Groups'
                      : 'Mask Optional Outdoors'}
                </p>
                <p className="text-sky-700 dark:text-sky-300/80 text-[11px]">
                  Cloth and surgical masks do not block fine PM2.5 particulates.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2 py-1 rounded-md">
              {aqiData?.aqi > 300
                ? 'Mandatory'
                : aqiData?.aqi > 200
                  ? 'Strongly Advised'
                  : aqiData?.aqi > 100
                    ? 'Recommended'
                    : 'Optional'}
            </span>
          </div>

          {/* Pollutant Breakdown Grid */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Key Pollutant Concentrations (24-Hour Average)
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: 'PM2.5', val: aqiData?.pollutants?.pm25, unit: 'µg/m³', limit: 60 },
                { label: 'PM10', val: aqiData?.pollutants?.pm10, unit: 'µg/m³', limit: 100 },
                { label: 'NO2', val: aqiData?.pollutants?.no2, unit: 'µg/m³', limit: 80 },
                { label: 'O3', val: aqiData?.pollutants?.o3, unit: 'µg/m³', limit: 100 },
                { label: 'SO2', val: aqiData?.pollutants?.so2, unit: 'µg/m³', limit: 80 },
                { label: 'CO', val: aqiData?.pollutants?.co, unit: 'mg/m³', limit: 2 }
              ].map((p) => {
                const isOver = p.val > p.limit;
                return (
                  <div
                    key={p.label}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-center"
                  >
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {p.label}
                    </div>
                    <div
                      className={`text-sm font-extrabold mt-0.5 ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}
                    >
                      {p.val ?? '--'}
                    </div>
                    <div className="text-[9px] text-slate-600 dark:text-slate-400">{p.unit}</div>
                  </div>
                );
              })}
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
      </div>
    </div>
  );
}
