// functions/api/aqi-timeline.js
// Cloudflare Pages Function & Local Server Handler for Indian National AQI (CPCB NAQI)
// Uses Open-Meteo Air Quality CAMS model (hourly pm2_5 and pm10, past_days=1, forecast_days=7)
// Calculates CPCB sub-indices for PM2.5 and PM10 using official linear interpolation formula.

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const ipRateLimitMap = new Map();

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

// Comprehensive mapping for Indian cities, old names, spelling variants, typos, and major neighbourhoods
export const INDIAN_CITY_ALIASES = {
  // Delhi NCR
  'delhi': 'Delhi',
  'new delhi': 'Delhi',
  'dehli': 'Delhi',
  'dilli': 'Delhi',
  'ncr': 'Delhi',
  'delhi-ncr': 'Delhi',
  'delhi ncr': 'Delhi',
  'connaught place': 'Delhi',
  'rohini': 'Delhi',
  'dwarka': 'Delhi',
  'saket': 'Delhi',
  'karol bagh': 'Delhi',
  'hauz khas': 'Delhi',
  'chandni chowk': 'Delhi',
  'anand vihar': 'Delhi',
  'ito': 'Delhi',
  'punjabi bagh': 'Delhi',
  'rk puram': 'Delhi',
  'lodhi road': 'Delhi',
  'nehru place': 'Delhi',
  'noida': 'Noida',
  'greater noida': 'Noida',
  'gurgaon': 'Gurugram',
  'gurugram': 'Gurugram',
  'faridabad': 'Faridabad',
  'ghaziabad': 'Ghaziabad',

  // Mumbai / Maharashtra
  'mumbai': 'Mumbai',
  'bombay': 'Mumbai',
  'bambai': 'Mumbai',
  'bandra': 'Mumbai',
  'andheri': 'Mumbai',
  'juhu': 'Mumbai',
  'colaba': 'Mumbai',
  'borivali': 'Mumbai',
  'dadar': 'Mumbai',
  'thane': 'Thane',
  'navi mumbai': 'Navi Mumbai',
  'pune': 'Pune',
  'poona': 'Pune',
  'nagpur': 'Nagpur',
  'nashik': 'Nashik',

  // Kolkata / West Bengal
  'kolkata': 'Kolkata',
  'calcutta': 'Kolkata',
  'kolkatta': 'Kolkata',
  'howrah': 'Howrah',
  'salt lake': 'Kolkata',
  'salt lake city': 'Kolkata',
  'newtown': 'Kolkata',
  'new town': 'Kolkata',
  'jadavpur': 'Kolkata',
  'park street': 'Kolkata',
  'durgapur': 'Durgapur',
  'asansol': 'Asansol',
  'siliguri': 'Siliguri',

  // Bengaluru / Karnataka
  'bengaluru': 'Bengaluru',
  'bangalore': 'Bengaluru',
  'blr': 'Bengaluru',
  'whitefield': 'Bengaluru',
  'indiranagar': 'Bengaluru',
  'koramangala': 'Bengaluru',
  'electronic city': 'Bengaluru',
  'hsr layout': 'Bengaluru',
  'jayanagar': 'Bengaluru',
  'mysore': 'Mysuru',
  'mysuru': 'Mysuru',
  'mangalore': 'Mangaluru',

  // Chennai / Tamil Nadu
  'chennai': 'Chennai',
  'madras': 'Chennai',
  'anna nagar': 'Chennai',
  't nagar': 'Chennai',
  'adyar': 'Chennai',
  'velachery': 'Chennai',
  'coimbatore': 'Coimbatore',
  'madurai': 'Madurai',
  'trichy': 'Tiruchirappalli',

  // Hyderabad / Telangana / AP
  'hyderabad': 'Hyderabad',
  'secunderabad': 'Hyderabad',
  'cyberabad': 'Hyderabad',
  'gachibowli': 'Hyderabad',
  'hitec city': 'Hyderabad',
  'visakhapatnam': 'Visakhapatnam',
  'vizag': 'Visakhapatnam',
  'vijayawada': 'Vijayawada',
  'tirupati': 'Tirupati',

  // Gujarat
  'ahmedabad': 'Ahmedabad',
  'amdavad': 'Ahmedabad',
  'surat': 'Surat',
  'vadodara': 'Vadodara',
  'baroda': 'Vadodara',
  'rajkot': 'Rajkot',

  // Odisha
  'bhubaneswar': 'Bhubaneswar',
  'bhubaneshwar': 'Bhubaneswar',
  'bbsr': 'Bhubaneswar',
  'cuttack': 'Cuttack',
  'puri': 'Puri',

  // UP, Bihar, Central & Northern
  'lucknow': 'Lucknow',
  'kanpur': 'Kanpur',
  'varanasi': 'Varanasi',
  'banaras': 'Varanasi',
  'kashi': 'Varanasi',
  'prayagraj': 'Prayagraj',
  'allahabad': 'Prayagraj',
  'agra': 'Agra',
  'meerut': 'Meerut',
  'patna': 'Patna',
  'gaya': 'Gaya',
  'chandigarh': 'Chandigarh',
  'amritsar': 'Amritsar',
  'ludhiana': 'Ludhiana',
  'dehradun': 'Dehradun',
  'shimla': 'Shimla',
  'srinagar': 'Srinagar',
  'jammu': 'Jammu',
  'jaipur': 'Jaipur',
  'jodhpur': 'Jodhpur',
  'bhopal': 'Bhopal',
  'indore': 'Indore',
  'gwalior': 'Gwalior',
  'raipur': 'Raipur',
  'ranchi': 'Ranchi',
  'guwahati': 'Guwahati',
  'kochi': 'Kochi',
  'cochin': 'Kochi',
  'thiruvananthapuram': 'Thiruvananthapuram',
  'trivandrum': 'Thiruvananthapuram',

  // Hindi script spellings
  'दिल्ली': 'Delhi',
  'दिल्लि': 'Delhi',
  'नई दिल्ली': 'Delhi',
  'मुंबई': 'Mumbai',
  'मुम्बई': 'Mumbai',
  'बंबई': 'Mumbai',
  'कोलकाता': 'Kolkata',
  'कलकत्ता': 'Kolkata',
  'बेंगलुरु': 'Bengaluru',
  'बैंगलोर': 'Bengaluru',
  'चेन्नई': 'Chennai',
  'मद्रास': 'Chennai',
  'हैदराबाद': 'Hyderabad',
  'अहमदाबाद': 'Ahmedabad',
  'पुणे': 'Pune',
  'भुवनेश्वर': 'Bhubaneswar',
  'नोएडा': 'Noida',
  'गुड़गांव': 'Gurugram',
  'गुरुग्राम': 'Gurugram',
  'जयपुर': 'Jaipur',
  'लखनऊ': 'Lucknow',
  'कानपुर': 'Kanpur',
  'पटना': 'Patna',
  'चंडीगढ़': 'Chandigarh',
  'वाराणसी': 'Varanasi',
  'बनारस': 'Varanasi',
  'इंदौर': 'Indore',
  'भोपाल': 'Bhopal'
};

