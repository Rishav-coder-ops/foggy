// functions/api/chatIntent.js
// Intent classification, compact context serialization, and structured prompt builder for Foggy Chat.
// Reuses Clean Air Playbook content and enforces direct, question-first answering.

export const INTENT_TYPES = {
  BUDGET_OPTIONS: 'budget_options',
  INDOOR_AIR_TIPS: 'indoor_air_tips',
  AQI_STATUS: 'aqi_status',
  FORECAST: 'forecast',
  PLAN_MY_DAY: 'plan_my_day',
  MASK_ADVICE: 'mask_advice',
  KIDS_OR_SENIORS_SAFETY: 'kids_or_seniors_safety',
  ACTIVITY_SAFETY: 'activity_safety',
  COMMUTE_OPTIONS: 'commute_options',
  HEALTH_SYMPTOM_CONCERN: 'health_symptom_concern',
  COMPARISON_BETWEEN_CITIES: 'comparison_between_cities',
  ABOUT_FOGGY: 'about_foggy',
  SMALL_TALK: 'small_talk',
  OFF_TOPIC: 'off_topic'
};

/**
 * Classifies a user message into one of the 14 intents using robust regex and context rules.
 */
export function classifyIntent(message, history = []) {
  if (!message || typeof message !== 'string') {
    return INTENT_TYPES.SMALL_TALK;
  }

  const raw = message.trim();
  const text = raw.toLowerCase();

  // 1. Off-topic check (strictly unrelated topics)
  if (
    /\b(python|javascript|typescript|java\b|c\+\+|html|css|sql query|regex|react|algorithm|function write|write code|coding problem|hack|exploit)\b/i.test(text) ||
    /\b(movie review|bollywood news|cricket score|ipl match winner|who won the match|recipe for|how to cook|bake a cake|paneer butter|biryani recipe)\b/i.test(text) ||
    /\b(crypto price|bitcoin|ethereum|stock market prediction|sensex|nifty 50|mutual fund nav)\b/i.test(text)
  ) {
    return INTENT_TYPES.OFF_TOPIC;
  }

  // 2. About Foggy persona / capabilities
  if (
    /\b(who are you|what are you|what is foggy|who is foggy|about foggy|tell me about yourself|tum kaun ho|foggy kya hai|what can you do|how do you work|how does foggy work)\b/i.test(text)
  ) {
    return INTENT_TYPES.ABOUT_FOGGY;
  }

  // 3. Small talk / pure greetings
  if (
    /^(hi|hello|hey|namaste|namaskar|pranam|good morning|good afternoon|good evening|howdy|sup|thanks|thank you|shukriya|dhanyawad|dhanyavad)[!., ]*$/i.test(text) ||
    /^(hi|hello|hey|namaste)[!., ]*(foggy)?[!., ]*$/i.test(text)
  ) {
    return INTENT_TYPES.SMALL_TALK;
  }

  // 4. Health symptom distress / concern
  if (
    /\b(cough|coughing|khansi|throat irritation|gale mein kharash|burning eyes|aankhon mein jalan|chest tight|saans phoolna|shortness of breath|breathless|wheezing|asthma attack|headache|sir dard|dizzy|nausea|doctor consult|medical advice|chest pain)\b/i.test(text)
  ) {
    return INTENT_TYPES.HEALTH_SYMPTOM_CONCERN;
  }

  // 5. Plan my day / daily routine
  if (
    /\b(plan.*day|schedule.*day|plan my low[- ]pollution day|plan my day|daily plan|aaj ka plan|din bhar ka schedule|routine for today|routine for smog|when should i go out|best time to (go out|run errands|venture out))\b/i.test(text)
  ) {
    return INTENT_TYPES.PLAN_MY_DAY;
  }

  // 6. Budget options & Clean Air Playbook
  if (
    /\b(budget|cheap|cheapest|low[- ]cost|affordable|free|kam kharch|kam kharche|sasta|under rs|under 1000|paisa bacha|save money|clean.*(air|home|room).*budget|budget.*(clean|purif|filter|hacks?)|budget options?)\b/i.test(text) ||
    (text.includes('clean my home air on a budget') || text.includes('how do i clean my home air on a budget'))
  ) {
    return INTENT_TYPES.BUDGET_OPTIONS;
  }

  // 7. Indoor air cleaning / purification tips
  if (
    /\b(corsi[- ]rosenthal|diy purifier|clean.*home air|clean.*indoor|indoor air|purify.*home|purify.*room|clean.*room.*air|filter.*home|hepa|air purifier|wet[- ]mop|damp[- ]mop|pocha|dry sweep|jhadu|agarbatti|dhoop|incense|exhaust fan|weatherstrip|seal.*window|seal.*door|drafts?|houseplants?|indoor plants?|plants?.*air|hawa.*saaf|clean my home)\b/i.test(text) ||
    text.includes('corsi-rosenthal')
  ) {
    return INTENT_TYPES.INDOOR_AIR_TIPS;
  }

  // 8. Mask advice
  if (
    /\b(mask|masks|n95|ffp2|respirator|surgical mask|cloth mask|pollution mask|pehanna|pehne|which mask|what mask|mask advice)\b/i.test(text)
  ) {
    return INTENT_TYPES.MASK_ADVICE;
  }

  // 9. Kids or seniors safety
  if (
    /\b(kid|kids|child|children|baby|infant|toddler|baccha|bacche|senior|seniors|elder|elderly|old people|grandma|grandpa|dadi|nani|dada|nana|bujurg|tips for my child)\b/i.test(text) &&
    /\b(safe|outside|play|outdoor|park|school|cricket|asthma|precaution|hawa)\b/i.test(text)
  ) {
    return INTENT_TYPES.KIDS_OR_SENIORS_SAFETY;
  }
  if (/\b(can kids play outside|tips for my child with asthma|kya bacche bahar khel sakte)\b/i.test(text)) {
    return INTENT_TYPES.KIDS_OR_SENIORS_SAFETY;
  }

  // 10. Activity safety (running, workout, cricket, walks)
  if (
    /\b(run|running|jog|jogging|daudna|morning walk|evening walk|sair|cricket|football|sports?|exercise|workout|gym|cycling|play outdoors?|play outside|outdoor activity|bahar khelna|bahar daudna)\b/i.test(text) &&
    /\b(safe|today|tomorrow|morning|evening|aaj|kal|chahiye|theek|can i|is it safe)\b/i.test(text)
  ) {
    return INTENT_TYPES.ACTIVITY_SAFETY;
  }
  if (/\b(safe to run|safe to walk|safe to jog|safe to exercise)\b/i.test(text)) {
    return INTENT_TYPES.ACTIVITY_SAFETY;
  }

  // 11. Commute options
  if (
    /\b(commute|commuting|transit|metro|bus|two[- ]wheeler|bike|motorcycle|scooter|auto|rickshaw|car|drive|driving|travel to (office|work)|traffic smog)\b/i.test(text)
  ) {
    return INTENT_TYPES.COMMUTE_OPTIONS;
  }

  // 12. City comparison
  if (
    /\b(safer than|better than|worse than|cleaner than|vs\.?|versus|compare|ya dono mein)\b/i.test(text)
  ) {
    return INTENT_TYPES.COMPARISON_BETWEEN_CITIES;
  }

  // 13. Follow-up or explicit forecast check
  if (
    /\b(tomorrow|kal|tonight|aaj raat|upcoming|next 24 hours|forecast|agla din|what about tomorrow|aur kal|future|weekend)\b/i.test(text) ||
    /^(what about tomorrow|and tomorrow|how about tomorrow|aur kal|kal ka kya)[?.]*$/i.test(text)
  ) {
    return INTENT_TYPES.FORECAST;
  }

  // 14. AQI status check
  if (
    /\b(aqi|pollution|smog|air quality|hawa kaisi hai|hawa kaisa|kitna aqi|pm2\.5|pm10|pollutant|reading|score|level)\b/i.test(text) ||
    /^[a-zA-Z\s]{3,20}\s+aqi\b/i.test(text) ||
    /\baqi\s+in\b/i.test(text)
  ) {
    return INTENT_TYPES.AQI_STATUS;
  }

  // Check if conversation history indicates ongoing AQI/forecast topic and user asks follow up
  if (history && history.length > 0) {
    if (/\b(what about|how about|and|tell me more|aur|phir)\b/i.test(text)) {
      return INTENT_TYPES.FORECAST;
    }
  }

  // Default fallback for short general queries
  return INTENT_TYPES.AQI_STATUS;
}

