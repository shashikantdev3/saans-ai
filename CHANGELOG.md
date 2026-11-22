# What changed

## Version 2 (deployed 22 November 2026)

Compared with the first submission, Saans was rebuilt as a faster single-page app with a smaller API, and GenAI is now visible and checkable at every step.

### 1. Highlights

- **New: Ask Saans.** Type any air-quality question and Gemini answers using the selected sector's readings and your household profile. The answer shows its source and the exact prompt that was sent.
- **Gemini writes words, code owns numbers.** In the routine plan, rules fix every hour, AQI value and score; Gemini writes the explanations and tips in your language. Model output is shape-checked before use.
- **Answers always say where they came from:** _Live Gemini answer_ with the model name, _Offline rules_, or _Safety check_.
- **Five focused tabs:** Air Telemetry, Routine Optimizer, Low-Emission Transit, Indoor Air & Hacks, Community Action.

### 2. Product

- Six household profiles instead of one form.
- Lowest-exposure commute route with dose and CO2 per travel mode.
- Purifier (CADR) calculator, inversion-aware window schedule and DIY filter box.
- Community pledges with measured PM2.5 and CO2 impact, plus Gemini advisories in English, Hindi, Arabic or Spanish.
- Light, high-contrast palette; alerts, badges and banners re-coloured so all text is readable.

### 3. Engineering

- Frontend moved from Next.js to React 19 + Vite 6.
- Backend is one Express 5 app, run on Vercel as a single function (`api/index.ts`) and locally with `npm run server`.
- Primary and fallback Gemini models from environment variables, 15-second timeout, then rules.
- 96 tests (was 78 before this release): Ask Saans edge cases, every API route, and Gemini handling with a mocked model.
- CI on Node 22 with read-only permissions; it now runs the API tests too.

### 4. Security

- Emergency wording gets fixed 112 guidance before any model call.
- Questions fenced against prompt injection; 3 to 300 character limit checked on both sides.
- CORS limited to the production site and this project's previews.
- Security headers on every Vercel response; malformed JSON returns 400; unknown API routes return a JSON 404.

### 5. Removed

- The Next.js app, Playwright end-to-end tests and the Dockerfile.

### 6. Trade-off to know

- Version 1 read live air-quality data for any searched city. Version 2 uses sample readings for five representative sectors, with smog spike and clean-up simulation. Connecting a live feed is the next step.