// Geocode any Indian city/place name with countrycode=IN, preferring most populous match
export async function geocodeIndianCity(query) {
  if (!query || typeof query !== 'string') return null;
  const raw = query.trim().toLowerCase();
  if (!raw) return null;

  // 1. Direct alias dictionary lookup
  const canonicalName = INDIAN_CITY_ALIASES[raw] || query.trim();
  const canonicalLower = canonicalName.toLowerCase();

  // 2. Check preset Indian metros
  const metroMatch = INDIAN_METROS.find((m) =>
    m.name.toLowerCase() === canonicalLower ||
    m.name.toLowerCase() === raw
  );
  if (metroMatch) {
    return {
      name: metroMatch.name,
      latitude: metroMatch.lat,
      longitude: metroMatch.lon,
      admin1: metroMatch.admin1,
      country: 'India',
      population: 10000000
    };
  }

  // 3. Online Geocoding via Open-Meteo with countrycode=IN
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(canonicalName)}&count=10&language=en&format=json&countrycode=IN`;
    const res = await fetch(geoUrl, {
      headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data = await res.json();
      const results = (data.results || [])
        .filter((r) => (!r.country_code || r.country_code.toUpperCase() === 'IN' || r.country === 'India'))
        .sort((a, b) => (b.population || 0) - (a.population || 0));

      if (results.length > 0) {
        const top = results[0];
        return {
          name: top.name,
          latitude: top.latitude,
          longitude: top.longitude,
          admin1: top.admin1 || '',
          country: 'India',
          population: top.population || 0
        };
      }
    }
  } catch (err) {
    console.warn(`Geocoding error for ${canonicalName}:`, err.message);
  }

  return null;
}

// Fetch live AQI timeline report for a city, computing CPCB NAQI and rolling averages
export async function fetchCityAqiReport(cityNameOrObj, timeframe = 'now') {
  let cityInfo = null;
  if (typeof cityNameOrObj === 'string') {
    cityInfo = await geocodeIndianCity(cityNameOrObj);
    if (!cityInfo) {
      return { found: false, city: cityNameOrObj };
    }
  } else if (cityNameOrObj && typeof cityNameOrObj.lat === 'number' && typeof cityNameOrObj.lon === 'number') {
    cityInfo = {
      name: cityNameOrObj.name || 'Unknown City',
      latitude: cityNameOrObj.lat,
      longitude: cityNameOrObj.lon,
      admin1: cityNameOrObj.admin1 || '',
      country: 'India'
    };
  } else {
    return { found: false, city: 'Unknown' };
  }

  const { name, latitude: lat, longitude: lon, admin1 } = cityInfo;

  try {
    const apiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10&past_days=1&forecast_days=7&timezone=auto`;
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
      signal: AbortSignal.timeout(7000)
    });

    if (!res.ok) throw new Error(`Open-Meteo responded with status ${res.status}`);

    const data = await res.json();
    const times = data.hourly?.time || [];
    const pm25s = data.hourly?.pm2_5 || [];
    const pm10s = data.hourly?.pm10 || [];

    if (times.length === 0) throw new Error('No hourly data from Open-Meteo');

    function getRolling(arr, idx) {
      const s = Math.max(0, idx - 23);
      let sum = 0;
      let count = 0;
      for (let k = s; k <= idx; k++) {
        if (typeof arr[k] === 'number' && !isNaN(arr[k])) {
          sum += arr[k];
          count++;
        }
      }
      return count > 0 ? sum / count : (arr[idx] ?? 0);
    }

    const tz = data.timezone || 'Asia/Kolkata';
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz });
    const currentHourInt = parseInt(now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }), 10);
    const targetHourStr = `${todayStr}T${String(currentHourInt).padStart(2, '0')}:00`;

    let currentIdx = times.indexOf(targetHourStr);
    if (currentIdx === -1) {
      currentIdx = times.findIndex((t) => t.startsWith(todayStr));
      if (currentIdx === -1) currentIdx = Math.min(36, times.length - 1);
    }

    const points = times.map((t, i) => {
      const roll25 = getRolling(pm25s, i);
      const roll10 = getRolling(pm10s, i);
      const naqiRes = calculateCPCBNAQI(roll25, roll10);
      const cat = getAQICategory(naqiRes.aqi);
      const hourStr = t.split('T')[1] || '00:00';
      return {
        time: t,
        date: t.split('T')[0],
        hour: hourStr,
        aqi: naqiRes.aqi,
        dominant: naqiRes.dominant,
        pm25: typeof pm25s[i] === 'number' ? Math.round(pm25s[i] * 10) / 10 : null,
        pm10: typeof pm10s[i] === 'number' ? Math.round(pm10s[i] * 10) / 10 : null,
        rollingPm25: Math.round(roll25 * 10) / 10,
        rollingPm10: Math.round(roll10 * 10) / 10,
        category: cat.name
      };
    });

    const currentPoint = points[currentIdx] || points[points.length - 1];

    // 24-hour window slice
    const start24 = Math.max(0, currentIdx - 12);
    const end24 = Math.min(points.length, start24 + 24);
    const slice24 = points.slice(start24, end24);

    let bestHour24h = slice24[0] || currentPoint;
    let worstHour24h = slice24[0] || currentPoint;
    let sum24 = 0;
    for (const p of slice24) {
      sum24 += p.aqi;
      if (p.aqi < bestHour24h.aqi) bestHour24h = p;
      if (p.aqi > worstHour24h.aqi) worstHour24h = p;
    }
    const avg24 = Math.round(sum24 / (slice24.length || 1));

    // Tonight slot (look for today 20:00, 21:00, 22:00, or 23:00)
    const tonightSlot =
      points.find((p) => p.date === todayStr && (p.hour === '20:00' || p.hour === '21:00' || p.hour === '22:00' || p.hour === '23:00')) ||
      points.find((p) => p.time > currentPoint.time && (p.hour === '20:00' || p.hour === '23:00')) ||
      currentPoint;

    // Tomorrow slots
    const tomorrowDate = new Date(now.getTime() + 86400 * 1000);
    const tomorrowStr = tomorrowDate.toLocaleDateString('en-CA', { timeZone: tz });
    const tomorrowPoints = points.filter((p) => p.date === tomorrowStr);
    let tomorrowAvg = currentPoint.aqi;
    let tomorrowBest = currentPoint;
    let tomorrowWorst = currentPoint;
    if (tomorrowPoints.length > 0) {
      let tSum = 0;
      tomorrowBest = tomorrowPoints[0];
      tomorrowWorst = tomorrowPoints[0];
      for (const p of tomorrowPoints) {
        tSum += p.aqi;
        if (p.aqi < tomorrowBest.aqi) tomorrowBest = p;
        if (p.aqi > tomorrowWorst.aqi) tomorrowWorst = p;
      }
      tomorrowAvg = Math.round(tSum / tomorrowPoints.length);
    }
    const tomorrowCat = getAQICategory(tomorrowAvg);

    const timeFormatted = `${currentPoint.hour} IST, ${now.toLocaleDateString('en-IN', { timeZone: tz, day: 'numeric', month: 'short' })}`;

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
        pm25: currentPoint.rollingPm25 || currentPoint.pm25,
        pm10: currentPoint.rollingPm10 || currentPoint.pm10,
        time: timeFormatted,
        hourStr: currentPoint.hour
      },
      averageAqi24h: avg24,
      bestHour24h: {
        hour: bestHour24h.hour,
        aqi: bestHour24h.aqi,
        category: bestHour24h.category
      },
      worstHour24h: {
        hour: worstHour24h.hour,
        aqi: worstHour24h.aqi,
        category: worstHour24h.category
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
        cleanestSlot: { hour: tomorrowBest.hour, aqi: tomorrowBest.aqi, category: tomorrowBest.category },
        peakSlot: { hour: tomorrowWorst.hour, aqi: tomorrowWorst.aqi, category: tomorrowWorst.category }
      },
      isSample: false,
      source: 'Open-Meteo CAMS Model (Live Feed)'
    };
  } catch (err) {
    console.warn(`Live AQI fetch failed for ${name}, using sample generator:`, err.message);
    const sample = generateSampleTimelineData(lat, lon, name);
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
        pm25: Math.round(sample.currentAqi * 0.48 * 10) / 10,
        pm10: Math.round(sample.currentAqi * 0.85 * 10) / 10,
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
        time: '20:00 IST',
        aqi: Math.round(sample.currentAqi * 1.15),
        category: getAQICategory(Math.round(sample.currentAqi * 1.15)).name,
        dominant: 'PM2.5'
      },
      tomorrow: {
        date: sample.forecast7Days[1]?.date || 'Tomorrow',
        averageAqi: sample.forecast7Days[1]?.averageAqi || sample.currentAqi,
        category: sample.forecast7Days[1]?.dominantCategory || 'Moderate',
        cleanestSlot: { hour: '14:00', aqi: Math.round(sample.currentAqi * 0.75), category: 'Moderate' },
        peakSlot: { hour: '08:00', aqi: Math.round(sample.currentAqi * 1.3), category: 'Poor' }
      },
      isSample: true,
      source: 'Simulation Mode (Sample data, live data unavailable)'
    };
  }
}

