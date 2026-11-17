// api/chat.js
// Vercel Serverless Function for Gemini GenAI Chat Proxy with Memory Extraction, Rate Limiting & Input Validation

// In-memory sliding window rate limiter per client IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute
const rateLimitMap = new Map();

function checkRateLimit(clientIp) {
  const now = Date.now();
  let clientRecord = rateLimitMap.get(clientIp);

  if (!clientRecord || now > clientRecord.resetTime) {
    clientRecord = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(clientIp, clientRecord);
    return { allowed: true, count: 1, remaining: MAX_REQUESTS_PER_WINDOW - 1, reset: clientRecord.resetTime };
  }

  clientRecord.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - clientRecord.count);
  return {
    allowed: clientRecord.count <= MAX_REQUESTS_PER_WINDOW,
    count: clientRecord.count,
    remaining,
    reset: clientRecord.resetTime
  };
}

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
      `   * If you have a gas stove, run your range hood or switch portable cooking to an electric induction plate to eliminate indoor NO2 spikes.\n\n` +
      `> 🩺 *Medical note: Clean air reduces airway inflammation, but does not replace prescribed respiratory medications. Consult your physician for personalized medical advice.*`;
  } else if (q.includes('mask') || q.includes('n95') || q.includes('outside') || q.includes('walk')) {
    text = `Heading outside in ${cityName} (AQI: ${aqi}) requires smart physical barriers, ${userName}.\n\n` +
      `### 😷 Mask & Outdoor Protection Guide:\n` +
      `* **N95 or FFP2 Masks**: Certified N95 respirators filter **95%+ of PM2.5**. Cloth masks or loose surgical masks only block ~20-30% of fine particles.\n` +
      `* **Fit Matters**: Pinch the nose wire firmly against the bridge of your nose. If air leaks around your cheeks, tighten the straps.\n` +
      `* **Timing**: Conduct all walking, grocery runs, or errands between **1:00 PM and 3:30 PM** when the sun has broken the overnight inversion lid.\n` +
      `* **Low-Cost Reuse**: Keep 3-4 N95 masks in labelled paper bags; rotate them daily to let moisture dissipate naturally without losing filtration efficiency.\n\n` +
      `> 🩺 *Friendly reminder: I am Foggy, your air quality companion, not a medical professional. If breathing feels labored while wearing a mask, step into a clean indoor area and rest.*`;
  } else {
    text = `Hello ${userName}! I'm Foggy, your air quality companion.\n\n` +
      `In **${cityName}** today, the AQI is **${aqi} (${aqiCat})**.\n\n` +
      `Here is how I can help your household navigate this smog season:\n` +
      `* 📅 **Low-Emission Routines**: Get an hour-by-hour plan for clean commute swaps and optimal outdoor windows.\n` +
      `* 🏡 **Indoor Protection**: Learn budget-friendly filtration hacks like the DIY Corsi-Rosenthal box fan.\n` +
      `* 👨‍👩‍👧 **Family Shield**: Set up profiles for children, seniors, or pets with sensitive respiratory needs.\n` +
      `* 🌱 **Impact Tracking**: See direct CO2 and PM2.5 reduction metrics for every sustainable habit.\n\n` +
      `What would you like to focus on first?\n\n` +
      `> 🩺 *Safety disclaimer: I provide air quality and exposure prevention guidance, not medical diagnosis. Please consult a doctor for health concerns.*`;
  }

  return { text, extractedFacts };
}

export default async function handler(req, res) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Rate Limiting
  const clientIp = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';

  const rateCheck = checkRateLimit(clientIp);
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  res.setHeader('X-RateLimit-Remaining', rateCheck.remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateCheck.reset / 1000).toString());

  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Foggy rate limit reached. Please wait a moment before sending more messages to protect API quotas.',
      retryAfterSeconds: Math.ceil((rateCheck.reset - Date.now()) / 1000)
    });
  }

  // Input Validation
  let requestBody = req.body;
  if (typeof requestBody === 'string') {
    try {
      requestBody = JSON.parse(requestBody);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON payload in request body.' });
    }
  }

  if (!requestBody || typeof requestBody !== 'object') {
    return res.status(400).json({ error: 'Request body must be a valid JSON object.' });
  }

  const { message, history = [], user, aqiData, profile } = requestBody;

  // Validate message
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
  }

  if (message.length > 4000) {
    return res.status(400).json({ error: 'Message exceeds maximum allowed length of 4000 characters.' });
  }

  // Validate history
  if (history && !Array.isArray(history)) {
    return res.status(400).json({ error: 'History must be an array of messages.' });
  }

  // Validate profile & aqiData if present
  if (profile && typeof profile !== 'object') {
    return res.status(400).json({ error: 'Profile must be an object.' });
  }
  if (aqiData && typeof aqiData !== 'object') {
    return res.status(400).json({ error: 'aqiData must be an object.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyConfigured = Boolean(
    apiKey &&
    apiKey !== 'your_gemini_api_key_here' &&
    apiKey.trim().length > 15
  );

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

  if (isKeyConfigured) {
    try {
      const contents = [];

      // Add recent history (up to last 6 messages)
      const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
      for (const item of recentHistory) {
        if (item.text || item.content) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text || item.content }]
          });
        }
      }

      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const apiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1000
          }
        }),
        signal: AbortSignal.timeout(9000)
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        let rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawReply) {
          // Parse out memory extraction block if present
          let extractedFacts = [];
          const match = rawReply.match(/\[FOGGY_MEMORY_EXTRACTION:\s*(\{.*?\})\]/s);
          if (match && match[1]) {
            try {
              const parsed = JSON.parse(match[1]);
              if (Array.isArray(parsed.facts)) {
                extractedFacts = parsed.facts;
              }
              rawReply = rawReply.replace(/\[FOGGY_MEMORY_EXTRACTION:\s*(\{.*?\})\]/s, '').trim();
            } catch (e) {
              console.warn('[Memory Parse Warning]:', e.message);
            }
          }

          return res.status(200).json({
            reply: rawReply,
            extractedFacts,
            provider: 'Google Gemini 1.5 Flash'
          });
        }
      } else {
        const errorText = await apiRes.text();
        console.error('[Chat Service Error] Gemini API returned error:', apiRes.status, errorText);
      }
    } catch (err) {
      console.error('[Chat Service Error] Exception during Gemini API call, using smart fallback:', err.message);
    }
  } else {
    console.error('[Chat Service Error] GEMINI_API_KEY is missing or invalid in environment. Falling back to intelligent Foggy Atmospheric Core.');
  }

  // High-fidelity fallback core if Gemini is unreachable or key is missing
  const fallback = generateSmartFallbackResponse({
    message,
    user,
    aqiData,
    profile,
    history
  });

  return res.status(200).json({
    reply: fallback.text,
    extractedFacts: fallback.extractedFacts,
    provider: isKeyConfigured
      ? 'Foggy Atmospheric Core (Gemini API fallback active)'
      : 'Foggy Atmospheric Core (Simulated GenAI - Add GEMINI_API_KEY in Vercel Environment Variables)'
  });
}
