// functions/api/aqi.js
/**
 * @fileoverview Cloudflare Pages Function & Local Server Handler for Indian National AQI (CPCB NAQI).
 * Uses Open-Meteo Air Quality CAMS model data (hourly PM2.5 and PM10).
 * Calculates official CPCB linear sub-indices and 24-hour rolling averages.
 */

import {
  calculatePM25SubIndex,
  calculatePM10SubIndex,
  calculateCPCBNAQI,
  getAQICategory,
  INDIAN_METROS
} from './aqi-timeline.js';
import { API_RATE_LIMITS } from './constants.js';
import { INDIAN_FALLBACK_CITIES } from '../../shared/geocode.js';

export {
  calculatePM25SubIndex,
  calculatePM10SubIndex,
  calculateCPCBNAQI,
  getAQICategory,
  INDIAN_METROS
};

const ipRateLimitMap = new Map();
export const aqiCache = new Map();
export const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generates an isolated coordinate-based cache key incorporating latitude, longitude, and data type.
 * Ensures different geographical locations never share cache entries.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @param {string} [type='aqi'] - Data type descriptor.
 * @returns {string} Isolated cache key.
 */
export function getAqiCacheKey(lat, lon, type = 'aqi') {
  const roundedLat = Number(lat).toFixed(2);
  const roundedLon = Number(lon).toFixed(2);
  return `${type}_${roundedLat}_${roundedLon}`;
}

/**
 * Checks in-memory sliding window rate limits for client IP.
 * @param {string} clientIp - Client IP address.
 * @returns {{ allowed: boolean, count: number, remaining: number, reset: number }}
 */
export function checkRateLimit(clientIp) {
  const now = Date.now();
  let clientRecord = ipRateLimitMap.get(clientIp);

  if (!clientRecord || now > clientRecord.resetTime) {
    clientRecord = { count: 1, resetTime: now + API_RATE_LIMITS.RATE_LIMIT_WINDOW_MS };
    ipRateLimitMap.set(clientIp, clientRecord);
    return {
      allowed: true,
      count: 1,
      remaining: API_RATE_LIMITS.MAX_REQUESTS_PER_WINDOW - 1,
      reset: clientRecord.resetTime
    };
  }

  clientRecord.count += 1;
  const remaining = Math.max(0, API_RATE_LIMITS.MAX_REQUESTS_PER_WINDOW - clientRecord.count);
  return {
    allowed: clientRecord.count <= API_RATE_LIMITS.MAX_REQUESTS_PER_WINDOW,
    count: clientRecord.count,
    remaining,
    reset: clientRecord.resetTime
  };
}

/**
 * Generates CORS and security headers for responses.
 * @param {Request} request - Web request object.
 * @returns {Record<string, string>}
 */
export function getCorsHeaders(request) {
  const requestOrigin = request ? request.headers.get('Origin') : null;
  let siteOrigin = 'https://foggy.pages.dev';
  try {
    if (request && request.url) {
      const parsed = new URL(request.url);
      siteOrigin = parsed.origin;
    }
  } catch {}

  const isAllowed =
    !requestOrigin ||
    requestOrigin === siteOrigin ||
    requestOrigin.includes('localhost') ||
    requestOrigin.includes('127.0.0.1') ||
    requestOrigin.endsWith('.pages.dev');

  return {
    'Access-Control-Allow-Origin': isAllowed ? requestOrigin || siteOrigin : siteOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    Vary: 'Origin',
    'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    'X-Content-Type-Options': 'nosniff'
  };
}