function checkRateLimit(clientIp) {
  const now = Date.now();
  let clientRecord = ipRateLimitMap.get(clientIp);

  if (!clientRecord || now > clientRecord.resetTime) {
    clientRecord = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    ipRateLimitMap.set(clientIp, clientRecord);
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  clientRecord.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - clientRecord.count);
  return {
    allowed: clientRecord.count <= MAX_REQUESTS_PER_WINDOW,
    remaining
  };
}

function getCorsHeaders(request) {
  const requestOrigin = request.headers.get('Origin');
  let siteOrigin = 'https://foggy.pages.dev';
  try {
    const parsed = new URL(request.url);
    siteOrigin = parsed.origin;
  } catch {}

  const isAllowed =
    !requestOrigin ||
    requestOrigin === siteOrigin ||
    requestOrigin.includes('localhost') ||
    requestOrigin.includes('127.0.0.1') ||
    requestOrigin.endsWith('.pages.dev');

  return {
    'Access-Control-Allow-Origin': isAllowed ? (requestOrigin || siteOrigin) : siteOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Vary': 'Origin',
    'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    'X-Content-Type-Options': 'nosniff'
  };
}

// CPCB Linear interpolation formula:
// index = ((IHi - ILo) / (BPHi - BPLo)) * (C - BPLo) + ILo
export function calculatePM25SubIndex(pm25) {
  if (pm25 == null || isNaN(pm25) || pm25 < 0) return null;
  const c = Math.round(pm25 * 10) / 10;
  if (c <= 30) return Math.round(((50 - 0) / (30 - 0)) * c);
  if (c <= 60) return Math.round(((100 - 51) / (60 - 31)) * (c - 31) + 51);
  if (c <= 90) return Math.round(((200 - 101) / (90 - 61)) * (c - 61) + 101);
  if (c <= 120) return Math.round(((300 - 201) / (120 - 91)) * (c - 91) + 201);
  if (c <= 250) return Math.round(((400 - 301) / (250 - 121)) * (c - 121) + 301);
  // 250+ up to 380 (capped at 500)
  return Math.min(500, Math.round(((500 - 401) / (380 - 251)) * (c - 251) + 401));
}

