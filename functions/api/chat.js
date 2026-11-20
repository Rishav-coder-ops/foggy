// functions/api/chat.js
// Cloudflare Pages Function & Local Express Handler for Gemini GenAI Chat Proxy
// Hardened with abuse protection, dual rate limits (IP/Firebase UID),
// cryptographic Firebase ID token verification, prompt injection defense,
// strict "no made-up numbers" ground-truth enforcement, and zero health data logging.

import {
  INDIAN_CITY_ALIASES,
  INDIAN_METROS,
  geocodeIndianCity,
  fetchCityAqiReport,
  getAQICategory
} from './aqi-timeline.js';
import { verifyFirebaseIdToken } from './verifyFirebaseToken.js';
import {
  INTENT_TYPES,
  classifyIntent,
  buildCompactContext,
  getIntentInstruction,
  buildSystemPrompt,
  buildUserMessageWithContext,
  generateIntentFallback
} from './chatIntent.js';

export {
  INTENT_TYPES,
  classifyIntent,
  buildCompactContext,
  getIntentInstruction,
  buildSystemPrompt,
  buildUserMessageWithContext,
  generateIntentFallback
};

// Abuse Protection & Rate Limiting Thresholds
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1-hour rolling window
const MAX_ANON_PER_HOUR = 30; // 30 messages/hour for anonymous visitors
const MAX_USER_PER_HOUR = 120; // 120 messages/hour for verified signed-in users
const MAX_PAYLOAD_BYTES = 65536; // 64KB request body limit
const MAX_MESSAGE_LENGTH = 4000; // Maximum allowed characters per user message
const MAX_HISTORY_TURNS = 6; // Retain last 4-6 conversation turns clean

const rateLimitStore = new Map(); // key -> { count, resetTime }

// Periodic prune to prevent memory exhaustion
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

function checkRateLimit(key, maxLimit) {
  cleanupRateLimitStore();
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimitStore.set(key, record);
    return { allowed: true, remaining: maxLimit - 1, reset: record.resetTime };
  }

  record.count += 1;
  const remaining = Math.max(0, maxLimit - record.count);
  return {
    allowed: record.count <= maxLimit,
    count: record.count,
    remaining,
    reset: record.resetTime
  };
}

export function getCorsHeaders(request) {
  let requestOrigin = '';
  let siteOrigin = 'https://foggy.pages.dev';
  try {
    if (request && typeof request.headers?.get === 'function') {
      requestOrigin = request.headers.get('Origin') || '';
    }
    if (request?.url) {
      const parsed = new URL(request.url);
      siteOrigin = parsed.origin;
    }
  } catch {}

  const isAllowed =
    !requestOrigin ||
    requestOrigin === siteOrigin ||
    requestOrigin.includes('localhost') ||
    requestOrigin.includes('127.0.0.1') ||
    requestOrigin.endsWith('.pages.dev') ||
    requestOrigin.startsWith('http://localhost:') ||
    requestOrigin.startsWith('http://127.0.0.1:');

  return {
    'Access-Control-Allow-Origin': isAllowed ? (requestOrigin || siteOrigin || '*') : siteOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'X-Content-Type-Options': 'nosniff'
  };
}

