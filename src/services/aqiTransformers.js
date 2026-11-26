/**
 * @fileoverview Caching, state persistence, data normalization, and fallback transformers for AQI telemetry.
 */

import { getAQICategory } from '../../shared/aqi.js';

export const clientAqiCache = new Map();
export const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000;
const clientLastGoodLiveCache = new Map();
const CLIENT_LIVE_CACHE_TTL_MS = 3 * 60 * 60 * 1000;

const DEFAULT_SIMULATED_AQI = 165;
export const MAX_ALLOWED_GRID_DISTANCE_KM = 60;
export const KOLKATA_LATITUDE = 22.5726;
export const KOLKATA_LONGITUDE = 88.3639;
export const COORDINATE_TOLERANCE = 0.01;
const STORAGE_SELECTED_CITY_KEY = 'foggy_selected_city';
const STORAGE_LIVE_CACHE_PREFIX = 'foggy_last_live_';

export const PRESET_CITY_COORDINATES = Object.freeze({
  kolkata: { name: 'Kolkata', country: 'India', admin1: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  delhi: { name: 'Delhi', country: 'India', admin1: 'Delhi', lat: 28.6139, lon: 77.209 },
  mumbai: { name: 'Mumbai', country: 'India', admin1: 'Maharashtra', lat: 19.076, lon: 72.8777 },
  chennai: { name: 'Chennai', country: 'India', admin1: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  bengaluru: {
    name: 'Bengaluru',
    country: 'India',
    admin1: 'Karnataka',
    lat: 12.9716,
    lon: 77.5946
  },
  hyderabad: {
    name: 'Hyderabad',
    country: 'India',
    admin1: 'Telangana',
    lat: 17.385,
    lon: 78.4867
  },
  ahmedabad: { name: 'Ahmedabad', country: 'India', admin1: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  pune: { name: 'Pune', country: 'India', admin1: 'Maharashtra', lat: 18.5204, lon: 73.8567 }
});

export const DEFAULT_CITY = PRESET_CITY_COORDINATES.kolkata;

export function getClientAqiCacheKey(lat, lon, type = 'aqi') {
  if (lat == null || lon == null || isNaN(Number(lat)) || isNaN(Number(lon))) return null;
  return `${type}_${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`;
}

export function clearClientAqiCache() {
  clientAqiCache.clear();
}

export function clearClientLastGoodLiveCache() {
  clientLastGoodLiveCache.clear();
  try {
    if (typeof localStorage !== 'undefined') {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_LIVE_CACHE_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    }
  } catch {}
}

export function saveClientLastGoodLive(lat, lon, data) {
  if (lat == null || lon == null || !data || data.isMock) return;
  const key = `${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`;
  const entry = { data: JSON.parse(JSON.stringify(data)), savedAt: Date.now() };
  clientLastGoodLiveCache.set(key, entry);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${STORAGE_LIVE_CACHE_PREFIX}${key}`, JSON.stringify(entry));
    }
  } catch {}
}

export function getClientLastGoodLive(lat, lon, maxAgeMs = CLIENT_LIVE_CACHE_TTL_MS) {
  if (lat == null || lon == null) return null;
  const key = `${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`;
  let entry = clientLastGoodLiveCache.get(key);

  if (!entry) {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(`${STORAGE_LIVE_CACHE_PREFIX}${key}`);
        if (raw) {
          entry = JSON.parse(raw);
          if (entry?.data) clientLastGoodLiveCache.set(key, entry);
        }
      }
    } catch {}
  }

  if (entry && Date.now() - entry.savedAt <= maxAgeMs) {
    const copy = JSON.parse(JSON.stringify(entry.data));
    copy.isStaleLive = true;
    copy.isMock = false;
    copy.source = 'Live Open-Meteo CAMS Model (Cached)';
    copy.liveNotice = `Live data temporarily unavailable from upstream. Showing last verified reading from ${copy.updatedAt || 'earlier'}.`;
    return copy;
  }
  return null;
}

export function getStoredCity() {
  try {
    const raw = localStorage.getItem(STORAGE_SELECTED_CITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.name && parsed?.lat && parsed?.lon) {
        if (
          parsed.name.toLowerCase() !== 'kolkata' &&
          Math.abs(Number(parsed.lat) - KOLKATA_LATITUDE) < COORDINATE_TOLERANCE &&
          Math.abs(Number(parsed.lon) - KOLKATA_LONGITUDE) < COORDINATE_TOLERANCE
        ) {
          localStorage.removeItem(STORAGE_SELECTED_CITY_KEY);
          return DEFAULT_CITY;
        }
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CITY;
}

export function setStoredCity(cityObj) {
  try {
    if (cityObj?.name) {
      if (
        cityObj.name.toLowerCase() !== 'kolkata' &&
        cityObj.lat != null &&
        cityObj.lon != null &&
        Math.abs(Number(cityObj.lat) - KOLKATA_LATITUDE) < COORDINATE_TOLERANCE &&
        Math.abs(Number(cityObj.lon) - KOLKATA_LONGITUDE) < COORDINATE_TOLERANCE
      )
        return;
      localStorage.setItem(STORAGE_SELECTED_CITY_KEY, JSON.stringify(cityObj));
    }
  } catch {}
}

export function normalizeAqiParams(params = {}, legacyLat = null, legacyLon = null) {
  if (typeof params === 'string') {
    return {
      cityName: params,
      lat: legacyLat,
      lon: legacyLon,
      stateName: '',
      signal: null,
      bypassCache: false
    };
  }
  return {
    lat: params.lat ?? params.latitude ?? null,
    lon: params.lon ?? params.longitude ?? null,
    cityName: params.cityName || params.city || params.name || '',
    stateName: params.stateName || params.state || params.admin1 || '',
    signal: params.signal || null,
    bypassCache: Boolean(params.bypassCache)
  };
}

export function buildFallbackAqiPayload(cleanCity, numLat, numLon, err) {
  const seed = Math.abs(Math.sin((numLat || 22.57) * 12.9898 + (numLon || 88.36) * 78.233)) * 1000;
  const pm25 = Math.round((25 + (seed % 110)) * 10) / 10;
  const pm10 = Math.round((pm25 * 1.55 + (seed % 35)) * 10) / 10;
  const temp = Math.round(18 + (seed % 14));
  const humidity = Math.round(40 + (seed % 42));
  const windSpeed = Math.round((2.0 + (seed % 7)) * 10) / 10;
  const cat = getAQICategory(DEFAULT_SIMULATED_AQI);

  let clientSafeReason = 'Upstream service temporarily unavailable';
  const msg = err?.message?.toLowerCase() || '';
  if (err?.name === 'TimeoutError' || msg.includes('timeout'))
    clientSafeReason = 'Upstream request timeout';
  else if (msg.includes('429')) clientSafeReason = 'Upstream rate limit (HTTP 429)';
  else if (msg.includes('500') || msg.includes('502') || msg.includes('503'))
    clientSafeReason = 'Upstream server error (HTTP 5xx)';
  else if (msg.includes('network') || msg.includes('failed to fetch'))
    clientSafeReason = 'Upstream network connection error';

  const latFixed = numLat != null ? Number(numLat.toFixed(2)) : 22.57;
  const lonFixed = numLon != null ? Number(numLon.toFixed(2)) : 88.36;

  return {
    city: cleanCity,
    requestedCoords: { lat: latFixed, lon: lonFixed },
    aqi: DEFAULT_SIMULATED_AQI,
    scale: 'CPCB National AQI (0-500) (Simulated)',
    standard: 'Estimated NAQI (from PM2.5 and PM10)',
    category: cat.name,
    color: cat.color,
    badgeClass: cat.badgeClass,
    healthImpact: cat.healthImpact,
    advisory: cat.advisory,
    dominantPollutant: 'PM2.5',
    pollutants: { pm25, pm10, no2: 44, o3: 32, so2: 12, co: 1.1 },
    weather: { temp, humidity, windSpeed, condition: 'Winter Riverine Inversion Haze' },
    gridPoint: { lat: latFixed, lon: lonFixed },
    latitude: latFixed,
    longitude: lonFixed,
    time: new Date().toISOString(),
    updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    forecastHourly: [],
    isMock: true,
    simulationReason: clientSafeReason,
    source: 'Simulation Mode (Sample data, live data unavailable)',
    attribution:
      'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
    disclaimer:
      'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
    medicalDisclaimer: 'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.'
  };
}

export function buildFallbackTimelinePayload(lat, lon, city) {
  return {
    timezone: 'Asia/Kolkata',
    location: { latitude: lat, longitude: lon, city, country: 'India' },
    scale: 'CPCB National AQI (0-500)',
    standard: 'Estimated NAQI (from PM2.5 and PM10)',
    currentAqi: 165,
    currentHour: '12:00',
    dominantPollutant: 'PM2.5',
    averageAqi24h: 172,
    bestHour24h: { hour: '14:00', aqi: 110 },
    worstHour24h: { hour: '08:00', aqi: 245 },
    cleanestWindowTip:
      'Cleanest window was around 14:00 (Estimated NAQI 110). Safest window for outdoor activity or airing your space.',
    last24Hours: Array.from({ length: 24 }).map((_, i) => {
      const hourStr = `${String(i).padStart(2, '0')}:00`;
      const aqi = Math.round(175 + Math.sin((i - 8) / 3.8) * -50);
      const cat = getAQICategory(aqi);
      return {
        time: `2026-11-18T${hourStr}`,
        hour: hourStr,
        aqi,
        dominant: 'PM2.5',
        pm25: Math.round(aqi * 0.48 * 10) / 10,
        pm10: Math.round(aqi * 0.88 * 10) / 10,
        category: cat.label,
        color: cat.color,
        badgeClass:
          'bg-yellow-100 text-yellow-950 dark:bg-yellow-950/80 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800'
      };
    }),
    forecast7Days: ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map(
      (dayName, idx) => ({
        date: `2026-11-${18 + idx}`,
        dayName: idx === 0 ? 'Today' : dayName,
        shortDay: dayName.slice(0, 3),
        isToday: idx === 0,
        dayIndex: idx,
        averageAqi: 170 - idx * 4,
        minAqi: 110,
        maxAqi: 245,
        dominantCategory: 'Moderate',
        color: '#EAB308',
        intervals3h: ['02:00', '05:00', '08:00', '11:00', '14:00', '17:00', '20:00', '23:00'].map(
          (t) => ({
            time: t,
            aqi: t === '14:00' ? 110 : t === '08:00' ? 245 : 170,
            dominant: 'PM2.5',
            pm25: 75,
            pm10: 130,
            category: t === '14:00' ? 'Moderate' : t === '08:00' ? 'Poor' : 'Moderate',
            color: t === '14:00' ? '#EAB308' : t === '08:00' ? '#F97316' : '#EAB308',
            advice:
              t === '14:00' ? 'Cleanest window for brief outdoor errands' : 'Keep windows closed',
            diffFromAvg: t === '14:00' ? -60 : 0,
            diffText: t === '14:00' ? '-60 vs avg' : 'avg'
          })
        ),
        bestSlot: { time: '14:00', aqi: 110 },
        worstSlot: { time: '08:00', aqi: 245 }
      })
    ),
    attribution:
      'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
    disclaimer:
      'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
    medicalDisclaimer: 'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
    isSample: true,
    source: 'Simulation Mode (Sample data, live data unavailable)'
  };
}
