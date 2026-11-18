// functions/api/chat.js
// Cloudflare Pages Function & Local Server Handler for Gemini GenAI Chat Proxy
// India-first configuration with CPCB National AQI scale, Indian Rupees (₹),
// Indian context (crop burning, winter inversions, Delhi-NCR GRAP, chulha/LPG, N95 masks),
// medical disclaimer (emergency 112), and multilingual support (English, Hindi, Hinglish).

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute
const MAX_PAYLOAD_BYTES = 65536; // 64KB request body limit
const ipRateLimitMap = new Map();

function checkRateLimit(clientIp) {
  const now = Date.now();
  let clientRecord = ipRateLimitMap.get(clientIp);

  if (!clientRecord || now > clientRecord.resetTime) {
    clientRecord = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    ipRateLimitMap.set(clientIp, clientRecord);
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

function getCorsHeaders(request) {
  const requestOrigin = request.headers.get('Origin');
  let siteOrigin = 'https://foggy.pages.dev';
  try {
    const parsed = new URL(request.url);
    siteOrigin = parsed.origin;
  } catch {}

  const isAllowed =
    !requestOrigin ||
    requestOrigin === siteOrigin ||
    requestOrigin.includes('localhost') ||
    requestOrigin.includes('127.0.0.1') ||
    requestOrigin.endsWith('.pages.dev');

  return {
    'Access-Control-Allow-Origin': isAllowed ? (requestOrigin || siteOrigin) : siteOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Vary': 'Origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'X-Content-Type-Options': 'nosniff'
  };
}

function generateSmartFallbackResponse({ message, user, aqiData, profile }) {
  const q = message.toLowerCase();
  const userName = user?.name ? user.name.split(' ')[0] : 'friend';
  const cityName = aqiData?.city || profile?.location || 'Kolkata';
  const aqi = aqiData?.aqi || 165;
  const aqiCat = aqiData?.category || 'Moderate';

  const familyList = profile?.familyMembers || [];
  const sensitiveMembers = familyList.filter(m => m.condition && m.condition !== 'None');
  const sensitiveNames = sensitiveMembers.map(m => `${m.name} (${m.condition})`).join(', ');

  let text = '';
  const extractedFacts = [];

  // Memory detection heuristic
  if (q.includes('father') || q.includes('dad') || q.includes('pitaji')) {
    if (q.includes('copd') || q.includes('asthma') || q.includes('heart') || q.includes('saans')) {
      const cond = q.includes('copd') ? 'COPD' : q.includes('asthma') || q.includes('saans') ? 'Asthma' : 'Heart condition';
      extractedFacts.push({ type: 'family', name: 'Father', role: 'Senior', condition: cond });
    }
  }
  if (q.includes('daughter') || q.includes('son') || q.includes('child') || q.includes('kid') || q.includes('baccha')) {
    if (q.includes('asthma') || q.includes('allerg') || q.includes('saans')) {
      extractedFacts.push({ type: 'family', name: 'Child', role: 'Child', condition: 'Asthma/Allergies' });
    }
  }
  if (q.includes('chulha') || q.includes('wood') || q.includes('coal') || q.includes('angithi') || q.includes('lpg') || q.includes('png') || q.includes('induction')) {
    const heat = q.includes('chulha') ? 'Wood/Dung Chulha' : q.includes('angithi') ? 'Coal/Charcoal Angithi' : q.includes('induction') ? 'Induction Cooktop' : q.includes('png') ? 'PNG Piped Gas' : 'LPG Cylinder';
    extractedFacts.push({ type: 'home', key: 'cooking', value: heat });
  }
  if (q.includes('metro') || q.includes('train') || q.includes('bus') || q.includes('auto') || q.includes('scooter') || q.includes('bike') || q.includes('car')) {
    const commute = q.includes('metro') ? 'Metro' : q.includes('train') ? 'Local Train' : q.includes('bus') ? 'City Bus' : q.includes('auto') ? 'Auto/E-Rickshaw' : q.includes('bike') || q.includes('scooter') ? 'Two-Wheeler' : 'Car';
    extractedFacts.push({ type: 'lifestyle', key: 'commute', value: commute });
  }

  // Detect Hindi / Hinglish query
  const isHindi = /[\u0900-\u097F]/.test(message);
  const isHinglish = /\b(kya|kaise|karo|aaj|hawa|ka|ki|ke|hai|nahi|baahar|jaana|chahiye|saans|mask)\b/i.test(message);

  if (isHindi) {
    text = `नमस्ते ${userName}! **${cityName}** में आज अनुमानित CPCB वायु गुणवत्ता सूचकांक (NAQI) **${aqi} (${aqiCat})** है।\n\n` +
      `### 🕒 आज के लिए सुझाव:\n` +
      `* **सुबह (6:00 – 9:30 AM)**: सर्दियों की धुंध (इनवर्जन) ज़मीन के पास प्रदूषण रोक लेती है। खिड़कियाँ बंद रखें और सुबह की सैर दोपहर (1:00 – 3:30 PM) तक टालें।\n` +
      `* **मास्क**: बाहर निकलते समय केवल प्रमाणित **N95 या FFP2 मास्क** पहनें (कपड़े या सर्जिकल मास्क बारीक PM2.5 कण नहीं रोक पाते)।\n` +
      `* **सस्ता इनडोर फिल्टर**: 20-इंच पंखे पर MERV-13 फिल्टर लगाकर DIY Corsi-Rosenthal बॉक्स लगभग ₹3,000 में बन जाता है और 80%+ धूल साफ करता है।\n\n` +
      `> 🩺 *अस्वीकरण: फॉगी एक AI सहायक है, डॉक्टर नहीं। चिकित्सा आपात स्थिति में 112 पर कॉल करें।*`;
  } else if (isHinglish) {
    text = `Namaste ${userName}! **${cityName}** mein aaj estimated CPCB NAQI **${aqi} (${aqiCat})** hai.\n\n` +
      `### 🕒 Smog Shield Routine:\n` +
      `* **Morning (6:00 – 9:30 AM)**: Winter inversion ground ke paas pollution trap karta hai. Morning walk ya jogging ko avoid karein; afternoon (1:00 – 3:30 PM) safest window hai.\n` +
      `* **Mask**: Bahar jaate waqt certified **N95 / FFP2 mask** pehnein. Cloth masks PM2.5 particles ko nahi rok paate.\n` +
      `* **Indoor Air**: Rolled damp towel se door gaps seal karein aur kitchen exhaust fan zaroor on rakhein.\n\n` +
      `> 🩺 *Disclaimer: Foggy ek AI assistant hai, doctor nahi. Medical emergency ke liye 112 par call karein.*`;
  } else if (q.includes('plan') || q.includes('routine') || q.includes('schedule') || q.includes('day')) {
    text = `Hello ${userName}! Here is your low-exposure day plan for **${cityName}** where the estimated NAQI is currently **${aqi} (${aqiCat})** based on CPCB categories.\n\n` +
      `### 🕒 Hour-by-Hour Smog Shield Routine:\n` +
      `* **Morning (6:30 AM – 9:30 AM) [Winter Inversion Peak]**: Dense ground-level inversion traps vehicular exhaust and smoke. Keep balcony doors tightly sealed. Avoid outdoor jogs.\n` +
      `  * **Commute Swap**: Swapping a petrol two-wheeler or car for the Metro or AC electric bus saves ~**₹150–₹220 in fuel & parking** and cuts direct PM2.5 inhalation by **65%**.\n` +
      `* **Midday (1:00 PM – 3:30 PM) [Safest Solar Dispersal Window]**: Sunlight breaks the nocturnal inversion layer, improving surface ventilation. Optimal window for errands, quick grocery runs, or indoor airing.\n` +
      `* **Evening (6:30 PM – 9:30 PM) [Traffic & Smoke Accumulation]**: Ambient particulate counts spike. Keep doors shut, run indoor filtration, and use an induction cooktop or keep the kitchen exhaust fan running.\n\n` +
      (sensitiveNames ? `⚠️ *Household Alert for ${sensitiveNames}*: Ensure rescue inhalers are readily accessible and keep physical activity indoors during inversion hours.\n\n` : '') +
      `> 🩺 *Medical disclaimer: Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.*`;
  } else if (q.includes('clean') || q.includes('indoor') || q.includes('purifier') || q.includes('filter') || q.includes('box fan')) {
    text = `Great question, ${userName}! Managing indoor air quality is vital during Indian winters:\n\n` +
      `### 🛠️ Practical Indoor Interventions:\n` +
      `1. **DIY Corsi-Rosenthal Box Fan (~₹2,500 – ₹3,500)**:\n` +
      `   * Tape 2 to 4 MERV-13 pleated filters to a standard box fan. Delivers the Clean Air Delivery Rate (CADR) of commercial ₹15,000+ HEPA purifiers at a fraction of the cost.\n` +
      `2. **Damp-Mop Daily (Zero Dry Sweeping)**:\n` +
      `   * Dry jhadu (brooms) launch settled toxic heavy metals back into breathing height. Use a wet mop (pocha) with water or mild disinfectant.\n` +
      `3. **Door & Window Draft Sealing (₹0 – ₹350)**:\n` +
      `   * Place a rolled damp towel across the main door threshold or apply self-adhesive EPDM weatherstripping to block street smog drafts by up to **40%**.\n` +
      `4. **Honest Note on Houseplants**:\n` +
      `   * While plants like Snake Plant look wonderful, scientific testing confirms they cannot filter severe particulate smog (PM2.5) at room scale; mechanical filtration is essential.\n\n` +
      `> 🩺 *Medical disclaimer: Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.*`;
  } else if (q.includes('mask') || q.includes('n95') || q.includes('outside') || q.includes('walk')) {
    text = `Heading outdoors in ${cityName} (Estimated NAQI: ${aqi}) requires certified physical filtration, ${userName}.\n\n` +
      `### 😷 Mask & Outdoor Protection Guide:\n` +
      `* **Certified N95 / FFP2 Respirators**: Block **95%+ of PM2.5**. Ordinary cloth, handkerchiefs, or loose surgical masks leak unfiltered air through the sides and do not stop micro-particles.\n` +
      `* **Proper Seal**: Pinch the metal nose clip firmly and ensure the elastic headbands fit snugly against your cheeks.\n` +
      `* **4-Day Paper Bag Rotation**: Buy a 4-pack of N95 masks (~₹250–₹400). Label paper bags Mon–Thu and rotate daily to let moisture dissipate naturally, safely extending each mask's life up to 40 hours.\n\n` +
      `> 🩺 *Medical disclaimer: Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.*`;
  } else {
    text = `Hello ${userName}! I'm Foggy, your Indian air quality companion.\n\n` +
      `In **${cityName}** today, the estimated CPCB National AQI is **${aqi} (${aqiCat})**.\n\n` +
      `Here is how I can help your family stay safe:\n` +
      `* 📅 **Low-Emission Routines**: Optimal outdoor windows (1-3 PM) and metro/bus commute swaps.\n` +
      `* 🏡 **Clean Air Playbook**: Budget hacks from ₹0 door draft sealing to DIY Corsi-Rosenthal boxes (~₹3,000).\n` +
      `* 👨‍👩‍👧 **Family Health Shield**: Tailored precautions for children, seniors, and asthmatic family members.\n` +
      `* 🌾 **Seasonal Context**: Insights on winter inversion, parali burning, and Delhi-NCR GRAP guidelines.\n\n` +
      `What would you like to plan today? (You can also ask in Hindi or Hinglish!)\n\n` +
      `> 🩺 *Medical disclaimer: Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.*`;
  }

  return { text, extractedFacts };
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request)
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  headers['Content-Type'] = 'application/json; charset=utf-8';

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  const rateCheck = checkRateLimit(clientIp);
  headers['X-RateLimit-Limit'] = MAX_REQUESTS_PER_WINDOW.toString();
  headers['X-RateLimit-Remaining'] = rateCheck.remaining.toString();
  headers['X-RateLimit-Reset'] = Math.ceil(rateCheck.reset / 1000).toString();

  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit reached. Please wait a moment before sending more messages.'
      }),
      { status: 429, headers }
    );
  }

  let rawBodyText = '';
  try {
    rawBodyText = await request.text();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Bad Request', message: 'Failed to read request body.' }),
      { status: 400, headers }
    );
  }

  if (rawBodyText.length > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({ error: 'Payload Too Large', message: 'Request payload exceeds 64KB limit.' }),
      { status: 413, headers }
    );
  }

  let requestBody = {};
  try {
    requestBody = JSON.parse(rawBodyText);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Bad Request', message: 'Malformed JSON payload.' }),
      { status: 400, headers }
    );
  }

  const { message, history = [], user, aqiData, profile } = requestBody;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return new Response(
      JSON.stringify({ error: 'Bad Request', message: 'Message is required and must be non-empty.' }),
      { status: 400, headers }
    );
  }

  const apiKey = env?.GEMINI_API_KEY;
  const isKeyConfigured = Boolean(
    apiKey &&
    apiKey !== 'your_gemini_api_key_here' &&
    apiKey.trim().length > 15
  );

  const userName = user?.name || 'Friend';
  const cityName = aqiData?.city || profile?.location || 'Kolkata';
  const currentAQI = aqiData?.aqi || 165;
  const aqiCategory = aqiData?.category || 'Moderate';
  const dominantPollutant = aqiData?.dominantPollutant || 'PM2.5';

  const familyList = profile?.familyMembers || [];
  const familyDesc = familyList.length > 0
    ? familyList.map(f => `${f.name} (Role: ${f.role}, Condition: ${f.condition || 'None'}, Sensitivity: ${f.sensitivity || 'Normal'})`).join('; ')
    : 'None saved yet';

  const householdDetails = `
- User Name: ${userName}
- Location: ${cityName}, India
- Estimated CPCB NAQI: ${currentAQI} (${aqiCategory})
- Dominant Pollutant: ${dominantPollutant}
- Family Members: ${familyDesc}
- Commute: ${profile?.commute || 'Metro / Two-wheeler'}
- Cooking / Heating: ${profile?.cookingType || 'LPG Cylinder'} / ${profile?.heatingType || 'Electric geyser'}
- Currency: Indian Rupees (₹)
`;

  const systemPrompt = `
You are Foggy, an empathetic, practical, and knowledgeable GenAI companion designed for Indian households navigating severe air pollution, seasonal winter smog, and urban particulates.

CORE SYSTEM RULES:
1. INDIAN CONTEXT & NATIONAL AQI SCALE:
   - Use the official Central Pollution Control Board (CPCB) National AQI (NAQI) categories (0-500):
     * Good (0-50)
     * Satisfactory (51-100)
     * Moderate (101-200)
     * Poor (201-300)
     * Very Poor (301-400)
     * Severe (401-500)
   - Never use the US EPA scale, US AQI, Fahrenheit, or "Unhealthy for Sensitive Groups".
   - Default city is Kolkata unless specified otherwise. Understand major Indian cities (Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Ahmedabad, Pune, Lucknow, etc.).
   - Understand Indian seasonal pollution dynamics: winter atmospheric temperature inversions across the Indo-Gangetic Plain, post-harvest crop-residue burning (parali), Diwali fireworks, construction & road dust, vehicular tailpipes, and biomass/chulha burning.
   - Mention Delhi-NCR Graded Response Action Plan (GRAP) at a general informational level when relevant, directing users to the official CAQM/CPCB bulletin without fabricating specific dates.

2. CURRENCY & REALISTIC PRICING:
   - Always use Indian Rupees (₹), formatted with realistic Indian market estimates (e.g. ₹2,500 – ₹3,500 for a DIY Corsi-Rosenthal box, ₹250 – ₹450 for a multi-pack of N95 masks, ₹8,500 – ₹16,000 for a commercial HEPA purifier, ₹250 for door draft seals).
   - Never mention dollars ($) or USD.

3. PRACTICAL MITIGATION:
   - Emphasize certified N95 / FFP2 respirators (cloth and surgical masks cannot filter fine PM2.5).
   - Promote DIY Corsi-Rosenthal box fan filters with MERV-13 filters as budget champions.
   - Recommend wet damp-mopping (pocha) over dry brooms (jhadu) to stop dust resuspension.
   - Honest about indoor plants: clarify that while plants have wellness value, scientific studies show they have negligible impact on severe outdoor particulate infiltration.
   - Suggest swapping chulha/open fires for LPG cylinders or induction cooktops.

4. MULTILINGUAL COMMUNICATION:
   - Reply in the language the user writes in: English, Hindi (हिन्दी), or Hinglish.
   - Tone: Warm, reassuring, evidence-based, actionable (never alarmist or despair-inducing).

5. MANDATORY SAFETY DISCLAIMER:
   - Always include this exact spirit of disclaimer: "Foggy is an AI assistant, not a doctor. In a medical emergency, call 112."

6. DYNAMIC MEMORY EXTRACTION:
   - If the user mentions family health conditions (e.g., asthma, COPD, bronchitis), new members, cooking methods, or commute swaps, append:
   [FOGGY_MEMORY_EXTRACTION: {"facts": [{"type": "family"|"home"|"lifestyle", "key": "string", "name": "optional", "condition": "optional", "value": "string"}]}]

CURRENT HOUSEHOLD CONTEXT:
${householdDetails}
`;

  if (isKeyConfigured) {
    try {
      const contents = [];
      const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
      for (const item of recentHistory) {
        if (item.text || item.content) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text || item.content }]
          });
        }
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const apiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 1000 }
        }),
        signal: AbortSignal.timeout(9000)
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        let rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawReply) {
          let extractedFacts = [];
          const memoryMatch = rawReply.match(/\[FOGGY_MEMORY_EXTRACTION:\s*({[\s\S]*?})\]/);
          if (memoryMatch) {
            try {
              const parsed = JSON.parse(memoryMatch[1]);
              if (Array.isArray(parsed.facts)) extractedFacts = parsed.facts;
            } catch {}
            rawReply = rawReply.replace(/\[FOGGY_MEMORY_EXTRACTION:\s*({[\s\S]*?})\]/, '').trim();
          }
          return new Response(
            JSON.stringify({ reply: rawReply, extractedFacts, isLive: true, model: 'gemini-1.5-flash' }),
            { status: 200, headers }
          );
        }
      }
    } catch (err) {
      console.warn('Gemini API fetch failed, falling back to smart simulation:', err.message);
    }
  }

  // Smart fallback
  const fallback = generateSmartFallbackResponse({ message, user, aqiData, profile });
  return new Response(
    JSON.stringify({
      reply: fallback.text,
      extractedFacts: fallback.extractedFacts,
      isLive: false,
      model: 'foggy-indian-atmospheric-core'
    }),
    { status: 200, headers }
  );
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  if (context.request.method === 'OPTIONS') return onRequestOptions(context);

  const headers = getCorsHeaders(context.request);
  headers['Allow'] = 'POST, OPTIONS';
  headers['Content-Type'] = 'application/json; charset=utf-8';
  return new Response(JSON.stringify({ error: 'Method Not Allowed', message: 'Use POST.' }), {
    status: 405,
    headers
  });
}
