// src/components/family/FamilyProfilesHeader.jsx
import { Users, Plus } from 'lucide-react';

export default function FamilyProfilesHeader({ onAddMember }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
          <Users className="w-3.5 h-3.5" />
          <span>Household Care Network</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
          Family &amp; Household Health Profiles
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          Foggy tailors every outdoor advisory, commute swap, and filter recommendation to the
          unique respiratory sensitivities of each loved one using official CPCB NAQI guidelines.
        </p>
      </div>

      <button
        type="button"
        onClick={onAddMember}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 shrink-0 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Add Family Member</span>
      </button>
    </div>
  );
}
