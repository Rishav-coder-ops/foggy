// shared/chatIntent/contextBuilder.js
/**
 * @fileoverview Compact JSON context serialization for LLM prompts.
 */

import { INTENT_TYPES } from './intentTypes.js';

export function buildCompactContext(
  primaryReport,
  profile = {},
  intentType = INTENT_TYPES.AQI_STATUS,
  secondaryReport = null
) {
  const familyList = profile?.familyMembers || [];

  let relevantFamily = [];
  if (intentType === INTENT_TYPES.KIDS_OR_SENIORS_SAFETY) {
    relevantFamily = familyList.filter((m) => {
      const rel = (m.relationship || m.tag || m.role || '').toLowerCase();
      if (rel.includes('pet') || rel.includes('dog') || rel.includes('cat')) return false;
      const age = parseInt(m.age, 10);
      return (
        rel.includes('child') ||
        rel.includes('son') ||
        rel.includes('daughter') ||
        rel.includes('kid') ||
        rel.includes('senior') ||
        rel.includes('dadi') ||
        rel.includes('nani') ||
        rel.includes('dada') ||
        rel.includes('nana') ||
        rel.includes('grand') ||
        (Number.isFinite(age) && (age <= 12 || age >= 60))
      );
    });
    if (relevantFamily.length === 0) {
      relevantFamily = familyList
        .filter((m) => {
          const rel = (m.relationship || m.tag || m.role || '').toLowerCase();
          return !rel.includes('pet') && !rel.includes('dog') && !rel.includes('cat');
        })
        .slice(0, 2);
    }
  } else if (
    intentType === INTENT_TYPES.ACTIVITY_SAFETY ||
    intentType === INTENT_TYPES.HEALTH_SYMPTOM_CONCERN
  ) {
    relevantFamily = familyList.filter((m) => m.condition && m.condition !== 'None');
    if (relevantFamily.length === 0) relevantFamily = familyList.slice(0, 1);
  } else if (intentType === INTENT_TYPES.PLAN_MY_DAY) {
    relevantFamily = familyList.slice(0, 2);
  } else {
    relevantFamily = familyList.filter((m) => m.condition && m.condition !== 'None').slice(0, 2);
  }

  const compactFamily = relevantFamily.map((m) => ({
    name: m.name,
    role: m.relationship || m.role || 'Dependent',
    condition: m.condition || (Array.isArray(m.conditions) ? m.conditions.join(', ') : 'None')
  }));

  const contextObj = {
    city: primaryReport.city,
    state: primaryReport.admin1 || 'India',
    estimatedNAQI: primaryReport.current.aqi,
    category: primaryReport.current.category,
    dominantPollutant: primaryReport.current.dominant || 'PM2.5',
    dataSourceAndTime: `Open-Meteo CAMS / CPCB NAQI at ${primaryReport.current.time}`,
    bestUpcomingHour: `${primaryReport.bestHour24h.hour} (NAQI ${primaryReport.bestHour24h.aqi}, ${primaryReport.bestHour24h.category})`,
    worstUpcomingHour: `${primaryReport.worstHour24h.hour} (NAQI ${primaryReport.worstHour24h.aqi}, ${primaryReport.worstHour24h.category})`
  };

  if (secondaryReport) {
    contextObj.comparisonCity = {
      city: secondaryReport.city,
      state: secondaryReport.admin1 || 'India',
      estimatedNAQI: secondaryReport.current.aqi,
      category: secondaryReport.current.category,
      dominantPollutant: secondaryReport.current.dominant || 'PM2.5',
      bestUpcomingHour: `${secondaryReport.bestHour24h.hour} (NAQI ${secondaryReport.bestHour24h.aqi}, ${secondaryReport.bestHour24h.category})`
    };
  }

  if (profile?.commute || profile?.cookingType) {
    contextObj.savedProfileSummary = {
      commute: profile.commute || 'Metro',
      cooking: profile.cookingType || 'LPG'
    };
  }

  if (compactFamily.length > 0) {
    contextObj.relevantFamilyMembers = compactFamily;
  }

  return contextObj;
}
