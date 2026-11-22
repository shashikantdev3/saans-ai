# Problem Alignment

**Challenge 6: Urban Air Quality Assistant.** Every winter, smog in north Indian cities stays in the unhealthy range for weeks. Families see an AQI number but not what to do with it: when the children can go out, whether to open the windows, whether a purifier is enough, how to get to work with less exposure. Saans turns the readings into those answers.

## 1. Requirement by requirement

| Challenge asks for          | Saans feature                                                                                       | Code                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Location-aware guidance     | Five city sectors with AQI, PM2.5, PM10, NO2, CO, O3, wind, temperature and inversion risk; heatmap | `src/components/Dashboard`, `src/hooks/useAirAnalytics.ts`    |
| Tailored to lifestyle       | Six household profiles with sensitivity levels; Ask Saans and routine plans use the active profile  | `src/lib/constants/personas.ts`                               |
| Low-emission daily routines | Hour-by-hour plan, best outdoor window, inhaled dose and CO2 saved                                  | `src/components/Routine`, `server/aiService.ts`               |
| Indoor air hacks            | Purifier sizing for 4 air changes an hour, window schedule around the inversion, DIY filter box     | `src/components/IAQ`, `src/lib/compute/cadrCalculations.ts`   |
| Sustainable alternatives    | Lowest-exposure route (Dijkstra) and a dose and CO2 comparison across travel modes                  | `src/components/Transit`, `src/lib/compute/dijkstraRouter.ts` |
| Explain the impact          | Dose in µg·h, CO2 in kg, community PM2.5 and CO2 averted by pledges                                 | `src/lib/compute/commuteDose.ts`, `src/components/Community`  |
| GenAI                       | Ask Saans, routine wording, multilingual emergency advisories                                       | `server/askService.ts`, `server/aiService.ts`                 |

## 2. Who it is for

| Household                | What Saans changes for them                               |
| ------------------------ | --------------------------------------------------------- |
| Asthmatic child, newborn | Stricter indoor hours, purifier sizing, earlier alerts    |
| Elderly relative         | Midday-only outings, welfare check reminders              |
| Commuter, school run     | Metro and clean-corridor routes, mask advice by hour      |
| Community lead           | Pledges with measured impact and ready-to-send advisories |

## 3. Languages

English, Hindi, Arabic and Spanish. Gemini answers and advisories follow the selected language, and key interface labels are translated.

## 4. Honest limits

- Readings are sample telemetry for five representative sectors, with controls to simulate a smog spike or clean-up. Connecting a live feed is the next step.
- Advice is general guidance, not medical advice.
