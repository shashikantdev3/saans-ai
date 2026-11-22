// ============================================================
// server/aiService.ts
// Daily routine plans and emergency advisories.
// Deterministic rules decide every hour, AQI value and score;
// Gemini only writes the words around them. If Gemini is
// unavailable or returns something unusable, the rules text stays.
// ============================================================

import { generateWithGemini, toPlainText } from './gemini.js';
import { sanitizeText, type ValidatedPersona, type ValidatedZone } from './validators.js';

export type AiSource = 'gemini' | 'rules';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (Devanagari script)',
  ar: 'Arabic',
  es: 'Spanish',
};

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? 'English';
}

export const SAANS_RULES = `You are Saans, an air-quality assistant helping Indian families get through winter smog.
Write short, practical, kind guidance. Never change or invent numbers; use only the figures you are given.
Do not diagnose and do not name medicines or doses. For serious symptoms, tell people to call 112.`;

function outdoorWindow(zone: ValidatedZone) {
  return zone.inversionRisk ? { start: 13, end: 16 } : { start: 11, end: 17 };
}

function buildHourlySlots(persona: ValidatedPersona, zone: ValidatedZone) {
  const isHighRisk = persona.sensitivityLevel === 'high' || zone.aqi > 150;
  const { start: safeStart, end: safeEnd } = outdoorWindow(zone);

  return [7, 8, 9, 12, 14, 17, 19, 21].map((h) => {
    const isMorningInversion = h >= 7 && h <= 10 && zone.inversionRisk;
    const isMiddaySafe = h >= safeStart && h <= safeEnd;

    let recommendation: 'safe-outdoor' | 'moderate-caution' | 'indoor-only' | 'mask-required' =
      'moderate-caution';
    let activity = 'Indoor work or rest';
    let healthNote = 'Keep the purifier on and close gaps around doors and windows.';

    if (isMorningInversion) {
      recommendation = 'indoor-only';
      activity = 'Stay indoors with the purifier on';
      healthNote = `Morning inversion traps smog near the ground (AQI ${zone.aqi}). Keep doors and windows shut.`;
    } else if (isMiddaySafe && zone.aqi < 200) {
      recommendation = isHighRisk ? 'moderate-caution' : 'safe-outdoor';
      activity = isHighRisk ? 'Short walk outside with an N95' : 'Best time for errands and travel';
      healthNote = 'Midday sun lifts the smog layer, so the air mixes and clears the most.';
    } else if (h >= 17) {
      recommendation = isHighRisk ? 'indoor-only' : 'mask-required';
      activity = 'Evening indoors: cooking and family time';
      healthNote = 'Evening traffic and cooling air push PM2.5 back up.';
    }

    return {
      hour: h,
      timeLabel: `${h.toString().padStart(2, '0')}:00`,
      activity,
      recommendation,
      predictedAQI: Math.max(
        30,
        Math.round(isMorningInversion ? zone.aqi * 1.15 : isMiddaySafe ? zone.aqi * 0.7 : zone.aqi),
      ),
      smogDispersionFactor: isMiddaySafe ? 0.85 : 0.35,
      inversionLikelihood: isMorningInversion ? 'high' : isMiddaySafe ? 'low' : 'moderate',
      healthImpactNotes: healthNote,
      environmentalOffsetNotes: 'Taking the metro instead of a car saves about 1.8 kg CO2.',
    };
  });
}

export function generateHeuristicRoutine(
  persona: ValidatedPersona,
  zone: ValidatedZone,
  language: string,
) {
  const isHighRisk = persona.sensitivityLevel === 'high' || zone.aqi > 150;
  const { start, end } = outdoorWindow(zone);

  return {
    generatedAt: Date.now(),
    persona: persona.name,
    language,
    aiSource: 'rules' as AiSource,
    optimalOutdoorWindow: {
      startHour: start,
      endHour: end,
      rationale: `Midday sun breaks the smog layer between ${start}:00 and ${end}:00, when ground-level PM2.5 is usually lowest.`,
    },
    hourlySchedule: buildHourlySlots(persona, zone),
    totalExposureScore: Math.round(zone.pm25 * (isHighRisk ? 2.1 : 4.5)),
    carbonOffsetKg: 3.4,
    generalAdvice: [
      'Run a HEPA purifier sized for at least 4 air changes an hour in bedrooms.',
      'Keep windows shut in the early morning (6 to 10 AM) when the air is most still.',
      'Outdoors, wear a well-fitted N95; cloth masks do not stop PM2.5.',
      'Check on elderly neighbours and anyone with asthma when AQI goes above 150.',
    ],
  };
}

