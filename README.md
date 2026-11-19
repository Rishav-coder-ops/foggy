# 🌫️ Foggy — GenAI Winter Smog & Urban Air Quality Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
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
- [Deploy to Cloudflare Pages](#-deploy-to-cloudflare-pages)
- [API Keys & Secrets Setup Guide](#-api-keys--secrets-setup-guide)
- [Light & Dark Mode Palettes](#-light--dark-mode-palettes)
- [Authentication & Memory Architecture](#-authentication--memory-architecture)
- [Security & Privacy Architecture](#-security--privacy-architecture)
- [Usage Guide](#-usage-guide)
- [Future Roadmap](#-future-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ❄️ The Problem
Every winter, hundreds of urban valleys and metropolitan centers experience catastrophic air quality deterioration driven by **temperature inversions**. A layer of warm air settles aloft like an atmospheric lid, trapping cold, dense air—and with it, heavy vehicle exhaust, residential wood/coal smoke, and industrial particulate matter—at street level.

Particulate matter ($PM_{2.5}$) is small enough ($\le 2.5\,\mu\text{m}$) to bypass nasal cilia, penetrate deep into bronchial alveoli, and enter the circulatory bloodstream. This causes acute asthma flare-ups, vascular inflammation, and chronic pulmonary damage—especially in vulnerable populations like children, seniors, and individuals with respiratory conditions.

Commercial advice often promotes costly purifiers (₹15,000–₹40,000+) or causes anxiety without actionable, community-scale solutions. **Foggy** bridges this gap by delivering reassuring, practical, low-cost guidance and quantifying the exact environmental and health impact of every choice.

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
- **The Corsi-Rosenthal Box**: Step-by-step DIY box-fan filter builder that matches expensive HEPA Clean Air Delivery Rates (CADR) for ~₹2,500–₹3,500.
- **Micro-Gap Sealing**: Roll damp towels and apply weatherstripping to slash passive particulate drafts by up to 50% for ₹0 to ₹350.
- **Inversion Ventilation Timing**: Scientifically-timed window airing protocol during midday solar warming.
- **Air-Purifying Botanical Companions**: Snake Plants (nighttime oxygen), Spider Plants (pet-safe formaldehyde absorption), and Areca Palms (honest assessment: botanical companions, not replacements for filtration).
- **N95/FFP2 Mask Rotation**: Safe 4-day rotating paper bag protocol allowing safe re-use up to 40 hours (~₹250–₹350 for a multi-pack).

### 4. 📊 Direct Impact Explainer
Every recommendation features visual badges detailing:
- **Estimated Emission Savings**: e.g. `~2.4 kg CO2 saved`
- **Health Inhalation Reduction**: e.g. `-65% PM2.5 inhaled`
- **Cost/Time Tradeoff**: e.g. `Save ~₹180 fuel vs solo driving`

### 5. 🌍 Location-Aware AQI Display
- Color-coded severity gauge (Good, Satisfactory, Moderate, Poor, Very Poor, Severe) following India CPCB National AQI (NAQI) standards (0–500).
- Primary forecasting and timeline feed via **Open-Meteo Air Quality (CAMS model)**, computing CPCB sub-indices from PM2.5 and PM10 with rolling 24-hour averages.
- Real-time station reference via the **World Air Quality Index (WAQI) API**.
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

### 9. 🗂️ Interactive Expandable Feature Panels
- **7-Day AQI Predictor**: Preview strip and expandable 7-day forward outlook with 3-hour interval breakdown (`02:00, 05:00, 08:00, 11:00, 14:00, 17:00, 20:00, 23:00`), deviation from daily average, best/worst windows, and instant **"Ask Foggy about this forecast"** AI routing.
- **24-Hour AQI Curve**: Live SVG sparkline preview and expandable full line/area chart with shaded CPCB NAQI bands (colour + text labels: Good, Satisfactory, Moderate, Poor, Very Poor, Severe), interactive tooltips, summary metrics (now, 24h avg, cleanest window, peak smog), and accessible **"View as Table"** data alternative.
- **Clean Air Playbook: Free to Premium**: Tiered interventions across Free (₹0), Budget (<₹1,000), and Premium (₹1,000+) with estimated particulate reductions, cost in INR, effort ratings, who benefits most, dynamic **"Match to Today's AQI"** advisory banner, and card-specific **"Ask Foggy"** guidance.
- **Shared Location & Geolocation**: City search powered by Open-Meteo Geocoding with browser geolocation integration, synchronized across panels and the live dashboard.

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
├── .env.example               # Client build-time variable templates (VITE_FIREBASE_*)
├── .dev.vars.example          # Cloudflare Pages Functions local secrets template
├── .gitignore                  # Git ignore rules (node_modules, .env, .dev.vars, dist)
├── .node-version               # Target Node version for Cloudflare Pages (Node 20)
├── wrangler.toml               # Cloudflare Pages & Functions configuration
├── _routes.json                # Cloudflare routing rules (/api/* -> Functions, rest -> static)
├── package.json                # Project dependencies, Node 20 engine, and npm scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS theme configuration
├── vite.config.js              # Vite bundler & API proxy configuration
├── README.md                   # Complete documentation
│
├── functions/                  # Cloudflare Pages Functions (Serverless Edge API)
│   └── api/
│       ├── aqi.js              # Edge WAQI API proxy with live sensors, rate limiting & validation
│       └── chat.js             # Edge Gemini GenAI proxy with memory extraction & rate limiting
│
├── public/                     # Static assets copied into dist/ at build time
│   ├── _headers                # Security headers (CSP, HSTS, X-Frame-Options, etc.)
│   ├── _redirects              # SPA fallback rules (/* /index.html 200)
│   └── _routes.json            # Cloudflare Pages Function routing rule definition
│
├── server/                     # Local Backend Proxy (Express.js fallback bridge)
│   ├── index.js                # Express app entry, static serving & routes
│   ├── middleware/
│   │   └── rateLimiter.js      # Sliding-window IP rate limiting
│   └── routes/
│       ├── aqi.js              # Route mounted to /api/aqi (bridges to functions/api/aqi.js)
│       └── chat.js             # Route mounted to /api/chat (bridges to functions/api/chat.js)
│
└── src/                        # Frontend source code (React + Vite)
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
    │   └── api.js              # Resilient fetch clients (calls /api/aqi and /api/chat)
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
- **Node.js** v20.0.0 or later (configured in `.node-version`)
- **pnpm** (or `npm` / `yarn`)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/foggy.git
cd foggy

# Install dependencies with pnpm
pnpm install
```

### 2. Configure Local Secrets & Environment
Foggy uses two configuration files for clean security boundaries:
1. **Local Function Secrets (`.dev.vars`)**:
   Used by Wrangler (`wrangler pages dev dist`) to securely provide backend secrets to Cloudflare Pages Functions:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
   *(Windows PowerShell: `Copy-Item .dev.vars.example .dev.vars`)*
   Add your keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   AQI_API_KEY=your_waqi_token_here
   ```
   > 💡 *Note: The application operates gracefully with built-in high-fidelity atmospheric simulation and smart AI fallback models even if keys are left blank!*

2. **Client Build Configuration (`.env`)**:
   Used by Vite at build time for public web client variables (such as Firebase Authentication):
   ```bash
   cp .env.example .env
   ```
   *(Windows PowerShell: `Copy-Item .env.example .env`)*

### 3. Run Locally with Cloudflare Pages Functions (Wrangler)
Build the frontend and run the complete Cloudflare Pages environment (static assets + Edge Pages Functions) locally:
```bash
# 1. Build the production assets into dist/
pnpm run build

# 2. Run the site and functions locally with Wrangler
pnpm run pages:dev
```
Your local Cloudflare Pages environment will be live at `http://localhost:8788`, executing `functions/api/aqi.js` and `functions/api/chat.js` with full Edge runtime parity!

### 4. Alternative: Run with Vite Dev Server & Local Proxy
For hot-module replacement (HMR) during frontend UI editing:
```bash
pnpm run dev
```
- Frontend dev server: `http://localhost:5173`
- Local API proxy bridge: `http://localhost:3001`

---

## ⚡ Deploy to Cloudflare Pages

Foggy is fully optimized for continuous deployment on **Cloudflare Pages** with Cloudflare Pages Functions in `functions/api/`.

### Architecture on Cloudflare Pages
* **Edge Static Assets**: Pre-compiled with Vite into `dist/` and served globally via Cloudflare's ultra-low latency CDN edge network.
* **Pages Functions (Edge Workers)**: Located in `functions/api/`:
  - `functions/api/chat.js` handles Google Gemini GenAI interactions, safety disclaimers, rate limiting, request size limits, and dynamic profile memory extraction.
  - `functions/api/aqi.js` handles World Air Quality Index (WAQI) live station feeds, key pollutants ($PM_{2.5}, PM_{10}, NO_2, O_3, SO_2, CO$), rate limiting, input validation, and inversion curve modeling.
  - `functions/api/aqi-timeline.js` handles Open-Meteo Air Quality timeline forecasting (Copernicus CAMS model) and global city geocoding, returning the past 24 hours of hourly AQI, 7-day 3-hour interval outlooks, 30-minute edge caching, rate limiting, and CORS protection. No API key required.
* **Zero Secret Leakage**: Secret keys (`GEMINI_API_KEY`, `AQI_API_KEY`) are stored strictly server-side in Cloudflare Pages Secrets (`context.env`). **No secret keys ever use `VITE_` or `NEXT_PUBLIC_` prefixes**, ensuring credentials are never exposed in browser bundles.
* **SPA Routing & Security**:
  - `public/_redirects`: Provides the SPA fallback rule (`/* /index.html 200`) so refreshing `/dashboard`, `/family`, `/memory`, or `/about` never produces a 404 error.
  - `public/_routes.json`: Directs `/api/*` to Cloudflare Pages Functions while routing all other requests to static assets.
  - `public/_headers`: Enforces strict security headers (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`). The CSP is pre-configured to allow Firebase Authentication popups and Google Sign-In.
* **Rate Limiting**: Built-in best-effort in-memory sliding-window rate limiting (60 requests/minute per IP) protects API quotas. Stronger, distributed edge rate limiting can be configured directly in Cloudflare's dashboard under **Security > WAF > Rate limiting rules**.

---

### Step-by-Step Deployment Instructions

#### 1. Push to GitHub
Commit your project and push to your GitHub repository:
```bash
git add .
git commit -m "Migrate hosting to Cloudflare Pages"
git push origin main
```

#### 2. Create Cloudflare Pages Project
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your GitHub account and choose the `foggy` repository.
4. Click **Begin setup**.

#### 3. Configure Build Settings
Fill in the build configuration:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Project Name** | `foggy` | Or your preferred subdomain |
| **Production Branch** | `main` | Continuous deployment branch |
| **Framework Preset** | `Vite` (or `None`) | Configured via `package.json` |
| **Build Command** | `npm run build` | Produces production assets in `dist/` |
| **Build Output Directory** | `dist` | Static asset output directory |
| **Node.js Version** | `20` | Automatically picked up from `.node-version` |

#### 4. Configure Environment Variables & Secrets
Under **Environment variables (advanced)**:

1. **Add Production Secrets (Server-Side)**:
   - `GEMINI_API_KEY`: Your Google AI Studio Gemini API key (e.g. `AIzaSy...`)
   - `AQI_API_KEY`: Your WAQI API platform token (e.g. `67a5...`)
   *(Mark both as **Encrypt** / Secret)*

2. **Add Client Build-Time Variables (Public Web Config)**:
   If using Firebase Authentication, add the public web configuration:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

> 🔒 **Security Notice**: Secret keys (`GEMINI_API_KEY`, `AQI_API_KEY`) must **NEVER** use the `VITE_` prefix. `VITE_` is reserved solely for public client-side web config that Vite embeds into the frontend bundle.

#### 5. Deploy & Authorize Firebase Domain
1. Click **Save and Deploy**. Cloudflare Pages will build the frontend, deploy the `functions/api/` edge routes, and provide your live URL (e.g. `https://foggy.pages.dev`).
2. **Authorize Domain in Firebase**:
   - Go to [Firebase Console](https://console.firebase.google.com/) > Select your Project.
   - Navigate to **Authentication** > **Settings** > **Authorized domains**.
   - Click **Add domain** and enter your Cloudflare Pages domain (e.g. `foggy.pages.dev`).
   - This ensures Google OAuth popups and redirects function without origin rejection.

---

## 🔑 API Keys & Secrets Setup Guide

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
5. Copy your token and paste it into `.dev.vars` (or `.env`):
   ```env
   AQI_API_KEY=your_token_here
   ```
> 💡 *Note: If no token is provided, Foggy seamlessly falls back to realistic regional atmospheric simulation data clearly marked with an informative badge.*

### 3. Firebase Authentication Setup (Google OAuth & Email Accounts)
Foggy uses official **Firebase Authentication** for secure user login, session management, and data privacy isolation:

1. **Create a Firebase Project**:
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Click **Add Project** and name it (e.g. `foggy-air-quality`).
2. **Enable Authentication Providers**:
   - In the left sidebar, navigate to **Build** > **Authentication** > **Get Started**.
   - Under the **Sign-in method** tab:
     - Enable **Email/Password** (enable Email/Password and save).
     - Enable **Google** (set your project support email and save).
3. **Register a Web App**:
   - Go to **Project Settings** (gear icon) > **General**.
   - Scroll down to *Your apps* and click the **Web** icon (`</>`).
   - Enter an App nickname (e.g. `Foggy Web`) and click **Register app**.
   - Copy the `firebaseConfig` credentials.
4. **Configure Environment Variables**:
   - Add these values to your `.env` file for local development:
     ```env
     VITE_FIREBASE_API_KEY=AIzaSy...
     VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project
     VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
     VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
     ```
   - In Cloudflare Pages, add these identical variables under **Settings > Environment variables** (Client Build-Time Variables).
5. **Add Authorized Domains**:
   - In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**.
   - Ensure `localhost` is present for local development.
   - Click **Add domain** and enter your production Cloudflare Pages domain (e.g. `foggy.pages.dev`).

### ⚠️ Security Warning
- **Never commit your `.env` or `.dev.vars` file** or share your keys publicly. The `.gitignore` file is configured to exclude all `.env` files.
- If you accidentally expose an API key, revoke and regenerate it immediately in Google AI Studio, Firebase, or the WAQI console.

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
1. **Real Firebase Authentication**: User sessions are persisted natively via Firebase `onAuthStateChanged`, handling token refreshes, session lifecycles, and cross-tab synchronizations automatically.
2. **Google OAuth & Email Sign-In**:
   - Real **"Continue with Google"** popup via Firebase `signInWithPopup(auth, googleProvider)`. The user's real Google display name and profile picture appear in the navbar.
   - Real email account creation and sign-in via `createUserWithEmailAndPassword` and `signInWithEmailAndPassword`.
   - Real **"Forgot password?"** self-service reset via `sendPasswordResetEmail`.
3. **Friendly Error Translation**: Firebase error codes (such as popup closed, popup blocked, network error, wrong password, user not found, account exists with different method, too many attempts) are translated into clear, friendly guidance messages.
4. **Environment Health Check**: If Firebase environment variables are missing or unconfigured, an informative on-screen banner is displayed with exact setup steps; the system never silently logs the user in as a fake account.
5. **Isolated Demo Mode**: A clearly labeled, separate demo account option (`Demo Account - Offline Sandbox`) is provided for offline evaluation without connecting to Google or Firebase.
6. **Protected Routes**: Protected routes (Dashboard, Family Profiles, Memory) verify session state asynchronously, showing a subtle loading state while Firebase validates tokens before redirecting.

### Memory & Personalization Flow
1. **User UID Isolation**: Each user's family members, sensitivity profiles, and chat memory are keyed directly to their Firebase `uid` (`foggy_profile_${user.uid}`). Users never see each other's data across accounts.
2. **Context Bundling**: On every chat message, the frontend bundles the user's city, current AQI metrics, and family health vulnerabilities into the payload.
3. **Extraction Engine**: Foggy scans chat messages for new family health mentions (e.g., *"my daughter has asthma"*), heating appliances, or commute changes.
4. **User Confirmation**: The UI renders a floating banner (`💡 Foggy noticed...`) asking for user permission before permanently recording any fact.
5. **Context Limits**: Older conversation turns are trimmed to retain recent relevance while staying well within Gemini token limits.

---

## 🛡️ Security & Privacy Architecture

Foggy follows a strict defense-in-depth model across every layer of the application stack. See [`SECURITY.md`](SECURITY.md) for vulnerability disclosure policies and SLAs.

### 1. Zero Secrets in Client Bundles
- **Backend Key Isolation**: API keys (`GEMINI_API_KEY`, `AQI_API_KEY`) are accessed strictly on the server (Cloudflare Pages Functions via `context.env`, or `.dev.vars` / `.env` locally). They are never exposed in browser bundles, network responses, client headers, or git history.
- **Client Variables**: Frontend builds only consume safe public identifiers (`VITE_FIREBASE_*`) necessary for client-side Firebase Auth initialization.

### 2. Dual-Tier Abuse Protection & Rate Limiting
- **Anonymous Visitors**: Restricted to **10 messages per hour** per client IP on `/api/chat`.
- **Signed-in Users**: Granted an expanded limit of **60 messages per hour** on `/api/chat`.
- **Cryptographic Firebase Token Verification**: Signed-in users transmit an `Authorization: Bearer <idToken>` header. Cloudflare Pages Functions cryptographically verify the token against Google's public JWK certificates (`RSASSA-PKCS1-v1_5` / `SHA-256`) via standard Web Crypto API, validating `aud`, `iss`, `exp`, and `iat` before granting the higher quota tier.
- **Payload & Message Caps**:
  - Request body capped at **32 KB** (`413 Payload Too Large`).
  - Message length capped at **500 characters** (`400 Bad Request`).
  - Conversation context capped at the **last 10 turns**.
- **Cloudflare Dashboard Rate Limiting**: In addition to serverless function rate limiting, production deployments should configure Cloudflare Rate Limiting Rules (under **Security > WAF > Rate Limiting Rules**) on `/api/*` routes to block high-frequency layer-7 traffic and volumetric DDoS attacks before they reach worker instances.

### 3. Prompt-Injection & Jailbreak Defenses
- Foggy's system prompt strictly instructs Gemini to:
  - Reject all roleplay, persona overrides, hypothetical modes, and jailbreak phrases (`ignore previous instructions`, `DAN mode`, etc.).
  - Keep internal instructions, credentials, and prompts strictly confidential.
  - Remain within domain boundaries (air quality, winter smog, respiratory health, indoor hacks, and urban sustainability) and politely decline out-of-scope or adversarial requests.
  - Treat all user messages and external data as untrusted input.
  - Bounded token output (`maxOutputTokens: 600`).

### 4. Cross-Site Scripting (XSS) Prevention & Safe Rendering
- **No Raw HTML Injection**: Zero usage of `dangerouslySetInnerHTML` throughout the entire codebase.
- **Automatic React Escaping**: All user input, message text, and AI responses are rendered as safe virtual DOM text nodes, eliminating DOM-based and stored XSS vectors.

### 5. HTTP Edge Security Headers
Configured in `public/_headers` and deployed directly to Cloudflare Pages:
- `Content-Security-Policy`: Restricts scripts, frames, images, and API connections to trusted Google, Firebase, Open-Meteo, and WAQI endpoints.
- `X-Frame-Options: DENY` & `frame-ancestors 'none'`: Comprehensive clickjacking defense.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing vulnerabilities.
- `Referrer-Policy: strict-origin-when-cross-origin`: Shields user navigation paths.
- `Permissions-Policy`: Shuts down sensitive device sensors (`camera=()`, `microphone=()`, `payment=()`, `usb=()`, `interest-cohort=()`).

### 6. Privacy & Sensitive Health Data Isolation
- **Device-Local Storage**: Family health conditions (asthma, COPD, cardiovascular vulnerabilities) are stored **strictly on the user's local device** (`localStorage`) keyed to their Firebase `uid` (`foggy_profile_${uid}`).
- **No Telemetry or Profiling**: We never broker, sell, or monetize user data.
- **Zero Server-Side Logging**: Serverless functions never write message text, health attributes, or personal identities to server logs.
- **One-Click Erasure**: The *What Foggy Knows* memory inspector allows users to review, edit, or permanently wipe all stored data via the **"Clear All My Data"** button.

### 7. Dependency Security & Hygiene
- Dependency trees are kept clean and free of vulnerabilities via regular `pnpm audit` / `npm audit` checks (0 known vulnerabilities).
- Transitive dependencies are pinned securely to mitigate supply chain risks.

---

## 📘 Usage Guide

1. **Sign In**: Launch the app and click **"Try 1-Click Demo Profile"** or create a new account.
2. **Check the Dashboard**: Review your local AQI score, the 24-hour inversion curve, and the recommended low-emission daily routine.
3. **Chat with Foggy**: Ask Foggy to plan your day, provide a budget DIY purifier recipe, or evaluate if it is safe for your child to play cricket outside today.
4. **Explore Indoor Hacks**: Select the *Indoor Hacks* page to view instructions for building a Corsi-Rosenthal box for ~₹2,500–₹3,500.
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

## 👨‍💻 Developer & Authors
Developed with ❤️ by **Rishav Nandi** — empowering families and communities to navigate severe smog with accessible GenAI and practical science.

---

## 📄 License
This project is open-source and distributed under the **MIT License**. See the `LICENSE` file for details.

---

*Foggy — Because everyone deserves clean air, practical solutions, and peace of mind.*
