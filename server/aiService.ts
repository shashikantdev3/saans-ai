// ============================================================
// server/aiService.ts
// Server-side Gemini 3.1 Flash Lite gateway with deterministic heuristic fallback
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ValidatedPersona, ValidatedZone } from './validators.js';

const geminiApiKey = process.env.NODE_ENV === 'test' ? '' : (process.env.GEMINI_API_KEY || '');
const aiClient = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

function buildHourlySlots(persona: ValidatedPersona, zone: ValidatedZone) {
  const isHighRisk = persona.sensitivityLevel === 'high' || zone.aqi > 150;
  const safeStart = zone.inversionRisk ? 13 : 11;
  const safeEnd = zone.inversionRisk ? 16 : 17;

  return [7, 8, 9, 12, 14, 17, 19, 21].map((h) => {
    const isMorningInversion = h >= 7 && h <= 10 && zone.inversionRisk;
    const isMiddaySafe = h >= safeStart && h <= safeEnd;

    let recommendation: 'safe-outdoor' | 'moderate-caution' | 'indoor-only' | 'mask-required' = 'moderate-caution';
    let activity = 'Indoor productive work / rest';
    let healthNote = 'Maintain HEPA filtration and seal drafts.';

    if (isMorningInversion) {
      recommendation = 'indoor-only';
      activity = 'High-efficiency indoor routine (HEPA active)';
      healthNote = `Severe morning inversion: AQI ${zone.aqi}. Alveolar lung irritation risk. Avoid door openings.`;
    } else if (isMiddaySafe && zone.aqi < 200) {
      recommendation = isHighRisk ? 'moderate-caution' : 'safe-outdoor';
      activity = isHighRisk ? 'Gentle outdoor walk with N95' : 'Safe outdoor errands / travel window';
      healthNote = 'Solar radiation has broken thermal boundary layer. Optimum daily air dispersion.';
    } else if (h >= 17) {
      recommendation = isHighRisk ? 'indoor-only' : 'mask-required';
      activity = 'Evening indoor recreation & meal preparation';
      healthNote = 'Evening traffic peak and settling cold air elevate surface PM2.5.';
    }

    return {
      hour: h,
      timeLabel: `${h.toString().padStart(2, '0')}:00`,
      activity,
      recommendation,
      predictedAQI: Math.max(30, Math.round(isMorningInversion ? zone.aqi * 1.15 : isMiddaySafe ? zone.aqi * 0.7 : zone.aqi)),
      smogDispersionFactor: isMiddaySafe ? 0.85 : 0.35,
      inversionLikelihood: isMorningInversion ? 'high' : isMiddaySafe ? 'low' : 'moderate',
      healthImpactNotes: healthNote,
      environmentalOffsetNotes: 'Shifted travel to public electric transit, avoiding 1.8 kg CO2.',
    };
  });
}

export function generateHeuristicRoutine(persona: ValidatedPersona, zone: ValidatedZone, language: string) {
  const isHighRisk = persona.sensitivityLevel === 'high' || zone.aqi > 150;
  const safeStart = zone.inversionRisk ? 13 : 11;
  const safeEnd = zone.inversionRisk ? 16 : 17;

  return {
    generatedAt: Date.now(),
    persona: persona.name,
    language,
    optimalOutdoorWindow: {
      startHour: safeStart,
      endHour: safeEnd,
      rationale: `Thermal solar convection breaks the smog blanket between ${safeStart}:00 and ${safeEnd}:00. Ground PM2.5 drops by up to 35%.`,
    },
    hourlySchedule: buildHourlySlots(persona, zone),
    totalExposureScore: Math.round(zone.pm25 * (isHighRisk ? 2.1 : 4.5)),
    carbonOffsetKg: 3.4,
    generalAdvice: [
      'Equip nursery and bedrooms with CADR-rated HEPA purification (minimum 4 ACH).',
      'Never ventilate rooms during early morning calm winds (6:00 AM - 10:00 AM).',
      'Use N95 / FFP2 respirators if stepping outdoors; simple cloth masks fail against PM2.5.',
      'Check in on elderly neighbors and asthmatic family members when AQI exceeds 150.',
    ],
  };
}

export async function getAiRoutineInsights(persona: ValidatedPersona, zone: ValidatedZone, cleanLang: string) {
  if (aiClient) {
    try {
      const model = aiClient.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
      const prompt = `You are AeroGuard AI, an expert pulmonary health specialist and urban atmospheric scientist.
Generate a structured JSON response for a daily smog defense routine.
Profile: ${persona.name} (${persona.subCategory}, Sensitivity: ${persona.sensitivityLevel})
Urban Zone: ${zone.zoneName}
Telemetry: AQI ${zone.aqi}, PM2.5: ${zone.pm25} ug/m3, NO2: ${zone.no2} ppb, Temp: ${zone.temperatureC}°C, Wind: ${zone.windSpeedKmh} km/h, Inversion Risk: ${zone.inversionRisk}
Language: ${cleanLang}
Return ONLY a strict valid JSON object matching this structure:
{"generatedAt": ${Date.now()}, "persona": "${persona.name}", "optimalOutdoorWindow": {"startHour": 13, "endHour": 16, "rationale": "Clear scientific explanation"}, "hourlySchedule": [{"hour": 8, "timeLabel": "08:00", "activity": "Activity", "recommendation": "indoor-only", "predictedAQI": ${zone.aqi}, "smogDispersionFactor": 0.4, "inversionLikelihood": "high", "healthImpactNotes": "Impact", "environmentalOffsetNotes": "Offset"}], "totalExposureScore": 120, "carbonOffsetKg": 4.2, "generalAdvice": ["string"]}`;

      const aiResponse = await model.generateContent(prompt);
      const jsonMatch = aiResponse.response.text().match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('[AI GATEWAY LOG] Routine generation fallback triggered:', err);
    }
  }
  return generateHeuristicRoutine(persona, zone, cleanLang);
}

export async function getEmergencyAdvisoryText(zone: ValidatedZone, cleanLang: string): Promise<string> {
  if (aiClient) {
    try {
      const model = aiClient.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
      const prompt = `You are AeroGuard AI public safety broadcaster. Generate an urgent 2-sentence public safety smog advisory in language "${cleanLang}" for ${zone.zoneName} reporting AQI ${zone.aqi} (PM2.5: ${zone.pm25} ug/m3, boundary inversion: ${zone.inversionRisk}). Focus on masks, indoor sealing, and vulnerable resident welfare. Return ONLY the advisory text.`;
      const aiResponse = await model.generateContent(prompt);
      const text = aiResponse.response.text().trim();
      if (text) return text;
    } catch (err) {
      console.error('[AI ADVISORY LOG] Falling back to default advisory:', err);
    }
  }
  return `EMERGENCY SMOG ADVISORY: ${zone.zoneName} is reporting AQI ${zone.aqi} (PM2.5: ${zone.pm25} µg/m³). Severe boundary layer inversion detected. All schools should suspend outdoor recreation. High-risk residents must seal room perimeters and run HEPA air filtration. Commuters should avoid open-air cycling and switch to underground metro lines.`;
}
