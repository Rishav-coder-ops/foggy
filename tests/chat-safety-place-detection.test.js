// tests/chat-safety-place-detection.test.js
/**
 * @fileoverview Exhaustive unit tests for place detection, deterministic safety verdicts,
 * safety reply validation/repair, single data object integrity, and model label attribution.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  extractIntentAndCities,
  PLACE_DETECTION_STOPLIST
} from '../shared/chat/cityExtractor.js';
import {
  computeSafetyVerdict,
  detectInvolvedPersonas
} from '../shared/safety/safetyVerdict.js';
import {
  validateReplySafety,
  buildCorrectivePrompt,
  buildDeterministicSafetyReply
} from '../shared/safety/safetyValidator.js';
import {
  GEMINI_PRIMARY_MODEL,
  FOGGY_FALLBACK_MODEL,
  FOGGY_PROVIDER_LABELS
} from '../shared/constants.js';
import { onRequestPost } from '../functions/api/chat.js';

describe('1. Place Detection - Strict Location Intent vs General Conversation', () => {
  // Exhaustive list of >= 60 distinct messages without places (must resolve to NO place, usedDefault: true)
  const nonPlaceMessages = [
    'is it safe for my kid to play outside',
    'can I go for a run',
    'is it safe for my father with COPD to walk this evening',
    'should I wear an N95 mask today',
    'what are some cheap ways to clean indoor air',
    'how does an air purifier work',
    'can my dog play in the garden',
    'is it safe to open windows',
    'my throat hurts from the smoke',
    'should pregnant women stay indoors',
    'what is PM2.5',
    'how do I clean my AC filter',
    'is damp mopping better than sweeping',
    'can I exercise in the living room',
    'I have mild asthma, what should I do',
    'what is NAQI',
    'is morning jog safe',
    'can children go to school today',
    'what time is the air cleanest',
    'why is smog worse in winter',
    'is cloth mask enough',
    'what is the price of an N95 mask',
    'can I walk my baby in a stroller',
    'my eyes are burning',
    'how to seal windows with tape',
    'is cooking on gas bad for air quality',
    'what is diurnal inversion',
    'can I ride my bicycle today',
    'should elderly parents walk in the evening',
    'what should I do during severe smog',
    'is it okay to do yoga on the balcony',
    'how much does a HEPA purifier cost',
    'can I use exhaust fan to clear smoke',
    'what to do if inhaler is empty',
    'is metro safer than auto for commute',
    'how many times can I reuse an N95',
    'what is brown paper bag method',
    'is it safe to play cricket outside',
    'should schools declare a holiday',
    'how does humidity affect pollution',
    'is indoor air really worse than outside',
    'can plants clean indoor air',
    'should I buy an air quality monitor',
    'is it safe for heart patients to walk',
    'what precautions for toddlers',
    'how to protect newborn from pollution',
    'is it safe to jog at 6 AM',
    'why is afternoon air cleaner',
    'what foods help combat pollution',
    'can I take my senior mother to park',
    'should I keep bedroom doors closed',
    'how to make Corsi Rosenthal box',
    'what MERV rating filter is needed',
    'is steam inhalation helpful',
    'what number is emergency ambulance',
    'aaj hawa kaisi hai',
    'kya bachhe bahar khel sakte hain',
    'saans lene me takleef ho rahi hai',
    'mask kaun sa pehanna chahiye',
    'ghar ki khidki kab kholein',
    'mera gala kharab hai',
    'kya subah ki walk safe hai',
    'dadi ko walk pe bhejein ya nahi',
    'will it be foggy today',
    'I hope the air improves soon',
    'bar on outdoor sports today'
  ];

  it('contains at least 60 distinct test queries without places', () => {
    expect(nonPlaceMessages.length).toBeGreaterThanOrEqual(60);
  });

  for (const query of nonPlaceMessages) {
    it(`resolves to selected city with usedDefault: true for "${query}"`, async () => {
      const res = await extractIntentAndCities(query, [], 'Noida');
      expect(res.usedDefault).toBe(true);
      expect(res.cities).toEqual(['Noida']);
      expect(res.unrecognizedCity).toBeNull();
    });
  }

  // Exhaustive list of >= 30 distinct messages with clear location intent
  const placeMessages = [
    { text: 'Bhubaneswar', expectedCity: 'Bhubaneswar' },
    { text: 'Delhi', expectedCity: 'Delhi' },
    { text: 'Noida', expectedCity: 'Noida' },
    { text: 'Pune', expectedCity: 'Pune' },
    { text: 'Mumbai', expectedCity: 'Mumbai' },
    { text: 'Kolkata', expectedCity: 'Kolkata' },
    { text: 'Chennai', expectedCity: 'Chennai' },
    { text: 'Bengaluru', expectedCity: 'Bengaluru' },
    { text: 'Hyderabad', expectedCity: 'Hyderabad' },
    { text: 'Ahmedabad', expectedCity: 'Ahmedabad' },
    { text: 'Jaipur', expectedCity: 'Jaipur' },
    { text: 'Lucknow', expectedCity: 'Lucknow' },
    { text: 'Chandigarh', expectedCity: 'Chandigarh' },
    { text: 'Patna', expectedCity: 'Patna' },
    { text: 'Bhopal', expectedCity: 'Bhopal' },
    { text: 'Cuttack', expectedCity: 'Cuttack' },
    { text: 'Puri', expectedCity: 'Puri' },
    { text: 'Rourkela', expectedCity: 'Rourkela' },
    { text: 'Gurugram', expectedCity: 'Gurugram' },
    { text: 'Faridabad', expectedCity: 'Faridabad' },
    { text: 'Thiruvananthapuram', expectedCity: 'Thiruvananthapuram' },
    { text: 'Guwahati', expectedCity: 'Guwahati' },
    { text: 'Shimla', expectedCity: 'Shimla' },
    { text: 'Srinagar', expectedCity: 'Srinagar' },
    { text: 'Amritsar', expectedCity: 'Amritsar' },
    { text: 'Varanasi', expectedCity: 'Varanasi' },
    { text: 'Kanpur', expectedCity: 'Kanpur' },
    { text: 'Agra', expectedCity: 'Agra' },
    { text: 'Surat', expectedCity: 'Surat' },
    { text: 'Indore', expectedCity: 'Indore' },
    { text: 'AQI in Pune', expectedCity: 'Pune' },
    { text: 'how is the weather in Delhi', expectedCity: 'Delhi' },
    { text: 'air quality at Noida', expectedCity: 'Noida' },
    { text: 'traveling to Bengaluru', expectedCity: 'Bengaluru' },
    { text: 'commute to Mumbai', expectedCity: 'Mumbai' },
    { text: 'aqi of Chennai', expectedCity: 'Chennai' },
    { text: 'air quality in Bhubaneswar', expectedCity: 'Bhubaneswar' },
    { text: 'weather in Hyderabad', expectedCity: 'Hyderabad' },
    { text: 'Bhubaneswar aqi', expectedCity: 'Bhubaneswar' },
    { text: 'Delhi weather', expectedCity: 'Delhi' },
    { text: 'Pune ka aqi', expectedCity: 'Pune' },
    { text: 'Noida mein hawa', expectedCity: 'Noida' }
  ];

  it('contains at least 30 distinct place queries', () => {
    expect(placeMessages.length).toBeGreaterThanOrEqual(30);
  });

  for (const item of placeMessages) {
    it(`correctly detects "${item.expectedCity}" from "${item.text}"`, async () => {
      const res = await extractIntentAndCities(item.text, [], 'Noida');
      expect(res.cities).toContain(item.expectedCity);
    });
  }

  it('guarantees common action words like play, run, plan are in STOPLIST', () => {
    expect(PLACE_DETECTION_STOPLIST.has('play')).toBe(true);
    expect(PLACE_DETECTION_STOPLIST.has('run')).toBe(true);
    expect(PLACE_DETECTION_STOPLIST.has('plan')).toBe(true);
    expect(PLACE_DETECTION_STOPLIST.has('safe')).toBe(true);
    expect(PLACE_DETECTION_STOPLIST.has('today')).toBe(true);
    expect(PLACE_DETECTION_STOPLIST.has('hope')).toBe(true);
    expect(PLACE_DETECTION_STOPLIST.has('bar')).toBe(true);
    expect(PLACE_DETECTION_STOPLIST.has('will')).toBe(true);
  });
});

describe('2. Deterministic Safety Verdict Engine', () => {
  it('detects involved personas accurately from query and profile', () => {
    const personas = detectInvolvedPersonas(
      'is it safe for my kid to play outside',
      { age: 35 },
      [{ name: 'Aarav', role: 'Child', age: 7, condition: 'None' }]
    );
    expect(personas).toContain('child');

    const copdSenior = detectInvolvedPersonas(
      'can my father with copd walk this evening',
      {},
      [{ name: 'Dad', role: 'Father', age: 68, condition: 'COPD' }]
    );
    expect(copdSenior).toContain('senior');
    expect(copdSenior).toContain('copd');

    const athlete = detectInvolvedPersonas('can I go for a 10km marathon run');
    expect(athlete).toContain('athlete');
  });

  it('verifies verdict table across every AQI category', () => {
    // 1. Good (0-50)
    const goodVerdict = computeSafetyVerdict({
      aqi: 35,
      query: 'is it safe for my kid to play outside'
    });
    expect(goodVerdict.isOutdoorSafe).toBe(true);
    expect(goodVerdict.verdictLabel).toBe('SAFE');
    expect(goodVerdict.directAnswerPhrase).toMatch(/^Yes/i);

    // 2. Satisfactory (51-100)
    const satVerdict = computeSafetyVerdict({
      aqi: 80,
      query: 'is it safe for my kid to play outside'
    });
    expect(satVerdict.isOutdoorSafe).toBe(true);
    expect(satVerdict.verdictLabel).toBe('SAFE');
    expect(satVerdict.directAnswerPhrase).toMatch(/^Yes/i);

    // 3. Moderate (101-200) - for child/sensitive: Caution/Limit
    const modVerdictChild = computeSafetyVerdict({
      aqi: 165,
      query: 'is it safe for my kid to play outside'
    });
    expect(modVerdictChild.isOutdoorSafe).toBe(false);
    expect(modVerdictChild.verdictLabel).toBe('CAUTION_LIMIT');
    expect(modVerdictChild.directAnswerPhrase).toMatch(/Caution|limit/i);

    // 4. Poor (201-300) - Unsafe
    const poorVerdict = computeSafetyVerdict({
      aqi: 260,
      query: 'is it safe for my kid to play outside'
    });
    expect(poorVerdict.isOutdoorSafe).toBe(false);
    expect(poorVerdict.verdictLabel).toBe('UNSAFE_AVOID');
    expect(poorVerdict.directAnswerPhrase).toMatch(/^No/i);

    // 5. Very Poor (301-400) - Strictly Unsafe
    const veryPoorVerdict = computeSafetyVerdict({
      aqi: 324,
      query: 'is it safe for my kid to play outside'
    });
    expect(veryPoorVerdict.isOutdoorSafe).toBe(false);
    expect(veryPoorVerdict.verdictLabel).toBe('STRICTLY_UNSAFE');
    expect(veryPoorVerdict.directAnswerPhrase).toMatch(/strictly unsafe|not safe/i);

    // 6. Severe (401-500+) - Hazardous Prohibited
    const severeVerdict = computeSafetyVerdict({
      aqi: 450,
      query: 'is it safe for my kid to play outside'
    });
    expect(severeVerdict.isOutdoorSafe).toBe(false);
    expect(severeVerdict.verdictLabel).toBe('HAZARDOUS_PROHIBITED');
    expect(severeVerdict.directAnswerPhrase).toMatch(/No, stay strictly indoors/i);
  });
});

describe('3. Safety Validator and Repair Pipeline', () => {
  const veryPoorVerdict = computeSafetyVerdict({
    aqi: 324,
    category: 'Very Poor',
    query: 'is it safe for my kid to play outside'
  });

  it('rejects forbidden positive claims when AQI is Very Poor', () => {
    const unsafeReply =
      'Yes, it is entirely safe for your kid to play outside today. With the air quality currently at a clean NAQI of 324 (Very Poor)... let your child enjoy unrestricted outdoor play at any time of the day.';

    const validation = validateReplySafety(unsafeReply, veryPoorVerdict, 324, 'Very Poor');
    expect(validation.isValid).toBe(false);
    expect(validation.shouldRegenerate).toBe(true);
    expect(validation.issues.length).toBeGreaterThan(0);
  });

  it('detects self-contradictions such as "clean NAQI of 324"', () => {
    const contradictoryReply =
      'The air is currently at a clean NAQI of 324 (Very Poor). You can let your child go outside.';
    const validation = validateReplySafety(contradictoryReply, veryPoorVerdict, 324, 'Very Poor');
    expect(validation.isValid).toBe(false);
    expect(validation.issues.some((i) => i.includes('Self-contradiction') || i.includes('safe'))).toBe(true);
  });

  it('forbids prescribing medication dosage alterations', () => {
    const medReply =
      'No, air quality is poor. You should double your dosage of steroids and increase your medication to 500mg.';
    const validation = validateReplySafety(medReply, veryPoorVerdict, 324, 'Very Poor');
    expect(validation.isValid).toBe(false);
    expect(validation.issues.some((i) => i.includes('medication'))).toBe(true);
  });

  it('builds a corrective prompt for regeneration', () => {
    const prompt = buildCorrectivePrompt(
      ['Claims outdoor activity is safe despite Very Poor air'],
      veryPoorVerdict
    );
    expect(prompt).toContain('CRITICAL SAFETY OVERRIDE');
    expect(prompt).toContain('NAQI 324 (Very Poor)');
    expect(prompt).toContain('No, it is strictly unsafe for your child to play outside today.');
  });

  it('builds an authoritative deterministic safety fallback reply', () => {
    const fallback = buildDeterministicSafetyReply(veryPoorVerdict, 'Noida', 'is it safe for my kid to play outside');
    expect(fallback).toMatch(/strictly unsafe|not safe/i);
    expect(fallback).toContain('Noida');
    expect(fallback).toContain('324 (Very Poor)');
    expect(fallback).toContain('N95 or FFP2 respirator');
    expect(fallback).toContain('112 or 108');
  });
});

describe('4. Full End-to-End Chat API Pipeline - Noida NAQI 324 + Child + COPD Regression', () => {
  it('rejects unsafe AI text, enforces single data object, and returns safe verdict with accurate model label', async () => {
    // Mock fetch for Gemini API call that initially returns the unsafe text
    const unsafeAiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'Yes, it is entirely safe for your kid to play outside today. With the air quality currently at a clean NAQI of 324 (Very Poor)... let your child enjoy unrestricted outdoor play at any time of the day.'
              }
            ]
          },
          finishReason: 'STOP'
        }
      ]
    };

    // Subsequent retry also returns unsafe text, forcing deterministic safety fallback
    const globalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        return {
          ok: true,
          status: 200,
          json: async () => unsafeAiResponse
        };
      }
      return globalFetch(url);
    });

    try {
      const payload = {
        message: 'is it safe for my kid to play outside',
        selectedCity: { name: 'Noida', lat: 28.5355, lon: 77.391 },
        aqiData: {
          city: 'Noida',
          aqi: 324,
          category: 'Very Poor',
          dominantPollutant: 'PM2.5',
          isMock: false
        },
        profile: {
          city: 'Noida',
          familyMembers: [
            { name: 'Beta', role: 'Child', age: 6, condition: 'None' },
            { name: 'Dadi', role: 'Senior', age: 68, condition: 'COPD' }
          ]
        }
      };

      const req = new Request('https://foggy.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_token'
        },
        body: JSON.stringify(payload)
      });

      const res = await onRequestPost({
        request: req,
        env: { GEMINI_API_KEY: 'test-real-key-simulation-string-12345' }
      });

      expect(res.status).toBe(200);
      const json = await res.json();

      // 1. Unsafe text MUST be rejected and replaced
      expect(json.reply).not.toContain('entirely safe');
      expect(json.reply).not.toContain('clean NAQI of 324');
      expect(json.reply).not.toContain('unrestricted outdoor play');
      expect(json.reply).toMatch(/strictly unsafe|not safe|avoided/i);

      // 2. Single data object: City is Noida, AQI is 324, Category is Very Poor
      expect(json.city).toBe('Noida');
      expect(json.cityData.name).toBe('Noida');
      expect(json.cityData.aqi).toBe(324);
      expect(json.cityData.category).toBe('Very Poor');
      expect(json.isDifferentFromSelected).toBe(false);

      // 3. Fallback attribution when unsafe AI fails twice
      expect(json.provider).toBe(FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE);
      expect(json.model).toBe(FOGGY_FALLBACK_MODEL);
    } finally {
      global.fetch = globalFetch;
    }
  });

  it('honors model label when safe live Gemini response succeeds', async () => {
    const safeAiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'No, it is strictly unsafe for your child to play outside today in Noida. With estimated NAQI at 324 (Very Poor), outdoor particulate exposure is dangerous. Keep your child indoors with air filtration running.'
              }
            ]
          },
          finishReason: 'STOP'
        }
      ]
    };

    const globalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        return {
          ok: true,
          status: 200,
          json: async () => safeAiResponse
        };
      }
      return globalFetch(url);
    });

    try {
      const payload = {
        message: 'is it safe for my kid to play outside',
        selectedCity: { name: 'Noida', lat: 28.5355, lon: 77.391 },
        aqiData: {
          city: 'Noida',
          aqi: 324,
          category: 'Very Poor',
          dominantPollutant: 'PM2.5',
          isMock: false
        }
      };

      const req = new Request('https://foggy.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo_token'
        },
        body: JSON.stringify(payload)
      });

      const res = await onRequestPost({
        request: req,
        env: { GEMINI_API_KEY: 'test-real-key-simulation-string-12345' }
      });

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.reply).toMatch(/strictly unsafe|not safe/i);
      expect(json.provider).toBe(FOGGY_PROVIDER_LABELS.LIVE_GEMINI);
      expect(json.model).toBe(GEMINI_PRIMARY_MODEL);
      expect(json.city).toBe('Noida');
      expect(json.cityData.aqi).toBe(324);
      expect(json.cityData.category).toBe('Very Poor');
    } finally {
      global.fetch = globalFetch;
    }
  });
});
