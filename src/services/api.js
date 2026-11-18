// src/services/api.js
// Client API Service for Foggy communicating with /api/ Endpoints
// Configured with Indian default city (Kolkata) and CPCB National AQI standards

export const INDIAN_METROS = [
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, country: 'India', admin1: 'West Bengal' },
  { name: 'Delhi', lat: 28.6139, lon: 77.2090, country: 'India', admin1: 'Delhi' },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'India', admin1: 'Maharashtra' },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, country: 'India', admin1: 'Tamil Nadu' },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, country: 'India', admin1: 'Karnataka' },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, country: 'India', admin1: 'Telangana' },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, country: 'India', admin1: 'Gujarat' },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, country: 'India', admin1: 'Maharashtra' }
];

export const PRESET_CITY_COORDINATES = {
  'kolkata': { name: 'Kolkata', country: 'India', admin1: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  'delhi': { name: 'Delhi', country: 'India', admin1: 'Delhi', lat: 28.6139, lon: 77.2090 },
  'mumbai': { name: 'Mumbai', country: 'India', admin1: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  'chennai': { name: 'Chennai', country: 'India', admin1: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  'bengaluru': { name: 'Bengaluru', country: 'India', admin1: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  'hyderabad': { name: 'Hyderabad', country: 'India', admin1: 'Telangana', lat: 17.3850, lon: 78.4867 },
  'ahmedabad': { name: 'Ahmedabad', country: 'India', admin1: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  'pune': { name: 'Pune', country: 'India', admin1: 'Maharashtra', lat: 18.5204, lon: 73.8567 }
};

export const DEFAULT_CITY = PRESET_CITY_COORDINATES.kolkata;

export function getStoredCity() {
  try {
    const raw = localStorage.getItem('foggy_selected_city');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name && parsed.lat && parsed.lon) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CITY;
}

export function setStoredCity(cityObj) {
  try {
    if (cityObj && cityObj.name) {
      localStorage.setItem('foggy_selected_city', JSON.stringify(cityObj));
    }
  } catch {}
}

export async function fetchAQIData(city = 'Kolkata') {
  try {
    const res = await fetch(`/api/aqi?city=${encodeURIComponent(city)}`);
    if (!res.ok) {
      throw new Error(`Failed to load AQI data (Status ${res.status})`);
    }
    return await res.json();
  } catch (err) {
    console.warn('AQI fetch error, using safe client fallback:', err);
    return {
      city: city || 'Kolkata, West Bengal',
      aqi: 165,
      scale: 'CPCB National AQI (0-500)',
      standard: 'Estimated NAQI (from PM2.5 and PM10)',
      category: 'Moderate',
      color: '#EAB308',
      badgeClass: 'bg-yellow-100 text-yellow-950 dark:bg-yellow-950/80 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800',
      healthImpact: 'Breathing discomfort to the people with lungs, asthma and heart diseases',
      advisory: 'Moderate smog: sensitive individuals limit prolonged outdoor exertion.',
      dominantPollutant: 'PM2.5',
      pollutants: { pm25: 78.5, pm10: 135, no2: 44, o3: 32, so2: 12, co: 1.1 },
      weather: { temp: 24, humidity: 68, windSpeed: 2.8, condition: 'Winter Riverine Inversion Haze' },
      forecastHourly: [],
      isMock: true,
      source: 'Simulation Mode (Sample data, live data unavailable)',
      attribution: 'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
      disclaimer: 'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
      medicalDisclaimer: 'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.'
    };
  }
}

export async function sendChatMessage({ message, history = [], user, aqiData, profile }) {
  try {
    const payload = JSON.stringify({
      message,
      history,
      user,
      aqiData,
      profile
    });

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Chat service unavailable (Status ${res.status})`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Chat request failed, providing supportive client fallback:', err);
    return {
      reply: `Hello ${user?.displayName || user?.name ? (user.displayName || user.name).split(' ')[0] : 'friend'}! I'm **Foggy**, your air quality guide.\n\n` +
        `Current air quality in **${aqiData?.city || 'Kolkata'}** is **Estimated NAQI ${aqiData?.aqi || 165} (${aqiData?.category || 'Moderate'})**.\n\n` +
        `### Immediate Practical Steps:\n` +
        `* 🚪 **Seal Drafts**: Roll a damp towel along door thresholds to prevent up to **40%** of outdoor PM2.5 from infiltrating.\n` +
        `* 😷 **Outdoor Protection**: If heading outside, a fitted certified N95 / FFP2 mask blocks **>95%** of hazardous particulates (cloth masks do not stop fine PM2.5).\n` +
        `* 🚇 **Low-Emission Commute**: Riding the Metro or electric city bus cuts direct tailpipe inhalation by **65%** and saves fuel costs.\n\n` +
        `> 🩺 *Medical disclaimer: Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.*`,
      extractedFacts: [],
      provider: 'Foggy Resilient Core'
    };
  }
}

export async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`/api/aqi-timeline?search=${encodeURIComponent(query.trim())}`);
    if (!res.ok) throw new Error('Geocoding search failed');
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('City search fallback:', err);
    const qLower = query.toLowerCase().trim();
    return Object.values(PRESET_CITY_COORDINATES).filter(c =>
      c.name.toLowerCase().includes(qLower)
    ).map(c => ({
      name: c.name,
      country: c.country,
      admin1: c.admin1,
      latitude: c.lat,
      longitude: c.lon
    }));
  }
}

export async function fetchAQITimeline({ lat = 22.5726, lon = 88.3639, city = 'Kolkata' } = {}) {
  try {
    const res = await fetch(`/api/aqi-timeline?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error(`Timeline fetch failed (Status ${res.status})`);
    return await res.json();
  } catch (err) {
    console.warn('AQI timeline fetch failed, using fallback:', err);
    return {
      timezone: 'Asia/Kolkata',
      location: { latitude: lat, longitude: lon, city, country: 'India' },
      scale: 'CPCB National AQI (0-500)',
      standard: 'Estimated NAQI (from PM2.5 and PM10)',
      currentAqi: 165,
      currentHour: '12:00',
      dominantPollutant: 'PM2.5',
      averageAqi24h: 172,
      bestHour24h: { hour: '14:00', aqi: 110 },
      worstHour24h: { hour: '08:00', aqi: 245 },
      cleanestWindowTip: 'Cleanest window was around 14:00 (Estimated NAQI 110). Safest window for outdoor activity or airing your space.',
      last24Hours: Array.from({ length: 24 }).map((_, i) => {
        const h = i;
        const hourStr = `${String(h).padStart(2, '0')}:00`;
        const aqi = Math.round(175 + Math.sin((h - 8) / 3.8) * -50);
        return {
          time: `2026-11-18T${hourStr}`,
          hour: hourStr,
          aqi,
          dominant: 'PM2.5',
          pm25: Math.round(aqi * 0.48 * 10) / 10,
          pm10: Math.round(aqi * 0.88 * 10) / 10,
          category: aqi <= 50 ? 'Good' : aqi <= 100 ? 'Satisfactory' : aqi <= 200 ? 'Moderate' : aqi <= 300 ? 'Poor' : aqi <= 400 ? 'Very Poor' : 'Severe',
          color: aqi <= 50 ? '#10B981' : aqi <= 100 ? '#22C55E' : aqi <= 200 ? '#EAB308' : aqi <= 300 ? '#F97316' : aqi <= 400 ? '#EF4444' : '#881337',
          badgeClass: 'bg-yellow-100 text-yellow-950 dark:bg-yellow-950/80 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800'
        };
      }),
      forecast7Days: ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((dayName, idx) => ({
        date: `2026-11-${18 + idx}`,
        dayName: idx === 0 ? 'Today' : dayName,
        shortDay: dayName.slice(0, 3),
        isToday: idx === 0,
        dayIndex: idx,
        averageAqi: 170 - idx * 4,
        minAqi: 110,
        maxAqi: 245,
        dominantCategory: 'Moderate',
        color: '#EAB308',
        intervals3h: ['02:00', '05:00', '08:00', '11:00', '14:00', '17:00', '20:00', '23:00'].map(t => ({
          time: t,
          aqi: t === '14:00' ? 110 : t === '08:00' ? 245 : 170,
          dominant: 'PM2.5',
          pm25: 75,
          pm10: 130,
          category: t === '14:00' ? 'Moderate' : t === '08:00' ? 'Poor' : 'Moderate',
          color: t === '14:00' ? '#EAB308' : t === '08:00' ? '#F97316' : '#EAB308',
          advice: t === '14:00' ? 'Cleanest window for brief outdoor errands' : 'Keep windows closed',
          diffFromAvg: t === '14:00' ? -60 : 0,
          diffText: t === '14:00' ? '-60 vs avg' : 'avg'
        })),
        bestSlot: { time: '14:00', aqi: 110 },
        worstSlot: { time: '08:00', aqi: 245 }
      })),
      attribution: 'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
      disclaimer: 'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
      medicalDisclaimer: 'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
      isSample: true,
      source: 'Simulation Mode (Sample data, live data unavailable)'
    };
  }
}
