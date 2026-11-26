// src/pages/onboarding/OnboardingProfilePage.jsx
/**
 * @fileoverview Step 1 of 2: Compulsory Onboarding - About You.
 * Collects name, age, geographical location, health conditions, and commute habits.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import PersonDetailsForm from '../../components/forms/PersonDetailsForm';
import PrivacyConsentModal from '../../components/onboarding/PrivacyConsentModal';
import OnboardingStep1Header from '../../components/onboarding/OnboardingStep1Header';
import OnboardingStep1Footer from '../../components/onboarding/OnboardingStep1Footer';
import ProfileBasicsFields from '../../components/onboarding/ProfileBasicsFields';
import ProfileLocationFields from '../../components/onboarding/ProfileLocationFields';
import ProfileConsentField from '../../components/onboarding/ProfileConsentField';
import {
  validateProfileForm,
  validateFullName,
  validateAge,
  validateCountry,
  validateState,
  validateCity,
  validateConditions,
  validateSensitivity,
  validateCommute,
  validateLifestyle,
  validateConsent
} from '../../utils/validation';

const DEFAULT_COORDS = {
  name: 'Kolkata',
  latitude: 22.5726,
  longitude: 88.3639,
  timezone: 'Asia/Kolkata',
  admin1: 'West Bengal',
  country: 'India',
  id: 1275004
};

export default function OnboardingProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, rawProfile, saveOnboardingProfile } = useProfile();
  const initialData = rawProfile || profile || {};

  const [fullName, setFullName] = useState(initialData.fullName || user?.displayName || '');
  const [age, setAge] = useState(initialData.age ? String(initialData.age) : '');
  const [country, setCountry] = useState(initialData.country || 'India');
  const [state, setState] = useState(initialData.state || 'West Bengal');
  const [city, setCity] = useState(initialData.city || 'Kolkata');
  const [locationObj, setLocationObj] = useState(
    initialData.latitude && initialData.longitude
      ? {
          name: initialData.city || 'Kolkata',
          latitude: Number(initialData.latitude),
          longitude: Number(initialData.longitude),
          timezone: initialData.timezone || 'Asia/Kolkata',
          admin1: initialData.state || 'West Bengal',
          country: initialData.country || 'India',
          id: initialData.placeId || 1275004
        }
      : initialData.city && initialData.city.toLowerCase() !== 'kolkata'
        ? null
        : DEFAULT_COORDS
  );

  const [conditions, setConditions] = useState(
    Array.isArray(initialData.conditions) && initialData.conditions.length > 0
      ? initialData.conditions
      : ['None']
  );
  const [otherCondition, setOtherCondition] = useState(initialData.otherCondition || '');
  const [sensitivity, setSensitivity] = useState(initialData.sensitivity || 'Low');
  const [commute, setCommute] = useState(
    Array.isArray(initialData.commute) && initialData.commute.length > 0
      ? initialData.commute
      : typeof initialData.commute === 'string' && initialData.commute
        ? [initialData.commute]
        : ['Metro']
  );
  const [lifestyle, setLifestyle] = useState(
    Array.isArray(initialData.lifestyle) && initialData.lifestyle.length > 0
      ? initialData.lifestyle
      : ['Morning walk']
  );
  const [otherLifestyle, setOtherLifestyle] = useState(initialData.otherLifestyle || '');
  const [consent, setConsent] = useState(!!initialData.consentAcceptedAt);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  const fieldRefs = {
    fullName: useRef(null),
    age: useRef(null),
    country: useRef(null),
    state: useRef(null),
    city: useRef(null),
    conditions: useRef(null),
    otherCondition: useRef(null),
    sensitivity: useRef(null),
    commute: useRef(null),
    lifestyle: useRef(null),
    otherLifestyle: useRef(null),
    consent: useRef(null)
  };

  const currentFormValues = {
    fullName,
    age,
    country,
    state,
    city,
    locationObj,
    conditions,
    otherCondition,
    sensitivity,
    commute,
    lifestyle,
    otherLifestyle,
    consent
  };
  const { isValid, errors: validationErrors } = validateProfileForm(currentFormValues);

  useEffect(() => {
    if (conditions.length === 1 && conditions[0] === 'None' && sensitivity !== 'Low')
      setSensitivity('Low');
  }, [conditions, sensitivity]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const map = {
      fullName: () => validateFullName(fullName),
      age: () => validateAge(age),
      country: () => validateCountry(country),
      state: () => validateState(state, country),
      city: () => validateCity(city, locationObj, state, country),
      conditions: () => validateConditions(conditions, otherCondition),
      sensitivity: () => validateSensitivity(sensitivity, conditions),
      commute: () => validateCommute(commute, false),
      lifestyle: () => validateLifestyle(lifestyle, otherLifestyle, false),
      consent: () => validateConsent(consent)
    };
    setErrors((prev) => ({ ...prev, [field]: map[field] ? map[field]() : null }));
  };

  const toggleCondition = (cond) => {
    if (cond === 'None') return (setConditions(['None']), setSensitivity('Low'));
    setConditions((prev) => {
      const f = prev.filter((c) => c !== 'None');
      return f.includes(cond)
        ? f.length === 1
          ? ['None']
          : f.filter((c) => c !== cond)
        : [...f, cond];
    });
  };

  const toggleCommute = (m) =>
    setCommute((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const toggleLifestyle = (a) =>
    setLifestyle((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(Object.keys(fieldRefs).reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    setErrors(validationErrors);

    if (!isValid) {
      const first = Object.keys(fieldRefs).find((f) => validationErrors[f]);
      if (first && fieldRefs[first]?.current) {
        fieldRefs[first].current.focus();
        fieldRefs[first].current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    try {
      await saveOnboardingProfile({
        fullName,
        age: parseInt(age, 10),
        country,
        state,
        city,
        locationObj,
        conditions,
        otherCondition,
        sensitivity,
        commute,
        lifestyle,
        otherLifestyle,
        consentAcceptedAt: new Date().toISOString()
      });
      navigate('/get-started/family');
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        form: err.message || 'Failed to save profile. Please try again.'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <OnboardingStep1Header formError={errors.form} errorList={Object.values(errors)} />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
          <ProfileBasicsFields
            fullName={fullName}
            setFullName={setFullName}
            age={age}
            setAge={setAge}
            errors={errors}
            touched={touched}
            handleBlur={handleBlur}
            fieldRefs={fieldRefs}
          />

          <ProfileLocationFields
            country={country}
            setCountry={setCountry}
            state={state}
            setState={setState}
            city={city}
            setCity={setCity}
            locationObj={locationObj}
            setLocationObj={setLocationObj}
            errors={errors}
            touched={touched}
            handleBlur={handleBlur}
            fieldRefs={fieldRefs}
          />

          <PersonDetailsForm
            conditions={conditions}
            onToggleCondition={toggleCondition}
            otherCondition={otherCondition}
            onOtherConditionChange={setOtherCondition}
            sensitivity={sensitivity}
            onSensitivityChange={setSensitivity}
            commute={commute}
            onToggleCommute={toggleCommute}
            lifestyle={lifestyle}
            onToggleLifestyle={toggleLifestyle}
            otherLifestyle={otherLifestyle}
            onOtherLifestyleChange={setOtherLifestyle}
            errors={errors}
            touched={touched}
            fieldRefs={fieldRefs}
          />

          <ProfileConsentField
            consent={consent}
            setConsent={setConsent}
            onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
            error={errors.consent}
            touched={touched.consent}
            handleBlur={handleBlur}
            fieldRef={fieldRefs.consent}
          />
        </div>

        <OnboardingStep1Footer isValid={isValid} submitting={submitting} />
      </form>

      <PrivacyConsentModal isOpen={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />
    </div>
  );
}