/**
 * Builds compact JSON context for the Gemini prompt.
 * Only includes relevant family members and context fields based on intent.
 */
export function buildCompactContext(primaryReport, profile = {}, intentType = INTENT_TYPES.AQI_STATUS, secondaryReport = null) {
  const familyList = profile?.familyMembers || [];

  // Filter family members relevant to the specific question intent
  let relevantFamily = [];
  if (intentType === INTENT_TYPES.KIDS_OR_SENIORS_SAFETY) {
    relevantFamily = familyList.filter((m) => {
      const rel = (m.relationship || m.tag || m.role || '').toLowerCase();
      if (rel.includes('pet') || rel.includes('dog') || rel.includes('cat')) return false;
      const age = parseInt(m.age, 10);
      return (
        rel.includes('child') ||
        rel.includes('son') ||
        rel.includes('daughter') ||
        rel.includes('kid') ||
        rel.includes('senior') ||
        rel.includes('dadi') ||
        rel.includes('nani') ||
        rel.includes('dada') ||
        rel.includes('nana') ||
        rel.includes('grand') ||
        (Number.isFinite(age) && (age <= 12 || age >= 60))
      );
    });
    if (relevantFamily.length === 0) {
      relevantFamily = familyList.filter((m) => {
        const rel = (m.relationship || m.tag || m.role || '').toLowerCase();
        return !rel.includes('pet') && !rel.includes('dog') && !rel.includes('cat');
      }).slice(0, 2);
    }
  } else if (
    intentType === INTENT_TYPES.ACTIVITY_SAFETY ||
    intentType === INTENT_TYPES.HEALTH_SYMPTOM_CONCERN
  ) {
    relevantFamily = familyList.filter((m) => m.condition && m.condition !== 'None');
    if (relevantFamily.length === 0) relevantFamily = familyList.slice(0, 1);
  } else if (intentType === INTENT_TYPES.PLAN_MY_DAY) {
    relevantFamily = familyList.slice(0, 2);
  } else {
    // For budget, mask, aqi, minimal inclusion
    relevantFamily = familyList.filter((m) => m.condition && m.condition !== 'None').slice(0, 2);
  }

  const compactFamily = relevantFamily.map((m) => ({
    name: m.name,
    role: m.relationship || m.role || 'Dependent',
    condition: m.condition || (Array.isArray(m.conditions) ? m.conditions.join(', ') : 'None')
  }));

  const contextObj = {
    city: primaryReport.city,
    state: primaryReport.admin1 || 'India',
    estimatedNAQI: primaryReport.current.aqi,
    category: primaryReport.current.category,
    dominantPollutant: primaryReport.current.dominant || 'PM2.5',
    dataSourceAndTime: `Open-Meteo CAMS / CPCB NAQI at ${primaryReport.current.time}`,
    bestUpcomingHour: `${primaryReport.bestHour24h.hour} (NAQI ${primaryReport.bestHour24h.aqi}, ${primaryReport.bestHour24h.category})`,
    worstUpcomingHour: `${primaryReport.worstHour24h.hour} (NAQI ${primaryReport.worstHour24h.aqi}, ${primaryReport.worstHour24h.category})`
  };

  if (secondaryReport) {
    contextObj.comparisonCity = {
      city: secondaryReport.city,
      state: secondaryReport.admin1 || 'India',
      estimatedNAQI: secondaryReport.current.aqi,
      category: secondaryReport.current.category,
      dominantPollutant: secondaryReport.current.dominant || 'PM2.5',
      bestUpcomingHour: `${secondaryReport.bestHour24h.hour} (NAQI ${secondaryReport.bestHour24h.aqi}, ${secondaryReport.bestHour24h.category})`
    };
  }

  if (profile?.commute || profile?.cookingType) {
    contextObj.savedProfileSummary = {
      commute: profile.commute || 'Metro',
      cooking: profile.cookingType || 'LPG'
    };
  }

  if (compactFamily.length > 0) {
    contextObj.relevantFamilyMembers = compactFamily;
  }

  return contextObj;
}