export function calculatePM10SubIndex(pm10) {
  if (pm10 == null || isNaN(pm10) || pm10 < 0) return null;
  const c = Math.round(pm10 * 10) / 10;
  if (c <= 50) return Math.round(((50 - 0) / (50 - 0)) * c);
  if (c <= 100) return Math.round(((100 - 51) / (100 - 51)) * (c - 51) + 51);
  if (c <= 250) return Math.round(((200 - 101) / (250 - 101)) * (c - 101) + 101);
  if (c <= 350) return Math.round(((300 - 201) / (350 - 251)) * (c - 251) + 201);
  if (c <= 430) return Math.round(((400 - 301) / (430 - 351)) * (c - 351) + 301);
  // 430+ up to 510 (capped at 500)
  return Math.min(500, Math.round(((500 - 401) / (510 - 431)) * (c - 431) + 401));
}

// Calculate combined CPCB NAQI from PM2.5 and PM10
export function calculateCPCBNAQI(pm25, pm10) {
  const sub25 = calculatePM25SubIndex(pm25);
  const sub10 = calculatePM10SubIndex(pm10);

  if (sub25 == null && sub10 == null) return { aqi: null, dominant: 'PM2.5' };
  if (sub25 == null) return { aqi: sub10, dominant: 'PM10' };
  if (sub10 == null) return { aqi: sub25, dominant: 'PM2.5' };

  if (sub25 >= sub10) {
    return { aqi: sub25, dominant: 'PM2.5' };
  }
  return { aqi: sub10, dominant: 'PM10' };
}

