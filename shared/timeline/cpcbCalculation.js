// shared/timeline/cpcbCalculation.js
/**
 * @fileoverview CPCB NAQI timeseries and 24-hour rolling average calculations.
 */

import { calculateCPCBNAQI, getAQICategory } from '../aqi.js';

/**
 * Calculates rolling average of previous up to 24 hourly values.
 * @param {Array<number|null>} arr - Hourly concentrations.
 * @param {number} idx - Current index.
 * @returns {number}
 */
function calculateRollingAverage(arr, idx) {
  if (!Array.isArray(arr) || idx < 0 || idx >= arr.length) return 0;
  const start = Math.max(0, idx - 23);
  let sum = 0;
  let count = 0;
  for (let k = start; k <= idx; k++) {
    const val = arr[k];
    if (typeof val === 'number' && !isNaN(val) && val >= 0) {
      sum += val;
      count++;
    }
  }
  return count > 0 ? sum / count : (arr[idx] ?? 0);
}

/**
 * Transforms hourly Open-Meteo arrays into structured CPCB points.
 * @param {string[]} times
 * @param {Array<number|null>} pm25s
 * @param {Array<number|null>} pm10s
 * @returns {Array<object>}
 */
export function buildTimelinePoints(times, pm25s, pm10s) {
  if (!Array.isArray(times) || times.length === 0) return [];

  return times.map((t, i) => {
    const roll25 = calculateRollingAverage(pm25s, i);
    const roll10 = calculateRollingAverage(pm10s, i);
    const naqiRes = calculateCPCBNAQI(roll25, roll10);
    const cat = getAQICategory(naqiRes.aqi);
    const hourStr = t.split('T')[1] || '00:00';

    return {
      time: t,
      date: t.split('T')[0],
      hour: hourStr,
      aqi: naqiRes.aqi,
      dominant: naqiRes.dominant,
      pm25: typeof pm25s?.[i] === 'number' ? Math.round(pm25s[i] * 10) / 10 : null,
      pm10: typeof pm10s?.[i] === 'number' ? Math.round(pm10s[i] * 10) / 10 : null,
      rollingPm25: Math.round(roll25 * 10) / 10,
      rollingPm10: Math.round(roll10 * 10) / 10,
      category: cat.name,
      color: cat.color
    };
  });
}

/**
 * Finds cleanest and peak smog hours in a 24-hour slice.
 * @param {Array<object>} points
 * @returns {{ best: object|null, worst: object|null }}
 */
export function findBestAndWorstHours(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return { best: null, worst: null };
  }
  let best = points[0];
  let worst = points[0];

  for (const pt of points) {
    if (pt.aqi < best.aqi) best = pt;
    if (pt.aqi > worst.aqi) worst = pt;
  }
  return { best, worst };
}

/**
 * Groups hourly points by calendar day and computes daily average NAQI.
 * @param {Array<object>} points
 * @returns {Array<object>}
 */
export function computeDailyAverages(points) {
  if (!Array.isArray(points) || points.length === 0) return [];
  const byDate = new Map();

  for (const pt of points) {
    if (!byDate.has(pt.date)) byDate.set(pt.date, []);
    byDate.get(pt.date).push(pt);
  }

  const days = [];
  for (const [date, dayPoints] of byDate.entries()) {
    const validPoints = dayPoints.filter((p) => typeof p.aqi === 'number' && !isNaN(p.aqi));
    if (validPoints.length === 0) continue;

    const avgAqi = Math.round(validPoints.reduce((acc, p) => acc + p.aqi, 0) / validPoints.length);
    const cat = getAQICategory(avgAqi);
    days.push({
      date,
      aqi: avgAqi,
      category: cat.label || cat.name,
      color: cat.color,
      pointsCount: validPoints.length
    });
  }
  return days;
}
