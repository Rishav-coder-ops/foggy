// shared/safety/safetyVerdict.js
/**
 * @fileoverview Deterministic, rule-based health and activity safety verdict engine.
 * Computes safety verdicts strictly from CPCB NAQI categories and vulnerable personas
 * (children, seniors, asthma, COPD, heart disease, pregnancy, athletes, outdoor workers).
 * Guarantees consistent ground truth before calling AI models and for reply validation.
 */

import { getAQICategory } from '../aqi.js';

/**
 * Extracts all relevant personas from user query, profile, and family members list.
 *
 * @param {string} query - User message text.
 * @param {object} [profile={}] - User profile object.
 * @param {Array<object>} [familyMembers=[]] - Family members list.
 * @returns {Array<string>} List of detected persona identifiers.
 */
export function detectInvolvedPersonas(query = '', profile = {}, familyMembers = []) {
  const personas = new Set();
  const q = (query || '').toLowerCase();

  // Detect terms in user query
  if (
    /\b(kid|kids|child|children|baby|babies|infant|infants|toddler|toddlers|son|daughter|beta|beti|baccha|bachhe|bacche)\b/i.test(
      q
    )
  )
    personas.add('child');
  if (
    /\b(senior|seniors|elder|elders|elderly|grandpa|grandma|grandfather|grandmother|dada|dadi|nana|nani|father|mother|dad|mom|papa|mummy|parent|parents|bua|chacha)\b/i.test(
      q
    )
  )
    personas.add('senior');
  if (/\b(asthma|asthmatic|wheeze|wheezing|inhaler|asthalin|respiratory)\b/i.test(q))
    personas.add('asthma');
  if (/\b(copd|emphysema|chronic bronchitis|lung disease|pulmonary)\b/i.test(q))
    personas.add('copd');
  if (/\b(heart|cardiac|cardiovascular|hypertension|bp|blood pressure)\b/i.test(q))
    personas.add('heartDisease');
  if (/\b(pregnant|pregnancy|expecting|trimester)\b/i.test(q)) personas.add('pregnancy');
  if (
    /\b(run|running|runner|jog|jogging|workout|exercise|exercising|marathon|cycling|cycle|biking|football|cricket|sports|training)\b/i.test(
      q
    )
  )
    personas.add('athlete');
  if (/\b(delivery|traffic|street|vendor|construction|outdoor work|field work)\b/i.test(q))
    personas.add('outdoorWorker');

  // Inspect saved family members
  if (Array.isArray(familyMembers)) {
    for (const m of familyMembers) {
      const rel = (m.relationship || m.tag || m.role || '').toLowerCase();
      const cond = (
        m.condition ||
        (Array.isArray(m.conditions) ? m.conditions.join(' ') : '') ||
        ''
      ).toLowerCase();
      const age = parseInt(m.age, 10);

      if (
        /child|son|daughter|kid|baby/i.test(rel) ||
        (Number.isFinite(age) && age <= 14)
      ) {
        personas.add('child');
      }

      if (
        /senior|elder|grand|dada|dadi|nana|nani/i.test(rel) ||
        (Number.isFinite(age) && age >= 60)
      ) {
        personas.add('senior');
      }

      if (cond.includes('asthma')) personas.add('asthma');
      if (cond.includes('copd') || cond.includes('bronchitis')) personas.add('copd');
      if (cond.includes('heart') || cond.includes('cardiac') || cond.includes('hypertension'))
        personas.add('heartDisease');
      if (cond.includes('pregnant')) personas.add('pregnancy');
    }
  }

  // Inspect profile self
  if (profile) {
    const pCond = (profile.healthConditions || profile.condition || '').toString().toLowerCase();
    const pAge = parseInt(profile.age, 10);
    if (pCond.includes('asthma')) personas.add('asthma');
    if (pCond.includes('copd')) personas.add('copd');
    if (pCond.includes('heart')) personas.add('heartDisease');
    if (pCond.includes('pregnant')) personas.add('pregnancy');
    if (Number.isFinite(pAge) && pAge >= 60) personas.add('senior');
  }

  // Default to general adult if none detected
  if (personas.size === 0) {
    personas.add('generalAdult');
  }

  return Array.from(personas);
}

/**
 * Checks if query asks a direct yes/no outdoor activity safety question.
 * @param {string} query
 * @returns {boolean}
 */
function isDirectOutdoorSafetyQuestion(query = '') {
  const q = (query || '').toLowerCase().trim();
  if (!q) return false;
  const isQ =
    /\b(can|could|should|is it safe|is it okay|is it ok|are we safe|may i|allowed to|safe to|safe for|okay to|ok to)\b/i.test(
      q
    ) || q.endsWith('?');
  const hasAct =
    /\b(play|playing|run|running|jog|jogging|walk|walking|walks|exercise|workout|cycling|cycle|bike|biking|sports|match|cricket|football|outside|outdoors|step out|go out|stroll)\b/i.test(
      q
    );
  return isQ && hasAct;
}