// CPCB National AQI (NAQI) Scale (0-500)
export function getAQICategory(aqi) {
  if (aqi == null || isNaN(aqi)) {
    return {
      name: 'Unknown',
      color: '#94A3B8',
      healthImpact: 'Data unavailable',
      badgeClass: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
    };
  }

  const rounded = Math.round(aqi);

  if (rounded <= 50) {
    return {
      name: 'Good',
      color: '#10B981', // green
      healthImpact: 'Minimal impact',
      advisory: 'Air quality is good. Safe for all outdoor activities and natural ventilation.',
      badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
    };
  }
  if (rounded <= 100) {
    return {
      name: 'Satisfactory',
      color: '#22C55E', // light green
      healthImpact: 'Minor breathing discomfort to sensitive people',
      advisory: 'Satisfactory air quality. Sensitive individuals should observe comfort levels.',
      badgeClass: 'bg-green-100 text-green-900 dark:bg-green-950/80 dark:text-green-300 border-green-300 dark:border-green-800'
    };
  }
  if (rounded <= 200) {
    return {
      name: 'Moderate',
      color: '#EAB308', // yellow
      healthImpact: 'Breathing discomfort to the people with lungs, asthma and heart diseases',
      advisory: 'People with asthma or heart conditions should limit prolonged outdoor exertion.',
      badgeClass: 'bg-yellow-100 text-yellow-950 dark:bg-yellow-950/80 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800'
    };
  }
  if (rounded <= 300) {
    return {
      name: 'Poor',
      color: '#F97316', // orange
      healthImpact: 'Breathing discomfort to most people on prolonged exposure',
      advisory: 'Avoid prolonged outdoor exertion; wear an N95 mask outdoors.',
      badgeClass: 'bg-orange-100 text-orange-950 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800'
    };
  }
  if (rounded <= 400) {
    return {
      name: 'Very Poor',
      color: '#EF4444', // red
      healthImpact: 'Respiratory illness on prolonged exposure',
      advisory: 'Avoid all strenuous outdoor activity. Keep windows shut and run indoor filtration.',
      badgeClass: 'bg-red-100 text-red-950 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800'
    };
  }
  return {
    name: 'Severe',
    color: '#881337', // maroon
    healthImpact: 'Affects healthy people and seriously impacts those with existing diseases',
    advisory: 'Severe smog emergency! Stay strictly indoors. Seal door/window drafts and run air purifiers.',
    badgeClass: 'bg-rose-200 text-rose-950 dark:bg-rose-950/90 dark:text-rose-200 border-rose-400 dark:border-rose-800'
  };
}

