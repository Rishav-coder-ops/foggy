/**
 * @fileoverview 7-day diurnal forecasting card builder from timeline points.
 */

import { getAQICategory } from '../aqi.js';
import { getSlotAdvice } from './sampleFallback.js';

const DEFAULT_FALLBACK_AQI = 160;
const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TARGET_SLOT_HOURS = ['02:00', '05:00', '08:00', '11:00', '14:00', '17:00', '20:00', '23:00'];

/**
 * Builds 7-day structured interval forecast cards from timeline points.
 * @param {Array<object>} points - Timeline point array.
 * @returns {Array<object>} 7-day forecast cards.
 */
export function buildForecast7Days(points) {
  const dayMap = {};
  points.forEach((p) => {
    if (!dayMap[p.date]) dayMap[p.date] = [];
    dayMap[p.date].push(p);
  });

  const dates = Object.keys(dayMap).sort();
  const forecastDates = dates.length > 7 ? dates.slice(1, 8) : dates.slice(0, 7);

  return forecastDates.map((dateStr, dayIndex) => {
    const dayPoints = dayMap[dateStr] || [];
    const dObj = new Date(dateStr + 'T12:00:00Z');
    const weekday = WEEKDAY_NAMES[dObj.getUTCDay()];
    const shortDay = SHORT_DAY_NAMES[dObj.getUTCDay()];

    const intervals3h = TARGET_SLOT_HOURS.map((slotTime) => {
      const found = dayPoints.find((p) => p.hour === slotTime);
      let aqiVal = found?.aqi;
      if (aqiVal == null) {
        const nearest = dayPoints.find((p) => p.aqi != null);
        aqiVal = nearest ? nearest.aqi : DEFAULT_FALLBACK_AQI;
      }
      const cat = getAQICategory(aqiVal);
      return {
        time: slotTime,
        aqi: aqiVal,
        dominant: found?.dominant || 'PM2.5',
        pm25: found?.pm25 ?? Math.round(aqiVal * 0.45 * 10) / 10,
        pm10: found?.pm10 ?? Math.round(aqiVal * 0.82 * 10) / 10,
        category: cat.name,
        color: cat.color,
        badgeClass: cat.badgeClass,
        healthImpact: cat.healthImpact,
        advice: getSlotAdvice(aqiVal, slotTime),
        diffFromAvg: 0
      };
    });

    const validAqis = intervals3h.map((s) => s.aqi);
    const avgAqi = Math.round(validAqis.reduce((a, b) => a + b, 0) / validAqis.length);
    const minAqi = Math.min(...validAqis);
    const maxAqi = Math.max(...validAqis);

    intervals3h.forEach((s) => {
      s.diffFromAvg = s.aqi - avgAqi;
      s.diffText = s.diffFromAvg > 0 ? `+${s.diffFromAvg} vs avg` : `${s.diffFromAvg} vs avg`;
    });

    let bestSlot = intervals3h[0];
    let worstSlot = intervals3h[0];
    intervals3h.forEach((s) => {
      if (s.aqi < bestSlot.aqi) bestSlot = s;
      if (s.aqi > worstSlot.aqi) worstSlot = s;
    });

    const dayCat = getAQICategory(avgAqi);

    return {
      date: dateStr,
      dayName: weekday,
      shortDay,
      isToday: dayIndex === 0,
      dayIndex,
      averageAqi: avgAqi,
      minAqi,
      maxAqi,
      dominantCategory: dayCat.name,
      color: dayCat.color,
      badgeClass: dayCat.badgeClass,
      healthImpact: dayCat.healthImpact,
      intervals3h,
      bestSlot,
      worstSlot
    };
  });
}
