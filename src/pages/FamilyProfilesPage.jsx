// src/pages/FamilyProfilesPage.jsx
// Comprehensive Family & Household Air Health Profiles with CPCB NAQI Care Plan Engine & Foggy Personalization

import { useAuth } from '../context/AuthContext';
import { useFamilyMembers } from '../hooks/useFamilyMembers';
import { useFamilyProfilesAqi } from '../hooks/useFamilyProfilesAqi';
import { useCarePlan } from '../hooks/useCarePlan';
import { usePersonalizeMemo } from '../hooks/usePersonalizeMemo';
import FamilyProfilesHeader from '../components/family/FamilyProfilesHeader';
import NoMembersEmptyState from '../components/family/NoMembersEmptyState';
import FamilyMemberList from '../components/family/FamilyMemberList';
import FamilyAiPersonalizationModal from '../components/family/FamilyAiPersonalizationModal';
import FamilyMemberFormModal from '../components/family/FamilyMemberFormModal';

export default function FamilyProfilesPage() {
  const { user } = useAuth();
  const {
    profile,
    familyMembers,
    modalOpen,
    editingId,
    formData,
    setFormData,
    formErrors,
    citySuggestions,
    searchingCity,
    openAddModal,
    openEditModal,
    closeModal,
    handleCityInput,
    handleSelectCitySuggestion,
    handleModalSave,
    handleDelete
  } = useFamilyMembers();

  const { aqiData, membersAqi } = useFamilyProfilesAqi(profile, familyMembers);
  const { expandedPlans, toggleCarePlan } = useCarePlan();
  const {
    personalizingMember,
    setPersonalizingMember,
    aiMemo,
    loadingAi,
    aiError,
    handlePersonalizeWithFoggy
  } = usePersonalizeMemo();

  const onPersonalize = (member) => {
    const memberAqi = membersAqi[member.id] || aqiData;
    handlePersonalizeWithFoggy(member, memberAqi, profile, user);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <FamilyProfilesHeader onAddMember={openAddModal} />

      {familyMembers.length === 0 ? (
        <NoMembersEmptyState onAddMember={openAddModal} />
      ) : (
        <FamilyMemberList
          familyMembers={familyMembers}
          profile={profile}
          aqiData={aqiData}
          membersAqi={membersAqi}
          expandedPlans={expandedPlans}
          onTogglePlan={toggleCarePlan}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onPersonalize={onPersonalize}
        />
      )}

      <FamilyAiPersonalizationModal
        member={personalizingMember}
        aiMemo={aiMemo}
        loadingAi={loadingAi}
        aiError={aiError}
        aqiData={membersAqi[personalizingMember?.id] || aqiData}
        onClose={() => setPersonalizingMember(null)}
        onRetry={() => onPersonalize(personalizingMember)}
      />

      <FamilyMemberFormModal
        isOpen={modalOpen}
        editingId={editingId}
        formData={formData}
        formErrors={formErrors}
        citySuggestions={citySuggestions}
        searchingCity={searchingCity}
        onClose={closeModal}
        onChange={setFormData}
        onCityInput={handleCityInput}
        onSelectCitySuggestion={handleSelectCitySuggestion}
        onSubmit={handleModalSave}
      />
    </div>
  );
}