function getSlotAdvice(aqi, hourStr) {
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

// Generate realistic deterministic sample data for fallback (Default: Kolkata)
function generateSampleTimelineData(lat = 22.5726, lon = 88.3639, cityName = 'Kolkata') {
  const timezone = 'Asia/Kolkata';
  const now = new Date();
  const last24Hours = [];
  const forecast7Days = [];

  // 24 hours diurnal pattern
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600 * 1000);
    const hour = d.getHours();
    const hourStr = `${String(hour).padStart(2, '0')}:00`;

    // Indian winter atmospheric cycle: high in morning (6-9 AM) and evening (8-11 PM)
    const base = 185 + Math.sin((hour - 8) / 3.8) * -50 + Math.cos((hour - 14) / 4) * -40;
    const aqi = Math.max(45, Math.min(440, Math.round(base + (i % 5) * 5)));
    const cat = getAQICategory(aqi);

    last24Hours.push({
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
    });
  }

  // 7 days forecast
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayDate = new Date(now.getTime() + dayOffset * 86400 * 1000);
    const dateStr = dayDate.toISOString().split('T')[0];
    const weekday = weekdays[dayDate.getDay()];
    const shortDay = shortDays[dayDate.getDay()];
    const dayAqiBase = 195 - dayOffset * 5 + (dayOffset % 2 === 0 ? 15 : -10);

    const slotTimes = ['02:00', '05:00', '08:00', '11:00', '14:00', '17:00', '20:00', '23:00'];
    const intervals3h = slotTimes.map((time) => {
      const h = parseInt(time.split(':')[0], 10);
      let multiplier = 1.0;
      if (h === 8 || h === 5) multiplier = 1.28; // morning inversion
      else if (h === 20 || h === 23) multiplier = 1.22; // night smoke trapping
      else if (h === 14) multiplier = 0.70; // afternoon solar breakup
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

    const aqis = intervals3h.map((s) => s.aqi);
    const avgAqi = Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length);
    const minAqi = Math.min(...aqis);
    const maxAqi = Math.max(...aqis);

    intervals3h.forEach((slot) => {
      slot.diffFromAvg = slot.aqi - avgAqi;
      slot.diffText = slot.diffFromAvg > 0 ? `+${slot.diffFromAvg} vs avg` : `${slot.diffFromAvg} vs avg`;
    });

    let bestSlot = intervals3h[0];
    let worstSlot = intervals3h[0];
    intervals3h.forEach((s) => {
      if (s.aqi < bestSlot.aqi) bestSlot = s;
      if (s.aqi > worstSlot.aqi) worstSlot = s;
    });

    const dayCat = getAQICategory(avgAqi);

    forecast7Days.push({
      date: dateStr,
      dayName: weekday,
      shortDay,
      isToday: dayOffset === 0,
      dayIndex: dayOffset,
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
    });
  }

  const latest = last24Hours[last24Hours.length - 1];
  const all24Aqi = last24Hours.map((h) => h.aqi);
  const avg24 = Math.round(all24Aqi.reduce((a, b) => a + b, 0) / all24Aqi.length);
  let bestHour = last24Hours[0];
  let worstHour = last24Hours[0];
  last24Hours.forEach((h) => {
    if (h.aqi < bestHour.aqi) bestHour = h;
    if (h.aqi > worstHour.aqi) worstHour = h;
  });

  return {
    timezone,
    location: {
      latitude: lat,
      longitude: lon,
      city: cityName
    },
    scale: 'CPCB National AQI (0-500)',
    standard: 'Estimated NAQI (from PM2.5 and PM10)',
    currentAqi: latest.aqi,
    currentHour: latest.hour,
    dominantPollutant: 'PM2.5',
    averageAqi24h: avg24,
    bestHour24h: { hour: bestHour.hour, aqi: bestHour.aqi },
    worstHour24h: { hour: worstHour.hour, aqi: worstHour.aqi },
    cleanestWindowTip: `Cleanest window was around ${bestHour.hour} (Estimated NAQI ${bestHour.aqi}). Safest window for outdoor activity or airing your space.`,
    last24Hours,
    forecast7Days,
    attribution: 'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
    disclaimer: 'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
    medicalDisclaimer: 'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
    isSample: true,
    source: 'Simulation Mode (Sample data, live data unavailable)'
  };
}

export async function onRequestOptions(context) {
  const { request } = context;
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request)
  });
}

