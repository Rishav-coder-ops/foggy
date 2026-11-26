/**
 * @fileoverview Card rendering an individual family member summary with edit and delete actions.
 */

import { Edit2, Trash2, MapPin } from 'lucide-react';

/**
 * Renders registered dependent or pet card in family onboarding.
 */
export default function FamilyMemberCard({ member, onEdit, onDelete }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-2 relative">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 mb-1">
            {member.relationship}
          </span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {member.city}, {member.state} ({member.age} yrs)
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Edit member"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(member.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
            title="Delete member"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 space-y-1">
        <p>
          <strong>Conditions:</strong> {member.conditions?.join(', ') || 'None'}
        </p>
        <p>
          <strong>Sensitivity:</strong>{' '}
          <span
            className={
              member.sensitivity === 'High' ? 'text-rose-600 dark:text-rose-400 font-bold' : ''
            }
          >
            {member.sensitivity}
          </span>
        </p>
      </div>
    </div>
  );
}
