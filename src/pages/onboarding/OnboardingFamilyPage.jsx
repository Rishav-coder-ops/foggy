// src/pages/onboarding/OnboardingFamilyPage.jsx
/**
 * @fileoverview Step 2 of 2: Compulsory Onboarding - Family & Household Members.
 * Allows adding dependents, elderly parents, and pets for automated outdoor risk calculation.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';
import confetti from 'canvas-confetti';
import { validateFamilyMemberForm } from '../../utils/validation';
import FamilyMemberModal from '../../components/onboarding/FamilyMemberModal';
import FamilyLivesAloneOption from '../../components/onboarding/FamilyLivesAloneOption';
import FamilyMemberList from '../../components/onboarding/FamilyMemberList';
import FamilyCelebratingScreen from '../../components/onboarding/FamilyCelebratingScreen';
import OnboardingStep2Header from '../../components/onboarding/OnboardingStep2Header';
import OnboardingStep2Footer from '../../components/onboarding/OnboardingStep2Footer';

const CONFETTI_DURATION_MS = 1600;

export default function OnboardingFamilyPage() {
  const navigate = useNavigate();
  const { profile, saveOnboardingFamily } = useProfile();

  const defaultCountry = profile?.country || 'India';
  const defaultState = profile?.state || '';
  const defaultCity = profile?.city || '';
  const defaultLocationObj =
    profile?.latitude && profile?.longitude
      ? {
          name: defaultCity || 'Location',
          latitude: Number(profile.latitude),
          longitude: Number(profile.longitude),
          timezone: profile?.timezone || 'Asia/Kolkata',
          admin1: defaultState,
          country: defaultCountry,
          id: profile?.placeId || 1275004
        }
      : null;

  const [members, setMembers] = useState([]);
  const [livesAlone, setLivesAlone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Son');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState(defaultCountry);
  const [state, setState] = useState(defaultState);
  const [city, setCity] = useState(defaultCity);
  const [locationObj, setLocationObj] = useState(defaultLocationObj);
  const [conditions, setConditions] = useState(['None']);
  const [otherCondition, setOtherCondition] = useState('');
  const [sensitivity, setSensitivity] = useState('Low');
  const [commute, setCommute] = useState(['Walk']);
  const [lifestyle, setLifestyle] = useState(['Morning walk']);
  const [otherLifestyle, setOtherLifestyle] = useState('');
  const [modalErrors, setModalErrors] = useState({});

  const isPet = (relationship || '').toLowerCase().trim() === 'pet';

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setRelationship('Son');
    setAge('');
    setCountry(defaultCountry);
    setState(defaultState);
    setCity(defaultCity);
    setLocationObj(defaultLocationObj);
    setConditions(['None']);
    setOtherCondition('');
    setSensitivity('Low');
    setCommute(['Walk']);
    setLifestyle(['Morning walk']);
    setOtherLifestyle('');
    setModalErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingId(member.id);
    setName(member.name);
    setRelationship(member.relationship || 'Dependent');
    setAge(String(member.age || ''));
    setCountry(member.country || defaultCountry);
    setState(member.state || defaultState);
    setCity(member.city || defaultCity);
    setLocationObj(
      member.latitude
        ? {
            name: member.city,
            latitude: member.latitude,
            longitude: member.longitude,
            timezone: member.timezone,
            admin1: member.state,
            country: member.country,
            id: member.placeId
          }
        : defaultLocationObj
    );
    setConditions(
      Array.isArray(member.conditions) && member.conditions.length > 0
        ? member.conditions
        : ['None']
    );
    setOtherCondition(member.otherCondition || '');
    setSensitivity(member.sensitivity || 'Low');
    setCommute(Array.isArray(member.commute) ? member.commute : []);
    setLifestyle(Array.isArray(member.lifestyle) ? member.lifestyle : []);
    setOtherLifestyle(member.otherLifestyle || '');
    setModalErrors({});
    setModalOpen(true);
  };

  const toggleModalCondition = (cond) => {
    if (cond === 'None') return (setConditions(['None']), setSensitivity('Low'));
    setConditions((prev) => {
      const filtered = prev.filter((c) => c !== 'None');
      return filtered.includes(cond)
        ? filtered.length === 1
          ? ['None']
          : filtered.filter((c) => c !== cond)
        : [...filtered, cond];
    });
  };

  const toggleModalCommute = (method) =>
    setCommute((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );

  const toggleModalLifestyle = (act) =>
    setLifestyle((prev) => (prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]));

  const handleSaveModalMember = (e) => {
    e.preventDefault();
    const memberData = {
      id: editingId,
      name,
      relationship,
      age,
      country,
      state,
      city,
      locationObj,
      conditions,
      otherCondition,
      sensitivity: conditions.length === 1 && conditions[0] === 'None' ? 'Low' : sensitivity,
      commute: isPet ? [] : commute,
      lifestyle,
      otherLifestyle
    };
    const { isValid, errors: mErrors, sanitizedData } = validateFamilyMemberForm(memberData);
    if (!isValid) return setModalErrors(mErrors);

    if (editingId) {
      setMembers((prev) => prev.map((m) => (m.id === editingId ? sanitizedData : m)));
    } else {
      setMembers((prev) => [...prev, sanitizedData]);
    }
    setModalOpen(false);
  };

  const isPage2Valid = livesAlone || members.length > 0;

  const handleFinalSubmit = async () => {
    if (!isPage2Valid || submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await saveOnboardingFamily(members, livesAlone);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (_e) {}
      setCelebrating(true);
      setTimeout(() => navigate('/dashboard'), CONFETTI_DURATION_MS);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete onboarding. Please try again.');
      setSubmitting(false);
    }
  };

  if (celebrating) return <FamilyCelebratingScreen />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <OnboardingStep2Header errorMsg={errorMsg} />

      <FamilyLivesAloneOption livesAlone={livesAlone} onChange={setLivesAlone} />

      {!livesAlone && (
        <FamilyMemberList
          members={members}
          onOpenAddModal={handleOpenAddModal}
          onOpenEditModal={handleOpenEditModal}
          onDeleteMember={(id) => setMembers((prev) => prev.filter((m) => m.id !== id))}
        />
      )}

      <OnboardingStep2Footer
        onBack={() => navigate('/get-started/profile')}
        isValid={isPage2Valid}
        submitting={submitting}
        onSubmit={handleFinalSubmit}
      />

      <FamilyMemberModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingId={editingId}
        onSubmit={handleSaveModalMember}
        name={name}
        setName={setName}
        relationship={relationship}
        setRelationship={setRelationship}
        age={age}
        setAge={setAge}
        country={country}
        state={state}
        setState={setState}
        city={city}
        setCity={setCity}
        locationObj={locationObj}
        setLocationObj={setLocationObj}
        conditions={conditions}
        onToggleCondition={toggleModalCondition}
        otherCondition={otherCondition}
        setOtherCondition={setOtherCondition}
        sensitivity={sensitivity}
        setSensitivity={setSensitivity}
        commute={commute}
        onToggleCommute={toggleModalCommute}
        lifestyle={lifestyle}
        onToggleLifestyle={toggleModalLifestyle}
        otherLifestyle={otherLifestyle}
        setOtherLifestyle={setOtherLifestyle}
        errors={modalErrors}
      />
    </div>
  );
}
