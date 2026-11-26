/**
 * @fileoverview Formatter for live and simulation AQI responses.
 */

const DATA_ATTRIBUTION =
  'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data';
const DATA_DISCLAIMER =
  'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.';
const MEDICAL_DISCLAIMER =
  'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.';
const NAQI_SCALE = 'CPCB National AQI (0-500)';
const NAQI_STANDARD = 'Estimated NAQI (from PM2.5 and PM10)';

/**
 * Classifies an upstream failure into a human-readable safe diagnostic reason.
 * @param {Error|any} err
 * @returns {string}
 */
export function determineUpstreamFailureReason(err) {
  if (
    err?.name === 'TimeoutError' ||
    err?.name === 'AbortError' ||
    err?.message?.toLowerCase().includes('timeout')
  ) {
    return 'Upstream Open-Meteo request timeout (7.5s exceeded)';
  }
  if (err?.message?.includes('429')) {
    return 'Upstream Open-Meteo rate limit (HTTP 429)';
  }
  if (
    err?.message?.includes('500') ||
    err?.message?.includes('502') ||
    err?.message?.includes('503')
  ) {
    return 'Upstream atmospheric server error (HTTP 5xx)';
  }
  if (
    err?.message?.toLowerCase().includes('failed to fetch') ||
    err?.message?.toLowerCase().includes('network')
  ) {
    return 'Upstream network connection failure';
  }
  return 'Upstream air quality service temporarily unavailable';
}

/**
 * Builds live AQI response payload.
 * @param {object} params
 * @returns {object}
 */
export function buildLiveAqiPayload({
  displayCity,
  lat,
  lon,
  naqi,
  cat,
  avgPm25,
  avgPm10,
  weather,
  gridPoint,
  rawTime,
  formattedTime,
  hourlyForecast,
  waqiReference
}) {
  return {
    city: displayCity,
    requestedCoords: {
      lat: Number(Number(lat).toFixed(2)),
      lon: Number(Number(lon).toFixed(2))
    },
    aqi: naqi.aqi,
    scale: NAQI_SCALE,
    standard: NAQI_STANDARD,
    category: cat.name,
    color: cat.color,
    badgeClass: cat.badgeClass,
    healthImpact: cat.healthImpact,
    advisory: cat.advisory,
    dominantPollutant: naqi.dominant,
    pollutants: {
      pm25: Math.round(avgPm25 * 10) / 10,
      pm10: Math.round(avgPm10 * 10) / 10,
      no2: Math.round(avgPm25 * 0.42),
      o3: Math.round(avgPm25 * 0.32),
      so2: Math.round(avgPm25 * 0.12),
      co: Math.round(avgPm25 * 0.015 * 10) / 10
    },
    weather,
    gridPoint,
    latitude: gridPoint.lat,
    longitude: gridPoint.lon,
    dataTimestamp: rawTime,
    time: rawTime,
    updatedAt: formattedTime,
    forecastHourly: hourlyForecast,
    isMock: false,
    source: 'Live Open-Meteo CAMS Model Feed',
    attribution: DATA_ATTRIBUTION,
    disclaimer: DATA_DISCLAIMER,
    medicalDisclaimer: MEDICAL_DISCLAIMER,
    waqiReference
  };
}

/**
 * Builds simulation fallback payload when live upstream is unavailable.
 * @param {object} params
 * @returns {object}
 */
export function buildSimulationAqiPayload({
  mock,
  cat,
  hourlyForecast,
  lat,
  lon,
  safeReason,
  waqiReference
}) {
  return {
    city: mock.city,
    aqi: mock.aqi,
    scale: NAQI_SCALE,
    standard: NAQI_STANDARD,
    category: cat.name,
    color: cat.color,
    badgeClass: cat.badgeClass,
    healthImpact: cat.healthImpact,
    advisory: cat.advisory,
    dominantPollutant: mock.dominant || 'PM2.5',
    pollutants: {
      pm25: mock.pm25,
      pm10: mock.pm10,
      no2: mock.no2,
      o3: mock.o3,
      so2: mock.so2,
      co: mock.co
    },
    weather: {
      temp: mock.temp,
      humidity: mock.humidity,
      windSpeed: mock.windSpeed,
      condition: mock.condition
    },
    gridPoint: {
      lat: Number(lat.toFixed(2)),
      lon: Number(lon.toFixed(2))
    },
    latitude: Number(lat.toFixed(2)),
    longitude: Number(lon.toFixed(2)),
    time: new Date().toISOString(),
    updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    forecastHourly: hourlyForecast,
    isMock: true,
    source: 'Simulation Mode (Sample Data)',
    simulationReason: safeReason,
    upstreamFailureReason: safeReason,
    attribution: DATA_ATTRIBUTION,
    disclaimer: DATA_DISCLAIMER,
    medicalDisclaimer: MEDICAL_DISCLAIMER,
    waqiReference
  };
}
