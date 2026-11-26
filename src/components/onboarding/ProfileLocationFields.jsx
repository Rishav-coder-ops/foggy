// src/components/onboarding/ProfileLocationFields.jsx
import { AlertCircle } from 'lucide-react';
import CityAutocompleteField from './CityAutocompleteField';
import { COUNTRIES, INDIAN_STATES_AND_UTS } from '../../constants/onboarding.js';

export default function ProfileLocationFields({
  country,
  setCountry,
  state,
  setState,
  city,
  setCity,
  locationObj,
  setLocationObj,
  errors,
  touched,
  handleBlur,
  fieldRefs
}) {
  return (
    <>
      {/* 3. Country */}
      <div>
        <label
          htmlFor="country"
          className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
        >
          3. Country <span className="text-rose-500">*</span>
        </label>
        <select
          id="country"
          ref={fieldRefs.country}
          value={country}
          onChange={(e) => {
            const newC = e.target.value;
            setCountry(newC);
            if (newC === 'India') {
              setState('West Bengal');
            } else {
              setState('');
            }
            setCity('');
            setLocationObj(null);
          }}
          onBlur={() => handleBlur('country')}
          aria-invalid={!!(touched.country && errors.country)}
          aria-describedby={errors.country ? 'country-error' : undefined}
          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        {touched.country && errors.country && (
          <p
            id="country-error"
            className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" /> {errors.country}
          </p>
        )}
      </div>

      {/* 4. State or Union Territory */}
      <div>
        <label
          htmlFor="state"
          className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
        >
          4. State or Union Territory <span className="text-rose-500">*</span>
        </label>
        {country === 'India' ? (
          <select
            id="state"
            ref={fieldRefs.state}
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setCity('');
              setLocationObj(null);
            }}
            onBlur={() => handleBlur('state')}
            aria-invalid={!!(touched.state && errors.state)}
            aria-describedby={errors.state ? 'state-error' : undefined}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">-- Select Indian State / UT --</option>
            {INDIAN_STATES_AND_UTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="state"
            ref={fieldRefs.state}
            type="text"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setLocationObj(null);
            }}
            onBlur={() => handleBlur('state')}
            placeholder="e.g. California, Ontario, New South Wales"
            maxLength={60}
            aria-invalid={!!(touched.state && errors.state)}
            aria-describedby={errors.state ? 'state-error' : undefined}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        )}
        {touched.state && errors.state && (
          <p
            id="state-error"
            className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" /> {errors.state}
          </p>
        )}
      </div>

      {/* 5. City or Town */}
      <CityAutocompleteField
        id="city"
        label="5. City or Town"
        required={true}
        city={city}
        setCity={setCity}
        state={state}
        country={country}
        locationObj={locationObj}
        setLocationObj={setLocationObj}
        error={errors.city}
        touched={touched.city}
        onBlur={() => handleBlur('city')}
        inputRef={fieldRefs.city}
        placeholder="Type city or town (e.g. Kolkata, Howrah, Delhi)"
      />
    </>
  );
}
