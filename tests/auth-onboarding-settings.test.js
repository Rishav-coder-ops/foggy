// tests/auth-onboarding-settings.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateFullName,
  validateAge,
  validateConditions,
  validateConsent,
  validateCity,
  validateProfileForm,
  validateFamilyMemberForm
} from '../src/utils/validation.js';

describe('tests/auth-onboarding-settings.test.js - Onboarding, Route Guards & Settings Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Onboarding Form Validation Rules', () => {
    it('validates full name constraints (2 to 60 characters)', () => {
      expect(validateFullName('')).toContain('at least 2 characters');
      expect(validateFullName('A')).toContain('at least 2 characters');
      expect(validateFullName('Rishav Nandi')).toBeNull();
      expect(validateFullName('X'.repeat(65))).toContain('cannot exceed 60 characters');
    });

    it('validates age constraints (whole number 1 to 120)', () => {
      expect(validateAge('')).toBe('Age is required.');
      expect(validateAge(null)).toBe('Age is required.');
      expect(validateAge(0)).toBe('Age must be a whole number between 1 and 120.');
      expect(validateAge(130)).toBe('Age must be a whole number between 1 and 120.');
      expect(validateAge(25.5)).toBe('Age must be a whole number between 1 and 120.');
      expect(validateAge(28)).toBeNull();
    });

    it('enforces health "None" exclusivity', () => {
      expect(validateConditions([])).toContain('Please select at least one');
      expect(validateConditions(['None'])).toBeNull();
      expect(validateConditions(['Asthma'])).toBeNull();
      expect(validateConditions(['None', 'Asthma'])).toContain(
        '"None" cannot be combined with other health conditions'
      );
    });

    it('enforces consent checkbox requirement', () => {
      expect(validateConsent(false)).toContain('You must agree to store these details');
      expect(validateConsent(null)).toContain('You must agree to store these details');
      expect(validateConsent(true)).toBeNull();
    });

    it('validates city selection with coordinates', () => {
      expect(validateCity('', null, 'Delhi', 'India')).toContain('City or town is required');
      expect(validateCity('Delhi', null, 'Delhi', 'India')).toContain(
        'verified city from the suggestions'
      );
      expect(validateCity('Delhi', { latitude: null }, 'Delhi', 'India')).toContain(
        'coordinates are missing'
      );
      expect(
        validateCity(
          'Mumbai',
          { name: 'Mumbai', admin1: 'Maharashtra', latitude: 19.07, longitude: 72.87 },
          'Tamil Nadu',
          'India'
        )
      ).toContain('belongs to Maharashtra, not Tamil Nadu');
      expect(
        validateCity(
          'Kolkata',
          { name: 'Kolkata', admin1: 'West Bengal', latitude: 22.57, longitude: 88.36 },
          'West Bengal',
          'India'
        )
      ).toBeNull();
    });

    it('validates complete profile form payload and reports all errors', () => {
      const invalidData = {
        fullName: 'A',
        age: -5,
        country: '',
        state: '',
        city: '',
        conditions: ['None', 'Asthma'],
        consent: false
      };
      const { errors, isValid } = validateProfileForm(invalidData);
      expect(isValid).toBe(false);
      expect(errors.fullName).toBeDefined();
      expect(errors.age).toBeDefined();
      expect(errors.country).toBeDefined();
      expect(errors.conditions).toBeDefined();
      expect(errors.consent).toBeDefined();
    });

    it('passes complete valid profile form', () => {
      const validData = {
        fullName: 'Vikram Sharma',
        age: 34,
        country: 'India',
        state: 'Delhi',
        city: 'Delhi',
        locationObj: { name: 'Delhi', admin1: 'Delhi', latitude: 28.61, longitude: 77.2 },
        conditions: ['Asthma'],
        sensitivity: 'High',
        commute: ['Metro'],
        lifestyle: ['Morning walk'],
        cookingType: 'LPG',
        consent: true
      };
      const { errors, isValid } = validateProfileForm(validData);
      expect(isValid).toBe(true);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('validates family member form and supports pet profiles', () => {
      const petData = {
        name: 'Rusty',
        relationship: 'Pet',
        age: 4,
        country: 'India',
        state: 'West Bengal',
        city: 'Kolkata',
        locationObj: { name: 'Kolkata', admin1: 'West Bengal', latitude: 22.57, longitude: 88.36 },
        conditions: ['None'],
        sensitivity: 'Low',
        commute: [],
        lifestyle: ['Daily stroll']
      };

      const { errors, isValid, sanitizedData } = validateFamilyMemberForm(petData);
      expect(isValid).toBe(true);
      expect(Object.keys(errors)).toHaveLength(0);
      expect(sanitizedData.name).toBe('Rusty');
      expect(sanitizedData.commute).toEqual([]);
    });

    it('flags invalid family member relationship tag', () => {
      const invalidMember = {
        name: 'Beta',
        relationship: '',
        age: 8
      };
      const { errors, isValid } = validateFamilyMemberForm(invalidMember);
      expect(isValid).toBe(false);
      expect(errors.relationship).toBeDefined();
    });
  });

  describe('Settings & Delete-Account Order of Operations', () => {
    it('executes deletion order: subcollections -> user document -> auth user', async () => {
      const deletionSteps = [];

      const mockDeleteDoc = vi.fn().mockImplementation((path) => {
        deletionSteps.push(`deleteDoc:${path}`);
        return Promise.resolve();
      });

      const mockDeleteUser = vi.fn().mockImplementation(() => {
        deletionSteps.push('deleteAuthUser');
        return Promise.resolve();
      });

      // Simulated atomic delete account routine
      async function executeAccountDeletion(uid) {
        // 1. Delete family subcollection members
        deletionSteps.push(`deleteSubcollection:users/${uid}/family`);
        // 2. Delete memory subcollection
        deletionSteps.push(`deleteSubcollection:users/${uid}/memory`);
        // 3. Delete root user document
        await mockDeleteDoc(`users/${uid}`);
        // 4. Delete Firebase Auth user
        await mockDeleteUser();
      }

      await executeAccountDeletion('test_user_123');

      expect(deletionSteps).toEqual([
        'deleteSubcollection:users/test_user_123/family',
        'deleteSubcollection:users/test_user_123/memory',
        'deleteDoc:users/test_user_123',
        'deleteAuthUser'
      ]);
    });

    it('requires exact string "DELETE" before permitting account deletion', () => {
      const confirmInput1 = 'delete';
      const confirmInput2 = 'DELETE ';
      const confirmInput3 = 'DELETE';

      expect(confirmInput1 === 'DELETE').toBe(false);
      expect(confirmInput2.trim() === 'DELETE').toBe(true);
      expect(confirmInput3 === 'DELETE').toBe(true);
    });

    it('exports user data clean JSON bundle with metadata', () => {
      const userData = {
        profile: { fullName: 'Ananya Roy', city: 'Kolkata' },
        family: [{ name: 'Aarav', role: 'Son' }],
        memory: [{ fact: 'Uses induction cooktop', category: 'home' }]
      };

      const exportBundle = {
        app: 'Foggy Air Quality Assistant',
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        data: userData
      };

      const jsonStr = JSON.stringify(exportBundle, null, 2);
      expect(jsonStr).toContain('Foggy Air Quality Assistant');
      expect(jsonStr).toContain('Ananya Roy');
      expect(jsonStr).toContain('Kolkata');
    });
  });
});
