// shared/chat/memoryExtractor.js
/**
 * @fileoverview Extraction of structured health and lifestyle facts from user messages.
 */

export function extractMemoryFact(message) {
  if (!message || typeof message !== 'string') return null;
  const facts = extractMemoryFacts(message);
  if (facts.length === 0) return null;
  return {
    category: facts[0].category,
    value: facts[0].value || facts[0].condition,
    entity: facts[0].name || facts[0].entity
  };
}

export function extractMemoryFacts(message) {
  if (!message || typeof message !== 'string') return [];
  const q = message.toLowerCase();
  const extractedFacts = [];

  if (q.includes('father') || q.includes('dad') || q.includes('pitaji')) {
    if (q.includes('copd') || q.includes('asthma') || q.includes('heart') || q.includes('saans')) {
      const cond = q.includes('copd')
        ? 'COPD'
        : q.includes('asthma') || q.includes('saans')
          ? 'Asthma'
          : 'Heart condition';
      extractedFacts.push({
        type: 'family',
        category: 'health',
        name: 'Father',
        role: 'Senior',
        condition: cond,
        value: cond
      });
    }
  }
  if (
    q.includes('daughter') ||
    q.includes('son') ||
    q.includes('child') ||
    q.includes('kid') ||
    q.includes('baccha')
  ) {
    if (q.includes('asthma') || q.includes('allerg') || q.includes('saans')) {
      const cond = q.includes('asthma') ? 'Asthma' : 'Allergies';
      extractedFacts.push({
        type: 'family',
        category: 'health',
        name: 'Child',
        role: 'Child',
        condition: cond,
        value: cond
      });
    }
  }
  if (
    q.includes('chulha') ||
    q.includes('wood') ||
    q.includes('coal') ||
    q.includes('angithi') ||
    q.includes('lpg') ||
    q.includes('png') ||
    q.includes('induction')
  ) {
    const heat = q.includes('chulha')
      ? 'Wood/Dung Chulha'
      : q.includes('angithi')
        ? 'Coal/Charcoal Angithi'
        : q.includes('induction')
          ? 'Induction Cooktop'
          : q.includes('png')
            ? 'PNG Piped Gas'
            : 'LPG Cylinder';
    extractedFacts.push({
      type: 'home',
      category: 'home',
      key: 'cooking',
      value: heat
    });
  }
  if (
    q.includes('metro') ||
    q.includes('train') ||
    q.includes('bus') ||
    q.includes('auto') ||
    q.includes('scooter') ||
    q.includes('bike') ||
    q.includes('car')
  ) {
    const commute = q.includes('metro')
      ? 'Metro'
      : q.includes('train')
        ? 'Local Train'
        : q.includes('bus')
          ? 'City Bus'
          : q.includes('auto')
            ? 'Auto/E-Rickshaw'
            : q.includes('bike') || q.includes('scooter')
              ? 'Two-Wheeler'
              : 'Car';
    extractedFacts.push({
      type: 'lifestyle',
      category: 'lifestyle',
      key: 'commute',
      value: commute
    });
  }

  return extractedFacts;
}
