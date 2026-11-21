// scripts/eval-chat.js
// Evaluation script testing real questions against Foggy's chat engine.
// Verifies direct question answering, intent classification, and Indian context.

import { onRequestPost } from '../functions/api/chat.js';

const MOCK_PROFILE = {
  city: 'Kolkata',
  location: 'Kolkata, West Bengal',
  commute: 'Metro',
  cookingType: 'LPG Cylinder',
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

const QUESTIONS = [
  {
    id: 1,
    query: 'How do I clean my home air on a budget?',
    history: [],
    city: 'Kolkata',
    validator: (reply) => {
      const startsWithDirect =
        !reply.toLowerCase().startsWith('hello') && !reply.toLowerCase().startsWith('hi');
      const hasBudgetTiers =
        reply.includes('₹') &&
        (reply.includes('Free') ||
          reply.includes('Budget') ||
          reply.includes('1,000') ||
          reply.includes('1000'));
      const mentionsCorsiOrPurifier =
        reply.toLowerCase().includes('corsi') ||
        reply.toLowerCase().includes('fan') ||
        reply.toLowerCase().includes('mop');
      return startsWithDirect && hasBudgetTiers && mentionsCorsiOrPurifier;
    }
  },
  {
    id: 2,
    query: 'Can kids play outside today?',
    history: [],
    city: 'Kolkata',
    validator: (reply) => {
      const startsWithYesOrNoOrCond = /^(yes|no|conditionally)/i.test(reply.trim());
      const mentionsChildrenOrBeta =
        reply.toLowerCase().includes('kid') ||
        reply.toLowerCase().includes('beta') ||
        reply.toLowerCase().includes('child') ||
        reply.toLowerCase().includes('outside');
      return startsWithYesOrNoOrCond && mentionsChildrenOrBeta;
    }
  },
  {
    id: 3,
    query: 'What mask should I wear?',
    history: [],
    city: 'Kolkata',
    validator: (reply) => {
      const mentionsN95 =
        reply.toLowerCase().includes('n95') || reply.toLowerCase().includes('ffp2');
      const mentionsClothOrSurgical =
        reply.toLowerCase().includes('cloth') || reply.toLowerCase().includes('surgical');
      return mentionsN95 && mentionsClothOrSurgical;
    }
  },
  {
    id: 4,
    query: 'Plan my low-pollution day',
    history: [],
    city: 'Kolkata',
    validator: (reply) => {
      const mentionsSlots =
        reply.toLowerCase().includes('morning') && reply.toLowerCase().includes('afternoon');
      const mentionsInversionOrSolar =
        reply.toLowerCase().includes('inversion') ||
        reply.toLowerCase().includes('solar') ||
        reply.toLowerCase().includes('cleanest');
      return mentionsSlots && mentionsInversionOrSolar;
    }
  },
  {
    id: 5,
    query: 'Is it safe to run tomorrow morning?',
    history: [],
    city: 'Kolkata',
    validator: (reply) => {
      const startsWithDecision = /^(yes|no|conditionally)/i.test(reply.trim());
      const addressesTomorrow =
        reply.toLowerCase().includes('tomorrow') ||
        reply.toLowerCase().includes('inversion') ||
        reply.toLowerCase().includes('run');
      return startsWithDecision && addressesTomorrow;
    }
  },
  {
    id: 6,
    query: 'Delhi aqi',
    history: [],
    city: 'Delhi',
    validator: (reply) => {
      const mentionsDelhi = reply.toLowerCase().includes('delhi');
      const mentionsAQI =
        reply.toLowerCase().includes('aqi') || reply.toLowerCase().includes('naqi');
      return mentionsDelhi && mentionsAQI;
    }
  },
  {
    id: 7,
    query: 'what about tomorrow?',
    // Conversation history context where previous turn asked about Delhi AQI
    history: [
      { role: 'user', parts: [{ text: 'Delhi aqi' }] },
      {
        role: 'model',
        parts: [{ text: 'In Delhi, the current estimated CPCB NAQI is 280 (Poor).' }]
      }
    ],
    city: 'Delhi',
    validator: (reply) => {
      const mentionsTomorrow = reply.toLowerCase().includes('tomorrow');
      const mentionsForecastOrSlot =
        reply.toLowerCase().includes('forecast') ||
        reply.toLowerCase().includes('slot') ||
        reply.toLowerCase().includes('naqi') ||
        reply.toLowerCase().includes('aqi');
      return mentionsTomorrow && mentionsForecastOrSlot;
    }
  }
];

async function runEvaluation() {
  console.log('===============================================================');
  console.log('       FOGGY AIR CHAT EVALUATION (7 TARGET QUESTIONS)          ');
  console.log('===============================================================\n');

  let passed = 0;
  const results = [];

  for (const item of QUESTIONS) {
    console.log(`[Q${item.id}]: "${item.query}" (City: ${item.city})`);

    const requestBody = {
      message: item.query,
      history: item.history,
      profile: { ...MOCK_PROFILE, location: `${item.city}, India` },
      selectedCity: { name: item.city }
    };

    const webReq = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': `127.0.0.${item.id + 10}`
      },
      body: JSON.stringify(requestBody)
    });

    const response = await onRequestPost({
      request: webReq,
      env: process.env
    });

    const responseData = await response.json();
    const replyText = responseData.reply || '';
    const isValid = item.validator(replyText);

    if (isValid) {
      passed++;
      console.log(
        `STATUS: PASS (Status: ${response.status}, Model: ${responseData.model || 'fallback'})\n`
      );
    } else {
      console.log(`STATUS: FAIL (Validator criteria unmet)\n`);
    }

    console.log('--- Foggy Answer ---');
    console.log(replyText);
    console.log('--------------------\n');

    results.push({
      id: item.id,
      query: item.query,
      status: isValid ? 'PASS' : 'FAIL',
      reply: replyText
    });
  }

  console.log('===============================================================');
  console.log(`Evaluation Summary: ${passed}/${QUESTIONS.length} Questions Passed`);
  console.log('===============================================================\n');

  if (passed !== QUESTIONS.length) {
    process.exit(1);
  }
}

runEvaluation().catch((err) => {
  console.error('Evaluation script error:', err);
  process.exit(1);
});
