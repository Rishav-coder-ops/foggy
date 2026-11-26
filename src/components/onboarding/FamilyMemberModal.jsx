/**
 * @fileoverview Modal dialog for adding or editing a family household member or pet.
 */

import { X } from 'lucide-react';
import { INDIAN_STATES_AND_UTS, RELATIONSHIP_SUGGESTIONS } from '../../constants/onboarding.js';
import PersonDetailsForm from '../forms/PersonDetailsForm';
import CityAutocompleteField from './CityAutocompleteField';

/**
 * Add / Edit Family Member Modal Component.
 */
export default function FamilyMemberModal({
  isOpen,
  onClose,
  editingId,
  onSubmit,
  name,
  setName,
  relationship,
  setRelationship,
  age,
  setAge,
  country,
  state,
  setState,
  city,
  setCity,
  locationObj,
  setLocationObj,
  conditions,
  onToggleCondition,
  otherCondition,
  setOtherCondition,
  sensitivity,
  setSensitivity,
  commute,
  onToggleCommute,
  lifestyle,
  onToggleLifestyle,
  otherLifestyle,
  setOtherLifestyle,
  errors = {}
}) {
  if (!isOpen) return null;

  const isPet = (relationship || '').toLowerCase().trim() === 'pet';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3
            id="member-modal-title"
            className="text-base font-bold text-slate-900 dark:text-white"
          >
            {editingId ? 'Edit Household Member' : 'Add Family Member'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4 text-xs">
          {/* Relationship Combobox */}
          <div>
            <label
              htmlFor="memberRel"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Relationship Tag <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="memberRel"
                type="text"
                required
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Son, Daughter, Mother, Pet..."
                list="relationship-suggestions"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <datalist id="relationship-suggestions">
                {RELATIONSHIP_SUGGESTIONS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
            {errors.relationship && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                {errors.relationship}
              </p>
            )}
          </div>

          {/* Name & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="memberName"
                className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="memberName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isPet ? 'e.g. Rusty' : 'e.g. Beta, Dadi, Priya'}
                maxLength={60}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="memberAge"
                className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Age <span className="text-rose-500">*</span>
              </label>
              <input
                id="memberAge"
                type="number"
                min="1"
                max="120"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 7"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {errors.age && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.age}</p>
              )}
            </div>
          </div>

          {/* Location: State & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="memberState"
                className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                State <span className="text-rose-500">*</span>
              </label>
              {country === 'India' ? (
                <select
                  id="memberState"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setCity('');
                    setLocationObj(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {INDIAN_STATES_AND_UTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="memberState"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State / Region"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              )}
            </div>

            <CityAutocompleteField
              id="memberCity"
              label="City"
              required={true}
              city={city}
              setCity={setCity}
              state={state}
              country={country}
              locationObj={locationObj}
              setLocationObj={setLocationObj}
              error={errors.city}
              placeholder="Search city..."
            />
          </div>

          <PersonDetailsForm
            conditions={conditions}
            onToggleCondition={onToggleCondition}
            otherCondition={otherCondition}
            onOtherConditionChange={setOtherCondition}
            sensitivity={sensitivity}
            onSensitivityChange={setSensitivity}
            commute={commute}
            onToggleCommute={onToggleCommute}
            lifestyle={lifestyle}
            onToggleLifestyle={onToggleLifestyle}
            otherLifestyle={otherLifestyle}
            onOtherLifestyleChange={setOtherLifestyle}
            isPet={isPet}
            errors={errors}
            touched={{ conditions: true, sensitivity: true, commute: true, lifestyle: true }}
            fieldRefs={{}}
          />

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-xs cursor-pointer"
            >
              {editingId ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
