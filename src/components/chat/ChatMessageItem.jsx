// src/components/chat/ChatMessageItem.jsx
import { User as UserIcon } from 'lucide-react';
import MascotAvatar from '../MascotAvatar';
import FormattedChatMessage from '../FormattedChatMessage';
import { GEMINI_PRIMARY_MODEL, FOGGY_PROVIDER_LABELS } from '../../../shared/constants.js';

export default function ChatMessageItem({ msg }) {
  const isUser = msg.sender === 'user';

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
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
                  ? `Live AI Model: ${msg.model || GEMINI_PRIMARY_MODEL}`
                  : msg.reason || 'Built-in rule-based guidance'
              }
              className="cursor-help"
            >
              {msg.isLive
                ? `${FOGGY_PROVIDER_LABELS.LIVE_GEMINI} (${msg.model || GEMINI_PRIMARY_MODEL})`
                : msg.provider || FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE}
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
}
