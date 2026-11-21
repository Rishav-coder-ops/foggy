// shared/aqi.js
/**
 * @fileoverview Official Central Pollution Control Board (CPCB) National Air Quality Index (NAQI)
 * mathematical calculations, sub-indices, breakpoint interpolation, rolling averages, and category mapping.
 */

import { CPCB_BREAKPOINTS, AQI_CATEGORIES } from './constants.js';

/**
 * Calculates linear sub-index for a concentration based on breakpoint table.
 * Formula: I = I_low + ((I_high - I_low) / (C_high - C_low)) * (C - C_low)
 *
 * @param {number} concentration - Pollutant concentration.
 * @param {Array<{ cLow: number, cHigh: number, iLow: number, iHigh: number }>} breakpoints - Breakpoint table.
 * @returns {number | null} Sub-index between 0 and 500, or null if invalid.
 */
function interpolateSubIndex(concentration, breakpoints) {
  if (typeof concentration !== 'number' || isNaN(concentration) || concentration < 0) {
    return null;
  }
  const c = Math.min(concentration, 500);

  for (const bp of breakpoints) {
    if (c >= bp.cLow && c <= bp.cHigh) {
      const subIndex = bp.iLow + ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow);
      return Math.round(subIndex);
    }
  }

  // Concentration beyond standard table (capped at 500)
  return 500;
}

/**
 * Calculates CPCB sub-index for PM2.5 (24-hr average in µg/m³).
 * @param {number} pm25 - PM2.5 concentration in µg/m³.
 * @returns {number | null}
 */
export function calculatePM25SubIndex(pm25) {
  return interpolateSubIndex(pm25, CPCB_BREAKPOINTS.pm25);
}

/**
 * Calculates CPCB sub-index for PM10 (24-hr average in µg/m³).
 * @param {number} pm10 - PM10 concentration in µg/m³.
 * @returns {number | null}
 */
export function calculatePM10SubIndex(pm10) {
  return interpolateSubIndex(pm10, CPCB_BREAKPOINTS.pm10);
}

/**
 * Calculates official CPCB NAQI using the highest sub-index rule.
 * CPCB rule requires determining the maximum sub-index across monitored pollutants.
 *
 * @param {number | null | undefined} pm25 - PM2.5 concentration in µg/m³.
 * @param {number | null | undefined} pm10 - PM10 concentration in µg/m³.
 * @returns {{ aqi: number | null, dominant: 'PM2.5' | 'PM10' | null, pm25SubIndex: number | null, pm10SubIndex: number | null }}
 */
export function calculateCPCBNAQI(pm25, pm10) {
  const pm25Sub = calculatePM25SubIndex(pm25);
  const pm10Sub = calculatePM10SubIndex(pm10);

  if (pm25Sub === null && pm10Sub === null) {
    return { aqi: null, dominant: null, pm25SubIndex: null, pm10SubIndex: null };
  }

  if (pm25Sub !== null && pm10Sub !== null) {
    const aqi = Math.max(pm25Sub, pm10Sub);
    const dominant = pm25Sub >= pm10Sub ? 'PM2.5' : 'PM10';
    return { aqi, dominant, pm25SubIndex: pm25Sub, pm10SubIndex: pm10Sub };
  }

  if (pm25Sub !== null) {
    return { aqi: pm25Sub, dominant: 'PM2.5', pm25SubIndex: pm25Sub, pm10SubIndex: null };
  }

  return { aqi: pm10Sub, dominant: 'PM10', pm25SubIndex: null, pm10SubIndex: pm10Sub };
}

/**
 * Maps an AQI number to the corresponding CPCB category and UI colors.
 *
 * @param {number | null | undefined} aqi - AQI numeric value.
 * @returns {{ label: string, color: string, textColor: string, severity: number }}
 */
export function getAQICategory(aqi) {
  if (typeof aqi !== 'number' || isNaN(aqi)) {
    return { label: 'Unknown', color: '#64748b', textColor: '#ffffff', severity: 0 };
  }

  const val = Math.max(0, Math.min(500, Math.round(aqi)));

  if (val <= 50) return { ...AQI_CATEGORIES.GOOD, severity: 1 };
  if (val <= 100) return { ...AQI_CATEGORIES.SATISFACTORY, severity: 2 };
  if (val <= 200) return { ...AQI_CATEGORIES.MODERATE, severity: 3 };
  if (val <= 300) return { ...AQI_CATEGORIES.POOR, severity: 4 };
  if (val <= 400) return { ...AQI_CATEGORIES.VERY_POOR, severity: 5 };
  return { ...AQI_CATEGORIES.SEVERE, severity: 6 };
}

/**
 * Calculates rolling 24-hour average concentrations for PM2.5 and PM10.
 *
 * @param {number[]} [pm25Series=[]] - Hourly PM2.5 concentration series.
 * @param {number[]} [pm10Series=[]] - Hourly PM10 concentration series.
 * @param {number} [targetIdx] - Ending index of the 24-hour window.
 * @returns {{ avgPm25: number, avgPm10: number, pm25Avg24h: number, pm10Avg24h: number, count: number }}
 */
export function calculateRollingAverages(pm25Series = [], pm10Series = [], targetIdx) {
  if (!Array.isArray(pm25Series) || pm25Series.length === 0) {
    return { avgPm25: 60, avgPm10: 110, pm25Avg24h: 60, pm10Avg24h: 110, count: 0 };
  }

  const currentIdx =
    typeof targetIdx === 'number' ? targetIdx : Math.min(pm25Series.length - 1, 24);
  const startIdx = Math.max(0, currentIdx - 23);
  let pm25Sum = 0;
  let pm10Sum = 0;
  let count = 0;

  for (let i = startIdx; i <= currentIdx; i++) {
    const val25 = pm25Series[i];
    if (typeof val25 === 'number' && !isNaN(val25)) {
      pm25Sum += val25;
      const val10 =
        typeof pm10Series?.[i] === 'number' && !isNaN(pm10Series[i]) ? pm10Series[i] : val25 * 1.6;
      pm10Sum += val10;
      count++;
    }
  }

  const avgPm25 = count > 0 ? Math.round(pm25Sum / count) : pm25Series[currentIdx] || 60;
  const avgPm10 = count > 0 ? Math.round(pm10Sum / count) : pm10Series?.[currentIdx] || 110;

  return {
    avgPm25,
    avgPm10,
    pm25Avg24h: avgPm25,
    pm10Avg24h: avgPm10,
    count
  };
}
