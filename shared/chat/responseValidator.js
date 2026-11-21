// shared/chat/responseValidator.js
/**
 * @fileoverview Validation of model AQI output against ground truth and smart fallback response generation.
 */

import { extractMemoryFacts } from './memoryExtractor.js';
import { classifyIntent } from '../chatIntent/intentClassifier.js';
import { generateIntentFallback } from '../chatIntent/fallbackGenerator.js';

export function verifyModelAqiResponse(replyText, allowedAqiValues = []) {
  if (!replyText || typeof replyText !== 'string') return false;
  if (!Array.isArray(allowedAqiValues) || allowedAqiValues.length === 0) return true;

  const aqiMatches = replyText.matchAll(
    /\b(?:aqi|air quality index)\s*(?:is|of|around|level of|at|:)?\s*([0-9]{1,3})\b/gi
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
