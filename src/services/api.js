// src/services/api.js
// Client API Service for Foggy communicating with /api/ Endpoints
// Configured with Indian default city (Kolkata) and CPCB National AQI standards

import { auth } from '../firebase';
import { INDIAN_METROS } from '../../shared/timeline/constants.js';
import { getAQICategory } from '../../shared/aqi.js';
import { classifyIntent } from '../../shared/chatIntent/intentClassifier.js';
import {
  generateSmartFallbackResponse,
  validateAndAlignReplyWithAqi
} from '../../shared/chat/responseValidator.js';
import { FOGGY_FALLBACK_MODEL, FOGGY_PROVIDER_LABELS } from '../../shared/constants.js';
import { geocodeIndianCity } from '../../shared/timeline/timelineService.js';
import { calculateDistanceKm } from '../../shared/aqi/upstreamClient.js';

export { INDIAN_METROS };

export const clientAqiCache = new Map();
export const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes client cache

export const clientLastGoodLiveCache = new Map();
export const CLIENT_LIVE_CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours persistent fallback cache

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
        if (k && k.startsWith('foggy_last_live_')) {
          keys.push(k);
        }
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
      localStorage.setItem(`foggy_last_live_${key}`, JSON.stringify(entry));
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
        const raw = localStorage.getItem(`foggy_last_live_${key}`);
        if (raw) {
          entry = JSON.parse(raw);
          if (entry && entry.data) {
            clientLastGoodLiveCache.set(key, entry);
          }
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

export const PRESET_CITY_COORDINATES = {
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
};

export const DEFAULT_CITY = PRESET_CITY_COORDINATES.kolkata;

/**
 * Retrieves the currently saved city object from localStorage.
 * @returns {{ name: string, country: string, admin1: string, lat: number, lon: number }}
 */
export function getStoredCity() {
  try {
    const raw = localStorage.getItem('foggy_selected_city');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name && parsed.lat && parsed.lon) {
        // Detect stale Kolkata coordinates for non-Kolkata cities
        if (
          parsed.name.toLowerCase() !== 'kolkata' &&
          Math.abs(Number(parsed.lat) - 22.5726) < 0.01 &&
          Math.abs(Number(parsed.lon) - 88.3639) < 0.01
        ) {
          localStorage.removeItem('foggy_selected_city');
          return DEFAULT_CITY;
        }
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CITY;
}

/**
 * Persists the chosen city object to localStorage.
 * @param {{ name: string, country?: string, admin1?: string, lat?: number, lon?: number }} cityObj
 */
export function setStoredCity(cityObj) {
  try {
    if (cityObj && cityObj.name) {
      // Ensure we do not save stale Kolkata coordinates for non-Kolkata city
      if (
        cityObj.name.toLowerCase() !== 'kolkata' &&
        cityObj.lat != null &&
        cityObj.lon != null &&
        Math.abs(Number(cityObj.lat) - 22.5726) < 0.01 &&
        Math.abs(Number(cityObj.lon) - 88.3639) < 0.01
      ) {
        // Do not persist corrupt coordinates
        return;
      }
      localStorage.setItem('foggy_selected_city', JSON.stringify(cityObj));
    }
  } catch {}
}

/**
 * Fetches current AQI data and forecasts from /api/aqi with deterministic offline fallback.
 * Uses a single shared signature: fetchAQIData({ lat, lon, cityName, stateName })
 * @param {object|string} [params={}] - Options object { lat, lon, cityName, stateName, signal } or legacy city string
 * @param {number | null} [legacyLat=null] - Backward-compatible legacy latitude
 * @param {number | null} [legacyLon=null] - Backward-compatible legacy longitude
 * @returns {Promise<object>}
 */
export async function fetchAQIData(params = {}, legacyLat = null, legacyLon = null) {
  let lat = null;
  let lon = null;
  let cityName = '';
  let stateName = '';
  let signal = null;
  let bypassCache = false;

  if (typeof params === 'string') {
    cityName = params;
    lat = legacyLat;
    lon = legacyLon;
  } else if (params && typeof params === 'object') {
    lat = params.lat ?? params.latitude ?? null;
    lon = params.lon ?? params.longitude ?? null;
    cityName = params.cityName || params.city || params.name || '';
    stateName = params.stateName || params.state || params.admin1 || '';
    signal = params.signal || null;
    bypassCache = Boolean(params.bypassCache);
  }

  // Detect and purge stale Kolkata coordinates for non-Kolkata cities
  const isCityKolkata = cityName && cityName.toLowerCase().includes('kolkata');
  const hasKolkataCoords =
    lat != null &&
    lon != null &&
    Math.abs(Number(lat) - 22.5726) < 0.01 &&
    Math.abs(Number(lon) - 88.3639) < 0.01;

  if (!isCityKolkata && hasKolkataCoords) {
    lat = null;
    lon = null;
  }

  // 1. Resolve coordinates if missing and cityName is provided
  let resolvedCity = cityName;
  let resolvedState = stateName;
  if ((lat == null || lon == null || isNaN(Number(lat)) || isNaN(Number(lon))) && cityName) {
    const geo = await geocodeIndianCity(stateName ? `${cityName}, ${stateName}` : cityName);
    if (geo && typeof geo.latitude === 'number' && typeof geo.longitude === 'number') {
      lat = geo.latitude;
      lon = geo.longitude;
      resolvedCity = geo.name || cityName;
      if (!resolvedState && geo.admin1) resolvedState = geo.admin1;
    }
  }

  // Default to Kolkata only if no city and no coordinates were provided at all
  if (!resolvedCity && (lat == null || lon == null)) {
    resolvedCity = 'Kolkata';
    resolvedState = 'West Bengal';
    lat = 22.5726;
    lon = 88.3639;
  }

  const cleanCity = resolvedState ? `${resolvedCity}, ${resolvedState}` : resolvedCity;

  // 2. Check client cache keyed by rounded coordinates + 'aqi'
  const cacheKey = getClientAqiCacheKey(lat, lon, 'aqi');
  const now = Date.now();
  if (cacheKey && !bypassCache) {
    const cached = clientAqiCache.get(cacheKey);
    if (cached && now < cached.expiresAt) {
      return cached.data;
    }
  }

  if (import.meta.env?.DEV) {
    console.log('[AQI Service] Requesting AQI with coordinates:', {
      cityName: resolvedCity,
      stateName: resolvedState,
      lat,
      lon
    });
  }

  try {
    let url = `/api/aqi?city=${encodeURIComponent(cleanCity)}`;
    if (lat !== null && lon !== null && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
      const numLat = Number(lat);
      const numLon = Number(lon);
      url += `&lat=${encodeURIComponent(numLat)}&lon=${encodeURIComponent(numLon)}`;
    }

    if (import.meta.env?.DEV) {
      console.log('[AQI Service] Outbound API URL:', url);
    }

    const fetchOptions = {};
    if (signal) {
      fetchOptions.signal = signal;
    }

    const res = await fetch(url, fetchOptions);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      if (errJson.error === 'GRID_MISMATCH' || errJson.error === 'LOCATION_NOT_FOUND') {
        return {
          error: errJson.error,
          message: errJson.message || `Could not load verified air data for ${cleanCity}.`,
          city: cleanCity,
          requestedCoords:
            lat != null && lon != null
              ? { lat: Number(Number(lat).toFixed(2)), lon: Number(Number(lon).toFixed(2)) }
              : null,
          gridPoint: errJson.gridPoint || null
        };
      }
      throw new Error(`Failed to load AQI data (Status ${res.status})`);
    }

    const json = await res.json();

    // If server fell back to sample data, check if we have a recent (within 3 hours) live response saved on client
    if (json.isMock && lat != null && lon != null) {
      const cachedLive = getClientLastGoodLive(lat, lon);
      if (cachedLive) {
        if (cacheKey) {
          clientAqiCache.set(cacheKey, {
            data: cachedLive,
            expiresAt: now + CLIENT_CACHE_TTL_MS
          });
        }
        return cachedLive;
      }
    }

    // 3. Client-side Sanity Guard: Check distance between requested coordinates and returned grid point
    const gridLat = json.gridPoint?.lat ?? json.latitude;
    const gridLon = json.gridPoint?.lon ?? json.longitude;

    if (lat != null && lon != null && gridLat != null && gridLon != null) {
      const dist = calculateDistanceKm(Number(lat), Number(lon), Number(gridLat), Number(gridLon));
      if (dist > 60) {
        console.error(
          `[AQI Sanity Guard] Discarding response: model grid point (${gridLat}, ${gridLon}) is ${dist.toFixed(1)} km from requested (${lat}, ${lon}) which exceeds 60 km limit.`
        );
        return {
          error: 'GRID_MISMATCH',
          message: `Atmospheric model grid point (${Number(gridLat).toFixed(2)}°N, ${Number(gridLon).toFixed(2)}°E) is ${dist.toFixed(1)} km from ${cleanCity}, exceeding the 60 km accuracy boundary.`,
          city: cleanCity,
          requestedCoords: {
            lat: Number(Number(lat).toFixed(2)),
            lon: Number(Number(lon).toFixed(2))
          },
          gridPoint: {
            lat: Number(Number(gridLat).toFixed(2)),
            lon: Number(Number(gridLon).toFixed(2))
          },
          distanceKm: Math.round(dist * 10) / 10
        };
      }
    }

    // Attach requestedCoords
    if (lat != null && lon != null) {
      json.requestedCoords = {
        lat: Number(Number(lat).toFixed(2)),
        lon: Number(Number(lon).toFixed(2))
      };
    }
    if (!json.gridPoint && gridLat != null && gridLon != null) {
      json.gridPoint = {
        lat: Number(Number(gridLat).toFixed(2)),
        lon: Number(Number(gridLon).toFixed(2))
      };
    }

    // Standardize category and badges via getAQICategory
    const officialCat = getAQICategory(json.aqi);
    json.category = officialCat.name;
    json.color = officialCat.color;
    json.badgeClass = officialCat.badgeClass;
    json.healthImpact = officialCat.healthImpact;
    json.advisory = officialCat.advisory;

    if (!json.isMock) {
      saveClientLastGoodLive(lat, lon, json);
    }

    if (cacheKey) {
      clientAqiCache.set(cacheKey, {
        data: json,
        expiresAt: now + CLIENT_CACHE_TTL_MS
      });
    }

    return json;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.warn('AQI fetch error, using safe client fallback:', err);
    if (lat == null || lon == null || isNaN(Number(lat)) || isNaN(Number(lon))) {
      return {
        error: 'LOCATION_NOT_FOUND',
        message: `Could not resolve verified Indian coordinates for '${cleanCity}'. Please check your location.`,
        city: cleanCity
      };
    }

    // Check if we have a valid live reading from within 3 hours
    const cachedLive = getClientLastGoodLive(lat, lon);
    if (cachedLive) {
      if (cacheKey) {
        clientAqiCache.set(cacheKey, {
          data: cachedLive,
          expiresAt: now + CLIENT_CACHE_TTL_MS
        });
      }
      return cachedLive;
    }

    const numLat = Number(lat);
    const numLon = Number(lon);
    const seed = Math.abs(Math.sin(numLat * 12.9898 + numLon * 78.233)) * 1000;
    const pm25 = Math.round((25 + (seed % 110)) * 10) / 10;
    const pm10 = Math.round((pm25 * 1.55 + (seed % 35)) * 10) / 10;
    const temp = Math.round(18 + (seed % 14));
    const humidity = Math.round(40 + (seed % 42));
    const windSpeed = Math.round((2.0 + (seed % 7)) * 10) / 10;
    const cat = getAQICategory(165);

    let clientSafeReason = 'Upstream service temporarily unavailable';
    if (err?.name === 'TimeoutError' || err?.message?.toLowerCase().includes('timeout')) {
      clientSafeReason = 'Upstream request timeout';
    } else if (err?.message?.includes('429')) {
      clientSafeReason = 'Upstream rate limit (HTTP 429)';
    } else if (
      err?.message?.includes('500') ||
      err?.message?.includes('502') ||
      err?.message?.includes('503')
    ) {
      clientSafeReason = 'Upstream server error (HTTP 5xx)';
    } else if (
      err?.message?.toLowerCase().includes('network') ||
      err?.message?.toLowerCase().includes('failed to fetch')
    ) {
      clientSafeReason = 'Upstream network connection error';
    }

    const fallbackPayload = {
      city: cleanCity,
      requestedCoords: {
        lat: Number(numLat.toFixed(2)),
        lon: Number(numLon.toFixed(2))
      },
      aqi: 165,
      scale: 'CPCB National AQI (0-500) (Simulated)',
      standard: 'Estimated NAQI (from PM2.5 and PM10)',
      category: cat.name,
      color: cat.color,
      badgeClass: cat.badgeClass,
      healthImpact: cat.healthImpact,
      advisory: cat.advisory,
      dominantPollutant: 'PM2.5',
      pollutants: { pm25, pm10, no2: 44, o3: 32, so2: 12, co: 1.1 },
      weather: {
        temp,
        humidity,
        windSpeed,
        condition: 'Winter Riverine Inversion Haze'
      },
      gridPoint: {
        lat: Number(numLat.toFixed(2)),
        lon: Number(numLon.toFixed(2))
      },
      latitude: Number(numLat.toFixed(2)),
      longitude: Number(numLon.toFixed(2)),
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

    if (cacheKey) {
      clientAqiCache.set(cacheKey, {
        data: fallbackPayload,
        expiresAt: now + CLIENT_CACHE_TTL_MS
      });
    }

    return fallbackPayload;
  }
}

/**
 * Sends a chat message to /api/chat with dual rate limits, Firebase token auth, and smart offline core fallback.
 * @param {object} params
 * @param {string} params.message
 * @param {Array<object>} [params.history=[]]
 * @param {object} [params.user]
 * @param {object} [params.aqiData]
 * @param {object} [params.profile]
 * @param {object} [params.selectedCity]
 * @returns {Promise<object>}
 */
export async function sendChatMessage({
  message,
  history = [],
  user,
  aqiData,
  profile,
  selectedCity
}) {
  try {
    let idToken = null;
    const activeUser =
      user && typeof user.getIdToken === 'function' ? user : auth && auth.currentUser;
    if (activeUser && typeof activeUser.getIdToken === 'function') {
      try {
        idToken = await activeUser.getIdToken();
      } catch (_err) {
        // Token retrieval failure defaults to anonymous rate limit
      }
    }

    const headers = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const payload = JSON.stringify({
      message,
      history,
      user,
      aqiData,
      profile,
      selectedCity: selectedCity || getStoredCity()
    });

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: payload,
      signal: AbortSignal.timeout(28000)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errObj = new Error(
        errorData.message || errorData.error || `Chat service unavailable (Status ${res.status})`
      );
      if (res.status === 429) {
        errObj.isRateLimited = true;
      }
      throw errObj;
    }

    const data = await res.json();
    if (data && data.reply && aqiData?.aqi != null) {
      data.reply = validateAndAlignReplyWithAqi(data.reply, aqiData.aqi, aqiData.category);
      if (data.memo) {
        data.memo = data.reply;
      }
      if (data.cityData) {
        const cName = (data.cityData.name || '').toLowerCase();
        const aName = (aqiData.city || '').toLowerCase();
        if (cName.includes(aName) || aName.includes(cName)) {
          data.cityData.aqi = aqiData.aqi;
          if (aqiData.category) data.cityData.category = aqiData.category;
          if (aqiData.isMock != null) {
            data.cityData.isMock = Boolean(aqiData.isMock);
            data.isSample = Boolean(aqiData.isMock);
          }
        }
      }
    }
    return data;
  } catch (err) {
    if (err.isRateLimited) {
      return {
        reply: `⚠️ **Rate Limit Notice**\n\n${err.message}\n\n> 💡 *Signed-in users enjoy a higher limit (60 messages/hour). Please sign in or try again shortly.*`,
        extractedFacts: [],
        provider: FOGGY_PROVIDER_LABELS.RATE_LIMITER
      };
    }
    console.warn('Chat request failed, providing supportive client fallback:', err.message);
    const reason =
      err.name === 'TimeoutError' || err.message?.toLowerCase().includes('timeout')
        ? 'AI temporarily unavailable: timeout'
        : err.message?.toLowerCase().includes('network') ||
            err.message?.toLowerCase().includes('failed to fetch')
          ? 'AI temporarily unavailable: network error'
          : err.message || 'AI temporarily unavailable';

    const isFirst =
      !history || history.filter((m) => m.sender === 'user' || m.role === 'user').length <= 1;
    const greetingPrefix = isFirst
      ? `Hello ${user?.displayName || user?.name ? (user.displayName || user.name).split(' ')[0] : 'friend'}! I'm **Foggy**, your air quality guide.\n\n`
      : '';

    const cityAqi = aqiData?.aqi || 165;
    const cat = getAQICategory(cityAqi);
    const detectedIntent = classifyIntent(message, history);

    const fallback = generateSmartFallbackResponse({
      message,
      cityReports: [
        {
          city: aqiData?.city || 'Kolkata',
          current: {
            aqi: cityAqi,
            category: cat.label,
            dominant: aqiData?.dominantPollutant || 'PM2.5',
            time: aqiData?.updatedAt || '14:00 IST'
          },
          bestHour24h: { hour: '14:00', aqi: Math.round(cityAqi * 0.7) },
          worstHour24h: { hour: '07:00', aqi: Math.round(cityAqi * 1.3) }
        }
      ],
      profile,
      intentType: detectedIntent
    });

    let reply = `${greetingPrefix}${fallback.reply}`;
    if (!reply.includes('Safeguards')) {
      reply += `\n\n### 🛡️ Recommended Safeguards:\n* **Indoor Air:** Keep windows sealed during peak smog and run damp-mopping.\n* **Outdoor Transit:** Wear a certified N95 respirator during high-traffic hours.`;
    }
    reply = validateAndAlignReplyWithAqi(reply, cityAqi, cat.label);

    return {
      reply,
      extractedFacts: fallback.extractedFacts || [],
      provider: FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE,
      model: FOGGY_FALLBACK_MODEL,
      isLive: false,
      reason,
      cityData: {
        name: aqiData?.city || 'Kolkata',
        aqi: cityAqi,
        category: cat.label,
        isMock: Boolean(aqiData?.isMock)
      }
    };
  }
}

/**
 * Search autocomplete for Indian cities and districts.
 * @param {string} query
 * @returns {Promise<Array<object>>}
 */
export async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`/api/geocode?name=${encodeURIComponent(query.trim())}&countryCode=IN`);
    if (!res.ok) throw new Error('Geocoding search failed');
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('City search fallback:', err);
    const qLower = query.toLowerCase().trim();
    return Object.values(PRESET_CITY_COORDINATES)
      .filter((c) => c.name.toLowerCase().includes(qLower))
      .map((c) => ({
        name: c.name,
        country: c.country,
        admin1: c.admin1,
        latitude: c.lat,
        longitude: c.lon
      }));
  }
}

