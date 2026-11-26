/**
 * @fileoverview Card displaying verified user profile, health sensitivity, commute, and remembered facts.
 */

import { Link } from 'react-router-dom';
import { Brain, Download, Edit3, Users, Trash2 } from 'lucide-react';

/**
 * Settings card displaying "What Foggy knows about me".
 */
export default function ProfileSummaryCard({
  profile,
  familyMembers = [],
  savedMemories = [],
  onDownloadData,
  onOpenEditModal,
  onDeleteMemory
}) {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-sky-500" />
            <span>What Foggy knows about me</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Collected from your Step 1 profile and conversational learning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDownloadData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download My Data (JSON)</span>
          </button>

          <button
            type="button"
            onClick={onOpenEditModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit My Details</span>
          </button>
        </div>
      </div>

      {/* Display Collected Profile Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Full Name
          </span>
          <p className="font-bold text-slate-900 dark:text-white mt-0.5">
            {profile?.fullName || 'Not specified'}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Age</span>
          <p className="font-bold text-slate-900 dark:text-white mt-0.5">
            {profile?.age ? `${profile.age} years` : 'Not specified'}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Location
          </span>
          <p className="font-bold text-slate-900 dark:text-white mt-0.5">
            {profile?.city}, {profile?.state}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Country
          </span>
          <p className="font-bold text-slate-900 dark:text-white mt-0.5">
            {profile?.country || 'India'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Health Conditions & Sensitivity
          </span>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            {Array.isArray(profile?.conditions) && profile.conditions.length > 0
              ? profile.conditions.join(', ')
              : 'None'}
          </p>
          <span
            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
              profile?.sensitivity === 'High'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300'
                : 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300'
            }`}
          >
            {profile?.sensitivity || 'Low'} Sensitivity
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Commute & Routines
          </span>
          <p className="font-medium text-slate-800 dark:text-slate-200">
            <strong>Commute:</strong>{' '}
            {Array.isArray(profile?.commute)
              ? profile.commute.join(', ')
              : profile?.commute || 'Metro'}
          </p>
          <p className="font-medium text-slate-800 dark:text-slate-200">
            <strong>Lifestyle:</strong>{' '}
            {Array.isArray(profile?.lifestyle) ? profile.lifestyle.join(', ') : 'Morning walk'}
          </p>
        </div>
      </div>

      {/* Link to Family Profiles */}
      <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200">
          <Users className="w-4 h-4 text-sky-600" />
          <span>
            Manage dependent family members and pets:{' '}
            <strong>{familyMembers.length} registered</strong>
          </span>
        </div>
        <Link to="/family" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
          Family Profiles Page →
        </Link>
      </div>

      {/* Remembered Facts List */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Facts Learned from Chats ({savedMemories.length})
        </h3>
        {savedMemories.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No conversational facts recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {savedMemories.map((mem) => (
              <div
                key={mem.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div>
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                    {mem.category} • {mem.dateSaved}
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">
                    {mem.detail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteMemory(mem.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                  title="Delete this fact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
