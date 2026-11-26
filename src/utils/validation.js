// src/utils/validation.js
/**
 * @fileoverview Barrel re-export for validation and sanitization helpers.
 */

export {
  sanitizeText,
  validateEmail,
  validatePassword,
  validateAuthForm
} from './authValidation.js';

export {
  sanitizeObject,
  validateFullName,
  validateAge,
  validateCountry,
  validateState,
  validateCity,
  validateConditions,
  validateSensitivity,
  validateCommute,
  validateLifestyle,
  validateConsent,
  validateProfileForm,
  validateFamilyMemberForm
} from './profileValidation.js';
