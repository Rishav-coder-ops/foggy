// shared/chat/cityExtractor.js
/**
 * @fileoverview Robust extraction of mentioned Indian places, timeframe, and comparison intent from user messages.
 * Only detects places when clear location intent is present (prepositions, AQI/weather queries, comparisons, or standalone place names).
 * Strictly guards against false positives using comprehensive English/Hindi/Hinglish stoplists and geocoder validation.
 */

import { INDIAN_CITY_ALIASES, INDIAN_METROS } from '../timeline/constants.js';
import { INDIAN_FALLBACK_CITIES } from '../geocode.js';
import { geocodeIndianCity } from '../timeline/timelineService.js';
import { classifyIntent } from '../chatIntent/intentClassifier.js';

/**
 * Comprehensive stoplist of common English, Hindi, and Hinglish words that must NEVER be treated as place names,
 * even if a geocoder returns an obscure hamlet or POI.
 */
export const PLACE_DETECTION_STOPLIST = new Set([
  // Verbs, actions & movement
  'play',
  'playing',
  'played',
  'plan',
  'planning',
  'planned',
  'run',
  'running',
  'ran',
  'jog',
  'jogging',
  'walk',
  'walking',
  'walks',
  'go',
  'going',
  'went',
  'gone',
  'stay',
  'staying',
  'stayed',
  'stays',
  'leave',
  'leaving',
  'left',
  'travel',
  'traveling',
  'commute',
  'commuting',
  'exercise',
  'exercising',
  'workout',
  'work',
  'working',
  'cycle',
  'cycling',
  'bike',
  'biking',
  'ride',
  'riding',
  'drive',
  'driving',
  'sleep',
  'sleeping',
  'rest',
  'resting',
  'breathe',
  'breathing',
  'cough',
  'coughing',
  'wheeze',
  'wheezing',
  'sneeze',
  'sneezing',
  'help',
  'helping',
  'need',
  'want',
  'tell',
  'show',
  'check',
  'know',
  'think',
  'see',
  'look',
  'make',
  'feel',
  'get',
  'getting',
  'give',
  'take',
  'wear',
  'wearing',
  'use',
  'using',

  // Safety, adjectives & status
  'safe',
  'safer',
  'safety',
  'good',
  'better',
  'best',
  'bad',
  'worse',
  'worst',
  'clean',
  'cleaner',
  'cleanest',
  'dirty',
  'fresh',
  'fine',
  'normal',
  'high',
  'low',
  'moderate',
  'poor',
  'severe',
  'satisfactory',
  'hazardous',
  'dangerous',
  'danger',
  'risk',
  'unrestricted',
  'entirely',
  'completely',
  'perfectly',
  'totally',
  'hot',
  'cold',
  'warm',
  'cool',
  'humid',
  'dry',
  'clear',
  'sunny',
  'rainy',

  // Time & temporal adverbs
  'today',
  'tomorrow',
  'tonight',
  'now',
  'yesterday',
  'morning',
  'afternoon',
  'evening',
  'night',
  'midday',
  'dawn',
  'dusk',
  'day',
  'days',
  'daily',
  'week',
  'weeks',
  'weekly',
  'month',
  'months',
  'year',
  'years',
  'hour',
  'hours',
  'hourly',
  'time',
  'times',
  'early',
  'late',
  'soon',
  'always',
  'never',
  'sometimes',
  'often',

  // People, family, vulnerable groups
  'kid',
  'kids',
  'child',
  'children',
  'baby',
  'babies',
  'infant',
  'infants',
  'toddler',
  'toddlers',
  'son',
  'daughter',
  'boy',
  'girl',
  'father',
  'mother',
  'dad',
  'mom',
  'papa',
  'mummy',
  'parent',
  'parents',
  'senior',
  'seniors',
  'elder',
  'elders',
  'elderly',
  'grandpa',
  'grandma',
  'grandfather',
  'grandmother',
  'family',
  'friend',
  'friends',
  'someone',
  'anyone',
  'everyone',
  'nobody',
  'people',
  'person',
  'human',
  'patient',
  'patients',
  'doctor',
  'physician',
  'specialist',
  'pet',
  'pets',
  'dog',
  'dogs',
  'cat',
  'cats',
  'animal',
  'animals',

  // Health, symptoms, protective gear & medical
  'mask',
  'masks',
  'n95',
  'ffp2',
  'respirator',
  'respirators',
  'filter',
  'filters',
  'purifier',
  'purifiers',
  'hepa',
  'asthma',
  'asthmatic',
  'copd',
  'bronchitis',
  'allergy',
  'allergies',
  'allergic',
  'heart',
  'cardiac',
  'lungs',
  'lung',
  'chest',
  'breath',
  'shortness',
  'inhaler',
  'inhalers',
  'medicine',
  'medicines',
  'medication',
  'precaution',
  'precautions',
  'advice',
  'guidance',
  'routine',
  'memo',
  'care',
  'hospital',
  'clinic',
  'emergency',
  'symptom',
  'symptoms',

  // Places (generic), nouns & environment
  'outside',
  'inside',
  'indoor',
  'indoors',
  'outdoor',
  'outdoors',
  'room',
  'rooms',
  'house',
  'houses',
  'home',
  'homes',
  'window',
  'windows',
  'door',
  'doors',
  'balcony',
  'terrace',
  'roof',
  'rooftop',
  'garden',
  'park',
  'parks',
  'playground',
  'ground',
  'field',
  'street',
  'streets',
  'road',
  'roads',
  'car',
  'cars',
  'bus',
  'metro',
  'train',
  'auto',
  'rickshaw',
  'cab',
  'taxi',
  'school',
  'schools',
  'college',
  'office',
  'offices',
  'market',
  'station',
  'air',
  'quality',
  'aqi',
  'naqi',
  'smog',
  'pollution',
  'pollutant',
  'pollutants',
  'particulate',
  'particulates',
  'pm25',
  'pm10',
  'ozone',
  'weather',
  'forecast',
  'level',
  'levels',
  'reading',
  'readings',
  'scale',
  'standard',
  'index',

  // Pronouns, prepositions, articles & grammar words
  'the',
  'this',
  'that',
  'these',
  'those',
  'a',
  'an',
  'my',
  'your',
  'his',
  'her',
  'its',
  'our',
  'their',
  'mine',
  'yours',
  'ours',
  'theirs',
  'me',
  'you',
  'him',
  'us',
  'them',
  'myself',
  'yourself',
  'himself',
  'herself',
  'itself',
  'ourselves',
  'themselves',
  'what',
  'which',
  'who',
  'whom',
  'whose',
  'where',
  'when',
  'why',
  'how',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'am',
  'do',
  'does',
  'did',
  'done',
  'have',
  'has',
  'had',
  'having',
  'can',
  'could',
  'should',
  'would',
  'may',
  'might',
  'must',
  'shall',
  'will',
  'to',
  'from',
  'of',
  'in',
  'at',
  'on',
  'by',
  'for',
  'with',
  'about',
  'against',
  'between',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'up',
  'down',
  'out',
  'off',
  'over',
  'under',
  'again',
  'further',
  'then',
  'once',
  'here',
  'there',
  'near',
  'nearby',
  'around',
  'about',
  'some',
  'any',
  'no',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'bar',
  'hope',

  // Hindi & Hinglish common vocabulary
  'aaj',
  'kal',
  'parso',
  'raat',
  'sham',
  'shaam',
  'subah',
  'dopehar',
  'din',
  'hawa',
  'saans',
  'sans',
  'baahar',
  'bahar',
  'andar',
  'ghar',
  'kamra',
  'khidki',
  'gaadi',
  'gadi',
  'rasta',
  'sadak',
  'bachha',
  'bachhe',
  'baccha',
  'bacche',
  'beta',
  'beti',
  'maa',
  'baap',
  'pitaji',
  'mataji',
  'dada',
  'dadi',
  'nana',
  'nani',
  'chacha',
  'chachi',
  'bua',
  'bhai',
  'behen',
  'apna',
  'apne',
  'apni',
  'mera',
  'meri',
  'mere',
  'hamara',
  'humara',
  'hamari',
  'humari',
  'tumhara',
  'aapka',
  'aapki',
  'aapke',
  'unka',
  'unki',
  'unke',
  'inka',
  'inki',
  'inke',
  'kya',
  'kyu',
  'kyun',
  'kaise',
  'kaisi',
  'kaisa',
  'kitna',
  'kitni',
  'kitne',
  'kab',
  'kahan',
  'kaun',
  'chahiye',
  'karun',
  'karein',
  'kare',
  'karna',
  'karo',
  'jaana',
  'jana',
  'jao',
  'jaayein',
  'pehan',
  'pehna',
  'pehanna',
  'lagana',
  'lagayein',
  'batao',
  'bataiye',
  'dekho',
  'dekhein',
  'theek',
  'thik',
  'accha',
  'achha',
  'achhi',
  'bura',
  'buri',
  'kharab',
  'khatra',
  'surakshit',
  'asurakshit',
  'dawai',
  'dawa',
  'daktar',
  'aspatal',
  'khansi',
  'dam',
  'dama',
  'zukaam',
  'bukhar',
  'dard',
  'takleef',
  'pareshani',
  'hai',
  'hain',
  'tha',
  'thi',
  'the',
  'hoga',
  'hogi',
  'honge',
  'nahi',
  'mat'
]);

