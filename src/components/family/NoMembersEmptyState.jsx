// src/components/family/NoMembersEmptyState.jsx
import MascotAvatar from '../MascotAvatar';

export default function NoMembersEmptyState({ onAddMember }) {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center shadow-soft dark:shadow-soft-dark max-w-md mx-auto">
      <MascotAvatar size="lg" className="mx-auto mb-3" />
      <h3 className="text-base font-bold text-slate-800 dark:text-white">
        No family profiles added yet
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-4">
        Add children, elders, pets, or anyone with asthma to receive deterministic care plans and
        personalized smog alerts.
      </p>
      <button
        type="button"
        onClick={onAddMember}
        className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-white cursor-pointer"
      >
        Add First Profile
      </button>
    </div>
  );
}
