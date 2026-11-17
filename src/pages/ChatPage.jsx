// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Trash2, Shield, Info, Check, X, ArrowDown, Bot, User as UserIcon, RefreshCw } from 'lucide-react';
import MascotAvatar from '../components/MascotAvatar';
import ImpactBadge from '../components/ImpactBadge';
import { sendChatMessage, fetchAQIData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const STARTER_PROMPTS = [
  'Plan my low-pollution day',
  'How do I clean my home air on a budget?',
  'What mask should I wear today?',
  'Tips for my child with asthma during smog',
  'How do I build a Corsi-Rosenthal DIY box filter?',
  'What are the best hours to walk my dog outside?'
];

export default function ChatPage() {
  const { user } = useAuth();
  const {
    profile,
    familyMembers,
    queuePendingFact,
    acceptPendingFact,
    dismissPendingFact,
    pendingFacts
  } = useProfile();

  const [aqiData, setAqiData] = useState(null);
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
          `I'm here to give you practical, reassuring, and personalized advice to protect your household from severe winter pollution while lowering our community's emissions.\n\n` +
          `I already have your household context in mind (${familyMembers.length} family members saved, location: ${profile?.location || 'Salt Lake City'}). How can I support you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);

  // Load AQI for context
  useEffect(() => {
    async function load() {
      const data = await fetchAQIData(profile?.location || 'Salt Lake City');
      setAqiData(data);
    }
    load();
  }, [profile?.location]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(`foggy_chat_history_${user?.id || 'guest'}`, JSON.stringify(messages));
    } catch (err) {
      console.warn('Failed to save chat history:', err);
    }
  }, [messages, user?.id]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    setErrorMsg('');
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

      // Check if Foggy extracted any new facts
      if (response.extractedFacts && response.extractedFacts.length > 0) {
        response.extractedFacts.forEach(fact => {
          queuePendingFact(fact);
        });
      }
    } catch (err) {
      setErrorMsg('Foggy encountered a brief hiccup. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear your conversation history with Foggy?')) {
      const firstName = user?.name ? user.name.split(' ')[0] : 'friend';
      const initial = [
        {
          id: 'msg_initial_' + Date.now(),
          sender: 'foggy',
          text: `Chat cleared! Hello again, ${firstName}. I still retain your saved household profile and health preferences on the *What Foggy Knows* page. What would you like to plan?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(initial);
      localStorage.removeItem(`foggy_chat_history_${user?.id || 'guest'}`);
    }
  };

  // Simple clean markdown formatter
  const renderMessageContent = (content) => {
    // Split into paragraphs / lines
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;

          // Header line
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-extrabold text-slate-800 dark:text-white pt-1 text-sm">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-extrabold text-slate-800 dark:text-white pt-1.5 text-base">
                {line.replace('## ', '')}
              </h3>
            );
          }

          // Bullet point
          if (line.startsWith('* ') || line.startsWith('- ')) {
            const rawText = line.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-sky-500 font-bold mt-1 text-xs">•</span>
                <span>{renderFormattedSpans(rawText)}</span>
              </div>
            );
          }

          // Blockquote (often safety disclaimer)
          if (line.startsWith('> ')) {
            return (
              <div key={idx} className="p-2.5 rounded-xl bg-amber-500/10 border-l-2 border-amber-500 text-amber-900 dark:text-amber-300 text-xs italic my-1">
                {renderFormattedSpans(line.replace('> ', ''))}
              </div>
            );
          }

          return <p key={idx}>{renderFormattedSpans(line)}</p>;
        })}
      </div>
    );
  };

  const renderFormattedSpans = (text) => {
    // Simple bold regex (**text**)
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Context Bar */}
      <div className="mb-4 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-soft dark:shadow-soft-dark flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <MascotAvatar size="md" mood={isTyping ? 'thinking' : 'happy'} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                Chatting with Foggy
              </h2>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Memory
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              City: <strong className="text-slate-700 dark:text-slate-300">{aqiData?.city || profile?.location || 'Salt Lake City'}</strong> • AQI: <strong className="text-slate-700 dark:text-slate-300">{aqiData?.aqi || 125}</strong> • Members: <strong className="text-slate-700 dark:text-slate-300">{familyMembers.length}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearHistory}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Extracted Memory Prompt Banner if any are pending */}
      {pendingFacts && pendingFacts.length > 0 && (
        <div className="mb-3 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-xs flex items-center justify-between gap-3 animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="text-slate-700 dark:text-slate-200">
              <strong>Foggy noticed:</strong> {pendingFacts[0].name ? `${pendingFacts[0].name} (${pendingFacts[0].condition || 'Health detail'})` : (pendingFacts[0].detail || 'New detail')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => acceptPendingFact(pendingFacts[0].id)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs"
            >
              Save to Profile
            </button>
            <button
              type="button"
              onClick={() => dismissPendingFact(pendingFacts[0].id)}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {isUser ? (
                <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
              ) : (
                <MascotAvatar size="sm" className="shrink-0 mt-1" />
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-xs ${
                  isUser
                    ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 rounded-tr-none'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-tl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-sky-600 dark:text-sky-400">Foggy AI</span>
                    <span>{msg.provider || 'Gemini 1.5 Flash'}</span>
                  </div>
                )}

                {renderMessageContent(msg.text)}

                <div className="mt-2 text-right">
                  <span className={`text-[10px] ${isUser ? 'text-slate-300 dark:text-slate-800' : 'text-slate-500 dark:text-slate-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-start gap-3">
            <MascotAvatar size="sm" mood="thinking" className="shrink-0 mt-1" />
            <div className="rounded-3xl rounded-tl-none p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">
                Foggy is tailoring clean air guidance...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts Carousel / Pills */}
      <div className="py-2 overflow-x-auto shrink-0 flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
          Try asking:
        </span>
        {STARTER_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(prompt)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-200/70 dark:bg-slate-800/80 hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300/60 dark:border-slate-700/60 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="mt-1 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask Foggy anything (e.g. 'Can my son play soccer outside?', 'How do I seal my windows?')..."
            className="w-full pl-4 pr-12 py-3.5 text-xs sm:text-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm transition-all"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="absolute right-2 p-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label="Send message to Foggy"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
