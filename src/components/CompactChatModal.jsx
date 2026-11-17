// src/components/CompactChatModal.jsx
import React, { useRef, useEffect } from 'react';
import { Send, Trash2, X, Sparkles, User as UserIcon, Minus } from 'lucide-react';
import MascotAvatar from './MascotAvatar';
import { useChat } from '../context/ChatContext';
import { useProfile } from '../context/ProfileContext';

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
    aqiData
  } = useChat();

  const { pendingFacts, acceptPendingFact, dismissPendingFact, profile } = useProfile();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  const renderFormattedSpans = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const renderMessageContent = (content) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-extrabold text-slate-800 dark:text-white pt-1 text-xs sm:text-sm">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-extrabold text-slate-800 dark:text-white pt-1 text-sm">
                {line.replace('## ', '')}
              </h3>
            );
          }
          if (line.startsWith('* ') || line.startsWith('- ')) {
            const rawText = line.substring(2);
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-sky-500 font-bold text-xs mt-0.5">•</span>
                <span>{renderFormattedSpans(rawText)}</span>
              </div>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <div key={idx} className="p-2 rounded-xl bg-amber-500/10 border-l-2 border-amber-500 text-amber-900 dark:text-amber-300 text-[11px] italic my-1">
                {renderFormattedSpans(line.replace('> ', ''))}
              </div>
            );
          }
          return <p key={idx}>{renderFormattedSpans(line)}</p>;
        })}
      </div>
    );
  };

  const containerClasses = isEmbedded
    ? 'w-full max-w-lg mx-auto h-[580px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden'
    : 'fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[410px] h-[580px] max-h-[85vh] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-sky-400/40 dark:border-sky-500/40 shadow-2xl dark:shadow-soft-dark flex flex-col overflow-hidden animate-fade-in transition-all';

  return (
    <div className={containerClasses}>
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
            <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5">
              {aqiData?.city || profile?.location || 'Salt Lake City'} • AQI {aqiData?.aqi || 125}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearChatHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {!isEmbedded && (
            <button
              type="button"
              onClick={closeChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
              title="Close Chat"
              aria-label="Close Chat"
            >
              <X className="w-4 h-4" />
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
              Save: <strong>{pendingFacts[0].name ? `${pendingFacts[0].name} (${pendingFacts[0].condition || 'Health detail'})` : (pendingFacts[0].detail || 'Detail')}</strong>
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
                    <span>{msg.provider || 'Gemini 1.5'}</span>
                  </div>
                )}

                {renderMessageContent(msg.text)}

                <div className="mt-1 text-right">
                  <span className={`text-[9px] ${isUser ? 'text-slate-300 dark:text-slate-800' : 'text-slate-400 dark:text-slate-400'}`}>
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
      <form onSubmit={handleFormSubmit} className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask Foggy (e.g. 'Can kids play outside today?')..."
            className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="absolute right-1.5 p-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
