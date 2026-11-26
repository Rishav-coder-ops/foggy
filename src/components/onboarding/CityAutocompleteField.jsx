/**
 * @fileoverview Reusable city geocoding autocomplete input field with state validation.
 */

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Check, AlertCircle } from 'lucide-react';
import { geocodeLocation } from '../../services/api';
import { statesMatch } from '../../../shared/geocode';

const SEARCH_DEBOUNCE_MS = 350;

/**
 * City geocoding autocomplete component with state consistency validation.
 */
export default function CityAutocompleteField({
  id = 'city',
  label = 'City or Town',
  required = true,
  city = '',
  setCity,
  state = '',
  country = 'India',
  locationObj = null,
  setLocationObj,
  error = null,
  touched = false,
  onBlur,
  inputRef,
  placeholder = 'Type city or town (e.g. Kolkata, Howrah, Delhi)',
  maxLength = 80
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const internalRef = useRef(null);

  useEffect(() => {
    if (!city || city.trim().length < 2) {
      setSuggestions([]);
      setSearchError('');
      return;
    }

    let active = true;
    setIsSearching(true);
    setSearchError('');

    const countryCode = country === 'India' ? 'IN' : '';
    const timer = setTimeout(async () => {
      try {
        const results = await geocodeLocation({
          name: city.trim(),
          countryCode
        });

        if (!active) return;
        setIsSearching(false);

        if (!results || results.length === 0) {
          setSuggestions([]);
          setSearchError(
            `We couldn't find '${city}' in ${state || 'your region'}, ${country}. Check spelling or choose a nearby larger town.`
          );
        } else {
          setSuggestions(results);
          setShowDropdown(true);
        }
      } catch (_err) {
        if (!active) return;
        setIsSearching(false);
        setSearchError('Geocoding service unavailable. Please check your connection and retry.');
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [city, country, state]);

  const handleSelect = (s) => {
    if (state && s.admin1 && !statesMatch(state, s.admin1)) {
      setSearchError(
        `Selected '${s.name}' is in ${s.admin1}, but your state is set to ${state}. Please select a location within ${state}.`
      );
      return;
    }

    setCity(s.name);
    setLocationObj(s);
    setShowDropdown(false);
    setSearchError('');
  };

  return (
    <div className="relative">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          ref={(el) => {
            internalRef.current = el;
            if (typeof inputRef === 'function') inputRef(el);
            else if (inputRef) inputRef.current = el;
          }}
          type="text"
          required={required}
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setLocationObj(null);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          onBlur={() => {
            setTimeout(() => setShowDropdown(false), 250);
            if (onBlur) onBlur();
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete="off"
          aria-invalid={!!(touched && error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 ${
            touched && error
              ? 'border-rose-500 focus:ring-rose-400'
              : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
          }`}
        />
        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        {isSearching && (
          <Loader2 className="w-4 h-4 text-sky-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {locationObj && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <Check className="w-3.5 h-3.5" />
          <span>
            Verified: {locationObj.name}, {locationObj.admin1 || state} (
            {Number(locationObj.latitude).toFixed(2)}°, {Number(locationObj.longitude).toFixed(2)}°)
          </span>
        </div>
      )}

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs">
          {suggestions.map((s) => (
            <button
              key={`${s.id || s.name}-${s.latitude}`}
              type="button"
              onMouseDown={() => handleSelect(s)}
              className="w-full text-left px-3.5 py-2 hover:bg-sky-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-100 flex items-center justify-between cursor-pointer"
            >
              <span>
                <strong className="font-bold">{s.name}</strong>, {s.admin1 || ''} (
                {s.country || country})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {Number(s.latitude).toFixed(2)}, {Number(s.longitude).toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}

      {searchError && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{searchError}</span>
        </p>
      )}

      {touched && error && (
        <p
          id={`${id}-error`}
          className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