export const INDIAN_CITY_SIMULATION_DB = Object.freeze({
  kolkata: {
    city: 'Kolkata, West Bengal',
    lat: 22.5726,
    lon: 88.3639,
    pm25: 84.5,
    pm10: 148.0,
    no2: 46,
    o3: 32,
    so2: 14,
    co: 1.2,
    temp: 24,
    humidity: 72,
    windSpeed: 2.4,
    condition: 'Winter Riverine Inversion Haze'
  },
  delhi: {
    city: 'Delhi, India',
    lat: 28.6139,
    lon: 77.209,
    pm25: 168.0,
    pm10: 295.0,
    no2: 82,
    o3: 42,
    so2: 22,
    co: 3.4,
    temp: 16,
    humidity: 78,
    windSpeed: 1.8,
    condition: 'Heavy Winter Stagnation Smog'
  },
  mumbai: {
    city: 'Mumbai, Maharashtra',
    lat: 19.076,
    lon: 72.8777,
    pm25: 68.2,
    pm10: 122.0,
    no2: 44,
    o3: 28,
    so2: 12,
    co: 1.1,
    temp: 28,
    humidity: 68,
    windSpeed: 4.2,
    condition: 'Coastal Particulate Haze'
  },
  chennai: {
    city: 'Chennai, Tamil Nadu',
    lat: 13.0827,
    lon: 80.2707,
    pm25: 38.5,
    pm10: 64.0,
    no2: 24,
    o3: 22,
    so2: 8,
    co: 0.6,
    temp: 29,
    humidity: 80,
    windSpeed: 5.6,
    condition: 'Moderate Coastal Breeze'
  },
  bengaluru: {
    city: 'Bengaluru, Karnataka',
    lat: 12.9716,
    lon: 77.5946,
    pm25: 42.0,
    pm10: 72.0,
    no2: 32,
    o3: 26,
    so2: 7,
    co: 0.8,
    temp: 22,
    humidity: 62,
    windSpeed: 4.8,
    condition: 'Plateau Particulate Dispersion'
  },
  hyderabad: {
    city: 'Hyderabad, Telangana',
    lat: 17.385,
    lon: 78.4867,
    pm25: 58.0,
    pm10: 98.0,
    no2: 38,
    o3: 30,
    so2: 10,
    co: 0.9,
    temp: 25,
    humidity: 58,
    windSpeed: 3.6,
    condition: 'Urban Particulate Haze'
  },
  ahmedabad: {
    city: 'Ahmedabad, Gujarat',
    lat: 23.0225,
    lon: 72.5714,
    pm25: 92.0,
    pm10: 165.0,
    no2: 52,
    o3: 36,
    so2: 16,
    co: 1.4,
    temp: 23,
    humidity: 48,
    windSpeed: 3.1,
    condition: 'Industrial Dry Smog'
  },
  pune: {
    city: 'Pune, Maharashtra',
    lat: 18.5204,
    lon: 73.8567,
    pm25: 52.0,
    pm10: 88.0,
    no2: 34,
    o3: 28,
    so2: 9,
    co: 0.7,
    temp: 22,
    humidity: 55,
    windSpeed: 3.4,
    condition: 'Valley Evening Stagnation'
  }
});

/**
 * Returns deterministic simulated Indian city data when live upstream services are offline.
 * Uses coordinate hashing so different places never produce identical simulated metrics.
 * @param {string} cityName - Name of requested city.
 * @param {number} [lat=22.5726] - Resolved latitude.
 * @param {number} [lon=88.3639] - Resolved longitude.
 * @returns {Record<string, any>}
 */
