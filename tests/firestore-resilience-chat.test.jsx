// tests/firestore-resilience-chat.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CloudSyncBanner from '../src/components/CloudSyncBanner.jsx';
import DashboardPage from '../src/pages/DashboardPage.jsx';
import { buildInitialGreetingMessage } from '../src/context/ChatContext.jsx';
import {
  loadSavedChatHistory,
  saveChatHistory,
  clearStoredChatHistory,
  findLastCityInMessages,
  formatUserMessage,
  formatFoggyReply,
  formatErrorReply,
  formatProfileUnavailableReply
} from '../src/utils/chatHelpers.js';
import {
  loadProfileFromLocalStorage,
  saveProfileToLocalStorage,
  getProfileLocalStorageKey
} from '../src/context/ProfileContext.jsx';
import * as ProfileContextModule from '../src/context/ProfileContext.jsx';
import * as AuthContextModule from '../src/context/AuthContext.jsx';
import * as ChatContextModule from '../src/context/ChatContext.jsx';
import { MemoryRouter } from 'react-router-dom';

describe('tests/firestore-resilience-chat.test.jsx - Firestore Resilience & Chat Context Isolation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('1. CloudSyncBanner & Ad Blocker Detection', () => {
    it('renders non-blocking sync banner with exact warning and retry button when syncBlocked is true', () => {
      const mockRetry = vi.fn();
      vi.spyOn(ProfileContextModule, 'useProfile').mockReturnValue({
        syncBlocked: true,
        retrySync: mockRetry
      });

      render(<CloudSyncBanner />);

      const alertBanner = screen.getByRole('alert');
      expect(alertBanner).toBeInTheDocument();
      expect(alertBanner).toHaveTextContent(
        'Your browser or an extension seems to be blocking cloud sync. Your saved data may not be up to date. Try turning off your ad blocker or Brave Shields for this site.'
      );

      const retryBtn = screen.getByRole('button', { name: /retry/i });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('returns null and does not render when syncBlocked is false', () => {
      vi.spyOn(ProfileContextModule, 'useProfile').mockReturnValue({
        syncBlocked: false,
        retrySync: vi.fn()
      });

      const { container } = render(<CloudSyncBanner />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('2. Persistent Local Cache Hydration & Fallback', () => {
    const testUid = 'user_noida_991';

    it('generates consistent local storage key for profile cache', () => {
      expect(getProfileLocalStorageKey(testUid)).toBe('foggy_profile_user_noida_991');
    });

    it('saves and retrieves profile and household state to persistent local cache', () => {
      const payload = {
        profile: {
          city: 'Noida',
          state: 'Uttar Pradesh',
          latitude: 28.5355,
          longitude: 77.391,
          fullName: 'Rishav Nandi'
        },
        preferredName: 'Rishav',
        familyMembers: [{ id: 'fam_1', name: 'Papa', condition: 'COPD' }],
        onboarding: { step: 'done', completedAt: '2026-11-20T10:00:00.000Z' }
      };

      saveProfileToLocalStorage(testUid, payload);
      const retrieved = loadProfileFromLocalStorage(testUid);

      expect(retrieved).toBeDefined();
      expect(retrieved.profile.city).toBe('Noida');
      expect(retrieved.familyMembers.length).toBe(1);
      expect(retrieved.familyMembers[0].name).toBe('Papa');
      expect(retrieved.preferredName).toBe('Rishav');
    });

    it('returns null safely when localStorage is empty or key does not exist', () => {
      expect(loadProfileFromLocalStorage('non_existent_uid')).toBeNull();
    });
  });

  describe('3. Dashboard Resilience: No Silent Defaults on Firestore Block', () => {
    it('shows clear "We couldn\'t load your profile" state with Retry when profile cannot be loaded at all', () => {
      const mockRetry = vi.fn();
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { uid: 'blocked_user_1', displayName: 'Rishav' },
        isAuthenticated: true
      });
      vi.spyOn(ProfileContextModule, 'useProfile').mockReturnValue({
        profile: null,
        familyMembers: [],
        loadingProfile: false,
        syncBlocked: true,
        retrySync: mockRetry
      });
      vi.spyOn(ChatContextModule, 'useChat').mockReturnValue({
        openChat: vi.fn()
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByText("We couldn't load your profile")).toBeInTheDocument();
      expect(
        screen.getByText(/Your browser or an extension seems to be blocking cloud sync/i)
      ).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalledTimes(1);

      // Asserts that no silent default city like Kolkata or "0 family members" is shown in place
      expect(screen.queryByText(/0 family members/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Kolkata/i)).not.toBeInTheDocument();
    });
  });

  describe('4. Chat Context & Greeting Harmonization', () => {
    it('creates greeting with preferred name, real city (Noida), and real family count (1 family member)', () => {
      const greeting = buildInitialGreetingMessage({
        profile: {
          city: 'Noida',
          state: 'Uttar Pradesh',
          latitude: 28.5355,
          longitude: 77.391,
          fullName: 'Rishav Nandi'
        },
        user: { displayName: 'Rishav Nandi', email: 'rishav@example.com' },
        familyMembers: [{ id: 'fam_1', name: 'Papa', condition: 'COPD' }],
        preferredName: 'Rishav',
        loadingProfile: false,
        syncBlocked: false
      });

      expect(greeting.text).toContain('Hello Rishav!');
      expect(greeting.text).toContain('1 family member');
      expect(greeting.text).toContain('location: Noida');
      expect(greeting.text).not.toContain('your area');
      expect(greeting.text).not.toContain('0 family members');
    });

    it('pluralizes family members properly for multiple members', () => {
      const greeting = buildInitialGreetingMessage({
        profile: { city: 'Bengaluru', fullName: 'Ananya Sharma' },
        user: { displayName: 'Ananya' },
        familyMembers: [
          { id: 'fam_1', name: 'Rohan' },
          { id: 'fam_2', name: 'Kavita' }
        ],
        preferredName: 'Ananya',
        loadingProfile: false,
        syncBlocked: false
      });

      expect(greeting.text).toContain('2 family members');
      expect(greeting.text).toContain('location: Bengaluru');
    });

    it('informs user that profile could not be loaded instead of claiming "0 family members, location: your area" when profile is missing', () => {
      const greeting = buildInitialGreetingMessage({
        profile: null,
        user: { displayName: 'Rishav' },
        familyMembers: [],
        preferredName: 'Rishav',
        loadingProfile: false,
        syncBlocked: true
      });

      expect(greeting.text).toContain("couldn't load your saved profile");
      expect(greeting.text).toContain('ad blocker');
      expect(greeting.text).not.toContain('0 family members');
      expect(greeting.text).not.toContain('location: your area');
    });

    it('displays loading state during initial profile loading', () => {
      const greeting = buildInitialGreetingMessage({
        profile: null,
        user: { displayName: 'Rishav' },
        familyMembers: [],
        preferredName: 'Rishav',
        loadingProfile: true,
        syncBlocked: false
      });

      expect(greeting.text).toContain('Loading your household profile');
    });

    it('manages chat history storage and message formatting helpers', () => {
      const testUser = 'user_test_999';
      expect(loadSavedChatHistory(testUser)).toBeNull();

      const userMsg = formatUserMessage('How is the AQI in Delhi?');
      expect(userMsg.sender).toBe('user');
      expect(userMsg.text).toBe('How is the AQI in Delhi?');

      const foggyReply = formatFoggyReply({
        reply: 'The AQI is currently Moderate.',
        provider: 'Gemini Live',
        model: 'gemini-3.1-flash-lite',
        isLive: true,
        cityData: { name: 'Delhi', lat: 28.61, lon: 77.2 }
      });
      expect(foggyReply.sender).toBe('foggy');
      expect(foggyReply.isLive).toBe(true);

      const msgs = [userMsg, foggyReply];
      saveChatHistory(testUser, msgs);

      const loaded = loadSavedChatHistory(testUser);
      expect(loaded).toHaveLength(2);

      const lastCity = findLastCityInMessages(loaded);
      expect(lastCity?.name).toBe('Delhi');

      clearStoredChatHistory(testUser);
      expect(loadSavedChatHistory(testUser)).toBeNull();

      const errReply = formatErrorReply();
      expect(errReply.text).toContain('hiccup');

      const blockedReply = formatProfileUnavailableReply();
      expect(blockedReply.text).toContain("couldn't load your saved profile");
    });
  });
});
