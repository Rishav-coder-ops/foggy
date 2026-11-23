// shared/chat/responseValidator.js
/**
 * @fileoverview Validation of model AQI output against ground truth and smart fallback response generation.
 */

import { extractMemoryFacts } from './memoryExtractor.js';
import { classifyIntent } from '../chatIntent/intentClassifier.js';
import { generateIntentFallback } from '../chatIntent/fallbackGenerator.js';
import { getAQICategory } from '../aqi.js';

export function verifyModelAqiResponse(replyText, allowedAqiValues = []) {
  if (!replyText || typeof replyText !== 'string') return false;
  if (!Array.isArray(allowedAqiValues) || allowedAqiValues.length === 0) return true;

  const aqiMatches = replyText.matchAll(
    /\b(?:national\s+aqi|naqi|aqi|air quality index)\s*(?:is|of|around|level of|at|:)?\s*([0-9]{1,3})\b/gi
  );
  const allowedSet = new Set(allowedAqiValues.map((v) => Math.round(Number(v))));

  for (const match of aqiMatches) {
    const quotedNum = parseInt(match[1], 10);
    const matchesGroundTruth = Array.from(allowedSet).some(
      (groundTruth) => Math.abs(quotedNum - groundTruth) <= 5
    );
    if (!matchesGroundTruth) {
      return false;
    }
  }

  return true;
}

/**
 * Corrects (rather than discards) replies that quote inaccurate AQI data conflicting with ground truth.
 * Replaces mismatched AQI numbers with the ground truth target AQI.
 *
 * @param {string} replyText - Model generated text.
 * @param {number} targetAqi - Ground truth target AQI to substitute.
 * @param {Array<number>} allowedAqiValues - Acceptable AQI values within tolerance.
 * @returns {string} Corrected text.
 */
export function correctModelAqiResponse(replyText, targetAqi, allowedAqiValues = []) {
  if (!replyText || typeof replyText !== 'string') return replyText;
  if (!Array.isArray(allowedAqiValues) || allowedAqiValues.length === 0) return replyText;

  const allowedSet = new Set(allowedAqiValues.map((v) => Math.round(Number(v))));

  return replyText.replace(
    /\b((?:national\s+aqi|naqi|aqi|air quality index)\s*(?:is|of|around|level of|at|:)?\s*)([0-9]{1,3})\b/gi,
    (fullMatch, prefix, numStr) => {
      const quotedNum = parseInt(numStr, 10);
      const isAccurate = Array.from(allowedSet).some(
        (groundTruth) => Math.abs(quotedNum - groundTruth) <= 5
      );
      if (isAccurate) {
        return fullMatch;
      }
      return `${prefix}${targetAqi}`;
    }
  );
}

/**
 * Validates and strictly aligns model-generated text against ground-truth AQI and category.
 * Corrects conflicting AQI numbers and mismatched category names before display.
 *
 * @param {string} replyText - Model generated text.
 * @param {number} targetAqi - Active ground truth AQI value.
 * @param {string} [targetCategory=null] - Active ground truth category label.
 * @returns {string} Aligned reply text.
 */
export function validateAndAlignReplyWithAqi(replyText, targetAqi, targetCategory = null) {
  if (!replyText || typeof replyText !== 'string' || targetAqi == null) return replyText;

  const trueAqi = Math.round(Number(targetAqi));
  const trueCat = targetCategory || getAQICategory(trueAqi).name;
  const categoriesRegex = '(?:Good|Satisfactory|Moderate|Poor|Very\\s+Poor|Severe)';

  // 1. Replace mismatched NAQI / AQI numbers when preceded by AQI / Air Quality Index with optional city/location preposition
  // e.g. "AQI is 149", "AQI in Noida is 149", "NAQI reaches 149", "air quality index: 149"
  let aligned = replyText.replace(
    /\b((?:national\s+aqi|naqi|aqi|air\s+quality\s+index)(?:\s+(?:in|for|of|across)\s+[a-zA-Z\s,]+?)?\s*(?:is|of|around|level\s+of|at|stands\s+at|reaches|:)?\s*)([0-9]{1,3})\b/gi,
    (fullMatch, prefix, numStr) => {
      const quotedNum = parseInt(numStr, 10);
      if (Math.abs(quotedNum - trueAqi) <= 3) {
        return fullMatch;
      }
      return `${prefix}${trueAqi}`;
    }
  );

  // 2. Also replace "NAQI of 149" or "(NAQI 149)" or "AQI: 149"
  aligned = aligned.replace(
    /\b((?:national\s+aqi|naqi|aqi)\s*(?:of|is|:)?\s*)([0-9]{1,3})\b/gi,
    (fullMatch, prefix, numStr) => {
      const quotedNum = parseInt(numStr, 10);
      if (Math.abs(quotedNum - trueAqi) <= 3) {
        return fullMatch;
      }
      return `${prefix}${trueAqi}`;
    }
  );

  // 3. Align category right after the AQI number: "278 (Moderate)" -> "278 (Poor)"
  aligned = aligned.replace(
    new RegExp(`\\b${trueAqi}\\s*\\((${categoriesRegex})\\)`, 'gi'),
    () => `${trueAqi} (${trueCat})`
  );

  // 4. Align Category preceding AQI: "Moderate (278)" -> "Poor (278)", "Poor (NAQI 324)" -> "Very Poor (NAQI 324)"
  aligned = aligned.replace(
    new RegExp(`\\b(${categoriesRegex})\\s*\\((?:(?:national\\s+aqi|naqi|aqi)\\s*)?${trueAqi}\\)`, 'gi'),
    () => `${trueCat} (NAQI ${trueAqi})`
  );

  // 5. Align Category following AQI: "(NAQI 324, Poor)" -> "(NAQI 324, Very Poor)"
  aligned = aligned.replace(
    new RegExp(`\\((?:(?:national\\s+aqi|naqi|aqi)\\s*)?${trueAqi}[,\\s]+(${categoriesRegex})\\)`, 'gi'),
    () => `(NAQI ${trueAqi}, ${trueCat})`
  );

  // 6. Align Category in phrasing: "in the Poor category" -> "in the Very Poor category"
  aligned = aligned.replace(
    new RegExp(`\\bin the (${categoriesRegex}) category\\b`, 'gi'),
    () => `in the ${trueCat} category`
  );

  // 7. Align Category when stating "is Moderate with" or "quality is Moderate" -> "is Poor with"
  aligned = aligned.replace(
    new RegExp(`\\bis (${categoriesRegex})(?=\\s+(?:with|and|,|\\())`, 'gi'),
    () => `is ${trueCat}`
  );

  return aligned;
}

export function generateSmartFallbackResponse({
  message = '',
  cityReports = [],
  unrecognizedCity = null,
  timeframe = 'now',
  _isComparison = false,
  _usedDefault = false,
  _isFirstMessage = false,
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