/**
 * Geocodes a location query against /api/geocode.
 * Accepts either an options object or string query for robust compatibility.
 * @param {object|string} [options={}] - Query string or options object { name, countryCode, count }
 * @param {string} [maybeCountry='IN'] - Country code if first param is string
 * @returns {Promise<Array<object>>}
 */
export async function geocodeLocation(options = {}, maybeCountry = 'IN') {
  let name = '';
  let countryCode = 'IN';
  let count = 10;

  if (typeof options === 'string') {
    name = options;
    countryCode = typeof maybeCountry === 'string' ? maybeCountry : 'IN';
  } else if (options && typeof options === 'object') {
    name = options.name || options.query || '';
    countryCode = options.countryCode || options.country || 'IN';
    count = options.count || 10;
  }

  const cleanCountry = (countryCode || '').trim().toLowerCase();
  const normalizedCountry =
    cleanCountry === 'india' || cleanCountry === 'in'
      ? 'IN'
      : (countryCode || 'IN').trim().slice(0, 2).toUpperCase();

  if (!name || name.trim().length < 2) return [];
  const params = new URLSearchParams({
    name: name.trim(),
    count: String(count)
  });
  if (normalizedCountry) params.append('countryCode', normalizedCountry);

  const res = await fetch(`/api/geocode?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Geocoding failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.results || [];
}

/**
 * Fetches 24-hour diurnal curve and 7-day predictor timeline.
 * @param {object} [options={}]
 * @param {number} [options.lat=22.5726]
 * @param {number} [options.lon=88.3639]
 * @param {string} [options.city='Kolkata']
 * @returns {Promise<object>}
 */
export async function fetchAQITimeline({ lat = 22.5726, lon = 88.3639, city = 'Kolkata' } = {}) {
  try {
    const res = await fetch(
      `/api/aqi-timeline?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`
    );
    if (!res.ok) throw new Error(`Timeline fetch failed (Status ${res.status})`);
    return await res.json();
  } catch (err) {
    console.warn('AQI timeline fetch failed, using fallback:', err);
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
        const h = i;
        const hourStr = `${String(h).padStart(2, '0')}:00`;
        const aqi = Math.round(175 + Math.sin((h - 8) / 3.8) * -50);
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
      medicalDisclaimer:
        'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
      isSample: true,
      source: 'Simulation Mode (Sample data, live data unavailable)'
    };
  }
}
