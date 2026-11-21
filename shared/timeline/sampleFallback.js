// shared/timeline/sampleFallback.js
/**
 * @fileoverview Deterministic sample timeline generation for Indian cities when upstream APIs are offline.
 */

import { getAQICategory } from '../aqi.js';

export function getSlotAdvice(aqi, hourStr) {
  const h = parseInt(hourStr.split(':')[0], 10);
  if (aqi <= 50) return 'Ideal for morning exercise, yoga, and fresh outdoor airing';
  if (aqi <= 100) {
    if (h >= 13 && h <= 16) return 'Cleanest afternoon solar window; good for walks';
    return 'Satisfactory air; sensitive groups take moderate pauses';
  }
  if (aqi <= 200) {
    if (h >= 12 && h <= 15) return 'Afternoon thermal mixing: relatively safer window for errands';
    return 'Moderate smog: sensitive individuals limit prolonged outdoor exertion';
  }
  if (aqi <= 300) {
    if (h >= 6 && h <= 9) return 'Morning winter inversion peak: wear N95 mask, keep doors shut';
    if (h >= 19 && h <= 22) return 'Evening smoke accumulation: run indoor filter or DIY box fan';
    return 'Poor air quality: avoid outdoor running; wear certified N95 mask';
  }
  if (aqi <= 400) {
    return 'Very Poor smog alert: keep windows sealed, avoid outdoor transit, run air purifiers';
  }
  return 'Severe emergency alert: stay strictly indoors, seal door drafts, avoid any exertion';
}

function buildSampleHour(d, i) {
  const hour = d.getHours();
  const hourStr = `${String(hour).padStart(2, '0')}:00`;
  const base = 185 + Math.sin((hour - 8) / 3.8) * -50 + Math.cos((hour - 14) / 4) * -40;
  const aqi = Math.max(45, Math.min(440, Math.round(base + (i % 5) * 5)));
  const cat = getAQICategory(aqi);

  return {
    time: d.toISOString(),
    hour: hourStr,
    aqi,
    dominant: 'PM2.5',
    pm25: Math.round(aqi * 0.48 * 10) / 10,
    pm10: Math.round(aqi * 0.88 * 10) / 10,
    category: cat.name,
    color: cat.color,
    badgeClass: cat.badgeClass,
    healthImpact: cat.healthImpact
  };
}

function buildSampleDaySlots(dayAqiBase) {
  const slotTimes = ['02:00', '05:00', '08:00', '11:00', '14:00', '17:00', '20:00', '23:00'];
  return slotTimes.map((time) => {
    const h = parseInt(time.split(':')[0], 10);
    let multiplier = 1.0;
    if (h === 8 || h === 5) multiplier = 1.28;
    else if (h === 20 || h === 23) multiplier = 1.22;
    else if (h === 14) multiplier = 0.7;
    else if (h === 11) multiplier = 0.86;

    const slotAqi = Math.max(40, Math.min(460, Math.round(dayAqiBase * multiplier)));
    const cat = getAQICategory(slotAqi);
    return {
      time,
      aqi: slotAqi,
      dominant: 'PM2.5',
      pm25: Math.round(slotAqi * 0.48 * 10) / 10,
      pm10: Math.round(slotAqi * 0.85 * 10) / 10,
      category: cat.name,
      color: cat.color,
      badgeClass: cat.badgeClass,
      healthImpact: cat.healthImpact,
      advice: getSlotAdvice(slotAqi, time),
      diffFromAvg: 0
    };
  });
}

export function generateSampleTimelineData(lat = 22.5726, lon = 88.3639, cityName = 'Kolkata') {
  const timezone = 'Asia/Kolkata';
  const now = new Date();
  const last24Hours = [];
  const forecast7Days = [];

  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600 * 1000);
    last24Hours.push(buildSampleHour(d, i));
  }

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayDate = new Date(now.getTime() + dayOffset * 86400 * 1000);
    const dateStr = dayDate.toISOString().split('T')[0];
    const weekday = weekdays[dayDate.getDay()];
    const shortDay = shortDays[dayDate.getDay()];
    const dayAqiBase = 195 - dayOffset * 5 + (dayOffset % 2 === 0 ? 15 : -10);

    const intervals3h = buildSampleDaySlots(dayAqiBase);
    const aqis = intervals3h.map((s) => s.aqi);
    const avgAqi = Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length);
    const minAqi = Math.min(...aqis);
    const maxAqi = Math.max(...aqis);

    intervals3h.forEach((slot) => {
      slot.diffFromAvg = slot.aqi - avgAqi;
      slot.diffText =
        slot.diffFromAvg > 0 ? `+${slot.diffFromAvg} vs avg` : `${slot.diffFromAvg} vs avg`;
    });

    let bestSlot = intervals3h[0];
    let worstSlot = intervals3h[0];
    intervals3h.forEach((s) => {
      if (s.aqi < bestSlot.aqi) bestSlot = s;
      if (s.aqi > worstSlot.aqi) worstSlot = s;
    });

    const dominantCat = getAQICategory(avgAqi);
    forecast7Days.push({
      date: dateStr,
      weekday,
      shortDay,
      averageAqi: avgAqi,
      minAqi,
      maxAqi,
      dominantCategory: dominantCat.name,
      color: dominantCat.color,
      badgeClass: dominantCat.badgeClass,
      cleanestWindow: `${bestSlot.time} (AQI ${bestSlot.aqi}, ${bestSlot.category})`,
      peakSmogWindow: `${worstSlot.time} (AQI ${worstSlot.aqi}, ${worstSlot.category})`,
      intervals3h
    });
  }

  const currentAqi = last24Hours[last24Hours.length - 1].aqi;
  const currentHour = last24Hours[last24Hours.length - 1].hour;
  const avg24 = Math.round(last24Hours.reduce((acc, h) => acc + h.aqi, 0) / last24Hours.length);

  let bestHour = last24Hours[0];
  let worstHour = last24Hours[0];
  last24Hours.forEach((h) => {
    if (h.aqi < bestHour.aqi) bestHour = h;
    if (h.aqi > worstHour.aqi) worstHour = h;
  });

  return {
    city: cityName,
    latitude: lat,
    longitude: lon,
    location: {
      latitude: lat,
      longitude: lon,
      city: cityName,
      country: 'India'
    },
    timezone,
    currentAqi,
    currentHour,
    dominantPollutant: 'PM2.5',
    averageAqi24h: avg24,
    bestHour24h: bestHour,
    worstHour24h: worstHour,
    last24Hours,
    forecast7Days,
    isSample: true,
    source: 'Simulation Mode (Sample data, live data unavailable)'
  };
}
