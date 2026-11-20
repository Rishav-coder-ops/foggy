// src/pages/SearchAQIPage.jsx
// Dedicated Search AQI Page: City Autocomplete (India-first, no quick picks)
// Displays full dashboard-style atmospheric breakdown without changing user's saved location.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, MapPin, Wind, Thermometer, Droplets, RefreshCw,
  Loader2, Shield, AlertTriangle, ArrowRight, Sun, Bus, Flame, ShieldCheck, Check
} from 'lucide-react';
import AQICard from '../components/AQICard';
import HourlyTimeline from '../components/HourlyTimeline';
import ImpactBadge from '../components/ImpactBadge';
import { fetchAQIData, geocodeLocation } from '../services/api';
import { sanitizeText } from '../utils/validation';

export default function SearchAQIPage() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedCity, setSelectedCity] = useState({
    name: 'Kolkata',
    state: 'West Bengal',
    lat: 22.5726,
    lon: 88.3639
  });
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef(null);

  // Load AQI Data for the currently inspected city
  const loadAQI = useCallback(async (cityObj) => {
    setLoading(true);
    const data = await fetchAQIData(cityObj.name, cityObj.lat, cityObj.lon);
    setAqiData(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAQI(selectedCity);
  }, [selectedCity, loadAQI]);

  // Autocomplete search handler
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const cleanQuery = sanitizeText(val, 60);
        const results = await geocodeLocation(cleanQuery, 'India');
        setSuggestions(results || []);
      } catch (err) {
        console.warn('Geocode search error:', err);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  };

  const handleSelectSuggestion = (place) => {
    const newCity = {
      name: place.name,
      state: place.admin1 || place.country || 'India',
      lat: place.latitude,
      lon: place.longitude
    };
    setSelectedCity(newCity);
    setSearchInput('');
    setSuggestions([]);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const clean = sanitizeText(searchInput.trim(), 60);
      setSelectedCity({
        name: clean,
        state: 'India',
        lat: null,
        lon: null
      });
      setSearchInput('');
      setSuggestions([]);
    }
  };

  const locationTitle = selectedCity.state
    ? `${selectedCity.name}, ${selectedCity.state}`
    : selectedCity.name;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <Search className="w-3.5 h-3.5" />
            <span>Pan-India Atmospheric Explorer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            Search Air Quality in Any Indian City
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Explore live CPCB NAQI scores, 24-hour diurnal inversion curves, and health recommendations for any city or district across India without affecting your saved household profile.
          </p>
        </div>

        {/* Autocomplete Input Form (No quick-pick chips) */}
        <div className="relative max-w-2xl">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={handleInputChange}
                placeholder="Search any Indian city, district, or town (e.g. Lucknow, Varanasi, Jaipur, Patna)..."
                className="w-full pl-10 pr-10 py-3 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all shadow-xs"
              />
              {searching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                </div>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-all shadow-sm shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-4 py-3 hover:bg-sky-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1.5">
                        {item.admin1 ? `${item.admin1}, India` : 'India'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main AQI Card (No inner search box or quick-picks) */}
      <AQICard
        aqiData={aqiData}
        loading={loading}
        onRefresh={() => loadAQI(selectedCity)}
        showSearch={false}
        locationTitle={locationTitle}
      />

      {/* 24-Hour Smog Inversion Curve */}
      {aqiData?.forecastHourly && (
        <HourlyTimeline hourlyData={aqiData.forecastHourly} />
      )}

      {/* Low-Emission Daily Routine Plan for Searched City */}
      <div className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Smog Shield Protocol
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5">
              Daily Low-Emission Plan for {selectedCity.name}
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Simulated for {locationTitle} • Live CAMS data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Commute Routine */}
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
              Street-level morning traffic traps diesel exhaust and resuspended road dust. Commuting via Metro or AC bus cuts direct particulate exposure by over 60%.
            </p>
            <ImpactBadge
              co2Saved="~2.4 kg CO2 saved"
              pmReduced="-65% PM2.5 inhaled"
              costTradeoff="~₹180 fuel & parking saved"
            />
          </div>

          {/* Outdoor Activity */}
          <div className="interactive-card rounded-2xl p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
                  <Sun className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Outdoor Timing: Shift Walks to Afternoon Window
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                Safest Window
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Solar radiation breaks the ground thermal inversion lid between 1:00 PM and 3:30 PM, providing the cleanest dispersion window for essential errands.
            </p>
            <ImpactBadge
              healthBenefit="Avoids ground smog spike"
              pmReduced="-35% ground PM2.5"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
