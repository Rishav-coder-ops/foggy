// src/utils/validation.js
// Shared validation and text sanitization library for Onboarding, Settings, and Family Profiles
import { INDIAN_STATES_AND_UTS } from '../data/onboardingData.js';
import { statesMatch, isValidCityStatePair } from '../../shared/geocode.js';

/**
 * Strip control characters, excessive whitespace, and common prompt injection wrappers.
 * @param {any} input - Text to sanitize.
 * @param {number} [maxLength=100] - Optional maximum string length.
 * @returns {string} Clean, safe text.
 */
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

/**
 * Deep sanitize an object's string properties before saving or model dispatch.
 * @param {any} obj - Plain object or array.
 * @returns {any} Sanitized object.
 */
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

/**
 * Validates a user's full name (2 to 60 characters).
 * @param {string} name
 * @returns {string | null} Error message or null if valid.
 */
export function validateFullName(name) {
  if (typeof name === 'string' && name.trim().length > 60) {
    return 'Full name cannot exceed 60 characters.';
  }
  const clean = sanitizeText(name, 60);
  if (!clean || clean.length < 2) {
    return 'Full name must be at least 2 characters.';
  }
  return null;
}

/**
 * Validates age as an integer between 1 and 120.
 * @param {any} age
 * @returns {string | null}
 */
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

/**
 * Validates country selection.
 * @param {string} country
 * @returns {string | null}
 */
export function validateCountry(country) {
  const clean = sanitizeText(country, 60);
  if (!clean) {
    return 'Please select a country.';
  }
  return null;
}

/**
 * Validates state or UT selection against official list if India.
 * @param {string} state
 * @param {string} country
 * @returns {string | null}
 */
export function validateState(state, country) {
  const cleanState = sanitizeText(state, 60);
  if (!cleanState) {
    return country === 'India'
      ? 'Please select a State or Union Territory.'
      : 'State or Region is required.';
  }

  if (country === 'India') {
    const isKnown = INDIAN_STATES_AND_UTS.some((s) => statesMatch(s, cleanState));
    if (!isKnown) {
      return 'Please choose a valid Indian State or Union Territory.';
    }
  }
  return null;
}

/**
 * Validates city and verifies geocoded coordinate attachment and state matching.
 * @param {string} city
 * @param {object} locationObj
 * @param {string} [state]
 * @param {string} [_country]
 * @returns {string | null}
 */
