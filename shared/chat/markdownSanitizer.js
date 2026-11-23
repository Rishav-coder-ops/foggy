// shared/chat/markdownSanitizer.js
/**
 * @fileoverview Markdown sanitization, truncation repair, and response quality checks.
 * Handles finishReason MAX_TOKENS by trimming to the last complete sentence/bullet,
 * balancing markdown markers (bold, italics, code), removing trailing broken tags,
 * and enforcing minimum response length and quality.
 */

/**
 * Trims text to the last complete sentence or bullet item if it was truncated mid-sentence.
 * Removes trailing broken words and dangling punctuation.
 *
 * @param {string} text - Raw or partially truncated text.
 * @returns {string} Text trimmed to the last complete sentence or bullet.
 */
export function trimToLastCompleteSentence(text) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // If text already ends with terminal punctuation (. ! ? " ' ) or balanced markdown ending
  if (/[.!?]["')\]*`_]*\s*$/.test(trimmed)) {
    return trimmed;
  }

  // Check lines from bottom up: if the last line is a dangling heading or fragment, drop it
  const lines = trimmed.split('\n');
  if (lines.length > 1) {
    const validLines = [];
    for (const line of lines) {
      if (line.trim().length > 0) {
        validLines.push(line);
      }
    }
    while (validLines.length > 1) {
      const lastLine = validLines[validLines.length - 1].trim();
      const isDanglingLine =
        /^(?:#{1,6}\s+.*?|\*+.*|\-+.*|>\s*.*|[A-Za-z0-9\s]{1,20})$/.test(lastLine) &&
        !/[.!?]["')\]*`_]*$/.test(lastLine);
      if (isDanglingLine) {
        validLines.pop();
      } else {
        break;
      }
    }
    const candidate = validLines.join('\n').trim();
    if (candidate.length >= 20) {
      return candidate;
    }
  }

  // Find the last terminal sentence boundary: . ! ? followed by whitespace, newline, or end
  const matches = [...trimmed.matchAll(/[.!?]["')\]*`_]*(?:\s+|$)/g)];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const cutIndex = lastMatch.index + lastMatch[0].length;
    const candidate = trimmed.slice(0, cutIndex).trim();
    if (candidate.length >= 20) {
      return candidate;
    }
  }

  return trimmed;
}

/**
 * Repairs unbalanced markdown markers (bold, italics, inline code) and removes trailing markers.
 *
 * @param {string} text - Input markdown text.
 * @returns {string} Balanced markdown text.
 */
export function balanceMarkdownMarkers(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text;

  // 1. Remove dangling trailing markdown markers e.g. trailing '**', '#', '-', '*', '>', '__'
  cleaned = cleaned.replace(/(?:^|\n)\s*(?:#+|-|\*|>)\s*$/g, '');
  cleaned = cleaned.replace(/\s*(?:\*\*|__|\*|_|#+|-)\s*$/g, '');

  // 2. Remove unfinished heading or bold prefix at the very end of text e.g. '**Morning' or '### Tip'
  cleaned = cleaned.replace(/(?:^|\n)\s*(?:\*\*|__)[A-Za-z0-9\s]{1,30}$/g, '');
  cleaned = cleaned.replace(/(?:^|\n)#{1,6}\s+[A-Za-z0-9\s]{1,30}$/g, '');

  // 3. Balance bold markers (**)
  const boldMatches = cleaned.match(/\*\*/g);
  if (boldMatches && boldMatches.length % 2 !== 0) {
    // If odd number of '**', close it at the end
    cleaned += '**';
  }

  // 4. Balance italic markers (*) that are not part of bold
  const nonBoldAsterisks = cleaned.replace(/\*\*/g, '').match(/\*/g);
  if (nonBoldAsterisks && nonBoldAsterisks.length % 2 !== 0) {
    cleaned += '*';
  }

  // 5. Balance backticks (`)
  const backtickMatches = cleaned.match(/`/g);
  if (backtickMatches && backtickMatches.length % 2 !== 0) {
    cleaned += '`';
  }

  return cleaned.trim();
}

/**
 * Validates minimum response quality:
 * Must be at least ~20 words and not end abruptly mid-sentence.
 *
 * @param {string} text - Repaired reply text.
 * @param {boolean} [isShortExpected=false] - Whether a brief reply is expected.
 * @returns {{ isQualityPass: boolean, reason: string | null, wordCount: number }}
 */
export function checkMinimumResponseQuality(text, isShortExpected = false) {
  if (!text || typeof text !== 'string') {
    return { isQualityPass: false, reason: 'Empty response text', wordCount: 0 };
  }

  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Must not end mid-sentence without terminal punctuation or list ending
  const endsWithTerminal = /[.!?*`_]["')\]]*\s*$/.test(trimmed);
  if (!endsWithTerminal) {
    return {
      isQualityPass: false,
      reason: 'Response ends mid-sentence without terminal punctuation',
      wordCount
    };
  }

  // 2. Minimum word count check (at least 20 words for standard questions, 6 words for short factual queries)
  const minWords = isShortExpected ? 6 : 20;
  if (wordCount < minWords) {
    return {
      isQualityPass: false,
      reason: `Response too short (${wordCount} words; minimum required: ${minWords})`,
      wordCount
    };
  }

  return { isQualityPass: true, reason: null, wordCount };
}

/**
 * Full sanitization pipeline for raw model replies:
 * 1. Trims truncated text to the last complete sentence.
 * 2. Balances markdown markers and strips dangling tags.
 *
 * @param {string} rawText - Text from model candidate.
 * @param {string} [finishReason='STOP'] - finishReason from Gemini API.
 * @returns {string} Cleaned, balanced markdown text.
 */
export function sanitizeModelReplyText(rawText, finishReason = 'STOP') {
  if (!rawText || typeof rawText !== 'string') return '';

  let processed = rawText;

  // If finishReason is MAX_TOKENS or text ends with dangling incomplete heading/token
  const isAbrupt =
    /(?:^|\n)\s*(?:#+|-|\*|>)\s*$/.test(processed) ||
    /(?:^|\n)\s*(?:\*\*|__)[A-Za-z0-9\s]{1,30}$/.test(processed);

  if (finishReason === 'MAX_TOKENS' || isAbrupt) {
    processed = trimToLastCompleteSentence(processed);
  }

  // Balance markdown markers and remove trailing broken tokens
  processed = balanceMarkdownMarkers(processed);

  return processed;
}
