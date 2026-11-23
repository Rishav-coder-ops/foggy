// shared/safety/safetyValidator.js
/**
 * @fileoverview Post-generation safety validation and sentence-level repair engine.
 * Inspects AI responses against deterministic safety verdicts and atmospheric ground truth.
 * Replaces ONLY sentences that assert outdoor exposure/activity is safe during Moderate or worse smog,
 * while leaving indoor tips, budget guidance, and clean air topic words untouched.
 * If more than one-third of the reply is contradicted, triggers a 1-time regeneration.
 */

import { getAQICategory } from '../aqi.js';

/**
 * Regex identifying an outdoor activity or outdoor exposure context.
 */
const OUTDOOR_CONTEXT_REGEX =
  /\b(outside|outdoors|outdoor|play\s+outside|run\s+outside|jog\s+outside|walk\s+outside|morning\s+walk|evening\s+walk|step\s+out|go\s+out|playground|park|fresh\s+air\s+outside|open\s+windows|ambient\s+air|stroll\s+outside)\b/i;

/**
 * Regex identifying an affirmative safety or risk-free claim.
 */
const SAFETY_CLAIM_REGEX =
  /\b(entirely\s+safe|completely\s+safe|perfectly\s+safe|totally\s+safe|is\s+safe|are\s+safe|safe\s+to\s+play|safe\s+to\s+run|safe\s+to\s+walk|safe\s+for\s+(?:your\s+)?(?:kids?|children|child)|no\s+risk|little\s+or\s+no\s+risk|zero\s+risk|unrestricted|unrestricted\s+outdoor|any\s+time\s+of\s+the\s+day|go\s+ahead\s+and\s+play|go\s+ahead\s+and\s+run|go\s+ahead\s+and\s+(?:let\s+[^.!?]*\s+)?(?:play|go|run|walk|step|exercise)|feel\s+free\s+to\s+play|feel\s+free\s+to\s+go|feel\s+free\s+to\s+(?:let\s+[^.!?]*\s+)?(?:play|go|run|walk|step|exercise)|enjoy\s+outdoor|air\s+is\s+clean\s+outside|clean\s+air\s+outside|pristine\s+air)\b/i;

/**
 * Regex identifying negation words that invert a safety claim into a warning.
 */
