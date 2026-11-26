// src/utils/aqiDisplayHelpers.js
/**
 * @fileoverview Formatting and display helpers for AQI cards, advisories,
 * pollutant metrics, and multi-day forecast panels.
 */

import { getAQICategory } from '../../shared/aqi.js';
import { MASK_ADVISORY_THRESHOLDS, POLLUTANT_STANDARDS } from '../constants/aqiThresholds.js';

/**
 * Returns advice banner metadata for a given AQI reading.
 * @param {number} aqi - National AQI value.
 * @returns {{ level: string, message: string, badgeClass: string }}
 */
export function getAQIAdviceBanner(aqi) {
  const cat = getAQICategory(aqi);
  return {
    level: `${cat.name} (${cat.min}-${cat.max})`,
    message: cat.advisory,
    badgeClass: cat.badgeClass
  };
}

/**
 * Returns mask advisory copy and urgency level based on AQI.
 * @param {number} aqi - National AQI value.
 * @returns {{ title: string, subtitle: string, urgency: string }}
 */
export function getMaskAdvisory(aqi) {
  const num = typeof aqi === 'number' ? aqi : Number(aqi) || 0;
  for (const tier of MASK_ADVISORY_THRESHOLDS) {
    if (num >= tier.minAqi) {
      return {
        title: tier.title,
        subtitle: tier.subtitle,
        urgency: tier.urgency
      };
    }
  }
  return {
    title: 'Mask Optional Outdoors',
    subtitle: 'Cloth and surgical masks do not block fine PM2.5 particulates.',
    urgency: 'Optional'
  };
}

/**
 * Formats pollutant concentrations against regulatory 24-hour limits.
 * @param {Record<string, number>} [pollutants] - Pollutant map.
 * @returns {Array<{ label: string, val: string | number, unit: string, isOver: boolean }>}
 */
export function formatPollutants(pollutants = {}) {
  return POLLUTANT_STANDARDS.map((p) => {
    const rawVal = pollutants?.[p.key];
    const hasVal = rawVal != null && !isNaN(rawVal);
    const isOver = hasVal && rawVal > p.limit;
    return {
      label: p.label,
      val: hasVal ? rawVal : '--',
      unit: p.unit,
      isOver
    };
  });
}

/**
 * Calculates min and max AQI trajectory range for 7-day spark chart.
 * @param {Array<{ minAqi?: number, maxAqi?: number, averageAqi?: number }>} [days]
 * @returns {{ minAqi: number, maxAqi: number }}
 */
export function getTrajectoryStats(days = []) {
  if (!days || days.length === 0) {
    return { minAqi: 100, maxAqi: 250 };
  }
  const minVal = Math.min(...days.map((d) => d.minAqi ?? d.averageAqi ?? 100), 100);
  const maxVal = Math.max(...days.map((d) => d.maxAqi ?? d.averageAqi ?? 250), 250);
  return { minAqi: minVal, maxAqi: maxVal };
}

/**
 * Computes responsive styles and badge labels for a 3-hour interval slot card.
 * @param {object} slot - Interval slot item.
 * @param {boolean} isBest - Whether this slot represents the cleanest air of the day.
 * @param {boolean} isWorst - Whether this slot represents peak smog.
 * @returns {{ cardClasses: string, timeClasses: string, aqiClasses: string, adviceClasses: string }}
 */
export function get3hSlotStyle(slot, isBest, isWorst) {
  if (isBest) {
    return {
      cardClasses:
        'bg-emerald-100/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/40',
      timeClasses: 'text-emerald-950 dark:text-emerald-100',
      aqiClasses: 'text-emerald-950 dark:text-emerald-50',
      adviceClasses:
        'text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800/80'
    };
  }

  if (isWorst) {
    return {
      cardClasses:
        'bg-rose-100/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 ring-2 ring-rose-500/40',
      timeClasses: 'text-rose-950 dark:text-rose-100',
      aqiClasses: 'text-rose-950 dark:text-rose-50',
      adviceClasses: 'text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800/80'
    };
  }

  return {
    cardClasses: 'bg-[#E2E8F0] dark:bg-[#1E293B] border-[#CBD5E1] dark:border-[#334155]',
    timeClasses: 'text-[#334155] dark:text-[#CBD5E1]',
    aqiClasses: 'text-[#334155] dark:text-[#F8FAFC]',
    adviceClasses: 'text-[#334155] dark:text-[#CBD5E1] border-[#CBD5E1] dark:border-[#334155]'
  };
}
