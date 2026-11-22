// shared/chatIntent/fallbackGenerator.js
/**
 * @fileoverview Offline smart fallback responses tailored by intent type.
 */

import { INTENT_TYPES } from './intentTypes.js';

export function extractUserContextEntities(message = '', profile = {}) {
  const text = (message || '').toLowerCase();

  // Person
  let person = null;
  if (/\b(father|dad|pitaji|papa)\b/i.test(text)) person = 'father';
  else if (/\b(mother|mom|mataji|mummy)\b/i.test(text)) person = 'mother';
  else if (/\b(child|kid|son|daughter|baby|beta|beti)\b/i.test(text)) person = 'child';
  else if (/\b(dadi|grandma|grandmother|nani)\b/i.test(text)) person = 'grandmother';
  else if (/\b(dada|grandpa|grandfather|nana)\b/i.test(text)) person = 'grandfather';
  else if (/\b(senior|seniors|elder|elderly|parent|parents)\b/i.test(text))
    person = 'senior family member';

  // Condition
  let condition = null;
  if (/\bcopd\b/i.test(text)) condition = 'COPD';
  else if (/\basthma\b/i.test(text)) condition = 'asthma';
  else if (/\bbronchitis\b/i.test(text)) condition = 'bronchitis';
  else if (/\b(heart|cardiac|hypertension|bp)\b/i.test(text))
    condition = 'heart condition/hypertension';
  else if (/\b(allergy|allergies)\b/i.test(text)) condition = 'respiratory allergies';

  // Activity
  let activity = null;
  if (/\b(walks?|walking|sair)\b/i.test(text)) activity = 'walks';
  else if (/\b(run|running|jog|jogging|daudna)\b/i.test(text)) activity = 'running/jogging';
  else if (/\b(play|playing|outdoor play|cricket|sports)\b/i.test(text)) activity = 'outdoor play';
  else if (/\b(cycling|cycle)\b/i.test(text)) activity = 'cycling';

  // Timing
  let timing = null;
  if (/\bevening\b/i.test(text)) timing = 'evening';
  else if (/\bmorning\b/i.test(text)) timing = 'early morning';
  else if (/\bnight\b/i.test(text)) timing = 'night';

  // Setting / location
  let locationDetail = null;
  if (/\b(river|riverbank|river side|lake|water)\b/i.test(text)) locationDetail = 'near the river';
  else if (/\b(park|garden)\b/i.test(text)) locationDetail = 'in the park';
  else if (/\b(road|highway|traffic)\b/i.test(text)) locationDetail = 'near heavy traffic roads';

  // If no person was explicitly in message, check profile family members
  if (!person && Array.isArray(profile?.familyMembers) && profile.familyMembers.length > 0) {
    const vulnerable = profile.familyMembers.find((m) => m.condition && m.condition !== 'None');
    if (vulnerable) {
      person = vulnerable.relationship || vulnerable.name;
      condition = condition || vulnerable.condition;
    }
  }

  return { person, condition, activity, timing, locationDetail };
}

export function generateIntentFallback({
  intentType,
  primaryReport,
  cityReports = [],
  _profile = {},
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
          isClean
            ? 'opening windows for a while is fine.'
            : 'keep windows sealed and prioritize indoor damp mopping and filtration.'
        }`
      );
    }

    case INTENT_TYPES.KIDS_OR_SENIORS_SAFETY: {
      const entities = extractUserContextEntities(message, _profile);
      if (
        entities.condition ||
        entities.timing ||
        entities.locationDetail ||
        (entities.person && entities.person !== 'child')
      ) {
        const subject = entities.person
          ? `your ${entities.person}${entities.condition ? ` living with ${entities.condition}` : ''}`
          : `anyone living with ${entities.condition || 'respiratory vulnerability'}`;
        const timeLoc = [entities.timing, entities.locationDetail].filter(Boolean).join(' ');
        const walkActivity = entities.activity || 'outdoor walks';

        return (
          `For ${subject}, here are the recommended changes to ${entities.activity ? `their ${entities.activity}` : 'daily routine'} in ${city} (current estimated NAQI ${aqi}, ${category}):\n\n` +
          `* **Timing Adjustment:** Shift ${timeLoc || 'outdoor'} ${walkActivity} away from ${entities.timing || 'evening / early morning'} hours to the warmest afternoon window (1:00 PM – 3:30 PM). Cooler temperatures trap surface pollution and vehicle exhaust, whereas afternoon sunlight aids air dispersion.\n` +
          (entities.locationDetail
            ? `* **Location Caution:** Riverbanks and low-lying water bodies can trap high relative humidity and riverine inversion fog, which holds heavy PM2.5 particulates. Avoid walking right at the water's edge during twilight or misty hours.\n`
            : `* **Route Selection:** Choose open, green residential colonies or paved walking tracks away from major vehicular corridors and construction dust.\n`) +
          `* **Respiratory Protection & Medication:** Always keep their doctor-prescribed rescue inhaler (such as a bronchodilator) immediately accessible during outings. If stepping out when air is ${category}, wear a snug, certified N95 respirator.\n` +
          `* **Indoor Alternative:** On days when smog is elevated, swap outdoor ${walkActivity} for gentle indoor pacing, seated breathing exercises, or indoor yoga in a room with windows closed and damp-mopped floors.\n\n` +
          `> 🩺 *Medical disclaimer: Foggy is an AI assistant, not a doctor. Consult his physician before changing physical exercise limits, and call 112 in a medical emergency.*`
        );
      }

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
      const isTomorrow =
        timeframe === 'tomorrow' || lowerMsg.includes('tomorrow') || lowerMsg.includes('kal');
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
      return `I'm **Foggy**, your friendly air quality and smog companion! I use live CPCB-standard data and household sensitivity profiles to give you practical, budget-friendly ways to protect your family from pollution.`;
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
