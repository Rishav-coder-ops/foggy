// src/components/CompactChatModal.jsx
import { useRef, useEffect, useState } from 'react';
import MascotAvatar from './MascotAvatar';
import { useChat } from '../context/ChatContext';
import { useProfile } from '../context/ProfileContext';
import { getStoredCity } from '../services/api';
import { getAQICategory } from '../../shared/aqi.js';
import ChatModalHeader from './chat/ChatModalHeader';
import ChatPendingFactBanner from './chat/ChatPendingFactBanner';
import ChatMessageItem from './chat/ChatMessageItem';
import ChatInputBar from './chat/ChatInputBar';

const STARTER_PROMPTS = [
  'Plan my low-pollution day',
  'How do I clean my home air on a budget?',
  'What mask should I wear today?',
  'Tips for my child with asthma',
  'How to build a Corsi-Rosenthal filter?'
];

export default function CompactChatModal({ isEmbedded = false }) {
  const {
    isOpen,
    closeChat,
    messages,
    isTyping,
    inputMessage,
    setInputMessage,
    sendMessage,
    clearChatHistory,
    aqiData,
    chatCityData,
    switchDashboardToChatCity
  } = useChat();

  const { pendingFacts, acceptPendingFact, dismissPendingFact, profile } = useProfile();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [hasSwitched, setHasSwitched] = useState(false);
  const [currentSelectedCity, setCurrentSelectedCity] = useState(() => getStoredCity());

  useEffect(() => {
    const handleCity = (e) => {
      setCurrentSelectedCity(e.detail || getStoredCity());
      setHasSwitched(false);
    };
    window.addEventListener('foggy_city_changed', handleCity);
    return () => window.removeEventListener('foggy_city_changed', handleCity);
  }, []);

  const dashboardCityName =
    profile?.city || profile?.location || currentSelectedCity?.name || aqiData?.city || 'Kolkata';

  const normChatCity = (chatCityData?.name || '').toLowerCase().trim();
  const normDashCity = (dashboardCityName || '').toLowerCase().trim();
  const isSameAsDashboard =
    !normChatCity || normDashCity.includes(normChatCity) || normChatCity.includes(normDashCity);

  const activeCityName = isSameAsDashboard ? aqiData?.city || dashboardCityName : chatCityData.name;
  const activeCityAqi = isSameAsDashboard
    ? (aqiData?.aqi ?? chatCityData?.aqi ?? 165)
    : (chatCityData?.aqi ?? aqiData?.aqi ?? 165);
  const activeCategoryObj = getAQICategory(activeCityAqi);
  const activeCityCat = activeCategoryObj.label;

  const isSampleData = isSameAsDashboard ? Boolean(aqiData?.isMock) : Boolean(chatCityData?.isMock);
  const isDifferentFromDashboard = Boolean(
    !isSameAsDashboard && normChatCity && !normDashCity.includes(normChatCity)
  );

  const handleSwitch = () => {
    if (chatCityData) {
      switchDashboardToChatCity(chatCityData);
      setHasSwitched(true);
      setTimeout(() => setHasSwitched(false), 3000);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen || isEmbedded) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isEmbedded]);

  if (!isOpen && !isEmbedded) return null;

  const containerClasses = isEmbedded
    ? 'w-full max-w-lg mx-auto h-[580px] max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden'
    : 'fixed inset-x-0 bottom-0 sm:bottom-5 sm:right-5 sm:inset-x-auto z-50 w-full sm:w-[410px] h-[85vh] sm:h-[580px] max-h-[92dvh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t sm:border border-sky-400/40 dark:border-sky-500/40 shadow-2xl dark:shadow-soft-dark flex flex-col overflow-hidden animate-fade-in transition-all';

  return (
    <>
      {isOpen && !isEmbedded && (
        <div
          onClick={closeChat}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 sm:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      <div className={containerClasses}>
        {!isEmbedded && (
          <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-1.5 shrink-0 sm:hidden" />
        )}

        <ChatModalHeader
          isTyping={isTyping}
          activeCityName={activeCityName}
          activeCityAqi={activeCityAqi}
          activeCityCat={activeCityCat}
          isSampleData={isSampleData}
          isDifferentFromDashboard={isDifferentFromDashboard}
          handleSwitch={handleSwitch}
          hasSwitched={hasSwitched}
          clearChatHistory={clearChatHistory}
          closeChat={closeChat}
          isEmbedded={isEmbedded}
        />

        {pendingFacts && pendingFacts.length > 0 && (
          <ChatPendingFactBanner
            pendingFact={pendingFacts[0]}
            onAccept={acceptPendingFact}
            onDismiss={dismissPendingFact}
          />
        )}

        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 overscroll-contain">
          {messages.map((msg) => (
            <ChatMessageItem key={msg.id} msg={msg} />
          ))}

          {isTyping && (
            <div className="flex items-start gap-2">
              <MascotAvatar size="sm" mood="thinking" className="shrink-0 scale-90 mt-0.5" />
              <div className="rounded-2xl rounded-tl-none p-2.5 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1.5 text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[11px] ml-1">Foggy is typing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInputBar
          inputRef={inputRef}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          isTyping={isTyping}
          onSend={(msg) => sendMessage(msg)}
          starterPrompts={STARTER_PROMPTS}
        />
      </div>
    </>
  );
}
