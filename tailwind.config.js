/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode palette:
        // Crisp Fog (#F1F5F9), Dense Mist (#E2E8F0), Slate Charcoal (#334155), Haze Orange (#D97706)
        // Dark mode palette:
        // Midnight Smog (#0F172A), Industrial Haze (#1E293B), Ice White (#F8FAFC), Ozone Blue (#38BDF8), Toxic Yellow (#FBBF24)
        slate: {
          850: '#172033',
        },
        fog: {
          lightBg: '#F1F5F9',
          lightMist: '#E2E8F0',
          lightText: '#334155',
          lightAccent: '#D97706',
          darkBg: '#0F172A',
          darkHaze: '#1E293B',
          darkText: '#F8FAFC',
          darkOzone: '#38BDF8',
          darkToxic: '#FBBF24',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
        'soft-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'glow-ozone': '0 0 25px -5px rgba(56, 189, 248, 0.35)',
        'glow-amber': '0 0 25px -5px rgba(217, 119, 6, 0.35)',
      }
    },
  },
  plugins: [],
}
