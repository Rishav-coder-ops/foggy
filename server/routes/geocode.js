// server/routes/geocode.js
import express from 'express';

const router = express.Router();
const geocodeCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

export const STATE_ALIASES = {
  'orissa': 'odisha',
  'odisha': 'odisha',
  'pondicherry': 'puducherry',
  'puducherry': 'puducherry',
  'delhi': 'delhi',
  'nct of delhi': 'delhi',
  'national capital territory of delhi': 'delhi',
  'new delhi': 'delhi',
  'uttaranchal': 'uttarakhand',
  'uttarakhand': 'uttarakhand',
  'jammu & kashmir': 'jammu and kashmir',
  'jammu and kashmir': 'jammu and kashmir',
  'andaman & nicobar': 'andaman and nicobar islands',
  'andaman and nicobar': 'andaman and nicobar islands',
  'andaman and nicobar islands': 'andaman and nicobar islands',
  'telengana': 'telangana',
  'telangana': 'telangana',
  'chhattisgarh': 'chhattisgarh',
  'chattisgarh': 'chhattisgarh',
  'ladakh': 'ladakh',
  'dadra and nagar haveli and daman and diu': 'dadra and nagar haveli and daman and diu',
  'daman and diu': 'dadra and nagar haveli and daman and diu',
  'dadra and nagar haveli': 'dadra and nagar haveli and daman and diu',
  'wb': 'west bengal',
  'west bengal': 'west bengal',
  'up': 'uttar pradesh',
  'uttar pradesh': 'uttar pradesh',
  'mp': 'madhya pradesh',
  'madhya pradesh': 'madhya pradesh',
  'ap': 'andhra pradesh',
  'andhra pradesh': 'andhra pradesh',
  'tn': 'tamil nadu',
  'tamil nadu': 'tamil nadu',
  'mh': 'maharashtra',
  'maharashtra': 'maharashtra',
  'ka': 'karnataka',
  'karnataka': 'karnataka',
  'gj': 'gujarat',
  'gujarat': 'gujarat',
  'rj': 'rajasthan',
  'rajasthan': 'rajasthan',
  'pb': 'punjab',
  'punjab': 'punjab',
  'hr': 'haryana',
  'haryana': 'haryana',
  'br': 'bihar',
  'bihar': 'bihar',
  'kl': 'kerala',
  'kerala': 'kerala'
};

export function normalizeStateName(state) {
  if (!state || typeof state !== 'string') return '';
  const clean = state.toLowerCase().replace(/[^a-z0-9& ]/g, '').trim();
  return STATE_ALIASES[clean] || clean;
}

export function statesMatch(state1, state2) {
  if (!state1 || !state2) return false;
  const n1 = normalizeStateName(state1);
  const n2 = normalizeStateName(state2);
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

const INDIAN_FALLBACK_CITIES = [
  { id: 1275004, name: 'Kolkata', latitude: 22.5726, longitude: 88.3639, country: 'India', country_code: 'IN', admin1: 'West Bengal', timezone: 'Asia/Kolkata' },
  { id: 1273294, name: 'Delhi', latitude: 28.6139, longitude: 77.2090, country: 'India', country_code: 'IN', admin1: 'Delhi', timezone: 'Asia/Kolkata' },
  { id: 1275339, name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, country: 'India', country_code: 'IN', admin1: 'Maharashtra', timezone: 'Asia/Kolkata' },
  { id: 1264527, name: 'Chennai', latitude: 13.0827, longitude: 80.2707, country: 'India', country_code: 'IN', admin1: 'Tamil Nadu', timezone: 'Asia/Kolkata' },
  { id: 1277333, name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946, country: 'India', country_code: 'IN', admin1: 'Karnataka', timezone: 'Asia/Kolkata' },
  { id: 1269843, name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867, country: 'India', country_code: 'IN', admin1: 'Telangana', timezone: 'Asia/Kolkata' },
  { id: 1279233, name: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714, country: 'India', country_code: 'IN', admin1: 'Gujarat', timezone: 'Asia/Kolkata' },
  { id: 1259229, name: 'Pune', latitude: 18.5204, longitude: 73.8567, country: 'India', country_code: 'IN', admin1: 'Maharashtra', timezone: 'Asia/Kolkata' },
  { id: 1271476, name: 'Jaipur', latitude: 26.9124, longitude: 75.7873, country: 'India', country_code: 'IN', admin1: 'Rajasthan', timezone: 'Asia/Kolkata' },
  { id: 1264733, name: 'Lucknow', latitude: 26.8467, longitude: 80.9462, country: 'India', country_code: 'IN', admin1: 'Uttar Pradesh', timezone: 'Asia/Kolkata' },
  { id: 1260086, name: 'Patna', latitude: 25.5941, longitude: 85.1376, country: 'India', country_code: 'IN', admin1: 'Bihar', timezone: 'Asia/Kolkata' },
  { id: 1270583, name: 'Guwahati', latitude: 26.1445, longitude: 91.7362, country: 'India', country_code: 'IN', admin1: 'Assam', timezone: 'Asia/Kolkata' }
];

router.get('/', async (req, res) => {
  const rawQuery = req.query.name || req.query.search || req.query.q || '';
  const query = String(rawQuery).trim().slice(0, 80);
  const countryCode = String(req.query.countryCode || req.query.country || '').trim().slice(0, 5).toUpperCase();
  const count = Math.min(Math.max(parseInt(req.query.count || '10', 10), 1), 20);

  if (!query || query.length < 2) {
    return res.json({ results: [] });
  }

  const cacheKey = `${query.toLowerCase()}_${countryCode}_${count}`;
  const now = Date.now();
  const cached = geocodeCache.get(cacheKey);
  if (cached && cached.expiry > now) {
    return res.json({ results: cached.data, cached: true });
  }

  try {
    const params = new URLSearchParams({
      name: query,
      count: String(count),
      language: 'en',
      format: 'json'
    });
    if (countryCode) {
      params.append('countryCode', countryCode);
    }

    const openMeteoUrl = `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
    const response = await fetch(openMeteoUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Foggy-Air-Quality-Assistant/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Geocoding API responded with ${response.status}`);
    }

    const data = await response.json();
    const rawResults = Array.isArray(data.results) ? data.results : [];

    const results = rawResults.map((r) => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country,
      country_code: r.country_code,
      admin1: r.admin1 || '',
      admin2: r.admin2 || '',
      timezone: r.timezone || 'Asia/Kolkata'
    }));

    geocodeCache.set(cacheKey, {
      data: results,
      expiry: now + CACHE_TTL_MS
    });

    return res.json({ results });
  } catch (err) {
    console.warn('Geocoding server error, using fallback:', err.message);
    const qLower = query.toLowerCase();
    const fallbackMatches = INDIAN_FALLBACK_CITIES.filter((c) =>
      c.name.toLowerCase().includes(qLower) || (c.admin1 && c.admin1.toLowerCase().includes(qLower))
    );

    return res.json({
      results: fallbackMatches,
      fallback: true,
      notice: 'Geocoding upstream unavailable, results served from offline index.'
    });
  }
});

export default router;
