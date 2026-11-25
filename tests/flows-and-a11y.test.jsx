// @vitest-environment jsdom
// tests/flows-and-a11y.test.jsx
/**
 * @fileoverview Integration flows (auth -> onboarding -> dashboard)
 * and comprehensive accessibility audits with vitest-axe across core pages.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe } from 'vitest-axe';

vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

import LandingPage from '../src/pages/LandingPage.jsx';
import AboutPage from '../src/pages/AboutPage.jsx';
import AuthPage from '../src/pages/AuthPage.jsx';
import DashboardPage from '../src/pages/DashboardPage.jsx';
import SearchAQIPage from '../src/pages/SearchAQIPage.jsx';
import OnboardingProfilePage from '../src/pages/onboarding/OnboardingProfilePage.jsx';
import OnboardingFamilyPage from '../src/pages/onboarding/OnboardingFamilyPage.jsx';
import { ThemeProvider } from '../src/context/ThemeContext.jsx';

// Mock Auth
const mockAuth = {
  user: { uid: 'u_123', email: 'test@example.com', displayName: 'Rishav Nandi' },
  isAuthenticated: true,
  loading: false,
  isFirebaseConfigured: true,
  missingFirebaseVars: [],
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginAsDemo: vi.fn(),
  sendPasswordReset: vi.fn()
};

// Mock Profile
const mockProfile = {
  profile: {
    fullName: 'Rishav Nandi',
    age: 28,
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
    conditions: ['None'],
    sensitivity: 'Low',
    commute: ['Metro'],
    lifestyle: ['Walking'],
    consentAcceptedAt: '2026-01-01T00:00:00Z'
  },
  familyMembers: [
    {
      id: 'fam_1',
      name: 'Aarav',
      relationship: 'Son',
      age: 8,
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
  saveOnboardingProfile: vi.fn().mockResolvedValue(true),
  saveOnboardingFamily: vi.fn().mockResolvedValue(true),
  addFamilyMember: vi.fn().mockResolvedValue(true),
  updateFamilyMember: vi.fn().mockResolvedValue(true),
  deleteFamilyMember: vi.fn().mockResolvedValue(true),
  updateProfile: vi.fn().mockResolvedValue(true)
};

const mockChat = {
  messages: [],
  isOpen: false,
  loading: false,
  openChat: vi.fn(),
  closeChat: vi.fn(),
  sendMessage: vi.fn()
};

vi.mock('../src/context/AuthContext.jsx', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }) => children
}));

vi.mock('../src/context/ProfileContext.jsx', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useProfile: () => mockProfile,
    ProfileProvider: ({ children }) => children
  };
});

vi.mock('../src/context/ChatContext.jsx', () => ({
  useChat: () => mockChat,
  ChatProvider: ({ children }) => children
}));

describe('User Interaction Flows & Accessibility Audits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        aqi: 142,
        city: 'Kolkata, West Bengal',
        category: 'Moderate',
        color: '#EAB308',
        dominantPollutant: 'PM2.5',
        pollutants: { pm25: 42.5, pm10: 85, no2: 18, o3: 22, so2: 8, co: 0.6 },
        weather: { temp: 26, humidity: 65, windSpeed: 3.5, condition: 'Clear' },
        updatedAt: '12:00 PM',
        forecastHourly: []
      })
    });
  });

  describe('Integration Flow: Auth Page Interactions', () => {
    it('switches between Sign In and Sign Up modes and validates input', () => {
      render(
        <ThemeProvider>
          <MemoryRouter>
            <AuthPage />
          </MemoryRouter>
        </ThemeProvider>
      );

      // Default is Sign In
      expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
      const signInButtons = screen.getAllByRole('button', { name: /Sign in/i });
      expect(signInButtons.length).toBeGreaterThan(0);

      // Switch to Sign Up
      const signUpTab = screen.getByRole('button', { name: /^Sign Up$/i });
      fireEvent.click(signUpTab);

      expect(
        screen.getByRole('heading', { name: /Create your Foggy account/i })
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. Rajesh Sharma/i)).toBeInTheDocument();
    });

    it('triggers demo login when Quick 1-Click Demo Account is clicked', () => {
      render(
        <ThemeProvider>
          <MemoryRouter>
            <AuthPage />
          </MemoryRouter>
        </ThemeProvider>
      );

      const demoBtn = screen.getByRole('button', { name: /Demo Account/i });
      fireEvent.click(demoBtn);
      expect(mockAuth.loginAsDemo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Flow: Onboarding Profile & Family Pages', () => {
    it('renders and submits Onboarding Step 1 (Profile)', async () => {
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/onboarding/profile']}>
            <Routes>
              <Route path="/onboarding/profile" element={<OnboardingProfilePage />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );

      expect(
        screen.getByRole('heading', { name: /Tell Foggy about yourself/i })
      ).toBeInTheDocument();
      const saveBtn = screen.getByRole('button', { name: /Next: Family & Household/i });
      expect(saveBtn).toBeInTheDocument();
      fireEvent.click(saveBtn);
      await waitFor(() => {
        expect(mockProfile.saveOnboardingProfile).toHaveBeenCalled();
      });
    });

    it('renders Onboarding Step 2 (Family) with option to add member or live alone', async () => {
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/onboarding/family']}>
            <Routes>
              <Route path="/onboarding/family" element={<OnboardingFamilyPage />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );

      expect(
        screen.getByRole('heading', { name: /Your family and household/i })
      ).toBeInTheDocument();
      const livesAloneCheckbox = screen.getByRole('checkbox', { name: /I live alone/i });
      expect(livesAloneCheckbox).toBeInTheDocument();

      // Checking lives alone enables the completion button
      fireEvent.click(livesAloneCheckbox);
      const completeBtn = screen.getByRole('button', { name: /Complete Setup/i });
      expect(completeBtn).not.toBeDisabled();
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(mockProfile.saveOnboardingFamily).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility (a11y) Audits with axe', () => {
    it('LandingPage has no accessibility violations', async () => {
      const { container } = render(
        <ThemeProvider>
          <MemoryRouter>
            <LandingPage />
          </MemoryRouter>
        </ThemeProvider>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('AboutPage has no accessibility violations and contains accessible love credit', async () => {
      const { container } = render(
        <ThemeProvider>
          <MemoryRouter>
            <AboutPage />
          </MemoryRouter>
        </ThemeProvider>
      );
      // Accessible love emoji span test
      const loveEmoji = screen.getByRole('img', { name: 'love' });
      expect(loveEmoji).toBeInTheDocument();
      expect(loveEmoji.textContent).toBe('❤️');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('AuthPage has no accessibility violations', async () => {
      const { container } = render(
        <ThemeProvider>
          <MemoryRouter>
            <AuthPage />
          </MemoryRouter>
        </ThemeProvider>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('DashboardPage has no accessibility violations', async () => {
      const { container } = render(
        <ThemeProvider>
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>
        </ThemeProvider>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('SearchAQIPage has no accessibility violations', async () => {
      const { container } = render(
        <ThemeProvider>
          <MemoryRouter>
            <SearchAQIPage />
          </MemoryRouter>
        </ThemeProvider>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
