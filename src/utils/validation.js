// src/utils/validation.js
// Shared validation and text sanitization library for Onboarding, Settings, and Family Profiles
import { INDIAN_STATES_AND_UTS } from '../data/onboardingData.js';
import { statesMatch } from '../../functions/api/geocode.js';

// Strip control characters, excessive whitespace, and common prompt injection wrappers
export function sanitizeText(input, maxLength = 100) {
  if (input === null || input === undefined) return '';
  let str = String(input);
  // Strip null bytes and control chars (except standard newlines/tabs if needed, or all control chars for single line inputs)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  // Strip dangerous HTML tags
  str = str.replace(/<[^>]*>/g, '');
  // Normalize whitespace
  str = str.trim().replace(/\s+/g, ' ');
  // Enforce max length
  if (maxLength && str.length > maxLength) {
    str = str.slice(0, maxLength).trim();
  }
  return str;
}

// Deep sanitize an object's string properties before saving or model dispatch
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitizeObject(item));

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      clean[key] = sanitizeText(value, key === 'detail' || key === 'notes' ? 500 : 120);
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeObject(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export function validateFullName(name) {
  const clean = sanitizeText(name, 60);
  if (!clean || clean.length < 2) {
    return 'Full name must be at least 2 characters.';
  }
  if (clean.length > 60) {
    return 'Full name cannot exceed 60 characters.';
  }
  return null;
}

export function validateAge(age) {
  if (age === '' || age === null || age === undefined) {
    return 'Age is required.';
  }
  const num = Number(age);
  if (!Number.isInteger(num) || num < 1 || num > 120) {
    return 'Age must be a whole number between 1 and 120.';
  }
  return null;
}

export function validateCountry(country) {
  const clean = sanitizeText(country, 60);
  if (!clean) {
    return 'Please select a country.';
  }
  return null;
}

export function validateState(state, country) {
  const cleanState = sanitizeText(state, 60);
  if (!cleanState) {
    return country === 'India' ? 'Please select a State or Union Territory.' : 'State or Region is required.';
  }

  if (country === 'India') {
    const isKnown = INDIAN_STATES_AND_UTS.some((s) => statesMatch(s, cleanState));
    if (!isKnown) {
      return 'Please choose a valid Indian State or Union Territory.';
    }
  }
  return null;
}

export function validateCity(city, locationObj, state, country) {
  const cleanCity = sanitizeText(city, 80);
  if (!cleanCity) {
    return 'City or town is required.';
  }

  if (!locationObj || typeof locationObj !== 'object') {
    return 'Please select a verified city from the suggestions.';
  }

  if (typeof locationObj.latitude !== 'number' || typeof locationObj.longitude !== 'number') {
    return 'Location coordinates are missing. Please re-select your city.';
  }

  // Verify state matching if state is provided
  if (state && locationObj.admin1) {
    if (!statesMatch(state, locationObj.admin1)) {
      return `Selected location '${locationObj.name}' belongs to ${locationObj.admin1}, not ${state}. Please select a matching city in ${state}.`;
    }
  }

  return null;
}

export function validateConditions(conditions, otherCondition) {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return 'Please select at least one health condition (or "None").';
  }

  if (conditions.includes('None') && conditions.length > 1) {
    return '"None" cannot be combined with other health conditions.';
  }

  if (conditions.includes('Other')) {
    const cleanOther = sanitizeText(otherCondition, 100);
    if (!cleanOther || cleanOther.length < 2) {
      return 'Please specify your other health condition (at least 2 characters).';
    }
  }

  return null;
}

export function validateSensitivity(sensitivity, conditions) {
  if (!sensitivity || !['Low', 'Moderate', 'High'].includes(sensitivity)) {
    return 'Please select a sensitivity level.';
  }

  if (Array.isArray(conditions) && conditions.length === 1 && conditions[0] === 'None') {
    if (sensitivity !== 'Low') {
      return 'Sensitivity is automatically Low when no health conditions are selected.';
    }
  }

  return null;
}

export function validateCommute(commute, isPet = false) {
  if (isPet) return null; // Commute is optional for pets
  if (!Array.isArray(commute) || commute.length === 0) {
    return 'Please select at least one commute method.';
  }
  return null;
}

export function validateLifestyle(lifestyle, otherLifestyle, isPet = false) {
  if (!Array.isArray(lifestyle) || lifestyle.length === 0) {
    return 'Please select at least one lifestyle or outdoor activity.';
  }

  if (lifestyle.includes('Other')) {
    const cleanOther = sanitizeText(otherLifestyle, 100);
    if (!cleanOther || cleanOther.length < 2) {
      return 'Please specify your other activity (at least 2 characters).';
    }
  }

  return null;
}

export function validateConsent(consent) {
  if (consent !== true) {
    return 'You must agree to store these details to personalize your guidance.';
  }
  return null;
}

export function validateRelationship(relationship) {
  const clean = sanitizeText(relationship, 40);
  if (!clean || clean.length < 2) {
    return 'Please select or enter a relationship tag (e.g., Son, Mother, Pet).';
  }
  return null;
}

