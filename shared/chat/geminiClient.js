// shared/chat/geminiClient.js
/**
 * @fileoverview Resilient Google Gemini GenAI API caller with fallback models, caching, retry, and ground-truth correction.
 */

import { correctModelAqiResponse } from './responseValidator.js';
import {
  GEMINI_CANDIDATE_MODELS,
  GEMINI_GENERATION_CONFIG
} from '../constants.js';

let cachedModels = null;
let cachedModelsExpiresAt = 0;

/**
 * Discovers and caches available Gemini models supporting generateContent.
 * @param {string} apiKey
 * @returns {Promise<Array<string>>}
 */
export async function getAvailableGeminiModels(apiKey) {
  const now = Date.now();
  if (cachedModels && Array.isArray(cachedModels) && now < cachedModelsExpiresAt) {
    return cachedModels;
  }

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

      const preferred = [...GEMINI_CANDIDATE_MODELS];
      const ordered = [
        ...preferred.filter((p) => list.includes(p)),
        ...list.filter((m) => !preferred.includes(m) && m.includes('flash'))
      ];

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
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
        const apiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: {
              temperature: GEMINI_GENERATION_CONFIG.temperature,
              maxOutputTokens: GEMINI_GENERATION_CONFIG.maxOutputTokens
            }
          }),
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
          console.warn(
            `Gemini model ${modelName} unavailable after retries (status ${apiRes.status} high demand spike); safely falling back to next candidate model.`
          );
          break; // move to next model
        }

        if (!apiRes.ok) {
          const errText = await apiRes.text().catch(() => '');
          lastErrorReason = `AI service returned HTTP ${apiRes.status}`;
          console.warn(`Gemini call returned ${apiRes.status} for ${modelName}:`, errText);
          break; // move to next model
        }

        const data = await apiRes.json();
        const candidate = data.candidates?.[0];
        let rawReply = candidate?.content?.parts?.[0]?.text;
        const isBlocked =
          candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'RECITATION';

        // Treat finishReason === 'MAX_TOKENS' as usable text rather than blocking or discarding
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

          return {
            success: true,
            rawReply,
            modelName,
            extractedFacts,
            quotedAqi,
            quotedCategory
          };
        } else if (isBlocked) {
          lastErrorReason = `Safety filter triggered (${candidate?.finishReason})`;
          break; // do not retry blocked safety response on same model
        } else {
          break; // empty response, proceed to next model
        }
      } catch (err) {
        lastErrorReason = err.name === 'TimeoutError' ? 'AI request timed out' : err.message;
        console.warn(`Gemini call failed for model ${modelName} (attempt ${attempt + 1}):`, err.message);
        if (err.name === 'TimeoutError') {
          // If a model timed out, proceed immediately to the next candidate model without redundant retry
          break;
        }
      }
    }
  }

  return { success: false, errorReason: lastErrorReason };
}
