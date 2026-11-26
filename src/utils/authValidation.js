// src/utils/authValidation.js
/**
 * @fileoverview Authentication input validation, string sanitization, and security filters.
 */

/**
 * Strip control characters, excessive whitespace, and common prompt injection wrappers.
 * @param {any} input - Text to sanitize.
 * @param {number} [maxLength=100] - Optional maximum string length.
 * @returns {string} Clean, safe text.
 */
export function sanitizeText(input, maxLength = 100) {
  if (input === null || input === undefined) return '';
  let str = String(input);
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  str = str.replace(/<[^>]*>/g, '');
  str = str.trim().replace(/\s+/g, ' ');
  if (maxLength && str.length > maxLength) {
    str = str.slice(0, maxLength).trim();
  }
  return str;
}

/**
 * Validates email address format.
 * @param {string} email
 * @returns {string | null} Error string or null.
 */
export function validateEmail(email) {
  const clean = sanitizeText(email, 120);
  if (!clean) return 'Email is required.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) return 'Please enter a valid email address.';
  return null;
}

/**
 * Validates password strength (minimum 6 characters).
 * @param {string} password
 * @returns {string | null} Error string or null.
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

/**
 * Validates authentication form fields for signin / signup.
 * @param {{ email: string, password: string, name?: string, isSignUp?: boolean }} values
 * @returns {{ errors: Record<string, string>, isValid: boolean }}
 */
export function validateAuthForm({ email, password, name = '', isSignUp = false }) {
  const errors = {};
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;

  const passErr = validatePassword(password);
  if (passErr) errors.password = passErr;

  if (isSignUp) {
    const cleanName = sanitizeText(name, 60);
    if (!cleanName || cleanName.length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}
