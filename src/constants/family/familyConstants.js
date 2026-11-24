// src/constants/family/familyConstants.js
// Constants and data helpers for Family Profiles and Household Care Network

export function getRoleIcon(rel) {
  const r = (rel || '').toLowerCase();
  if (r === 'pet' || r.includes('dog') || r.includes('cat')) return '🐾';
  if (r === 'son' || r === 'daughter' || r === 'child') return '🧒';
  if (
    r.includes('dadi') ||
    r.includes('nani') ||
    r.includes('dada') ||
    r.includes('nana') ||
    r.includes('senior') ||
    r.includes('grand')
  ) {
    return '👵';
  }
  if (r.includes('mother') || r.includes('father') || r.includes('parent')) return '🧑';
  if (
    r.includes('spouse') ||
    r.includes('partner') ||
    r.includes('wife') ||
    r.includes('husband')
  ) {
    return '❤️';
  }
  return '👤';
}

export function buildDefaultFormData(profile) {
  return {
    name: '',
    relationship: 'Son',
    age: '',
    country: profile?.country || 'India',
    state: profile?.state || 'West Bengal',
    city: profile?.city || 'Kolkata',
    locationObj: {
      name: profile?.city || 'Kolkata',
      latitude: profile?.latitude || 22.5726,
      longitude: profile?.longitude || 88.3639,
      timezone: profile?.timezone || 'Asia/Kolkata',
      admin1: profile?.state || 'West Bengal',
      country: profile?.country || 'India'
    },
    conditions: ['None'],
    otherCondition: '',
    sensitivity: 'Low',
    commute: ['Metro'],
    lifestyle: ['Walking / Leisure walks'],
    otherLifestyle: ''
  };
}

export function buildEditFormData(member, profile) {
  const conds = Array.isArray(member.conditions)
    ? member.conditions
    : member.condition
      ? [member.condition]
      : ['None'];

  return {
    name: member.name || '',
    relationship: member.relationship || 'Dependent',
    age: member.age !== undefined && member.age !== null ? String(member.age) : '',
    country: member.country || profile?.country || 'India',
    state: member.state || profile?.state || 'West Bengal',
    city: member.city || profile?.city || 'Kolkata',
    locationObj: {
      name: member.city || profile?.city || 'Kolkata',
      latitude: member.latitude || profile?.latitude || 22.5726,
      longitude: member.longitude || profile?.longitude || 88.3639,
      timezone: member.timezone || profile?.timezone || 'Asia/Kolkata',
      admin1: member.state || profile?.state || 'West Bengal',
      country: member.country || profile?.country || 'India',
      id: member.placeId || null
    },
    conditions: conds,
    otherCondition: member.otherCondition || '',
    sensitivity: member.sensitivity || 'Moderate',
    commute: Array.isArray(member.commute) ? member.commute : ['Metro'],
    lifestyle: Array.isArray(member.lifestyle) ? member.lifestyle : ['Walking / Leisure walks'],
    otherLifestyle: member.otherLifestyle || ''
  };
}
