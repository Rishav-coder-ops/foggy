/**
 * @fileoverview Builder for simulation sample city AQI reports.
 */

import { getAQICategory } from '../aqi.js';

const PM25_SAMPLE_RATIO = 0.48;
const PM10_SAMPLE_RATIO = 0.85;
const TONIGHT_AQI_RATIO = 1.15;
const TOMORROW_CLEAN_RATIO = 0.75;
const TOMORROW_PEAK_RATIO = 1.3;
const DEFAULT_CLEAN_HOUR = '14:00';
const DEFAULT_PEAK_HOUR = '08:00';
const DEFAULT_TONIGHT_HOUR = '20:00 IST';

/**
 * Builds a structured fallback report from sample timeline data.
 * @param {object} params
 * @param {object} params.sample - Generated sample timeline data
 * @param {string} params.name - City name
 * @param {string} [params.admin1=''] - State or administrative area
 * @param {number} params.lat - Latitude
 * @param {number} params.lon - Longitude
 * @param {string} [params.timeframe='now'] - Active timeframe
 * @returns {object} Formatted fallback report
 */
export function buildSampleCityReport({ sample, name, admin1 = '', lat, lon, timeframe = 'now' }) {
  const tonightAqi = Math.round(sample.currentAqi * TONIGHT_AQI_RATIO);
  const tomorrowAvg = sample.forecast7Days[1]?.averageAqi || sample.currentAqi;
  const tomorrowCleanAqi = Math.round(sample.currentAqi * TOMORROW_CLEAN_RATIO);
  const tomorrowPeakAqi = Math.round(sample.currentAqi * TOMORROW_PEAK_RATIO);

  return {
    found: true,
    city: name,
    admin1,
    lat,
    lon,
    country: 'India',
    timeframe,
    current: {
      aqi: sample.currentAqi,
      category: getAQICategory(sample.currentAqi).name,
      dominant: sample.dominantPollutant,
      pm25: Math.round(sample.currentAqi * PM25_SAMPLE_RATIO * 10) / 10,
      pm10: Math.round(sample.currentAqi * PM10_SAMPLE_RATIO * 10) / 10,
      time: `${sample.currentHour} IST`,
      hourStr: sample.currentHour
    },
    averageAqi24h: sample.averageAqi24h,
    bestHour24h: {
      hour: sample.bestHour24h.hour,
      aqi: sample.bestHour24h.aqi,
      category: getAQICategory(sample.bestHour24h.aqi).name
    },
    worstHour24h: {
      hour: sample.worstHour24h.hour,
      aqi: sample.worstHour24h.aqi,
      category: getAQICategory(sample.worstHour24h.aqi).name
    },
    tonight: {
      time: DEFAULT_TONIGHT_HOUR,
      aqi: tonightAqi,
      category: getAQICategory(tonightAqi).name,
      dominant: 'PM2.5'
    },
    tomorrow: {
      date: sample.forecast7Days[1]?.date || 'Tomorrow',
      averageAqi: tomorrowAvg,
      category: getAQICategory(tomorrowAvg).label,
      cleanestSlot: {
        hour: DEFAULT_CLEAN_HOUR,
        aqi: tomorrowCleanAqi,
        category: getAQICategory(tomorrowCleanAqi).label
      },
      peakSlot: {
        hour: DEFAULT_PEAK_HOUR,
        aqi: tomorrowPeakAqi,
        category: getAQICategory(tomorrowPeakAqi).label
      }
    },
    isSample: true,
    source: 'Simulation Mode (Sample data, live data unavailable)'
  };
}
