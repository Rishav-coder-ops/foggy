// src/components/AQICard.jsx
import React, { useState } from 'react';
import { Search, Wind, Thermometer, Droplets, Shield, Info, AlertTriangle, RefreshCw, MapPin } from 'lucide-react';

const PRESET_CITIES = [
  'Salt Lake City',
  'New Delhi',
  'Beijing',
  'London',
  'New York',
  'Los Angeles',
  'Lahore',
  'Paris'
];

export default function AQICard({ aqiData, onCityChange, loading = false, onRefresh }) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onCityChange(searchInput.trim());
      setSearchInput('');
    }
  };

  const getAQIRangeIndicator = (aqi) => {
    // Percentage for progress indicator bar (0 - 500 max)
    const pct = Math.min(100, Math.round((aqi / 350) * 100));
    return pct;
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark transition-all">
      {/* Top Header: City Selector & Live Source Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Atmospheric Monitoring Station</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
            {aqiData?.city || 'Salt Lake City'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Updated: {aqiData?.updatedAt || 'Just now'} • Dominant Pollutant: <span className="font-semibold text-slate-700 dark:text-slate-200">{aqiData?.dominantPollutant || 'PM2.5'}</span>
          </p>
        </div>

        {/* Source Badge with transparency */}
        <div className="flex items-center gap-2">
          {aqiData?.isMock ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Simulation Mode (WAQI Free Fallback)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>WAQI Live Sensor Feed</span>
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

      {/* City Search Bar & Quick Picks */}
      <div className="mt-4 flex flex-col gap-2.5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search any global city (e.g., Delhi, Beijing, Salt Lake City, London)..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition-all shadow-xs"
          >
            Check City
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium mr-1">Quick Picks:</span>
          {PRESET_CITIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCityChange(c)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
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

      {/* Main AQI Display Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Large Score Card */}
        <div className="lg:col-span-5 rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Air Quality Index (AQI)
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${aqiData?.badgeClass || 'bg-amber-100 text-amber-800'}`}>
              {aqiData?.category || 'Moderate'}
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-3">
            <span
              className="text-6xl md:text-7xl font-extrabold tracking-tight"
              style={{ color: aqiData?.color || '#D97706' }}
            >
              {aqiData?.aqi ?? 125}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              US AQI Standard
            </span>
          </div>

          {/* AQI Gradient Spectrum Bar */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden flex">
              <div className="h-full w-1/6 bg-emerald-500"></div>
              <div className="h-full w-1/6 bg-amber-400"></div>
              <div className="h-full w-1/6 bg-orange-500"></div>
              <div className="h-full w-1/6 bg-red-500"></div>
              <div className="h-full w-1/6 bg-purple-600"></div>
              <div className="h-full w-1/6 bg-rose-900"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-medium">
              <span>0 (Good)</span>
              <span>100</span>
              <span>200</span>
              <span>300+ (Hazardous)</span>
            </div>
          </div>

          {/* Weather Pill */}
          <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-rose-500" />
              <span>{aqiData?.weather?.temp ?? 8}°C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-500" />
              <span>{aqiData?.weather?.humidity ?? 65}% Hum</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-teal-500" />
              <span>{aqiData?.weather?.windSpeed ?? 4.5} km/h</span>
            </div>
          </div>
        </div>

        {/* Health Advisory & Key Pollutants */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Main Health Advisory Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              <Shield className="w-4 h-4 text-sky-500" />
              <span>Health Guidance for Today</span>
            </div>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {aqiData?.advisory}
            </p>
            {aqiData?.sensitiveGroups && (
              <p className="mt-2 text-xs text-amber-800 dark:text-amber-300/90 font-medium bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/70 dark:border-amber-800/40">
                ⚠️ <strong>Sensitive Groups</strong>: {aqiData.sensitiveGroups}
              </p>
            )}
          </div>

          {/* Mask Recommendation Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/50 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">😷</span>
              <div>
                <p className="font-bold text-sky-900 dark:text-sky-200">
                  {aqiData?.maskRecommended ? 'Mask Recommended Outdoors' : 'Mask Optional Outdoors'}
                </p>
                <p className="text-sky-700 dark:text-sky-300/80 text-[11px]">
                  {aqiData?.maskType || 'Standard clean air conditions today.'}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2 py-1 rounded-md">
              {aqiData?.aqi > 150 ? 'Mandatory' : aqiData?.aqi > 100 ? 'Advised' : 'Optional'}
            </span>
          </div>

          {/* Pollutant Breakdown Grid */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Key Pollutant Concentrations
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: 'PM2.5', val: aqiData?.pollutants?.pm25, unit: 'µg/m³', limit: 35 },
                { label: 'PM10', val: aqiData?.pollutants?.pm10, unit: 'µg/m³', limit: 150 },
                { label: 'NO2', val: aqiData?.pollutants?.no2, unit: 'ppb', limit: 53 },
                { label: 'O3', val: aqiData?.pollutants?.o3, unit: 'ppb', limit: 70 },
                { label: 'SO2', val: aqiData?.pollutants?.so2, unit: 'ppb', limit: 75 },
                { label: 'CO', val: aqiData?.pollutants?.co, unit: 'ppm', limit: 9 }
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
                    <div className={`text-sm font-extrabold mt-0.5 ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {p.val ?? '--'}
                    </div>
                    <div className="text-[9px] text-slate-600 dark:text-slate-400">
                      {p.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
