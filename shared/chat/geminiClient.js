// shared/chat/geminiClient.js
/**
 * @fileoverview Resilient Google Gemini GenAI API caller with fallback models, caching, retry, and ground-truth correction.
 */

import { correctModelAqiResponse } from './responseValidator.js';
import {
  sanitizeModelReplyText,
  checkMinimumResponseQuality
} from './markdownSanitizer.js';
import {
  GEMINI_PRIMARY_MODEL,
  GEMINI_CANDIDATE_MODELS,
  GEMINI_GENERATION_CONFIG
} from '../constants.js';

let cachedModels = null;
let cachedModelsExpiresAt = 0;

/**
 * Discovers and caches available Gemini models supporting generateContent.
 * Enforces GEMINI_PRIMARY_MODEL is always index 0, followed by preferred fallbacks.
 *
 * @param {string} apiKey
 * @returns {Promise<Array<string>>}
 */
export async function getAvailableGeminiModels(apiKey) {
  const now = Date.now();
  if (cachedModels && Array.isArray(cachedModels) && now < cachedModelsExpiresAt) {
    return cachedModels;
  }

  const primary = GEMINI_PRIMARY_MODEL;
  const fallbackList = [...GEMINI_CANDIDATE_MODELS];
  if (
    !apiKey ||
    typeof apiKey !== 'string' ||
    apiKey.startsWith('test-') ||
    apiKey.trim().length < 15
  ) {
    return fallbackList;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`,
      {
        signal: AbortSignal.timeout(GEMINI_GENERATION_CONFIG.listModelsTimeoutMs)
      }
    );
    if (res.ok) {
      const data = await res.json();
      const list = (data.models || [])
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m) => (m.name || '').replace(/^models\//, ''))
        .filter(Boolean);

      // Primary model MUST ALWAYS be first
      const ordered = [primary];

      // Append known fallback candidates after primary
      for (const m of fallbackList) {
        if (!ordered.includes(m) && list.includes(m)) {
          ordered.push(m);
        }
      }

      // Append any additional stable text flash models from ListModels
      for (const m of list) {
        if (
          !ordered.includes(m) &&
          m.includes('flash') &&
          !m.includes('tts') &&
          !m.includes('image') &&
          !m.includes('transcribe') &&
          !m.includes('computer-use')
        ) {
          ordered.push(m);
        }
      }

      if (ordered.length > 0) {
        cachedModels = ordered;
        cachedModelsExpiresAt = now + 3600000; // 1 hour TTL
        return cachedModels;
      }
    }
  } catch (err) {
    console.warn('Failed to retrieve Gemini ListModels, using default candidate list:', err.message);
  }

  return fallbackList;
}

export async function callGeminiApi({
  apiKey,
  systemPrompt,
  contents,
  primaryReport,
  timeframe
}) {
  let candidateModels = [...GEMINI_CANDIDATE_MODELS];
  try {
    candidateModels = await getAvailableGeminiModels(apiKey);
  } catch {}

  let lastErrorReason = 'AI service unavailable';

  for (const modelName of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let apiRes = null;
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
        const requestBody = {
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: GEMINI_GENERATION_CONFIG.temperature,
            maxOutputTokens: GEMINI_GENERATION_CONFIG.maxOutputTokens
          }
        };

        apiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(GEMINI_GENERATION_CONFIG.timeoutMs)
        });

        // Safe retry for HTTP 429 and 503
        if (apiRes.status === 429 || apiRes.status === 503) {
          lastErrorReason =
            apiRes.status === 429
              ? 'Rate limited by AI provider (429)'
              : 'AI provider temporarily overloaded (status 503 high demand spike)';
          console.warn(
            `Gemini model ${modelName} returned status ${apiRes.status} (${apiRes.status === 503 ? 'high demand spike' : 'rate limited'}). Attempt ${attempt + 1}.`
          );
          if (attempt === 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, GEMINI_GENERATION_CONFIG.retryDelayMs)
            );
            continue; // retry this model once
          }
          if (modelName === candidateModels[0]) {
            console.warn(
              `[Gemini Fallback] Primary model ${modelName} unavailable after retries (status ${apiRes.status} high demand spike); safely falling back to next model.`
            );
          }
          break; // move to next model
        }

        if (!apiRes.ok) {
          const errText = await apiRes.text().catch(() => '');
          lastErrorReason = `AI service returned HTTP ${apiRes.status}`;
          console.warn(`Gemini call returned ${apiRes.status} for ${modelName}:`, errText);
          if (modelName === candidateModels[0]) {
            console.warn(
              `[Gemini Fallback] Primary model ${modelName} failed with HTTP ${apiRes.status}; falling back to next model.`
            );
          }
          break; // move to next model
        }

        const data = await apiRes.json();
        const candidate = data.candidates?.[0];
        const isBlocked =
          candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'RECITATION';

        // Extract all text parts, explicitly filtering out thought parts
        const parts = candidate?.content?.parts || [];
        let rawReply = parts
          .filter((p) => !p.thought && typeof p.text === 'string')
          .map((p) => p.text)
          .join('')
          .trim();

        // Calculate usage metadata and thought token metrics safely
        const thoughtsCount =
          data.usageMetadata?.candidatesTokensDetails?.find((d) => d.thought)?.tokenCount ||
          data.usageMetadata?.thoughtsTokenCount ||
          0;
        const rawLength = rawReply.length;

        // Structured diagnostics logging (safe, no secrets)
        console.log(
          '[Gemini Response Diagnostics]',
          JSON.stringify({
            model: modelName,
            finishReason: candidate?.finishReason || 'STOP',
            promptTokens: data.usageMetadata?.promptTokenCount,
            candidatesTokens: data.usageMetadata?.candidatesTokenCount,
            thoughtsTokens: thoughtsCount,
            rawLength
          })
        );

        // Treat finishReason === 'MAX_TOKENS' as usable text, trimming and balancing safely
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
          const lengthAfterMemoryStrip = rawReply.length;

          let quotedAqi = primaryReport?.current?.aqi ?? 35;
          let quotedCategory = primaryReport?.current?.category || 'Good';
          if (timeframe === 'tonight' && primaryReport?.tonight) {
            quotedAqi = primaryReport.tonight.aqi;
            quotedCategory = primaryReport.tonight.category;
          } else if (timeframe === 'tomorrow' && primaryReport?.tomorrow) {
            quotedAqi = primaryReport.tomorrow.averageAqi;
            quotedCategory = primaryReport.tomorrow.category;
          }

          const allowedNumbers = [
            quotedAqi,
            primaryReport?.current?.aqi,
            primaryReport?.tonight?.aqi,
            primaryReport?.tomorrow?.averageAqi
          ].filter((v) => typeof v === 'number');

          // Correct (rather than discard) replies that quote inaccurate AQI numbers conflicting with ground truth
          rawReply = correctModelAqiResponse(rawReply, quotedAqi, allowedNumbers);
          const lengthAfterAqiCorrect = rawReply.length;

          // Sanitize truncation and dangling markdown markers
          rawReply = sanitizeModelReplyText(rawReply, candidate?.finishReason);
          const lengthAfterTrim = rawReply.length;

          // Validate minimum response quality (allow brief factual answers at client level if complete)
          const quality = checkMinimumResponseQuality(rawReply, true);
          if (!quality.isQualityPass) {
            console.warn(
              `[Gemini Response Quality] Failed minimum quality check on ${modelName}: ${quality.reason} (length=${rawReply.length}, words=${quality.wordCount})`
            );
            lastErrorReason = quality.reason;
            break; // move to next candidate model
          }

          return {
            success: true,
            rawReply,
            modelName,
            finishReason: candidate?.finishReason || 'STOP',
            usageMetadata: data.usageMetadata,
            thoughtsTokens: thoughtsCount,
            rawLength,
            lengthAfterMemoryStrip,
            lengthAfterAqiCorrect,
            lengthAfterTrim,
            extractedFacts,
            quotedAqi,
            quotedCategory
          };
        } else if (isBlocked) {
          lastErrorReason = `Safety filter triggered (${candidate?.finishReason})`;
          break; // do not retry blocked safety response on same model
        } else {
          lastErrorReason = 'Empty response from model';
          break; // empty response, proceed to next model
        }
      } catch (err) {
        lastErrorReason = err.name === 'TimeoutError' ? 'AI request timed out' : err.message;
        console.warn(`Gemini call failed for model ${modelName} (attempt ${attempt + 1}):`, err.message);
        if (modelName === candidateModels[0]) {
          console.warn(
            `[Gemini Fallback] Primary model ${modelName} timed out or failed: ${err.message}. Falling back to next model.`
          );
        }
        if (err.name === 'TimeoutError') {
          // If a model timed out, proceed immediately to the next candidate model without redundant retry
          break;
        }
      }
    }
  }

  return { success: false, errorReason: lastErrorReason };
}
