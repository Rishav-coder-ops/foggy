// shared/chat/cityExtractor.js
/**
 * @fileoverview Extraction of mentioned cities, timeframe, and comparison intent from user messages.
 */

import { INDIAN_CITY_ALIASES } from '../timeline/constants.js';
import { geocodeIndianCity } from '../timeline/timelineService.js';
import { classifyIntent } from '../chatIntent/intentClassifier.js';

const STOP_WORDS = new Set([
  'the', 'this', 'that', 'today', 'tomorrow', 'tonight', 'morning', 'afternoon', 'evening', 'night',
  'india', 'indian', 'city', 'outside', 'inside', 'indoor', 'room', 'house', 'home', 'mask', 'filter',
  'jog', 'run', 'walk', 'cycling', 'baby', 'child', 'children', 'kid', 'kids', 'senior', 'elder',
  'what', 'which', 'safe', 'safer', 'worst', 'best', 'here', 'there', 'delhi', 'mumbai', 'kolkata',
  'chennai', 'bengaluru', 'pune', 'aaj', 'kal', 'raat', 'subah', 'hawa', 'saans', 'mera', 'apna',
  'hamara', 'beta', 'dadi', 'nani', 'dada', 'nana', 'son', 'daughter', 'father', 'mother', 'parent',
  'grandma', 'grandpa', 'dog', 'cat', 'pet', 'rusty', 'care', 'memo', 'profile', 'advice', 'routine',
  'guidance', 'doctor', 'asthma', 'precaution', 'precautions', 'family', 'someone', 'anyone'
]);

export async function extractIntentAndCities(message, history = [], selectedCityName = 'Kolkata') {
  const rawText = message.trim();
  const text = rawText.toLowerCase();

  const isHindi = /[\u0900-\u097F]/.test(rawText);
  const isHinglish =
    !isHindi &&
    /\b(kya|kaise|karo|aaj|hawa|ka|ki|ke|hai|hain|nahi|baahar|jaana|chahiye|saans|mask|shahar|kal|raat|subah|dopehar|batao|bataiye|pehan|pehanna)\b/i.test(
      text
    );

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

  const sortedAliases = Object.keys(INDIAN_CITY_ALIASES).sort((a, b) => b.length - a.length);
  const detectedCities = new Set();

  for (const alias of sortedAliases) {
    const reg = new RegExp(
      `(^|[^a-zA-Z0-9\u0900-\u097F])${alias}([^a-zA-Z0-9\u0900-\u097F]|$)`,
      'i'
    );
    if (reg.test(text)) {
      detectedCities.add(INDIAN_CITY_ALIASES[alias]);
    }
  }

  let unrecognizedCity = null;
  const patternMatches = [
    text.match(/(?:in|at|of|for|around|near|to)\s+([a-zA-Z\u0900-\u097F]{3,25})/i),
    text.match(/([a-zA-Z\u0900-\u097F]{3,25})\s+(?:aqi|air quality|smog|pollution|hawa)/i),
    text.match(/([a-zA-Z\u0900-\u097F]{3,25})\s+ka\s+(?:aqi|hawa)/i),
    text.match(/([a-zA-Z\u0900-\u097F]{3,25})\s+mein\s+(?:aqi|hawa|pollution)/i)
  ];

  for (const m of patternMatches) {
    if (m && m[1]) {
      const candidate = m[1].trim();
      const candLower = candidate.toLowerCase();
      if (!STOP_WORDS.has(candLower) && !detectedCities.has(candidate)) {
        const geo = await geocodeIndianCity(candidate);
        if (geo && geo.name) {
          detectedCities.add(geo.name);
        } else if (text.includes('aqi') || text.includes('pollution') || text.includes('hawa')) {
          unrecognizedCity = candidate;
        }
      }
    }
  }

  const isComparison =
    detectedCities.size >= 2 ||
    /\b(safer than|better than|worse than|vs\.?|versus|compare|ya|or)\b/i.test(text);

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
          const reg = new RegExp(
            `(^|[^a-zA-Z0-9\u0900-\u097F])${alias}([^a-zA-Z0-9\u0900-\u097F]|$)`,
            'i'
          );
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
