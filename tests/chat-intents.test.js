// tests/chat-intents.test.js
import { describe, it, expect } from 'vitest';
import {
  INTENT_TYPES,
  classifyIntent,
  buildCompactContext,
  getIntentInstruction,
  buildSystemPrompt,
  buildUserMessageWithContext,
  generateIntentFallback
} from '../functions/api/chatIntent.js';

describe('Foggy Chat Intent Classification (20+ Sample Questions)', () => {
  const sampleTestCases = [
    { query: 'How do I clean my home air on a budget?', expected: INTENT_TYPES.BUDGET_OPTIONS },
    {
      query: 'What are some cheap ways to purify indoor air under Rs 1000?',
      expected: INTENT_TYPES.BUDGET_OPTIONS
    },
    { query: 'Can kids play outside today?', expected: INTENT_TYPES.KIDS_OR_SENIORS_SAFETY },
    { query: 'Tips for my child with asthma', expected: INTENT_TYPES.KIDS_OR_SENIORS_SAFETY },
    {
      query: 'Is it safe for Dadi to go outside for her walk?',
      expected: INTENT_TYPES.KIDS_OR_SENIORS_SAFETY
    },
    { query: 'What mask should I wear?', expected: INTENT_TYPES.MASK_ADVICE },
    { query: 'What mask should I wear today?', expected: INTENT_TYPES.MASK_ADVICE },
    {
      query: 'Should I buy an N95 respirator or a cloth mask?',
      expected: INTENT_TYPES.MASK_ADVICE
    },
    { query: 'Plan my low-pollution day', expected: INTENT_TYPES.PLAN_MY_DAY },
    {
      query: 'Help me plan my day schedule around the smog curve',
      expected: INTENT_TYPES.PLAN_MY_DAY
    },
    { query: 'Is it safe to run tomorrow morning?', expected: INTENT_TYPES.ACTIVITY_SAFETY },
    { query: 'Can I go jogging in the park this evening?', expected: INTENT_TYPES.ACTIVITY_SAFETY },
    { query: 'Is it safe to play cricket outdoors today?', expected: INTENT_TYPES.ACTIVITY_SAFETY },
    { query: 'Delhi aqi', expected: INTENT_TYPES.AQI_STATUS },
    {
      query: 'What is the air quality reading in Mumbai right now?',
      expected: INTENT_TYPES.AQI_STATUS
    },
    { query: 'what about tomorrow?', expected: INTENT_TYPES.FORECAST },
    { query: 'Will smog increase tonight or tomorrow?', expected: INTENT_TYPES.FORECAST },
    { query: 'How to build a Corsi-Rosenthal filter?', expected: INTENT_TYPES.INDOOR_AIR_TIPS },
    {
      query: 'Should I damp-mop or dry sweep my room during winter smog?',
      expected: INTENT_TYPES.INDOOR_AIR_TIPS
    },
    {
      query: 'Is taking the AC metro safer than riding my scooter to work?',
      expected: INTENT_TYPES.COMMUTE_OPTIONS
    },
    {
      query: 'My throat is burning and I cannot stop coughing',
      expected: INTENT_TYPES.HEALTH_SYMPTOM_CONCERN
    },
    {
      query: 'Is Delhi cleaner than Mumbai today?',
      expected: INTENT_TYPES.COMPARISON_BETWEEN_CITIES
    },
    { query: 'Who are you and how do you work?', expected: INTENT_TYPES.ABOUT_FOGGY },
    { query: 'Namaste Foggy', expected: INTENT_TYPES.SMALL_TALK },
    { query: 'Write a python script to solve two sum problem', expected: INTENT_TYPES.OFF_TOPIC },
    { query: 'Aaj subah bahar daudna safe hai kya?', expected: INTENT_TYPES.ACTIVITY_SAFETY },
    {
      query: 'Gale mein kharash aur khansi ho rahi hai',
      expected: INTENT_TYPES.HEALTH_SYMPTOM_CONCERN
    },
    { query: 'Ghar ki hawa kaise saaf karein saste mein?', expected: INTENT_TYPES.BUDGET_OPTIONS },
    { query: 'Kal ka aqi kaisa rahega?', expected: INTENT_TYPES.FORECAST },
    { query: 'Baccho ko park bhejna theek hai kya?', expected: INTENT_TYPES.KIDS_OR_SENIORS_SAFETY }
  ];

  sampleTestCases.forEach(({ query, expected }, idx) => {
    it(`Case ${idx + 1}: correctly classifies "${query}" -> ${expected}`, () => {
      const intent = classifyIntent(query);
      expect(intent).toBe(expected);
    });
  });

  it('correctly handles multi-turn follow-up queries using history', () => {
    const history = [
      { role: 'user', parts: [{ text: 'What is the AQI in Delhi?' }] },
      {
        role: 'model',
        parts: [{ text: 'In Delhi, the current estimated CPCB NAQI is 280 (Poor).' }]
      }
    ];
    const followUpIntent = classifyIntent('what about tomorrow?', history);
    expect(followUpIntent).toBe(INTENT_TYPES.FORECAST);
  });
});

