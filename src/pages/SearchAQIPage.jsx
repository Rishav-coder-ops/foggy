// src/pages/SearchAQIPage.jsx
// Dedicated Search AQI Page: City Autocomplete (India-first, no quick picks)
// Displays full dashboard-style atmospheric breakdown without changing user's saved location.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import AQICard from '../components/AQICard';
import HourlyTimeline from '../components/HourlyTimeline';
import DailyLowEmissionPlan from '../components/DailyLowEmissionPlan';
import { fetchAQIData, geocodeLocation } from '../services/api';
import { sanitizeText } from '../utils/validation';

export default function SearchAQIPage() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedCity, setSelectedCity] = useState({
    name: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    lat: 22.5726,
    lon: 88.3639
  });
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load AQI Data for the currently inspected city with race condition protection
  const loadAQI = useCallback(async (cityObj) => {
    if (!cityObj || cityObj.lat == null || cityObj.lon == null) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentRequestId = ++requestIdRef.current;

    // Clear stale data while loading new city
    setAqiData(null);
    setLoading(true);

    if (import.meta.env?.DEV) {
      console.log('[SearchAQIPage] Initiating AQI fetch for canonical city:', cityObj);
    }

    try {
      const data = await fetchAQIData({
        lat: cityObj.lat,
        lon: cityObj.lon,
        cityName: cityObj.name,
        stateName: cityObj.state,
        signal: controller.signal
      });

      // Avoid late out-of-order race conditions
      if (currentRequestId === requestIdRef.current) {
        setAqiData(data);
        setLoading(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.warn('Search AQI fetch error:', err);
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAQI(selectedCity);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedCity, loadAQI]);

  // Autocomplete search handler
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    setSearchError('');

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
        const results = await geocodeLocation(cleanQuery, 'IN');
        if (isMountedRef.current) {
          setSuggestions(results || []);
        }
      } catch (err) {
        console.warn('Geocode search error:', err);
        if (isMountedRef.current) {
          setSuggestions([]);
        }
      } finally {
        if (isMountedRef.current) {
          setSearching(false);
        }
      }
    }, 250);
  };

  const handleSelectSuggestion = (place) => {
    const newCity = {
      name: place.name,
      state: place.admin1 || place.admin2 || '',
      country: place.country || 'India',
      lat: place.latitude,
      lon: place.longitude
    };
    if (import.meta.env?.DEV) {
      console.log('[SearchAQIPage] Selected canonical place:', newCity);
    }
    setSelectedCity(newCity);
    setSearchInput('');
    setSuggestions([]);
    setSearchError('');
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
      return;
    }

    // Auto-resolve typed query using geocode endpoint before fetching
    setSearching(true);
    setSearchError('');
    try {
      const clean = sanitizeText(query, 60);
      const results = await geocodeLocation(clean, 'IN');
      if (results && results.length > 0) {
        handleSelectSuggestion(results[0]);
      } else {
        setSearchError(
          `No matching Indian location found for "${clean}". Please check the spelling or pick from suggestions.`
        );
      }
    } catch (err) {
      console.warn('Geocode manual submit failed:', err);
      setSearchError('Location search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const canonicalParts = [selectedCity.name];
  if (selectedCity.state) canonicalParts.push(selectedCity.state);
  canonicalParts.push(selectedCity.country || 'India');
  const locationTitle = `${canonicalParts.join(', ')} (${selectedCity.lat.toFixed(2)}°N, ${selectedCity.lon.toFixed(2)}°E)`;

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
            Explore live CPCB NAQI scores, 24-hour diurnal inversion curves, and health
            recommendations for any city or district across India without affecting your saved
            household profile.
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

          {searchError && (
            <p className="mt-2 text-xs font-semibold text-rose-500 dark:text-rose-400">
              {searchError}
            </p>
          )}

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
      {aqiData?.forecastHourly && <HourlyTimeline hourlyData={aqiData.forecastHourly} />}

      {/* Low-Emission Daily Routine Plan for Searched City */}
      <div className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
        <DailyLowEmissionPlan
          cityName={selectedCity.name}
          locationTitle={locationTitle}
          isSimulated={true}
        />
      </div>
    </div>
  );
}
