// src/utils/carePlanEngine.js
// Deterministic rule engine for personalized "Today's Care Plan" based on
// official Indian CPCB National Air Quality Index (NAQI) categories,
// 3-hour diurnal inversion slots, individual respiratory vulnerabilities,
// commute methods, and lifestyle habits.

export const CPCB_CATEGORIES = {
  GOOD: 'Good',
  SATISFACTORY: 'Satisfactory',
  MODERATE: 'Moderate',
  POOR: 'Poor',
  VERY_POOR: 'Very Poor',
  SEVERE: 'Severe'
};

/**
 * Generates an individualized today's care plan based on CPCB AQI, age, health vulnerability, commute, and lifestyle.
 * Strictly avoids prescription advice and maintains clinical safety guardrails.
 * @param {object} [member={}] - Member profile.
 * @param {object} [aqiMetrics={}] - Live or forecast AQI payload.
 * @returns {object} Care plan containing timeSlots, safeguards, alerts, and lifestyle tips.
 */
export function generateMemberCarePlan(member = {}, aqiMetrics = {}) {
  const category = aqiMetrics.category || CPCB_CATEGORIES.MODERATE;
  const aqi = typeof aqiMetrics.aqi === 'number' ? aqiMetrics.aqi : 165;
  const memberName = member.name || 'Family Member';
  const age = Number(member.age) || 30;
  const conditions = Array.isArray(member.conditions)
    ? member.conditions
    : [member.condition || 'None'];
  const sensitivity = member.sensitivity || 'Moderate';
  const commute = Array.isArray(member.commute) ? member.commute : [];
  const lifestyle = Array.isArray(member.lifestyle) ? member.lifestyle : [];
  const isPet = (member.relationship || '').toLowerCase().trim() === 'pet';

  const isAsthmatic = conditions.some((c) => /asthma/i.test(c));
  const hasCardiac = conditions.some((c) => /heart|hypertension|cardio/i.test(c));
  const hasCOPD = conditions.some((c) => /copd|bronchitis/i.test(c));
  const isPregnant = conditions.some((c) => /pregnancy/i.test(c));
  const isChild = !isPet && age <= 12;
  const isSenior = !isPet && age >= 60;
  const isJogger = lifestyle.some((l) => /jog|run|exercise outdoors|sports|cricket/i.test(l));
  const isWalker = lifestyle.some((l) => /morning walk|walk/i.test(l));

  // 1. Time-slotted 3-hour diurnal routine
  const timeSlots = [];

  // Morning Slot (6:00 AM – 10:00 AM) - Inversion Layer Peak
  let morningGuidance = '';
  let morningLifestyle = '';
  if (category === CPCB_CATEGORIES.GOOD || category === CPCB_CATEGORIES.SATISFACTORY) {
    morningGuidance =
      'Favorable atmospheric conditions. Open windows for 30–45 mins to clear indoor stale air.';
    morningLifestyle =
      isJogger || isWalker
        ? 'Optimal time for morning outdoor jog or brisk walk.'
        : 'Safe for regular morning outdoor activities.';
  } else if (category === CPCB_CATEGORIES.MODERATE) {
    morningGuidance =
      'Morning ground-level temperature inversion traps smoke. Keep street-facing windows shut until 9:30 AM.';
    morningLifestyle =
      isJogger || isWalker
        ? 'Shift intense cardio past 10:00 AM once solar heating disperses trapped ground particulates.'
        : 'Maintain moderate pace; carry drinking water.';
  } else {
    // Poor, Very Poor, Severe
    morningGuidance =
      'Severe ground inversion layer. Keep all doors, windows, and balcony vents sealed tight. Run indoor air purifiers.';
    morningLifestyle =
      isJogger || isWalker
        ? 'STRICT: Do not run or jog outdoors. Substitute with indoor yoga, bodyweight stretching, or treadmill exercises in a closed room.'
        : 'Avoid all outdoor exposure; remain indoors.';
  }
  timeSlots.push({
    slot: 'Morning (6:00 AM – 10:00 AM)',
    forecastBadge: category === CPCB_CATEGORIES.GOOD ? 'Clean Window' : 'Inversion Peak',
    guidance: morningGuidance,
    lifestyleAdjustment: morningLifestyle
  });

  // Afternoon Slot (11:00 AM – 4:00 PM) - Solar Dispersal Window
  let afternoonGuidance = '';
  let afternoonLifestyle = '';
  if (category === CPCB_CATEGORIES.GOOD || category === CPCB_CATEGORIES.SATISFACTORY) {
    afternoonGuidance =
      'Low particulate concentration. Ideal time for natural whole-house cross-ventilation.';
    afternoonLifestyle = 'Full unrestricted outdoor transit and routine tasks.';
  } else if (category === CPCB_CATEGORIES.MODERATE || category === CPCB_CATEGORIES.POOR) {
    afternoonGuidance =
      'Solar heating expands the boundary mixing layer, offering the day’s best particulate dispersal window.';
    afternoonLifestyle =
      isSenior || isWalker
        ? 'Recommended time window for necessary grocery errands or garden strolls.'
        : 'Best window for outdoor commutes if unavoidable.';
  } else {
    afternoonGuidance =
      'Even during peak solar dispersal, PM2.5 remains hazardous. Continue indoor air circulation only.';
    afternoonLifestyle =
      'Limit outdoor trips to urgent necessities only with certified respirator.';
  }
  timeSlots.push({
    slot: 'Afternoon (11:00 AM – 4:00 PM)',
    forecastBadge: 'Solar Mixing Window',
    guidance: afternoonGuidance,
    lifestyleAdjustment: afternoonLifestyle
  });

  // Evening / Night Slot (5:00 PM – 10:00 PM) - Traffic & Temperature Re-inversion
  let eveningGuidance = '';
  let eveningLifestyle = '';
  if (category === CPCB_CATEGORIES.GOOD || category === CPCB_CATEGORIES.SATISFACTORY) {
    eveningGuidance = 'Gentle evening breeze. Baseline comfortable indoor conditions.';
    eveningLifestyle = isPet
      ? 'Safe for extended evening dog walks.'
      : 'Pleasant evening outdoor time.';
  } else if (category === CPCB_CATEGORIES.MODERATE || category === CPCB_CATEGORIES.POOR) {
    eveningGuidance =
      'Sunset triggers nocturnal inversion. Traffic emissions accumulate at street level. Seal windows before 6:00 PM.';
    eveningLifestyle = isPet
      ? 'Keep dog walks brief (<15 mins) and wipe coat and paws with a damp cloth afterward.'
      : 'Conclude outdoor activities before dark.';
  } else {
    eveningGuidance =
      'Critical particulate accumulation. Roll damp towels under exterior door thresholds to prevent outdoor smoke seepage.';
    eveningLifestyle = isPet
      ? 'Restrict pets to indoor pee pads or a 3-minute quick relief in a sheltered doorway.'
      : 'Strictly remain in an air-filtered clean room.';
  }
  timeSlots.push({
    slot: 'Evening / Night (5:00 PM – 10:00 PM)',
    forecastBadge: 'Evening Smog Spike',
    guidance: eveningGuidance,
    lifestyleAdjustment: eveningLifestyle
  });

  // 2. Actionable Do's & Don'ts
  const doList = [];
  const avoidList = [];

  if (category === CPCB_CATEGORIES.GOOD || category === CPCB_CATEGORIES.SATISFACTORY) {
    doList.push('Aerate indoor living spaces thoroughly through open windows.');
    doList.push('Engage in outdoor sports, workouts, and cricket practices freely.');
    doList.push('Stay well-hydrated with 2.5 to 3 liters of water throughout the day.');
    avoidList.push('Avoid indoor burning of mosquito coils or incense sticks (agarbatti).');
  } else if (category === CPCB_CATEGORIES.MODERATE) {
    doList.push('Wear a certified N95 / FFP2 mask during transit along heavy vehicular roads.');
    doList.push('Wet-mop floors daily; avoid dry dusting or brooms (jhadu) that resuspend PM10.');
    doList.push(
      'Ventilate strictly during the afternoon solar dispersal window (1:00 PM – 3:30 PM).'
    );
    avoidList.push(
      'Avoid strenuous cardio or jogging during early morning hours (6:00 – 9:00 AM).'
    );
    avoidList.push(
      'Avoid standing near outdoor street food stalls with open coal/wood combustion.'
    );
  } else {
    // Poor, Very Poor, Severe
    doList.push(
      'Run DIY Corsi-Rosenthal box fan filters or HEPA purifiers continuously in bedrooms.'
    );
    doList.push('Seal door gaps with rolled damp towels to cut toxic particulate drafts by 40%.');
    doList.push('Fit a certified tight-seal N95/FFP2 respirator whenever stepping outside.');
    doList.push('Gargle with warm saline water and rinse eyes after any outdoor exposure.');
    avoidList.push('NEVER exercise, jog, or play cricket outdoors in this AQI category.');
    avoidList.push('Do NOT open windows or balcony doors, regardless of stuffiness.');
    avoidList.push('Avoid open frying (tadka/chhonk) without kitchen exhaust extraction.');
  }

  // 3. Mask Advice
  let maskAdvice = '';
  if (category === CPCB_CATEGORIES.GOOD || category === CPCB_CATEGORIES.SATISFACTORY) {
    maskAdvice =
      'Masks are not required for general outdoor activity under current clean air conditions.';
  } else if (category === CPCB_CATEGORIES.MODERATE) {
    maskAdvice =
      sensitivity === 'High' || isAsthmatic || isChild || isSenior
        ? 'A snug N95 / FFP2 mask is strongly recommended for outdoor transit along arterial traffic roads.'
        : 'Consider an N95 mask if sensitive to dust, construction plumes, or prolonged outdoor commutes.';
  } else {
    maskAdvice =
      'Certified N95 / FFP2 respirator is mandatory outdoors. Standard surgical and cloth masks cannot filter fine PM2.5 particulates.';
  }

  // 4. Commute Tips
  const commuteTips = [];
  if (commute.includes('Metro') || commute.includes('Train')) {
    commuteTips.push(
      'Metro is your cleanest commute: underground stations filter ambient air and avoid street-level exhaust.'
    );
  }
  if (commute.includes('Two-wheeler') || commute.includes('Cycle')) {
    commuteTips.push(
      'Two-wheelers and cycling have high inhalation exposure: wear an N95 respirator firmly and avoid tailgating diesel buses.'
    );
  }
  if (commute.includes('Car')) {
    commuteTips.push(
      'In cars: keep windows rolled up and switch air conditioner mode strictly to Recirculation (air filter loop).'
    );
  }
  if (
    commute.includes('Walk') &&
    (category === CPCB_CATEGORIES.POOR ||
      category === CPCB_CATEGORIES.VERY_POOR ||
      category === CPCB_CATEGORIES.SEVERE)
  ) {
    commuteTips.push(
      'Pedestrians: choose quieter residential secondary lanes over major commercial corridors with heavy truck and bus exhaust.'
    );
  }

  // 5. Condition-Specific Reminders
  const conditionReminders = [];
  if (isAsthmatic) {
    conditionReminders.push(
      'Asthma Safeguard: Keep your doctor-prescribed salbutamol rescue inhaler (for example Asthalin) immediately accessible at all times. Do not alter prescribed preventative inhalers.'
    );
  }
  if (hasCardiac) {
    conditionReminders.push(
      'Cardiovascular Caution: High PM2.5 triggers systemic arterial inflammation and blood pressure spikes. Avoid heavy lifting and cold-morning exertion.'
    );
  }
  if (hasCOPD) {
    conditionReminders.push(
      'COPD Action Plan: Stay strictly in a filtered room; verify pulse oximeter readings as advised by your physician.'
    );
  }
  if (isPregnant) {
    conditionReminders.push(
      'Maternal Health: Fine PM2.5 crosses placental barriers. Prioritize filtered clean-room rest and avoid high-traffic exposure.'
    );
  }
  if (isChild) {
    conditionReminders.push(
      'Child Respiratory Care: Children breathe 50% more air per pound of body weight than adults. Swap outdoor playtime for indoor drawing, board games, or reading.'
    );
  }
  if (isSenior) {
    conditionReminders.push(
      'Senior Care: Shift all daily walking routines to the afternoon solar window, and avoid early morning exposure when air density is thickest.'
    );
  }

  // 6. Hydration
  const hydrationAdvice =
    'Drink 2.5 to 3 liters of warm water, herbal tea, or warm lemon water daily. Adequate hydration maintains the mucosal ciliary lining of the respiratory tract, helping clear inhaled particulates.';

  // 7. Medical Trigger
  const medicalHelpTrigger =
    'Seek immediate medical care or call 112 if experiencing acute breathlessness, continuous unyielding coughing, bluish lips or nailbeds (cyanosis), severe chest constriction, or confusion.';

  return {
    memberName,
    relationship: member.relationship || 'Dependent',
    category,
    aqi,
    city: member.city || 'Kolkata',
    state: member.state || 'West Bengal',
    timeSlots,
    doList,
    avoidList,
    maskAdvice,
    indoorAirSteps: [
      'Operate Corsi-Rosenthal box filters or HEPA purifiers on medium speed.',
      'Maintain indoor relative humidity between 40% and 55% to settle suspended dust.',
      'Avoid dry sweeping (jhadu); clean exclusively with damp microfiber mops.'
    ],
    commuteTips,
    conditionReminders,
    hydrationAdvice,
    medicalHelpTrigger,
    disclaimer:
      'Foggy is an educational AI assistant, not a doctor. Never recommend or alter prescribed medications. In a medical emergency, call 112 immediately.'
  };
}
