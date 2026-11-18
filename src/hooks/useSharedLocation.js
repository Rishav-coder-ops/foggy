// src/hooks/useSharedLocation.js
// Shared location logic across landing page panels and dashboard
// Default everywhere is Kolkata (22.5726, 88.3639)
import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '../context/ProfileContext';
import { PRESET_CITY_COORDINATES, DEFAULT_CITY } from '../services/api';

export function useSharedLocation() {
  const { profile, updateProfile } = useProfile();

  const getInitialLocation = () => {
    // 1. Signed-in user's profile location
    if (profile?.location && typeof profile.location === 'string' && profile.location.trim()) {
      const matchKey = profile.location.toLowerCase().trim();
      if (PRESET_CITY_COORDINATES[matchKey]) {
        return {
          name: profile.location,
          country: PRESET_CITY_COORDINATES[matchKey].country,
          admin1: PRESET_CITY_COORDINATES[matchKey].admin1,
          lat: PRESET_CITY_COORDINATES[matchKey].lat,
          lon: PRESET_CITY_COORDINATES[matchKey].lon
        };
      }
      return {
        name: profile.location,
        country: 'India',
        lat: 22.5726,
        lon: 88.3639
      };
    }

    // 2. Last city chosen on the dashboard or panel (saved locally)
    try {
      const saved = localStorage.getItem('foggy_selected_city') || localStorage.getItem('foggy_dashboard_city');
      if (saved) {
        const parsed = saved.startsWith('{') ? JSON.parse(saved) : null;
        if (parsed && parsed.name && parsed.lat && parsed.lon) {
          // If legacy Salt Lake City was stored, discard and use Kolkata
          if (parsed.name.includes('Salt Lake') || parsed.name.includes('US')) {
            return DEFAULT_CITY;
          }
          return parsed;
        }
        const cityName = parsed?.name || saved;
        if (cityName.includes('Salt Lake')) return DEFAULT_CITY;
        const matchKey = cityName.toLowerCase().trim();
        if (PRESET_CITY_COORDINATES[matchKey]) {
          return {
            name: cityName,
            country: PRESET_CITY_COORDINATES[matchKey].country,
            admin1: PRESET_CITY_COORDINATES[matchKey].admin1,
            lat: PRESET_CITY_COORDINATES[matchKey].lat,
            lon: PRESET_CITY_COORDINATES[matchKey].lon
          };
        }
        return { name: cityName, country: 'India', lat: 22.5726, lon: 88.3639 };
      }
    } catch {}

    // 3. Default to Kolkata
    return DEFAULT_CITY;
  };

  const [location, setLocation] = useState(getInitialLocation);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Sync if profile location changes
  useEffect(() => {
    if (profile?.location && profile.location !== location.name) {
      const matchKey = profile.location.toLowerCase().trim();
      const coords = PRESET_CITY_COORDINATES[matchKey] || { lat: 22.5726, lon: 88.3639, country: 'India' };
      setLocation({
        name: profile.location,
        country: coords.country || 'India',
        admin1: coords.admin1 || '',
        lat: coords.lat,
        lon: coords.lon
      });
    }
  }, [profile?.location]);

  // Listen to cross-component city changes
  useEffect(() => {
    const handleCityEvent = (e) => {
      if (e.detail) {
        const d = e.detail;
        if (typeof d === 'string') {
          const matchKey = d.toLowerCase().trim();
          const coords = PRESET_CITY_COORDINATES[matchKey] || { lat: 22.5726, lon: 88.3639, country: 'India' };
          setLocation({ name: d, country: coords.country, admin1: coords.admin1, lat: coords.lat, lon: coords.lon });
        } else if (d.name) {
          setLocation({
            name: d.name,
            country: d.country || 'India',
            admin1: d.admin1 || '',
            lat: d.latitude || d.lat || 22.5726,
            lon: d.longitude || d.lon || 88.3639
          });
        }
      }
    };

    window.addEventListener('foggy:city-change', handleCityEvent);
    return () => window.removeEventListener('foggy:city-change', handleCityEvent);
  }, []);

  const changeCity = useCallback((cityItem) => {
    let newLoc;
    if (typeof cityItem === 'string') {
      const matchKey = cityItem.toLowerCase().trim();
      const coords = PRESET_CITY_COORDINATES[matchKey] || { lat: 22.5726, lon: 88.3639, country: 'India' };
      newLoc = {
        name: cityItem,
        country: coords.country || 'India',
        admin1: coords.admin1 || '',
        lat: coords.lat,
        lon: coords.lon
      };
    } else {
      newLoc = {
        name: cityItem.name,
        country: cityItem.country || 'India',
        admin1: cityItem.admin1 || '',
        lat: cityItem.latitude || cityItem.lat || 22.5726,
        lon: cityItem.longitude || cityItem.lon || 88.3639
      };
    }

    setLocation(newLoc);
    try {
      localStorage.setItem('foggy_dashboard_city', newLoc.name);
      localStorage.setItem('foggy_selected_city', JSON.stringify(newLoc));
    } catch {}

    updateProfile({ location: newLoc.name });
    window.dispatchEvent(new CustomEvent('foggy:city-change', { detail: newLoc }));
  }, [updateProfile]);

  // Request browser geolocation (only after user clicks "Use my location")
  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const { latitude, longitude } = pos.coords;
        const newLoc = {
          name: 'My Location',
          country: 'India',
          lat: Math.round(latitude * 10000) / 10000,
          lon: Math.round(longitude * 10000) / 10000,
          isUserCoords: true
        };
        setLocation(newLoc);
        try {
          localStorage.setItem('foggy_dashboard_city', 'My Location');
          localStorage.setItem('foggy_selected_city', JSON.stringify(newLoc));
        } catch {}
        updateProfile({ location: 'My Location' });
        window.dispatchEvent(new CustomEvent('foggy:city-change', { detail: newLoc }));
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) {
          setGeoError('Location permission was denied. You can search for your city above.');
        } else if (err.code === 2) {
          setGeoError('Location unavailable. Please search for your city.');
        } else {
          setGeoError('Location request timed out. Please try searching for your city.');
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, [updateProfile]);

  return {
    location,
    changeCity,
    requestGeolocation,
    geoLoading,
    geoError,
    setGeoError
  };
}
