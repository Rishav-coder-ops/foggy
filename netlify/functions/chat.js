// netlify/functions/chat.js
// Netlify Function for Gemini GenAI Chat Proxy with Persistent Memory & Fallback Core

function generateSmartFallbackResponse({ message, user, aqiData, profile, history }) {
  const q = message.toLowerCase();
  const userName = user?.name ? user.name.split(' ')[0] : 'friend';
  const cityName = aqiData?.city || profile?.location || 'your area';
  const aqi = aqiData?.aqi || 135;
  const aqiCat = aqiData?.category || 'Unhealthy for Sensitive Groups';

  const familyList = profile?.familyMembers || [];
  const sensitiveMembers = familyList.filter(m => m.condition && m.condition !== 'None');
  const sensitiveNames = sensitiveMembers.map(m => `${m.name} (${m.condition})`).join(', ');

  let text = '';
  const extractedFacts = [];

  // Memory detection heuristic
  if (q.includes('father') || q.includes('dad')) {
    if (q.includes('copd') || q.includes('asthma') || q.includes('heart')) {
      const cond = q.includes('copd') ? 'COPD' : q.includes('asthma') ? 'Asthma' : 'Heart condition';
      extractedFacts.push({ type: 'family', name: 'Father', role: 'Senior', condition: cond });
    }
  }
  if (q.includes('daughter') || q.includes('son') || q.includes('child') || q.includes('kid')) {
    if (q.includes('asthma') || q.includes('allerg')) {
      extractedFacts.push({ type: 'family', name: 'Child', role: 'Child', condition: 'Asthma/Allergies' });
    }
  }
  if (q.includes('wood stove') || q.includes('coal') || q.includes('fireplace') || q.includes('gas stove')) {
    const heat = q.includes('wood') ? 'Wood Stove' : q.includes('coal') ? 'Coal Burner' : q.includes('fireplace') ? 'Fireplace' : 'Gas Stove';
    extractedFacts.push({ type: 'home', key: 'heating', value: heat });
  }
  if (q.includes('commute') || q.includes('drive') || q.includes('car') || q.includes('bike') || q.includes('train')) {
    const commute = q.includes('bike') ? 'Bicycle' : q.includes('train') || q.includes('metro') || q.includes('bus') ? 'Public Transit' : 'Solo Car';
    extractedFacts.push({ type: 'lifestyle', key: 'commute', value: commute });
  }

  // Topic responses
  if (q.includes('plan') || q.includes('routine') || q.includes('schedule') || q.includes('day')) {
    text = `Hello ${userName}! Here is your personalized, low-exposure day plan for **${cityName}** where the AQI is currently **${aqi} (${aqiCat})**.\n\n` +
      `### 🕒 Hour-by-Hour Smog Shield Routine:\n` +
      `* **Morning (7:00 AM – 9:30 AM) [Peak Inversion Alert]**: Winter air traps pollutants near ground level. Keep windows sealed. Do morning light stretches indoors. Run your air purifier in the bedroom.\n` +
      `  * **Commute Swap**: If you commute by train/metro instead of driving solo, you save ~**2.8 kg CO2** today and cut your direct exhaust inhalation by **65%** compared to idling in traffic.\n` +
      `* **Midday (1:00 PM – 3:30 PM) [Safest Outdoor Window]**: Sunlight and thermal mixing dilute ground pollutants. If you need to run errands or walk pets, this is your optimal 2.5-hour window.\n` +
      `* **Evening (6:30 PM – 9:00 PM) [Domestic Heating Peak]**: Outdoor AQI climbs as heating fires and traffic peak. Keep doors shut and avoid heavy outdoor cardio.\n\n` +
      (sensitiveNames ? `⚠️ *Special Note for ${sensitiveNames}*: Ensure rescue inhalers are nearby and avoid outdoor cardio during morning/evening inversion hours.\n\n` : '') +
      `> 🩺 *Friendly reminder: I am Foggy, your air quality companion, not a medical professional. If anyone experiences persistent coughing, wheezing, or chest tightness, please consult a healthcare professional.*`;
  } else if (q.includes('clean') || q.includes('indoor') || q.includes('purifier') || q.includes('filter') || q.includes('box fan')) {
    text = `Great question, ${userName}! Keeping your indoor sanctuary clean is one of the most effective ways to slash pollution exposure, especially during severe smog.\n\n` +
      `### 🛠️ Practical Indoor Air Quality Hacks:\n` +
      `1. **The Corsi-Rosenthal Box (Budget Champion)**:\n` +
      `   * A standard 20" box fan taped to one or four MERV-13 furnace filters costs under $35-$45 and matches the CADR (Clean Air Delivery Rate) of commercial $400 HEPA units.\n` +
      `   * **Impact**: Cleans ~85% of PM2.5 in a 400 sq.ft room within 30 minutes.\n` +
      `2. **Micro-Gap Door & Window Sealing**:\n` +
      `   * Place a damp rolled towel or foam draft stopper along external door sills.\n` +
      `   * **Impact**: Slashes uncontrolled outdoor particulate infiltration by up to **40%** at zero additional cost.\n` +
      `3. **Ventilation Timing**:\n` +
      `   * Never air out your home before 10 AM or after 6 PM during smog season. Ventilate for 10-15 minutes strictly between 1:30 PM and 3:30 PM if needed, then re-seal.\n` +
      `4. **Cooktop Safety**:\n` +
      `   * Turn on exhaust hoods or use back burners whenever cooking; switch to electric kettles and induction burners to prevent indoor NO2 spikes.\n\n` +
      `Would you like step-by-step instructions for building a DIY box-fan filter?`;
  } else if (q.includes('mask') || q.includes('n95') || q.includes('cloth') || q.includes('kn95') || q.includes('wear')) {
    text = `Hey ${userName}, let's talk masks! When the AQI in ${cityName} is ${aqi}, standard cloth masks and loose surgical masks unfortunately leak >70% of dangerous PM2.5 around the edges.\n\n` +
      `### 😷 Mask Guide for Today's Air:\n` +
      `* **Recommended**: **N95, FFP2, or KF94 with headbands** (or ear loops with a tightening clip).\n` +
      `* **Fit Test**: When you inhale sharply, the mask should collapse slightly inwards; no air should blow upward into your eyes.\n` +
      `* **Health Impact**: A well-fitted N95 filters **>95% of fine particulate matter (PM2.5)**, lowering your inflammatory respiratory burden by ~**80%** during a 30-minute outdoor transit.\n` +
      `* **Budget Tip**: You can safely rotate 3-4 N95 masks in breathable paper bags (labeling them Mon/Tue/Wed), reusing each up to 40 hours as long as straps remain elastic and dry.\n\n` +
      (sensitiveMembers.length ? `Since your household has sensitive members, consider child-sized KF94 masks designed specifically for small face contours.` : '');
  } else if (q.includes('kid') || q.includes('child') || q.includes('asthma') || q.includes('elderly') || q.includes('senior') || q.includes('pet')) {
    text = `Protecting vulnerable loved ones is our top priority, ${userName}.\n\n` +
      `### 🛡️ Vulnerable Group Protocol for AQI ${aqi}:\n` +
      `* **Children**: Kids breathe ~50% more air per pound of body weight than adults, and their lungs are still developing. Cancel outdoor sports when AQI exceeds 150. Encourage indoor active play away from open windows.\n` +
      `* **Asthma / Respiratory Conditions**: Keep peak-flow meters and prescribed controller inhalers on schedule. Smog causes bronchial spasms. Inhaling steam or warm water helps soothe airway irritation.\n` +
      `* **Seniors & Heart Patients**: Fine PM2.5 can cross the lung barrier into the bloodstream, triggering vascular stress. Avoid any strenuous lifting outdoors.\n` +
      `* **Pets**: Dogs also inhale ground-level smog heavily. Keep walks brief and wipe their paws and coat with a moist cloth after returning.\n\n` +
      `> 🩺 *Safety reminder: Foggy provides lifestyle exposure mitigation advice. For asthma action plans or medication adjustments, please consult your physician.*`;
  } else if (q.includes('plant') || q.includes('indoor plant')) {
    text = `Indoor plants are a wonderful addition to any home, ${userName}! While they don't replace active HEPA filtration for dense PM2.5 smog, they enhance indoor humidity and absorb volatile organic compounds (VOCs).\n\n` +
      `### 🌿 Top Air-Friendly Companions:\n` +
      `1. **Snake Plant (Mother-in-law's Tongue)**: Unique because it releases oxygen and absorbs CO2 *at night*, making it ideal for bedrooms.\n` +
      `2. **Spider Plant**: Resilient, non-toxic to pets, and filters formaldehyde and xylene.\n` +
      `3. **Areca Palm**: Natural humidifier that counteracts dry, scratchy winter air.\n\n` +
      `*Pair plants with a DIY filter or HEPA unit for the ultimate clean air combination!*`;
  } else {
    text = `Hello ${userName}! I'm **Foggy**, your air quality guide. Right now in **${cityName}**, the AQI is **${aqi} (${aqiCat})**.\n\n` +
      `Every action you take can both reduce your exposure and lower your community's pollution footprint. For example:\n` +
      `* **Action**: Keeping windows sealed during morning inversion hours cuts indoor PM2.5 infiltration by **~40%**.\n` +
      `* **Swap**: Using an electric or induction kettle instead of an open flame saves **~0.4 kg CO2** daily and prevents indoor NO2 buildup.\n` +
      `* **Protection**: Wearing a fitted N95 outdoors removes **>95%** of microscopic toxic soot from reaching your alveoli.\n\n` +
      (familyList.length > 0 ? `I'm keeping your family profile in mind (${familyList.map(f => f.name).join(', ')}). ` : '') +
      `What would you like to focus on today? We can plan your low-pollution daily routine, explore budget DIY air filters, or check family safety tips!`;
  }

  return {
    reply: text,
    extractedFacts,
    provider: 'Foggy Atmospheric Core (Built-in Assistant)'
  };
}

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  let requestBody = {};
  try {
    requestBody = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid JSON payload' })
    };
  }

  const { message, history = [], user, aqiData, profile } = requestBody;

  if (!message || typeof message !== 'string') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Message is required' })
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyConfigured = apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.length > 15;

  const userName = user?.name || 'Friend';
  const cityName = aqiData?.city || profile?.location || 'Unknown City';
  const currentAQI = aqiData?.aqi || 120;
  const aqiCategory = aqiData?.category || 'Moderate';
  const pollutants = aqiData?.pollutants ? JSON.stringify(aqiData.pollutants) : 'N/A';

  const familyList = profile?.familyMembers || [];
  const familyDesc = familyList.length > 0
    ? familyList.map(f => `${f.name} (Role: ${f.role}, Condition: ${f.condition || 'None'}, Sensitivity: ${f.sensitivity || 'Normal'})`).join('; ')
    : 'None saved yet';

  const householdDetails = `
- User Name: ${userName}
- User Location: ${cityName}
- Current AQI: ${currentAQI} (${aqiCategory})
- Primary Pollutants: ${pollutants}
- Household Members: ${familyDesc}
- Commute Method: ${profile?.commute || 'Not specified'}
- Heating / Cooking Type: ${profile?.heatingType || 'Not specified'} / ${profile?.cookingType || 'Not specified'}
- Budget Preference: ${profile?.budget || 'Practical / Budget-conscious'}
- Known Vulnerabilities: ${profile?.vulnerabilities?.join(', ') || 'None specified'}
`;

  const systemPrompt = `
You are Foggy, a friendly, knowledgeable, and reassuring GenAI companion who helps families and communities navigate severe winter smog and urban air pollution.
Your personality is warm, approachable, empathetic, and always practical (never alarmist, never catastrophizing).

CORE PURPOSE & RULES:
1. Greet the user warmly by name (${userName}) if appropriate.
2. Provide personalized, highly actionable guidance that reduces their exposure to polluted air AND lowers their personal contribution to it.
3. CLEARLY EXPLAIN THE DIRECT IMPACT of every recommendation (e.g. "Switching to public transport for this trip saves ~2.4 kg CO2 and reduces PM2.5 exposure by 60%").
4. ALWAYS provide budget-friendly options alongside standard solutions (e.g., DIY Corsi-Rosenthal box fan filters, rolled towel draft sealing, window timing).
5. Address specific family members if relevant: ${familyDesc}.
6. SAFETY DISCLAIMER: You are an AI companion, NOT a medical doctor. Always include a brief, reassuring medical disclaimer when health symptoms or respiratory conditions arise, advising consulting a healthcare provider.
7. NEVER ask for information you already have in the context below.
8. FOCUS: Air quality, winter smog, particulate matter (PM2.5, PM10), low-emission routines, clean indoor air, sustainable alternatives.
9. DYNAMIC MEMORY EXTRACTION: If the user reveals new personal details in their message (such as a family member's illness like asthma/COPD, a pet, heating type like wood/coal, pregnancy, or commute style), append a special JSON block at the very end of your response on a new line:
[FOGGY_MEMORY_EXTRACTION: {"facts": [{"type": "family"|"home"|"lifestyle", "key": "string", "name": "optional name", "condition": "optional condition", "value": "string"}]}]

CURRENT CONTEXT:
${householdDetails}
`;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (isKeyConfigured) {
    try {
      const contents = [];

      const recentHistory = history.slice(-6);
      for (const turn of recentHistory) {
        if (turn.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: turn.text }] });
        } else if (turn.sender === 'foggy') {
          contents.push({ role: 'model', parts: [{ text: turn.text }] });
        }
      }

      contents.push({ role: 'user', parts: [{ text: message }] });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const apiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        let rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawReply) {
          let extractedFacts = [];
          const memoryRegex = /\[FOGGY_MEMORY_EXTRACTION:\s*({[\s\S]*?})\]/;
          const match = rawReply.match(memoryRegex);

          if (match && match[1]) {
            try {
              const parsed = JSON.parse(match[1]);
              extractedFacts = parsed.facts || [];
            } catch (e) {
              console.warn('Could not parse memory extraction block:', e);
            }
            rawReply = rawReply.replace(memoryRegex, '').trim();
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              reply: rawReply,
              extractedFacts,
              provider: 'Google Gemini 1.5 Flash'
            })
          };
        }
      } else {
        const errorText = await apiRes.text();
        console.warn('[Chat Function Gemini Error]', apiRes.status, errorText);
      }
    } catch (err) {
      console.warn('[Chat Function Gemini Exception, falling back]:', err.message);
    }
  }

  // Fallback to resilient built-in engine
  const fallback = generateSmartFallbackResponse({
    message,
    user,
    aqiData,
    profile,
    history
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      reply: fallback.reply,
      extractedFacts: fallback.extractedFacts,
      provider: isKeyConfigured
        ? 'Foggy Atmospheric Core (Gemini API fallback active)'
        : 'Foggy Atmospheric Core (Simulated GenAI - Add GEMINI_API_KEY in .env for live Gemini)'
    })
  };
}
