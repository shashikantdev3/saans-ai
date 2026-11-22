/**
 * Builds today's plan from forecast data and the household profile.
 * Everything here is deterministic. Gemini only rewords the result for people; it never
 * computes or changes a number.
 */
import { pm25Band, type AqiBand } from '../aqi/bands';
import { indianAqi, type IndianAqi } from '../aqi/cpcb';
import type { AirData } from '../data/types';
import { doseByPlace, totalDose, type Activity, type DoseSlot, type Place } from '../impact/dose';
import {
  cleanerAlternative,
  commuteSwitchSaving,
  generatorVsInverter,
  type CommuteMode,
} from '../impact/emissions';
import { FACTORS } from '../impact/factors';
import { indoorHacks, type Hack } from '../impact/hacks';
import { ioRatio, percentCut, roomVolume } from '../impact/indoor';
import type { Profile } from '../profile/schema';
import {
  bestWindow,
  commuteRule,
  cookingRule,
  heatingRule,
  maskRule,
  next24,
  outdoorRule,
  shouldWorkFromHome,
  windowsRule,
  worstWindow,
  type HourWindow,
  type PlanItem,
} from './rules';

export type Alternative =
  | {
      kind: 'commute';
      from: CommuteMode;
      to: CommuteMode;
      kmOneWay: number;
      commuteDays: number;
      gramsPerDay: number;
      kgPerWeek: number;
      percent: number;
    }
  | { kind: 'generator'; kwh: number; dieselKg: number; inverterKg: number }
  | { kind: 'cooking_fuel' }
  | { kind: 'walk_errands' };

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

const SLEEP_START = 23;
const SLEEP_END = 6;
const LEAVE_HOUR = 9;
const RETURN_HOUR = 18;
const COMMUTE_KMH = 20;
/** Typical daily generator use when someone says they use one (assumption). */
const GENERATOR_KWH_PER_DAY = 4;

type Scenario = 'baseline' | 'plan';

function commuteFactor(mode: CommuteMode, scenario: Scenario): number {
  if (mode === 'metro') return FACTORS.inVehicleClosed.value;
  if ((mode === 'car' || mode === 'carpool') && scenario === 'plan')
    return FACTORS.inVehicleClosed.value;
  return FACTORS.inVehicleOpen.value;
}

function commuteActivity(mode: CommuteMode): Activity {
  if (mode === 'walk' || mode === 'cycle') return 'moderate';
  if (mode === 'two_wheeler') return 'light';
  return 'rest';
}

/**
 * One representative adult's day.
 * Baseline ("do nothing"): windows open in the daytime, no purifier, usual outdoor hour,
 * car windows down. Plan: windows shut, purifier on if owned, outdoor time moved to the
 * cleanest hour (or indoors on severe days), car air on recirculation, WFH if worthwhile.
 */
export function daySlots(
  windows: readonly HourWindow[],
  profile: Profile,
  scenario: Scenario,
  best: HourWindow,
  band: AqiBand,
): DoseSlot[] {
  const volume = roomVolume(profile.roomSizeM2);
  const purifierCadr = scenario === 'plan' && profile.hasPurifier ? FACTORS.purifierCadr.value : 0;
  const closedRatio = ioRatio(FACTORS.airExchangeClosed.value, volume, purifierCadr);
  const openRatio = ioRatio(FACTORS.airExchangeOpen.value, volume);
  const officeRatio = ioRatio(FACTORS.airExchangeClosed.value, volume);
  const wfh = scenario === 'plan' && shouldWorkFromHome(band, profile);
  const commutes =
    profile.commuteMode !== 'none' && profile.commuteKm > 0 && profile.wfhDays < 5 && !wfh;
  const legHours = Math.min(2, Math.max(0.25, profile.commuteKm / COMMUTE_KMH));
  const outdoorHour = scenario === 'plan' ? best.hour : profile.usualOutdoorHour;
  const outdoorIndoors = scenario === 'plan' && best.band === 'severe';

  const homeRatio = (hour: number) => {
    if (scenario === 'plan') return closedRatio;
    return hour >= 8 && hour < 20 ? openRatio : ioRatio(FACTORS.airExchangeClosed.value, volume);
  };

  const slots: DoseSlot[] = [];
  for (const w of windows) {
    const base = { hour: w.hour, outdoorPm25: w.pm25 };
    const asleep = w.hour >= SLEEP_START || w.hour < SLEEP_END;
    if (w.hour === outdoorHour && !asleep) {
      slots.push(
        outdoorIndoors
          ? { ...base, place: 'home', activity: 'moderate', factor: closedRatio, hours: 1 }
          : { ...base, place: 'outdoor', activity: 'moderate', factor: 1, hours: 1 },
      );
      continue;
    }
    if (commutes && (w.hour === LEAVE_HOUR || w.hour === RETURN_HOUR)) {
      const rest = 1 - legHours;
      slots.push({
        ...base,
        place: 'commute',
        activity: commuteActivity(profile.commuteMode),
        factor: commuteFactor(profile.commuteMode, scenario),
        hours: Math.min(1, legHours),
      });
      if (rest > 0) {
        const place: Place = w.hour === LEAVE_HOUR ? 'work' : 'home';
        const factor = place === 'work' ? officeRatio : homeRatio(w.hour);
        slots.push({ ...base, place, activity: 'light', factor, hours: rest });
      }
      continue;
    }
    if (commutes && w.hour > LEAVE_HOUR && w.hour < RETURN_HOUR) {
      slots.push({ ...base, place: 'work', activity: 'light', factor: officeRatio, hours: 1 });
      continue;
    }
    slots.push({
      ...base,
      place: 'home',
      activity: asleep ? 'sleep' : 'rest',
      factor: homeRatio(w.hour),
      hours: 1,
    });
  }
  return slots;
}

function chooseAlternative(profile: Profile): Alternative {
  const to = cleanerAlternative(profile.commuteMode, profile.commuteKm);
  const commuteDays = Math.max(0, 5 - profile.wfhDays);
  if (to && commuteDays > 0) {
    const saving = commuteSwitchSaving(profile.commuteMode, to, profile.commuteKm, commuteDays);
    return { kind: 'commute', kmOneWay: profile.commuteKm, commuteDays, ...saving };
  }
  if (profile.usesGenerator)
    return { kind: 'generator', ...generatorVsInverter(GENERATOR_KWH_PER_DAY) };
  if (profile.cookingFuel === 'biomass' || profile.cookingFuel === 'kerosene')
    return { kind: 'cooking_fuel' };
  return { kind: 'walk_errands' };
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
    { id: 'cleaning_wet', severity: 'info', params: {} } as PlanItem,
    { id: 'no_burning', severity: 'caution', params: {} } as PlanItem,
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
