# Code quality

## Structure

| Folder                              | Responsibility                                        | Rule                                                                          |
| ----------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `lib/aqi`, `lib/impact`, `lib/plan` | AQI, formulas, decision rules                         | Pure functions: no I/O, no React, no network                                  |
| `lib/data`                          | Open-Meteo clients, 15-minute cache, fixtures         | Every response parsed with zod                                                |
| `lib/ai`                            | Gemini client, tools, prompts, safety, fallbacks      | Server only (`server-only`), except `chatTypes` and `chatMessages`            |
| `lib/security`                      | zod request schemas, rate limits, HTTP helpers        | Shared by every route                                                         |
| `lib/i18n`                          | English and Hindi strings                             | Hindi typed as `Record<MessageKey, string>`, so a missing key fails the build |
| `hooks`                             | App state (`useSaans`), chat (`useChat`), preferences | Components only render                                                        |
| `components`                        | UI, one folder per section                            | Presentational components wrapped in `React.memo`                             |
| `app/api`                           | Four route handlers                                   | Validate, rate limit, call `lib`, return JSON or NDJSON                       |

## Conventions

- TypeScript `strict`, plus `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. No `any`.
- ESLint (`next/core-web-vitals`, `typescript-eslint`) and Prettier, both enforced in CI. `.editorconfig` for editors.
- Every constant in the impact engine lives in `lib/impact/factors.ts` with its unit, source and confidence. There are no magic numbers in the formulas.
- Discriminated unions for chat events and plan alternatives, so `switch` statements are exhaustive.
- Each module starts with a comment saying what it does and why. Exported functions have JSDoc where the name is not enough.
- No file over 270 lines; the largest are the two translation tables.

## How to check

```bash
npm run check   # lint, format, types, tests with coverage thresholds
```
