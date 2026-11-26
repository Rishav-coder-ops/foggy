/**
 * @fileoverview Location candidate extraction, cleaning, and Indian place verification.
 */

import { INDIAN_FALLBACK_CITIES } from '../geocode.js';
import { INDIAN_METROS, INDIAN_CITY_ALIASES } from '../timeline/constants.js';
import { geocodeIndianCity } from '../timeline/timelineService.js';
import { PLACE_DETECTION_STOPLIST } from './cityStopwords.js';

const MIN_CANDIDATE_LEN = 2;
const MAX_CANDIDATE_LEN = 35;
const SHORT_WORD_EXACT_MATCH_LIMIT = 4;
const MAX_FALLBACK_LEN_DIFF = 3;
const MAX_STANDALONE_WORDS = 4;

/**
 * Normalizes query string for location comparison by stripping boundary punctuation.
 * @param {string} str
 * @returns {string}
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
 * @param {string} candidate
 * @returns {boolean}
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
 * @param {string} candidate
 * @returns {Promise<string|null>}
 */
async function verifyCandidateIndianPlace(candidate) {
  if (!candidate || typeof candidate !== 'string') return null;
  const clean = cleanLocationCandidate(candidate);
  if (clean.length < MIN_CANDIDATE_LEN || clean.length > MAX_CANDIDATE_LEN) return null;
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
  if (
    fallbackMatch &&
    Math.abs(fallbackMatch.name.length - clean.length) <= MAX_FALLBACK_LEN_DIFF
  ) {
    if (
      clean.length <= SHORT_WORD_EXACT_MATCH_LIMIT &&
      fallbackMatch.name.toLowerCase() !== lower
    ) {
      return null;
    }
    return fallbackMatch.name;
  }

  // 4. Geocode candidate against Open-Meteo
  try {
    /**
     * @typedef {object} CandidateCity
     * @property {string} name
     * @property {string} [country]
     * @property {string} [country_code]
     */
    /** @type {CandidateCity|null} */
    const geo = await geocodeIndianCity(clean);
    if (geo && geo.name && (geo.country === 'India' || geo.country_code === 'IN')) {
      if (clean.length <= SHORT_WORD_EXACT_MATCH_LIMIT && geo.name.toLowerCase() !== lower) {
        return null;
      }
      return geo.name;
    }
  } catch {}

  return null;
}

/**
 * Helper to test and add verified candidates from regex iteration.
 * @param {IterableIterator<RegExpMatchArray>} matches
 * @param {number} groupIndex
 * @param {Set<string>} candidates
 */
async function collectMatches(matches, groupIndex, candidates) {
  for (const m of matches) {
    if (m && m[groupIndex]) {
      const cand = cleanLocationCandidate(m[groupIndex]);
      if (!isStopword(cand)) {
        const verified = await verifyCandidateIndianPlace(cand);
        if (verified) candidates.add(verified);
      }
    }
  }
}

/**
 * Extracts candidate place names ONLY when there is clear, unambiguous location intent.
 * @param {string} text - Lowercase normalized message text.
 * @param {string} rawText - Original raw message text.
 * @returns {Promise<Set<string>>}
 */
export async function extractLocationCandidates(text, rawText) {
  const candidates = new Set();
  const trimmed = rawText
    .trim()
    .replace(/[?.,!]+$/, '')
    .trim();

  // 1. Standalone Place Name: The entire message is just a place name (1 to 4 words)
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount >= 1 && wordCount <= MAX_STANDALONE_WORDS) {
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
  await collectMatches(
    text.matchAll(
      /\b(?:in|at|near|around|for|about)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\b/gi
    ),
    1,
    candidates
  );

  // 3. Directed travel prepositions: "traveling to X", "going to X", "commute to X"
  await collectMatches(
    text.matchAll(
      /\b(?:traveling\s+to|travelling\s+to|heading\s+to|commute\s+to|trip\s+to|visiting)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\b/gi
    ),
    1,
    candidates
  );

  // 4. Metric preceding Place: "aqi in/of/for X", "air quality of X", "weather for X"
  await collectMatches(
    text.matchAll(
      /\b(?:air\s+quality|aqi|naqi|pollution|smog|hawa|weather|mausam|forecast|conditions?|readings?)\s+(?:in|of|at|for)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\b/gi
    ),
    1,
    candidates
  );

  // 5. Place preceding Metric: "X aqi", "X air quality", "X weather", "X forecast"
  await collectMatches(
    text.matchAll(
      /\b([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\s+(?:aqi|naqi|air\s+quality|pollution|smog|hawa|weather|mausam|forecast)\b/gi
    ),
    1,
    candidates
  );

  // 6. Hindi / Hinglish Patterns: "X ka aqi/hawa/mausam", "X mein aqi/hawa/pollution"
  await collectMatches(
    text.matchAll(
      /\b([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\s+(?:ka|ki|ke|mein|me)\s+(?:aqi|naqi|air\s+quality|hawa|mausam|pollution|smog)\b/gi
    ),
    1,
    candidates
  );

  // 7. Comparison Patterns: "compare X and Y", "between X and Y"
  const compMatches1 = text.matchAll(
    /\bcompare\s+([A-Za-z\u0900-\u097F]+)\s+(?:and|with|to|vs\.?|versus)\s+([A-Za-z\u0900-\u097F]+)\b/gi
  );
  await collectMatches(compMatches1, 1, candidates);
  const compMatches1b = text.matchAll(
    /\bcompare\s+([A-Za-z\u0900-\u097F]+)\s+(?:and|with|to|vs\.?|versus)\s+([A-Za-z\u0900-\u097F]+)\b/gi
  );
  await collectMatches(compMatches1b, 2, candidates);

  const compMatches2 = text.matchAll(
    /\bbetween\s+([A-Za-z\u0900-\u097F]+)\s+and\s+([A-Za-z\u0900-\u097F]+)\b/gi
  );
  await collectMatches(compMatches2, 1, candidates);
  const compMatches2b = text.matchAll(
    /\bbetween\s+([A-Za-z\u0900-\u097F]+)\s+and\s+([A-Za-z\u0900-\u097F]+)\b/gi
  );
  await collectMatches(compMatches2b, 2, candidates);

  return candidates;
}
