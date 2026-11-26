/**
 * @fileoverview Hourly timeline calculation and 24-hour diurnal curve calculation.
 */

import { getAQICategory } from '../aqi.js';
import { buildTimelinePoints } from './cpcbCalculation.js';
import { generateSampleTimelineData } from './sampleFallback.js';
import { buildForecast7Days } from './forecastBuilder.js';
import { logger } from '../logger.js';

const TIMELINE_TIMEOUT_MS = 8000;
const DEFAULT_TIMEZONE = 'Asia/Kolkata';
const INITIAL_LAST_VALID_AQI = 150;
const MAX_CURRENT_HOUR_IDX = 36;
const HOURS_IN_DAY = 24;
const DEFAULT_SIMULATION_REASON =
  'Upstream atmospheric service temporarily unavailable; using atmospheric simulation model.';

/**
 * Fetches 24-hour rolling curve and 7-day diurnal timeline data.
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} cityName - Canonical city name
 * @returns {Promise<object>} Timeline payload.
 */
export async function fetchTimelineData(lat, lon, cityName) {
  try {
    const apiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10&past_days=1&forecast_days=7&timezone=auto`;
    const upstreamRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
      signal: AbortSignal.timeout(TIMELINE_TIMEOUT_MS)
    });

    if (!upstreamRes.ok) {
      throw new Error(`Open-Meteo responded with status ${upstreamRes.status}`);
    }

    const data = await upstreamRes.json();
    const timezone = data.timezone || DEFAULT_TIMEZONE;
    const times = data.hourly?.time || [];
    const pm25s = data.hourly?.pm2_5 || [];
    const pm10s = data.hourly?.pm10 || [];

    if (times.length === 0) {
      throw new Error('No hourly data returned from Open-Meteo.');
    }

    const points = buildTimelinePoints(times, pm25s, pm10s);

    let latestValidIdx = points.length - 1;
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i].aqi !== null) {
        latestValidIdx = i;
        break;
      }
    }

    const currentHourIdx = Math.min(latestValidIdx, MAX_CURRENT_HOUR_IDX);
    const start24Idx = Math.max(0, currentHourIdx - (HOURS_IN_DAY - 1));
    const last24Slice = points.slice(start24Idx, start24Idx + HOURS_IN_DAY);

    let lastValidAqi = INITIAL_LAST_VALID_AQI;
    const last24Hours = last24Slice.map((p) => {
      if (p.aqi !== null) {
        lastValidAqi = p.aqi;
      } else {
        p.aqi = lastValidAqi;
        const cat = getAQICategory(p.aqi);
        p.category = cat.name;
        p.color = cat.color;
        p.badgeClass = cat.badgeClass;
        p.healthImpact = cat.healthImpact;
      }
      return p;
    });

    const forecast7Days = buildForecast7Days(points);
    const latest = last24Hours[last24Hours.length - 1];
    const all24Aqi = last24Hours.map((h) => h.aqi);
    const avg24 = Math.round(all24Aqi.reduce((a, b) => a + b, 0) / all24Aqi.length);
    let bestHour = last24Hours[0];
    let worstHour = last24Hours[0];
    last24Hours.forEach((h) => {
      if (h.aqi < bestHour.aqi) bestHour = h;
      if (h.aqi > worstHour.aqi) worstHour = h;
    });

    return {
      timezone,
      location: {
        latitude: lat,
        longitude: lon,
        city: cityName,
        country: 'India'
      },
      scale: 'CPCB National AQI (0-500)',
      standard: 'Estimated NAQI (from PM2.5 and PM10)',
      currentAqi: latest.aqi,
      currentHour: latest.hour,
      dominantPollutant: latest.dominant || 'PM2.5',
      averageAqi24h: avg24,
      bestHour24h: { hour: bestHour.hour, aqi: bestHour.aqi },
      worstHour24h: { hour: worstHour.hour, aqi: worstHour.aqi },
      cleanestWindowTip: `Cleanest window was around ${bestHour.hour} (Estimated NAQI ${bestHour.aqi}). Safest window for outdoor activity or airing your space.`,
      last24Hours,
      forecast7Days,
      attribution:
        'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
      disclaimer:
        'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
      medicalDisclaimer:
        'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
      isSample: false,
      source: 'Open-Meteo CAMS Model (Live Feed)'
    };
  } catch (err) {
    logger.warn('Open-Meteo request failed, serving clearly labelled sample data:', err);
    const sampleData = generateSampleTimelineData(lat, lon, cityName);
    sampleData.simulationReason = DEFAULT_SIMULATION_REASON;
    return sampleData;
  }
}
