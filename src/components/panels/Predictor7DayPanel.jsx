// src/components/panels/Predictor7DayPanel.jsx
// 7-Day AQI Predictor Feature Box & Expanded Modal using CPCB National AQI (0-500)
import { useState, useRef } from 'react';
import { Calendar, MessageSquare } from 'lucide-react';
import ExpandablePanelModal from '../ExpandablePanelModal';
import PanelCitySearch from '../PanelCitySearch';
import { useChat } from '../../context/ChatContext';
import PredictorFeatureCard from './PredictorFeatureCard';
import PredictorTrendChart from './PredictorTrendChart';
import Predictor3hIntervals from './Predictor3hIntervals';

// Re-export public badge components for external panel consumers
export { CategoryBadge } from './PredictorBadges';

/**
 * 7-Day AQI Predictor feature card and modal outlook panel based on CAMS atmospheric models.
 */
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
      <PredictorFeatureCard
        cardRef={cardRef}
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        days={days}
      />

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
        <PanelCitySearch
          currentLocation={location}
          onCitySelect={onCitySelect}
          onUseMyLocation={onUseMyLocation}
          geoLoading={geoLoading}
          geoError={geoError}
        />

        <PredictorTrendChart
          days={days}
          selectedDayIndex={selectedDayIndex}
          onSelectDay={setSelectedDayIndex}
        />

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

        <Predictor3hIntervals selectedDay={selectedDay} />

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
