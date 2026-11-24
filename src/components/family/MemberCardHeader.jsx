// src/components/family/MemberCardHeader.jsx
import { Edit2, Trash2 } from 'lucide-react';
import { getRoleIcon } from '../../constants/family/familyConstants';

export default function MemberCardHeader({ member, profile, onEdit, onDelete }) {
  const isHigh = member.sensitivity === 'High';
  const isMod = member.sensitivity === 'Moderate';

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-start gap-4">
        <span className="text-3xl p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          {getRoleIcon(member.relationship)}
        </span>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {member.name}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              {member.relationship || 'Dependent'}
            </span>
            {member.age ? (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                • {member.age} yrs old
              </span>
            ) : null}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Location:{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {member.city || profile?.city || 'Kolkata'},{' '}
              {member.state || profile?.state || 'West Bengal'}
            </span>
          </p>
        </div>
      </div>

      {/* Actions & Sensitivity Badge */}
      <div className="flex items-center gap-2.5 self-end md:self-auto">
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border ${isHigh
            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800'
            : isMod
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
            }`}
        >
          {member.sensitivity || 'Standard'} Sensitivity
        </span>

        <button
          type="button"
          onClick={() => onEdit(member)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Edit Profile"
          aria-label={`Edit ${member.name}`}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(member.id, member.name)}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          title="Delete Profile"
          aria-label={`Delete ${member.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
