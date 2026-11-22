/**
 * Tools Gemini can call. Each one runs Saans' deterministic code, so every number the
 * assistant says comes from here. Location and household come from the request context,
 * never from model arguments, so the model cannot be steered to other data.
 */
import type { FunctionDeclaration } from '@google/genai';
import { z } from 'zod';
import { pm25Band } from '../aqi/bands';
import type { AirData } from '../data/types';
import { commuteSwitchSaving, generatorVsInverter } from '../impact/emissions';
import { FACTORS } from '../impact/factors';
import type { Lang } from '../i18n';
import type { Plan } from '../plan/buildPlan';
import { bandLabel, describeAlternative, describeHack, describeItem } from '../plan/describe';
import { COMMUTE_MODES, type Profile } from '../profile/schema';

export interface ToolContext {
  placeName: string;
  air: AirData;
  plan: Plan;
  profile: Profile;
  lang: Lang;
}

export const TOOL_NAMES = [
  'get_air_quality',
  'get_forecast',
  'compute_impact',
  'build_plan',
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

const IMPACT_ACTIONS = [
  'close_windows',
  'run_purifier',
  'fan_filter',
  'no_incense',
  'cook_smart',
  'commute_switch',
  'generator',
  'follow_plan',
] as const;

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_air_quality',
    description:
      "Current air quality at the user's chosen place: Indian AQI (CPCB) with band and main pollutant, US AQI, and current pollutant levels in µg/m³.",
    parametersJsonSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_forecast',
    description:
      'Hourly PM2.5 forecast (µg/m³) with Indian AQI band and wind speed, plus the cleanest and dirtiest hour in the next 24 hours.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        hours: {
          type: 'integer',
          minimum: 1,
          maximum: 72,
          description: 'How many hours ahead, default 24',
        },
      },
    },
  },
  {
    name: 'compute_impact',
    description:
      "Estimated effect of one action for this household, with the formula and sources. Actions: close_windows, run_purifier, fan_filter (DIY box-fan filter), no_incense, cook_smart (exhaust while frying), commute_switch (needs to_mode), generator (diesel generator vs inverter), follow_plan (today's dose cut).",
    parametersJsonSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: [...IMPACT_ACTIONS] },
        to_mode: {
          type: 'string',
          enum: [...COMMUTE_MODES],
          description: 'Only for commute_switch',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'build_plan',
    description:
      "Today's full plan for this household: timed advice (best hour outside, windows, mask, commute, cooking, cleaning), the dose cut, and one sustainable switch.",
    parametersJsonSchema: { type: 'object', properties: {} },
  },
];

const forecastArgs = z.object({ hours: z.number().int().min(1).max(72).optional() });
const impactArgs = z.object({
  action: z.enum(IMPACT_ACTIONS),
  to_mode: z.enum(COMMUTE_MODES).optional(),
});

const stamp = (time: string) => time.replace('T', ' ');

function getAirQuality(ctx: ToolContext) {
  const { plan, air } = ctx;
  const now = air.hours[air.nowIndex];
  return {
    place: ctx.placeName,
    data: 'Modelled forecast (CAMS via Open-Meteo), not station readings',
    localTime: stamp(plan.now),
    indianAqi: plan.aqi
      ? {
          value: plan.aqi.aqi,
          band: bandLabel(ctx.lang, plan.aqi.band.band),
          mainPollutant: plan.aqi.dominant,
          subIndices: plan.aqi.subIndices,
        }
      : 'not enough data',
    usAqi: plan.usAqi,
    nowMicrogramsPerM3: {
      pm2_5: now?.pm2_5,
      pm10: now?.pm10,
      no2: now?.no2,
      o3: now?.o3,
      so2: now?.so2,
    },
  };
}

function getForecast(ctx: ToolContext, args: unknown) {
  const { hours = 24 } = forecastArgs.parse(args ?? {});
  const slice = ctx.air.hours
    .slice(ctx.air.nowIndex, ctx.air.nowIndex + hours)
    .filter((h) => h.pm2_5 !== null)
    .map((h) => ({
      time: stamp(h.time),
      pm25: Math.round(h.pm2_5 ?? 0),
      band: bandLabel(ctx.lang, pm25Band(h.pm2_5 ?? 0)),
      windKmh: h.windSpeed === null ? null : Math.round(h.windSpeed),
    }));
  const { best, worst } = ctx.plan;
  return {
    forecast: slice,
    cleanestHourNext24h: { time: best.time, pm25: best.pm25, band: bandLabel(ctx.lang, best.band) },
    dirtiestHourNext24h: {
      time: worst.time,
      pm25: worst.pm25,
      band: bandLabel(ctx.lang, worst.band),
    },
  };
}

function computeImpact(ctx: ToolContext, args: unknown) {
  const { action, to_mode } = impactArgs.parse(args);
  const { plan, profile, lang } = ctx;
  const indoorFormula =
    'C_in = (P*a*C_out + S/V) / (a + k + CADR/V), steady state, one well-mixed room';
  if (action === 'follow_plan') {
    return {
      action,
      doseCutPercent: plan.dose.percentCut,
      doseIfNothingChangesUg: plan.dose.baselineUg,
      doseWithPlanUg: plan.dose.planUg,
      formula:
        'dose = sum over hours of (PM2.5 breathed x breathing rate x hours), one adult, next 24 hours',
      breathingRateSource: FACTORS.breathingModerate.source,
    };
  }
  if (action === 'commute_switch') {
    const to = to_mode ?? 'metro';
    const days = Math.max(0, 5 - profile.wfhDays);
    const saving = commuteSwitchSaving(profile.commuteMode, to, profile.commuteKm, days);
    return {
      action,
      ...saving,
      kmOneWay: profile.commuteKm,
      commuteDaysPerWeek: days,
      unit: 'grams of CO2',
      source: FACTORS.metroPkm.source,
    };
  }
  if (action === 'generator') {
    const g = generatorVsInverter(4);
    return { action, ...g, note: describeAlternative(lang, { kind: 'generator', ...g }).detail };
  }
  const hack =
    plan.hacks.find((h) => h.id === action) ??
    plan.hacks.find((h) => action === 'run_purifier' && h.id === 'fan_filter');
  if (!hack) return { action, error: 'Not available for this household' };
  return {
    action: hack.id,
    indoorPm25Before: hack.before,
    indoorPm25After: hack.after,
    percentLower: hack.percent,
    microgramsAvoided: hack.avoided,
    confidence: hack.confidence,
    formula: indoorFormula,
    sources: hack.factors.map(
      (f) => `${f}: ${FACTORS[f].value} ${FACTORS[f].unit} (${FACTORS[f].source})`,
    ),
    summary: describeHack(lang, hack).detail,
  };
}

function buildPlanTool(ctx: ToolContext) {
  const { plan, lang } = ctx;
  return {
    advice: plan.items.map((i) => ({ time: i.time ?? 'all day', text: describeItem(lang, i) })),
    doseCutPercent: plan.dose.percentCut,
    sustainableSwitch: describeAlternative(lang, plan.alternative),
  };
}

export function runTool(name: string, args: unknown, ctx: ToolContext): Record<string, unknown> {
  switch (name as ToolName) {
    case 'get_air_quality':
      return getAirQuality(ctx);
    case 'get_forecast':
      return getForecast(ctx, args);
    case 'compute_impact':
      return computeImpact(ctx, args);
    case 'build_plan':
      return buildPlanTool(ctx);
    default:
      return { error: `Unknown tool ${name}` };
  }
}
