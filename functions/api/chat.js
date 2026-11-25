// functions/api/chat.js
/**
 * @fileoverview Cloudflare Pages Function & Local Express Handler for Gemini GenAI Chat Proxy.
 * Provides rate limiting, Firebase token authentication, prompt building, and fallback handling.
 */

import { fetchCityAqiReport } from './aqi-timeline.js';
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
import {
  MAX_ANON_PER_HOUR,
  MAX_USER_PER_HOUR,
  MAX_PAYLOAD_BYTES,
  MAX_MESSAGE_LENGTH,
  MAX_HISTORY_TURNS,
  checkRateLimit,
  getCorsHeaders
} from '../../shared/chat/rateLimiter.js';
import {
  sanitizeMemberProfile,
  buildPersonalizationPrompt
} from '../../shared/chat/profileSanitizer.js';
import { extractMemoryFact, extractMemoryFacts } from '../../shared/chat/memoryExtractor.js';
import { extractIntentAndCities } from '../../shared/chat/cityExtractor.js';
import {
  verifyModelAqiResponse,
  correctModelAqiResponse,
  validateAndAlignReplyWithAqi,
  generateSmartFallbackResponse
} from '../../shared/chat/responseValidator.js';
import { callGeminiApi } from '../../shared/chat/geminiClient.js';
import { computeSafetyVerdict } from '../../shared/safety/safetyVerdict.js';
import {
  validateReplySafety,
  buildCorrectivePrompt,
  buildDeterministicSafetyReply
} from '../../shared/safety/safetyValidator.js';
import {
  sanitizeModelReplyText,
  checkMinimumResponseQuality
} from '../../shared/chat/markdownSanitizer.js';
import {
  GEMINI_PRIMARY_MODEL,
  GEMINI_FALLBACK_MODEL,
  GEMINI_CANDIDATE_MODELS,
  GEMINI_GENERATION_CONFIG,
  FOGGY_FALLBACK_MODEL,
  FOGGY_PROVIDER_LABELS
} from '../../shared/constants.js';

export {
  INTENT_TYPES,
  classifyIntent,
  buildCompactContext,
  getIntentInstruction,
  buildSystemPrompt,
  buildUserMessageWithContext,
  generateIntentFallback,
  getCorsHeaders,
  sanitizeMemberProfile,
  buildPersonalizationPrompt,
  extractIntentAndCities,
  extractMemoryFact,
  extractMemoryFacts,
  verifyModelAqiResponse,
  correctModelAqiResponse,
  generateSmartFallbackResponse,
  computeSafetyVerdict,
  validateReplySafety,
  buildCorrectivePrompt,
  buildDeterministicSafetyReply,
  GEMINI_PRIMARY_MODEL,
  GEMINI_FALLBACK_MODEL,
  GEMINI_CANDIDATE_MODELS,
  GEMINI_GENERATION_CONFIG,
  FOGGY_FALLBACK_MODEL,
  FOGGY_PROVIDER_LABELS
};

/**
 * Constructs sanitized multi-turn contents for Gemini API:
 * 1. Multi-turn talk cannot start with a model turn.
 * 2. Strictly alternates user and model turns (merging consecutive same-role turns).
 * 3. Appends current turn user payload.
 *
 * @param {Array<object>} history - Conversation history.
 * @param {string} currentPayload - Current user turn payload.
 * @returns {Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }>}
 */
