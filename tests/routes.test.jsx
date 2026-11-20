// @vitest-environment jsdom
// tests/routes.test.jsx
// Smoke test verifying every route renders cleanly with mocked auth and fails on thrown error
import { describe, it, expect, vi, beforeAll } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import { ThemeProvider } from '../src/context/ThemeContext';

// Ensure localStorage mock is present for Node / jsdom
beforeAll(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
});

const mockAuth = {
  user: { uid: 'test-uid-123', displayName: 'Rishav Nandi', email: 'rishav@example.com' },
  isAuthenticated: true,
  loading: false,
  isFirebaseConfigured: true,
  missingFirebaseVars: [],
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginAsDemo: vi.fn(),
  sendPasswordReset: vi.fn(),
  deleteAccount: vi.fn()
};

const mockProfile = {
  profile: {
    fullName: 'Rishav Nandi',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
    conditions: ['None'],
    sensitivity: 'Low',
    commute: ['Metro'],
    lifestyle: ['Walking']
  },
  familyMembers: [
    {
      id: 'fam_1',
      name: 'Beta',
      relationship: 'Son',
      age: 7,
      conditions: ['Asthma (uses a salbutamol inhaler)'],
      sensitivity: 'High',
      city: 'Kolkata',
      state: 'West Bengal'
    }
  ],
  savedMemories: [],
  onboarding: { step: 'done', completedAt: '2026-01-01T00:00:00Z' },
  preferredName: 'Rishav',
  loadingProfile: false,
  isDemo: false,
  saveOnboardingProfile: vi.fn(),
  saveOnboardingFamily: vi.fn(),
  addFamilyMember: vi.fn(),
  updateFamilyMember: vi.fn(),
  deleteFamilyMember: vi.fn(),
  deleteSavedMemory: vi.fn(),
  updateSavedMemory: vi.fn(),
  updateProfile: vi.fn(),
  deleteAccountData: vi.fn()
};

const mockChat = {
  messages: [],
  isOpen: false,
  loading: false,
  openChat: vi.fn(),
  closeChat: vi.fn(),
  sendMessage: vi.fn()
};

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }) => children
}));

vi.mock('../src/context/ProfileContext', () => ({
  useProfile: () => mockProfile,
  ProfileProvider: ({ children }) => children
}));

vi.mock('../src/context/ChatContext', () => ({
  useChat: () => mockChat,
  ChatProvider: ({ children }) => children
}));

describe('Route Smoke Tests (Render Every Route without error)', () => {
  beforeAll(() => {
    // Mock global fetch if needed by subcomponents
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        aqi: 165,
        city: 'Kolkata, West Bengal',
        category: 'Moderate',
        pollutants: { pm25: 78.5, pm10: 135, no2: 44, o3: 32, so2: 12, co: 1.1 },
        weather: { temp: 24, humidity: 68, windSpeed: 2.8 },
        forecastHourly: [],
        articles: [],
        alerts: []
      }),
      text: async () => ''
    });

    if (typeof window !== 'undefined') {
      window.matchMedia = window.matchMedia || function() {
        return {
          matches: false,
          addListener: function() {},
          removeListener: function() {}
        };
      };
    }
  });

  const routes = [
    '/',
    '/auth',
    '/get-started/profile',
    '/get-started/family',
    '/dashboard',
    '/search',
    '/family',
    '/indoor-hacks',
    '/about',
    '/settings',
    '/support'
  ];

  routes.forEach((route) => {
    it(`renders route ${route} cleanly without thrown error`, () => {
      expect(() => {
        const html = renderToString(
          <MemoryRouter initialEntries={[route]}>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </MemoryRouter>
        );
        expect(html).toBeTruthy();
        expect(html.length).toBeGreaterThan(100);
      }).not.toThrow();
    });
  });

  it('renders developer profile links with correct URLs, target="_blank", rel="noopener noreferrer", and accessible labels', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/about']}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Verify GitHub and LinkedIn buttons in the Author & Creator card
    expect(html).toContain('href="https://github.com/Rishav-coder-ops"');
    expect(html).toContain('href="https://www.linkedin.com/in/rishav-nandi-2k7/"');
    expect(html).toContain('aria-label="Rishav Nandi on GitHub (opens in a new tab)"');
    expect(html).toContain('aria-label="Rishav Nandi on LinkedIn (opens in a new tab)"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');

    // Verify footer link
    expect(html).toContain('Designed &amp; developed by');
  });
});
