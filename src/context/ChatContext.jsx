// src/context/ChatContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useProfile } from './ProfileContext';
import { sendChatMessage, fetchAQIData, getStoredCity, setStoredCity } from '../services/api';
import {
  GEMINI_PRIMARY_MODEL,
  FOGGY_FALLBACK_MODEL,
  FOGGY_PROVIDER_LABELS
} from '../../shared/constants.js';
import { formatGreetingName } from '../utils/nameFormatter';

export function buildInitialGreetingMessage({
  profile,
  user,
  familyMembers = [],
  preferredName = '',
  loadingProfile = false,
  syncBlocked = false
}) {
  const firstName =
    preferredName || profile?.preferredName || formatGreetingName(profile, user) || 'Friend';

  if (loadingProfile) {
    return {
      id: 'msg_initial',
      sender: 'foggy',
      text: `Hello ${firstName}! I'm **Foggy**, your air quality and smog protection companion. 🌫️✨\n\nLoading your household profile and local air quality context...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isInitial: true
    };
  }

  const hasProfile = Boolean(
    profile && (profile.city || profile.location || profile.latitude != null)
  );
  if (!hasProfile) {
    return {
      id: 'msg_initial',
      sender: 'foggy',
      text:
        `Hello ${firstName}! I'm **Foggy**, your air quality and smog protection companion. 🌫️✨\n\n` +
        `I couldn't load your saved profile and household context${syncBlocked ? ' (cloud sync appears to be blocked by your browser or an ad blocker)' : ''}. ` +
        `Please check your connection or ad blocker settings so I can provide personalized advice without guessing. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isInitial: true
    };
  }

  const count = Array.isArray(familyMembers) ? familyMembers.length : 0;
  const famText = count === 1 ? '1 family member' : `${count} family members`;
  const cityText = profile.city || profile.location || 'your city';

  return {
    id: 'msg_initial',
    sender: 'foggy',
    text:
      `Hello ${firstName}! I'm **Foggy**, your air quality and smog protection companion. 🌫️✨\n\n` +
      `I'm here to give you practical, reassuring, and personalized advice to protect your household from severe winter pollution while lowering emissions.\n\n` +
      `I have your household context in mind (${famText}, location: ${cityText}). How can I help you today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isInitial: true
  };
}

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const { profile, familyMembers, preferredName, loadingProfile, syncBlocked, queuePendingFact } =
    useProfile();
  const userUid = user?.uid || user?.id || 'guest';

  const [isOpen, setIsOpen] = useState(false);
  const [aqiData, setAqiData] = useState(null);
  const [chatCityData, setChatCityData] = useState(() => {
    try {
      const saved = localStorage.getItem(`foggy_chat_history_${userUid}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const lastWithCity = [...parsed]
            .reverse()
            .find((m) => m.sender === 'foggy' && m.cityData?.name);
          if (lastWithCity?.cityData) return lastWithCity.cityData;
        }
      }
    } catch {}
    return null;
  });
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`foggy_chat_history_${userUid}`);
      if (saved) return JSON.parse(saved);
    } catch {}

    return [
      buildInitialGreetingMessage({
        profile,
        user,
        familyMembers,
        preferredName,
        loadingProfile,
        syncBlocked
      })
    ];
  });

  // Keep chat history synchronized and greeting up to date with profile state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`foggy_chat_history_${userUid}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasUserMessages = parsed.some((m) => m.sender === 'user');
          if (hasUserMessages) {
            setMessages(parsed);
            const lastWithCity = [...parsed]
              .reverse()
              .find((m) => m.sender === 'foggy' && m.cityData?.name);
            setChatCityData(lastWithCity?.cityData || null);
            return;
          }
        }
      }
    } catch {}

    const freshGreeting = buildInitialGreetingMessage({
      profile,
      user,
      familyMembers,
      preferredName,
      loadingProfile,
      syncBlocked
    });
    setMessages([freshGreeting]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userUid,
    profile?.city,
    profile?.location,
    profile?.latitude,
    profile?.longitude,
    familyMembers.length,
    preferredName,
    loadingProfile,
    syncBlocked
  ]);

  // Sync AQI context
  useEffect(() => {
    async function load() {
      const userCity = profile?.city || profile?.location;
      const userLat = profile?.latitude;
      const userLon = profile?.longitude;
      const userState = profile?.state;
      const stored = getStoredCity();

      const targetCity = userCity || stored?.name || 'Kolkata';
      const targetLat = userLat != null ? userLat : stored?.lat;
      const targetLon = userLon != null ? userLon : stored?.lon;
      const targetState = userState || stored?.admin1 || '';

      const data = await fetchAQIData({
        lat: targetLat,
        lon: targetLon,
        cityName: targetCity,
        stateName: targetState
      });
      setAqiData(data);
    }
    load();

    const handleCityChange = (e) => {
      const cityObj = e.detail || getStoredCity() || {};
      fetchAQIData({
        lat: cityObj.lat,
        lon: cityObj.lon,
        cityName: cityObj.name || 'Kolkata',
        stateName: cityObj.admin1 || ''
      }).then((d) => setAqiData(d));
    };

    window.addEventListener('foggy_city_changed', handleCityChange);
    return () => window.removeEventListener('foggy_city_changed', handleCityChange);
  }, [profile?.latitude, profile?.longitude, profile?.city, profile?.location, profile?.state]);

  // Switch dashboard city to the city currently discussed in chat
  const switchDashboardToChatCity = (target) => {
    const cityObj = target || chatCityData;
    if (!cityObj || !cityObj.name) return;
    const formatted = {
      name: cityObj.name,
      lat: cityObj.lat != null ? Number(cityObj.lat) : null,
      lon: cityObj.lon != null ? Number(cityObj.lon) : null,
      admin1: cityObj.admin1 || '',
      country: 'India'
    };
    setStoredCity(formatted);
    window.dispatchEvent(new CustomEvent('foggy_city_changed', { detail: formatted }));
    fetchAQIData({
      lat: formatted.lat,
      lon: formatted.lon,
      cityName: formatted.name,
      stateName: formatted.admin1
    }).then((data) => {
      setAqiData(data);
    });
  };

  // Persist messages across sessions
  useEffect(() => {
    try {
      localStorage.setItem(`foggy_chat_history_${userUid}`, JSON.stringify(messages));
    } catch (err) {
      console.warn('Failed to save chat history:', err);
    }
  }, [messages, userUid]);

  const toggleChat = () => setIsOpen((prev) => !prev);
  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);

  const sendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    const userMsg = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    const hasProfile = Boolean(
      profile && (profile.city || profile.location || profile.latitude != null)
    );
    if (!hasProfile && (syncBlocked || (!loadingProfile && user && !user?.isDemo))) {
      setIsTyping(false);
      const profileUnavailableReply = {
        id: 'msg_f_' + Date.now(),
        sender: 'foggy',
        text: "I couldn't load your saved profile and household context to personalize this advice. Please verify that your ad blocker or Brave Shields isn't blocking cloud sync, then tap Retry in the banner above.",
        provider: FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE,
        model: FOGGY_FALLBACK_MODEL,
        isLive: false,
        reason: 'Profile unavailable',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, profileUnavailableReply]);
      return;
    }

    try {
      const storedCity = getStoredCity();
      const response = await sendChatMessage({
        message: text,
        history: messages,
        user,
        aqiData,
        profile,
        selectedCity: storedCity
      });

      if (response.cityData) {
        setChatCityData(response.cityData);
      }

      const foggyReply = {
        id: 'msg_f_' + Date.now(),
        sender: 'foggy',
        text: response.reply,
        provider:
          response.provider ||
          (response.isLive
            ? FOGGY_PROVIDER_LABELS.LIVE_GEMINI
            : FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE),
        model: response.model || (response.isLive ? GEMINI_PRIMARY_MODEL : FOGGY_FALLBACK_MODEL),
        isLive: Boolean(response.isLive),
        reason: response.reason || null,
        cityData: response.cityData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, foggyReply]);

      if (response.extractedFacts && response.extractedFacts.length > 0) {
        response.extractedFacts.forEach((fact) => {
          queuePendingFact(fact);
        });
      }
    } catch (_err) {
      const errorReply = {
        id: 'msg_err_' + Date.now(),
        sender: 'foggy',
        text: 'Foggy had a brief connection hiccup. Please try asking again!',
        provider: FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE,
        model: FOGGY_FALLBACK_MODEL,
        isLive: false,
        reason: 'Connection interrupted',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChatHistory = () => {
    if (window.confirm('Clear conversation history with Foggy?')) {
      const firstName =
        user?.displayName || user?.name ? (user.displayName || user.name).split(' ')[0] : 'friend';
      const initial = [
        {
          id: 'msg_initial_' + Date.now(),
          sender: 'foggy',
          text: `Chat cleared! Hello again, ${firstName}. I still retain your saved household profile on the *What Foggy Knows* page. What would you like to plan?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(initial);
      setChatCityData(null);
      localStorage.removeItem(`foggy_chat_history_${userUid}`);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleChat,
        openChat,
        closeChat,
        messages,
        isTyping,
        inputMessage,
        setInputMessage,
        sendMessage,
        clearChatHistory,
        aqiData,
        chatCityData,
        setChatCityData,
        switchDashboardToChatCity
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
