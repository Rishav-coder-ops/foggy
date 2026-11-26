/**
 * @fileoverview Modal dialog for editing personal profile details from SettingsPage.
 */

import { X } from 'lucide-react';
import { INDIAN_STATES_AND_UTS } from '../../constants/onboarding.js';
import CityAutocompleteField from '../onboarding/CityAutocompleteField.jsx';

/**
 * Edit personal profile modal component.
 */
export default function EditProfileModal({
  isOpen,
  onClose,
  onSubmit,
  fullName,
  setFullName,
  age,
  setAge,
  state,
  setState,
  city,
  setCity,
  locationObj,
  setLocationObj,
  errors = {},
  saving = false
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3
            id="edit-profile-modal-title"
            className="text-base font-bold text-slate-900 dark:text-white"
          >
            Edit Profile Details
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
          <div>
            <label
              htmlFor="editFullName"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Full Name
            </label>
            <input
              id="editFullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
            {errors.fullName && <p className="text-rose-600 text-[11px] mt-1">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="editAge"
                className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Age
              </label>
              <input
                id="editAge"
                type="number"
                min="1"
                max="120"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              {errors.age && <p className="text-rose-600 text-[11px] mt-1">{errors.age}</p>}
            </div>
            <div>
              <label
                htmlFor="editState"
                className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                State / UT
              </label>
              <select
                id="editState"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setCity('');
                  setLocationObj(null);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                {INDIAN_STATES_AND_UTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <CityAutocompleteField
            id="editCity"
            label="City or Town"
            required={true}
            city={city}
            setCity={setCity}
            state={state}
            country="India"
            locationObj={locationObj}
            setLocationObj={setLocationObj}
            error={errors.city}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
