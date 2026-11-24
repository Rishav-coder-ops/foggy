// src/hooks/useCarePlan.js
import { useState } from 'react';

export function useCarePlan() {
  const [expandedPlans, setExpandedPlans] = useState({});

  const toggleCarePlan = (memberId) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  return {
    expandedPlans,
    toggleCarePlan
  };
}
