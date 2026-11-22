# Testing

| Layer         | Tool                                 | Count  | What it covers                                                                                                                                      |
| ------------- | ------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit          | Vitest                               | 90+    | CPCB breakpoints and averaging, indoor mass balance, dose, emissions, hacks, plan rules, safety, number guard, quota, rate limits, i18n parity, CSP |
| API           | Vitest, mocked Open-Meteo and Gemini | 30+    | All four routes: validation, rate limits, 413/502, structured output, function-calling loop, fallbacks, PII scrubbing                               |
| Components    | Vitest, Testing Library, jsdom       | 25+    | Forms and their errors, AQI labels, chart text alternative, plan source labels, chat trace, full page flow in the DOM                               |
| End to end    | Playwright, mobile and desktop       | 32     | Search, plan, Hindi, chat safety, keyboard use, large text                                                                                          |
| Accessibility | axe-core in Playwright               | in e2e | WCAG 2.1 A and AA on the home page and the full flow                                                                                                |

Coverage thresholds (enforced): 88% lines, statements and functions; 75% branches.

All tests are deterministic: `SAANS_FIXTURES=1` serves recorded Open-Meteo data, and Gemini is mocked.

```bash
npm test
npm run test:coverage
npm run build && npm run test:e2e
```
