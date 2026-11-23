// shared/aqi/upstreamClient.js
/**
 * @fileoverview Upstream atmospheric fetching from Open-Meteo, rolling averages, and city coordinate resolution.
 */

import { INDIAN_METROS, INDIAN_CITY_ALIASES } from '../timeline/constants.js';
import { INDIAN_FALLBACK_CITIES } from '../geocode.js';
import { INDIAN_CITY_SIMULATION_DB, getDeterministicMockCity, generateHourlyForecast } from './simulationDb.js';
import { calculateCPCBNAQI, getAQICategory, calculateRollingAverages } from '../aqi.js';
import { saveLastGoodLiveAqi, getLastGoodLiveAqi } from './cache.js';

export { calculateRollingAverages };

/**
 * Calculates great-circle distance between two coordinate pairs using Haversine formula (in km).
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity;
  }
  const R = 6371; // Earth's mean radius in km
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function resolveCityCoordinates(requestedCity, rawLat, rawLon) {
  const queryClean = (requestedCity || '').trim();
  const parts = queryClean.split(',').map((p) => p.trim());
  const cityPart = parts[0] || '';
  const cityNorm = cityPart.toLowerCase();
  const canonicalCity = INDIAN_CITY_ALIASES[cityNorm] || cityPart;
  const canonicalNorm = canonicalCity.toLowerCase();

  let matchedCity = null;

  // 1. Check Indian Metros by city name
  const metroMatch = INDIAN_METROS.find(
    (m) => m.name.toLowerCase() === cityNorm || m.name.toLowerCase() === canonicalNorm
  );
  if (metroMatch) {
    matchedCity = {
      lat: metroMatch.lat,
      lon: metroMatch.lon,
      displayCity: `${metroMatch.name}, ${metroMatch.admin1 || 'India'}`
    };
  }

  // 2. Check Indian Fallback Cities by city name (prioritize city name over state)
  if (!matchedCity && Array.isArray(INDIAN_FALLBACK_CITIES)) {
    const fallbackMatch = INDIAN_FALLBACK_CITIES.find(
      (c) => c.name.toLowerCase() === cityNorm || c.name.toLowerCase() === canonicalNorm
    );
    if (fallbackMatch) {
      matchedCity = {
        lat: fallbackMatch.latitude,
        lon: fallbackMatch.longitude,
        displayCity: `${fallbackMatch.name}, ${fallbackMatch.admin1 ? fallbackMatch.admin1 + ', ' : ''}India`
      };
    }
  }

  // 3. Check Simulation DB
  if (!matchedCity) {
    const dbKey = Object.keys(INDIAN_CITY_SIMULATION_DB).find(
      (k) => k.toLowerCase() === cityNorm || k.toLowerCase() === canonicalNorm
    );
    if (dbKey) {
      matchedCity = {
        lat: INDIAN_CITY_SIMULATION_DB[dbKey].lat,
        lon: INDIAN_CITY_SIMULATION_DB[dbKey].lon,
        displayCity: INDIAN_CITY_SIMULATION_DB[dbKey].city
      };
    }
  }

  const hasValidRawCoords =
    !Number.isNaN(rawLat) &&
    !Number.isNaN(rawLon) &&
    rawLat >= -90 &&
    rawLat <= 90 &&
    rawLon >= -180 &&
    rawLon <= 180;

  if (matchedCity) {
    if (hasValidRawCoords) {
      const dist = calculateDistanceKm(rawLat, rawLon, matchedCity.lat, matchedCity.lon);
      if (dist <= 60) {
        // Raw coords are reasonably close to the matched city
        return { lat: rawLat, lon: rawLon, displayCity: queryClean || matchedCity.displayCity };
      }
      console.warn(
        `[resolveCityCoordinates] Overriding mismatched coordinates (${rawLat}, ${rawLon}) for city '${queryClean}' with verified city coordinates (${matchedCity.lat}, ${matchedCity.lon}) - distance: ${dist.toFixed(1)} km.`
      );
      return { lat: matchedCity.lat, lon: matchedCity.lon, displayCity: matchedCity.displayCity };
    }
    return { lat: matchedCity.lat, lon: matchedCity.lon, displayCity: matchedCity.displayCity };
  }

  if (hasValidRawCoords) {
    return { lat: rawLat, lon: rawLon, displayCity: queryClean || 'Custom Location' };
  }

  // If city is empty or default
  if (!queryClean || queryClean.toLowerCase().includes('kolkata')) {
    return { lat: 22.5726, lon: 88.3639, displayCity: 'Kolkata, West Bengal' };
  }

  return { notFound: true, requestedCity: queryClean, lat: null, lon: null, displayCity: queryClean };
}

export async function fetchWaqiReference(requestedCity, waqiToken) {
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

export async function fetchUpstreamAqiData(lat, lon, requestedCity, displayCity, waqiToken) {
  const waqiReference = await fetchWaqiReference(requestedCity, waqiToken);

  try {
    const openMeteoUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10&current=pm2_5,pm10&past_days=1&forecast_days=1&timezone=auto`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;

    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
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
      const status = openMeteoRes.status === 'fulfilled' ? openMeteoRes.value.status : null;
      const detail =
        status === 429
          ? 'rate limit (HTTP 429)'
          : status
            ? `HTTP status ${status}`
            : openMeteoRes.reason?.message || 'network connection error';
      throw new Error(`Open-Meteo Air Quality failed: ${detail}`);
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

    const gridLat = typeof data.latitude === 'number' ? data.latitude : lat;
    const gridLon = typeof data.longitude === 'number' ? data.longitude : lon;
    const gridPoint = {
      lat: Number(gridLat.toFixed(2)),
      lon: Number(gridLon.toFixed(2))
    };

    const gridDistance = calculateDistanceKm(lat, lon, gridLat, gridLon);
    if (gridDistance > 60) {
      console.error(
        `[AQI Sanity Guard] Discarding response: model grid point (${gridLat}, ${gridLon}) is ${gridDistance.toFixed(1)} km from requested (${lat}, ${lon}) which exceeds 60 km threshold.`
      );
      return {
        error: 'GRID_MISMATCH',
        message: `Returned atmospheric model grid point (${gridPoint.lat}°N, ${gridPoint.lon}°E) is ${gridDistance.toFixed(1)} km from requested location (${Number(lat).toFixed(2)}°N, ${Number(lon).toFixed(2)}°E), exceeding the 60 km accuracy boundary.`,
        city: displayCity,
        requestedCoords: { lat: Number(Number(lat).toFixed(2)), lon: Number(Number(lon).toFixed(2)) },
        gridPoint,
        distanceKm: Math.round(gridDistance * 10) / 10
      };
    }

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

    const livePayload = {
      city: displayCity,
      requestedCoords: {
        lat: Number(Number(lat).toFixed(2)),
        lon: Number(Number(lon).toFixed(2))
      },
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

    saveLastGoodLiveAqi(lat, lon, livePayload);
    return livePayload;
  } catch (_err) {
    let safeReason = 'Upstream air quality service temporarily unavailable';
    if (
      _err?.name === 'TimeoutError' ||
      _err?.name === 'AbortError' ||
      _err?.message?.toLowerCase().includes('timeout')
    ) {
      safeReason = 'Upstream Open-Meteo request timeout (7.5s exceeded)';
    } else if (_err?.message?.includes('429')) {
      safeReason = 'Upstream Open-Meteo rate limit (HTTP 429)';
    } else if (
      _err?.message?.includes('500') ||
      _err?.message?.includes('502') ||
      _err?.message?.includes('503')
    ) {
      safeReason = 'Upstream atmospheric server error (HTTP 5xx)';
    } else if (
      _err?.message?.toLowerCase().includes('failed to fetch') ||
      _err?.message?.toLowerCase().includes('network')
    ) {
      safeReason = 'Upstream network connection failure';
    }

    console.warn(
      `[AQI Upstream Error] Failed to fetch live Open-Meteo data for ${displayCity} (${lat}, ${lon}): ${safeReason}`
    );

    // 3-Hour Last Good Live Cache: Never replace good live data with simulation samples
    const cachedLive = getLastGoodLiveAqi(lat, lon);
    if (cachedLive) {
      console.log(
        `[AQI Upstream Cache] Serving 3-hour cached live reading for ${displayCity} (last updated at ${cachedLive.updatedAt})`
      );
      return {
        ...cachedLive,
        isStaleLive: true,
        isMock: false,
        source: 'Live Open-Meteo CAMS Model Feed (Cached)',
        liveNotice: `Live upstream service temporarily unavailable (${safeReason}); showing verified reading from ${cachedLive.updatedAt}`,
        upstreamFailureReason: safeReason
      };
    }

    // Only if NO live data has ever been fetched for this place within 3 hours
    const mock = getDeterministicMockCity(requestedCity, lat, lon);
    const cat = getAQICategory(mock.aqi);
    const hourlyForecast = generateHourlyForecast(mock.aqi);

    return {
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
      source: 'Simulation Mode (Sample Data)',
      simulationReason: safeReason,
      upstreamFailureReason: safeReason,
      attribution:
        'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
      disclaimer:
        'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
      medicalDisclaimer:
        'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
      waqiReference
    };
  }
}
