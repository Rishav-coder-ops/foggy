// shared/chatIntent/intentClassifier.js
/**
 * @fileoverview Robust intent classification for user messages.
 */

import { INTENT_TYPES } from './intentTypes.js';

export function classifyIntent(message, history = []) {
  if (!message || typeof message !== 'string') {
    return INTENT_TYPES.SMALL_TALK;
  }

  const raw = message.trim();
  const text = raw.toLowerCase();

  // 1. Off-topic check (strictly unrelated topics)
  if (
    /\b(python|javascript|typescript|java\b|c\+\+|html|css|sql query|regex|react|algorithm|function write|write code|coding problem|hack|exploit)\b/i.test(
      text
    ) ||
    /\b(movie review|bollywood news|cricket score|ipl match winner|who won the match|recipe for|how to cook|bake a cake|paneer butter|biryani recipe)\b/i.test(
      text
    ) ||
    /\b(crypto price|bitcoin|ethereum|stock market prediction|sensex|nifty 50|mutual fund nav)\b/i.test(
      text
    )
  ) {
    return INTENT_TYPES.OFF_TOPIC;
  }

  // 2. About Foggy persona / capabilities
  if (
    /\b(who are you|what are you|what is foggy|who is foggy|about foggy|tell me about yourself|tum kaun ho|foggy kya hai|what can you do|how do you work|how does foggy work)\b/i.test(
      text
    )
  ) {
    return INTENT_TYPES.ABOUT_FOGGY;
  }

  // 3. Small talk / pure greetings
  if (
    /^(hi|hello|hey|namaste|namaskar|pranam|good morning|good afternoon|good evening|howdy|sup|thanks|thank you|shukriya|dhanyawad|dhanyavad)[!., ]*$/i.test(
      text
    ) ||
    /^(hi|hello|hey|namaste)[!., ]*(foggy)?[!., ]*$/i.test(text)
  ) {
    return INTENT_TYPES.SMALL_TALK;
  }

  // 4. Health symptom distress / concern
  if (
    /\b(cough|coughing|khansi|throat irritation|gale mein kharash|burning eyes|aankhon mein jalan|chest tight|saans phoolna|shortness of breath|breathless|wheezing|asthma attack|headache|sir dard|dizzy|nausea|doctor consult|medical advice|chest pain)\b/i.test(
      text
    )
  ) {
    return INTENT_TYPES.HEALTH_SYMPTOM_CONCERN;
  }

  // 5. Plan my day / daily routine
  if (
    /\b(plan.*day|schedule.*day|plan my low[- ]pollution day|plan my day|daily plan|aaj ka plan|din bhar ka schedule|routine for today|routine for smog|when should i go out|best time to (go out|run errands|venture out))\b/i.test(
      text
    )
  ) {
    return INTENT_TYPES.PLAN_MY_DAY;
  }

  // 6. Budget options & Clean Air Playbook
  if (
    /\b(budget|cheap|cheapest|low[- ]cost|affordable|free|kam kharch|kam kharche|sasta|saste|under rs|under 1000|paisa bacha|save money|clean.*(air|home|room).*budget|budget.*(clean|purif|filter|hacks?)|budget options?)\b/i.test(
      text
    ) ||
    text.includes('clean my home air on a budget') ||
    text.includes('how do i clean my home air on a budget')
  ) {
    return INTENT_TYPES.BUDGET_OPTIONS;
  }

  // 7. Indoor air cleaning / purification tips
  if (
    /\b(corsi[- ]rosenthal|diy purifier|clean.*home air|clean.*indoor|indoor air|purify.*home|purify.*room|clean.*room.*air|filter.*home|hepa|air purifier|wet[- ]mop|damp[- ]mop|pocha|dry sweep|jhadu|agarbatti|dhoop|incense|exhaust fan|weatherstrip|seal.*window|seal.*door|drafts?|houseplants?|indoor plants?|plants?.*air|hawa.*saaf|clean my home)\b/i.test(
      text
    ) ||
    text.includes('corsi-rosenthal')
  ) {
    return INTENT_TYPES.INDOOR_AIR_TIPS;
  }

  // 8. Mask advice
  if (
    /\b(mask|masks|n95|ffp2|respirator|surgical mask|cloth mask|pollution mask|pehanna|pehne|which mask|what mask|mask advice)\b/i.test(
      text
    )
  ) {
    return INTENT_TYPES.MASK_ADVICE;
  }

  // 9. Kids or seniors safety
  if (
    /\b(kid|kids|child|children|baby|infant|toddler|baccha|bacche|baccho|bache|senior|seniors|elder|elderly|old people|grandma|grandpa|dadi|nani|dada|nana|bujurg|tips for my child)\b/i.test(
      text
    ) &&
    /\b(safe|outside|play|outdoor|park|school|cricket|asthma|precaution|hawa|theek|bhejna)\b/i.test(
      text
    )
  ) {
    return INTENT_TYPES.KIDS_OR_SENIORS_SAFETY;
  }
  if (
    /\b(can kids play outside|tips for my child with asthma|kya bacche bahar khel sakte)\b/i.test(
      text
    )
  ) {
    return INTENT_TYPES.KIDS_OR_SENIORS_SAFETY;
  }

  // 10. Activity safety (running, workout, cricket, walks)
  if (
    /\b(run|running|jog|jogging|daudna|morning walk|evening walk|sair|cricket|football|sports?|exercise|workout|gym|cycling|play outdoors?|play outside|outdoor activity|bahar khelna|bahar daudna)\b/i.test(
      text
    ) &&
    /\b(safe|today|tomorrow|morning|evening|aaj|kal|chahiye|theek|can i|is it safe)\b/i.test(text)
  ) {
    return INTENT_TYPES.ACTIVITY_SAFETY;
  }
  if (/\b(safe to run|safe to walk|safe to jog|safe to exercise)\b/i.test(text)) {
    return INTENT_TYPES.ACTIVITY_SAFETY;
  }

  // 11. Commute options
  if (
    /\b(commute|commuting|transit|metro|bus|two[- ]wheeler|bike|motorcycle|scooter|auto|rickshaw|car|drive|driving|travel to (office|work)|traffic smog)\b/i.test(
      text
    )
  ) {
    return INTENT_TYPES.COMMUTE_OPTIONS;
  }

  // 12. City comparison
  if (
    /\b(safer than|better than|worse than|cleaner than|vs\.?|versus|compare|ya dono mein)\b/i.test(
      text
    )
  ) {
    return INTENT_TYPES.COMPARISON_BETWEEN_CITIES;
  }

  // 13. Follow-up or explicit forecast check
  if (
    /\b(tomorrow|kal|tonight|aaj raat|upcoming|next 24 hours|forecast|agla din|what about tomorrow|aur kal|future|weekend)\b/i.test(
      text
    ) ||
    /^(what about tomorrow|and tomorrow|how about tomorrow|aur kal|kal ka kya)[?.]*$/i.test(text)
  ) {
    return INTENT_TYPES.FORECAST;
  }

  // 14. AQI status check
  if (
    /\b(aqi|pollution|smog|air quality|hawa kaisi hai|hawa kaisa|kitna aqi|pm2\.5|pm10|pollutant|reading|score|level)\b/i.test(
      text
    ) ||
    /^[a-zA-Z\s]{3,20}\s+aqi\b/i.test(text) ||
    /\baqi\s+in\b/i.test(text)
  ) {
    return INTENT_TYPES.AQI_STATUS;
  }

  if (history && history.length > 0) {
    if (/\b(what about|how about|and|tell me more|aur|phir)\b/i.test(text)) {
      return INTENT_TYPES.FORECAST;
    }
  }

  return INTENT_TYPES.AQI_STATUS;
}