describe('Prompt Construction & Compact Context Serialization', () => {
  const mockReport = {
    city: 'Kolkata',
    admin1: 'West Bengal',
    current: {
      aqi: 45,
      category: 'Good',
      dominant: 'PM2.5',
      time: '14:00 IST, 20 Nov',
      pm25: 12,
      pm10: 28
    },
    bestHour24h: { hour: '14:00', aqi: 45, category: 'Good' },
    worstHour24h: { hour: '04:00', aqi: 95, category: 'Satisfactory' },
    tomorrow: {
      averageAqi: 55,
      category: 'Satisfactory',
      cleanestSlot: { hour: '14:00', aqi: 48 },
      peakSlot: { hour: '06:00', aqi: 110 }
    }
  };

  const mockProfile = {
    commute: 'Metro',
    cookingType: 'LPG',
    familyMembers: [
      {
        name: 'Beta',
        relationship: 'Child (Son)',
        age: 7,
        condition: 'Asthma (uses salbutamol inhaler)'
      },
      { name: 'Dadi', relationship: 'Senior', age: 74, condition: 'Hypertension' },
      { name: 'Rusty', relationship: 'Pet (Dog)', age: 4, condition: 'None' }
    ]
  };

  it('builds system prompt focused on persona, rules, and tone only', () => {
    const prompt = buildSystemPrompt({ isHindi: false, isHinglish: false });
    expect(prompt).toContain("Answer the user's question first and directly");
    expect(prompt).toContain('Never open with a greeting after the first message');
    expect(prompt).toContain('Never repeat the AQI report unless the user asks for the AQI');
    expect(prompt).not.toContain('PROVIDED LIVE AIR QUALITY DATA');
  });

  it('builds compact JSON context filtering only relevant family members', () => {
    const context = buildCompactContext(
      mockReport,
      mockProfile,
      INTENT_TYPES.KIDS_OR_SENIORS_SAFETY
    );
    expect(context.city).toBe('Kolkata');
    expect(context.estimatedNAQI).toBe(45);
    expect(context.category).toBe('Good');
    expect(context.dominantPollutant).toBe('PM2.5');
    expect(context.bestUpcomingHour).toBeDefined();
    expect(context.worstUpcomingHour).toBeDefined();
    expect(context.relevantFamilyMembers).toBeDefined();

    // Kids and seniors safety should include Beta and Dadi, but not Rusty
    const names = context.relevantFamilyMembers.map((m) => m.name);
    expect(names).toContain('Beta');
    expect(names).toContain('Dadi');
    expect(names).not.toContain('Rusty');
  });

  it('formats user message payload placing context and instructions before question', () => {
    const context = buildCompactContext(mockReport, mockProfile, INTENT_TYPES.BUDGET_OPTIONS);
    const instruction = getIntentInstruction(INTENT_TYPES.BUDGET_OPTIONS, mockReport);
    const payload = buildUserMessageWithContext({
      message: 'How do I clean my home air on a budget?',
      compactContext: context,
      intentInstruction: instruction
    });

    expect(payload).toContain('CONTEXT (Air Quality & Household Data):');
    expect(payload).toContain('INTENT INSTRUCTION (INDOOR AIR & BUDGET OPTIONS):');
    expect(payload).toContain('USER QUESTION:');
    expect(payload).toContain('How do I clean my home air on a budget?');
    // Context must appear before USER QUESTION
    expect(payload.indexOf('CONTEXT')).toBeLessThan(payload.indexOf('USER QUESTION:'));
  });
});