/**
 * Returns specific prompt instructions for the classified intent.
 */
export function getIntentInstruction(intentType, aqiReport) {
  const currentCategory = aqiReport?.current?.category || 'Moderate';
  const currentAqi = aqiReport?.current?.aqi ?? 150;
  const isCleanAir = currentAqi <= 100;
  const city = aqiReport?.city || 'your city';

  switch (intentType) {
    case INTENT_TYPES.BUDGET_OPTIONS:
    case INTENT_TYPES.INDOOR_AIR_TIPS:
      return `INTENT INSTRUCTION (INDOOR AIR & BUDGET OPTIONS):
- Answer the user's question directly in the very first sentence without an unprompted AQI greeting or report.
- Give practical steps grouped into Free (₹0), Budget (under ₹1,000), and Premium (₹1,000+), with approximate costs in Indian rupees (₹), effort, and expected benefit, reusing Clean Air Playbook content:
  * Free (₹0): Keep windows closed during rush hour/inversion; damp-mop (pocha) and wet-dust instead of dry sweeping (jhadu); run kitchen exhaust while cooking; seal door bottoms with a rolled damp towel.
  * Budget (under ₹1,000): Seal door/window gaps with rubber weatherstripping tape (approx. ₹250–₹380); wear certified N95/FFP2 masks on bad days (approx. ₹250–₹450 multi-pack); add an electrostatic pre-filter sheet to split AC mesh (approx. ₹380–₹580).
  * Premium (₹1,000+): DIY Corsi-Rosenthal box fan purifier (box fan + MERV-13 filters, approx. ₹2,800–₹3,500) cleans a room well and matches commercial purifiers costing ₹15,000+; single-burner portable induction cooktop (approx. ₹2,000) eliminates indoor gas combustion.
- Add exactly ONE short line linking the advice to today's AQI: for example, today ${city}'s estimated NAQI is ${currentAqi} (${currentCategory}), so ${isCleanAir ? 'opening windows for fresh air ventilation during midday is fine.' : 'keep windows sealed and prioritize indoor damp mopping and filtration.'}`;

    case INTENT_TYPES.AQI_STATUS:
      return `INTENT INSTRUCTION (AQI STATUS):
- Answer directly with the city's current estimated CPCB NAQI number (${currentAqi}), category (${currentCategory}), and dominant pollutant (${aqiReport?.current?.dominant || 'PM2.5'}).
- State the cleanest window (${aqiReport?.bestHour24h?.hour || 'midday'}, AQI ${aqiReport?.bestHour24h?.aqi || 'lower'}) and peak smog window (${aqiReport?.worstHour24h?.hour || 'morning'}, AQI ${aqiReport?.worstHour24h?.aqi || 'higher'}).
- Add at most 2 to 3 concise, practical tips for this AQI level.`;

    case INTENT_TYPES.FORECAST:
      return `INTENT INSTRUCTION (FORECAST):
- Answer directly with the forecast numbers for ${city}.
- Mention the upcoming 24-hour / tomorrow average estimated NAQI (${aqiReport?.tomorrow?.averageAqi || currentAqi}, ${aqiReport?.tomorrow?.category || currentCategory}), cleanest slot (${aqiReport?.tomorrow?.cleanestSlot?.hour || 'midday'}), and peak smog slot (${aqiReport?.tomorrow?.peakSlot?.hour || 'early morning'}).
- Provide 2 to 3 practical tips for planning ahead.`;

    case INTENT_TYPES.PLAN_MY_DAY:
      return `INTENT INSTRUCTION (PLAN MY DAY):
- Directly provide a structured daily routine grouped into Morning, Afternoon, and Evening, tailored to diurnal inversion curves and the user's profile:
  * Morning (early): High inversion smog peak — keep windows closed, avoid strenuous outdoor cardio, commute in enclosed transit (metro/bus).
  * Afternoon (1:00 PM – 3:30 PM): Solar dispersal window — cleanest air window of the day; safest time for outdoor errands, light walks, or brief airing if AQI allows.
  * Evening & Night: Rising ground-level smoke — seal windows, damp-mop floors, use air filtration in bedroom.
- Mention today's estimated NAQI in at most one line as context.`;

    case INTENT_TYPES.MASK_ADVICE:
      return `INTENT INSTRUCTION (MASK ADVICE):
- Start by directly stating which mask to wear: Certified N95 or FFP2 respirators (with headbands or tight earloops).
- Emphasize that cloth masks, dupattas, handkerchiefs, and loose surgical masks do NOT stop microscopic PM2.5 particles because they lack electrostatic meltblown filters and a tight facial seal.
- Give Indian price ranges: certified N95 multi-packs typically cost ₹250–₹450 (approx. ₹50–₹90 per mask). Mention the 4-day brown paper bag rotation method to safely reuse masks for up to 40 hours.
- Add ONE line linking to today's AQI in ${city} (${currentAqi}, ${currentCategory}).`;

    case INTENT_TYPES.KIDS_OR_SENIORS_SAFETY:
      return `INTENT INSTRUCTION (KIDS & SENIORS SAFETY):
- Answer YES, NO, or CONDITIONAL first in the very first sentence!
  (e.g., if AQI is Good/Satisfactory: "Yes, kids/seniors can safely spend time outside today..." / if AQI is Moderate: "Conditionally yes, but keep outdoor play to the afternoon solar window..." / if AQI is Poor/Very Poor/Severe: "No, outdoor play and morning walks should be avoided today...").
- Explain the reasoning using the NAQI category (${currentCategory}, ${currentAqi}) and the vulnerable person's specific sensitivities (such as asthmatic child Beta or senior Dadi).
- If asthma is relevant, remind to keep doctor-prescribed salbutamol rescue inhaler (e.g. Asthalin) nearby.`;

    case INTENT_TYPES.ACTIVITY_SAFETY:
      return `INTENT INSTRUCTION (ACTIVITY SAFETY - RUNNING / SPORTS / WORKOUT):
- Answer YES, NO, or CONDITIONAL first in the very first sentence!
  (e.g., if AQI is Good/Satisfactory: "Yes, it is safe to run/exercise outdoors today..." / if AQI is Moderate: "Conditionally yes, but shift your run to the afternoon window..." / if AQI is Poor or worse: "No, vigorous outdoor running or sports is not safe today...").
- Explain why heavy exertion during smog increases deep lung particulate deposition by 5x to 10x.
- Recommend the best time slot based on diurnal forecast (cleanest slot: ${aqiReport?.bestHour24h?.hour || 'afternoon'}) or suggest indoor exercise alternatives.`;

    case INTENT_TYPES.COMMUTE_OPTIONS:
      return `INTENT INSTRUCTION (COMMUTE OPTIONS):
- Compare transit modes: AC Metro or electric city bus vs two-wheelers/auto-rickshaws vs cars.
- Explain that underground AC metro cabins filter up to 65% of street-level smoke and avoid tailpipe exhaust. On two-wheelers or autos, an N95 mask is essential.
- Reference today's AQI in ${city} in at most one line.`;

    case INTENT_TYPES.HEALTH_SYMPTOM_CONCERN:
      return `INTENT INSTRUCTION (HEALTH SYMPTOMS):
- Respond with a brief, caring tone acknowledging their discomfort.
- State clearly that you are an AI assistant and cannot diagnose conditions or prescribe medications; urge them to consult a qualified doctor.
- Remind them to seek immediate emergency care (call 112 or 108) if experiencing severe breathlessness, chest tightness, or blueness of lips/fingers.
- Suggest practical indoor palliative steps: rest indoors with sealed windows, stay hydrated, use steam inhalation with plain water, and keep prescribed inhalers handy. Never recommend or alter medicines.`;

    case INTENT_TYPES.COMPARISON_BETWEEN_CITIES:
      return `INTENT INSTRUCTION (CITY COMPARISON):
- Directly compare the AQI numbers, categories, and dominant pollutants between the cities.
- Explicitly state which city is currently cleaner and safer.
- Provide a 1-line actionable conclusion for someone traveling between them.`;

    case INTENT_TYPES.OFF_TOPIC:
      return `INTENT INSTRUCTION (OFF-TOPIC):
- Politely decline: state in 1 sentence that Foggy is dedicated to air quality, respiratory health, and smog safety for Indian households.
- Offer 2 specific air quality topics Foggy can help with (e.g., "I can check your city's live AQI and forecast, or share budget-friendly hacks to clean your indoor air").`;

    case INTENT_TYPES.ABOUT_FOGGY:
      return `INTENT INSTRUCTION (ABOUT FOGGY):
- Concisely explain that Foggy is a friendly, evidence-based GenAI assistant built for Indian families to navigate seasonal winter smog and urban air pollution.
- Explain that Foggy uses live satellite and CPCB atmospheric data combined with household vulnerability profiles to deliver personalized, budget-friendly air defense guidance.`;

    case INTENT_TYPES.SMALL_TALK:
    default:
      return `INTENT INSTRUCTION (GENERAL / SMALL TALK):
- Answer warmly and concisely in 1 to 2 sentences.
- Ask how you can help them protect their home or plan their day around today's air quality.
- Do NOT output an unrequested full AQI report.`;
  }
}

