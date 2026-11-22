# Security

Saans handles no accounts, no payments and no personal records. The main risks are leaking the Gemini key, abuse of the AI endpoints, prompt injection, and the model giving wrong or harmful advice. This page lists each risk, the control for it, and where the control lives.

## 1. Threat model

| Risk                        | Control                                                                                                                                                           | Where                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Gemini key leak             | Key read only on the server from `GEMINI_API_KEY`; never sent to the browser; `.env` is git-ignored                                                               | `server/gemini.ts`, `.gitignore`          |
| Malformed or hostile input  | Type guards with range checks on every zone and profile field; control characters stripped; 16 KB body cap; bad JSON gets 400                                     | `server/validators.ts`, `server.ts`       |
| Oversized questions         | Ask Saans accepts 3 to 300 characters, checked in the browser and again on the server                                                                             | `AskSaans.tsx`, `server.ts`               |
| Abuse and cost              | 30 AI requests per minute per IP; repeated routine requests served from a 15-minute cache (max 100 entries)                                                       | `server/middleware.ts`, `server/cache.ts` |
| Prompt injection            | User text is fenced inside `<question>` with angle brackets removed; system rules tell Gemini never to follow instructions in it and to refuse off-topic requests | `server/askService.ts`                    |
| Hallucinated numbers        | Rules compute every hour, AQI value and score; Gemini only writes text, and its JSON is shape-checked before use                                                  | `server/aiService.ts`                     |
| Medical harm                | Emergency words (for example "cannot breathe", "chest pain", "साँस नहीं") get fixed 112 guidance before any model call; no diagnosis, medicine names or doses       | `server/askService.ts`                    |
| Silent AI failure           | 15-second timeout, fallback model, then rules; every answer is labelled with its source                                                                           | `server/gemini.ts`, `AiSourceBadge.tsx`   |
| Cross-site calls to the API | CORS allows only the production site, this project's Vercel previews and localhost                                                                                | `server/middleware.ts`                    |
| XSS and clickjacking        | Content Security Policy with `script-src 'self'` and `frame-ancestors 'none'`; React escaping; no `dangerouslySetInnerHTML`                                       | `vercel.json`, `server/middleware.ts`     |
| Error detail leaks          | Unknown errors return a generic 500; unknown API routes return a JSON 404                                                                                         | `server.ts`                               |

## 2. Data handling

- Household profile, rooms and pledges stay in the browser's `localStorage`.
- The server keeps nothing on disk. The only server-side state is the in-memory routine cache, keyed by a SHA-256 hash of the request.
- Gemini receives the sector readings, the profile name and sensitivity level, the language and the typed question. Nothing else.

## 3. Headers

On Vercel, `vercel.json` sets these on every response. Locally, Helmet sets a similar policy.

- `Content-Security-Policy`: `default-src 'self'`, no inline scripts, no framing
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: camera, microphone and location off

## 4. Supply chain and CI

- `npm ci` installs exactly what `package-lock.json` pins.
- The CI workflow runs with read-only repository permissions.
- Lint, type checks, 96 tests and the production build must pass on every push.

## 5. Reporting a vulnerability

Please do not open a public issue. Report it privately through the repository's **Security** tab ("Report a vulnerability"), with steps to reproduce. Only the `main` branch is supported.