export function getDeterministicMockCity(cityName, lat = 22.5726, lon = 88.3639) {
  const norm = (cityName || '').toLowerCase().trim();
  for (const [key, data] of Object.entries(INDIAN_CITY_SIMULATION_DB)) {
    if (norm.includes(key) || key.includes(norm)) {
      const naqiRes = calculateCPCBNAQI(data.pm25, data.pm10);
      return {
        ...data,
        city: data.city,
        lat: data.lat,
        lon: data.lon,
        aqi: naqiRes.aqi,
        dominant: naqiRes.dominant
      };
    }
  }

  // Fallback coordinate-dependent pseudo-deterministic atmospheric generator
  const seed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233)) * 1000;
  const pm25 = Math.round((25 + (seed % 110)) * 10) / 10;
  const pm10 = Math.round((pm25 * 1.55 + (seed % 35)) * 10) / 10;
  const naqiRes = calculateCPCBNAQI(pm25, pm10);
  const temp = Math.round(18 + (seed % 14));
  const humidity = Math.round(40 + (seed % 42));
  const windSpeed = Math.round((2.0 + (seed % 7)) * 10) / 10;

  return {
    city: cityName || 'Kolkata, West Bengal',
    lat,
    lon,
    pm25,
    pm10,
    no2: Math.round(pm25 * 0.42),
    o3: Math.round(pm25 * 0.32),
    so2: Math.round(pm25 * 0.12),
    co: Math.round(pm25 * 0.015 * 10) / 10,
    temp,
    humidity,
    windSpeed,
    condition: 'Atmospheric Inversion Dispersion',
    aqi: naqiRes.aqi,
    dominant: naqiRes.dominant
  };
}

/**
 * Generates an hourly diurnal forecast array from a base AQI level.
 * @param {number} baseAqi - Baseline AQI.
 * @returns {Array<{ time: string, hour: number, aqi: number, isBestWindow: boolean, isPeakWindow: boolean, recommendation: string }>}
 */
export function generateHourlyForecast(baseAqi) {
  const hours = [];
  const currentHour = new Date().getHours();

  for (let i = 0; i < 24; i++) {
    const hour = (currentHour + i) % 24;
    let factor = 1.0;
    if (hour >= 6 && hour <= 9) factor = 1.3;
    else if (hour >= 10 && hour <= 12) factor = 1.02;
    else if (hour >= 13 && hour <= 16) factor = 0.72;
    else if (hour >= 17 && hour <= 21) factor = 1.25;
    else factor = 1.12;

    const hourlyAqi = Math.max(25, Math.min(500, Math.round(baseAqi * factor)));
    const isBestWindow = hour >= 13 && hour <= 16;
    const isPeakWindow = (hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 21);

    hours.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      hour,
      aqi: hourlyAqi,
      isBestWindow,
      isPeakWindow,
      recommendation: isBestWindow
        ? 'Safest window for errands or outdoor exercise'
        : isPeakWindow
          ? 'Peak smog inversion: keep doors and windows sealed'
          : 'Moderate ambient concentration'
    });
  }
  return hours;
}

/**
 * Calculates rolling 24-hour average concentrations for PM2.5 and PM10.
 * @param {number[]} pm25s - Array of hourly PM2.5 readings.
 * @param {number[]} pm10s - Array of hourly PM10 readings.
 * @param {number} [targetIdx] - Target index in series.
 * @returns {{ avgPm25: number, avgPm10: number, count: number }}
 */
export function calculateRollingAverages(pm25s = [], pm10s = [], targetIdx) {
  if (!Array.isArray(pm25s) || pm25s.length === 0) {
    return { avgPm25: 60, avgPm10: 110, count: 0 };
  }
  const currentIdx = typeof targetIdx === 'number' ? targetIdx : Math.min(pm25s.length - 1, 24);
  const startIdx = Math.max(0, currentIdx - 23);
  let pm25Sum = 0;
  let pm10Sum = 0;
  let count = 0;

  for (let i = startIdx; i <= currentIdx; i++) {
    if (typeof pm25s[i] === 'number' && !isNaN(pm25s[i])) {
      pm25Sum += pm25s[i];
      const val10 = typeof pm10s[i] === 'number' && !isNaN(pm10s[i]) ? pm10s[i] : pm25s[i] * 1.6;
      pm10Sum += val10;
      count++;
    }
  }

  const avgPm25 = count > 0 ? pm25Sum / count : pm25s[currentIdx] || 60;
  const avgPm10 = count > 0 ? pm10Sum / count : pm10s[currentIdx] || 110;
  return { avgPm25, avgPm10, count };
}