interface ModelRoutineText {
  rationale?: unknown;
  slots?: unknown;
  advice?: unknown;
}

/** Gemini rewrites the words of the rules plan; numbers and hours never change. */
export async function getAiRoutineInsights(
  persona: ValidatedPersona,
  zone: ValidatedZone,
  lang: string,
) {
  const base = generateHeuristicRoutine(persona, zone, lang);
  const { startHour, endHour } = base.optimalOutdoorWindow;

  const prompt = `Household: ${persona.name} (${persona.subCategory}, sensitivity ${persona.sensitivityLevel})
Area: ${zone.zoneName} | AQI ${zone.aqi} | PM2.5 ${zone.pm25} ug/m3 | NO2 ${zone.no2} ppb | ${zone.temperatureC} C | wind ${zone.windSpeedKmh} km/h | morning inversion: ${zone.inversionRisk ? 'yes' : 'no'}
Best outdoor window (fixed): ${startHour}:00 to ${endHour}:00
Hours and decisions (fixed): ${base.hourlySchedule.map((s) => `${s.timeLabel} ${s.recommendation} (AQI ${s.predictedAQI})`).join('; ')}

Write the guidance for this household in ${languageName(lang)}. Return JSON only:
{"rationale": "max 30 words: why ${startHour}:00 to ${endHour}:00 is the best outdoor window today",
 "slots": [{"hour": 7, "activity": "max 8 words", "healthNote": "max 20 words"}],
 "advice": ["4 tips specific to this household, max 18 words each"]}
Include one slot for every hour listed, using the same hour numbers, and make each activity fit that hour's decision.
Quote numbers only exactly as given above and with the same label: an AQI value is never a PM2.5 value.`;

  const result = await generateWithGemini({ prompt, systemInstruction: SAANS_RULES, json: true });
  if (!result) return base;

  let parsed: ModelRoutineText;
  try {
    parsed = JSON.parse(result.text.match(/\{[\s\S]*\}/)?.[0] ?? '') as ModelRoutineText;
  } catch {
    return base;
  }

  const slots = Array.isArray(parsed.slots) ? (parsed.slots as Record<string, unknown>[]) : [];
  const advice = Array.isArray(parsed.advice)
    ? parsed.advice.filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
    : [];
  if (typeof parsed.rationale !== 'string' || slots.length === 0 || advice.length < 2) return base;

  return {
    ...base,
    aiSource: 'gemini' as AiSource,
    model: result.model,
    optimalOutdoorWindow: {
      ...base.optimalOutdoorWindow,
      rationale: toPlainText(sanitizeText(parsed.rationale, 400), 400),
    },
    hourlySchedule: base.hourlySchedule.map((slot) => {
      const written = slots.find((s) => s && s.hour === slot.hour);
      if (
        !written ||
        typeof written.activity !== 'string' ||
        typeof written.healthNote !== 'string'
      ) {
        return slot;
      }
      return {
        ...slot,
        activity: toPlainText(sanitizeText(written.activity, 120), 120),
        healthImpactNotes: toPlainText(sanitizeText(written.healthNote, 240), 240),
      };
    }),
    generalAdvice: advice.slice(0, 4).map((a) => toPlainText(sanitizeText(a, 240), 240)),
  };
}

export function fallbackAdvisory(zone: ValidatedZone): string {
  return `EMERGENCY SMOG ADVISORY: ${zone.zoneName} is reporting AQI ${zone.aqi} (PM2.5: ${zone.pm25} µg/m³).${
    zone.inversionRisk ? ' A morning inversion is trapping smog near the ground.' : ''
  } Schools should move outdoor activities indoors. People at high risk should keep windows shut and run a HEPA purifier. Commuters should take the metro instead of cycling or walking along busy roads.`;
}

export async function getEmergencyAdvisoryText(
  zone: ValidatedZone,
  lang: string,
): Promise<{ advisory: string; source: AiSource; model?: string }> {
  const prompt = `Write an urgent public safety smog advisory of 2 or 3 sentences in ${languageName(lang)} for ${zone.zoneName}.
Readings: AQI ${zone.aqi}, PM2.5 ${zone.pm25} ug/m3, morning inversion: ${zone.inversionRisk ? 'yes' : 'no'}.
Cover masks, keeping homes sealed, and checking on vulnerable neighbours. Return only the advisory text.`;

  const result = await generateWithGemini({
    prompt,
    systemInstruction: SAANS_RULES,
    maxOutputTokens: 1024,
  });
  if (result) {
    return { advisory: toPlainText(result.text, 900), source: 'gemini', model: result.model };
  }
  return { advisory: fallbackAdvisory(zone), source: 'rules' };
}