describe('Smart Fallback Answers adhere strictly to guidelines', () => {
  const mockReportGood = {
    city: 'Kolkata',
    admin1: 'West Bengal',
    current: { aqi: 35, category: 'Good', dominant: 'PM2.5', time: '14:00 IST' },
    bestHour24h: { hour: '14:00', aqi: 35, category: 'Good' },
    worstHour24h: { hour: '02:00', aqi: 75, category: 'Satisfactory' },
    tomorrow: {
      averageAqi: 45,
      category: 'Good',
      cleanestSlot: { hour: '14:00', aqi: 38 },
      peakSlot: { hour: '06:00', aqi: 82 }
    }
  };

  const mockReportPoor = {
    city: 'Delhi',
    admin1: 'NCT of Delhi',
    current: { aqi: 285, category: 'Poor', dominant: 'PM2.5', time: '14:00 IST' },
    bestHour24h: { hour: '14:00', aqi: 210, category: 'Poor' },
    worstHour24h: { hour: '07:00', aqi: 360, category: 'Very Poor' },
    tomorrow: {
      averageAqi: 295,
      category: 'Poor',
      cleanestSlot: { hour: '14:00', aqi: 220 },
      peakSlot: { hour: '07:00', aqi: 380 }
    }
  };

  it('answers "How do I clean my home air on a budget?" with rupee tiers and direct answer first', () => {
    const reply = generateIntentFallback({
      intentType: INTENT_TYPES.BUDGET_OPTIONS,
      primaryReport: mockReportGood,
      message: 'How do I clean my home air on a budget?'
    });

    expect(reply.startsWith('You can improve your indoor air a lot without spending much.')).toBe(
      true
    );
    expect(reply).toContain('Free (₹0)');
    expect(reply).toContain('Budget (under ₹1,000)');
    expect(reply).toContain('Premium (₹1,000+)');
    expect(reply).toContain('Corsi-Rosenthal');
    expect(reply).toContain("Today Kolkata's air is Good");
    expect(reply).not.toContain('### 🛡️ Recommended Safeguards:');
  });

  it('answers "Can kids play outside today?" starting with Yes/No/Conditional', () => {
    const goodReply = generateIntentFallback({
      intentType: INTENT_TYPES.KIDS_OR_SENIORS_SAFETY,
      primaryReport: mockReportGood,
      message: 'Can kids play outside today?'
    });
    expect(goodReply.startsWith('Yes')).toBe(true);

    const poorReply = generateIntentFallback({
      intentType: INTENT_TYPES.KIDS_OR_SENIORS_SAFETY,
      primaryReport: mockReportPoor,
      message: 'Can kids play outside today?'
    });
    expect(poorReply.startsWith('No')).toBe(true);
  });

  it('answers "What mask should I wear?" mentioning certified N95/FFP2 and Indian prices', () => {
    const reply = generateIntentFallback({
      intentType: INTENT_TYPES.MASK_ADVICE,
      primaryReport: mockReportPoor,
      message: 'What mask should I wear?'
    });
    expect(reply).toContain('N95 or FFP2 respirator');
    expect(reply).toContain('₹250–₹450');
    expect(reply.toLowerCase()).toContain('cloth');
  });

  it('answers "Is it safe to run tomorrow morning?" starting with Yes/No/Conditional and noting morning inversion', () => {
    const reply = generateIntentFallback({
      intentType: INTENT_TYPES.ACTIVITY_SAFETY,
      primaryReport: mockReportPoor,
      message: 'Is it safe to run tomorrow morning?',
      timeframe: 'tomorrow'
    });
    expect(reply.startsWith('No')).toBe(true);
    expect(reply).toContain('morning inversion');
    expect(reply).toContain('solar dispersal');
  });
});