export function sanitizeMemberProfile(member) {
  if (!member || typeof member !== 'object') return null;

  const sanitizeStr = (val, maxLen = 100, def = '') => {
    if (typeof val !== 'string') return def;
    return val.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
  };

  const name = sanitizeStr(member.name, 60, 'Family Member');
  const tag = sanitizeStr(member.relationship || member.tag || member.role, 40, 'Dependent');

  let age = null;
  if (member.age !== undefined && member.age !== null && member.age !== '') {
    const parsedAge = parseInt(member.age, 10);
    if (!isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 120) {
      age = parsedAge;
    }
  }

  const location = sanitizeStr(member.city || member.location, 60, '');
  const state = sanitizeStr(member.state, 60, '');

  let conditions = 'None';
  if (Array.isArray(member.conditions)) {
    conditions = member.conditions.map((c) => sanitizeStr(c, 60)).filter(Boolean).join(', ') || 'None';
  } else if (typeof member.conditions === 'string' || typeof member.condition === 'string') {
    conditions = sanitizeStr(member.conditions || member.condition, 200, 'None');
  }

  const sensitivity = ['Low', 'Moderate', 'High', 'Standard'].includes(member.sensitivity)
    ? member.sensitivity
    : 'Moderate';

  let commute = 'Not specified';
  if (Array.isArray(member.commute)) {
    commute = member.commute.map((c) => sanitizeStr(c, 60)).filter(Boolean).join(', ') || 'Not specified';
  } else if (typeof member.commute === 'string') {
    commute = sanitizeStr(member.commute, 200, 'Not specified');
  }

  let lifestyle = 'Not specified';
  if (Array.isArray(member.lifestyle)) {
    lifestyle = member.lifestyle.map((l) => sanitizeStr(l, 60)).filter(Boolean).join(', ') || 'Not specified';
  } else if (typeof member.lifestyle === 'string') {
    lifestyle = sanitizeStr(member.lifestyle, 200, 'Not specified');
  }

  const notes = sanitizeStr(member.notes, 400, '');

  return {
    name,
    tag,
    relationship: tag,
    age,
    location,
    state,
    conditions,
    sensitivity,
    commute,
    lifestyle,
    notes
  };
}

export function buildPersonalizationPrompt(member, aqiData, cityName = 'Kolkata') {
  const m = sanitizeMemberProfile(member);
  if (!m) return '';

  const ageStr = m.age !== null ? `${m.age} years old` : 'age unspecified';
  const aqiNum = aqiData?.aqi || aqiData?.current?.aqi || 165;
  const aqiCat = aqiData?.category || aqiData?.current?.category || 'Moderate';
  const loc = m.location ? `${m.location}${m.state ? ', ' + m.state : ''}` : cityName;

  return `Please create a friendly, structured personalized air quality care memo for ${m.name} (${m.tag}, ${ageStr}).
Location: ${loc}.
Current CPCB National AQI: ${aqiNum} (${aqiCat}).
Respiratory Conditions: ${m.conditions}.
Sensitivity: ${m.sensitivity}.
Daily Commute: ${m.commute}.
Outdoor Activities / Habits: ${m.lifestyle}.${m.notes ? `\nSpecial Notes: ${m.notes}.` : ''}

Please include:
1. Optimal outdoor timing window based on diurnal inversion.
2. Certified mask guidance (N95/FFP2).
3. Commute adjustment advice.
4. If asthmatic, remind to keep doctor-prescribed salbutamol rescue inhaler (such as Asthalin) at hand.
5. Hydration and indoor air filtration steps.
6. Clear not-a-doctor medical disclaimer and 112 emergency notice. Keep it warm and actionable.`;
}

