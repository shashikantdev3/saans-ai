/**
 * Builds today's plan from forecast data and the household profile.
 * Everything here is deterministic. Gemini only rewords the result for people; it never
 * computes or changes a number.
 */
import { pm25Band, type AqiBand } from '../aqi/bands';
import { indianAqi, type IndianAqi } from '../aqi/cpcb';
import type { AirData } from '../data/types';
import { doseByPlace, totalDose, type Place } from '../impact/dose';
import { indoorHacks, type Hack } from '../impact/hacks';
import { percentCut } from '../impact/indoor';
import type { Profile } from '../profile/schema';
import { chooseAlternative, type Alternative } from './alternative';
import {
  bestWindow,
  commuteRule,
  cookingRule,
  heatingRule,
  maskRule,
  next24,
  outdoorRule,
  planItem,
  windowsRule,
  worstWindow,
  type HourWindow,
  type PlanItem,
} from './rules';
import { daySlots } from './schedule';

export type { Alternative } from './alternative';

export interface DoseSummary {
  baselineUg: number;
  planUg: number;
  percentCut: number;
  baselineByPlace: Record<Place, number>;
  planByPlace: Record<Place, number>;
}

export interface Plan {
  timezone: string;
  now: string;
  aqi: IndianAqi | null;
  currentPm25: number | null;
  usAqi: number | null;
  band: AqiBand;
  best: HourWindow;
  worst: HourWindow;
  forecast: HourWindow[];
  items: PlanItem[];
  dose: DoseSummary;
  hacks: Hack[];
  alternative: Alternative;
}

export class InsufficientDataError extends Error {
  constructor() {
    super('Not enough forecast data to build a plan');
    this.name = 'InsufficientDataError';
  }
}

const sortByTime = (a: PlanItem, b: PlanItem) => (a.time ?? '99').localeCompare(b.time ?? '99');

export function buildPlan(air: AirData, profile: Profile): Plan {
  const windows = next24(air.hours, air.nowIndex);
  const best = bestWindow(windows);
  const worst = worstWindow(windows);
  if (!best || !worst || windows.length < 12) throw new InsufficientDataError();

  const aqi = indianAqi(air.hours, air.nowIndex);
  const nowHour = air.hours[air.nowIndex];
  const currentPm25 = nowHour?.pm2_5 ?? null;
  const band = aqi?.band.band ?? pm25Band(currentPm25 ?? best.pm25);

  const items = [
    outdoorRule(best),
    windowsRule(best, band),
    maskRule(band, profile),
    commuteRule(band, profile, best),
    cookingRule(profile, band),
    heatingRule(profile),
    planItem('cleaning_wet', 'info'),
    planItem('no_burning', 'caution'),
  ]
    .filter((i): i is PlanItem => i !== null)
    .sort(sortByTime);

  const baselineSlots = daySlots(windows, profile, 'baseline', best, band);
  const planSlots = daySlots(windows, profile, 'plan', best, band);
  const baselineUg = totalDose(baselineSlots);
  const planUg = totalDose(planSlots);

  return {
    timezone: air.timezone,
    now: nowHour?.time ?? '',
    aqi,
    currentPm25: currentPm25 === null ? null : Math.round(currentPm25),
    usAqi: nowHour?.usAqi ?? null,
    band,
    best,
    worst,
    forecast: windows,
    items,
    dose: {
      baselineUg: Math.round(baselineUg),
      planUg: Math.round(planUg),
      percentCut: percentCut(baselineUg, planUg),
      baselineByPlace: roundAll(doseByPlace(baselineSlots)),
      planByPlace: roundAll(doseByPlace(planSlots)),
    },
    hacks: indoorHacks({
      outdoorPm25: currentPm25 ?? best.pm25,
      roomSizeM2: profile.roomSizeM2,
      hasPurifier: profile.hasPurifier,
    }),
    alternative: chooseAlternative(profile),
  };
}

function roundAll(r: Record<Place, number>): Record<Place, number> {
  return {
    home: Math.round(r.home),
    work: Math.round(r.work),
    commute: Math.round(r.commute),
    outdoor: Math.round(r.outdoor),
  };
}