/**
 * Builds the compact system prompt: persona, tone, core rules ONLY.
 */
export function buildSystemPrompt({ isHindi = false, isHinglish = false } = {}) {
  const langRule = isHindi
    ? 'Reply in Hindi (हिन्दी).'
    : isHinglish
    ? 'Reply in Hinglish (conversational Hindi in Roman script).'
    : 'Reply in English.';

  return `You are Foggy, a knowledgeable, empathetic, practical, and reassuring GenAI companion designed for Indian households navigating severe air pollution, seasonal winter smog, and urban particulates.

CORE DIRECTIVES (STRICT):
1. CORE RULE:
   - Answer the user's question first and directly. Use the air quality data only when it helps answer the question, and mention it in at most one short line. Never open with a greeting after the first message of a conversation. Never repeat the AQI report unless the user asks for the AQI.
   - Do NOT use a rigid "Recommended Safeguards" or "Provided Live Air Quality Data" template.
2. ANSWER FORMAT:
   - Start with 1 to 2 direct answering sentences.
   - Follow with at most 3 to 5 short, high-impact bullet points or steps.
   - For budget/cleaning questions: group steps into Free (₹0), Budget (under ₹1,000), and Premium (₹1,000+) using Indian market estimates.
   - For activity/kids/seniors safety: start with Yes, No, or Conditional first.
3. GREETING RULES:
   - NEVER open with a greeting ("Hello", "Hi", "Welcome") after the first message of a conversation.
   - On the first message, ONLY include a brief one-line greeting if the user gave a greeting; otherwise jump straight into the direct answer!
4. ACCURACY & CONTEXT:
   - Only quote AQI numbers that are present in the provided JSON context. Never invent numbers.
   - Always use Indian context and Indian Rupees (₹). Never mention dollars ($).
   - Language: ${langRule}
5. MEDICAL SAFETY:
   - Foggy is an AI assistant, not a doctor. Never prescribe, diagnose, or recommend medication changes.
   - Refer to doctor-prescribed salbutamol rescue inhaler (e.g. Asthalin) if asthma is relevant.
   - In emergencies, state to call 112 or 108.
   - End medical symptom responses with: "> 🩺 *Medical disclaimer: Foggy is an AI assistant, not a doctor. In a medical emergency, call 112 or 108.*"`;
}