function isOutdoorActivityQuery(query = '') {
  return /\b(play|playing|run|running|jog|jogging|walk|walking|walks|exercise|workout|cycling|cycle|bike|biking|sports|match|cricket|football|outside|outdoors|step out|go out|stroll)\b/i.test(
    query
  );
}

/**
 * Computes deterministic safety verdict strictly from NAQI category and people involved.
 *
 * @param {object} params
 * @param {number} params.aqi - CPCB NAQI value.
 * @param {string} [params.category] - CPCB category label.
 * @param {string} [params.query=''] - User question.
 * @param {object} [params.profile={}] - User profile.
 * @param {Array<object>} [params.familyMembers=[]] - Household members.
 * @returns {object} Safety verdict object.
 */
export function computeSafetyVerdict({
  aqi,
  category = null,
  query = '',
  profile = {},
  familyMembers = []
}) {
  const numericAqi = Math.round(Number(aqi) || 0);
  const catObj = category ? { name: category } : getAQICategory(numericAqi);
  const catName = catObj.name;
  const involved = detectInvolvedPersonas(query, profile, familyMembers);
  const isOutdoor = isOutdoorActivityQuery(query);
  const isDirectSafety = query ? isDirectOutdoorSafetyQuestion(query) : true;

  const hasChildren = involved.includes('child');
  const hasSeniors = involved.includes('senior');
  const hasAsthma = involved.includes('asthma');
  const hasCopd = involved.includes('copd');
  const hasHeart = involved.includes('heartDisease');
  const hasPregnancy = involved.includes('pregnancy');
  const isVulnerable =
    hasChildren || hasSeniors || hasAsthma || hasCopd || hasHeart || hasPregnancy;

  let isOutdoorSafe = false;
  let verdictLabel = 'UNSAFE_AVOID';
  let directAnswerPhrase = '';
  let verdictSummary = '';
  let actionableGuidance = [];
  let recommendedMask = 'Certified N95 or FFP2 respirator';
  let indoorRecommendations = [];

  switch (catName) {
    case 'Good': {
      isOutdoorSafe = true;
      verdictLabel = 'SAFE';
      recommendedMask = 'Not required';
      directAnswerPhrase = 'Yes, it is safe to play and exercise outside today.';
      verdictSummary = `With air quality in the Good range (NAQI ${numericAqi}), outdoor activities pose minimal risk for everyone, including children and seniors.`;
      actionableGuidance = [
        'Outdoor play, jogging, sports, and open-air walks are completely fine today.',
        'Great day for natural ventilation: feel free to open windows for fresh air.'
      ];
      indoorRecommendations = ['Enjoy natural ventilation with open windows.'];
      break;
    }

    case 'Satisfactory': {
      isOutdoorSafe = true;
      verdictLabel = 'SAFE';
      recommendedMask = isVulnerable ? 'Optional (keep handy near dusty roads)' : 'Not required';
      if (isVulnerable) {
        directAnswerPhrase =
          'Yes, outdoor activity is generally safe today, but monitor for any minor coughing or fatigue.';
        verdictSummary = `Air quality is Satisfactory (NAQI ${numericAqi}). Outdoor play is permitted, but sensitive individuals should watch for minor symptoms during prolonged exertion.`;
      } else {
        directAnswerPhrase = 'Yes, outdoor activities and exercise are safe today.';
        verdictSummary = `Air quality is Satisfactory (NAQI ${numericAqi}) with low health risk.`;
      }
      actionableGuidance = [
        'Outdoor play and regular exercise are safe today.',
        isVulnerable
          ? 'Children and individuals with asthma or COPD should avoid very prolonged heavy exertion during morning hours.'
          : 'Normal outdoor routines can continue as scheduled.'
      ];
      indoorRecommendations = [
        'Open windows during sunny afternoon hours for fresh air circulation.'
      ];
      break;
    }

    case 'Moderate': {
      isOutdoorSafe = !isVulnerable;
      verdictLabel = isVulnerable ? 'CAUTION_LIMIT' : 'ACCEPTABLE_MODERATE';
      recommendedMask = 'Certified N95 respirator for busy traffic corridors';
      if (isVulnerable) {
        directAnswerPhrase = 'Caution: limit prolonged or heavy outdoor activity today.';
        verdictSummary = `Air quality is Moderate (NAQI ${numericAqi}). Children, seniors, and anyone with respiratory conditions (asthma/COPD) should reduce outdoor exertion.`;
        actionableGuidance = [
          'Avoid intense outdoor cardio or prolonged playground games today.',
          'Shift outdoor play to the early afternoon (1:00 PM – 3:30 PM) when solar heating disperses ground-level particles.',
          hasAsthma || hasCopd
            ? 'Keep prescribed rescue inhalers (e.g., salbutamol) readily accessible.'
            : 'Wear a well-fitted N95 mask if spending more than 30 minutes outdoors.'
        ];
      } else {
        directAnswerPhrase =
          'Conditionally yes: outdoor activity is acceptable, but reduce prolonged strenuous cardio.';
        verdictSummary = `Air quality is Moderate (NAQI ${numericAqi}). Healthy adults can exercise, but avoid peak rush-hour roadside exposure.`;
        actionableGuidance = [
          'Choose parks away from heavy vehicular traffic.',
          'Schedule runs or cycling for the afternoon solar dispersal window.'
        ];
      }
      indoorRecommendations = [
        'Keep windows closed during early morning and late evening rush hours.',
        'Run kitchen exhaust while cooking to prevent indoor particulate buildup.'
      ];
      break;
    }

    case 'Poor': {
      isOutdoorSafe = false;
      verdictLabel = 'UNSAFE_AVOID';
      recommendedMask = 'Certified N95 or FFP2 respirator with tight seal (mandatory for transit)';
      if (hasChildren) {
        directAnswerPhrase = 'No, it is not safe for your child to play outside today.';
      } else if (hasCopd || hasAsthma || hasSeniors) {
        directAnswerPhrase = 'No, outdoor walks and exercise should be strictly avoided today.';
      } else {
        directAnswerPhrase = 'No, outdoor running and heavy exertion are not recommended today.';
      }

      verdictSummary = `Air quality is Poor (NAQI ${numericAqi}). Breathing polluted air during exercise increases deep lung particulate deposition by 5x to 10x, causing respiratory irritation.`;
      actionableGuidance = [
        hasChildren
          ? 'Keep kids indoors for play, reading, and indoor activities.'
          : 'Shift outdoor workouts to indoor yoga, stretching, or home exercises.',
        'If stepping outside for unavoidable commutes, wear a certified N95 or FFP2 respirator.',
        hasAsthma || hasCopd
          ? 'Keep doctor-prescribed rescue inhalers nearby and monitor breathing closely.'
          : 'Avoid early morning and late night outdoor exposure when inversion smog peaks.'
      ];
      indoorRecommendations = [
        'Keep windows and doors securely closed.',
        'Damp-mop (pocha) floors and wipe surfaces with a damp cloth instead of dry sweeping (jhadu).',
        'Run an indoor HEPA air purifier or DIY box fan filter in active rooms.'
      ];
      break;
    }

    case 'Very Poor': {
      isOutdoorSafe = false;
      verdictLabel = 'STRICTLY_UNSAFE';
      recommendedMask = 'Certified N95 or FFP2 respirator (mandatory for all outdoor transit)';
      if (hasChildren) {
        directAnswerPhrase = 'No, it is strictly unsafe for your child to play outside today.';
      } else if (hasCopd || hasAsthma) {
        directAnswerPhrase =
          'No, outdoor walks and any outdoor exposure are strictly unsafe today.';
      } else {
        directAnswerPhrase = 'No, outdoor running, walks, and sports are strictly unsafe today.';
      }

      verdictSummary = `Air quality is Very Poor (NAQI ${numericAqi}). Smog levels can trigger severe respiratory distress, asthma attacks, and cardiovascular stress even in healthy individuals.`;
      actionableGuidance = [
        'Strictly cancel all outdoor play, sports, morning/evening walks, and outdoor workouts.',
        'Stay indoors with all windows and doors closed.',
        'If stepping out for essential travel is mandatory, wear a tightly sealed N95 or FFP2 mask at all times.',
        hasAsthma || hasCopd
          ? 'Follow your physician-approved action plan and keep rescue inhalers within arm’s reach.'
          : 'Avoid any strenuous physical exertion indoors without air filtration.'
      ];
      indoorRecommendations = [
        'Seal door and window gaps with weatherstripping tape or rolled damp towels.',
        'Run HEPA air purifiers continuously on auto/medium mode.',
        'Avoid indoor combustion: do not light agarbatti, dhoop, candles, or mosquito coils.'
      ];
      break;
    }

    case 'Severe':
    default: {
      isOutdoorSafe = false;
      verdictLabel = 'HAZARDOUS_PROHIBITED';
      recommendedMask = 'Certified N95/FFP2 respirator mandatory; avoid stepping outside entirely';
      directAnswerPhrase = 'No, stay strictly indoors. Outdoor air is currently hazardous.';
      verdictSummary = `Air quality is Severe (NAQI ${numericAqi}). This represents a public health emergency that affects healthy people and severely impacts vulnerable family members.`;
      actionableGuidance = [
        'All outdoor activity is strictly prohibited. Everyone must remain indoors.',
        'Children, seniors, and those with lung or heart conditions must stay inside sealed rooms.',
        'Wear a certified N95 respirator even for brief stepping out into corridors or balconies.',
        'In case of acute breathing distress, wheezing, or chest tightness, call emergency services immediately (112 or 108).'
      ];
      indoorRecommendations = [
        'Create a clean-air sanctuary room with sealed openings and continuous HEPA filtration.',
        'Damp-mop floors twice daily; do not sweep or vacuum without HEPA exhaust.',
        'Keep doors and balcony windows sealed shut.'
      ];
      break;
    }
  }

  return {
    aqi: numericAqi,
    category: catName,
    isOutdoorSafe,
    verdictLabel,
    directAnswerPhrase,
    verdictSummary,
    actionableGuidance,
    peopleInvolved: involved,
    recommendedMask,
    indoorRecommendations,
    isOutdoorQuery: isOutdoor,
    isDirectSafetyQuestion: isDirectSafety
  };
}
