// src/hooks/useFamilyProfilesAqi.js
import { useState, useEffect } from 'react';
import { fetchAQIData } from '../services/api';

export function useFamilyProfilesAqi(profile, familyMembers = []) {
  const [aqiData, setAqiData] = useState(null);
  const [loadingAQI, setLoadingAQI] = useState(true);
  const [membersAqi, setMembersAqi] = useState({});

  // Load AQI Data for household
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoadingAQI(true);
      const data = await fetchAQIData({
        cityName: profile?.city || 'Kolkata',
        stateName: profile?.state || 'West Bengal',
        lat: profile?.latitude,
        lon: profile?.longitude
      });
      if (isMounted) {
        setAqiData(data);
        setLoadingAQI(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [profile?.city, profile?.state, profile?.latitude, profile?.longitude]);

  // Load member-specific AQI data for each member's own location
  useEffect(() => {
    let isMounted = true;
    async function loadMembersAqi() {
      const updates = {};
      await Promise.all(
        familyMembers.map(async (m) => {
          const mLat = m.latitude ?? profile?.latitude;
          const mLon = m.longitude ?? profile?.longitude;
          const mCity = m.city || profile?.city || 'Kolkata';
          const mState = m.state || profile?.state || '';
          try {
            const data = await fetchAQIData({
              lat: mLat,
              lon: mLon,
              cityName: mCity,
              stateName: mState
            });
            updates[m.id] = data;
          } catch {
            // Non-blocking fallback handled inside fetchAQIData
          }
        })
      );
      if (isMounted) {
        setMembersAqi((prev) => ({ ...prev, ...updates }));
      }
    }
    if (familyMembers.length > 0) {
      loadMembersAqi();
    }
    return () => {
      isMounted = false;
    };
  }, [familyMembers, profile?.city, profile?.state, profile?.latitude, profile?.longitude]);

  return {
    aqiData,
    loadingAQI,
    membersAqi
  };
}
