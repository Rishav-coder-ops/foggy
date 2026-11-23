// shared/safety/safetyValidator.js
/**
 * @fileoverview Post-generation safety validation and repair engine.
 * Inspects AI responses against deterministic safety verdicts and atmospheric ground truth.
 * Rejects/repairs unsafe claims (e.g., claiming outdoor play is safe during Moderate/Poor/Very Poor smog),
 * detects self-contradictory statements, forbids prescription modifications, and enforces medical disclaimers.
 */

import { getAQICategory } from '../aqi.js';

/**
 * List of forbidden phrases claiming outdoor activity is safe or air is clean
 * when AQI is Moderate, Poor, Very Poor, or Severe.
 */
export const FORBIDDEN_POSITIVE_ACTIVITY_PHRASES = [
  'entirely safe',
  'completely safe',
  'perfectly safe',
  'totally safe',
  'no risk',
  'little or no risk',
  'unrestricted',
  'any time of the day',
  'go ahead and play',
  'go ahead and run',
  'go ahead and exercise',
  'pristine',
  'clean air',
  'clean aqi',
  'great day to play',
  'great day for outdoor',
  'feel free to play',
  'feel free to go out',
  'enjoy outdoor play',
  'enjoy outdoor exercise',
  'enjoy unrestricted',
  'unrestricted outdoor play',
  'unrestricted outdoor',
  'safe for your kid to play outside',
  'safe for your child to play outside',
  'safe for outdoor play',
  'safe to run outside',
  'safe to exercise outside'
];

/**
 * Validates model-generated reply against ground-truth verdict and AQI.
 *
 * @param {string} replyText - Model generated text.
 * @param {object} verdict - Deterministic safety verdict from computeSafetyVerdict.
 * @param {number} aqi - Ground-truth NAQI.
 * @param {string} [category] - Ground-truth category label.
 * @returns {{ isValid: boolean, issues: Array<string>, shouldRegenerate: boolean }}
 */
export function validateReplySafety(replyText, verdict, aqi, category = null) {
  if (!replyText || typeof replyText !== 'string') {
    return { isValid: false, issues: ['Empty or invalid reply text'], shouldRegenerate: true };
  }

  const issues = [];
  const textLower = replyText.toLowerCase();
  const numericAqi = Math.round(Number(aqi ?? verdict?.aqi ?? 0));
  const catName = category || verdict?.category || getAQICategory(numericAqi).name;
  const isPolluted = catName === 'Poor' || catName === 'Very Poor' || catName === 'Severe';
  const isModerateOrWorse = isPolluted || catName === 'Moderate';

  // 1. Check for forbidden positive claims when air is Moderate or worse
  if (isModerateOrWorse) {
    for (const phrase of FORBIDDEN_POSITIVE_ACTIVITY_PHRASES) {
      if (textLower.includes(phrase)) {
        const idx = textLower.indexOf(phrase);
        // If 'safe' is part of 'unsafe' (e.g. "strictly unsafe for your child to play outside"), it's a safety warning, not a violation
        if (idx > 0 && textLower.slice(idx - 2, idx) === 'un') {
          continue;
        }
        // Exception: only allowed if preceded by negation (e.g., "not entirely safe", "never unrestricted", "not safe")
        const prefix = textLower.slice(Math.max(0, idx - 30), idx);
        const isNegated = /\b(not|never|hardly|scarcely|isn't|is not|cannot be|is no longer|neither|no|unsafe|strictly unsafe|far from|un-safe)\s*$/i.test(
          prefix.trim()
        );
        if (!isNegated) {
          issues.push(
            `Claims outdoor activity is safe or unrestricted despite ${catName} air ("${phrase}")`
          );
          break;
        }
      }
    }
  }

  // 2. Check for self-contradictions (e.g. positive words near Poor/Very Poor/Severe or AQI >= 201)
  if (numericAqi >= 201 || isPolluted) {
    // Check for "clean NAQI of X" or "safe NAQI of X" or "clean air ... X"
    const cleanNearAqi = /\b(clean|fresh|safe|healthy|pristine)\s+(?:naqi|aqi|air|reading)\s*(?:of|is|at|:)?\s*([0-9]{3})/i;
    const match = replyText.match(cleanNearAqi);
    if (match) {
      const matchedNum = parseInt(match[2], 10);
      if (matchedNum >= 201) {
        issues.push(
          `Self-contradiction: refers to high AQI ${matchedNum} as "${match[1]}"`
        );
      }
    }

    // Check for direct contradiction phrases like "Yes, it is entirely safe ... Poor/Very Poor"
    if (
      /\b(?:yes,?\s+(?:it is\s+)?(?:entirely|completely|perfectly|totally)?\s*safe)\b/i.test(replyText) &&
      !/\b(?:not|never)\b/i.test(replyText.slice(0, 30))
    ) {
      issues.push(`Affirmatively states outdoor activity is safe when AQI is ${catName}`);
    }
  }

  // 3. Check for unauthorized medication adjustments
  const medAlteration = /\b(?:increase|decrease|double|stop|change|prescribe|administer\s+a\s+dose\s+of)\s+(?:your\s+)?(?:dosage|dose|medication|medicine|tablets|pills|steroids)\b/i;
  if (medAlteration.test(textLower)) {
    issues.push('Advises modifying medication dosage without physician consultation');
  }

  // 4. Check for verdict adherence: If verdict strictly said outdoor activity is unsafe, reply must not recommend going out
  if (verdict && !verdict.isOutdoorSafe && verdict.isOutdoorQuery) {
    const openingSentences = replyText.slice(0, 200).toLowerCase();
    const opensWithDirectNo = /\b(no|avoid|unsafe|not safe|not recommended|stay indoors|should not)\b/i.test(
      openingSentences
    );
    const opensWithDirectYes = /\b(yes|safe|fine|go ahead|enjoy)\b/i.test(openingSentences);

    if (opensWithDirectYes && !opensWithDirectNo) {
      issues.push(`Verdict requires outdoor activity to be avoided, but reply opens affirmatively`);
    }
  }

  const isValid = issues.length === 0;
  return {
    isValid,
    issues,
    shouldRegenerate: !isValid
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
3. Do NOT claim the air is clean, safe, pristine, or unrestricted.
4. Keep the answer under 200 words, direct, empathetic, and actionable.
5. Emphasize staying indoors, using certified N95/FFP2 masks for any essential transit, and damp-mopping.`;
}

/**
 * Generates pure deterministic, 100% compliant safety reply when AI fails or produces unsafe output twice.
 *
 * @param {object} verdict - Deterministic safety verdict from computeSafetyVerdict.
 * @param {string} [cityName='your city'] - Active city name.
 * @param {string} [query=''] - User query.
 * @returns {string} Safe, structured markdown reply.
 */
export function buildDeterministicSafetyReply(verdict, cityName = 'your city', _query = '') {
  const aqi = verdict.aqi ?? 150;
  const category = verdict.category || 'Moderate';
  const directAnswer = verdict.directAnswerPhrase || 'Outdoor activity should be approached with caution today.';

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
