// src/components/chat/ChatModalHeader.jsx
import { Trash2, X, MapPin, Check } from 'lucide-react';
import MascotAvatar from '../MascotAvatar';
import { getAQICategory } from '../../../shared/aqi.js';

export default function ChatModalHeader({
  isTyping,
  activeCityName,
  activeCityAqi,
  activeCityCat,
  isSampleData,
  isDifferentFromDashboard,
  handleSwitch,
  hasSwitched,
  clearChatHistory,
  closeChat,
  isEmbedded
}) {
  const badgeClass = getAQICategory(activeCityCat).badgeClass;

  return (
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
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${badgeClass}`}
            >
              {activeCityCat}
            </span>
            {isSampleData && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                Sample Data
              </span>
            )}
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
  );
}