// Full profile validation (Step 1)
export function validateProfileForm(data) {
  const errors = {};

  const nameErr = validateFullName(data.fullName);
  if (nameErr) errors.fullName = nameErr;

  const ageErr = validateAge(data.age);
  if (ageErr) errors.age = ageErr;

  const countryErr = validateCountry(data.country);
  if (countryErr) errors.country = countryErr;

  const stateErr = validateState(data.state, data.country);
  if (stateErr) errors.state = stateErr;

  const cityErr = validateCity(data.city, data.locationObj, data.state, data.country);
  if (cityErr) errors.city = cityErr;

  const condErr = validateConditions(data.conditions, data.otherCondition);
  if (condErr) errors.conditions = condErr;

  const sensErr = validateSensitivity(data.sensitivity, data.conditions);
  if (sensErr) errors.sensitivity = sensErr;

  const comErr = validateCommute(data.commute, false);
  if (comErr) errors.commute = comErr;

  const lifeErr = validateLifestyle(data.lifestyle, data.otherLifestyle, false);
  if (lifeErr) errors.lifestyle = lifeErr;

  const consentErr = validateConsent(data.consent);
  if (consentErr) errors.consent = consentErr;

  const isValid = Object.keys(errors).length === 0;

  const sanitizedData = {
    fullName: sanitizeText(data.fullName, 60),
    age: parseInt(data.age, 10),
    country: sanitizeText(data.country, 60),
    state: sanitizeText(data.state, 60),
    city: sanitizeText(data.city, 80),
    latitude: data.locationObj?.latitude || 22.5726,
    longitude: data.locationObj?.longitude || 88.3639,
    timezone: data.locationObj?.timezone || 'Asia/Kolkata',
    placeId: data.locationObj?.id || null,
    conditions: Array.isArray(data.conditions) ? data.conditions : [],
    otherCondition: data.conditions?.includes('Other') ? sanitizeText(data.otherCondition, 100) : '',
    sensitivity: data.conditions?.length === 1 && data.conditions[0] === 'None' ? 'Low' : data.sensitivity,
    commute: Array.isArray(data.commute) ? data.commute : [],
    lifestyle: Array.isArray(data.lifestyle) ? data.lifestyle : [],
    otherLifestyle: data.lifestyle?.includes('Other') ? sanitizeText(data.otherLifestyle, 100) : '',
    consentAcceptedAt: data.consent ? (data.consentAcceptedAt || new Date().toISOString()) : null
  };

  return { isValid, errors, sanitizedData };
}

// Family member validation (Step 2)
export function validateFamilyMemberForm(data) {
  const errors = {};
  const isPet = (data.relationship || '').toLowerCase().trim() === 'pet';

  const relErr = validateRelationship(data.relationship);
  if (relErr) errors.relationship = relErr;

  const nameErr = validateFullName(data.name || data.fullName);
  if (nameErr) errors.name = nameErr;

  const ageErr = validateAge(data.age);
  if (ageErr) errors.age = ageErr;

  const countryErr = validateCountry(data.country);
  if (countryErr) errors.country = countryErr;

  const stateErr = validateState(data.state, data.country);
  if (stateErr) errors.state = stateErr;

  const cityErr = validateCity(data.city, data.locationObj, data.state, data.country);
  if (cityErr) errors.city = cityErr;

  const condErr = validateConditions(data.conditions, data.otherCondition);
  if (condErr) errors.conditions = condErr;

  const sensErr = validateSensitivity(data.sensitivity, data.conditions);
  if (sensErr) errors.sensitivity = sensErr;

  const comErr = validateCommute(data.commute, isPet);
  if (comErr) errors.commute = comErr;

  const lifeErr = validateLifestyle(data.lifestyle, data.otherLifestyle, isPet);
  if (lifeErr) errors.lifestyle = lifeErr;

  const isValid = Object.keys(errors).length === 0;

  const sanitizedData = {
    id: data.id || `fam_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: sanitizeText(data.name || data.fullName, 60),
    relationship: sanitizeText(data.relationship, 40),
    age: parseInt(data.age, 10),
    country: sanitizeText(data.country, 60),
    state: sanitizeText(data.state, 60),
    city: sanitizeText(data.city, 80),
    latitude: data.locationObj?.latitude || 22.5726,
    longitude: data.locationObj?.longitude || 88.3639,
    timezone: data.locationObj?.timezone || 'Asia/Kolkata',
    placeId: data.locationObj?.id || null,
    conditions: Array.isArray(data.conditions) ? data.conditions : [],
    otherCondition: data.conditions?.includes('Other') ? sanitizeText(data.otherCondition, 100) : '',
    sensitivity: data.conditions?.length === 1 && data.conditions[0] === 'None' ? 'Low' : data.sensitivity,
    commute: isPet ? [] : (Array.isArray(data.commute) ? data.commute : []),
    lifestyle: Array.isArray(data.lifestyle) ? data.lifestyle : [],
    otherLifestyle: data.lifestyle?.includes('Other') ? sanitizeText(data.otherLifestyle, 100) : '',
    updatedAt: new Date().toISOString()
  };

  return { isValid, errors, sanitizedData };
}