const NEGATION_REGEX =
  /\b(not|never|hardly|scarcely|isn't|is not|cannot|should not|must not|avoid|unsafe|strictly unsafe|far from|un-safe)\b/i;

/**
 * Regex identifying high AQI numbers incorrectly described as clean.
 */
const CLEAN_HIGH_AQI_REGEX =
  /\b(clean|fresh|safe|pristine)\s+(?:naqi|aqi|air|reading)\s*(?:of|is|at|:)?\s*([0-9]{3})\b/i;

/**
 * Checks if a single sentence makes an unsafe claim contradicting the safety verdict.
 * Only flags sentences that assert OUTDOOR exposure/activity is safe during Moderate, Poor, Very Poor, or Severe air.
 *
 * @param {string} sentence - A single sentence from the reply.
 * @param {boolean} isModerateOrWorse - True if active AQI category is Moderate or worse.
 * @returns {{ isUnsafe: boolean, reason: string | null }}
 */
export function isSentenceUnsafe(sentence, isModerateOrWorse) {
  if (!sentence || typeof sentence !== 'string' || !isModerateOrWorse) {
    return { isUnsafe: false, reason: null };
  }

  const s = sentence.trim();

  // 1. Self-contradiction: High AQI number (>= 201) referred to as clean/safe
  const cleanHighMatch = s.match(CLEAN_HIGH_AQI_REGEX);
  if (cleanHighMatch) {
    const num = parseInt(cleanHighMatch[2], 10);
    if (num >= 201) {
      return {
        isUnsafe: true,
        reason: `Self-contradiction: asserts AQI ${num} is ${cleanHighMatch[1]}`
      };
    }
  }

  // 2. Outdoor activity asserted as safe when category is Moderate or worse
  const hasOutdoorContext = OUTDOOR_CONTEXT_REGEX.test(s);
  const hasSafetyClaim = SAFETY_CLAIM_REGEX.test(s);

  if (hasOutdoorContext && hasSafetyClaim) {
    // Check if the safety claim is negated (e.g. "not safe to play outside", "strictly unsafe")
    const hasNegation = NEGATION_REGEX.test(s);
    if (!hasNegation) {
      return {
        isUnsafe: true,
        reason: `Asserts outdoor activity is safe during polluted air: "${s}"`
      };
    }
  }

  // 3. Opening affirmative contradiction (e.g. "Yes, it is entirely safe...")
  if (/^yes,?\s+(?:it is\s+)?(?:entirely|completely|perfectly|totally)?\s*safe\b/i.test(s)) {
    if (!NEGATION_REGEX.test(s.slice(0, 30))) {
      return {
        isUnsafe: true,
        reason: `Opens with affirmative safety claim during polluted air: "${s}"`
      };
    }
  }

  return { isUnsafe: false, reason: null };
}

/**
 * Validates model-generated reply and performs targeted sentence-level repair.
 * When a sentence asserts outdoor activity is safe during bad air, replaces ONLY that sentence
 * with the deterministic verdict warning, keeping the rest of the reply intact.
 * If more than one-third of the reply is replaced, triggers regeneration.
 *
 * @param {string} replyText - Model generated text.
 * @param {object} verdict - Deterministic safety verdict from computeSafetyVerdict.
 * @param {number} aqi - Ground-truth NAQI.
 * @param {string} [category] - Ground-truth category label.
 * @returns {{ isValid: boolean, repairedText: string, issues: Array<string>, shouldRegenerate: boolean, replacedRatio: number }}
 */
export function validateReplySafety(replyText, verdict, aqi, category = null) {
  if (!replyText || typeof replyText !== 'string') {
    return {
      isValid: false,
      repairedText: '',
      issues: ['Empty or invalid reply text'],
      shouldRegenerate: true,
      replacedRatio: 1
    };
  }

  const numericAqi = Math.round(Number(aqi ?? verdict?.aqi ?? 0));
  const catName = category || verdict?.category || getAQICategory(numericAqi).name;
  const isModerateOrWorse =
    catName === 'Moderate' ||
    catName === 'Poor' ||
    catName === 'Very Poor' ||
    catName === 'Severe';

  const issues = [];
  let totalLength = replyText.length;
  let replacedLength = 0;

  // Split text by lines/paragraphs to preserve formatting, bullets, and spacing
  const lines = replyText.split('\n');
  const repairedLines = [];

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    // If empty line or heading, keep intact
    if (!line.trim() || /^#{1,6}\s+/.test(line)) {
      repairedLines.push(line);
      continue;
    }

    // Split line into sentences while preserving sentence endings
    const sentenceTokens = line.split(/(?<=[.!?])\s+(?=[A-Z0-9*#\-<])/);
    const repairedSentences = [];

    for (let sIdx = 0; sIdx < sentenceTokens.length; sIdx++) {
      let sentence = sentenceTokens[sIdx];

      // Check for unauthorized medication alterations
      const medAlteration =
        /\b(?:increase|decrease|double|stop|change|prescribe|administer\s+a\s+dose\s+of)\s+(?:your\s+)?(?:dosage|dose|medication|medicine|tablets|pills|steroids)\b/i;
      if (medAlteration.test(sentence)) {
        issues.push(`Medication modification advice detected: "${sentence}"`);
        replacedLength += sentence.length;
        repairedSentences.push(
          'Always follow your doctor-prescribed medication plan and consult a physician before modifying any dosage.'
        );
        continue;
      }

      // Check for unsafe outdoor activity claims
      const check = isSentenceUnsafe(sentence, isModerateOrWorse);
      if (check.isUnsafe) {
        issues.push(check.reason);
        replacedLength += sentence.length;

        // Replace ONLY this sentence with the deterministic verdict warning
        const replacement =
          verdict?.directAnswerPhrase ||
          `No, outdoor activity is strictly unsafe today with air quality in the ${catName} range (NAQI ${numericAqi}).`;
        repairedSentences.push(replacement);
      } else {
        repairedSentences.push(sentence);
      }
    }

    repairedLines.push(repairedSentences.join(' '));
  }

  const repairedText = repairedLines.join('\n');
  const replacedRatio = totalLength > 0 ? replacedLength / totalLength : 0;

  // If more than a third of the reply would be changed, trigger regeneration
  const shouldRegenerate = replacedRatio > 0.333;
  const isValid = issues.length === 0 || (!shouldRegenerate && replacedLength > 0);

  return {
    isValid,
    repairedText,
    issues,
    shouldRegenerate,
    replacedRatio
  };
}

/**
 * Builds corrective instruction for 1-time AI model regeneration.
 *
 * @param {Array<string>} issues - Identified safety violations.
 * @param {object} verdict - Deterministic safety verdict.
 * @returns {string} High-priority correction prompt.
 */
export function buildCorrectivePrompt(issues = [], verdict = {}) {
  const aqi = verdict.aqi || 250;
  const cat = verdict.category || 'Poor';
  return `CRITICAL SAFETY OVERRIDE:
Your previous draft failed safety verification for the following reason(s):
- ${issues.join('\n- ')}

MANDATORY RULES FOR THIS ATTEMPT:
1. Current ground-truth air quality is NAQI ${aqi} (${cat}).
2. You MUST start your response with: "${verdict.directAnswerPhrase || 'No, outdoor activity is not safe today.'}"
3. Do NOT claim the air is clean, safe, pristine, or unrestricted outdoors.
4. Keep the answer under 200 words, direct, empathetic, and actionable.
5. Emphasize staying indoors, using certified N95/FFP2 masks for any essential transit, and damp-mopping.`;
}

/**
 * Generates pure deterministic, 100% compliant safety reply when AI fails or produces unsafe output twice.
 *
 * @param {object} verdict - Deterministic safety verdict from computeSafetyVerdict.
 * @param {string} [cityName='your city'] - Active city name.
 * @param {string} [_query=''] - User query.
 * @returns {string} Safe, structured markdown reply.
 */
export function buildDeterministicSafetyReply(verdict, cityName = 'your city', _query = '') {
  const aqi = verdict.aqi ?? 150;
  const category = verdict.category || 'Moderate';
  const directAnswer =
    verdict.directAnswerPhrase || 'Outdoor activity should be approached with caution today.';

  const bullets = (verdict.actionableGuidance || []).map((g) => `- ${g}`).join('\n');
  const indoor = (verdict.indoorRecommendations || []).map((r) => `- ${r}`).join('\n');
  const mask = verdict.recommendedMask || 'Certified N95 respirator';

  return `${directAnswer}

In ${cityName}, the estimated CPCB NAQI is currently **${aqi} (${category})**.

**Recommended Actions:**
${bullets}
- **Mask Protection:** ${mask}.

**Indoor Protection:**
${indoor}

> 🩺 *Medical disclaimer: Foggy is an AI assistant, not a doctor. If you experience severe breathlessness or a medical emergency, call 112 or 108 immediately.*`;
}
