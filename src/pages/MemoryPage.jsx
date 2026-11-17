// src/pages/MemoryPage.jsx
import React, { useState } from 'react';
import { Brain, Shield, Trash2, Edit3, Check, X, AlertTriangle, Sparkles, Lock, RefreshCw } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import MascotAvatar from '../components/MascotAvatar';

export default function MemoryPage() {
  const { user } = useAuth();
  const {
    profile,
    updateProfile,
    savedMemories,
    deleteMemory,
    clearAllUserData
  } = useProfile();

  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [editingAttributes, setEditingAttributes] = useState(false);

  // Edit fields
  const [location, setLocation] = useState(profile?.location || 'Salt Lake City');
  const [commute, setCommute] = useState(profile?.commute || 'Public Transit');
  const [heatingType, setHeatingType] = useState(profile?.heatingType || 'Natural Gas Furnace');
  const [cookingType, setCookingType] = useState(profile?.cookingType || 'Induction Cooktop');
  const [budget, setBudget] = useState(profile?.budget || 'Balanced / Practical');

  const handleSaveAttributes = (e) => {
    e.preventDefault();
    updateProfile({
      location,
      commute,
      heatingType,
      cookingType,
      budget
    });
    setEditingAttributes(false);
  };

  const handleConfirmClear = () => {
    clearAllUserData();
    setClearModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <Brain className="w-3.5 h-3.5" />
            <span>Memory & Privacy Transparency</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            What Foggy Knows About You
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Complete transparency into the personal preferences, health vulnerabilities, and lifestyle facts Foggy uses to personalize your recommendations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setClearModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All My Data</span>
        </button>
      </div>

      {/* Privacy Notice Box */}
      <div className="rounded-3xl bg-slate-50 dark:bg-slate-850 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
        <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          <Lock className="w-4 h-4" />
          <span>Privacy & Sensitive Health Data Guarantee</span>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          Health conditions (such as asthma, COPD, and cardiovascular risk) are sensitive personal details. Foggy stores this information <strong>strictly on your local device</strong> (in browser localStorage) tied to your active profile. We do not sell your data, use your family health facts to train public models, or share them with third parties.
        </p>
      </div>

      {/* Core Household Attributes */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Core Profile & Environmental Context
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Injected into Foggy's system prompt so you never have to repeat your city or commute.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEditingAttributes(!editingAttributes)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editingAttributes ? 'Cancel' : 'Edit Attributes'}</span>
          </button>
        </div>

        {editingAttributes ? (
          <form onSubmit={handleSaveAttributes} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary City / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Commute Method
              </label>
              <select
                value={commute}
                onChange={(e) => setCommute(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                <option value="Public Transit">Public Transit (Metro / Bus)</option>
                <option value="Solo Car (Gasoline/Diesel)">Solo Car (Gasoline/Diesel)</option>
                <option value="Electric Vehicle (EV)">Electric Vehicle (EV)</option>
                <option value="Carpool">Carpool</option>
                <option value="Bicycle / Walking">Bicycle / Walking</option>
                <option value="Work from Home">Work from Home</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Home Heating Source
              </label>
              <select
                value={heatingType}
                onChange={(e) => setHeatingType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                <option value="Electric Heat Pump / Mini-Split">Electric Heat Pump / Mini-Split</option>
                <option value="Natural Gas Furnace">Natural Gas Furnace</option>
                <option value="District Steam / Radiator">District Steam / Radiator</option>
                <option value="Electric Baseboard / Space Heater">Electric Baseboard / Space Heater</option>
                <option value="Wood Burning Stove / Fireplace">Wood Burning Stove / Fireplace</option>
                <option value="Coal Burner">Coal Burner</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cooking Appliance
              </label>
              <select
                value={cookingType}
                onChange={(e) => setCookingType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                <option value="Induction Cooktop">Induction Cooktop (Cleanest)</option>
                <option value="Standard Electric Coil/Ceramic">Standard Electric Coil/Ceramic</option>
                <option value="Natural Gas Burner">Natural Gas Burner</option>
                <option value="LPG Cylinder Stove">LPG Cylinder Stove</option>
                <option value="Traditional Biomass">Traditional Biomass</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingAttributes(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold"
              >
                Save Attributes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                City / Location
              </span>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                {profile?.location || 'Salt Lake City'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Commute Style
              </span>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                {profile?.commute || 'Public Transit'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Home Heating
              </span>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                {profile?.heatingType || 'Natural Gas'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Cooktop Type
              </span>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                {profile?.cookingType || 'Induction'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Extracted Chat Memories */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Extracted Facts & Learned Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Details Foggy noted during your conversations and suggested saving to your profile.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {savedMemories.length} Facts Saved
          </span>
        </div>

        {savedMemories.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No memories saved yet. As you chat with Foggy about your family, commute, or heating, Foggy will offer to remember key facts here.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {savedMemories.map((mem) => (
              <div key={mem.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300">
                      {mem.category || 'General Context'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Saved: {mem.dateSaved}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {mem.detail}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => deleteMemory(mem.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Forget this memory"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Data Modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-md w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Clear All Personal Data?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action will permanently delete all your saved family profiles, learned chat memories, and conversation history from your device's local storage. Foggy will revert to a fresh clean state.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Yes, Wipe All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
