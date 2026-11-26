// src/components/auth/AuthDemoBanner.jsx
import { Sparkles } from 'lucide-react';

export default function AuthDemoBanner({ onDemoLogin, loading }) {
  return (
    <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
      <div className="text-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Demo Mode Only
        </span>
      </div>
      <button
        type="button"
        onClick={onDemoLogin}
        disabled={loading}
        className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-dashed border-amber-300 dark:border-amber-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Quick 1-Click Demo Account (Offline Sandbox)</span>
      </button>
      <p className="mt-1 text-[10px] text-center text-slate-600 dark:text-slate-400">
        Isolated local preview. Does not sync or connect with Firebase.
      </p>
    </div>
  );
}
