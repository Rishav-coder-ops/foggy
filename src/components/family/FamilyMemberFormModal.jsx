// src/components/family/FamilyMemberFormModal.jsx
import { X, Loader2 } from 'lucide-react';
import {
  INDIAN_STATES_AND_UTS,
  HEALTH_CONDITIONS,
  RELATIONSHIP_SUGGESTIONS
} from '../../data/onboardingData';
import ModalCommuteLifestyle from './ModalCommuteLifestyle';

export default function FamilyMemberFormModal({
  isOpen,
  editingId,
  formData,
  formErrors,
  citySuggestions,
  searchingCity,
  onClose,
  onChange,
  onCityInput,
  onSelectCitySuggestion,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 overscroll-contain">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            {editingId ? 'Edit Family Member Profile' : 'Add New Family Member Profile'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {formErrors.submit && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              {formErrors.submit}
            </div>
          )}

          {/* Relationship Tag */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Relationship Tag *
            </label>
            <input
              type="text"
              list="relationship-suggestions"
              value={formData.relationship}
              onChange={(e) => {
                const val = e.target.value;
                onChange((prev) => ({
                  ...prev,
                  relationship: val,
                  sensitivity: val.toLowerCase().trim() === 'pet' ? 'Standard' : prev.sensitivity
                }));
              }}
              placeholder="e.g. Son, Daughter, Dadi, Nani, Pet, Spouse"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
            />
            <datalist id="relationship-suggestions">
              {RELATIONSHIP_SUGGESTIONS.map((rel) => (
                <option key={rel} value={rel} />
              ))}
            </datalist>
            {formErrors.relationship && (
              <p className="text-rose-500 text-[10px] mt-1">{formErrors.relationship}</p>
            )}
          </div>

          {/* Name & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Name / Identifier *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Beta, Dadi, Rusty"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
              {formErrors.name && (
                <p className="text-rose-500 text-[10px] mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Age (Optional for pets)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => onChange((prev) => ({ ...prev, age: e.target.value }))}
                placeholder="e.g. 7 or 74"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
              {formErrors.age && <p className="text-rose-500 text-[10px] mt-1">{formErrors.age}</p>}
            </div>
          </div>

          {/* State & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                State / UT *
              </label>
              <select
                value={formData.state}
                onChange={(e) => onChange((prev) => ({ ...prev, state: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                {INDIAN_STATES_AND_UTS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / Town *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => onCityInput(e.target.value)}
                placeholder="Type to search city..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
              {searchingCity && (
                <div className="absolute right-3 top-8">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                </div>
              )}
              {citySuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto">
                  {citySuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectCitySuggestion(item)}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs cursor-pointer"
                    >
                      {item.name}, {item.admin1 || item.country}
                    </button>
                  ))}
                </div>
              )}
              {formErrors.city && (
                <p className="text-rose-500 text-[10px] mt-1">{formErrors.city}</p>
              )}
            </div>
          </div>

          {/* Health Conditions */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Health Conditions (Multi-select) *
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {HEALTH_CONDITIONS.map((cond) => {
                const isChecked = formData.conditions.includes(cond);
                return (
                  <label
                    key={cond}
                    className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-800 dark:text-slate-200"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        let next;
                        if (cond === 'None') {
                          next = ['None'];
                        } else {
                          const withoutNone = formData.conditions.filter((c) => c !== 'None');
                          if (e.target.checked) {
                            next = [...withoutNone, cond];
                          } else {
                            next = withoutNone.filter((c) => c !== cond);
                          }
                        }
                        if (next.length === 0) next = ['None'];
                        const isNoneOnly = next.length === 1 && next[0] === 'None';
                        onChange((prev) => ({
                          ...prev,
                          conditions: next,
                          sensitivity: isNoneOnly ? 'Low' : prev.sensitivity
                        }));
                      }}
                      className="rounded text-sky-500 focus:ring-sky-400"
                    />
                    <span>{cond}</span>
                  </label>
                );
              })}
            </div>
            {formErrors.conditions && (
              <p className="text-rose-500 text-[10px] mt-1">{formErrors.conditions}</p>
            )}
          </div>

          {/* Sensitivity Level */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sensitivity Level *
            </label>
            <select
              value={formData.sensitivity}
              disabled={formData.conditions.length === 1 && formData.conditions[0] === 'None'}
              onChange={(e) => onChange((prev) => ({ ...prev, sensitivity: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 disabled:opacity-60"
            >
              <option value="Low">Low Sensitivity (No pre-existing conditions)</option>
              <option value="Moderate">Moderate Sensitivity</option>
              <option value="High">High Sensitivity (Asthma / Cardiac / Senior / Infant)</option>
            </select>
            {formErrors.sensitivity && (
              <p className="text-rose-500 text-[10px] mt-1">{formErrors.sensitivity}</p>
            )}
          </div>

          <ModalCommuteLifestyle formData={formData} onChange={onChange} />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold cursor-pointer"
            >
              {editingId ? 'Update Profile' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