export function buildGeminiContents(history = [], currentPayload = '') {
  const turns = [];
  if (Array.isArray(history)) {
    const recent = history.slice(-MAX_HISTORY_TURNS);
    for (const item of recent) {
      if (item && typeof item === 'object') {
        let textContent = (item.text || item.content || item.parts?.[0]?.text || '')
          .toString()
          .slice(0, 1000);
        if (textContent.includes('USER QUESTION:')) {
          textContent = textContent.split('USER QUESTION:').pop().trim();
        }
        textContent = textContent.trim();
        if (textContent) {
          const role = item.role === 'user' || item.sender === 'user' ? 'user' : 'model';
          turns.push({ role, text: textContent });
        }
      }
    }
  }

  // 1. Multi-turn talk cannot start with model turn: drop any leading model turns
  while (turns.length > 0 && turns[0].role === 'model') {
    turns.shift();
  }

  // 2. Append current user turn
  if (currentPayload && currentPayload.trim()) {
    turns.push({ role: 'user', text: currentPayload.trim() });
  }

  // 3. Strictly alternate: collapse consecutive turns of identical role
  const formatted = [];
  for (const turn of turns) {
    if (formatted.length > 0 && formatted[formatted.length - 1].role === turn.role) {
      formatted[formatted.length - 1].parts[0].text += `\n\n${turn.text}`;
    } else {
      formatted.push({
        role: turn.role,
        parts: [{ text: turn.text }]
      });
    }
  }

  // 4. Guarantee non-empty array starting with user role
  if (formatted.length === 0) {
    formatted.push({ role: 'user', parts: [{ text: currentPayload || 'Hello' }] });
  } else if (formatted[0].role !== 'user') {
    formatted[0].role = 'user';
  }

  return formatted;
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

  // 2. Dual rate limiting: anonymous vs verified signed-in users
  const isUserAuthenticated = Boolean(verifiedUid);
  const rateLimitKey = isUserAuthenticated ? `user:${verifiedUid}` : `ip:${clientIp}`;
  const configuredMax = isUserAuthenticated
    ? env?.RATE_LIMIT_USER_MAX != null
      ? Number(env.RATE_LIMIT_USER_MAX)
      : MAX_USER_PER_HOUR
    : env?.RATE_LIMIT_ANON_MAX != null
      ? Number(env.RATE_LIMIT_ANON_MAX)
      : MAX_ANON_PER_HOUR;
  const maxLimit = configuredMax;

  const rateCheck = checkRateLimit(rateLimitKey, maxLimit);
  headers['X-RateLimit-Limit'] = maxLimit.toString();
  headers['X-RateLimit-Remaining'] = rateCheck.remaining.toString();
  headers['X-RateLimit-Reset'] = Math.ceil(rateCheck.reset / 1000).toString();

  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded. Foggy is busy, try again in a minute.',
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
      JSON.stringify({
        error: 'Bad Request',
        code: 'INVALID_REQUEST',
        message: 'Failed to read request body.'
      }),
      { status: 400, headers }
    );
  }

  if (rawBodyText.length > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({
        error: 'Payload Too Large',
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds limit.'
      }),
      { status: 413, headers }
    );
  }

  let requestBody = {};
  try {
    requestBody = JSON.parse(rawBodyText);
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        code: 'MALFORMED_JSON',
        message: 'Malformed JSON payload.'
      }),
      { status: 400, headers }
    );
  }

  const { message, member, history = [], aqiData, profile, selectedCity, city } = requestBody;

  // 4. Message length limit
  const isPersonalizeRoute =
    request.url.includes('/api/personalize') || (!message && Boolean(member));
  if (
    typeof message === 'string' &&
    message.trim().length > MAX_MESSAGE_LENGTH &&
    !isPersonalizeRoute
  ) {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        code: 'MESSAGE_TOO_LONG',
        message: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters.`
      }),
      { status: 400, headers }
    );
  }

  let activeMessage = '';
  if (typeof message === 'string' && message.trim()) {
    activeMessage = message.trim();
  } else if (member && typeof member === 'object') {
    const locName = member.city || profile?.city || city || selectedCity?.name || 'Kolkata';
    activeMessage = buildPersonalizationPrompt(member, aqiData, locName);
  }

  if (!activeMessage) {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        code: 'INVALID_REQUEST',
        message: 'Message or member profile is required.'
      }),
      { status: 400, headers }
    );
  }

  const trimmedMessage = activeMessage.slice(0, MAX_MESSAGE_LENGTH);

  // Sanitize history array
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
  const currentSelectedCityName = (
    selectedCity?.name ||
    aqiData?.city ||
    profile?.location ||
    'Kolkata'
  ).slice(0, 60);

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
        model: FOGGY_FALLBACK_MODEL,
        provider: FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE,
        reason: 'City data temporarily unavailable',
        extractedFacts: []
      }),
      { status: 200, headers }
    );
  }

  const primaryReport = cityReports[0];
  const secondaryReport = cityReports.length > 1 ? cityReports[1] : null;

  // Ensure single source of truth: align primaryReport with client's active aqiData if same place
  const clientAqi = requestBody.aqiData;
  if (clientAqi && clientAqi.aqi != null) {
    const clientCityNorm = (clientAqi.city || '').toLowerCase().trim();
    const primaryCityNorm = (primaryReport.city || '').toLowerCase().trim();
    if (
      intent.usedDefault ||
      clientCityNorm.includes(primaryCityNorm) ||
      primaryCityNorm.includes(clientCityNorm)
    ) {
      primaryReport.current.aqi = clientAqi.aqi;
      if (clientAqi.category) {
        primaryReport.current.category = clientAqi.category;
      }
      if (clientAqi.dominantPollutant) {
        primaryReport.current.dominant = clientAqi.dominantPollutant;
      }
      if (clientAqi.isMock != null) {
        primaryReport.isMock = Boolean(clientAqi.isMock);
      }
    }
  }

  const isDifferentFromSelected =
    !intent.usedDefault &&
    primaryReport.city.toLowerCase() !== currentSelectedCityName.toLowerCase();

  // 7. Deterministic Safety Verdict Engine
  const safetyVerdict = computeSafetyVerdict({
    aqi: primaryReport.current.aqi,
    category: primaryReport.current.category,
    query: trimmedMessage,
    profile,
    familyMembers: profile?.familyMembers
  });

  // Check Gemini API configuration
  const apiKey =
    env?.GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  const isKeyConfigured = Boolean(
    apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.trim().length > 15
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

  // 8. Try live Gemini call with automated safety validation & 1-time repair
  let geminiResult = null;
  if (isKeyConfigured) {
    const contents = buildGeminiContents(history, userMessagePayload);

    geminiResult = await callGeminiApi({
      apiKey,
      systemPrompt,
      contents,
      primaryReport,
      timeframe: intent.timeframe
    });

    if (geminiResult.success) {
      let finalReply = geminiResult.rawReply;
      let finalModelName = geminiResult.modelName;
      let finalExtractedFacts = geminiResult.extractedFacts;

      // Validate reply safety against ground truth and deterministic verdict
      const safetyCheck = validateReplySafety(
        finalReply,
        safetyVerdict,
        primaryReport.current.aqi,
        primaryReport.current.category
      );

      const lengthBeforeSafety = finalReply ? finalReply.length : 0;
      let lengthAfterSafety = lengthBeforeSafety;

      if (!safetyCheck.isValid || safetyCheck.issues.length > 0) {
        if (safetyCheck.shouldRegenerate) {
          console.warn(
            'Gemini reply failed safety verification (>1/3 replaced); attempting 1-time regeneration:',
            safetyCheck.issues
          );
          const correctiveInstruction = buildCorrectivePrompt(safetyCheck.issues, safetyVerdict);
          const retryPayload = `${userMessagePayload}\n\n${correctiveInstruction}`;
          const retryContents = buildGeminiContents(history, retryPayload);

          const retryResult = await callGeminiApi({
            apiKey,
            systemPrompt,
            contents: retryContents,
            primaryReport,
            timeframe: intent.timeframe
          });

          if (retryResult.success) {
            const retryCheck = validateReplySafety(
              retryResult.rawReply,
              safetyVerdict,
              primaryReport.current.aqi,
              primaryReport.current.category
            );
            if (!retryCheck.shouldRegenerate) {
              finalReply = retryCheck.repairedText;
              finalModelName = retryResult.modelName;
              finalExtractedFacts = retryResult.extractedFacts;
            } else {
              console.warn(
                'Gemini retry also failed safety verification; using deterministic safety guidance.'
              );
              finalReply = null; // force deterministic safety fallback
            }
          } else {
            finalReply = null;
          }
        } else {
          // Targeted sentence-level repair: replace ONLY the contradicted sentence
          finalReply = safetyCheck.repairedText;
        }
      }
      lengthAfterSafety = finalReply ? finalReply.length : 0;

      if (finalReply) {
        const lengthBeforeAqiAlign = finalReply.length;
        let alignedReply = validateAndAlignReplyWithAqi(
          finalReply,
          primaryReport.current.aqi,
          primaryReport.current.category
        );
        const lengthAfterAqiAlign = alignedReply.length;

        // Ensure markdown formatting is balanced and dangling tokens stripped
        alignedReply = sanitizeModelReplyText(alignedReply, geminiResult.finishReason);
        const lengthAfterSanitize = alignedReply.length;

        // Check minimum quality: >= 20 words for standard queries and not ending mid-sentence
        const isShortExpected =
          intentType === INTENT_TYPES.AQI_STATUS ||
          intentType === INTENT_TYPES.SMALL_TALK ||
          intentType === 'aqi_status' ||
          intentType === 'small_talk' ||
          intentType === 'greeting';
        const quality = checkMinimumResponseQuality(alignedReply, isShortExpected);
        if (!quality.isQualityPass) {
          console.warn(
            `[Chat Diagnostic] Model reply failed minimum quality check: ${quality.reason} (words=${quality.wordCount}). Falling back.`
          );
          alignedReply = null;
          finalReply = null;
        }

        // Safe structured diagnostics logging (never secrets)
        console.log(
          '[Chat Diagnostic]',
          JSON.stringify({
            model: finalModelName,
            finishReason: geminiResult.finishReason,
            usageMetadata: geminiResult.usageMetadata,
            thoughtsTokens: geminiResult.thoughtsTokens || 0,
            rawLength: geminiResult.rawLength,
            lengthAfterMemoryStrip: geminiResult.lengthAfterMemoryStrip,
            lengthAfterAqiCorrect: geminiResult.lengthAfterAqiCorrect,
            lengthBeforeSafety,
            lengthAfterSafety,
            lengthBeforeAqiAlign,
            lengthAfterAqiAlign,
            lengthAfterSanitize,
            safetyIssues: safetyCheck.issues,
            shouldRegenerate: safetyCheck.shouldRegenerate,
            finalLength: alignedReply ? alignedReply.length : 0
          })
        );

        if (alignedReply) {
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
              reply: alignedReply,
              memo: alignedReply,
              city: primaryReport.city,
              cityData: cityDataPayload,
              isDifferentFromSelected,
              isLive: !primaryReport.isMock,
              isSample: Boolean(primaryReport.isMock),
              model: finalModelName,
              provider: FOGGY_PROVIDER_LABELS.LIVE_GEMINI,
              extractedFacts: finalExtractedFacts
            }),
            { status: 200, headers }
          );
        }
      }
    }
  }

  // 9. Smart Fallback with deterministic safety injection
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
      intentType
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

  return new Response(
    JSON.stringify({
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
