// src/pages/FamilyProfilesPage.jsx
import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Heart, ShieldAlert, AlertCircle, Check, X, Sparkles } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import MascotAvatar from '../components/MascotAvatar';

const ROLES = ['Child', 'Senior', 'Adult', 'Pet', 'Pregnant'];
const SENSITIVITIES = ['High', 'Moderate', 'Standard'];

export default function FamilyProfilesPage() {
  const { familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useProfile();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('Child');
  const [age, setAge] = useState('');
  const [condition, setCondition] = useState('');
  const [sensitivity, setSensitivity] = useState('High');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setRole('Child');
    setAge('');
    setCondition('');
    setSensitivity('High');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingId(member.id);
    setName(member.name);
    setRole(member.role);
    setAge(member.age || '');
    setCondition(member.condition || '');
    setSensitivity(member.sensitivity || 'Moderate');
    setNotes(member.notes || '');
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      role,
      age: age ? parseInt(age, 10) : null,
      condition: condition.trim() || 'None',
      sensitivity,
      notes: notes.trim()
    };

    if (editingId) {
      updateFamilyMember(editingId, data);
    } else {
      addFamilyMember(data);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this family member profile from Foggy?')) {
      deleteFamilyMember(id);
    }
  };

  const getRoleIcon = (r) => {
    switch (r) {
      case 'Child': return '🧒';
      case 'Senior': return '👵';
      case 'Pet': return '🐾';
      case 'Pregnant': return '🤰';
      default: return '👤';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <Users className="w-3.5 h-3.5" />
            <span>Household Care Network</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            Family & Household Health Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Foggy tailors every outdoor advisory, commute swap, and filter recommendation to the unique vulnerabilities of each loved one.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Profiles Grid */}
      {familyMembers.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center shadow-soft dark:shadow-soft-dark max-w-md mx-auto">
          <MascotAvatar size="lg" className="mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No family profiles added yet
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-4">
            Add your children, seniors, pets, or anyone with asthma to receive custom air quality safeguards.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-white"
          >
            Add First Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {familyMembers.map((member) => {
            const isHigh = member.sensitivity === 'High';
            return (
              <div
                key={member.id}
                className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-soft dark:shadow-soft-dark flex flex-col justify-between space-y-4 hover:border-sky-300 dark:hover:border-sky-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-800">
                        {getRoleIcon(member.role)}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">
                          {member.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {member.role} {member.age ? `• ${member.age} yrs old` : ''}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isHigh
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {member.sensitivity} Sensitivity
                    </span>
                  </div>

                  {/* Health Condition */}
                  <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div className="font-bold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Health Condition / Respiratory Vulnerability:</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">
                      {member.condition || 'None reported'}
                    </p>
                  </div>

                  {/* Notes / Special Rules */}
                  {member.notes && (
                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 italic">
                      "{member.notes}"
                    </p>
                  )}

                  {/* Foggy Custom Safeguard Tag */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Foggy automatically prioritizes {member.name}'s safety during chat.</span>
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => openEditModal(member)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Member"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(member.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {editingId ? 'Edit Family Member' : 'Add New Family Member'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Name / Identifier
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Leo, Grandma Helen, Max (Dog)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Age (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 7"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Health Condition / Respiratory Vulnerability
                </label>
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="e.g. Asthma (Uses Inhaler), COPD, Allergies, Heart Disease, None"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sensitivity Level
                </label>
                <select
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  {SENSITIVITIES.map(s => <option key={s} value={s}>{s} Sensitivity</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lifestyle / Outdoor Activity Notes
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Morning soccer practice, walks dog at 8am, needs indoor substitute during smog."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold"
                >
                  {editingId ? 'Update Profile' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
