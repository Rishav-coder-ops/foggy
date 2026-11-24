// tests/setup.js
import '@testing-library/jest-dom';
import * as axeMatchers from 'vitest-axe/matchers';
import { expect, vi, beforeEach, afterEach } from 'vitest';
import { clearRateLimits as clearAqiRateLimits, clearAqiCache, clearLastGoodLiveAqiCache } from '../shared/aqi/cache.js';
import { clearTimelineRateLimits, clearTimelineCache } from '../shared/timeline/constants.js';
import { clearRateLimitStore } from '../shared/chat/rateLimiter.js';
import { clearGeocodeCache } from '../functions/api/geocode.js';

// Shared mutable Firebase Auth test double
export const mockFirebaseAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn((cb) => {
    if (typeof cb === 'function') cb(mockFirebaseAuth.currentUser);
    return vi.fn();
  }),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  reauthenticateWithPopup: vi.fn(),
  reauthenticateWithCredential: vi.fn(),
  deleteUser: vi.fn()
};

export const mockFirestoreDb = {};

const mockFirebaseModule = {
  app: {},
  auth: mockFirebaseAuth,
  db: mockFirestoreDb,
  googleProvider: { setCustomParameters: vi.fn() },
  isFirebaseConfigured: true,
  missingFirebaseVars: [],
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, cb) => {
    if (typeof cb === 'function') cb(mockFirebaseAuth.currentUser);
    return vi.fn();
  }),
  updateProfile: vi.fn(),
  reauthenticateWithPopup: vi.fn(),
  reauthenticateWithCredential: vi.fn(),
  EmailAuthProvider: vi.fn(),
  deleteUser: vi.fn(),
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => ({}) })),
  setDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  deleteDoc: vi.fn(async () => {}),
  collection: vi.fn(() => ({})),
  getDocs: vi.fn(async () => ({ docs: [] })),
  onSnapshot: vi.fn((_ref, onData) => {
    if (typeof onData === 'function') onData({ exists: () => false, data: () => ({}) });
    return vi.fn();
  }),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => new Date().toISOString())
};

vi.mock('../src/firebase.js', () => mockFirebaseModule);
vi.mock('../src/firebase', () => mockFirebaseModule);
vi.mock('../firebase.js', () => mockFirebaseModule);
vi.mock('../firebase', () => mockFirebaseModule);

export function resetAllModuleState() {
  clearAqiRateLimits();
  clearAqiCache();
  clearLastGoodLiveAqiCache();
  clearTimelineRateLimits();
  clearTimelineCache();
  clearRateLimitStore();
  clearGeocodeCache();
}

export const defaultFetchStub = vi.fn((url) => {
  const err = new Error(`Unmocked network fetch call: ${url}`);
  err.name = 'UnmockedNetworkError';
  return Promise.reject(err);
});

beforeEach(() => {
  mockFirebaseAuth.currentUser = null;
  global.fetch = defaultFetchStub;
  resetAllModuleState();
});

afterEach(() => {
  mockFirebaseAuth.currentUser = null;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  resetAllModuleState();
});

expect.extend(axeMatchers);

// Polyfill window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Polyfill ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill window.scrollTo
window.scrollTo = vi.fn();

// In-memory localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((idx) => Object.keys(store)[idx] || null)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});
