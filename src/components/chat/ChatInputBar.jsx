// src/components/chat/ChatInputBar.jsx
import { Send } from 'lucide-react';

export default function ChatInputBar({
  inputRef,
  inputMessage,
  setInputMessage,
  isTyping,
  onSend,
  starterPrompts = []
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSend();
  };

  return (
    <>
      {starterPrompts.length > 0 && (
        <div className="px-3 py-1.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <span className="text-[10px] font-bold text-slate-400 shrink-0">Try:</span>
          {starterPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSend(prompt)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
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
    </>
  );
}
