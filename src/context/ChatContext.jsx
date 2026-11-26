// src/context/ChatContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useProfile } from './ProfileContext';
import { sendChatMessage, fetchAQIData, getStoredCity, setStoredCity } from '../services/api';
import {
  buildInitialGreetingMessage,
  loadSavedChatHistory,
  saveChatHistory,
  clearStoredChatHistory,
  findLastCityInMessages,
  formatUserMessage,
  formatFoggyReply,
  formatErrorReply,
  formatProfileUnavailableReply
} from '../utils/chatHelpers';

export { buildInitialGreetingMessage };

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const { profile, familyMembers, preferredName, loadingProfile, syncBlocked, queuePendingFact } =
    useProfile();
  const userUid = user?.uid || user?.id || 'guest';

  const [isOpen, setIsOpen] = useState(false);
  const [aqiData, setAqiData] = useState(null);
  const [chatCityData, setChatCityData] = useState(() => {
    const history = loadSavedChatHistory(userUid);
    return findLastCityInMessages(history);
  });
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const [messages, setMessages] = useState(() => {
    const history = loadSavedChatHistory(userUid);
    if (history) return history;
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
    const history = loadSavedChatHistory(userUid);
    if (history && history.some((m) => m.sender === 'user')) {
      setMessages(history);
      setChatCityData(findLastCityInMessages(history));
      return;
    }

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
      const stored = getStoredCity();
      const targetCity = profile?.city || profile?.location || stored?.name || 'Kolkata';
      const targetLat = profile?.latitude != null ? profile.latitude : stored?.lat;
      const targetLon = profile?.longitude != null ? profile.longitude : stored?.lon;
      const targetState = profile?.state || stored?.admin1 || '';

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
    }).then((data) => setAqiData(data));
  };

  useEffect(() => {
    saveChatHistory(userUid, messages);
  }, [messages, userUid]);

  const toggleChat = () => setIsOpen((prev) => !prev);
  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);

  const sendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    setMessages((prev) => [...prev, formatUserMessage(text)]);
    setInputMessage('');
    setIsTyping(true);

    const hasProfile = Boolean(
      profile && (profile.city || profile.location || profile.latitude != null)
    );
    if (!hasProfile && (syncBlocked || (!loadingProfile && user && !user?.isDemo))) {
      setIsTyping(false);
      setMessages((prev) => [...prev, formatProfileUnavailableReply()]);
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

      if (response.cityData) setChatCityData(response.cityData);
      setMessages((prev) => [...prev, formatFoggyReply(response)]);

      if (response.extractedFacts && response.extractedFacts.length > 0) {
        response.extractedFacts.forEach((fact) => queuePendingFact(fact));
      }
    } catch (_err) {
      setMessages((prev) => [...prev, formatErrorReply()]);
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
      clearStoredChatHistory(userUid);
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
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
}
