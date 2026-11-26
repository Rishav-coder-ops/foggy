// shared/chatIntent/intentInstructions.js
/**
 * @fileoverview Domain instructions for each chat intent type.
 */

import { INTENT_TYPES } from './intentTypes.js';

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
- Directly provide a structured daily routine grouped into Morning, Afternoon, and Evening, tailored to diurnal inversion curves and the user's profile.
- Format each time period as a distinct bullet point or separated section:
  * **Morning (High Smog Peak):** Keep windows closed, avoid strenuous outdoor cardio, commute in enclosed transit (metro/bus).
  * **Afternoon (Solar Dispersal Window):** Cleanest air window of the day; safest time for essential errands or brief airing if AQI allows.
  * **Evening & Night (Rising Smog):** Seal windows, damp-mop floors, use air filtration in bedroom.
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