export function validateCity(city, locationObj, state, _country) {
  const cleanCity = sanitizeText(city, 80);
  if (!cleanCity) {
    return 'City or town is required.';
  }

  // Verify city-state pair compatibility
  if (state) {
    const pairCheck = isValidCityStatePair(cleanCity, state);
    if (!pairCheck.valid) {
      return pairCheck.message;
    }
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

/**
 * Validates health conditions ("None" exclusivity and required "Other" text).
 * @param {string[]} conditions
 * @param {string} [otherCondition]
 * @returns {string | null}
 */
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

/**
 * Validates sensitivity tier (Low, Moderate, High).
 * @param {string} sensitivity
 * @param {string[]} [conditions]
 * @returns {string | null}
 */
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

/**
 * Validates commute selections.
 * @param {string[]} commute
 * @param {boolean} [isPet=false]
 * @returns {string | null}
 */
export function validateCommute(commute, isPet = false) {
  if (isPet) return null; // Commute is optional for pets
  if (!Array.isArray(commute) || commute.length === 0) {
    return 'Please select at least one commute method.';
  }
  return null;
}

/**
 * Validates lifestyle activities.
 * @param {string[]} lifestyle
 * @param {string} [otherLifestyle]
 * @param {boolean} [_isPet=false]
 * @returns {string | null}
 */
export function validateLifestyle(lifestyle, otherLifestyle, _isPet = false) {
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

/**
 * Validates privacy consent checkbox.
 * @param {boolean} consent
 * @returns {string | null}
 */
export function validateConsent(consent) {
  if (consent !== true) {
    return 'You must agree to store these details to personalize your guidance.';
  }
  return null;
}

/**
 * Validates relationship tag for family member.
 * @param {string} relationship
 * @returns {string | null}
 */
export function validateRelationship(relationship) {
  const clean = sanitizeText(relationship, 40);
  if (!clean || clean.length < 2) {
    return 'Please select or enter a relationship tag (e.g., Son, Mother, Pet).';
  }
  return null;
}

/**
 * Full profile form validation (Step 1 of Onboarding & Settings).
 * @param {object} data
 * @returns {{ errors: Record<string, string>, isValid: boolean }}
 */
/**
 * Helper to validate location fields (country, state, city) into an errors object.
 * @param {object} data
 * @param {Record<string, string>} errors
 */
export function applyLocationValidation(data, errors) {
  const countryErr = validateCountry(data.country);
  if (countryErr) errors.country = countryErr;

  const stateErr = validateState(data.state, data.country);
  if (stateErr) errors.state = stateErr;

  const cityErr = validateCity(data.city, data.locationObj, data.state, data.country);
  if (cityErr) errors.city = cityErr;
}

/**
 * Helper to validate health, sensitivity, commute, and lifestyle fields into an errors object.
 * @param {object} data
 * @param {Record<string, string>} errors
 * @param {boolean} [isPet=false]
 */
export function applyHealthAndLifestyleValidation(data, errors, isPet = false) {
  const condErr = validateConditions(data.conditions, data.otherCondition);
  if (condErr) errors.conditions = condErr;

  const sensErr = validateSensitivity(data.sensitivity, data.conditions);
  if (sensErr) errors.sensitivity = sensErr;

  const commErr = validateCommute(data.commute, isPet);
  if (commErr) errors.commute = commErr;

  const lifeErr = validateLifestyle(data.lifestyle, data.otherLifestyle, isPet);
  if (lifeErr) errors.lifestyle = lifeErr;
}

/**
 * Full profile form validation (Step 1 of Onboarding).
 * @param {object} data
 * @returns {{ errors: Record<string, string>, isValid: boolean, sanitizedData?: object }}
 */
export function validateProfileForm(data) {
  const errors = {};

  const nameErr = validateFullName(data.fullName);
  if (nameErr) errors.fullName = nameErr;

  const ageErr = validateAge(data.age);
  if (ageErr) errors.age = ageErr;

  applyLocationValidation(data, errors);
  applyHealthAndLifestyleValidation(data, errors, false);

  const consentErr = validateConsent(data.consent);
  if (consentErr) errors.consent = consentErr;

  const sanitizedData = sanitizeObject({
    fullName: sanitizeText(data.fullName, 60),
    age: Number(data.age) || 0,
    country: sanitizeText(data.country, 60),
    state: sanitizeText(data.state, 60),
    city: sanitizeText(data.city, 80),
    locationObj: data.locationObj || null,
    conditions: Array.isArray(data.conditions) ? data.conditions : [],
    otherCondition: sanitizeText(data.otherCondition, 100),
    sensitivity: data.sensitivity || 'Moderate',
    commute: Array.isArray(data.commute) ? data.commute : [],
    lifestyle: Array.isArray(data.lifestyle) ? data.lifestyle : [],
    otherLifestyle: sanitizeText(data.otherLifestyle, 100),
    consent: Boolean(data.consent)
  });

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    sanitizedData
  };
}

/**
 * Family member form validation (Step 2 of Onboarding & Family Profiles).
 * @param {object} data
 * @returns {{ errors: Record<string, string>, isValid: boolean, sanitizedData?: object }}
 */
export function validateFamilyMemberForm(data) {
  const errors = {};
  const isPet = (data.relationship || '').toLowerCase().trim() === 'pet';

  const nameErr = validateFullName(data.name);
  if (nameErr) errors.name = nameErr;

  const relErr = validateRelationship(data.relationship);
  if (relErr) errors.relationship = relErr;

  const ageErr = validateAge(data.age);
  if (ageErr) errors.age = ageErr;

  // Location is optional if sameAsPrimary is checked
  if (!data.sameAsPrimary) {
    applyLocationValidation(data, errors);
  }

  applyHealthAndLifestyleValidation(data, errors, isPet);

  const sanitizedData = sanitizeObject({
    name: sanitizeText(data.name, 60),
    relationship: sanitizeText(data.relationship, 40),
    age: Number(data.age) || 0,
    country: data.sameAsPrimary ? '' : sanitizeText(data.country, 60),
    state: data.sameAsPrimary ? '' : sanitizeText(data.state, 60),
    city: data.sameAsPrimary ? '' : sanitizeText(data.city, 80),
    locationObj: data.sameAsPrimary ? null : data.locationObj || null,
    sameAsPrimary: Boolean(data.sameAsPrimary),
    conditions: Array.isArray(data.conditions) ? data.conditions : [],
    otherCondition: sanitizeText(data.otherCondition, 100),
    sensitivity: data.sensitivity || 'Moderate',
    commute: isPet ? [] : Array.isArray(data.commute) ? data.commute : [],
    lifestyle: Array.isArray(data.lifestyle) ? data.lifestyle : [],
    otherLifestyle: sanitizeText(data.otherLifestyle, 100)
  });

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    sanitizedData
  };
}
