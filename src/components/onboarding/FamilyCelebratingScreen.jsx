// src/components/onboarding/FamilyCelebratingScreen.jsx
import { Sparkles, Loader2 } from 'lucide-react';
import MascotAvatar from '../MascotAvatar';

export default function FamilyCelebratingScreen() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <MascotAvatar size="lg" className="animate-bounce" />
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Onboarding Complete!</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
        Personalising your dashboard...
      </h2>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md">
        Calibrating 24-hour inversion curves, CPCB thresholds, and personalized family air defense
        routines.
      </p>
      <Loader2 className="w-6 h-6 text-sky-500 animate-spin mt-4" />
    </div>
  );
}
