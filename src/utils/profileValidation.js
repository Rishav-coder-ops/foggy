// src/utils/profileValidation.js
/**
 * @fileoverview Validation and sanitization rules for User Profiles, Family Members, and Geocoded Locations.
 */

import { INDIAN_STATES_AND_UTS } from '../data/onboardingData.js';
import { statesMatch, isValidCityStatePair } from '../../shared/geocode.js';
import { sanitizeText } from './authValidation.js';

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
  if (typeof name === 'string' && name.trim().length > 60) {
    return 'Full name cannot exceed 60 characters.';
  }
  const clean = sanitizeText(name, 60);
  if (!clean || clean.length < 2) {
    return 'Full name must be at least 2 characters.';
  }
  return null;
}

export function validateAge(age) {
  if (age === '' || age === null || age === undefined) return 'Age is required.';
  const num = Number(age);
  if (!Number.isInteger(num) || num < 1 || num > 120) {
    return 'Age must be a whole number between 1 and 120.';
  }
  return null;
}

export function validateCountry(country) {
  return sanitizeText(country, 60) ? null : 'Please select a country.';
}

export function validateState(state, country) {
  const cleanState = sanitizeText(state, 60);
  if (!cleanState) {
    return country === 'India'
      ? 'Please select a State or Union Territory.'
      : 'State or Region is required.';
  }
  if (country === 'India') {
    const isKnown = INDIAN_STATES_AND_UTS.some((s) => statesMatch(s, cleanState));
    if (!isKnown) return 'Please choose a valid Indian State or Union Territory.';
  }
  return null;
}

export function validateCity(city, locationObj, state, _country) {
  const cleanCity = sanitizeText(city, 80);
  if (!cleanCity) return 'City or town is required.';

  if (state) {
    const pairCheck = isValidCityStatePair(cleanCity, state);
    if (!pairCheck.valid) return pairCheck.message;
  }
  if (!locationObj || typeof locationObj !== 'object') {
    return 'Please select a verified city from the suggestions.';
  }
  if (typeof locationObj.latitude !== 'number' || typeof locationObj.longitude !== 'number') {
    return 'Location coordinates are missing. Please re-select your city.';
  }
  if (state && locationObj.admin1 && !statesMatch(state, locationObj.admin1)) {
    return `Selected location '${locationObj.name}' belongs to ${locationObj.admin1}, not ${state}. Please select a matching city in ${state}.`;
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
  if (
    Array.isArray(conditions) &&
    conditions.length === 1 &&
    conditions[0] === 'None' &&
    sensitivity !== 'Low'
  ) {
    return 'Sensitivity is automatically Low when no health conditions are selected.';
  }
  return null;
}

export function validateCommute(commute, isPet = false) {
  if (isPet) return null;
  return Array.isArray(commute) && commute.length > 0
    ? null
    : 'Please select at least one commute method.';
}

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

export function validateConsent(consent) {
  return consent === true
    ? null
    : 'You must agree to store these details to personalize your guidance.';
}

function validateRelationship(relationship) {
  const clean = sanitizeText(relationship, 40);
  return clean && clean.length >= 2
    ? null
    : 'Please select or enter a relationship tag (e.g., Son, Mother, Pet).';
}

function applyLocationValidation(data, errors) {
  const cErr = validateCountry(data.country);
  if (cErr) errors.country = cErr;
  const sErr = validateState(data.state, data.country);
  if (sErr) errors.state = sErr;
  const ciErr = validateCity(data.city, data.locationObj, data.state, data.country);
  if (ciErr) errors.city = ciErr;
}

function applyHealthAndLifestyleValidation(data, errors, isPet = false) {
  const condErr = validateConditions(data.conditions, data.otherCondition);
  if (condErr) errors.conditions = condErr;
  const sensErr = validateSensitivity(data.sensitivity, data.conditions);
  if (sensErr) errors.sensitivity = sensErr;
  const commErr = validateCommute(data.commute, isPet);
  if (commErr) errors.commute = commErr;
  const lifeErr = validateLifestyle(data.lifestyle, data.otherLifestyle, isPet);
  if (lifeErr) errors.lifestyle = lifeErr;
}

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

  return { errors, isValid: Object.keys(errors).length === 0, sanitizedData };
}

export function validateFamilyMemberForm(data) {
  const errors = {};
  const isPet = (data.relationship || '').toLowerCase().trim() === 'pet';

  const nameErr = validateFullName(data.name);
  if (nameErr) errors.name = nameErr;
  const relErr = validateRelationship(data.relationship);
  if (relErr) errors.relationship = relErr;
  const ageErr = validateAge(data.age);
  if (ageErr) errors.age = ageErr;

  if (!data.sameAsPrimary) applyLocationValidation(data, errors);
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

  return { errors, isValid: Object.keys(errors).length === 0, sanitizedData };
}