/**
 * Normalizes query string for location comparison.
 */
function cleanLocationCandidate(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/^[\s,.;:!?'"()\-]+|[\s,.;:!?'"()\-]+$/g, '')
    .trim();
}

/**
 * Checks whether candidate token or any sub-word is in the stoplist.
 */
function isStopword(candidate) {
  if (!candidate) return true;
  const lower = candidate.toLowerCase().trim();
  if (PLACE_DETECTION_STOPLIST.has(lower)) return true;
  const words = lower.split(/\s+/);
  if (words.some((w) => PLACE_DETECTION_STOPLIST.has(w))) return true;
  return false;
}

/**
 * Verifies whether a candidate string is an intended, verified Indian place.
 * Enforces exact token match for short words (<= 4 chars) and sensible feature class.
 */
async function verifyCandidateIndianPlace(candidate) {
  if (!candidate || typeof candidate !== 'string') return null;
  const clean = cleanLocationCandidate(candidate);
  if (clean.length < 2 || clean.length > 35) return null;
  if (isStopword(clean)) return null;

  const lower = clean.toLowerCase();

  // 1. Check alias dictionary
  if (INDIAN_CITY_ALIASES[lower]) {
    return INDIAN_CITY_ALIASES[lower];
  }

  // 2. Check predefined metros
  const metroMatch = INDIAN_METROS.find(
    (m) => m.name.toLowerCase() === lower || (m.admin1 && m.admin1.toLowerCase() === lower)
  );
  if (metroMatch) return metroMatch.name;

  // 3. Check predefined fallback cities
  const fallbackMatch = INDIAN_FALLBACK_CITIES.find(
    (c) => c.name.toLowerCase() === lower || c.name.toLowerCase().startsWith(lower)
  );
  if (fallbackMatch && Math.abs(fallbackMatch.name.length - clean.length) <= 3) {
    // Exact match required if short word (<= 4 chars)
    if (clean.length <= 4 && fallbackMatch.name.toLowerCase() !== lower) {
      return null;
    }
    return fallbackMatch.name;
  }

  // 4. Geocode candidate against Open-Meteo
  try {
    const geo = await geocodeIndianCity(clean);
    if (geo && geo.name && (geo.country === 'India' || geo.country_code === 'IN')) {
      // For short words (<= 4 chars), strictly require exact token match
      if (clean.length <= 4 && geo.name.toLowerCase() !== lower) {
        return null;
      }
      return geo.name;
    }
  } catch {}

  return null;
}

/**
 * Extracts candidate place names ONLY when there is clear, unambiguous location intent.
 * Supported patterns:
 * - Standalone place message ("Noida", "Bhubaneswar", "Pune", "Delhi")
 * - Preposition: "in X", "at X", "near X", "around X"
 * - Directed travel/commute: "traveling to X", "commute to X", "heading to X"
 * - Domain metric: "aqi in/of/for X", "air quality in/of/for X", "weather in/of/for X", "X aqi", "X weather"
 * - Comparison: "compare X and Y", "between X and Y"
 * - Hindi/Hinglish: "X ka aqi", "X mein hawa", "X mein pollution"
 */
async function extractLocationCandidates(text, rawText) {
  const candidates = new Set();
  const trimmed = rawText
    .trim()
    .replace(/[?.,!]+$/, '')
    .trim();

  // 1. Standalone Place Name: The entire message is just a place name (1 to 4 words)
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount >= 1 && wordCount <= 4) {
    const cleanCand = cleanLocationCandidate(trimmed);
    if (!isStopword(cleanCand)) {
      const verified = await verifyCandidateIndianPlace(cleanCand);
      if (verified) {
        candidates.add(verified);
        return candidates;
      }
    }
  }

  // 2. Preposition Patterns: "in X", "at X", "near X", "around X", "for X", "about X"
  // (Note: "to" is intentionally excluded as a general preposition to avoid matching English infinitives like "to play")
  const prepMatches = text.matchAll(
    /\b(?:in|at|near|around|for|about)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\b/gi
  );
  for (const m of prepMatches) {
    if (m && m[1]) {
      const cand = cleanLocationCandidate(m[1]);
      if (!isStopword(cand)) {
        const verified = await verifyCandidateIndianPlace(cand);
        if (verified) candidates.add(verified);
      }
    }
  }

  // 3. Directed travel prepositions: "traveling to X", "going to X", "commute to X"
  const travelMatches = text.matchAll(
    /\b(?:traveling\s+to|travelling\s+to|heading\s+to|commute\s+to|trip\s+to|visiting)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\b/gi
  );
  for (const m of travelMatches) {
    if (m && m[1]) {
      const cand = cleanLocationCandidate(m[1]);
      if (!isStopword(cand)) {
        const verified = await verifyCandidateIndianPlace(cand);
        if (verified) candidates.add(verified);
      }
    }
  }

  // 4. Metric preceding Place: "aqi in/of/for X", "air quality of X", "weather for X"
  const metricBeforeMatches = text.matchAll(
    /\b(?:air\s+quality|aqi|naqi|pollution|smog|hawa|weather|mausam|forecast|conditions?|readings?)\s+(?:in|of|at|for)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\b/gi
  );
  for (const m of metricBeforeMatches) {
    if (m && m[1]) {
      const cand = cleanLocationCandidate(m[1]);
      if (!isStopword(cand)) {
        const verified = await verifyCandidateIndianPlace(cand);
        if (verified) candidates.add(verified);
      }
    }
  }

  // 5. Place preceding Metric: "X aqi", "X air quality", "X weather", "X forecast"
  const metricAfterMatches = text.matchAll(
    /\b([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\s+(?:aqi|naqi|air\s+quality|pollution|smog|hawa|weather|mausam|forecast)\b/gi
  );
  for (const m of metricAfterMatches) {
    if (m && m[1]) {
      const cand = cleanLocationCandidate(m[1]);
      if (!isStopword(cand)) {
        const verified = await verifyCandidateIndianPlace(cand);
        if (verified) candidates.add(verified);
      }
    }
  }

  // 6. Hindi / Hinglish Patterns: "X ka aqi/hawa/mausam", "X mein aqi/hawa/pollution"
  const hindiMatches = text.matchAll(
    /\b([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\s+(?:ka|ki|ke|mein|me)\s+(?:aqi|naqi|air\s+quality|hawa|mausam|pollution|smog)\b/gi
  );
  for (const m of hindiMatches) {
    if (m && m[1]) {
      const cand = cleanLocationCandidate(m[1]);
      if (!isStopword(cand)) {
        const verified = await verifyCandidateIndianPlace(cand);
        if (verified) candidates.add(verified);
      }
    }
  }

  // 7. Comparison Patterns: "compare X and Y", "between X and Y"
  const compMatches1 = text.matchAll(
    /\bcompare\s+([A-Za-z\u0900-\u097F]+)\s+(?:and|with|to|vs\.?|versus)\s+([A-Za-z\u0900-\u097F]+)\b/gi
  );
  for (const m of compMatches1) {
    if (m && m[1]) {
      const c1 = cleanLocationCandidate(m[1]);
      if (!isStopword(c1)) {
        const v1 = await verifyCandidateIndianPlace(c1);
        if (v1) candidates.add(v1);
      }
    }
    if (m && m[2]) {
      const c2 = cleanLocationCandidate(m[2]);
      if (!isStopword(c2)) {
        const v2 = await verifyCandidateIndianPlace(c2);
        if (v2) candidates.add(v2);
      }
    }
  }

  const compMatches2 = text.matchAll(
    /\bbetween\s+([A-Za-z\u0900-\u097F]+)\s+and\s+([A-Za-z\u0900-\u097F]+)\b/gi
  );
  for (const m of compMatches2) {
    if (m && m[1]) {
      const c1 = cleanLocationCandidate(m[1]);
      if (!isStopword(c1)) {
        const v1 = await verifyCandidateIndianPlace(c1);
        if (v1) candidates.add(v1);
      }
    }
    if (m && m[2]) {
      const c2 = cleanLocationCandidate(m[2]);
      if (!isStopword(c2)) {
        const v2 = await verifyCandidateIndianPlace(c2);
        if (v2) candidates.add(v2);
      }
    }
  }

  return candidates;
}

/**
 * Primary extractor for Foggy chat intent, verified Indian cities, and timeframe.
 *
 * @param {string} message - Raw user message.
 * @param {Array<object>} [history=[]] - Prior conversation turns.
 * @param {string} [selectedCityName='Kolkata'] - Active city selected in UI/dashboard.
 * @returns {Promise<object>} Extracted intent payload.
 */
export async function extractIntentAndCities(message, history = [], selectedCityName = 'Kolkata') {
  const rawText = message ? message.trim() : '';
  const text = rawText.toLowerCase();

  const isHindi = /[\u0900-\u097F]/.test(rawText);
  const isHinglish =
    !isHindi &&
    /\b(kya|kaise|karo|aaj|hawa|ka|ki|ke|hai|hain|nahi|baahar|jaana|chahiye|saans|mask|shahar|kal|raat|subah|dopehar|batao|bataiye|pehan|pehanna)\b/i.test(
      text
    );

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

  const isMyCity =
    /\b(my city|mera shahar|hamara shahar|apna shahar|my location|here|mere yahan)\b/i.test(text);

  // Extract places with strict location intent
  const detectedCitiesSet = await extractLocationCandidates(text, rawText);
  let finalCities = Array.from(detectedCitiesSet);
  let usedDefault = false;
  let usedHistory = false;

  // If no explicit place was mentioned with location intent:
  if (finalCities.length === 0) {
    if (isMyCity) {
      finalCities = [selectedCityName];
      usedDefault = true;
    } else {
      // Check if previous user message was specifically asking about another city
      let foundInHistory = null;
      for (let i = history.length - 1; i >= 0; i--) {
        const hText = (history[i].text || history[i].content || '').toLowerCase();
        // Only borrow city from history if history turn explicitly named a city
        const histCandidates = await extractLocationCandidates(hText, hText);
        if (histCandidates.size > 0) {
          foundInHistory = Array.from(histCandidates)[0];
          break;
        }
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

  const isComparison =
    finalCities.length >= 2 ||
    /\b(safer than|better than|worse than|vs\.?|versus|compare|ya|or)\b/i.test(text);

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
