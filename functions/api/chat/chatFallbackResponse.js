/**
 * @fileoverview Fallback response builder with deterministic safety and intelligent offline guidance.
 */

import { buildDeterministicSafetyReply } from '../../../shared/safety/safetyValidator.js';
import {
  generateSmartFallbackResponse,
  validateAndAlignReplyWithAqi
} from '../../../shared/chat/responseValidator.js';
import { FOGGY_FALLBACK_MODEL, FOGGY_PROVIDER_LABELS } from '../../../shared/constants.js';

/**
 * Generates structured fallback response when live model fails or outdoor safety triggers deterministic override.
 *
 * @param {object} params
 * @returns {object} Final JSON-serializable fallback response payload.
 */
export function buildChatFallbackPayload({
  safetyVerdict,
  primaryReport,
  trimmedMessage,
  intent,
  isFirstMessage,
  profile,
  isKeyConfigured,
  geminiResult,
  cityReports,
  isDifferentFromSelected
}) {
  let rawFallbackText = '';
  let fallbackFacts = [];

  if (safetyVerdict.isOutdoorQuery) {
    rawFallbackText = buildDeterministicSafetyReply(
      safetyVerdict,
      primaryReport.city,
      trimmedMessage
    );
  } else {
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
      intentType: intent.intentType
    });
    rawFallbackText = fallback.reply;
    fallbackFacts = fallback.extractedFacts || [];
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

  const alignedFallbackReply = validateAndAlignReplyWithAqi(
    rawFallbackText,
    quotedAqi,
    quotedCategory
  );

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
    timeframe: intent.timeframe,
    isMock: Boolean(primaryReport.isMock)
  };

  return {
    reply: alignedFallbackReply,
    memo: alignedFallbackReply,
    city: primaryReport.city,
    cityData: cityDataPayload,
    isDifferentFromSelected,
    isLive: false,
    isSample: Boolean(primaryReport.isMock),
    model: FOGGY_FALLBACK_MODEL,
    provider: FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE,
    reason: isKeyConfigured
      ? geminiResult?.errorReason || 'AI temporarily unavailable'
      : 'API key not configured',
    extractedFacts: fallbackFacts
  };
}