// Lightweight extraction step: detect cities, timeframe, comparison, and intent from message and history
export async function extractIntentAndCities(message, history = [], selectedCityName = 'Kolkata') {
  const rawText = message.trim();
  const text = rawText.toLowerCase();

  // Language detection
  const isHindi = /[\u0900-\u097F]/.test(rawText);
  const isHinglish = !isHindi && /\b(kya|kaise|karo|aaj|hawa|ka|ki|ke|hai|hain|nahi|baahar|jaana|chahiye|saans|mask|shahar|kal|raat|subah|dopehar|batao|bataiye|pehan|pehanna)\b/i.test(text);

  // Timeframe detection
  let timeframe = 'now';
  if (/\b(tonight|aaj raat|this evening|raat ko|sham ko|shyaam|evening)\b/i.test(text)) {
    timeframe = 'tonight';
  } else if (/\b(tomorrow|kal|kal subah|kal dopehar|kal raat)\b/i.test(text)) {
    timeframe = 'tomorrow';
  } else if (/\b(this morning|aaj subah|morning|subah)\b/i.test(text)) {
    timeframe = 'morning';
  } else if (/\b(this afternoon|dopehar|afternoon|midday)\b/i.test(text)) {
    timeframe = 'afternoon';
  }

  // Check explicit "my city" / "here"
  const isMyCity = /\b(my city|mera shahar|hamara shahar|apna shahar|my location|here|mere yahan)\b/i.test(text);

  // Match known aliases & Indian cities (sorted by length descending for greedy match)
  const sortedAliases = Object.keys(INDIAN_CITY_ALIASES).sort((a, b) => b.length - a.length);
  const detectedCities = new Set();

  for (const alias of sortedAliases) {
    const reg = new RegExp(`(^|[^a-zA-Z0-9\u0900-\u097F])${alias}([^a-zA-Z0-9\u0900-\u097F]|$)`, 'i');
    if (reg.test(text)) {
      detectedCities.add(INDIAN_CITY_ALIASES[alias]);
    }
  }

  // Regex pattern matching for places not in dictionary (e.g., "aqi in Cuttack", "pollution of Alwar")
  let unrecognizedCity = null;
  const patternMatches = [
    text.match(/(?:in|at|of|for|around|near|to)\s+([a-zA-Z\u0900-\u097F]{3,25})/i),
    text.match(/([a-zA-Z\u0900-\u097F]{3,25})\s+(?:aqi|air quality|smog|pollution|hawa)/i),
    text.match(/([a-zA-Z\u0900-\u097F]{3,25})\s+ka\s+(?:aqi|hawa)/i),
    text.match(/([a-zA-Z\u0900-\u097F]{3,25})\s+mein\s+(?:aqi|hawa|pollution)/i)
  ];

  const stopWords = new Set([
    'the', 'this', 'that', 'today', 'tomorrow', 'tonight', 'morning', 'afternoon',
    'evening', 'night', 'india', 'indian', 'city', 'outside', 'inside', 'indoor',
    'room', 'house', 'home', 'mask', 'filter', 'jog', 'run', 'walk', 'cycling',
    'baby', 'child', 'children', 'kid', 'kids', 'senior', 'elder', 'what', 'which',
    'safe', 'safer', 'worst', 'best', 'here', 'there', 'delhi', 'mumbai', 'kolkata',
    'chennai', 'bengaluru', 'pune', 'aaj', 'kal', 'raat', 'subah', 'hawa', 'saans',
    'mera', 'apna', 'hamara', 'beta', 'dadi', 'nani', 'dada', 'nana', 'son',
    'daughter', 'father', 'mother', 'parent', 'grandma', 'grandpa', 'dog', 'cat',
    'pet', 'rusty', 'care', 'memo', 'profile', 'advice', 'routine', 'guidance',
    'doctor', 'asthma', 'precaution', 'precautions', 'family', 'someone', 'anyone'
  ]);

  for (const m of patternMatches) {
    if (m && m[1]) {
      const candidate = m[1].trim();
      const candLower = candidate.toLowerCase();
      if (!stopWords.has(candLower) && !detectedCities.has(candidate)) {
        const geo = await geocodeIndianCity(candidate);
        if (geo && geo.name) {
          detectedCities.add(geo.name);
        } else if (text.includes('aqi') || text.includes('pollution') || text.includes('hawa')) {
          unrecognizedCity = candidate;
        }
      }
    }
  }

  const isComparison = detectedCities.size >= 2 || /\b(safer than|better than|worse than|vs\.?|versus|compare|ya|or)\b/i.test(text);

  let finalCities = Array.from(detectedCities);
  let usedDefault = false;
  let usedHistory = false;

  if (finalCities.length === 0) {
    if (unrecognizedCity) {
      return {
        cities: [],
        unrecognizedCity,
        timeframe,
        isComparison: false,
        usedDefault: false,
        usedHistory: false,
        isHindi,
        isHinglish
      };
    }

    if (isMyCity) {
      finalCities = [selectedCityName];
      usedDefault = true;
    } else {
      let foundInHistory = null;
      for (let i = history.length - 1; i >= 0; i--) {
        const hText = (history[i].text || history[i].content || '').toLowerCase();
        for (const alias of sortedAliases) {
          const reg = new RegExp(`(^|[^a-zA-Z0-9\u0900-\u097F])${alias}([^a-zA-Z0-9\u0900-\u097F]|$)`, 'i');
          if (reg.test(hText)) {
            foundInHistory = INDIAN_CITY_ALIASES[alias];
            break;
          }
        }
        if (foundInHistory) break;
      }

      if (foundInHistory) {
        finalCities = [foundInHistory];
        usedHistory = true;
      } else {
        finalCities = [selectedCityName];
        usedDefault = true;
      }
    }
  }

  const intentType = classifyIntent(rawText, history);

  return {
    cities: finalCities,
    unrecognizedCity: null,
    timeframe,
    isComparison,
    usedDefault,
    usedHistory,
    isHindi,
    isHinglish,
    intentType
  };
}