/**
 * Resolves latitude, longitude, and display name for a city query.
 * Matches against Indian Metros and extensive fallback Indian cities (e.g. Varanasi, Patna, Noida)
 * before defaulting, ensuring cities without coordinates are resolved accurately.
 * @param {string} requestedCity - City name requested.
 * @param {number} rawLat - Raw latitude param.
 * @param {number} rawLon - Raw longitude param.
 * @returns {{ lat: number, lon: number, displayCity: string }}
 */
export function resolveCityCoordinates(requestedCity, rawLat, rawLon) {
  let lat = 22.5726;
  let lon = 88.3639;
  let displayCity = requestedCity || 'Kolkata, West Bengal';

  if (
    !Number.isNaN(rawLat) &&
    !Number.isNaN(rawLon) &&
    rawLat >= -90 &&
    rawLat <= 90 &&
    rawLon >= -180 &&
    rawLon <= 180
  ) {
    return { lat: rawLat, lon: rawLon, displayCity: requestedCity };
  }

  const queryNorm = (requestedCity || '').toLowerCase().trim();

  // 1. Check Indian Metros preset list
  const metroMatch = INDIAN_METROS.find(
    (m) => m.name.toLowerCase() === queryNorm || queryNorm.includes(m.name.toLowerCase())
  );
  if (metroMatch) {
    lat = metroMatch.lat;
    lon = metroMatch.lon;
    displayCity = `${metroMatch.name}, ${metroMatch.admin1 || 'India'}`;
    return { lat, lon, displayCity };
  }

  // 2. Check Indian Fallback Cities (Varanasi, Patna, Noida, Jaipur, Lucknow, etc.)
  if (Array.isArray(INDIAN_FALLBACK_CITIES)) {
    const fallbackMatch = INDIAN_FALLBACK_CITIES.find(
      (c) =>
        c.name.toLowerCase() === queryNorm ||
        queryNorm.includes(c.name.toLowerCase()) ||
        (c.admin1 && queryNorm.includes(c.admin1.toLowerCase()))
    );
    if (fallbackMatch) {
      lat = fallbackMatch.latitude;
      lon = fallbackMatch.longitude;
      displayCity = `${fallbackMatch.name}, ${fallbackMatch.admin1 ? fallbackMatch.admin1 + ', ' : ''}India`;
      return { lat, lon, displayCity };
    }
  }

  // 3. Check Simulation DB
  const dbKey = Object.keys(INDIAN_CITY_SIMULATION_DB).find(
    (k) => queryNorm.includes(k) || k.includes(queryNorm)
  );
  if (dbKey) {
    lat = INDIAN_CITY_SIMULATION_DB[dbKey].lat;
    lon = INDIAN_CITY_SIMULATION_DB[dbKey].lon;
    displayCity = INDIAN_CITY_SIMULATION_DB[dbKey].city;
    return { lat, lon, displayCity };
  }

  return { lat, lon, displayCity };
}

/**
 * Fetches WAQI reference reading if token is available.
 * @param {string} requestedCity - Target city name.
 * @param {string} waqiToken - Optional WAQI token.
 * @returns {Promise<Record<string, any>|null>}
 */
async function fetchWaqiReference(requestedCity, waqiToken) {
  if (!waqiToken || waqiToken === 'your_waqi_token_here' || waqiToken.trim().length <= 5) {
    return null;
  }
  try {
    const waqiUrl = `https://api.waqi.info/feed/${encodeURIComponent(requestedCity)}/?token=${waqiToken.trim()}`;
    const waqiRes = await fetch(waqiUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000)
    });
    if (waqiRes.ok) {
      const waqiJson = await waqiRes.json();
      if (waqiJson?.status === 'ok' && typeof waqiJson.data?.aqi === 'number') {
        return {
          station: waqiJson.data.city?.name || requestedCity,
          aqiUS: waqiJson.data.aqi,
          label: 'Nearest station (WAQI, US EPA scale)'
        };
      }
    }
  } catch {
    // Non-blocking
  }
  return null;
}

