/**
 * @fileoverview Fetches upstream atmospheric readings from Open-Meteo with caching, sanity guards, and simulation fallback.
 */

import { calculateCPCBNAQI, getAQICategory, calculateRollingAverages } from '../aqi.js';
import { getDeterministicMockCity, generateHourlyForecast } from './simulationDb.js';
import { saveLastGoodLiveAqi, getLastGoodLiveAqi } from './cache.js';
import { fetchWaqiReference } from './waqiClient.js';
import { calculateDistanceKm } from './distance.js';
import {
  determineUpstreamFailureReason,
  buildLiveAqiPayload,
  buildSimulationAqiPayload
} from './payloadBuilder.js';
import { logger } from '../logger.js';

const UPSTREAM_TIMEOUT_MS = 7500;
const GRID_ACCURACY_THRESHOLD_KM = 60;

/**
 * Fetches live AQI and meteorology from Open-Meteo with 3-hour fallback caching.
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} requestedCity - User requested city name
 * @param {string} displayCity - Verified display city string
 * @param {string} [waqiToken] - Optional WAQI token
 * @returns {Promise<object>} Complete AQI payload.
 */
export async function fetchUpstreamAqiData(lat, lon, requestedCity, displayCity, waqiToken) {
  const waqiReference = await fetchWaqiReference(requestedCity, waqiToken);

  try {
    const openMeteoUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10&current=pm2_5,pm10&past_days=1&forecast_days=1&timezone=auto`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;

    logger.debug('[API /api/aqi] Outbound Open-Meteo Air Quality URL:', openMeteoUrl);
    logger.debug('[API /api/aqi] Outbound Open-Meteo Weather URL:', weatherUrl);

    const [openMeteoRes, weatherRes] = await Promise.allSettled([
      fetch(openMeteoUrl, {
        headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
      }),
      fetch(weatherUrl, {
        headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
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
    if (gridDistance > GRID_ACCURACY_THRESHOLD_KM) {
      logger.error(
        `[AQI Sanity Guard] Discarding response: model grid point (${gridLat}, ${gridLon}) is ${gridDistance.toFixed(1)} km from requested (${lat}, ${lon}) which exceeds ${GRID_ACCURACY_THRESHOLD_KM} km threshold.`
      );
      return {
        error: 'GRID_MISMATCH',
        message: `Returned atmospheric model grid point (${gridPoint.lat}°N, ${gridPoint.lon}°E) is ${gridDistance.toFixed(1)} km from requested location (${Number(lat).toFixed(2)}°N, ${Number(lon).toFixed(2)}°E), exceeding the 60 km accuracy boundary.`,
        city: displayCity,
        requestedCoords: {
          lat: Number(Number(lat).toFixed(2)),
          lon: Number(Number(lon).toFixed(2))
        },
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

    const livePayload = buildLiveAqiPayload({
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
    });

    saveLastGoodLiveAqi(lat, lon, livePayload);
    return livePayload;
  } catch (_err) {
    const safeReason = determineUpstreamFailureReason(_err);

    logger.warn(
      `[AQI Upstream Error] Failed to fetch live Open-Meteo data for ${displayCity} (${lat}, ${lon}): ${safeReason}`
    );

    // 3-Hour Last Good Live Cache: Never replace good live data with simulation samples
    const cachedLive = getLastGoodLiveAqi(lat, lon);
    if (cachedLive) {
      logger.debug(
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

    return buildSimulationAqiPayload({
      mock,
      cat,
      hourlyForecast,
      lat,
      lon,
      safeReason,
      waqiReference
    });
  }
}
