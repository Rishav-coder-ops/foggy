// shared/chat/cityExtractor.js
/**
 * @fileoverview High-precision Indian place detection and intent classification.
 * Prevents false-positive place extractions for common English and Hindi conversation words.
 */

import { classifyIntent } from '../chatIntent/intentClassifier.js';
import { PLACE_DETECTION_STOPLIST } from './cityStopwords.js';
import { extractLocationCandidates } from './locationCandidateMatcher.js';

export { PLACE_DETECTION_STOPLIST };

const DEFAULT_CITY = 'Kolkata';

const HINDI_REGEX = /[\u0900-\u097F]/;
const HINGLISH_REGEX =
  /\b(kya|kaise|karo|aaj|hawa|ka|ki|ke|hai|hain|nahi|baahar|jaana|chahiye|saans|mask|shahar|kal|raat|subah|dopehar|batao|bataiye|pehan|pehanna)\b/i;
const MY_CITY_REGEX =
  /\b(my city|mera shahar|hamara shahar|apna shahar|my location|here|mere yahan)\b/i;
const COMPARISON_REGEX = /\b(safer than|better than|worse than|vs\.?|versus|compare|ya|or)\b/i;

const TIMEFRAME_PATTERNS = [
  {
    timeframe: 'tonight',
    regex: /\b(tonight|aaj raat|this evening|raat ko|sham ko|shyaam|evening)\b/i
  },
  { timeframe: 'tomorrow', regex: /\b(tomorrow|kal|kal subah|kal dopehar|kal raat)\b/i },
  { timeframe: 'morning', regex: /\b(this morning|aaj subah|morning|subah)\b/i },
  { timeframe: 'afternoon', regex: /\b(this afternoon|dopehar|afternoon|midday)\b/i }
];

/**
 * Detects timeframe from user message.
 * @param {string} text
 * @returns {'now'|'tonight'|'tomorrow'|'morning'|'afternoon'}
 */
function detectTimeframe(text) {
  for (const item of TIMEFRAME_PATTERNS) {
    if (item.regex.test(text)) {
      return item.timeframe;
    }
  }
  return 'now';
}

/**
 * Primary extractor for Foggy chat intent, verified Indian cities, and timeframe.
 *
 * @param {string} message - Raw user message.
 * @param {Array<object>} [history=[]] - Prior conversation turns.
 * @param {string} [selectedCityName='Kolkata'] - Active city selected in UI/dashboard.
 * @returns {Promise<{
 *   cities: Array<string>,
 *   unrecognizedCity: string|null,
 *   timeframe: string,
 *   isComparison: boolean,
 *   usedDefault: boolean,
 *   usedHistory: boolean,
 *   isHindi: boolean,
 *   isHinglish: boolean,
 *   intentType: string
 * }>} Extracted intent payload.
 */
export async function extractIntentAndCities(
  message,
  history = [],
  selectedCityName = DEFAULT_CITY
) {
  const rawText = message ? message.trim() : '';
  const text = rawText.toLowerCase();

  const isHindi = HINDI_REGEX.test(rawText);
  const isHinglish = !isHindi && HINGLISH_REGEX.test(text);
  const timeframe = detectTimeframe(text);
  const isMyCity = MY_CITY_REGEX.test(text);

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
      let foundInHistory = null;
      for (let i = history.length - 1; i >= 0; i--) {
        const hText = (history[i].text || history[i].content || '').toLowerCase();
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

  const isComparison = finalCities.length >= 2 || COMPARISON_REGEX.test(text);
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
