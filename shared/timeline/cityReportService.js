/**
 * @fileoverview Live and simulation atmospheric AQI report generator for Indian cities.
 */

import { getAQICategory } from '../aqi.js';
import { buildTimelinePoints, findBestAndWorstHours } from './cpcbCalculation.js';
import { generateSampleTimelineData } from './sampleFallback.js';
import { geocodeIndianCity } from './cityGeocoding.js';
import { buildSampleCityReport } from './sampleReportBuilder.js';
import { logger } from '../logger.js';

const REPORT_TIMEOUT_MS = 7000;
const DEFAULT_TIMEZONE = 'Asia/Kolkata';
const ONE_DAY_MS = 86400 * 1000;

/**
 * Resolves coordinate target from string or location object.
 * @param {string|object} cityNameOrObj
 * @returns {object|null}
 */
function resolveCityTarget(cityNameOrObj) {
  if (typeof cityNameOrObj === 'string') {
    return null; // needs async geocoding
  }
  if (
    cityNameOrObj &&
    typeof cityNameOrObj.lat === 'number' &&
    typeof cityNameOrObj.lon === 'number'
  ) {
    return {
      name: cityNameOrObj.name || 'Unknown City',
      latitude: cityNameOrObj.lat,
      longitude: cityNameOrObj.lon,
      admin1: cityNameOrObj.admin1 || '',
      country: 'India'
    };
  }
  return { notFound: true };
}

/**
 * Fetches structured city AQI report from Open-Meteo with 7-day hourly curve,
 * 24h average, tonight slot, and tomorrow cleanest/peak windows.
 * Falls back to simulation sample data if upstream is unavailable.
 *
 * @param {string|object} cityNameOrObj - City name string or coordinate object.
 * @param {string} [timeframe='now'] - Active timeframe filter.
 * @returns {Promise<object>} Complete city report.
 */
export async function fetchCityAqiReport(cityNameOrObj, timeframe = 'now') {
  let cityInfo = resolveCityTarget(cityNameOrObj);
  if (!cityInfo && typeof cityNameOrObj === 'string') {
    cityInfo = await geocodeIndianCity(cityNameOrObj);
  }
  if (!cityInfo || cityInfo.notFound) {
    return { found: false, city: typeof cityNameOrObj === 'string' ? cityNameOrObj : 'Unknown' };
  }

  const { name, latitude: lat, longitude: lon, admin1 } = cityInfo;

  try {
    const apiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10&past_days=1&forecast_days=7&timezone=auto`;
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
      signal: AbortSignal.timeout(REPORT_TIMEOUT_MS)
    });

    if (!res.ok) throw new Error(`Open-Meteo responded with status ${res.status}`);
    const data = await res.json();
    const times = data.hourly?.time || [];
    const pm25s = data.hourly?.pm2_5 || [];
    const pm10s = data.hourly?.pm10 || [];

    if (times.length === 0) throw new Error('No hourly data from Open-Meteo');

    const tz = data.timezone || DEFAULT_TIMEZONE;
    const points = buildTimelinePoints(times, pm25s, pm10s);

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz });
    const currentHourInt = parseInt(
      now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }),
      10
    );
    const targetHourStr = `${todayStr}T${String(currentHourInt).padStart(2, '0')}:00`;

    let currentIdx = times.indexOf(targetHourStr);
    if (currentIdx === -1) {
      currentIdx = times.findIndex((t) => t.startsWith(todayStr));
      if (currentIdx === -1) currentIdx = Math.min(36, times.length - 1);
    }

    const currentPoint = points[currentIdx] || points[points.length - 1];

    const start24 = Math.max(0, currentIdx - 12);
    const end24 = Math.min(points.length, start24 + 24);
    const slice24 = points.slice(start24, end24);
    const { best: bestHour24h, worst: worstHour24h } = findBestAndWorstHours(slice24);

    const validAqis = slice24.map((p) => p.aqi).filter((a) => a != null);
    const avg24 =
      validAqis.length > 0
        ? Math.round(validAqis.reduce((a, b) => a + b, 0) / validAqis.length)
        : currentPoint.aqi;

    const tonightSlot =
      points.slice(currentIdx).find((p) => p.hour.startsWith('20:')) || currentPoint;
    const tomorrowStr = new Date(now.getTime() + ONE_DAY_MS).toLocaleDateString('en-CA', {
      timeZone: tz
    });
    const tomorrowPoints = points.filter((p) => p.date === tomorrowStr);
    const tomorrowAqis = tomorrowPoints.map((p) => p.aqi).filter((a) => a != null);
    const tomorrowAvg =
      tomorrowAqis.length > 0
        ? Math.round(tomorrowAqis.reduce((a, b) => a + b, 0) / tomorrowAqis.length)
        : avg24;
    const tomorrowCat = getAQICategory(tomorrowAvg);
    const { best: tomorrowBest, worst: tomorrowWorst } = findBestAndWorstHours(
      tomorrowPoints.length > 0 ? tomorrowPoints : [currentPoint]
    );

    return {
      found: true,
      city: name,
      admin1,
      lat,
      lon,
      country: 'India',
      timeframe,
      current: {
        aqi: currentPoint.aqi,
        category: currentPoint.category,
        dominant: currentPoint.dominant,
        pm25: currentPoint.pm25,
        pm10: currentPoint.pm10,
        rollingPm25: currentPoint.rollingPm25,
        rollingPm10: currentPoint.rollingPm10,
        time: `${currentPoint.hour} IST`,
        hourStr: currentPoint.hour
      },
      averageAqi24h: avg24,
      bestHour24h: {
        hour: bestHour24h?.hour || '14:00',
        aqi: bestHour24h?.aqi || currentPoint.aqi,
        category: bestHour24h?.category || currentPoint.category
      },
      worstHour24h: {
        hour: worstHour24h?.hour || '08:00',
        aqi: worstHour24h?.aqi || currentPoint.aqi,
        category: worstHour24h?.category || currentPoint.category
      },
      tonight: {
        time: `${tonightSlot.hour} IST`,
        aqi: tonightSlot.aqi,
        category: tonightSlot.category,
        dominant: tonightSlot.dominant
      },
      tomorrow: {
        date: tomorrowStr,
        averageAqi: tomorrowAvg,
        category: tomorrowCat.name,
        cleanestSlot: {
          hour: tomorrowBest?.hour || '14:00',
          aqi: tomorrowBest?.aqi || tomorrowAvg,
          category: tomorrowBest?.category || tomorrowCat.name
        },
        peakSlot: {
          hour: tomorrowWorst?.hour || '08:00',
          aqi: tomorrowWorst?.aqi || tomorrowAvg,
          category: tomorrowWorst?.category || tomorrowCat.name
        }
      },
      isSample: false,
      source: 'Open-Meteo CAMS Model (Live Feed)'
    };
  } catch (err) {
    logger.warn(`Live AQI fetch failed for ${name}, using sample generator:`, err.message);
    const sample = generateSampleTimelineData(lat, lon, name);
    return buildSampleCityReport({ sample, name, admin1, lat, lon, timeframe });
  }
}
