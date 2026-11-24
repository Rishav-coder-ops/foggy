// tests/setup.js
import '@testing-library/jest-dom';
import * as axeMatchers from 'vitest-axe/matchers';
import { expect, vi, beforeEach, afterEach } from 'vitest';
import { clearRateLimits as clearAqiRateLimits, clearAqiCache, clearLastGoodLiveAqiCache } from '../shared/aqi/cache.js';
import { clearTimelineRateLimits, clearTimelineCache } from '../shared/timeline/constants.js';
import { clearRateLimitStore } from '../shared/chat/rateLimiter.js';
import { clearGeocodeCache } from '../functions/api/geocode.js';

export function resetAllModuleState() {
  clearAqiRateLimits();
  clearAqiCache();
  clearLastGoodLiveAqiCache();
  clearTimelineRateLimits();
  clearTimelineCache();
  clearRateLimitStore();
  clearGeocodeCache();
}

beforeEach(() => {
  resetAllModuleState();
});

afterEach(() => {
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
