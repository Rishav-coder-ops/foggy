// src/components/AQICard.jsx
// Atmospheric Monitoring Station Card using CPCB National AQI Scale (0-500)
import { getAQICategory } from '../../shared/aqi.js';
import AQILocationErrorCard from './aqi/AQILocationErrorCard';
import AQICardHeader from './aqi/AQICardHeader';
import AQICardNotices from './aqi/AQICardNotices';
import AQICitySearchPicker from './aqi/AQICitySearchPicker';
import AQIScoreOverview from './aqi/AQIScoreOverview';
import AQIHealthPollutants from './aqi/AQIHealthPollutants';

/**
 * Atmospheric Monitoring Station Card displaying real-time or simulated
 * CPCB National AQI telemetry, weather, mask recommendations, and pollutant breakdown.
 */
export default function AQICard({
  aqiData,
  onCityChange,
  loading = false,
  onRefresh,
  showSearch = true,
  locationTitle = null
}) {
  const cat = getAQICategory(aqiData?.aqi != null ? aqiData.aqi : aqiData?.category);

  // Error State: Location resolution failure or grid point sanity mismatch (>60km)
  if (aqiData?.error) {
    return (
      <AQILocationErrorCard
        aqiData={aqiData}
        locationTitle={locationTitle}
        loading={loading}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <div className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark transition-all">
      <AQICardHeader
        aqiData={aqiData}
        locationTitle={locationTitle}
        loading={loading}
        onRefresh={onRefresh}
      />

      <AQICardNotices aqiData={aqiData} loading={loading} onRefresh={onRefresh} />

      {showSearch && (
        <AQICitySearchPicker currentCity={aqiData?.city || ''} onCityChange={onCityChange} />
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <AQIScoreOverview aqiData={aqiData} cat={cat} />
        <AQIHealthPollutants aqiData={aqiData} />
      </div>
    </div>
  );
}
