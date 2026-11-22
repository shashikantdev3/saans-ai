# Design decisions

1. **The LLM never does maths.** AQI, dose and emissions are code with cited constants; Gemini only explains. This keeps numbers auditable and testable.
2. **Tools, not context stuffing.** Gemini gets numbers through four function calls that run our own code, and a guard checks its answer against them.
3. **Rule-based fallback everywhere.** The app is fully usable without a key or when the free quota runs out.
4. **Indian AQI computed in house** from CPCB breakpoints (24-hour and 8-hour averages), not taken from a third party, so the method is visible and tested.
5. **Gemini 3.5 Flash-Lite** for its free-tier limits (15 RPM, 500 RPD against 20 RPD for Flash), function calling and structured output.
6. **Privacy by design.** The profile stays in the browser; the server is stateless; Gemini sees a coarse summary only.
7. **No UI or chart libraries** to keep the page light on low-end phones.
8. **Fixtures for tests.** Recorded Open-Meteo responses make CI deterministic and independent of third-party uptime.