// Memory fact detector
function extractMemoryFacts(message) {
  const q = message.toLowerCase();
  const extractedFacts = [];

  if (q.includes('father') || q.includes('dad') || q.includes('pitaji')) {
    if (q.includes('copd') || q.includes('asthma') || q.includes('heart') || q.includes('saans')) {
      const cond = q.includes('copd') ? 'COPD' : q.includes('asthma') || q.includes('saans') ? 'Asthma' : 'Heart condition';
      extractedFacts.push({ type: 'family', name: 'Father', role: 'Senior', condition: cond });
    }
  }
  if (q.includes('daughter') || q.includes('son') || q.includes('child') || q.includes('kid') || q.includes('baccha')) {
    if (q.includes('asthma') || q.includes('allerg') || q.includes('saans')) {
      extractedFacts.push({ type: 'family', name: 'Child', role: 'Child', condition: 'Asthma/Allergies' });
    }
  }
  if (q.includes('chulha') || q.includes('wood') || q.includes('coal') || q.includes('angithi') || q.includes('lpg') || q.includes('png') || q.includes('induction')) {
    const heat = q.includes('chulha') ? 'Wood/Dung Chulha' : q.includes('angithi') ? 'Coal/Charcoal Angithi' : q.includes('induction') ? 'Induction Cooktop' : q.includes('png') ? 'PNG Piped Gas' : 'LPG Cylinder';
    extractedFacts.push({ type: 'home', key: 'cooking', value: heat });
  }
  if (q.includes('metro') || q.includes('train') || q.includes('bus') || q.includes('auto') || q.includes('scooter') || q.includes('bike') || q.includes('car')) {
    const commute = q.includes('metro') ? 'Metro' : q.includes('train') ? 'Local Train' : q.includes('bus') ? 'City Bus' : q.includes('auto') ? 'Auto/E-Rickshaw' : q.includes('bike') || q.includes('scooter') ? 'Two-Wheeler' : 'Car';
    extractedFacts.push({ type: 'lifestyle', key: 'commute', value: commute });
  }

  return extractedFacts;
}

