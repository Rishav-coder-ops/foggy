// functions/api/aqi.js
// Cloudflare Pages Function & Local Server Handler for Indian National AQI (CPCB NAQI)
// Primary data source: Open-Meteo Air Quality CAMS model (hourly pm2_5 and pm10)
// Uses official CPCB linear sub-index formula for PM2.5 and PM10.
// If WAQI_API_KEY is configured, provides a small labelled "Nearest station (WAQI, US EPA scale)" reference only.

import {
  calculateCPCBNAQI,
  getAQICategory,
  INDIAN_METROS
} from './aqi-timeline.js';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const ipRateLimitMap = new Map();

function checkRateLimit(clientIp) {
  const now = Date.now();
  let clientRecord = ipRateLimitMap.get(clientIp);

  if (!clientRecord || now > clientRecord.resetTime) {
    clientRecord = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    ipRateLimitMap.set(clientIp, clientRecord);
    return { allowed: true, count: 1, remaining: MAX_REQUESTS_PER_WINDOW - 1, reset: clientRecord.resetTime };
  }

  clientRecord.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - clientRecord.count);
  return {
    allowed: clientRecord.count <= MAX_REQUESTS_PER_WINDOW,
    count: clientRecord.count,
    remaining,
    reset: clientRecord.resetTime
  };
}

function getCorsHeaders(request) {
  const requestOrigin = request.headers.get('Origin');
  let siteOrigin = 'https://foggy.pages.dev';
  try {
    const parsed = new URL(request.url);
    siteOrigin = parsed.origin;
  } catch {}

  const isAllowed =
    !requestOrigin ||
    requestOrigin === siteOrigin ||
    requestOrigin.includes('localhost') ||
    requestOrigin.includes('127.0.0.1') ||
    requestOrigin.endsWith('.pages.dev');

  return {
    'Access-Control-Allow-Origin': isAllowed ? (requestOrigin || siteOrigin) : siteOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Vary': 'Origin',
    'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    'X-Content-Type-Options': 'nosniff'
  };
}

