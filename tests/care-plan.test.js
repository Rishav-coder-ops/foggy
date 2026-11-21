// tests/care-plan.test.js
import { describe, it, expect } from 'vitest';
import { generateMemberCarePlan, CPCB_CATEGORIES } from '../src/utils/carePlanEngine.js';

describe('tests/care-plan.test.js - Care Plan Rule Engine & Medication Safety', () => {
  const categories = [
    CPCB_CATEGORIES.GOOD,
    CPCB_CATEGORIES.SATISFACTORY,
    CPCB_CATEGORIES.MODERATE,
    CPCB_CATEGORIES.POOR,
    CPCB_CATEGORIES.VERY_POOR,
    CPCB_CATEGORIES.SEVERE
  ];

  describe('AQI Category Cross-Combinations', () => {
    it.each(categories)(
      'generates valid care plan for category: %s with standard adult profile',
      (cat) => {
        const member = {
          name: 'Rahul',
          age: 32,
          conditions: ['None'],
          sensitivity: 'Moderate',
          commute: ['Metro'],
          lifestyle: ['Morning walk']
        };
        const plan = generateMemberCarePlan(member, { category: cat, aqi: 150 });

        expect(plan).toBeDefined();
        expect(plan.category).toBe(cat);
        expect(plan.timeSlots).toHaveLength(3);
        expect(plan.doList.length).toBeGreaterThan(0);
        expect(plan.avoidList.length).toBeGreaterThan(0);
        expect(plan.maskAdvice).toBeTruthy();
      }
    );

    it('tailors recommendations for child under severe AQI', () => {
      const childMember = {
        name: 'Aarav',
        age: 8,
        conditions: ['Asthma'],
        relationship: 'Son',
        sensitivity: 'High',
        lifestyle: ['Outdoor sports', 'Cricket']
      };
      const plan = generateMemberCarePlan(childMember, {
        category: CPCB_CATEGORIES.SEVERE,
        aqi: 440
      });

      expect(plan.conditionReminders.some((r) => r.includes('Child Respiratory Care'))).toBe(true);
      expect(plan.conditionReminders.some((r) => r.includes('Asthma Safeguard'))).toBe(true);
      expect(
        plan.avoidList.some((a) => a.includes('NEVER exercise') || a.includes('cricket'))
      ).toBe(true);
      expect(plan.maskAdvice).toContain('N95');
    });

    it('tailors recommendations for senior citizen with COPD', () => {
      const seniorMember = {
        name: 'Dada Ji',
        age: 72,
        conditions: ['COPD'],
        relationship: 'Father',
        sensitivity: 'High',
        lifestyle: ['Morning walk']
      };
      const plan = generateMemberCarePlan(seniorMember, {
        category: CPCB_CATEGORIES.VERY_POOR,
        aqi: 360
      });

      expect(plan.conditionReminders.some((r) => r.includes('COPD Action Plan'))).toBe(true);
      expect(plan.conditionReminders.some((r) => r.includes('Senior Care'))).toBe(true);
      expect(plan.timeSlots[0].lifestyleAdjustment).toContain('STRICT: Do not run or jog');
    });

    it('tailors recommendations for cardiac / hypertension conditions', () => {
      const cardiacMember = {
        name: 'Sunita',
        age: 55,
        conditions: ['Heart Disease', 'Hypertension'],
        relationship: 'Mother',
        sensitivity: 'High'
      };
      const plan = generateMemberCarePlan(cardiacMember, {
        category: CPCB_CATEGORIES.POOR,
        aqi: 260
      });

      expect(plan.conditionReminders.some((r) => r.includes('Cardiovascular Caution'))).toBe(true);
      expect(plan.conditionReminders.some((r) => r.includes('blood pressure spikes'))).toBe(true);
    });

    it('tailors recommendations for pregnancy', () => {
      const pregnantMember = {
        name: 'Priya',
        age: 28,
        conditions: ['Pregnancy'],
        relationship: 'Self',
        sensitivity: 'High'
      };
      const plan = generateMemberCarePlan(pregnantMember, {
        category: CPCB_CATEGORIES.MODERATE,
        aqi: 180
      });

      expect(plan.conditionReminders.some((r) => r.includes('Maternal Health'))).toBe(true);
      expect(plan.conditionReminders.some((r) => r.includes('placental barriers'))).toBe(true);
    });

    it('tailors commute advice across transit modes', () => {
      const commuter = {
        name: 'Vikram',
        age: 35,
        commute: ['Metro', 'Two-wheeler', 'Car', 'Walk']
      };
      const plan = generateMemberCarePlan(commuter, { category: CPCB_CATEGORIES.POOR, aqi: 240 });

      expect(plan.commuteTips.some((t) => t.includes('Metro'))).toBe(true);
      expect(plan.commuteTips.some((t) => t.includes('Two-wheelers'))).toBe(true);
      expect(plan.commuteTips.some((t) => t.includes('Recirculation'))).toBe(true);
      expect(plan.commuteTips.some((t) => t.includes('Pedestrians'))).toBe(true);
    });
  });

  describe('Strict Medical Safety & Non-Pharmacological Boundary', () => {
    it('never recommends changing, stopping, or starting prescription medications', () => {
      const member = {
        name: 'Patient',
        age: 65,
        conditions: ['Asthma', 'Heart Disease', 'Hypertension', 'COPD', 'Diabetes'],
        sensitivity: 'High'
      };

      for (const cat of categories) {
        const plan = generateMemberCarePlan(member, { category: cat, aqi: 350 });

        const allText = [
          ...plan.doList,
          ...plan.avoidList,
          ...plan.conditionReminders,
          ...plan.commuteTips,
          ...plan.timeSlots.map((s) => `${s.guidance} ${s.lifestyleAdjustment}`),
          plan.maskAdvice,
          plan.disclaimer
        ].join(' ');

        // Check that plan NEVER recommends modifying medicine doses
        expect(allText).not.toMatch(
          /\b(increase dose|decrease dose|stop taking|double the dose|prescribe|take 500mg|take 10mg)\b/i
        );
        expect(allText).not.toMatch(/\b(change your medication|alter your medicine)\b/i);

        // If rescue inhalers are mentioned, verify it explicitly says "doctor-prescribed" and "Do not alter"
        if (allText.includes('inhaler')) {
          expect(allText).toMatch(/doctor-prescribed/i);
          expect(allText).toMatch(/do not alter/i);
        }

        // Must always include explicit medical disclaimer
        expect(plan.disclaimer).toContain('Foggy is an educational AI assistant, not a doctor');
        expect(plan.disclaimer).toContain('Never recommend or alter prescribed medications');
      }
    });
  });
});
