// src/components/family/MemberCardDetails.jsx
import { Heart, Compass, Activity } from 'lucide-react';

export default function MemberCardDetails({ member }) {
  const conds = Array.isArray(member.conditions)
    ? member.conditions
    : member.condition
      ? [member.condition]
      : ['None'];
  const commutes = Array.isArray(member.commute) ? member.commute : [];
  const lifestyles = Array.isArray(member.lifestyle) ? member.lifestyle : [];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-xs">
        {/* Conditions */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Health Conditions</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {conds.map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-medium"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Commute */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Compass className="w-3.5 h-3.5 text-sky-500" />
            <span>Daily Commute Methods</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {commutes.length > 0 ? (
              commutes.map((cm) => (
                <span
                  key={cm}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-medium"
                >
                  {cm}
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic">None specified</span>
            )}
          </div>
        </div>

        {/* Lifestyle */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Outdoor Habits / Routine</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {lifestyles.length > 0 ? (
              lifestyles.map((ls) => (
                <span
                  key={ls}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-medium"
                >
                  {ls}
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic">Standard routine</span>
            )}
          </div>
        </div>
      </div>

      {member.notes && (
        <p className="text-xs text-slate-600 dark:text-slate-400 italic mb-4">
          Special notes: &ldquo;{member.notes}&rdquo;
        </p>
      )}
    </>
  );
}
