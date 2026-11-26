// src/components/onboarding/ProfileBasicsFields.jsx
import { AlertCircle } from 'lucide-react';

export default function ProfileBasicsFields({
  fullName,
  setFullName,
  age,
  setAge,
  errors,
  touched,
  handleBlur,
  fieldRefs
}) {
  return (
    <>
      {/* 1. Full Name */}
      <div>
        <label
          htmlFor="fullName"
          className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
        >
          1. Full Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="fullName"
          ref={fieldRefs.fullName}
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onBlur={() => handleBlur('fullName')}
          placeholder="e.g. Rajesh Sharma"
          maxLength={60}
          aria-invalid={!!(touched.fullName && errors.fullName)}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 ${
            touched.fullName && errors.fullName
              ? 'border-rose-500 focus:ring-rose-400'
              : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
          }`}
        />
        {touched.fullName && errors.fullName && (
          <p
            id="fullName-error"
            className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" /> {errors.fullName}
          </p>
        )}
      </div>

      {/* 2. Age */}
      <div>
        <label
          htmlFor="age"
          className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
        >
          2. Age <span className="text-rose-500">*</span>
        </label>
        <input
          id="age"
          ref={fieldRefs.age}
          type="number"
          min="1"
          max="120"
          required
          value={age}
          onChange={(e) => setAge(e.target.value)}
          onBlur={() => handleBlur('age')}
          placeholder="e.g. 34"
          aria-invalid={!!(touched.age && errors.age)}
          aria-describedby={errors.age ? 'age-error' : undefined}
          className={`w-full sm:w-36 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 ${
            touched.age && errors.age
              ? 'border-rose-500 focus:ring-rose-400'
              : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
          }`}
        />
        {touched.age && errors.age && (
          <p
            id="age-error"
            className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" /> {errors.age}
          </p>
        )}
      </div>
    </>
  );
}
