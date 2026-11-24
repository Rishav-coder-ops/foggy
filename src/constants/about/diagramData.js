// src/constants/about/diagramData.js
// Structured node definitions for the system architecture diagram

export const ARCHITECTURE_LAYERS = [
  {
    id: 'client',
    x: 20,
    width: 220,
    stroke: '#38bdf8',
    darkStroke: 'dark:stroke-sky-600',
    title: '1. CLIENT LAYER',
    titleColor: '#0284c7',
    boxes: [
      { y: 65, height: 45, fill: '#e0f2fe', title: 'React 19 + Vite 6', titleColor: '#0369a1', line1: 'Tailwind CSS (WCAG AA Contrast)' },
      { y: 120, height: 45, fill: '#e0f2fe', title: 'Care Plan Rule Engine', titleColor: '#0369a1', line1: 'Deterministic CPCB Diurnal Rules' },
      { y: 175, height: 55, fill: '#e0f2fe', title: 'Firestore Web SDK Cache', titleColor: '#0369a1', line1: 'persistentMultipleTabManager', line2: 'Offline-capable indexedDB persistence' },
      { y: 240, height: 45, fill: '#e0f2fe', title: '2-Step Onboarding', titleColor: '#0369a1', line1: 'Route guards & text sanitization' }
    ]
  },
  {
    id: 'backend',
    x: 310,
    width: 240,
    stroke: '#10b981',
    darkStroke: 'dark:stroke-emerald-600',
    title: '2. SERVERLESS BACKEND',
    titleColor: '#059669',
    boxes: [
      { y: 65, height: 42, fill: '#ecfdf5', title: '/api/aqi (CPCB NAQI)', titleColor: '#047857', line1: 'Open-Meteo CAMS linear sub-index' },
      { y: 115, height: 42, fill: '#ecfdf5', title: '/api/geocode', titleColor: '#047857', line1: 'State alias matching & 10m cache' },
      { y: 165, height: 42, fill: '#ecfdf5', title: '/api/chat (Foggy AI)', titleColor: '#047857', line1: 'Gemini prompt-injection defense' },
      { y: 215, height: 42, fill: '#ecfdf5', title: '/api/aqi-timeline', titleColor: '#047857', line1: '24h rolling curves & diurnal shifts' },
      { y: 265, height: 45, fill: '#ecfdf5', title: 'Rate Limiter & Security', titleColor: '#047857', line1: 'Strict CSP, IP rate-limits, Token Auth' }
    ]
  },
  {
    id: 'cloud',
    x: 610,
    width: 230,
    stroke: '#f59e0b',
    darkStroke: 'dark:stroke-amber-600',
    title: '3. CLOUD & AI APIS',
    titleColor: '#d97706',
    boxes: [
      { y: 65, height: 52, fill: '#fffbeb', title: 'Firebase Firestore & Auth', titleColor: '#b45309', line1: 'Region: asia-south1 (Mumbai)', line2: 'Strict isOwner(uid) Security Rules' },
      { y: 125, height: 52, fill: '#fffbeb', title: 'Copernicus CAMS & Open-Meteo', titleColor: '#b45309', line1: 'Hourly atmospheric PM2.5 & PM10', line2: 'Meteorological boundary layer wind' },
      { y: 185, height: 52, fill: '#fffbeb', title: 'Google Gemini GenAI', titleColor: '#b45309', line1: 'Multilingual contextual assistance', line2: 'English, Hindi & Hinglish' },
      { y: 245, height: 45, fill: '#fffbeb', title: 'Statutory Portals', titleColor: '#b45309', line1: 'CPCB, CAQM, IMD, NDMA SACHET' }
    ]
  }
];
