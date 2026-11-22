// src/components/CompactChatModal.jsx
import { useRef, useEffect, useState } from 'react';
import { Send, Trash2, X, Sparkles, User as UserIcon, MapPin, Check } from 'lucide-react';
import MascotAvatar from './MascotAvatar';
import FormattedChatMessage from './FormattedChatMessage';
import { useChat } from '../context/ChatContext';
import { useProfile } from '../context/ProfileContext';
import { getStoredCity } from '../services/api';
import { getAQICategory } from '../../shared/aqi.js';

function getCategoryBadge(cat) {
  switch (cat) {
    case 'Good':
      return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    case 'Satisfactory':
      return 'bg-green-100 text-green-900 dark:bg-green-950/80 dark:text-green-300 border-green-300 dark:border-green-800';
    case 'Moderate':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    case 'Poor':
      return 'bg-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800';
    case 'Very Poor':
      return 'bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800';
    case 'Severe':
      return 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  }
}

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

  const activeCityName =
    chatCityData?.name ||
    currentSelectedCity?.name ||
    aqiData?.city ||
    profile?.location ||
    'Kolkata';
  const activeCityAqi =
    chatCityData?.aqi != null ? chatCityData.aqi : aqiData?.aqi != null ? aqiData.aqi : 165;
  const activeCategoryObj = getAQICategory(activeCityAqi);
  const activeCityCat =
    activeCategoryObj?.label || chatCityData?.category || aqiData?.category || 'Moderate';

  const isDifferentFromDashboard = Boolean(
    chatCityData?.name &&
    currentSelectedCity?.name &&
    chatCityData.name.toLowerCase() !== currentSelectedCity.name.toLowerCase()
  );

  const handleSwitch = () => {
    if (chatCityData) {
      switchDashboardToChatCity(chatCityData);
      setHasSwitched(true);
      setTimeout(() => setHasSwitched(false), 3000);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen || isEmbedded) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isEmbedded]);

  if (!isOpen && !isEmbedded) {
    return null;
  }

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const containerClasses = isEmbedded
    ? 'w-full max-w-lg mx-auto h-[580px] max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden'
    : 'fixed inset-x-0 bottom-0 sm:bottom-5 sm:right-5 sm:inset-x-auto z-50 w-full sm:w-[410px] h-[85vh] sm:h-[580px] max-h-[92dvh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t sm:border border-sky-400/40 dark:border-sky-500/40 shadow-2xl dark:shadow-soft-dark flex flex-col overflow-hidden animate-fade-in transition-all';

  return (
    <>
      {/* Mobile Backdrop Blur Overlay */}
      {isOpen && !isEmbedded && (
        <div
          onClick={closeChat}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 sm:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      <div className={containerClasses}>
        {/* Mobile Pull-down indicator bar */}
        {!isEmbedded && (
          <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-1.5 shrink-0 sm:hidden" />
        )}

        {/* Compact Header */}
        <div className="p-3.5 bg-slate-50/90 dark:bg-slate-850 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <MascotAvatar size="sm" mood={isTyping ? 'thinking' : 'happy'} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  Foggy AI Assistant
                </span>
                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] mt-0.5">
                <span className="font-bold text-slate-900 dark:text-white">{activeCityName}</span>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Estimated NAQI:{' '}
                  <strong className="font-extrabold text-slate-900 dark:text-white">
                    {activeCityAqi}
                  </strong>
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getCategoryBadge(activeCityCat)}`}
                >
                  {activeCityCat}
                </span>
              </div>
              {isDifferentFromDashboard && (
                <button
                  type="button"
                  onClick={handleSwitch}
                  className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500 hover:bg-sky-600 active:scale-95 text-white transition-all shadow-xs"
                  title={`Switch dashboard to ${activeCityName}`}
                >
                  {hasSwitched ? (
                    <Check className="w-3 h-3 text-emerald-200" />
                  ) : (
                    <MapPin className="w-3 h-3" />
                  )}
                  <span>
                    {hasSwitched
                      ? `Switched to ${activeCityName}!`
                      : `Switch dashboard to ${activeCityName}`}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={clearChatHistory}
              className="p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
              title="Clear Chat History"
            >
              <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>

            {!isEmbedded && (
              <button
                type="button"
                onClick={closeChat}
                className="p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                title="Close Chat"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Memory extraction notification chip if pending */}
        {pendingFacts && pendingFacts.length > 0 && (
          <div className="p-2.5 px-3 bg-sky-50 dark:bg-sky-950/70 border-b border-sky-200 dark:border-sky-800 text-[11px] flex items-center justify-between gap-2 shrink-0 animate-fade-in">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="truncate text-slate-700 dark:text-slate-200">
                Save:{' '}
                <strong>
                  {pendingFacts[0].name
                    ? `${pendingFacts[0].name} (${pendingFacts[0].condition || 'Health detail'})`
                    : pendingFacts[0].detail || 'Detail'}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => acceptPendingFact(pendingFacts[0].id)}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500 hover:bg-sky-600 text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => dismissPendingFact(pendingFacts[0].id)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 overscroll-contain">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {isUser ? (
                  <div className="w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <MascotAvatar size="sm" className="shrink-0 mt-0.5 scale-90" />
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                    isUser
                      ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 rounded-tr-none'
                      : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 rounded-tl-none'
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-slate-200/50 dark:border-slate-700/50 text-[9px] text-slate-400">
                      <span className="font-bold text-sky-600 dark:text-sky-400">Foggy</span>
                      <span
                        title={
                          msg.isLive
                            ? `Live AI Model: ${msg.model || 'gemini-3.1-flash-lite'}`
                            : msg.reason || 'Built-in rule-based guidance'
                        }
                        className="cursor-help"
                      >
                        {msg.isLive
                          ? `Google Gemini (${msg.model || 'gemini-3.1-flash-lite'})`
                          : msg.provider || "Answered by Foggy's built-in guidance"}
                      </span>
                    </div>
                  )}

                  <FormattedChatMessage content={msg.text} sender={msg.sender} />

                  <div className="mt-1 text-right">
                    <span
                      className={`text-[9px] ${isUser ? 'text-slate-300 dark:text-slate-800' : 'text-slate-400 dark:text-slate-400'}`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

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

        {/* Starter Prompts Horizontal Scroll */}
        <div className="px-3 py-1.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <span className="text-[10px] font-bold text-slate-400 shrink-0">Try:</span>
          {STARTER_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Compact Input Bar */}
        <form
          onSubmit={handleFormSubmit}
          className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0"
        >
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask Foggy (e.g. 'Can kids play outside today?')..."
              className="w-full pl-3.5 pr-10 py-2.5 text-sm sm:text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="absolute right-1.5 p-2 sm:p-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-sky-400"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