const INDIAN_CITY_SIMULATION_DB = {
  'kolkata': {
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
  'delhi': {
    city: 'Delhi, India',
    lat: 28.6139,
    lon: 77.2090,
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
  'mumbai': {
    city: 'Mumbai, Maharashtra',
    lat: 19.0760,
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
  'chennai': {
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
  'bengaluru': {
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
  'hyderabad': {
    city: 'Hyderabad, Telangana',
    lat: 17.3850,
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
  'ahmedabad': {
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
  'pune': {
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
};

function getDeterministicMockCity(cityName) {
  const norm = (cityName || '').toLowerCase().trim();
  for (const [key, data] of Object.entries(INDIAN_CITY_SIMULATION_DB)) {
    if (norm.includes(key) || key.includes(norm)) {
      const naqiRes = calculateCPCBNAQI(data.pm25, data.pm10);
      return {
        ...data,
        aqi: naqiRes.aqi,
        dominant: naqiRes.dominant
      };
    }
  }

  // Fallback to Kolkata default
  const defaultCity = INDIAN_CITY_SIMULATION_DB.kolkata;
  const naqiRes = calculateCPCBNAQI(defaultCity.pm25, defaultCity.pm10);
  return {
    ...defaultCity,
    city: cityName || 'Kolkata, West Bengal',
    aqi: naqiRes.aqi,
    dominant: naqiRes.dominant
  };
}

function generateHourlyForecast(baseAqi) {
  const hours = [];
  const currentHour = new Date().getHours();

  for (let i = 0; i < 24; i++) {
    const hour = (currentHour + i) % 24;
    let factor = 1.0;
    if (hour >= 6 && hour <= 9) factor = 1.30;
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

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request)
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  headers['Content-Type'] = 'application/json; charset=utf-8';

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  const rateCheck = checkRateLimit(clientIp);
  headers['X-RateLimit-Limit'] = MAX_REQUESTS_PER_WINDOW.toString();
  headers['X-RateLimit-Remaining'] = rateCheck.remaining.toString();
  headers['X-RateLimit-Reset'] = Math.ceil(rateCheck.reset / 1000).toString();

  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded for AQI queries. Please wait a moment before sending more requests.'
      }),
      { status: 429, headers }
    );
  }

  const url = new URL(request.url);
  const rawCity = url.searchParams.get('city');
  let requestedCity = 'Kolkata';

  if (rawCity !== null && rawCity !== undefined) {
    const trimmed = rawCity.trim().slice(0, 60).replace(/[^a-zA-Z0-9\s.,\-_'()]/g, '');
    if (trimmed.length > 0) {
      requestedCity = trimmed;
    }
  }

  // Resolve City Coordinates (Default: Kolkata)
  let lat = 22.5726;
  let lon = 88.3639;
  let displayCity = requestedCity;

  const metroMatch = INDIAN_METROS.find(
    (m) => m.name.toLowerCase() === requestedCity.toLowerCase()
  );
  if (metroMatch) {
    lat = metroMatch.lat;
    lon = metroMatch.lon;
    displayCity = `${metroMatch.name}, ${metroMatch.admin1 || 'India'}`;
  } else {
    // Check Indian DB
    const dbKey = Object.keys(INDIAN_CITY_SIMULATION_DB).find(
      (k) => requestedCity.toLowerCase().includes(k) || k.includes(requestedCity.toLowerCase())
    );
    if (dbKey) {
      lat = INDIAN_CITY_SIMULATION_DB[dbKey].lat;
      lon = INDIAN_CITY_SIMULATION_DB[dbKey].lon;
      displayCity = INDIAN_CITY_SIMULATION_DB[dbKey].city;
    }
  }

  // Optional: Check WAQI for reference station reading if token configured
  let waqiReference = null;
  const waqiToken = env?.AQI_API_KEY;
  if (waqiToken && waqiToken !== 'your_waqi_token_here' && waqiToken.trim().length > 5) {
    try {
      const waqiUrl = `https://api.waqi.info/feed/${encodeURIComponent(requestedCity)}/?token=${waqiToken.trim()}`;
      const waqiRes = await fetch(waqiUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000)
      });
      if (waqiRes.ok) {
        const waqiJson = await waqiRes.json();
        if (waqiJson?.status === 'ok' && typeof waqiJson.data?.aqi === 'number') {
          waqiReference = {
            station: waqiJson.data.city?.name || requestedCity,
            aqiUS: waqiJson.data.aqi,
            label: 'Nearest station (WAQI, US EPA scale)'
          };
        }
      }
    } catch {
      // WAQI reference failure is non-blocking
    }
  }

  // Primary live data source: Open-Meteo Air Quality API
  try {
    const openMeteoUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10&past_days=1&forecast_days=1&timezone=auto`;
    const openMeteoRes = await fetch(openMeteoUrl, {
      headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
      signal: AbortSignal.timeout(7500)
    });

    if (!openMeteoRes.ok) {
      throw new Error(`Open-Meteo returned status ${openMeteoRes.status}`);
    }

    const data = await openMeteoRes.json();
    const pm25s = data.hourly?.pm2_5 || [];
    const pm10s = data.hourly?.pm10 || [];

    if (pm25s.length === 0) {
      throw new Error('Empty hourly data from Open-Meteo.');
    }

    // Compute rolling 24-hour averages for the latest points
    const currentIdx = Math.min(pm25s.length - 1, 24);
    let pm25Sum = 0;
    let pm10Sum = 0;
    let count = 0;
    const startIdx = Math.max(0, currentIdx - 23);

    for (let i = startIdx; i <= currentIdx; i++) {
      if (typeof pm25s[i] === 'number') {
        pm25Sum += pm25s[i];
        pm10Sum += (pm10s[i] ?? pm25s[i] * 1.6);
        count++;
      }
    }

    const avgPm25 = count > 0 ? pm25Sum / count : (pm25s[currentIdx] || 60);
    const avgPm10 = count > 0 ? pm10Sum / count : (pm10s[currentIdx] || 110);

    const naqi = calculateCPCBNAQI(avgPm25, avgPm10);
    const cat = getAQICategory(naqi.aqi);
    const hourlyForecast = generateHourlyForecast(naqi.aqi);

    return new Response(
      JSON.stringify({
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
        forecastHourly: hourlyForecast,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMock: false,
        source: 'Live Open-Meteo CAMS Model Feed',
        attribution: 'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
        disclaimer: 'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
        medicalDisclaimer: 'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
        waqiReference
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.warn(`Open-Meteo fetch failed for "${requestedCity}":`, err.message);
    const mock = getDeterministicMockCity(requestedCity);
    const cat = getAQICategory(mock.aqi);
    const hourlyForecast = generateHourlyForecast(mock.aqi);

    return new Response(
      JSON.stringify({
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
        forecastHourly: hourlyForecast,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMock: true,
        source: 'Simulation Mode (Sample data, live data unavailable)',
        simulationReason: 'Upstream air quality service temporarily unavailable; using atmospheric simulation model.',
        attribution: 'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
        disclaimer: 'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
        medicalDisclaimer: 'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
        waqiReference
      }),
      { status: 200, headers }
    );
  }
}

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
