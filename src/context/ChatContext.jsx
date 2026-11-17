// src/context/ChatContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useProfile } from './ProfileContext';
import { sendChatMessage, fetchAQIData } from '../services/api';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const { profile, familyMembers, queuePendingFact } = useProfile();

  const [isOpen, setIsOpen] = useState(false);
  const [aqiData, setAqiData] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`foggy_chat_history_${user?.id || 'guest'}`);
      if (saved) return JSON.parse(saved);
    } catch {}

    const firstName = user?.name ? user.name.split(' ')[0] : 'friend';
    return [
      {
        id: 'msg_initial',
        sender: 'foggy',
        text: `Hello ${firstName}! I'm **Foggy**, your air quality and smog protection companion. 🌫️✨\n\n` +
          `I'm here to give you practical, reassuring, and personalized advice to protect your household from severe winter pollution while lowering emissions.\n\n` +
          `I have your household context in mind (${familyMembers.length} family members, location: ${profile?.location || 'Salt Lake City'}). How can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // Sync AQI context
  useEffect(() => {
    async function load() {
      const data = await fetchAQIData(profile?.location || 'Salt Lake City');
      setAqiData(data);
    }
    load();
  }, [profile?.location]);

  // Persist messages across sessions
  useEffect(() => {
    try {
      localStorage.setItem(`foggy_chat_history_${user?.id || 'guest'}`, JSON.stringify(messages));
    } catch (err) {
      console.warn('Failed to save chat history:', err);
    }
  }, [messages, user?.id]);

  const toggleChat = () => setIsOpen(prev => !prev);
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

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage({
        message: text,
        history: messages,
        user,
        aqiData,
        profile
      });

      const foggyReply = {
        id: 'msg_f_' + Date.now(),
        sender: 'foggy',
        text: response.reply,
        provider: response.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, foggyReply]);

      if (response.extractedFacts && response.extractedFacts.length > 0) {
        response.extractedFacts.forEach(fact => {
          queuePendingFact(fact);
        });
      }
    } catch (err) {
      const errorReply = {
        id: 'msg_err_' + Date.now(),
        sender: 'foggy',
        text: 'Foggy had a brief connection hiccup. Please try asking again!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChatHistory = () => {
    if (window.confirm('Clear conversation history with Foggy?')) {
      const firstName = user?.name ? user.name.split(' ')[0] : 'friend';
      const initial = [
        {
          id: 'msg_initial_' + Date.now(),
          sender: 'foggy',
          text: `Chat cleared! Hello again, ${firstName}. I still retain your saved household profile on the *What Foggy Knows* page. What would you like to plan?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(initial);
      localStorage.removeItem(`foggy_chat_history_${user?.id || 'guest'}`);
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
        aqiData
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
