// tests/dashboard-location-sanity.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AQICard from '../src/components/AQICard.jsx';
import {
  fetchAQIData,
  getStoredCity,
  clearClientAqiCache
} from '../src/services/api.js';
import { formatGreetingName } from '../src/utils/nameFormatter.js';
import { getAQICategory } from '../shared/aqi.js';
import { calculateDistanceKm, resolveCityCoordinates } from '../shared/aqi/upstreamClient.js';
import { ensureVerifiedCoordinates } from '../src/context/ProfileContext.jsx';

describe('tests/dashboard-location-sanity.test.jsx - Location Accuracy, Sanity Guard, Badges & Names', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearClientAqiCache();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearClientAqiCache();
    localStorage.clear();
  });

  describe('1. Name Capitalization and Preservation', () => {
    it('capitalizes lowercase display name from Google / Auth provider (e.g. rishav -> Rishav)', () => {
      const user = { displayName: 'rishav nandi', email: 'rishav@example.com' };
      const profile = { fullName: '', preferredName: '' };
      expect(formatGreetingName(profile, user)).toBe('Rishav');
    });

    it('derives and capitalizes name from email when display name is missing', () => {
      const user = { email: 'rishav.nandi@domain.com' };
      const profile = {};
      expect(formatGreetingName(profile, user)).toBe('Rishav');
    });

    it('preserves user preferred name exactly as typed in Settings', () => {
      const user = { displayName: 'rishav' };
      const profile = { preferredName: 'rishav' };
      // User explicitly typed 'rishav' in settings, so keep it exact
      expect(formatGreetingName(profile, user)).toBe('rishav');

      const profile2 = { preferredName: 'Rishav Nandi' };
      expect(formatGreetingName(profile2, user)).toBe('Rishav Nandi');
    });

    it('falls back to Friend if no name is available', () => {
      expect(formatGreetingName(null, null)).toBe('Friend');
      expect(formatGreetingName({}, {})).toBe('Friend');
    });
  });

  describe('2. Single Source of Truth & CPCB Category Badges', () => {
    it('maps all 6 CPCB categories to the official colors and labels', () => {
      const good = getAQICategory(38);
      expect(good.name).toBe('Good');
      expect(good.color).toBe('#10b981');
      expect(good.badgeClass).toContain('bg-emerald-100');

      const satisfactory = getAQICategory(75);
      expect(satisfactory.name).toBe('Satisfactory');
      expect(satisfactory.color).toBe('#84cc16');
      expect(satisfactory.badgeClass).toContain('bg-lime-100');

      const moderate = getAQICategory(165);
      expect(moderate.name).toBe('Moderate');
      expect(moderate.color).toBe('#eab308');
      expect(moderate.badgeClass).toContain('bg-yellow-100');

      const poor = getAQICategory(278);
      expect(poor.name).toBe('Poor');
      expect(poor.color).toBe('#f97316');
      expect(poor.badgeClass).toContain('bg-orange-100');

      const veryPoor = getAQICategory(350);
      expect(veryPoor.name).toBe('Very Poor');
      expect(veryPoor.color).toBe('#ef4444');
      expect(veryPoor.badgeClass).toContain('bg-red-100');

      const severe = getAQICategory(450);
      expect(severe.name).toBe('Severe');
      expect(severe.color).toBe('#7f1d1d');
      expect(severe.badgeClass).toContain('bg-rose-950');
    });

    it('ensures NAQI 38 (Good) is NEVER styled as amber Moderate', () => {
      const cat = getAQICategory(38);
      expect(cat.name).toBe('Good');
      expect(cat.badgeClass).not.toContain('bg-amber');
      expect(cat.badgeClass).toContain('bg-emerald-100');
    });

    it('supports string category names', () => {
      expect(getAQICategory('Poor').color).toBe('#f97316');
      expect(getAQICategory('very_poor').name).toBe('Very Poor');
    });
  });

  describe('3. Distance & Sanity Guard', () => {
    it('correctly calculates distance between coordinates using Haversine formula', () => {
      // Noida (28.5355, 77.391) to Open-Meteo grid point (28.60, 77.40)
      const nearDist = calculateDistanceKm(28.5355, 77.391, 28.6, 77.4);
      expect(nearDist).toBeLessThan(15);

      // Noida (28.5355, 77.391) to Kolkata (22.5726, 88.3639)
      const farDist = calculateDistanceKm(28.5355, 77.391, 22.5726, 88.3639);
      expect(farDist).toBeGreaterThan(1200);
    });

    it('discards response and returns GRID_MISMATCH when grid point exceeds 60 km', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          city: 'Noida, Uttar Pradesh',
          aqi: 38,
          gridPoint: { lat: 22.6, lon: 88.36 }, // Kolkata grid point returned for Noida!
          pollutants: { pm25: 22.5, pm10: 24 }
        })
      });

      const res = await fetchAQIData({
        cityName: 'Noida',
        stateName: 'Uttar Pradesh',
        lat: 28.5355,
        lon: 77.391
      });

      expect(res.error).toBe('GRID_MISMATCH');
      expect(res.distanceKm).toBeGreaterThan(1200);
      expect(res.message).toContain('exceeding the 60 km accuracy boundary');
    });

    it('renders error UI card with Retry and Update my location link when sanity guard fails', () => {
      const errorData = {
        error: 'GRID_MISMATCH',
        message: 'Atmospheric model grid point is 1300 km from Noida, exceeding 60 km accuracy boundary.',
        distanceKm: 1300,
        city: 'Noida, Uttar Pradesh'
      };

      render(
        <BrowserRouter>
          <AQICard
            aqiData={errorData}
            onRefresh={vi.fn()}
            locationTitle="Noida, Uttar Pradesh"
          />
        </BrowserRouter>
      );

      expect(screen.getByText(/Unable to verify air data for Noida, Uttar Pradesh/i)).toBeInTheDocument();
      expect(screen.getByText(/Measured distance:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/1300 km/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /update my location/i });
      expect(link).toHaveAttribute('href', '/settings');
    });
  });

  describe('4. Profile Coordinates Resolution & Stale Cache Purge', () => {
    it('resolves coordinates for a Noida profile that lacks latitude and longitude', async () => {
      const profileWithoutCoords = {
        city: 'Noida',
        state: 'Uttar Pradesh',
        latitude: null,
        longitude: null
      };

      const verified = await ensureVerifiedCoordinates(profileWithoutCoords);
      expect(verified.latitude).toBeCloseTo(28.5355, 2);
      expect(verified.longitude).toBeCloseTo(77.391, 2);
      expect(verified.city).toBe('Noida');
    });

    it('purges stale Kolkata coordinates for a non-Kolkata profile', async () => {
      const profileWithStaleKolkataCoords = {
        city: 'Noida',
        state: 'Uttar Pradesh',
        latitude: 22.5726,
        longitude: 88.3639
      };

      const verified = await ensureVerifiedCoordinates(profileWithStaleKolkataCoords);
      expect(verified.latitude).toBeCloseTo(28.5355, 2);
      expect(verified.longitude).toBeCloseTo(77.391, 2);
    });

    it('purges stale localStorage entry if stored city has mismatched Kolkata coords for Noida', () => {
      localStorage.setItem(
        'foggy_selected_city',
        JSON.stringify({ name: 'Noida', lat: 22.5726, lon: 88.3639 })
      );

      const stored = getStoredCity();
      // Must not return the corrupted coordinates
      expect(stored.name).not.toBe('Noida');
      expect(localStorage.getItem('foggy_selected_city')).toBeNull();
    });

    it('backend resolveCityCoordinates overrides mismatched coordinates (>60km) with verified coordinates', () => {
      const resolved = resolveCityCoordinates('Noida, Uttar Pradesh', 22.5726, 88.3639);
      expect(resolved.lat).toBeCloseTo(28.5355, 2);
      expect(resolved.lon).toBeCloseTo(77.391, 2);
      expect(resolved.displayCity).toContain('Noida');
    });
  });

  describe('5. Shared Client Cache & Single Source of Truth', () => {
    it('caches response by rounded coordinates so duplicate calls hit the cache', async () => {
      const mockPayload = {
        city: 'Noida, Uttar Pradesh',
        aqi: 278,
        gridPoint: { lat: 28.6, lon: 77.4 },
        requestedCoords: { lat: 28.54, lon: 77.39 },
        dominantPollutant: 'PM2.5'
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockPayload
      });

      const first = await fetchAQIData({
        cityName: 'Noida',
        stateName: 'Uttar Pradesh',
        lat: 28.5355,
        lon: 77.391
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(first.aqi).toBe(278);

      // Second call for same location uses cache
      const second = await fetchAQIData({
        cityName: 'Noida',
        stateName: 'Uttar Pradesh',
        lat: 28.5355,
        lon: 77.391
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(second.aqi).toBe(278);
      expect(second.category).toBe('Poor');
    });

    it('renders visible data line with Place, Requested coords, Grid point, and Update time', () => {
      const validAqiData = {
        city: 'Noida, Uttar Pradesh',
        aqi: 278,
        category: 'Poor',
        requestedCoords: { lat: 28.54, lon: 77.39 },
        gridPoint: { lat: 28.6, lon: 77.4 },
        updatedAt: '02:30 PM',
        dominantPollutant: 'PM2.5',
        pollutants: { pm25: 130, pm10: 220 },
        weather: { temp: 26, humidity: 55, windSpeed: 4.1 }
      };

      render(
        <BrowserRouter>
          <AQICard
            aqiData={validAqiData}
            onRefresh={vi.fn()}
            locationTitle="Noida, Uttar Pradesh"
          />
        </BrowserRouter>
      );

      expect(screen.getByText(/Place:/i)).toBeInTheDocument();
      expect(screen.getByText(/Requested: 28.54°N, 77.39°E/i)).toBeInTheDocument();
      expect(screen.getByText(/Grid point: 28.60°N, 77.40°E/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Updated 02:30 PM/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
