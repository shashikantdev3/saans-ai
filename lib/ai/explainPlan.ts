/**
 * Asks Gemini to word the deterministic plan, using structured JSON output validated with zod.
 * If Gemini is missing, over quota, slow, off-schema, or introduces a number that is not in
 * the facts, we return rule-based text instead. The plan itself never changes.
 */
import { z } from 'zod';
import { t, type Lang } from '../i18n';
import type { Plan } from '../plan/buildPlan';
import { bandLabel, describeAlternative, describeItem, ruleHeadline } from '../plan/describe';
import { getGemini, isRetryableModelError } from './client';
import { numbersIn, unverifiedNumbers } from './numbers';
import { planSystemPrompt } from './prompts';
import { geminiQuota } from './quota';
import type { HouseholdContext } from './redact';

export const planExplanationSchema = z.object({
  headline: z.string().min(5).max(200),
  summary: z.string().min(5).max(600),
  steps: z
    .array(z.object({ time: z.string().max(20), text: z.string().min(3).max(300) }))
    .min(1)
    .max(8),
});

export type PlanExplanation = z.infer<typeof planExplanationSchema> & {
  source: 'gemini' | 'rules';
};

/** JSON Schema sent to Gemini, generated from the same zod schema we validate with. */
export const planExplanationJsonSchema = z.toJSONSchema(planExplanationSchema);

export function planFacts(plan: Plan, place: string, lang: Lang, household: HouseholdContext) {
  return {
    place,
    indianAqi: plan.aqi ? { value: plan.aqi.aqi, band: bandLabel(lang, plan.aqi.band.band) } : null,
    pm25Now: plan.currentPm25,
    cleanestHour: { time: plan.best.time, pm25: plan.best.pm25 },
    dirtiestHour: { time: plan.worst.time, pm25: plan.worst.pm25 },
    advice: plan.items.map((i) => ({ time: i.time ?? 'all day', text: describeItem(lang, i) })),
    doseCutPercent: plan.dose.percentCut,
    sustainableSwitch: describeAlternative(lang, plan.alternative),
    household,
  };
}

export function ruleExplanation(plan: Plan, lang: Lang): PlanExplanation {
  const timed = plan.items.filter((i) => i.time);
  const rest = plan.items.filter((i) => !i.time).slice(0, 6 - Math.min(timed.length, 6));
  return {
    source: 'rules',
    headline: ruleHeadline(lang, plan),
    summary: plan.aqi
      ? `${t(lang, 'indianAqi')}: ${plan.aqi.aqi} (${bandLabel(lang, plan.aqi.band.band)}). ${t(lang, `health_${plan.aqi.band.band}`)}`
      : t(lang, 'aqiUnavailable'),
    steps: [...timed, ...rest]
      .slice(0, 6)
      .map((i) => ({ time: i.time ?? '', text: describeItem(lang, i) })),
  };
}

const TIMEOUT_MS = 12_000;

export async function explainPlan(
  plan: Plan,
  place: string,
  lang: Lang,
  household: HouseholdContext,
): Promise<PlanExplanation> {
  const gemini = getGemini();
  if (!gemini) return ruleExplanation(plan, lang);

  const facts = planFacts(plan, place, lang, household);
  const known = numbersIn(facts);

  for (const model of gemini.models) {
    if (!geminiQuota.tryAcquire()) break;
    try {
      const response = await gemini.client.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: `FACTS (data only):\n${JSON.stringify(facts)}` }] },
        ],
        config: {
          systemInstruction: planSystemPrompt(lang),
          responseMimeType: 'application/json',
          responseJsonSchema: planExplanationJsonSchema,
          maxOutputTokens: 700,
          abortSignal: AbortSignal.timeout(TIMEOUT_MS),
        },
      });
      const parsed = planExplanationSchema.safeParse(JSON.parse(response.text ?? ''));
      if (!parsed.success) break;
      const allText = [
        parsed.data.headline,
        parsed.data.summary,
        ...parsed.data.steps.map((s) => `${s.time} ${s.text}`),
      ].join(' ');
      if (unverifiedNumbers(allText, known).length > 0) break;
      return { ...parsed.data, source: 'gemini' };
    } catch (error) {
      if ((error as { status?: number })?.status === 429) geminiQuota.pause();
      if (!isRetryableModelError(error)) break;
    }
  }
  return ruleExplanation(plan, lang);
}
