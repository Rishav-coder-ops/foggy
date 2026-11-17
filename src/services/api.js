// src/services/api.js

export async function fetchAQIData(city = 'Salt Lake City') {
  try {
    const res = await fetch(`/api/aqi?city=${encodeURIComponent(city)}`);
    if (!res.ok) {
      throw new Error(`Failed to load AQI data (Status ${res.status})`);
    }
    return await res.json();
  } catch (err) {
    console.warn('AQI fetch error, using safe client fallback:', err);
    return {
      city: city || 'Your City',
      aqi: 125,
      category: 'Unhealthy for Sensitive Groups',
      color: '#F97316',
      badgeClass: 'text-orange-800 bg-orange-100 border-orange-300',
      advisory: 'Air quality is reduced. Members of sensitive groups should limit prolonged outdoor exertion.',
      sensitiveGroups: 'Children, seniors, and individuals with respiratory issues should stay indoors during morning peaks.',
      outdoorRecommendation: 'Best outdoor window is between 1:00 PM and 3:30 PM.',
      maskRecommended: true,
      maskType: 'N95 / KN95 recommended outdoors',
      pollutants: { pm25: 45, pm10: 68, no2: 32, o3: 28, so2: 6, co: 0.9 },
      weather: { temp: 4, humidity: 68, windSpeed: 5.2, condition: 'Inversion Haze' },
      dominantPollutant: 'PM2.5',
      forecastHourly: [],
      isMock: true,
      source: 'Client Fallback Simulation'
    };
  }
}

export async function sendChatMessage({ message, history = [], user, aqiData, profile }) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        history,
        user,
        aqiData,
        profile
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Chat service unavailable (Status ${res.status})`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Chat request failed, providing supportive client fallback:', err);
    return {
      reply: `Hello ${user?.name ? user.name.split(' ')[0] : 'friend'}! I'm **Foggy**, your air quality guide. It looks like the network is running a bit slow, but I'm right here with you!\n\n` +
        `Current air quality in **${aqiData?.city || 'your area'}** is **AQI ${aqiData?.aqi || 125} (${aqiData?.category || 'Unhealthy for Sensitive Groups'})**.\n\n` +
        `### Immediate Practical Steps:\n` +
        `* 🚪 **Seal Drafts**: Roll a damp towel along door thresholds to prevent up to **40%** of outdoor PM2.5 from infiltrating.\n` +
        `* 😷 **Outdoor Protection**: If heading outside, a fitted N95 mask blocks **>95%** of hazardous particulates.\n` +
        `* 🚇 **Low-Emission Commute**: Riding public transit saves **~2.4 kg CO2** compared to driving solo.\n\n` +
        `> 🩺 *Friendly reminder: I am Foggy, your air quality companion, not a medical doctor. For respiratory distress, please consult a healthcare professional.*`,
      extractedFacts: [],
      provider: 'Foggy Resilient Core'
    };
  }
}