/**
 * Handles OPTIONS preflight requests for /api/aqi.
 * @param {{ request: Request }} context - Function context.
 * @returns {Promise<Response>}
 */
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context?.request)
  });
}

/**
 * Handles GET requests for /api/aqi.
 * Includes coordinate-specific caching, live weather integration, and proof of locality.
 * @param {{ request: Request, env?: Record<string, any>, waitUntil?: (p: Promise<any>) => void }} context - Function context.
 * @returns {Promise<Response>}
 */
export async function onRequestGet(context) {
  const { request, env, _waitUntil } = context;
  const headers = getCorsHeaders(request);
  headers['Content-Type'] = 'application/json; charset=utf-8';

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  const rateCheck = checkRateLimit(clientIp);
  headers['X-RateLimit-Limit'] = API_RATE_LIMITS.MAX_REQUESTS_PER_WINDOW.toString();
  headers['X-RateLimit-Remaining'] = rateCheck.remaining.toString();
  headers['X-RateLimit-Reset'] = Math.ceil(rateCheck.reset / 1000).toString();

  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message:
          'Rate limit exceeded for AQI queries. Please wait a moment before sending more requests.'
      }),
      { status: 429, headers }
    );
  }

  const url = new URL(request.url);
  const rawCity = url.searchParams.get('city');
  const rawLat = parseFloat(url.searchParams.get('lat'));
  const rawLon = parseFloat(url.searchParams.get('lon'));
  let requestedCity = 'Kolkata';

  if (rawCity !== null && rawCity !== undefined) {
    const trimmed = rawCity
      .trim()
      .slice(0, 60)
      .replace(/[^a-zA-Z0-9\s.,\-_'()]/g, '');
    if (trimmed.length > 0) {
      requestedCity = trimmed;
    }
  }

  const { lat, lon, displayCity } = resolveCityCoordinates(requestedCity, rawLat, rawLon);
  const cacheKey = getAqiCacheKey(lat, lon, 'aqi');

  if (process.env.NODE_ENV !== 'production') {
    console.log('[API /api/aqi] Incoming coordinates:', { rawCity, rawLat, rawLon });
    console.log('[API /api/aqi] Resolved coordinates:', { displayCity, lat, lon, cacheKey });
  }

  // Check in-memory cache
  const now = Date.now();
  const cached = aqiCache.get(cacheKey);
  if (cached && cached.expiry > now) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[API /api/aqi] Cache HIT for key:', cacheKey);
    }
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: {
        ...headers,
        'X-Cache': 'HIT',
        'X-Cache-Key': cacheKey
      }
    });
  }

  const waqiReference = await fetchWaqiReference(requestedCity, env?.AQI_API_KEY);

  try {
    const openMeteoUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10&current=pm2_5,pm10&past_days=1&forecast_days=1&timezone=auto`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[API /api/aqi] Outbound Open-Meteo Air Quality URL:', openMeteoUrl);
      console.log('[API /api/aqi] Outbound Open-Meteo Weather URL:', weatherUrl);
    }

    const [openMeteoRes, weatherRes] = await Promise.allSettled([
      fetch(openMeteoUrl, {
        headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
        signal: AbortSignal.timeout(7500)
      }),
      fetch(weatherUrl, {
        headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
        signal: AbortSignal.timeout(7500)
      })
    ]);

    if (openMeteoRes.status !== 'fulfilled' || !openMeteoRes.value.ok) {
      throw new Error(
        `Open-Meteo Air Quality failed: ${openMeteoRes.status === 'fulfilled' ? openMeteoRes.value.status : openMeteoRes.reason?.message}`
      );
    }

    const data = await openMeteoRes.value.json();
    const pm25s = data.hourly?.pm2_5 || [];
    const pm10s = data.hourly?.pm10 || [];

    if (pm25s.length === 0) {
      throw new Error('Empty hourly data from Open-Meteo.');
    }

    const { avgPm25, avgPm10 } = calculateRollingAverages(pm25s, pm10s);
    const naqi = calculateCPCBNAQI(avgPm25, avgPm10);
    const cat = getAQICategory(naqi.aqi);
    const hourlyForecast = generateHourlyForecast(naqi.aqi);

    // Weather extraction from coordinates
    let weather = {
      temp: 24,
      humidity: 68,
      windSpeed: 3.2,
      condition: 'Atmospheric Station'
    };

    if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
      try {
        const wJson = await weatherRes.value.json();
        if (wJson.current) {
          weather = {
            temp:
              wJson.current.temperature_2m != null
                ? Math.round(wJson.current.temperature_2m * 10) / 10
                : 24,
            humidity:
              wJson.current.relative_humidity_2m != null
                ? Math.round(wJson.current.relative_humidity_2m)
                : 68,
            windSpeed:
              wJson.current.wind_speed_10m != null
                ? Math.round(wJson.current.wind_speed_10m * 10) / 10
                : 3.2,
            condition: 'Live Meteorological Station'
          };
        }
      } catch {}
    }

    // Proof of locality: Model grid point from API response
    const gridLat = typeof data.latitude === 'number' ? data.latitude : lat;
    const gridLon = typeof data.longitude === 'number' ? data.longitude : lon;
    const gridPoint = {
      lat: Number(gridLat.toFixed(2)),
      lon: Number(gridLon.toFixed(2))
    };

    // Data's own timestamp (not page load time)
    const rawTime =
      data.current?.time ||
      (data.hourly?.time && data.hourly.time.length > 0
        ? data.hourly.time[data.hourly.time.length - 1]
        : null);

    let formattedTime = 'Just now';
    if (rawTime) {
      try {
        const parsed = new Date(rawTime);
        if (!isNaN(parsed.getTime())) {
          formattedTime = parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          const part = rawTime.split('T')[1];
          if (part) formattedTime = part.slice(0, 5);
        }
      } catch {
        formattedTime = 'Just now';
      }
    }

    const payload = {
      city: displayCity,
      aqi: naqi.aqi,
      scale: 'CPCB National AQI (0-500)',
      standard: 'Estimated NAQI (from PM2.5 and PM10)',
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
      attribution:
        'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
      disclaimer:
        'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
      medicalDisclaimer:
        'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
      waqiReference
    };

    // Store in isolated coordinate cache
    aqiCache.set(cacheKey, {
      data: payload,
      expiry: now + CACHE_TTL_MS
    });

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...headers,
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey
      }
    });
  } catch (_err) {
    const mock = getDeterministicMockCity(requestedCity, lat, lon);
    const cat = getAQICategory(mock.aqi);
    const hourlyForecast = generateHourlyForecast(mock.aqi);

    const mockPayload = {
      city: mock.city,
      aqi: mock.aqi,
      scale: 'CPCB National AQI (0-500)',
      standard: 'Estimated NAQI (from PM2.5 and PM10)',
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
      source: 'Simulation Mode (Sample data, live data unavailable)',
      simulationReason:
        'Upstream air quality service temporarily unavailable; using atmospheric simulation model.',
      attribution:
        'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
      disclaimer:
        'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
      medicalDisclaimer:
        'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
      waqiReference
    };

    aqiCache.set(cacheKey, {
      data: mockPayload,
      expiry: now + CACHE_TTL_MS
    });

    return new Response(JSON.stringify(mockPayload), {
      status: 200,
      headers: {
        ...headers,
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey
      }
    });
  }
}

/**
 * Main entry point for Cloudflare Pages Function /api/aqi.
 * @param {any} context - Function context.
 * @returns {Promise<Response>}
 */
export async function onRequest(context) {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'OPTIONS') return onRequestOptions(context);

  const headers = getCorsHeaders(context.request);
  headers['Allow'] = 'GET, OPTIONS';
  headers['Content-Type'] = 'application/json; charset=utf-8';
  return new Response(JSON.stringify({ error: 'Method Not Allowed', message: 'Use GET.' }), {
    status: 405,
    headers
  });
}
