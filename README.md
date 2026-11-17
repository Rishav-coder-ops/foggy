# 🌫️ Foggy — GenAI Winter Smog & Urban Air Quality Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7.svg?logo=netlify)](https://www.netlify.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express-4.21-000000.svg?logo=express)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash-4285F4.svg?logo=google)](https://aistudio.google.com/)
[![WAQI API](https://img.shields.io/badge/WAQI_API-Air_Quality-10B981.svg)](https://aqicn.org/api/)
[![WCAG AA](https://img.shields.io/badge/Accessibility-WCAG_AA_Compliant-blue.svg)](https://www.w3.org/WAI/WCAG2AA-Conformance)

> **"Breathe easier, live cleaner, protect who you love."**  
> Foggy is a friendly, knowledgeable, and reassuring GenAI companion designed to help families and urban communities navigate severe winter smog and urban air pollution with personalized routines, budget-friendly indoor hacks, and transparent impact metrics.

---

## 📖 Table of Contents
- [The Problem](#-the-problem)
- [Meet Foggy: Your AI Companion](#-meet-foggy-your-ai-companion)
- [Key Features](#-key-features)
- [Screenshots & UI Walkthrough](#-screenshots--ui-walkthrough)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Folder Structure](#-folder-structure)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Netlify Deployment Guide](#-netlify-deployment-guide)
- [API Keys Setup Guide](#-api-keys-setup-guide)
- [Light & Dark Mode Palettes](#-light--dark-mode-palettes)
- [Authentication & Memory Architecture](#-authentication--memory-architecture)
- [Privacy & Sensitive Health Data Statement](#-privacy--sensitive-health-data-statement)
- [Usage Guide](#-usage-guide)
- [Future Roadmap](#-future-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ❄️ The Problem
Every winter, hundreds of urban valleys and metropolitan centers experience catastrophic air quality deterioration driven by **temperature inversions**. A layer of warm air settles aloft like an atmospheric lid, trapping cold, dense air—and with it, heavy vehicle exhaust, residential wood/coal smoke, and industrial particulate matter—at street level.

Particulate matter ($PM_{2.5}$) is small enough ($\le 2.5\,\mu\text{m}$) to bypass nasal cilia, penetrate deep into bronchial alveoli, and enter the circulatory bloodstream. This causes acute asthma flare-ups, vascular inflammation, and chronic pulmonary damage—especially in vulnerable populations like children, seniors, and individuals with respiratory conditions.

Commercial advice often promotes costly purifiers ($400+) or causes anxiety without actionable, community-scale solutions. **Foggy** bridges this gap by delivering reassuring, practical, low-cost guidance and quantifying the exact environmental and health impact of every choice.

---

## ☁️ Meet Foggy: Your AI Companion
**Foggy** is not a sterile dashboard or an alarmist siren. Foggy is an empathetic, knowledgeable air quality ally with a warm, practical personality:
- **Never Alarmist**: Always focuses on what you *can* do today rather than inducing climate anxiety.
- **Direct Impact Explainer**: Quantifies every recommendation (e.g., *"Taking the metro saves ~2.4 kg CO2 and cuts your direct $PM_{2.5}$ exposure by 65%"*).
- **Health-Conscious with Safety Disclaimers**: Clarifies it is an AI assistant, not a physician, encouraging users to consult doctors for medical symptoms.
- **Personalized Context Memory**: Remembers your city, family members (asthma, seniors, infants, pets), heating style, and commute method across sessions so you never repeat yourself.

---

## ✨ Key Features

### 1. 🤖 Foggy Personalized Assistant (GenAI Chat)
- Conversational chat powered by **Google Gemini API** (`gemini-1.5-flash`), with an intelligent built-in fallback core when keys are unset or offline.
- Greets signed-in users by their first name and adapts recommendations to their household profile.
- Branded Foggy mascot avatar with emotional states (happy, listening, thinking).
- Suggested starter prompts: *"Plan my low-pollution day"*, *"How do I clean my home's air on a budget?"*, *"What mask should I wear today?"*.

### 2. 🕒 Low-Emission Daily Routines
- Hour-by-hour schedule covering commute, home heating, cooking, and outdoor exercise timing.
- **24-Hour Smog Inversion Curve**: Identifies peak smog windows (morning & evening inversions) and pinpoints the optimal midday window (1:00 PM – 3:30 PM) when solar radiation breaks the ground-level lid.
- Cleaner alternatives: public transit, cycling, carpooling, and induction cooking over coal/wood burning.

### 3. 🛠️ Budget-Friendly Indoor Air Hacks
- **The Corsi-Rosenthal Box**: Step-by-step DIY box-fan filter builder that matches $400 HEPA Clean Air Delivery Rates (CADR) for under $35-$50.
- **Micro-Gap Sealing**: Roll damp towels and apply weatherstripping to slash passive particulate drafts by up to 50% for $0 to $12.
- **Inversion Ventilation Timing**: Scientifically-timed window airing protocol.
- **Air-Purifying Botanical Companions**: Snake Plants (nighttime oxygen), Spider Plants (pet-safe formaldehyde absorption), and Areca Palms.
- **N95/FFP2 Mask Rotation**: Safe 4-day rotating paper bag protocol allowing safe re-use up to 40 hours.

### 4. 📊 Direct Impact Explainer
Every recommendation features visual badges detailing:
- **Estimated Emission Savings**: e.g. `~2.4 kg CO2 saved`
- **Health Inhalation Reduction**: e.g. `-65% PM2.5 inhaled`
- **Cost/Time Tradeoff**: e.g. `Save $3.50 vs solo driving`

### 5. 🌍 Location-Aware AQI Display
- Color-coded severity gauge (Good, Moderate, Unhealthy for Sensitive Groups, Unhealthy, Very Unhealthy, Hazardous) following US EPA standards.
- Real-time station integration via the **World Air Quality Index (WAQI) API**.
- Seamless fallback to high-fidelity regional atmospheric simulation models with clear source badges (`Live Sensor Feed` vs `Simulation Mode`).
- Direct injection of today's AQI and pollutants ($PM_{2.5}, PM_{10}, NO_2, O_3, SO_2, CO$) into Foggy's LLM prompt context.

### 6. 👨‍👩‍👧‍👦 Family Health Profiles
- Maintain profiles for dependents (children, elderly parents, asthmatics, pets, pregnant members).
- Assign customized sensitivity levels (`High`, `Moderate`, `Standard`) and personal activity notes.
- Automatic risk score calculation based on current AQI.

### 7. 🧠 Memory & Personalization ("What Foggy Knows")
- **Dynamic Memory Extraction**: Mentions of household details in chat (e.g. *"my father has COPD"* or *"we have a wood fireplace"*) trigger a polite suggestion chip: `💡 Foggy noticed: Father (COPD). [Save to Profile]`.
- **Transparent Inspector**: View, edit, or delete individual memories at any time.
- **One-Click Privacy Wipe**: Clear all stored data with a single button.

### 8. 🌗 Light & Dark Theme
- Navbar Sun/Moon toggle with smooth CSS transitions.
- Strictly adheres to the project color specification with WCAG AA compliance.

---

## 📸 Screenshots & UI Walkthrough

| Landing Page (Hero & Value Props) | Live AQI Dashboard & Daily Routine |
| :---: | :---: |
| *(Clean misty atmospheric backdrop, mascot avatar, quick-login)* | *(Real-time AQI meter, 24-hr inversion timeline, impact badges)* |

| GenAI Foggy Chat & Memory Extraction | Family Profiles & Vulnerabilities |
| :---: | :---: |
| *(Interactive conversation, starter pills, memory chips)* | *(Child with asthma, senior cardio, pet sensitivity tags)* |

| Budget Indoor Air Hacks (Corsi-Rosenthal) | "What Foggy Knows" Privacy Inspector |
| :---: | :---: |
| *(Step-by-step DIY box fan builder, cost vs HEPA)* | *(Transparent attributes, memory log, one-click data wipe)* |

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3.4, React Router 7, Lucide Icons
- **Backend Proxy**: Node.js 24, Express 4.21, CORS, Dotenv, In-memory Sliding Window Rate Limiter
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`) via secure backend proxy + Built-in Atmospheric Core Fallback
- **Air Quality Data**: World Air Quality Index (WAQI) API (`https://api.waqi.info`) + High-Fidelity Simulation Fallback
- **State & Storage**: React Context API (`ThemeContext`, `AuthContext`, `ProfileContext`) + `localStorage` persistence layer

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    User([User / Web Browser])

    subgraph Client ["Frontend Client (React + Vite :5173 / Production :3001)"]
        UI[UI Components & Pages]
        Auth[Auth Context & State]
        Theme[Theme Context - Light & Dark]
        Profile[Profile Context & LocalStorage]
        AQIState[AQI Monitor & Hourly Forecast]
    end

    subgraph Proxy ["Backend Security Proxy (Express.js :3001)"]
        RateLimit["Rate Limiter (60 req/min/IP)"]
        ChatEndpoint["POST /api/chat"]
        AQIEndpoint["GET /api/aqi"]
    end

    subgraph External ["External Cloud APIs"]
        Gemini["Google Gemini 1.5 Flash API"]
        WAQI["World Air Quality Index (WAQI)"]
    end

    User -->|Interacts| UI
    UI <--> Auth
    UI <--> Theme
    UI <--> Profile
    UI <--> AQIState

    UI -->|POST chat message + profile context| ChatEndpoint
    UI -->|GET city AQI| AQIEndpoint

    ChatEndpoint --> RateLimit
    AQIEndpoint --> RateLimit

    ChatEndpoint -->|Proxied with GEMINI_API_KEY| Gemini
    ChatEndpoint -.->|Fallback if Key Missing/Offline| LocalAI["Intelligent Foggy Core"]

    AQIEndpoint -->|Proxied with AQI_API_KEY| WAQI
    AQIEndpoint -.->|Fallback if Token Missing/Offline| LocalAQI["Deterministic City Simulation"]
```

---

## 📂 Folder Structure

```
challenge6/
├── .env.example               # Environment variable templates
├── .gitignore                  # Git ignore rules (node_modules, .env, dist)
├── netlify.toml                # Netlify deployment build, redirects, & functions config
├── package.json                # Project dependencies and npm scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS theme configuration
├── vite.config.js              # Vite bundler & API proxy configuration
├── README.md                   # Complete documentation
│
├── netlify/                    # Netlify Serverless Functions (Production Cloud)
│   └── functions/
│       ├── aqi.js              # Serverless WAQI API proxy & fallback
│       └── chat.js             # Serverless Gemini GenAI proxy & persistent memory
│
├── public/
│   └── _redirects              # Netlify SPA fallback & API proxy rules
│
├── server/                     # Local Backend proxy (Express.js)
│   ├── index.js                # Express app entry, static serving & routes
│   ├── middleware/
│   │   └── rateLimiter.js      # Sliding-window IP rate limiting
│   └── routes/
│       ├── aqi.js              # WAQI API proxy with simulation fallback
│       └── chat.js             # Gemini API proxy with memory extractor & smart core
│
└── src/                        # Frontend source code (React)
    ├── main.jsx                # App initialization & Context mounting
    ├── App.jsx                 # Route declarations & layout structure
    ├── index.html              # HTML entry & favicon definition
    ├── styles/
    │   └── index.css           # CSS variables, animations, and Tailwind directives
    ├── context/
    │   ├── AuthContext.jsx     # User session, login, signup, demo login
    │   ├── ThemeContext.jsx    # Light (#F1F5F9) & Dark (#0F172A) toggle
    │   ├── ProfileContext.jsx  # Family members, memory facts, profile attributes
    │   └── ChatContext.jsx     # Shared conversational state & modal controls
    ├── services/
    │   └── api.js              # Resilient fetch clients (calls /api/* or /.netlify/functions/*)
    ├── components/
    │   ├── Navbar.jsx          # Responsive header, theme switch, user profile
    │   ├── MobileBottomNav.jsx # Native thumb-friendly bottom navigation bar
    │   ├── CompactChatModal.jsx # Floating compact chat window with bottom-sheet mobile docking
    │   ├── FloatingChatButton.jsx # Circular assistant launcher button
    │   ├── CursorAtmosphere.jsx # Interactive particulate physics & clean air torch
    │   ├── Footer.jsx          # Legal notices, medical disclaimer, links
    │   ├── MascotAvatar.jsx    # Foggy cloud mascot SVG with emotion states
    │   ├── ThemeToggle.jsx     # Sun/Moon accessible switcher
    │   ├── AQICard.jsx         # Live gauge, pollutants breakdown, city search
    │   ├── HourlyTimeline.jsx  # 24-hr smog inversion curve & best windows
    │   ├── ImpactBadge.jsx     # CO2, PM2.5, and cost tradeoff badges
    │   ├── MemoryNotification.jsx # "Foggy noticed..." interactive 1-click save
    │   └── ProtectedRoute.jsx  # Guarded navigation wrapper
    └── pages/
        ├── LandingPage.jsx     # Hero, value props, live preview
        ├── AuthPage.jsx        # Sign In / Sign Up with validation & 1-click demo
        ├── DashboardPage.jsx   # AQI card, daily routine, family alert
        ├── ChatPage.jsx        # Focused consultation view with compact messenger
        ├── IndoorHacksPage.jsx # Budget DIY filters, sealing, plants, masks
        ├── FamilyProfilesPage.jsx # Household health management
        ├── MemoryPage.jsx      # "What Foggy Knows" privacy inspector
        └── AboutPage.jsx       # Inversion physics, AQI chart, medical disclaimer
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js** v18.0.0 or later (v20+ / v24+ recommended)
- **pnpm** (or `npm` / `yarn`)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/foggy.git
cd foggy

# Install dependencies with pnpm
pnpm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to create your `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Configure your keys in `.env` (the application works out-of-the-box in simulation mode even without keys!):
```env
GEMINI_API_KEY=your_gemini_api_key_here
AQI_API_KEY=your_waqi_token_here
PORT=3001
```

### 3. Run the Development Server
Run the backend proxy and Vite frontend concurrently with a single command:
```bash
pnpm run dev
```
- Frontend dev server: `http://localhost:5173`
- Backend API proxy: `http://localhost:3001`

### 4. Build for Production & Preview
```bash
# Build the client bundle
pnpm run build

# Start the unified production server
pnpm start
```
Visit `http://localhost:3001` in your browser.

---

## 🌐 Netlify Deployment Guide

Foggy is fully optimized for continuous deployment on **Netlify** with zero configuration required beyond your standard repository push.

### Architecture on Netlify
* **Static Assets**: Pre-compiled with Vite into `dist/` and distributed via Netlify's high-speed global Edge CDN.
* **Serverless Functions**: Located in `netlify/functions/`:
  - `netlify/functions/chat.js` handles Google Gemini GenAI interactions.
  - `netlify/functions/aqi.js` handles World Air Quality Index sensor queries and inversion curves.
* **Security**: API keys are stored strictly server-side in Netlify Environment Variables (`process.env.GEMINI_API_KEY` and `process.env.AQI_API_KEY`). **No secret keys use `VITE_` or `NEXT_PUBLIC_` prefixes**, ensuring they are never bundled into client JavaScript.
* **SPA Routing**: `netlify.toml` and `public/_redirects` contain fallback rules (`/* -> /index.html 200`) so refreshing `/dashboard`, `/family`, or `/memory` routes never yields a 404 error.

### Step-by-Step Deployment Instructions

#### Option A: Deploy via GitHub / GitLab / Bitbucket (Recommended)
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: prepare project for Netlify deployment"
   git push origin main
   ```
2. Log in to [Netlify](https://app.netlify.com).
3. Click **"Add new site"** > **"Import an existing project"**.
4. Select **GitHub** and choose your `foggy` repository.
5. Netlify will automatically detect settings from `netlify.toml`:
   - **Build command**: `pnpm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
   - **Node version**: `20`
6. Click **"Deploy site"**.

#### Option B: Configure Environment Variables in Netlify
To connect live AI and real-time sensor feeds in production:
1. In the Netlify site dashboard, navigate to **Site configuration** > **Environment variables**.
2. Click **"Add a variable"** and input:
   - `GEMINI_API_KEY`: Your Google AI Studio API key (e.g. `AIzaSy...`)
   - `AQI_API_KEY`: Your WAQI API platform token (e.g. `67a5...`)
3. Trigger a redeploy (**Deploys** > **Trigger deploy** > **Clear cache and deploy site**).

#### Option C: Deploy via Netlify CLI
If you have the Netlify CLI installed:
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Test Netlify functions & site locally
netlify dev

# Build and deploy to production
netlify deploy --prod --build
```

---

## 🔑 API Keys Setup Guide

### 1. Google Gemini API Key (GenAI Chat)
1. Navigate to [Google AI Studio](https://aistudio.google.com).
2. Sign in with your Google account.
3. In the left navigation, click **"Get API key"**, then **"Create API key in new project"**.
4. Copy your key and paste it into `.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
> 💡 *Note: Google AI Studio offers a free tier with rate limits. If the key is omitted or the quota is exhausted, Foggy automatically uses its built-in rule and template engine so the app remains completely operational.*

### 2. World Air Quality Index (WAQI) Token
1. Navigate to the [WAQI Data Platform Token Form](https://aqicn.org/data-platform/token/).
2. Agree to the non-commercial terms of service.
3. Enter your Name and Email address, then submit.
4. Check your email inbox and click the confirmation link to activate your free token.
5. Copy your token and paste it into `.env`:
   ```env
   AQI_API_KEY=your_token_here
   ```
> 💡 *Note: If no token is provided, Foggy seamlessly falls back to realistic regional atmospheric simulation data clearly marked with an informative badge.*

### ⚠️ Security Warning
- **Never commit your `.env` file** or share your keys publicly. The `.gitignore` file is configured to exclude all `.env` files.
- If you accidentally expose an API key, revoke and regenerate it immediately in Google AI Studio or the WAQI console.

---

## 🎨 Light & Dark Mode Palettes

Foggy's visual styling reflects the cool, crisp, misty atmosphere of winter smog while ensuring high contrast and readability:

| Mode | Token | Hex Color | Role |
| :--- | :--- | :--- | :--- |
| **Light** | Crisp Fog | `#F1F5F9` | Primary Background |
| **Light** | Dense Mist | `#E2E8F0` | Secondary Background / Layering Cards |
| **Light** | Slate Charcoal | `#334155` | Primary Readable Body Text |
| **Light** | Haze Orange | `#D97706` | Accent Buttons & Warning Elements |
| **Dark** | Midnight Smog | `#0F172A` | Primary Background |
| **Dark** | Industrial Haze | `#1E293B` | Secondary Background / Layering Cards |
| **Dark** | Ice White | `#F8FAFC` | Primary Crisp Text |
| **Dark** | Ozone Blue | `#38BDF8` | Primary Interactive Elements |
| **Dark** | Toxic Yellow | `#FBBF24` | Urgent AQI Alerts & Inversion Warnings |

---

## 🔐 Authentication & Memory Architecture

### Authentication Flow
1. **Mock Session Store**: User authentication is persisted in `localStorage` under `foggy_session_user`.
2. **One-Click Demo Login**: Includes a `Quick 1-Click Demo Login (Maya Chen)` button for immediate review without typing credentials.
3. **Form Validation**: Validates email format and requires a minimum 6-character password with user-friendly error banners.
4. **Protected Routes**: Dashboard, Chat, Family Profiles, and Memory pages are guarded by `ProtectedRoute`.

### Memory & Personalization Flow
1. **Context Bundling**: On every chat message, the frontend bundles the user's city, current AQI metrics, and family health vulnerabilities into the payload.
2. **Extraction Engine**: Foggy scans chat messages for new family health mentions (e.g., *"my daughter has asthma"*), heating appliances, or commute changes.
3. **User Confirmation**: The UI renders a floating banner (`💡 Foggy noticed...`) asking for user permission before permanently recording any fact.
4. **Context Limits**: Older conversation turns are trimmed to retain recent relevance while staying well within Gemini token limits.

---

## 🛡️ Privacy & Sensitive Health Data Statement

Foggy recognizes that respiratory conditions (asthma, COPD, cardiovascular illness) are sensitive personal health information:
- **Local Storage Only**: In this release, all health tags and extracted facts are stored **exclusively in your browser's local storage**.
- **No Data Brokering**: We do not sell, broker, or transmit your family health details to data collectors.
- **Model Training Privacy**: System context is passed via Google Gemini API endpoints without opting into public dataset training.
- **Full Erasure Control**: Users can inspect every recorded fact on the *What Foggy Knows* page and execute a complete wipe with the **"Clear All My Data"** button.

---

## 📘 Usage Guide

1. **Sign In**: Launch the app and click **"Try 1-Click Demo Profile"** or create a new account.
2. **Check the Dashboard**: Review your local AQI score, the 24-hour inversion curve, and the recommended low-emission daily routine.
3. **Chat with Foggy**: Ask Foggy to plan your day, provide a budget DIY purifier recipe, or evaluate if it is safe for your child to play soccer outside today.
4. **Explore Indoor Hacks**: Select the *Indoor Hacks* page to view instructions for building a Corsi-Rosenthal box for under $35.
5. **Manage Family**: Add household members with conditions like asthma so Foggy automatically factors them into outdoor advisories.
6. **Inspect Memory**: Open *What Foggy Knows* to inspect and manage the facts Foggy has learned.

---

## 🗺️ Future Roadmap

- [ ] **Cloud Backend & Database**: Migrate local storage to a secure Supabase / Firebase backend for cross-device synchronization with end-to-end encryption (E2EE) for health records.
- [ ] **Multi-Station Sensor Aggregation**: Integrate OpenAQ, AirNow, and PurpleAir alongside WAQI for hyper-local neighborhood sensor resolution.
- [ ] **Push & SMS Smog Alerts**: Deliver morning inversion warnings before users leave for their daily commute.
- [ ] **Voice Interface**: Hands-free voice chat with Foggy for kitchen and car accessibility.
- [ ] **Localized School & Transit Feeds**: Sync district outdoor recess decisions with live school sports schedules.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-hack`).
3. Commit your changes (`git commit -m 'feat: Add Corsi-Rosenthal filter size calculator'`).
4. Push to your branch (`git push origin feature/amazing-hack`).
5. Open a Pull Request.

---

## 📄 License
This project is open-source and distributed under the **MIT License**. See the `LICENSE` file for details.

---

*Foggy — Because everyone deserves clean air, practical solutions, and peace of mind.*
