// functions/api/chatIntent.js
/**
 * @fileoverview Re-export adapter for Foggy Chat intent classification, context building, and prompting.
 */

import { INTENT_TYPES } from '../../shared/chatIntent/intentTypes.js';
import { classifyIntent } from '../../shared/chatIntent/intentClassifier.js';
import { getIntentInstruction } from '../../shared/chatIntent/intentInstructions.js';
import { buildCompactContext } from '../../shared/chatIntent/contextBuilder.js';
import {
  buildSystemPrompt,
  buildUserMessageWithContext
} from '../../shared/chatIntent/promptBuilder.js';
import { generateIntentFallback } from '../../shared/chatIntent/fallbackGenerator.js';

export {
  INTENT_TYPES,
  classifyIntent,
  getIntentInstruction,
  buildCompactContext,
  buildSystemPrompt,
  buildUserMessageWithContext,
  generateIntentFallback
};

export default {
  INTENT_TYPES,
  classifyIntent,
  getIntentInstruction,
  buildCompactContext,
  buildSystemPrompt,
  buildUserMessageWithContext,
  generateIntentFallback
};
