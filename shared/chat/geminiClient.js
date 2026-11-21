// shared/chat/geminiClient.js
/**
 * @fileoverview Resilient Google Gemini GenAI API caller with fallback models and ground-truth verification.
 */

import { verifyModelAqiResponse } from './responseValidator.js';

export async function callGeminiApi({
  apiKey,
  systemPrompt,
  contents,
  primaryReport,
  timeframe
}) {
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];
  for (const modelName of candidateModels) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
      const apiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        const candidate = data.candidates?.[0];
        let rawReply = candidate?.content?.parts?.[0]?.text;
        const isBlocked =
          candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'RECITATION';

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

          let quotedAqi = primaryReport.current.aqi;
          let quotedCategory = primaryReport.current.category;
          if (timeframe === 'tonight' && primaryReport.tonight) {
            quotedAqi = primaryReport.tonight.aqi;
            quotedCategory = primaryReport.tonight.category;
          } else if (timeframe === 'tomorrow' && primaryReport.tomorrow) {
            quotedAqi = primaryReport.tomorrow.averageAqi;
            quotedCategory = primaryReport.tomorrow.category;
          }

          const allowedNumbers = [
            quotedAqi,
            primaryReport.current?.aqi,
            primaryReport.tonight?.aqi,
            primaryReport.tomorrow?.averageAqi
          ].filter((v) => typeof v === 'number');

          if (!verifyModelAqiResponse(rawReply, allowedNumbers)) {
            throw new Error('Model quoted inaccurate AQI numbers conflicting with ground truth.');
          }

          return {
            success: true,
            rawReply,
            modelName,
            extractedFacts,
            quotedAqi,
            quotedCategory
          };
        }
      }
    } catch (err) {
      console.warn(`Gemini call failed for model ${modelName}:`, err.message);
    }
  }
  return { success: false };
}
