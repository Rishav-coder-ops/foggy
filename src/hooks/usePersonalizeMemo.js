// src/hooks/usePersonalizeMemo.js
import { useState } from 'react';
import { sanitizeText } from '../utils/validation';
import { auth } from '../firebase';

function buildPersonalizePrompt({
  sanitizedName,
  sanitizedRel,
  ageStr,
  cityLoc,
  aqiNum,
  aqiCat,
  condsStr,
  member,
  commuteStr,
  lifeStr
}) {
  return `Please create a friendly, structured personalized air quality care memo for ${sanitizedName} (${sanitizedRel}, ${ageStr}).
Location: ${cityLoc}.
Current CPCB National AQI: ${aqiNum} (${aqiCat}).
Respiratory Conditions: ${condsStr}.
Sensitivity: ${member.sensitivity || 'Moderate'}.
Daily Commute: ${commuteStr}.
Outdoor Activities / Habits: ${lifeStr}.${member.notes ? `\nSpecial notes: ${sanitizeText(member.notes, 300)}.` : ''}

Please include:
1. Optimal outdoor timing window based on diurnal inversion.
2. Certified mask guidance (N95/FFP2).
3. Commute adjustment advice.
4. If asthmatic, remind to keep doctor-prescribed salbutamol rescue inhaler (such as Asthalin) at hand.
5. Hydration and indoor air filtration steps.
6. Clear not-a-doctor medical disclaimer and 112 emergency notice. Keep it warm and actionable.`;
}

function parsePersonalizeError(err) {
  const msg = err.message || '';
  if (
    msg.includes('busy') ||
    msg.includes('minute') ||
    msg.includes('limit') ||
    msg.includes('429')
  ) {
    return 'Foggy is busy, try again in a minute.';
  }
  if (
    msg.includes('Sign-in') ||
    msg.includes('sign in') ||
    msg.includes('auth') ||
    msg.includes('401') ||
    msg.includes('403')
  ) {
    return 'Sign-in problem: please sign in or refresh your session.';
  }
  if (
    msg.includes('Server') ||
    msg.includes('server') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503')
  ) {
    return 'Server problem: Foggy is temporarily unavailable. Please try again.';
  }
  if (
    err.name === 'TypeError' ||
    msg.includes('fetch') ||
    msg.includes('Network') ||
    msg.includes('network') ||
    msg.includes('offline') ||
    msg.includes('connection')
  ) {
    return 'Network problem: Please check your internet connection.';
  }
  return msg || 'Unable to connect with Foggy right now.';
}

export function usePersonalizeMemo() {
  const [personalizingMember, setPersonalizingMember] = useState(null);
  const [aiMemo, setAiMemo] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const handlePersonalizeWithFoggy = async (member, memberAqiData, profile, user) => {
    if (!member) return;
    setPersonalizingMember(member);
    setAiMemo(null);
    setAiError('');
    setLoadingAi(true);

    try {
      const sanitizedName = sanitizeText(member.name, 50) || 'Family Member';
      const sanitizedRel = sanitizeText(member.relationship, 40) || 'Dependent';
      const ageStr = member.age ? `${member.age} years old` : 'age unspecified';
      const condsStr = Array.isArray(member.conditions)
        ? member.conditions.join(', ')
        : member.condition || 'None';
      const commuteStr = Array.isArray(member.commute)
        ? member.commute.join(', ')
        : 'Not specified';
      const lifeStr = Array.isArray(member.lifestyle)
        ? member.lifestyle.join(', ')
        : 'Not specified';
      const aqiNum = memberAqiData?.aqi || 165;
      const aqiCat = memberAqiData?.category || 'Moderate';
      const cityLoc = member.city
        ? `${member.city}, ${member.state || 'India'}`
        : profile?.city || 'Kolkata';

      const prompt = buildPersonalizePrompt({
        sanitizedName,
        sanitizedRel,
        ageStr,
        cityLoc,
        aqiNum,
        aqiCat,
        condsStr,
        member,
        commuteStr,
        lifeStr
      });

      let idToken = null;
      try {
        if (user && typeof user.getIdToken === 'function') {
          idToken = await user.getIdToken();
        } else if (auth?.currentUser && typeof auth.currentUser.getIdToken === 'function') {
          idToken = await auth.currentUser.getIdToken();
        }
      } catch (tokenErr) {
        console.warn('Could not retrieve Firebase ID token:', tokenErr);
      }

      const headers = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const requestPayload = {
        message: prompt,
        prompt,
        member: {
          name: sanitizedName,
          relationship: sanitizedRel,
          age: member.age,
          city: member.city || profile?.city || 'Kolkata',
          state: member.state || profile?.state || 'India',
          conditions: member.conditions || member.condition || 'None',
          sensitivity: member.sensitivity || 'Moderate',
          commute: member.commute || 'Not specified',
          lifestyle: member.lifestyle || 'Not specified',
          notes: member.notes || ''
        },
        aqiData: { aqi: aqiNum, category: aqiCat, city: member.city || profile?.city || 'Kolkata' },
        city: member.city || profile?.city || 'Kolkata',
        history: []
      };

      let res = await fetch('/api/personalize', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload)
      });

      if (res.status === 404) {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestPayload)
        });
      }

      if (!res.ok) {
        let errJson = {};
        try {
          errJson = await res.json();
        } catch {}
        if (res.status === 429 || errJson.isRateLimited || errJson.code === 'RATE_LIMITED') {
          throw new Error('Foggy is busy, try again in a minute.');
        } else if (res.status === 401 || res.status === 403) {
          throw new Error('Sign-in required: please sign in to personalize advice with Foggy.');
        } else if (res.status >= 500) {
          throw new Error('Server problem: Foggy experienced a temporary issue. Please try again.');
        } else {
          throw new Error(errJson.message || `API error (${res.status})`);
        }
      }

      const json = await res.json();
      setAiMemo(
        json.memo || json.reply || json.message || 'Foggy personalized precautions generated.'
      );
    } catch (err) {
      console.error('Personalization failed with error:', err);
      setAiError(parsePersonalizeError(err));
    } finally {
      setLoadingAi(false);
    }
  };

  return {
    personalizingMember,
    setPersonalizingMember,
    aiMemo,
    loadingAi,
    aiError,
    handlePersonalizeWithFoggy
  };
}
