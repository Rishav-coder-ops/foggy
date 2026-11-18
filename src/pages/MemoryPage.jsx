// src/pages/MemoryPage.jsx
// Memory and Privacy Transparency for Indian Context
import React, { useState } from 'react';
import { Brain, Shield, Trash2, Edit3, Check, X, AlertTriangle, Sparkles, Lock, RefreshCw } from 'lucide-react';
import { useProfile, COOKING_OPTIONS, HEATING_OPTIONS, COMMUTE_OPTIONS } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import MascotAvatar from '../components/MascotAvatar';
import { getStoredCity } from '../services/api';

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
  const [location, setLocation] = useState(profile?.location || getStoredCity()?.name || 'Kolkata');
  const [commute, setCommute] = useState(profile?.commute || 'Metro');
  const [heatingType, setHeatingType] = useState(profile?.heatingType || 'Electric geyser or heater');
  const [cookingType, setCookingType] = useState(profile?.cookingType || 'LPG Cylinder');
  const [budget, setBudget] = useState(profile?.budget || 'Practical / Budget-conscious (₹)');

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
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition-colors shrink-0 cursor-pointer"
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
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
                placeholder="e.g. Kolkata, Mumbai, Delhi..."
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
                {COMMUTE_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Home Heating / Geyser
              </label>
              <select
                value={heatingType}
                onChange={(e) => setHeatingType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                {HEATING_OPTIONS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cooking Fuel / Appliance
              </label>
              <select
                value={cookingType}
                onChange={(e) => setCookingType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                {COOKING_OPTIONS.map((ck) => (
                  <option key={ck} value={ck}>{ck}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingAttributes(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold cursor-pointer"
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
                {profile?.location || 'Kolkata'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Commute Style
              </span>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                {profile?.commute || 'Metro'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Home Heating / Geyser
              </span>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                {profile?.heatingType || 'Electric geyser'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Cooking Fuel
              </span>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                {profile?.cookingType || 'LPG Cylinder'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Extracted Memory Items List */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Remembered Facts & Inferences ({savedMemories.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Facts Foggy has extracted from your conversations or verified tips. You can delete any fact anytime.
            </p>
          </div>
        </div>

        {savedMemories.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            No memories saved yet. As you talk to Foggy about your family health, fuels, or daily routines, key facts will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {savedMemories.map((mem) => (
              <div
                key={mem.id}
                className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 text-xs transition-colors hover:border-slate-300 dark:hover:border-slate-600"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-[10px]">
                      {mem.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {mem.dateSaved}
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {mem.detail}
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    Source: {mem.source}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => deleteMemory(mem.id)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Forget this memory"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Modal Confirmation */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Clear All Memory & Profiles?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action will reset your saved household details, all family health profiles, and conversation history stored on this device. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Keep My Data
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
