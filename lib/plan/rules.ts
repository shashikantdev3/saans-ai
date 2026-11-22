/**
 * Deterministic decision rules for today's plan. Pure functions, no I/O, no LLM.
 * Health guidance follows CPCB AQI categories; it is general advice, not medical advice.
 */
import { bandLevel, pm25Band, type AqiBand } from '../aqi/bands';
import type { HourPoint } from '../data/types';
import type { Profile } from '../profile/schema';
import { hasSensitiveMember } from '../profile/schema';

export type Severity = 'info' | 'caution' | 'warning';

export type PlanItemId =
  | 'outdoor_best'
  | 'outdoor_light_only'
  | 'outdoor_indoor_only'
  | 'windows_open_ok'
  | 'windows_air_out'
  | 'mask_none'
  | 'mask_sensitive'
  | 'mask_all'
  | 'mask_stay_in'
  | 'commute_active'
  | 'commute_two_wheeler'
  | 'commute_car'
  | 'commute_public'
  | 'commute_wfh'
  | 'cooking_clean'
  | 'cooking_gas'
  | 'cooking_solid_fuel'
  | 'heating_coal_danger'
  | 'cleaning_wet'
  | 'no_burning';

export interface PlanItem {
  id: PlanItemId;
  /** Local clock time HH:MM when the item applies, if timed */
  time?: string;
  severity: Severity;
  params: Record<string, string | number>;
}

/** Build a plan item; keeps call sites short and typed. */
export function planItem(
  id: PlanItemId,
  severity: Severity,
  params: PlanItem['params'] = {},
  time?: string,
): PlanItem {
  return time === undefined ? { id, severity, params } : { id, time, severity, params };
}

export interface HourWindow {
  time: string;
  hour: number;
  pm25: number;
  band: AqiBand;
  windSpeed: number | null;
}

export const clockHour = (time: string): number => Number(time.slice(11, 13));
export const clockTime = (time: string): string => time.slice(11, 16);

/** The next 24 forecast hours with a PM2.5 value, starting at the current hour. */
export function next24(hours: readonly HourPoint[], nowIndex: number): HourWindow[] {
  return hours
    .slice(nowIndex, nowIndex + 24)
    .filter((h): h is HourPoint & { pm2_5: number } => h.pm2_5 !== null)
    .map((h) => ({
      time: clockTime(h.time),
      hour: clockHour(h.time),
      pm25: Math.round(h.pm2_5),
      band: pm25Band(h.pm2_5),
      windSpeed: h.windSpeed,
    }));
}

/** Cleanest daytime hour (06:00 to 20:59) in the next 24 hours; falls back to any hour. */
export function bestWindow(windows: readonly HourWindow[]): HourWindow | null {
  const day = windows.filter((w) => w.hour >= 6 && w.hour <= 20);
  const pool = day.length ? day : windows;
  let best: HourWindow | null = null;
  for (const w of pool) if (!best || w.pm25 < best.pm25) best = w;
  return best;
}

export function worstWindow(windows: readonly HourWindow[]): HourWindow | null {
  let worst: HourWindow | null = null;
  for (const w of windows) if (!worst || w.pm25 > worst.pm25) worst = w;
  return worst;
}

const severityFor = (band: AqiBand): Severity =>
  bandLevel(band) >= bandLevel('very_poor')
    ? 'warning'
    : bandLevel(band) >= bandLevel('moderate')
      ? 'caution'
      : 'info';

export function outdoorRule(best: HourWindow): PlanItem {
  const level = bandLevel(best.band);
  const params = { time: best.time, pm25: best.pm25 };
  if (level >= bandLevel('severe'))
    return { id: 'outdoor_indoor_only', severity: 'warning', params };
  if (level >= bandLevel('poor'))
    return { id: 'outdoor_light_only', time: best.time, severity: 'caution', params };
  return { id: 'outdoor_best', time: best.time, severity: 'info', params };
}

export function windowsRule(best: HourWindow, currentBand: AqiBand): PlanItem {
  if (
    bandLevel(currentBand) <= bandLevel('satisfactory') &&
    bandLevel(best.band) <= bandLevel('satisfactory')
  ) {
    return { id: 'windows_open_ok', severity: 'info', params: {} };
  }
  return {
    id: 'windows_air_out',
    time: best.time,
    severity: severityFor(currentBand),
    params: { time: best.time },
  };
}

export function maskRule(band: AqiBand, profile: Profile): PlanItem {
  const level = bandLevel(band);
  if (level >= bandLevel('severe')) return { id: 'mask_stay_in', severity: 'warning', params: {} };
  if (level >= bandLevel('poor')) return { id: 'mask_all', severity: 'warning', params: {} };
  const sensitive = hasSensitiveMember(profile) ? 1 : 0;
  if (level >= bandLevel('moderate')) {
    return { id: 'mask_sensitive', severity: 'caution', params: { sensitive } };
  }
  return { id: 'mask_none', severity: 'info', params: { sensitive } };
}

/** Whether today should be a work-from-home day if the family has any WFH days. */
export function shouldWorkFromHome(band: AqiBand, profile: Profile): boolean {
  return (
    profile.commuteMode !== 'none' &&
    profile.wfhDays > 0 &&
    bandLevel(band) >= bandLevel('very_poor')
  );
}

export function commuteRule(band: AqiBand, profile: Profile, best: HourWindow): PlanItem | null {
  if (profile.commuteMode === 'none' || profile.commuteKm <= 0) return null;
  const severity = severityFor(band);
  const params = { km: profile.commuteKm, time: best.time };
  if (shouldWorkFromHome(band, profile)) return { id: 'commute_wfh', severity: 'warning', params };
  switch (profile.commuteMode) {
    case 'walk':
    case 'cycle':
      return { id: 'commute_active', severity, params };
    case 'two_wheeler':
      return { id: 'commute_two_wheeler', severity, params };
    case 'car':
    case 'carpool':
      return { id: 'commute_car', severity, params };
    default:
      return { id: 'commute_public', severity, params };
  }
}

export function cookingRule(profile: Profile, band: AqiBand): PlanItem {
  if (profile.cookingFuel === 'biomass' || profile.cookingFuel === 'kerosene') {
    return { id: 'cooking_solid_fuel', severity: 'warning', params: {} };
  }
  if (profile.cookingFuel === 'induction')
    return { id: 'cooking_clean', severity: 'info', params: {} };
  return { id: 'cooking_gas', severity: severityFor(band), params: {} };
}

export function heatingRule(profile: Profile): PlanItem | null {
  return profile.heating === 'coal_wood'
    ? { id: 'heating_coal_danger', severity: 'warning', params: {} }
    : null;
}
