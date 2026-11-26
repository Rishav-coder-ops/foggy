// src/components/aqi/AQICitySearchPicker.jsx
import { useState } from 'react';
import { Search } from 'lucide-react';
import { INDIAN_METROS } from '../../services/api';

const PRESET_CITIES = INDIAN_METROS.map((m) => m.name);

/**
 * City search input and Indian metro quick pick pills for the AQICard.
 */
export default function AQICitySearchPicker({ currentCity = '', onCityChange }) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim() && onCityChange) {
      onCityChange(searchInput.trim());
      setSearchInput('');
    }
  };

  return (
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
        {PRESET_CITIES.map((c) => {
          const isSelected = Boolean(currentCity?.toLowerCase().includes(c.toLowerCase()));
          return (
            <button
              key={c}
              type="button"
              onClick={() => onCityChange && onCityChange(c)}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-sky-500 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
