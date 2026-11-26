// shared/chat/profileSanitizer.js
/**
 * @fileoverview Profile sanitization and personalization prompt constructor.
 */

function sanitizeMemberProfile(member) {
  if (!member || typeof member !== 'object') return null;

  const sanitizeStr = (val, maxLen = 100, def = '') => {
    if (typeof val !== 'string') return def;
    return val
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, maxLen);
  };

  const name = sanitizeStr(member.name, 60, 'Family Member');
  const tag = sanitizeStr(member.relationship || member.tag || member.role, 40, 'Dependent');

  let age = null;
  if (member.age !== undefined && member.age !== null && member.age !== '') {
    const parsedAge = parseInt(member.age, 10);
    if (!isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 120) {
      age = parsedAge;
    }
  }

  const location = sanitizeStr(member.city || member.location, 60, '');
  const state = sanitizeStr(member.state, 60, '');

  let conditions = 'None';
  if (Array.isArray(member.conditions)) {
    conditions =
      member.conditions
        .map((c) => sanitizeStr(c, 60))
        .filter(Boolean)
        .join(', ') || 'None';
  } else if (typeof member.conditions === 'string' || typeof member.condition === 'string') {
    conditions = sanitizeStr(member.conditions || member.condition, 200, 'None');
  }

  const sensitivity = ['Low', 'Moderate', 'High', 'Standard'].includes(member.sensitivity)
    ? member.sensitivity
    : 'Moderate';

  let commute = 'Not specified';
  if (Array.isArray(member.commute)) {
    commute =
      member.commute
        .map((c) => sanitizeStr(c, 60))
        .filter(Boolean)
        .join(', ') || 'Not specified';
  } else if (typeof member.commute === 'string') {
    commute = sanitizeStr(member.commute, 200, 'Not specified');
  }

  let lifestyle = 'Not specified';
  if (Array.isArray(member.lifestyle)) {
    lifestyle =
      member.lifestyle
        .map((l) => sanitizeStr(l, 60))
        .filter(Boolean)
        .join(', ') || 'Not specified';
  } else if (typeof member.lifestyle === 'string') {
    lifestyle = sanitizeStr(member.lifestyle, 200, 'Not specified');
  }

  const notes = sanitizeStr(member.notes, 400, '');

  return {
    name,
    tag,
    relationship: tag,
    age,
    location,
    state,
    conditions,
    sensitivity,
    commute,
    lifestyle,
    notes
  };
}

export function buildPersonalizationPrompt(member, aqiData, cityName = 'Kolkata') {
  const m = sanitizeMemberProfile(member);
  if (!m) return '';

  const ageStr = m.age !== null ? `${m.age} years old` : 'age unspecified';
  const aqiNum = aqiData?.aqi || aqiData?.current?.aqi || 165;
  const aqiCat = aqiData?.category || aqiData?.current?.category || 'Moderate';
  const loc = m.location ? `${m.location}${m.state ? ', ' + m.state : ''}` : cityName;

  return `Please create a friendly, structured personalized air quality care memo for ${m.name} (${m.tag}, ${ageStr}).
Location: ${loc}.
Current CPCB National AQI: ${aqiNum} (${aqiCat}).
Respiratory Conditions: ${m.conditions}.
Sensitivity: ${m.sensitivity}.
Daily Commute: ${m.commute}.
Outdoor Activities / Habits: ${m.lifestyle}.${m.notes ? `\nSpecial Notes: ${m.notes}.` : ''}

Please include:
1. Optimal outdoor timing window based on diurnal inversion.
2. Certified mask guidance (N95/FFP2).
3. Commute adjustment advice.
4. If asthmatic, remind to keep doctor-prescribed salbutamol rescue inhaler (such as Asthalin) at hand.
5. Hydration and indoor air filtration steps.
6. Clear not-a-doctor medical disclaimer and 112 emergency notice. Keep it warm and actionable.`;
}