export async function onRequestGet(context) {
  const { request } = context;
  const clientIp =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1';

  // Per-IP rate limiting
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please wait a moment before retrying.'
      }),
      {
        status: 429,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': 'application/json'
        }
      }
    );
  }

  const url = new URL(request.url);

  // 1. Geocoding search handler: ?search=city or ?q=city
  // Restricted and biased to India (country code IN)
  const rawSearch = url.searchParams.get('search') || url.searchParams.get('q');
  if (rawSearch) {
    const trimmed = rawSearch.trim().slice(0, 60).replace(/[^a-zA-Z0-9\s.,\-_'()]/g, '');
    if (trimmed.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': 'application/json'
        }
      });
    }

    try {
      const canonicalQuery = INDIAN_CITY_ALIASES[trimmed.toLowerCase()] || trimmed;
      // Query Open-Meteo Geocoding with countrycode=IN to restrict to India
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(canonicalQuery)}&count=10&language=en&format=json&countrycode=IN`;
      const geoRes = await fetch(geoUrl, {
        headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
        signal: AbortSignal.timeout(6000)
      });

      if (!geoRes.ok) {
        throw new Error(`Geocoding failed with status ${geoRes.status}`);
      }

      const geoData = await geoRes.json();
      let results = (geoData.results || [])
        .filter((r) => !r.country_code || r.country_code.toUpperCase() === 'IN' || r.country === 'India')
        .sort((a, b) => (b.population || 0) - (a.population || 0))
        .map((r) => ({
          name: r.name,
          country: 'India',
          admin1: r.admin1 || '',
          latitude: r.latitude,
          longitude: r.longitude,
          population: r.population || 0,
          timezone: r.timezone || 'Asia/Kolkata'
        }));

      // If no online results, check Indian Metros preset list
      if (results.length === 0) {
        results = INDIAN_METROS.filter((m) =>
          m.name.toLowerCase().includes(canonicalQuery.toLowerCase()) ||
          m.name.toLowerCase().includes(trimmed.toLowerCase())
        ).map((m) => ({
          name: m.name,
          country: 'India',
          admin1: m.admin1,
          latitude: m.lat,
          longitude: m.lon,
          timezone: 'Asia/Kolkata'
        }));
      }

      return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.warn('Geocoding search failed, providing Indian fallback list:', err);
      const filtered = INDIAN_METROS.filter((item) =>
        item.name.toLowerCase().includes(trimmed.toLowerCase())
      ).map((m) => ({
        name: m.name,
        country: 'India',
        admin1: m.admin1,
        latitude: m.lat,
        longitude: m.lon,
        timezone: 'Asia/Kolkata'
      }));

      return new Response(JSON.stringify({ results: filtered }), {
        status: 200,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // 2. Timeline handler: ?lat=...&lon=...
  // Default to Kolkata (22.5726, 88.3639)
  const latStr = url.searchParams.get('lat') || url.searchParams.get('latitude');
  const lonStr = url.searchParams.get('lon') || url.searchParams.get('longitude');
  const rawCity = url.searchParams.get('city') || 'Kolkata';
  const cityName = rawCity.trim().slice(0, 60).replace(/[^a-zA-Z0-9\s.,\-_'()]/g, '') || 'Kolkata';

  const lat = parseFloat(latStr || '22.5726');
  const lon = parseFloat(lonStr || '88.3639');

  // Input validation
  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return new Response(
      JSON.stringify({
        error: 'Invalid coordinates',
        message: 'Latitude must be between -90 and 90, and longitude between -180 and 180.'
      }),
      {
        status: 400,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': 'application/json'
        }
      }
    );
  }

  try {
    // Open-Meteo air quality query with hourly pm2_5 and pm10, past_days=1, forecast_days=7, timezone=auto
    const apiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10&past_days=1&forecast_days=7&timezone=auto`;
    const upstreamRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
      signal: AbortSignal.timeout(8000)
    });

    if (!upstreamRes.ok) {
      throw new Error(`Open-Meteo responded with status ${upstreamRes.status}`);
    }

    const data = await upstreamRes.json();
    const timezone = data.timezone || 'Asia/Kolkata';
    const times = data.hourly?.time || [];
    const pm25s = data.hourly?.pm2_5 || [];
    const pm10s = data.hourly?.pm10 || [];

    if (times.length === 0) {
      throw new Error('No hourly data returned from Open-Meteo.');
    }

    // Helper: compute rolling 24-hour average for a given index i
    // Returns rolling average of pm2_5 and pm10 over up to 24 preceding hours
    function getRolling24hAvg(arr, idx) {
      const start = Math.max(0, idx - 23);
      let sum = 0;
      let count = 0;
      for (let k = start; k <= idx; k++) {
        if (typeof arr[k] === 'number' && !isNaN(arr[k])) {
          sum += arr[k];
          count++;
        }
      }
      return count > 0 ? sum / count : (arr[idx] ?? 0);
    }

    // Compute CPCB NAQI for each hourly point using rolling 24-hour average where available
    const points = times.map((t, i) => {
      const rawPm25 = pm25s[i];
      const rawPm10 = pm10s[i];
      const rollingPm25 = getRolling24hAvg(pm25s, i);
      const rollingPm10 = getRolling24hAvg(pm10s, i);

      const naqiRes = calculateCPCBNAQI(rollingPm25, rollingPm10);
      const cat = getAQICategory(naqiRes.aqi);
      const hourStr = t.split('T')[1] || '00:00';

      return {
        time: t,
        date: t.split('T')[0],
        hour: hourStr,
        aqi: naqiRes.aqi,
        dominant: naqiRes.dominant,
        pm25: typeof rawPm25 === 'number' ? Math.round(rawPm25 * 10) / 10 : null,
        pm10: typeof rawPm10 === 'number' ? Math.round(rawPm10 * 10) / 10 : null,
        rollingPm25: Math.round(rollingPm25 * 10) / 10,
        rollingPm10: Math.round(rollingPm10 * 10) / 10,
        category: cat.name,
        color: cat.color,
        badgeClass: cat.badgeClass,
        healthImpact: cat.healthImpact
      };
    });

    // 24 Hours slice: Up to current hour or most recent valid index
    let latestValidIdx = points.length - 1;
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i].aqi !== null) {
        latestValidIdx = i;
        break;
      }
    }

    // Index 24 roughly corresponds to today 00:00 in past_days=1
    // Choose a 24-hour slice ending around current hour
    const currentHourIdx = Math.min(latestValidIdx, 36);
    const start24Idx = Math.max(0, currentHourIdx - 23);
    const last24Slice = points.slice(start24Idx, start24Idx + 24);

    let lastValidAqi = 150;
    const last24Hours = last24Slice.map((p) => {
      if (p.aqi !== null) {
        lastValidAqi = p.aqi;
      } else {
        p.aqi = lastValidAqi;
        const cat = getAQICategory(p.aqi);
        p.category = cat.name;
        p.color = cat.color;
        p.badgeClass = cat.badgeClass;
        p.healthImpact = cat.healthImpact;
      }
      return p;
    });

    // Group forecast by date
    const dayMap = {};
    points.forEach((p) => {
      if (!dayMap[p.date]) dayMap[p.date] = [];
      dayMap[p.date].push(p);
    });

    const dates = Object.keys(dayMap).sort();
    // Index 0 is past_days=1 (yesterday). Today is index 1.
    const forecastDates = dates.length > 7 ? dates.slice(1, 8) : dates.slice(0, 7);

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const targetSlotHours = ['02:00', '05:00', '08:00', '11:00', '14:00', '17:00', '20:00', '23:00'];

    const forecast7Days = forecastDates.map((dateStr, dayIndex) => {
      const dayPoints = dayMap[dateStr] || [];
      const dObj = new Date(dateStr + 'T12:00:00Z');
      const weekday = weekdays[dObj.getUTCDay()];
      const shortDay = shortDays[dObj.getUTCDay()];

      // 3-hour intervals: exactly 02:00, 05:00, 08:00, 11:00, 14:00, 17:00, 20:00, 23:00
      const intervals3h = targetSlotHours.map((slotTime) => {
        const found = dayPoints.find((p) => p.hour === slotTime);
        let aqiVal = found?.aqi;
        if (aqiVal == null) {
          const nearest = dayPoints.find((p) => p.aqi != null);
          aqiVal = nearest ? nearest.aqi : 160;
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

    const latest = last24Hours[last24Hours.length - 1];
    const all24Aqi = last24Hours.map((h) => h.aqi);
    const avg24 = Math.round(all24Aqi.reduce((a, b) => a + b, 0) / all24Aqi.length);
    let bestHour = last24Hours[0];
    let worstHour = last24Hours[0];
    last24Hours.forEach((h) => {
      if (h.aqi < bestHour.aqi) bestHour = h;
      if (h.aqi > worstHour.aqi) worstHour = h;
    });

    const responsePayload = {
      timezone,
      location: {
        latitude: lat,
        longitude: lon,
        city: cityName,
        country: 'India'
      },
      scale: 'CPCB National AQI (0-500)',
      standard: 'Estimated NAQI (from PM2.5 and PM10)',
      currentAqi: latest.aqi,
      currentHour: latest.hour,
      dominantPollutant: latest.dominant || 'PM2.5',
      averageAqi24h: avg24,
      bestHour24h: { hour: bestHour.hour, aqi: bestHour.aqi },
      worstHour24h: { hour: worstHour.hour, aqi: worstHour.aqi },
      cleanestWindowTip: `Cleanest window was around ${bestHour.hour} (Estimated NAQI ${bestHour.aqi}). Safest window for outdoor activity or airing your space.`,
      last24Hours,
      forecast7Days,
      attribution: 'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
      disclaimer: 'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
      medicalDisclaimer: 'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
      isSample: false,
      source: 'Open-Meteo CAMS Model (Live Feed)'
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        ...getCorsHeaders(request),
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.warn('Open-Meteo request failed, serving clearly labelled sample data:', err);
    const sampleData = generateSampleTimelineData(lat, lon, cityName);
    sampleData.simulationReason = 'Upstream atmospheric service temporarily unavailable; using atmospheric simulation model.';
    return new Response(JSON.stringify(sampleData), {
      status: 200,
      headers: {
        ...getCorsHeaders(request),
        'Content-Type': 'application/json'
      }
    });
  }
}
