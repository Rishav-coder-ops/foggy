// src/components/FloatingChatButton.jsx
import React, { useState } from 'react';
import { Sparkles, X, MessageSquare } from 'lucide-react';
import MascotAvatar from './MascotAvatar';
import { useChat } from '../context/ChatContext';

export default function FloatingChatButton() {
  const { isOpen, toggleChat } = useChat();
  const [showTeaser, setShowTeaser] = useState(true);

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-3">
      {/* Speech bubble teaser */}
      {showTeaser && !isOpen && (
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 text-slate-800 dark:text-slate-100 shadow-xl text-xs font-semibold animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Chat with Foggy</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTeaser(false);
            }}
            className="p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Round Assistant Logo Button */}
      <button
        type="button"
        onClick={toggleChat}
        className={`relative group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-sky-400 via-teal-300 to-amber-300 p-1 shadow-lg hover:shadow-glow-ozone hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sky-400/50 cursor-pointer ${
          isOpen ? 'ring-2 ring-sky-400 scale-95 opacity-80' : ''
        }`}
        aria-label="Toggle Foggy AI Assistant chat"
        title={isOpen ? 'Close Foggy Chat' : 'Chat with Foggy'}
      >
        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
          {isOpen ? (
            <X className="w-6 h-6 text-sky-300" />
          ) : (
            <MascotAvatar size="md" className="pointer-events-none" />
          )}
        </div>

        {/* Pulse indicator when closed */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 border-2 border-white dark:border-slate-900"></span>
          </span>
        )}
      </button>
    </div>
  );
}
