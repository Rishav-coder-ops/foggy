/**
 * @fileoverview Main chat request processing workflow for Gemini Chat Proxy.
 */

import {
  classifyIntent,
  buildCompactContext,
  getIntentInstruction,
  buildSystemPrompt,
  buildUserMessageWithContext
} from '../chatIntent.js';
import { extractIntentAndCities } from '../../../shared/chat/cityExtractor.js';
import { generateSmartFallbackResponse } from '../../../shared/chat/responseValidator.js';
import { computeSafetyVerdict } from '../../../shared/safety/safetyVerdict.js';
import { FOGGY_FALLBACK_MODEL, FOGGY_PROVIDER_LABELS } from '../../../shared/constants.js';

import { sanitizeChatHistory } from './chatContents.js';
import { validateChatAuthAndRateLimit, parseAndValidateChatBody } from './chatValidation.js';
import { resolveAndFetchCityReports } from './chatCityReports.js';
import { executeChatPipeline } from './chatPipeline.js';
import { buildChatFallbackPayload } from './chatFallbackResponse.js';

const CITY_NAME_MAX_LEN = 60;
const GEMINI_MIN_KEY_LEN = 15;
const PLACEHOLDER_KEY = 'your_gemini_api_key_here';

/**
 * Executes the full chat proxy workflow: auth, rate limit, intent, reports, Gemini call, and fallback.
 * @param {object} context - Cloudflare context object containing request and env.
 * @param {object} headers - Prepared response headers.
 * @returns {Promise<Response>}
 */
export async function handleChatRequest(context, headers) {
  const { request, env } = context;

  // 1. Authenticate & check dual rate-limits
  const authCheck = await validateChatAuthAndRateLimit({ request, env, headers });
  if (!authCheck.allowed) return authCheck.response;

  // 2. Validate payload limits and parse JSON body
  const bodyCheck = await parseAndValidateChatBody(request, headers);
  if (!bodyCheck.valid) return bodyCheck.response;

  const { requestBody, trimmedMessage } = bodyCheck;
  const { history = [], aqiData, profile, selectedCity } = requestBody;
  const sanitizedHistory = sanitizeChatHistory(history);

  // 3. Detect city context and intent
  const currentSelectedCityName = (
    selectedCity?.name ||
    aqiData?.city ||
    profile?.location ||
    'Kolkata'
  ).slice(0, CITY_NAME_MAX_LEN);

  const intent = await extractIntentAndCities(
    trimmedMessage,
    sanitizedHistory,
    currentSelectedCityName
  );

  const userTurnsCount = sanitizedHistory.filter((m) => m.role === 'user').length;
  const isFirstMessage = userTurnsCount === 0;

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
        model: FOGGY_FALLBACK_MODEL,
        provider: FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE,
        reason: 'Unrecognized city location',
        extractedFacts: fallback.extractedFacts
      }),
      { status: 200, headers }
    );
  }

  // 4. Fetch live data for detected cities
  const reportsResult = await resolveAndFetchCityReports({
    requestBody,
    intent,
    currentSelectedCityName
  });

  if (!reportsResult.found) {
    return new Response(
      JSON.stringify({
        reply: `I couldn't load live air quality data for the requested city. Please try asking again in a moment.`,
        city: currentSelectedCityName,
        cityData: null,
        isDifferentFromSelected: false,
        isLive: false,
        model: FOGGY_FALLBACK_MODEL,
        provider: FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE,
        reason: 'City data temporarily unavailable',
        extractedFacts: []
      }),
      { status: 200, headers }
    );
  }

  const { primaryReport, secondaryReport, cityReports, isDifferentFromSelected } = reportsResult;

  // 5. Deterministic Safety Verdict Engine
  const safetyVerdict = computeSafetyVerdict({
    aqi: primaryReport.current.aqi,
    category: primaryReport.current.category,
    query: trimmedMessage,
    profile,
    familyMembers: profile?.familyMembers
  });

  const apiKey =
    env?.GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  const isKeyConfigured = Boolean(
    apiKey && apiKey !== PLACEHOLDER_KEY && apiKey.trim().length > GEMINI_MIN_KEY_LEN
  );

  const intentType = intent.intentType || classifyIntent(trimmedMessage, sanitizedHistory);
  const compactContext = buildCompactContext(
    primaryReport,
    profile,
    intentType,
    secondaryReport,
    safetyVerdict
  );
  const intentInstruction = getIntentInstruction(intentType, primaryReport);
  const systemPrompt = buildSystemPrompt({
    isHindi: intent.isHindi,
    isHinglish: intent.isHinglish
  });
  const userMessagePayload = buildUserMessageWithContext({
    message: trimmedMessage,
    compactContext,
    intentInstruction,
    safetyVerdict
  });

  // 6. Execute Gemini Generation with Automated Safety Checks
  let geminiResult = null;
  if (isKeyConfigured) {
    const pipelineResult = await executeChatPipeline({
      apiKey,
      systemPrompt,
      history,
      userMessagePayload,
      primaryReport,
      timeframe: intent.timeframe,
      safetyVerdict,
      intentType
    });

    if (pipelineResult.success) {
      const cityDataPayload = {
        name: primaryReport.city,
        lat: primaryReport.lat,
        lon: primaryReport.lon,
        admin1: primaryReport.admin1 || '',
        country: 'India',
        aqi: primaryReport.current.aqi,
        category: primaryReport.current.category,
        currentAqi: primaryReport.current.aqi,
        currentCategory: primaryReport.current.category,
        dominant: primaryReport.current.dominant,
        time: primaryReport.current.time,
        timeframe: intent.timeframe,
        isMock: Boolean(primaryReport.isMock)
      };

      return new Response(
        JSON.stringify({
          reply: pipelineResult.alignedReply,
          memo: pipelineResult.alignedReply,
          city: primaryReport.city,
          cityData: cityDataPayload,
          isDifferentFromSelected,
          isLive: !primaryReport.isMock,
          isSample: Boolean(primaryReport.isMock),
          model: pipelineResult.finalModelName,
          provider: FOGGY_PROVIDER_LABELS.LIVE_GEMINI,
          extractedFacts: pipelineResult.finalExtractedFacts
        }),
        { status: 200, headers }
      );
    }
    geminiResult = pipelineResult.geminiResult;
  }

  // 7. Fallback Response with deterministic safety
  intent.intentType = intentType;
  const fallbackPayload = buildChatFallbackPayload({
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
  });

  return new Response(JSON.stringify(fallbackPayload), { status: 200, headers });
}
