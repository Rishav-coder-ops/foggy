// src/components/panels/Predictor7DayPanel.jsx
// 7-Day AQI Predictor Feature Box & Expanded Modal using CPCB National AQI (0-500)
import { useState, useRef } from 'react';
import {
  Calendar,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import ExpandablePanelModal from '../ExpandablePanelModal';
import PanelCitySearch from '../PanelCitySearch';
import { useChat } from '../../context/ChatContext';
import { getAQICategory } from '../../../functions/api/aqi-timeline.js';

// CPCB National AQI Badge renderer (Always text + dot, WCAG AA contrast)
export function CategoryBadge({ aqi, categoryName }) {
  const cat = getAQICategory(aqi);
  const name = categoryName || cat.name;

  let badgeStyles =
    'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';

  if (aqi <= 50) {
    // Good (Green)
    badgeStyles =
      'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
  } else if (aqi <= 100) {
    // Satisfactory (Light Green)
    badgeStyles =
      'bg-green-100 text-green-950 dark:bg-green-950/80 dark:text-green-300 border-green-300 dark:border-green-800';
  } else if (aqi <= 200) {
    // Moderate (Yellow)
    badgeStyles =
      'bg-yellow-100 text-yellow-950 dark:bg-yellow-950/80 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800';
  } else if (aqi <= 300) {
    // Poor (Orange)
    badgeStyles =
      'bg-orange-100 text-orange-950 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800';
  } else if (aqi <= 400) {
    // Very Poor (Red)
    badgeStyles =
      'bg-red-100 text-red-950 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800';
  } else {
    // Severe (Maroon)
    badgeStyles =
      'bg-rose-200 text-rose-950 dark:bg-rose-950/90 dark:text-rose-200 border-rose-400 dark:border-rose-800';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badgeStyles}`}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
      <span>{name}</span>
    </span>
  );
}

export function Strip7DayPreview({ days = [] }) {
  if (!days || days.length === 0) {
    return (
      <div className="flex gap-1.5 pt-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-10 rounded-xl bg-[#E2E8F0] dark:bg-[#1E293B] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
      {days.slice(0, 7).map((day, idx) => {
        const cat = getAQICategory(day.averageAqi);
        return (
          <div
            key={idx}
            className="flex-1 min-w-[34px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-between border border-[#CBD5E1] dark:border-[#334155] bg-[#E2E8F0] dark:bg-[#1E293B] transition-transform duration-200 motion-safe:hover:-translate-y-0.5"
            title={`${day.dayName}: Estimated NAQI ${day.averageAqi} (${cat.name})`}
          >
            <span className="text-[10px] font-bold text-[#334155] dark:text-[#CBD5E1]">
              {idx === 0 ? 'Today' : day.shortDay}
            </span>
            <div
              className="w-2.5 h-2.5 my-1 rounded-full shadow-xs shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-[11px] font-extrabold text-[#334155] dark:text-[#F8FAFC]">
              {day.averageAqi}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Predictor7DayPanel({
  timelineData,
  _loading = false,
  location,
  onCitySelect,
  onUseMyLocation,
  geoLoading = false,
  geoError = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const cardRef = useRef(null);
  const { openChat, setInputMessage } = useChat();

  const days = timelineData?.forecast7Days || [];
  const selectedDay = days[selectedDayIndex] || days[0];

  const handleAskFoggy = () => {
    if (!selectedDay) return;
    const promptText = `Can you analyze the CPCB air quality forecast for ${selectedDay.dayName} (${selectedDay.date}) in ${location?.name || 'Kolkata'}? The projected average NAQI is ${selectedDay.averageAqi} (${selectedDay.dominantCategory}), peaking at ${selectedDay.maxAqi} around ${selectedDay.worstSlot?.time} and cleanest at ${selectedDay.bestSlot?.time} (NAQI ${selectedDay.bestSlot?.aqi}). What practical winter smog precautions should my household take?`;

    if (setInputMessage) setInputMessage(promptText);
    if (openChat) openChat();
    setIsOpen(false);
  };

  return (
    <>
      {/* Landing Page Feature Box (Left Box) - Alive with hover, lift, glow, nudge & press feedback */}
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Open 7-Day AQI Predictor panel"
        className="interactive-card rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-3 cursor-pointer group hover:border-sky-400 dark:hover:border-sky-500/60 hover:shadow-glow-ozone focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-300 motion-safe:hover:-translate-y-1.5 motion-safe:active:scale-[0.98] flex flex-col justify-between"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:rotate-3 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              7-Day Atmospheric Model
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            7-Day AQI Predictor
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Multi-day CAMS forecast model tracks incoming atmospheric inversions and weather fronts,
            helping you schedule outdoor activities and commute swaps in advance.
          </p>

          {/* Compact 7-Day Preview Strip */}
          <div className="pt-1">
            <Strip7DayPreview days={days} />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-sky-600 dark:text-sky-400">
          <span>Click to explore 7-day forecast</span>
          <span className="text-slate-400 group-hover:text-sky-500 transition-all duration-300 motion-safe:group-hover:translate-x-1.5">
            →
          </span>
        </div>
      </div>

      {/* Expanded Modal Sheet */}
      <ExpandablePanelModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="7-Day Air Quality Predictor & Forward Outlook"
        subtitle={`Forecasted pollution trends for ${location?.name || 'Kolkata'} with 3-hour interval breakdown (CPCB NAQI)`}
        icon={Calendar}
        triggerRef={cardRef}
        badge={
          timelineData?.isSample ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Simulation Mode
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Open-Meteo CAMS Model (Live)
            </span>
          )
        }
      >
        {/* City Search & Geolocation */}
        <PanelCitySearch
          currentLocation={location}
          onCitySelect={onCitySelect}
          onUseMyLocation={onUseMyLocation}
          geoLoading={geoLoading}
          geoError={geoError}
        />

        {/* 7-Day Trend Overview Spark Chart */}
        <div className="p-4 rounded-2xl bg-[#E2E8F0] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#334155] dark:text-[#F8FAFC] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>7-Day Daily Mean Trajectory (CPCB NAQI)</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono">
              Min: {Math.min(...days.map((d) => d.minAqi || 100), 100)} • Max:{' '}
              {Math.max(...days.map((d) => d.maxAqi || 250), 250)} NAQI
            </span>
          </div>

          <div className="flex items-end gap-2 h-16 pt-2">
            {days.map((day, idx) => {
              const isSelected = idx === selectedDayIndex;
              const cat = getAQICategory(day.averageAqi);
              const heightPct = Math.max(
                20,
                Math.min(100, Math.round((day.averageAqi / 500) * 100))
              );

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex-1 flex flex-col items-center justify-end h-full gap-1 p-1 rounded-xl transition-all duration-200 cursor-pointer motion-safe:hover:-translate-y-0.5 ${
                    isSelected
                      ? 'bg-sky-200/90 dark:bg-sky-950/90 ring-2 ring-sky-500'
                      : 'hover:bg-slate-300/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[9px] font-bold text-[#334155] dark:text-[#F8FAFC]">
                    {day.averageAqi}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: cat.color,
                      opacity: isSelected ? 1 : 0.8
                    }}
                  />
                  <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300">
                    {idx === 0 ? 'Today' : day.shortDay}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-600 dark:text-slate-400 italic pt-1 text-center">
            *Forecast confidence is highest for Today & Tomorrow; accuracy decreases for days
            further ahead as atmospheric dynamics evolve.
          </p>
        </div>

        {/* Selected Day Header & Day Selector Tabs */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {selectedDay?.isToday ? 'Today’s Schedule' : `${selectedDay?.dayName} Outlook`}
                </h3>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  ({selectedDay?.date})
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                Daily Mean:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {selectedDay?.averageAqi} NAQI
                </strong>{' '}
                • Range: {selectedDay?.minAqi} – {selectedDay?.maxAqi} NAQI (
                {selectedDay?.dominantCategory})
              </p>
            </div>

            {/* Ask Foggy Button */}
            <button
              type="button"
              onClick={handleAskFoggy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask Foggy about this forecast</span>
            </button>
          </div>

          {/* Day Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {days.map((day, idx) => {
              const isSelected = idx === selectedDayIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 border-slate-900 dark:border-sky-500 shadow-xs'
                      : 'bg-[#E2E8F0] dark:bg-[#1E293B] text-[#334155] dark:text-[#CBD5E1] border-[#CBD5E1] dark:border-[#334155] hover:bg-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {idx === 0 ? 'Today' : `${day.shortDay} (${day.date.slice(5)})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Hour Interval Breakdown Cards (02:00, 05:00, 08:00, 11:00, 14:00, 17:00, 20:00, 23:00) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>3-Hour Targeted Time Slots</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-normal">
              Compared to daily mean ({selectedDay?.averageAqi} NAQI)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {selectedDay?.intervals3h?.map((slot, idx) => {
              const isBest = selectedDay?.bestSlot?.time === slot.time;
              const isWorst = selectedDay?.worstSlot?.time === slot.time;

              let cardClasses =
                'bg-[#E2E8F0] dark:bg-[#1E293B] border-[#CBD5E1] dark:border-[#334155]';
              let timeClasses = 'text-[#334155] dark:text-[#CBD5E1]';
              let aqiClasses = 'text-[#334155] dark:text-[#F8FAFC]';
              let adviceClasses =
                'text-[#334155] dark:text-[#CBD5E1] border-[#CBD5E1] dark:border-[#334155]';

              if (isBest) {
                cardClasses =
                  'bg-emerald-100/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/40';
                timeClasses = 'text-emerald-950 dark:text-emerald-100';
                aqiClasses = 'text-emerald-950 dark:text-emerald-50';
                adviceClasses =
                  'text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800/80';
              } else if (isWorst) {
                cardClasses =
                  'bg-rose-100/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 ring-2 ring-rose-500/40';
                timeClasses = 'text-rose-950 dark:text-rose-100';
                aqiClasses = 'text-rose-950 dark:text-rose-50';
                adviceClasses =
                  'text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800/80';
              }

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md flex flex-col justify-between space-y-2 shadow-xs ${cardClasses}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-mono font-bold tracking-tight ${timeClasses}`}>
                        {slot.time}
                      </span>
                      {isBest && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 dark:bg-emerald-900/90 dark:text-emerald-100 border border-emerald-400 dark:border-emerald-700">
                          ★ Cleanest
                        </span>
                      )}
                      {isWorst && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-950 dark:bg-rose-900/90 dark:text-rose-100 border border-rose-400 dark:border-rose-700">
                          ▲ Peak Smog
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-2xl font-black tracking-tight ${aqiClasses}`}>
                        {slot.aqi}
                      </span>
                      <CategoryBadge aqi={slot.aqi} categoryName={slot.category} />
                    </div>

                    {/* Comparison with daily average */}
                    <div className="flex items-center gap-1 text-[10px] mt-1.5">
                      {slot.diffFromAvg < 0 ? (
                        <span className="text-emerald-800 dark:text-emerald-400 font-semibold flex items-center">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          {Math.abs(slot.diffFromAvg)} pts cleaner than avg
                        </span>
                      ) : slot.diffFromAvg > 0 ? (
                        <span className="text-rose-800 dark:text-rose-400 font-semibold flex items-center">
                          <ArrowUpRight className="w-3.5 h-3.5" />+{slot.diffFromAvg} pts worse than
                          avg
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center">
                          <Minus className="w-3.5 h-3.5" /> matches daily avg
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`pt-2 border-t text-[11px] leading-snug font-medium ${adviceClasses}`}
                  >
                    {slot.advice}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attribution & Disclaimer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
          <p>
            <strong className="text-slate-800 dark:text-slate-200">Attribution:</strong> Air quality
            data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model
            data.
          </p>
          <p className="italic">
            <strong>Disclaimer:</strong> Estimated from modelled data; official CPCB station
            readings may differ. Check the official CPCB bulletin or the SAMEER app for
            authoritative values.
          </p>
        </div>
      </ExpandablePanelModal>
    </>
  );
}
