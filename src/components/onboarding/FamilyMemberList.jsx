// src/components/onboarding/FamilyMemberList.jsx
import { Users, Plus } from 'lucide-react';
import FamilyMemberCard from './FamilyMemberCard';

export default function FamilyMemberList({
  members,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteMember
}) {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-500" />
          <span>Registered Dependents & Household ({members.length})</span>
        </h2>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Family Member</span>
        </button>
      </div>

      {members.length === 0 ? (
        <div className="p-8 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <Users className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No household members added yet. Click <strong>"Add Family Member"</strong> above, or
            check <strong>"I live alone"</strong> if you don't have dependents to add.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((m) => (
            <FamilyMemberCard
              key={m.id}
              member={m}
              onEdit={onOpenEditModal}
              onDelete={onDeleteMember}
            />
          ))}
        </div>
      )}
    </div>
  );
}