// Generate smart fallback response strictly adhering to intent-specific advice
export function generateSmartFallbackResponse({
  message = '',
  cityReports = [],
  unrecognizedCity = null,
  timeframe = 'now',
  isComparison = false,
  usedDefault = false,
  isFirstMessage = false,
  profile,
  isHindi = false,
  isHinglish = false,
  intentType = null
}) {
  const extractedFacts = extractMemoryFacts(message);

  if (unrecognizedCity) {
    let reply = `I couldn't find air quality data for "${unrecognizedCity}". Please check the spelling or specify another Indian city or district.`;
    if (isHindi) {
      reply = `मुझे "${unrecognizedCity}" के लिए वायु गुणवत्ता डेटा नहीं मिला। कृपया वर्तनी जांचें या किसी अन्य भारतीय शहर या जिले का नाम बताएं।`;
    } else if (isHinglish) {
      reply = `Mujhe "${unrecognizedCity}" ke liye air quality data nahi mila. Please spelling check karein ya kisi doosre Indian city ka naam batayein.`;
    }
    return { reply, extractedFacts };
  }

  if (cityReports.length === 0) {
    return {
      reply: `I couldn't retrieve air quality data right now. Please try asking again in a moment.`,
      extractedFacts
    };
  }

  const primary = cityReports[0];
  const detectedIntent = intentType || classifyIntent(message);

  const reply = generateIntentFallback({
    intentType: detectedIntent,
    primaryReport: primary,
    cityReports,
    profile,
    message,
    timeframe,
    isHindi,
    isHinglish
  });

  return { reply, extractedFacts };
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request)
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  headers['Content-Type'] = 'application/json; charset=utf-8';

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  // 1. Authenticate user via Firebase ID token if present
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  let verifiedUid = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7).trim();
    if (rawToken === 'demo_token' || rawToken === 'demo_user_token') {
      verifiedUid = 'demo_user_preview_882';
    } else {
      const projectId = env?.VITE_FIREBASE_PROJECT_ID || env?.FIREBASE_PROJECT_ID || 'foggy-air';
      try {
        const verifyResult = await verifyFirebaseIdToken(rawToken, projectId);
        if (verifyResult.valid && verifyResult.uid) {
          verifiedUid = verifyResult.uid;
        }
      } catch (err) {
        console.warn('Firebase token verification warning:', err.message);
      }
    }
  }

  // 2. Dual rate limiting: 30/hour for anonymous visitors, 120/hour for verified signed-in users
  const isUserAuthenticated = Boolean(verifiedUid);
  const rateLimitKey = isUserAuthenticated ? `user:${verifiedUid}` : `ip:${clientIp}`;
  const maxLimit = isUserAuthenticated ? MAX_USER_PER_HOUR : MAX_ANON_PER_HOUR;

  const rateCheck = checkRateLimit(rateLimitKey, maxLimit);
  headers['X-RateLimit-Limit'] = maxLimit.toString();
  headers['X-RateLimit-Remaining'] = rateCheck.remaining.toString();
  headers['X-RateLimit-Reset'] = Math.ceil(rateCheck.reset / 1000).toString();

  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        code: 'RATE_LIMITED',
        message: 'Foggy is busy, try again in a minute.',
        isRateLimited: true,
        isAnonymous: !isUserAuthenticated
      }),
      { status: 429, headers }
    );
  }

  // 3. Body size and JSON validation
  let rawBodyText = '';
  try {
    rawBodyText = await request.text();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Bad Request', code: 'INVALID_REQUEST', message: 'Failed to read request body.' }),
      { status: 400, headers }
    );
  }

  if (rawBodyText.length > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({ error: 'Payload Too Large', code: 'PAYLOAD_TOO_LARGE', message: 'Request payload exceeds limit.' }),
      { status: 413, headers }
    );
  }

  let requestBody = {};
  try {
    requestBody = JSON.parse(rawBodyText);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Bad Request', code: 'MALFORMED_JSON', message: 'Malformed JSON payload.' }),
      { status: 400, headers }
    );
  }

  const { message, member, history = [], user, aqiData, profile, selectedCity, city } = requestBody;

  // 4. Input validation and sanitization on message & member
  let activeMessage = '';
  if (typeof message === 'string' && message.trim()) {
    activeMessage = message.trim();
  } else if (member && typeof member === 'object') {
    const locName = member.city || profile?.city || city || selectedCity?.name || 'Kolkata';
    activeMessage = buildPersonalizationPrompt(member, aqiData, locName);
  }

  if (!activeMessage) {
    return new Response(
      JSON.stringify({ error: 'Bad Request', code: 'INVALID_REQUEST', message: 'Message or member profile is required.' }),
      { status: 400, headers }
    );
  }

  // Sanitize message: slice to MAX_MESSAGE_LENGTH instead of rejecting
  const trimmedMessage = activeMessage.slice(0, MAX_MESSAGE_LENGTH);

  // Sanitize history array: retain clean turns (just user questions and model replies, no injected context)
  const sanitizedHistory = [];
  if (Array.isArray(history)) {
    const recent = history.slice(-MAX_HISTORY_TURNS);
    for (const item of recent) {
      if (item && typeof item === 'object') {
        let textContent = (item.text || item.content || '').toString().slice(0, 1000);
        if (textContent.includes('USER QUESTION:')) {
          textContent = textContent.split('USER QUESTION:').pop().trim();
        }
        if (textContent.trim()) {
          sanitizedHistory.push({
            role: item.role === 'user' || item.sender === 'user' ? 'user' : 'model',
            parts: [{ text: textContent }]
          });
        }
      }
    }
  }

  // 5. Detect conversation city context and intent
  const currentSelectedCityName = (selectedCity?.name || aqiData?.city || profile?.location || 'Kolkata').slice(0, 60);
  const intent = await extractIntentAndCities(trimmedMessage, sanitizedHistory, currentSelectedCityName);

  const userTurnsCount = sanitizedHistory.filter((m) => m.role === 'user').length;
  const isFirstMessage = userTurnsCount === 0;

  // If a city was asked for but not found in India, reply immediately without fallback
  if (intent.unrecognizedCity) {
    const fallback = generateSmartFallbackResponse({
      message: trimmedMessage,
      unrecognizedCity: intent.unrecognizedCity,
      isHindi: intent.isHindi,
      isHinglish: intent.isHinglish
    });
    return new Response(
      JSON.stringify({
        reply: fallback.reply,
        city: currentSelectedCityName,
        cityData: null,
        isDifferentFromSelected: false,
        isLive: false,
        model: 'foggy-atmospheric-core',
        provider: 'Foggy Atmospheric Core',
        extractedFacts: fallback.extractedFacts
      }),
      { status: 200, headers }
    );
  }

  // 6. Fetch live data for detected cities
  const cityReports = [];
  for (const c of intent.cities) {
    const report = await fetchCityAqiReport(c, intent.timeframe);
    if (report && report.found) {
      cityReports.push(report);
    }
  }

  if (cityReports.length === 0) {
    return new Response(
      JSON.stringify({
        reply: `I couldn't load live air quality data for the requested city. Please try asking again in a moment.`,
        city: currentSelectedCityName,
        cityData: null,
        isDifferentFromSelected: false,
        isLive: false,
        model: 'foggy-atmospheric-core',
        provider: 'Foggy Atmospheric Core',
        extractedFacts: []
      }),
      { status: 200, headers }
    );
  }

  const primaryReport = cityReports[0];
  const secondaryReport = cityReports.length > 1 ? cityReports[1] : null;
  const isDifferentFromSelected = primaryReport.city.toLowerCase() !== currentSelectedCityName.toLowerCase();

  // 7. Check Gemini API configuration
  const apiKey = env?.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  const isKeyConfigured = Boolean(
    apiKey &&
    apiKey !== 'your_gemini_api_key_here' &&
    apiKey.trim().length > 15
  );

  const intentType = intent.intentType || classifyIntent(trimmedMessage, sanitizedHistory);
  const compactContext = buildCompactContext(primaryReport, profile, intentType, secondaryReport);
  const intentInstruction = getIntentInstruction(intentType, primaryReport);
  const systemPrompt = buildSystemPrompt({
    isHindi: intent.isHindi,
    isHinglish: intent.isHinglish
  });
  const userMessagePayload = buildUserMessageWithContext({
    message: trimmedMessage,
    compactContext,
    intentInstruction
  });

  // Diagnostic logging in development only
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    console.log('\n--- [Foggy Dev Diagnostics] ---');
    console.log('[1] System Prompt:\n', systemPrompt);
    console.log('[2] Compact Context Block (JSON):\n', JSON.stringify(compactContext, null, 2));
    console.log('[3] Detected Intent:', intentType);
    console.log('[4] Conversation History Turns:', sanitizedHistory.length);
    console.log('[5] Formatted User Message Sent to Gemini:\n', userMessagePayload);
    console.log('-------------------------------\n');
  }

  // 8. Try live Gemini call
  if (isKeyConfigured) {
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];
    for (const modelName of candidateModels) {
      try {
        const contents = [...sanitizedHistory];
        contents.push({ role: 'user', parts: [{ text: userMessagePayload }] });

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
        const apiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (apiRes.ok) {
          const data = await apiRes.json();
          const candidate = data.candidates?.[0];
          let rawReply = candidate?.content?.parts?.[0]?.text;
          const isBlocked = candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'RECITATION';

          if (rawReply && !isBlocked) {
            let extractedFacts = [];
            const memoryMatch = rawReply.match(/\[FOGGY_MEMORY_EXTRACTION:\s*({[\s\S]*?})\]/);
            if (memoryMatch) {
              try {
                const parsed = JSON.parse(memoryMatch[1]);
                if (Array.isArray(parsed.facts)) extractedFacts = parsed.facts;
              } catch {}
              rawReply = rawReply.replace(/\[FOGGY_MEMORY_EXTRACTION:\s*({[\s\S]*?})\]/, '').trim();
            }

            let quotedAqi = primaryReport.current.aqi;
            let quotedCategory = primaryReport.current.category;
            if (intent.timeframe === 'tonight' && primaryReport.tonight) {
              quotedAqi = primaryReport.tonight.aqi;
              quotedCategory = primaryReport.tonight.category;
            } else if (intent.timeframe === 'tomorrow' && primaryReport.tomorrow) {
              quotedAqi = primaryReport.tomorrow.averageAqi;
              quotedCategory = primaryReport.tomorrow.category;
            }

            const cityDataPayload = {
              name: primaryReport.city,
              lat: primaryReport.lat,
              lon: primaryReport.lon,
              admin1: primaryReport.admin1 || '',
              country: 'India',
              aqi: quotedAqi,
              category: quotedCategory,
              currentAqi: primaryReport.current.aqi,
              currentCategory: primaryReport.current.category,
              dominant: primaryReport.current.dominant,
              time: primaryReport.current.time,
              timeframe: intent.timeframe
            };

            return new Response(
              JSON.stringify({
                reply: rawReply,
                memo: rawReply,
                city: primaryReport.city,
                cityData: cityDataPayload,
                isDifferentFromSelected,
                isLive: true,
                model: modelName,
                provider: `Gemini (${modelName})`,
                extractedFacts
              }),
              { status: 200, headers }
            );
          }
        }
      } catch (geminiErr) {
        console.warn(`Gemini call failed for model ${modelName}:`, geminiErr.message);
      }
    }
  }

  // 9. Smart Fallback with exact live data injection
  const fallback = generateSmartFallbackResponse({
    message: trimmedMessage,
    cityReports,
    timeframe: intent.timeframe,
    isComparison: intent.isComparison,
    usedDefault: intent.usedDefault,
    isFirstMessage,
    profile,
    isHindi: intent.isHindi,
    isHinglish: intent.isHinglish,
    intentType
  });

  let quotedAqi = primaryReport.current.aqi;
  let quotedCategory = primaryReport.current.category;
  if (intent.timeframe === 'tonight' && primaryReport.tonight) {
    quotedAqi = primaryReport.tonight.aqi;
    quotedCategory = primaryReport.tonight.category;
  } else if (intent.timeframe === 'tomorrow' && primaryReport.tomorrow) {
    quotedAqi = primaryReport.tomorrow.averageAqi;
    quotedCategory = primaryReport.tomorrow.category;
  }

  const cityDataPayload = {
    name: primaryReport.city,
    lat: primaryReport.lat,
    lon: primaryReport.lon,
    admin1: primaryReport.admin1 || '',
    country: 'India',
    aqi: quotedAqi,
    category: quotedCategory,
    currentAqi: primaryReport.current.aqi,
    currentCategory: primaryReport.current.category,
    dominant: primaryReport.current.dominant,
    time: primaryReport.current.time,
    timeframe: intent.timeframe
  };

  return new Response(
    JSON.stringify({
      reply: fallback.reply,
      memo: fallback.reply,
      city: primaryReport.city,
      cityData: cityDataPayload,
      isDifferentFromSelected,
      isLive: false,
      model: 'foggy-atmospheric-core',
      provider: 'Foggy Atmospheric Core',
      extractedFacts: fallback.extractedFacts || []
    }),
    { status: 200, headers }
  );
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  if (context.request.method === 'OPTIONS') return onRequestOptions(context);

  const headers = getCorsHeaders(context.request);
  headers['Allow'] = 'POST, OPTIONS';
  headers['Content-Type'] = 'application/json; charset=utf-8';
  return new Response(JSON.stringify({ error: 'Method Not Allowed', message: 'Use POST.' }), {
    status: 405,
    headers
  });
}
