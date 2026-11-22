# Security

## Threat model and controls

| Risk                  | Control                                                                                                                    | Where                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| API key leak          | Key read only on the server; `server-only` import guard; never sent to the browser; `.env*` git-ignored                    | `lib/ai/client.ts`                             |
| Malicious input       | zod validation on every route, 16 KB body cap, letters-only place names, 500-character questions                           | `lib/security/schemas.ts`, `http.ts`           |
| Abuse and cost        | Per-IP rate limits (hashed keys) and a Gemini quota guard (12/min, 450/day) that falls back to rules                       | `lib/security/rateLimit.ts`, `lib/ai/quota.ts` |
| Prompt injection      | Deterministic pre-check, user text wrapped as data, tools take no location or profile from the model                       | `lib/ai/safety.ts`, `prompts.ts`, `tools.ts`   |
| Hallucinated numbers  | Number guard compares every figure with tool output; plan text falls back to rules on a mismatch                           | `lib/ai/numbers.ts`                            |
| Personal data         | Profile kept in localStorage; Gemini gets a coarse summary; phones and emails scrubbed; coordinates rounded to about 11 km | `lib/ai/redact.ts`, `lib/data/openMeteo.ts`    |
| XSS and clickjacking  | Nonce-based CSP, `frame-ancestors 'none'`, `connect-src 'self'`, React escaping, no `dangerouslySetInnerHTML`              | `proxy.ts`                                     |
| Transport and headers | HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, COOP                                             | `next.config.ts`                               |
| Medical harm          | Emergency wording with 112 before any model call; no diagnosis or medicines                                                | `lib/ai/safety.ts`                             |
| Dependencies          | `npm audit` in CI fails on any advisory                                                                                    | `.github/workflows/ci.yml`                     |

## Known limits

Rate limits and the quota guard are per server instance. A shared store would make them global but is not free at scale.

## Reporting

Please open a private security advisory on the GitHub repository instead of a public issue.
