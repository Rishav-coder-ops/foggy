// src/context/ChatContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useProfile } from './ProfileContext';
import { sendChatMessage, fetchAQIData, getStoredCity, setStoredCity } from '../services/api';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const { profile, familyMembers, queuePendingFact } = useProfile();
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

    const firstName =
      user?.displayName || user?.name ? (user.displayName || user.name).split(' ')[0] : 'friend';
    return [
      {
        id: 'msg_initial',
        sender: 'foggy',
        text:
          `Hello ${firstName}! I'm **Foggy**, your air quality and smog protection companion. 🌫️✨\n\n` +
          `I'm here to give you practical, reassuring, and personalized advice to protect your household from severe winter pollution while lowering emissions.\n\n` +
          `I have your household context in mind (${familyMembers.length} family members, location: ${profile?.location || 'Kolkata'}). How can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // Switch chat history when active user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`foggy_chat_history_${userUid}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
        const lastWithCity = [...parsed]
          .reverse()
          .find((m) => m.sender === 'foggy' && m.cityData?.name);
        setChatCityData(lastWithCity?.cityData || null);
        return;
      }
    } catch {}

    const firstName =
      user?.displayName || user?.name ? (user.displayName || user.name).split(' ')[0] : 'friend';
    setMessages([
      {
        id: 'msg_initial_' + Date.now(),
        sender: 'foggy',
        text:
          `Hello ${firstName}! I'm **Foggy**, your air quality and smog protection companion. 🌫️✨\n\n` +
          `I'm here to give you practical, reassuring, and personalized advice to protect your household from severe winter pollution while lowering emissions.\n\n` +
          `I have your household context in mind (${familyMembers.length} family members, location: ${profile?.location || 'Kolkata'}). How can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    // Only reset chat messages when the active user ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userUid]);

  // Sync AQI context
  useEffect(() => {
    async function load() {
      const stored = getStoredCity();
      const data = await fetchAQIData({
        lat: stored?.lat,
        lon: stored?.lon,
        cityName: stored?.name || profile?.location || 'Kolkata',
        stateName: stored?.admin1 || ''
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
  }, [profile?.location]);

  // Switch dashboard city to the city currently discussed in chat
  const switchDashboardToChatCity = (target) => {
    const cityObj = target || chatCityData;
    if (!cityObj || !cityObj.name) return;
    const formatted = {
      name: cityObj.name,
      lat: cityObj.lat || 22.5726,
      lon: cityObj.lon || 88.3639,
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
          response.provider || (response.isLive ? 'Gemini 1.5 Flash' : 'Foggy Atmospheric Core'),
        model: response.model || (response.isLive ? 'gemini-1.5-flash' : 'foggy-atmospheric-core'),
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
