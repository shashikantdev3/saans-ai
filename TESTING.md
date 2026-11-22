# Testing

96 automated tests in 9 Vitest files. They run in about 5 seconds and need no network or API key: Gemini is switched off in tests or replaced with a mock.

## 1. What is covered

| File                     | Tests | What it proves                                                                                 |
| ------------------------ | ----- | ---------------------------------------------------------------------------------------------- |
| `aqiBreakpoints.test.ts` | 18    | AQI breakpoints and band edges                                                                 |
| `aqiCommute.test.ts`     | 17    | Commute dose and CO2 per travel mode                                                           |
| `aqiIaq.test.ts`         | 11    | Room volume, CADR target, air changes, clean-air time                                          |
| `routing.test.ts`        | 7     | Dijkstra lowest-exposure route                                                                 |
| `rendering.test.tsx`     | 8     | Each tab renders with its landmarks                                                            |
| `dom.test.tsx`           | 7     | Tab switching, persona choice, smog simulation, pledges                                        |
| `askSaans.test.tsx`      | 5     | Ask Saans: empty question, over 300 characters, Gemini answer with prompt, server error shown  |
| `api.test.ts`            | 18    | Every API route over real HTTP: valid input, bad input, emergency wording, headers, rate limit |
| `aiService.test.ts`      | 5     | Gemini text merged without changing any number; bad JSON and outages fall back to rules        |

## 2. Edge cases tested on purpose

- Empty, whitespace-only and over-long questions are rejected in the browser and on the server.
- Out-of-range readings (for example AQI -99) and incomplete profiles return 400 with a clear message.
- Malformed JSON returns 400, unknown API routes return a JSON 404.
- "Cannot breathe" and "chest pain" get fixed 112 guidance and never reach the model.
- Prompt text with angle brackets cannot break out of the `<question>` fence.
- Gemini returning invalid JSON, or nothing at all, still produces a usable plan.

## 3. Run

```bash
npm run test:run       # all tests once
npm test               # watch mode
npm run test:coverage  # with coverage
```

CI runs the full suite on every push, after lint and type checks and before the production build.
