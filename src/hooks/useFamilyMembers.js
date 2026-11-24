// src/hooks/useFamilyMembers.js
import { useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { geocodeLocation } from '../services/api';
import { validateFamilyMemberForm } from '../utils/validation';
import { buildDefaultFormData, buildEditFormData } from '../constants/family/familyConstants';

export function useFamilyMembers() {
  const { profile, familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } =
    useProfile();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(() => buildDefaultFormData(profile));
  const [formErrors, setFormErrors] = useState({});
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [searchingCity, setSearchingCity] = useState(false);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(buildDefaultFormData(profile));
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingId(member.id);
    setFormData(buildEditFormData(member, profile));
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleCityInput = async (query) => {
    setFormData((prev) => ({ ...prev, city: query, locationObj: null }));
    if (!query || query.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }
    setSearchingCity(true);
    try {
      const results = await geocodeLocation(query, formData.country);
      setCitySuggestions(results || []);
    } catch {
      setCitySuggestions([]);
    } finally {
      setSearchingCity(false);
    }
  };

  const handleSelectCitySuggestion = (item) => {
    setFormData((prev) => ({
      ...prev,
      city: item.name,
      state: item.admin1 || prev.state,
      locationObj: {
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone || 'Asia/Kolkata',
        admin1: item.admin1 || prev.state,
        country: item.country || prev.country,
        id: item.id
      }
    }));
    setCitySuggestions([]);
    setFormErrors((prev) => ({ ...prev, city: null }));
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    const result = validateFamilyMemberForm(formData);
    if (!result.isValid) {
      setFormErrors(result.errors);
      return;
    }

    try {
      if (editingId) {
        await updateFamilyMember(editingId, result.sanitizedData);
      } else {
        await addFamilyMember(result.sanitizedData);
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to save member:', err);
      setFormErrors({ submit: 'Could not save member profile. Please try again.' });
    }
  };

  const handleDelete = async (id, memberName) => {
    if (
      window.confirm(`Are you sure you want to remove ${memberName} from your household profiles?`)
    ) {
      await deleteFamilyMember(id);
    }
  };

  return {
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
  };
}
