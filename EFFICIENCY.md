# Efficiency

- **Deterministic first.** AQI, dose, emissions and the plan are computed in code in milliseconds. Gemini is called only to word the plan and to answer chat questions.
- **Caching.** Open-Meteo responses are cached for 15 minutes in memory and through Next.js fetch revalidation. Coordinates are rounded to 0.1°, so nearby users share entries.
- **Fewer calls.** Air quality and wind are fetched in parallel; a failed wind call does not block air quality.
- **Model use.** Flash-Lite model, 600 to 700 output tokens, last 6 chat turns, at most 4 tool rounds, 12 to 20 second timeouts, streaming answers.
- **Quota guard.** Stops before the free tier limit and pauses after a 429, falling back to rule-based text instead of failing.
- **Front end.** No chart library (hand-drawn SVG), memoised components, self-hosted font subsets, a standalone server build.
