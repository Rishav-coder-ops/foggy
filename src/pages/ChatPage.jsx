// src/pages/ChatPage.jsx
import React from 'react';
import CompactChatModal from '../components/CompactChatModal';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 px-4 flex flex-col items-center justify-center">
      <div className="mb-4 text-center max-w-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/70 border border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Foggy Assistant Portal</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
          Clean Air Consultation
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Personalized advice based on your saved family profile and local smog conditions.
        </p>
      </div>

      {/* Compact Chat Window - comfortable small size enough to see and scroll */}
      <CompactChatModal isEmbedded={true} />

      <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Context-aware memory active • Disclaimers: For general guidance, not medical diagnosis</span>
      </div>
    </div>
  );
}
