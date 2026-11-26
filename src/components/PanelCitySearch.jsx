// src/components/PanelCitySearch.jsx
// City search box with India-biased Geocoding & Browser Geolocation
// Coordinates built-in for Indian Metros so they never depend on search.
import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Loader2, AlertCircle, X } from 'lucide-react';
import { searchCities, INDIAN_METROS, setStoredCity } from '../services/api';

const INDIAN_METRO_PICKS = INDIAN_METROS;

export default function PanelCitySearch({
  currentLocation,
  onCitySelect,
  onUseMyLocation,
  geoLoading = false,
  geoError = null
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Debounced geocoding search biased to India
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchCities(query.trim());
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.warn('City search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    const normalizedItem = {
      name: item.name,
      country: 'India',
      admin1: item.admin1 || '',
      lat: item.latitude !== undefined ? item.latitude : item.lat,
      lon: item.longitude !== undefined ? item.longitude : item.lon
    };
    setStoredCity(normalizedItem);
    onCitySelect(normalizedItem);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const activeName = currentLocation?.name || 'Kolkata';

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span>Active Location:</span>
          <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
            {activeName}
            {currentLocation?.country ? `, ${currentLocation.country}` : ', India'}
          </span>
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono hidden md:inline">
            ({currentLocation?.lat?.toFixed(2) ?? '22.57'}°,{' '}
            {currentLocation?.lon?.toFixed(2) ?? '88.36'}°)
          </span>
        </div>

        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={geoLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-all cursor-pointer disabled:opacity-50"
        >
          {geoLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>{geoLoading ? 'Detecting...' : 'Use my location'}</span>
        </button>
      </div>

      {geoError && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Search Input & Auto-suggest dropdown */}
      <div ref={dropdownRef} className="relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="Search any city in India (e.g., Kolkata, Mumbai, Delhi...)"
            aria-label="Search city"
            className="w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}
          {query && !isSearching && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {isOpen && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 shadow-xl py-1 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {results.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">{item.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] ml-1.5">
                    {[item.admin1, item.country || 'India'].filter(Boolean).join(', ')}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {(item.latitude ?? item.lat)?.toFixed(1)}°,{' '}
                  {(item.longitude ?? item.lon)?.toFixed(1)}°
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Picks: Indian Metros only with built-in coordinates. Kolkata highlighted first */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-600 dark:text-slate-400 scrollbar-none">
        <span className="shrink-0 font-medium mr-0.5">Quick picks:</span>
        {INDIAN_METRO_PICKS.map((c) => {
          const isSelected = activeName.toLowerCase().includes(c.name.toLowerCase());
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => handleSelect(c)}
              className={`px-2 py-0.5 rounded-lg shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-sky-500 text-white font-bold ring-1 ring-sky-400'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