/**
 * Wraps user message with compact context block and intent instructions.
 */
export function buildUserMessageWithContext({ message, compactContext, intentInstruction }) {
  return `CONTEXT (Air Quality & Household Data):
\`\`\`json
${JSON.stringify(compactContext, null, 2)}
\`\`\`

${intentInstruction}

USER QUESTION:
${message}`;
}

/**
 * Smart Fallback Generator tailored to the exact intent.
 * Used when Gemini is offline, disabled, or fails.
 */
export function generateIntentFallback({
  intentType,
  primaryReport,
  cityReports = [],
  profile = {},
  message = '',
  timeframe = 'now',
  isHindi = false,
  isHinglish = false
}) {
  const city = primaryReport?.city || 'Kolkata';
  const aqi = primaryReport?.current?.aqi ?? 35;
  const category = primaryReport?.current?.category || 'Good';
  const dominant = primaryReport?.current?.dominant || 'PM2.5';
  const time = primaryReport?.current?.time || '14:00 IST';
  const cleanestHour = primaryReport?.bestHour24h?.hour || '14:00';
  const cleanestAqi = primaryReport?.bestHour24h?.aqi ?? aqi;
  const worstHour = primaryReport?.worstHour24h?.hour || '02:00';
  const worstAqi = primaryReport?.worstHour24h?.aqi ?? 90;
  const isClean = aqi <= 100;
  const lowerMsg = (message || '').toLowerCase();

  switch (intentType) {
    case INTENT_TYPES.BUDGET_OPTIONS:
    case INTENT_TYPES.INDOOR_AIR_TIPS: {
      return (
        `You can improve your indoor air a lot without spending much.\n\n` +
        `* **Free (₹0):** Keep windows closed during peak traffic hours, damp-mop (pocha) and wet-dust instead of dry sweeping (jhadu), and run the kitchen exhaust fan while cooking.\n` +
        `* **Budget (under ₹1,000):** Seal door and window gaps with rubber draught strips (~₹250–₹380) and wear certified N95 masks on bad days (~₹300 multi-pack).\n` +
        `* **Premium (₹1,000+):** A DIY Corsi-Rosenthal box (a box fan with MERV-13 filters, ~₹2,800–₹3,500) costs a few thousand rupees and cleans a room well, matching ₹15,000+ commercial purifiers.\n\n` +
        `Today ${city}'s air is ${category} (estimated NAQI ${aqi}), so ${
          isClean ? 'opening windows for a while is fine.' : 'keep windows sealed and prioritize indoor damp mopping and filtration.'
        }`
      );
    }

    case INTENT_TYPES.KIDS_OR_SENIORS_SAFETY: {
      if (isClean) {
        return (
          `Yes, kids and seniors can safely play and walk outside today in ${city}.\n\n` +
          `* Today's air quality is **${category}** with an estimated NAQI of **${aqi}**.\n` +
          `* For children with asthma (like Beta), always keep their doctor-prescribed salbutamol rescue inhaler (such as Asthalin) accessible as a routine precaution.\n` +
          `* Encourage regular hydration during outdoor play.`
        );
      }
      return (
        `No, outdoor play and early morning walks should be avoided today in ${city}.\n\n` +
        `* Today's air quality is **${category}** with an estimated NAQI of **${aqi}**.\n` +
        `* Swap outdoor play for indoor activities like board games, reading, or indoor stretching.\n` +
        `* For children with asthma (like Beta) or seniors with hypertension (like Dadi), keep doctor-prescribed rescue inhalers handy and wear a fitted N95 mask if stepping out.`
      );
    }

    case INTENT_TYPES.MASK_ADVICE: {
      return (
        `Wear a certified **N95 or FFP2 respirator** when traveling outdoors in smoggy air.\n\n` +
        `* **Why certified:** Cloth masks, handkerchiefs, and loose surgical masks do not form an airtight facial seal and let fine PM2.5 particulates pass right through.\n` +
        `* **Indian price range:** Certified N95 multi-packs typically cost ₹250–₹450 in India (approx. ₹50–₹90 per mask).\n` +
        `* **Rotation method:** Rotate 4 masks across 4 breathable brown paper bags Monday through Thursday so moisture dries safely, extending mask life up to 40 hours.\n\n` +
        `Today ${city}'s estimated NAQI is **${aqi} (${category})**.`
      );
    }

    case INTENT_TYPES.PLAN_MY_DAY: {
      return (
        `Here is your low-pollution day plan for ${city} (today's estimated NAQI is ${aqi}, ${category}):\n\n` +
        `* **Morning (6:00 – 9:30 AM):** Ground-level inversion traps vehicular smoke — keep windows sealed and commute via Metro or closed bus.\n` +
        `* **Afternoon (1:00 – 3:30 PM):** Cleanest window of the day due to solar dispersal — best time for outdoor errands and brief ventilation.\n` +
        `* **Evening & Night (7:00 – 10:00 PM):** Traffic smog rises — keep windows shut, wet-mop floors, and run indoor air filtration.`
      );
    }

    case INTENT_TYPES.ACTIVITY_SAFETY: {
      const isTomorrow = timeframe === 'tomorrow' || lowerMsg.includes('tomorrow') || lowerMsg.includes('kal');
      if (isTomorrow) {
        const tomorrowAqi = primaryReport?.tomorrow?.averageAqi ?? aqi;
        const tomorrowCat = primaryReport?.tomorrow?.category ?? category;
        const tomorrowCleanest = primaryReport?.tomorrow?.cleanestSlot?.hour || '14:00';
        const tomorrowCleanestAqi = primaryReport?.tomorrow?.cleanestSlot?.aqi || cleanestAqi;
        const tomorrowPeak = primaryReport?.tomorrow?.peakSlot?.hour || '07:00';
        const tomorrowPeakAqi = primaryReport?.tomorrow?.peakSlot?.aqi || worstAqi;

        if (tomorrowAqi > 100) {
          return (
            `No, running outdoors tomorrow morning in ${city} is not recommended due to winter morning inversion trapping smog at ground level.\n\n` +
            `* Tomorrow's forecast average estimated NAQI is **${tomorrowAqi} (${tomorrowCat})**.\n` +
            `* Morning around ${tomorrowPeak} is projected to be the peak smog slot (AQI ${tomorrowPeakAqi}).\n` +
            `* If you want to exercise outdoors, shift your run to the afternoon solar dispersal window around ${tomorrowCleanest} (AQI ${tomorrowCleanestAqi}), or do an indoor workout.`
          );
        }
        return (
          `Yes, it is conditionally safe to run tomorrow morning in ${city}, as air quality is forecast to remain in the ${tomorrowCat} zone (average estimated NAQI ${tomorrowAqi}).\n\n` +
          `* Morning hours around ${tomorrowPeak} may carry brief surface haze, so listen to your body.\n` +
          `* The cleanest air slot tomorrow will be around ${tomorrowCleanest} (AQI ${tomorrowCleanestAqi}).\n` +
          `* Stay well-hydrated and avoid running alongside heavy diesel traffic corridors.`
        );
      }

      if (isClean) {
        return (
          `Yes, it is safe to run or exercise outdoors today in ${city}.\n\n` +
          `* Current estimated NAQI is **${aqi} (${category})** at ${time}, which is in the safe zone for outdoor workouts.\n` +
          `* The cleanest window today is around ${cleanestHour} (AQI ${cleanestAqi}).\n` +
          `* Stay well-hydrated before and after your run.`
        );
      }
      return (
        `No, outdoor running is not recommended when ${city}'s estimated NAQI is **${aqi} (${category})**.\n\n` +
        `* Vigorous cardio increases deep lung intake of PM2.5 by 5x to 10x.\n` +
        `* Shift to indoor workouts, treadmill, yoga, or indoor bodyweight training.\n` +
        `* If you must exercise outdoors, shift to the cleanest solar window around ${cleanestHour}.`
      );
    }

    case INTENT_TYPES.COMMUTE_OPTIONS: {
      return (
        `For commuting in ${city} today, choose the **AC Metro or electric city bus** over open two-wheelers or autos.\n\n` +
        `* AC transit cabins filter up to 65% of street-level smoke and avoid direct tailpipe exposure.\n` +
        `* If commuting on a bike or two-wheeler, wear a well-fitted N95 mask.\n` +
        `* Today ${city}'s estimated NAQI is **${aqi} (${category})**.`
      );
    }

    case INTENT_TYPES.HEALTH_SYMPTOM_CONCERN: {
      return (
        `I'm sorry you are experiencing respiratory symptoms. Please consult a qualified doctor or healthcare professional for a medical assessment.\n\n` +
        `* If you or a family member experience severe breathlessness, chest tightness, or blue lips, call emergency services (**112 or 108**) immediately.\n` +
        `* Stay indoors in a closed room with air filtration and avoid incense or cooking smoke.\n` +
        `* Sip warm water and use plain steam inhalation to soothe airway irritation.\n\n` +
        `> 🩺 *Medical disclaimer: Foggy is an AI assistant, not a doctor. In a medical emergency, call 112 or 108.*`
      );
    }

    case INTENT_TYPES.COMPARISON_BETWEEN_CITIES: {
      const repA = primaryReport;
      const repB = cityReports && cityReports.length > 1 ? cityReports[1] : null;
      if (repB) {
        const aqiA = repA.current.aqi;
        const aqiB = repB.current.aqi;
        const cleaner = aqiA <= aqiB ? repA : repB;
        const morePolluted = aqiA <= aqiB ? repB : repA;
        return (
          `**${cleaner.city}** is currently cleaner and safer than **${morePolluted.city}**.\n\n` +
          `* **${repA.city}:** Estimated NAQI **${aqiA} (${repA.current.category})**, dominant pollutant ${repA.current.dominant}.\n` +
          `* **${repB.city}:** Estimated NAQI **${aqiB} (${repB.current.category})**, dominant pollutant ${repB.current.dominant}.\n\n` +
          `If planning outdoor activities or travel, ${cleaner.city} has significantly better air quality right now.`
        );
      }
      return (
        `Currently, **${city}** has an estimated NAQI of **${aqi} (${category})**.\n\n` +
        `To compare cities, please specify two locations (e.g. "Delhi vs Mumbai").`
      );
    }

    case INTENT_TYPES.OFF_TOPIC: {
      return (
        `I focus specifically on air quality, respiratory health, and healthy home strategies for Indian families.\n\n` +
        `I can help you with:\n` +
        `* Checking live AQI numbers and 24-hour smog forecasts for your city.\n` +
        `* Budget-friendly tips to clean your indoor air and DIY purifiers.`
      );
    }

    case INTENT_TYPES.ABOUT_FOGGY: {
      return (
        `I'm **Foggy**, your friendly air quality and smog companion! I use live CPCB-standard data and household sensitivity profiles to give you practical, budget-friendly ways to protect your family from pollution.`
      );
    }

    case INTENT_TYPES.FORECAST: {
      const tomorrowAqi = primaryReport?.tomorrow?.averageAqi ?? aqi;
      const tomorrowCat = primaryReport?.tomorrow?.category ?? category;
      return (
        `For **${city}**, tomorrow's average estimated NAQI is forecast around **${tomorrowAqi} (${tomorrowCat})**.\n\n` +
        `* **Cleanest slot tomorrow:** ${primaryReport?.tomorrow?.cleanestSlot?.hour || 'midday'} (AQI ${primaryReport?.tomorrow?.cleanestSlot?.aqi || cleanestAqi})\n` +
        `* **Peak smog slot tomorrow:** ${primaryReport?.tomorrow?.peakSlot?.hour || 'morning'} (AQI ${primaryReport?.tomorrow?.peakSlot?.aqi || worstAqi})\n` +
        `* Plan outdoor errands for the midday solar dispersal window.`
      );
    }

    case INTENT_TYPES.AQI_STATUS:
    default: {
      if (isHindi) {
        return (
          `**${city}** में ${time} पर अनुमानित CPCB NAQI **${aqi} (${category})** है, प्रमुख प्रदूषक **${dominant}** के साथ।\n\n` +
          `* **सबसे स्वच्छ समय:** ${cleanestHour} (AQI ${cleanestAqi}, ${primaryReport?.bestHour24h?.category || 'Good'})\n` +
          `* **अधिकतम प्रदूषण:** ${worstHour} (AQI ${worstAqi}, ${primaryReport?.worstHour24h?.category || 'Satisfactory'})\n` +
          `* ${isClean ? 'आज सामान्य बाहरी गतिविधियों के लिए हवा सुरक्षित है।' : 'प्रदूषण के चरम समय में N95 मास्क पहनने पर विचार करें।'}`
        );
      }
      if (isHinglish) {
        return (
          `**${city}** mein aaj ${time} par estimated CPCB NAQI **${aqi} (${category})** hai, dominant pollutant **${dominant}** ke sath.\n\n` +
          `* **Cleanest window:** ${cleanestHour} (AQI ${cleanestAqi}, ${primaryReport?.bestHour24h?.category || 'Good'})\n` +
          `* **Peak smog window:** ${worstHour} (AQI ${worstAqi}, ${primaryReport?.worstHour24h?.category || 'Satisfactory'})\n` +
          `* ${isClean ? 'Air quality safe hai normal outdoor activities ke liye.' : 'Peak smog hours ke dauran N95 mask pehanne par dhyan dein.'}`
        );
      }
      return (
        `In **${city}**, the current estimated CPCB NAQI is **${aqi} (${category})** as of ${time}, with **${dominant}** as the dominant pollutant.\n\n` +
        `* **Cleanest window:** ${cleanestHour} (AQI ${cleanestAqi}, ${primaryReport?.bestHour24h?.category || 'Good'})\n` +
        `* **Peak smog window:** ${worstHour} (AQI ${worstAqi}, ${primaryReport?.worstHour24h?.category || 'Satisfactory'})\n` +
        `* ${isClean ? 'Air quality is safe for normal outdoor activities today.' : 'Consider wearing an N95 mask during peak smog hours.'}`
      );
    }
  }
}
