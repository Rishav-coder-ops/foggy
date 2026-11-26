/**
 * @fileoverview Gemini GenAI call execution, automated safety validation, retry, and alignment.
 */

import { buildGeminiContents } from './chatContents.js';
import { callGeminiApi } from '../../../shared/chat/geminiClient.js';
import {
  validateReplySafety,
  buildCorrectivePrompt
} from '../../../shared/safety/safetyValidator.js';
import { validateAndAlignReplyWithAqi } from '../../../shared/chat/responseValidator.js';
import {
  sanitizeModelReplyText,
  checkMinimumResponseQuality
} from '../../../shared/chat/markdownSanitizer.js';
import { INTENT_TYPES } from '../../api/chatIntent.js';
import { logger } from '../../../shared/logger.js';

/**
 * Executes the live Gemini chat generation with automated safety checks, retry, and post-processing.
 *
 * @param {object} params
 * @returns {Promise<{
 *   success: boolean,
 *   alignedReply?: string,
 *   finalModelName?: string,
 *   finalExtractedFacts?: Array<object>,
 *   geminiResult?: object
 * }>}
 */
export async function executeChatPipeline({
  apiKey,
  systemPrompt,
  history,
  userMessagePayload,
  primaryReport,
  timeframe,
  safetyVerdict,
  intentType
}) {
  const contents = buildGeminiContents(history, userMessagePayload);

  const geminiResult = await callGeminiApi({
    apiKey,
    systemPrompt,
    contents,
    primaryReport,
    timeframe
  });

  if (!geminiResult.success) {
    return { success: false, geminiResult };
  }

  let finalReply = geminiResult.rawReply;
  let finalModelName = geminiResult.modelName;
  let finalExtractedFacts = geminiResult.extractedFacts;

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
      logger.warn(
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
        timeframe
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
          logger.warn(
            'Gemini retry also failed safety verification; using deterministic safety guidance.'
          );
          finalReply = null;
        }
      } else {
        finalReply = null;
      }
    } else {
      finalReply = safetyCheck.repairedText;
    }
  }
  lengthAfterSafety = finalReply ? finalReply.length : 0;

  if (!finalReply) {
    return { success: false, geminiResult };
  }

  const lengthBeforeAqiAlign = finalReply.length;
  let alignedReply = validateAndAlignReplyWithAqi(
    finalReply,
    primaryReport.current.aqi,
    primaryReport.current.category
  );
  const lengthAfterAqiAlign = alignedReply.length;

  alignedReply = sanitizeModelReplyText(alignedReply, geminiResult.finishReason);
  const lengthAfterSanitize = alignedReply.length;

  const isShortExpected =
    intentType === INTENT_TYPES.AQI_STATUS ||
    intentType === INTENT_TYPES.SMALL_TALK ||
    intentType === 'aqi_status' ||
    intentType === 'small_talk' ||
    intentType === 'greeting';
  const quality = checkMinimumResponseQuality(alignedReply, isShortExpected);
  if (!quality.isQualityPass) {
    logger.warn(
      `[Chat Diagnostic] Model reply failed minimum quality check: ${quality.reason} (words=${quality.wordCount}). Falling back.`
    );
    alignedReply = null;
  }

  logger.debug(
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

  if (!alignedReply) {
    return { success: false, geminiResult };
  }

  return {
    success: true,
    alignedReply,
    finalModelName,
    finalExtractedFacts,
    geminiResult
  };
}
