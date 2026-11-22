/**
 * Hour-by-hour day for one representative adult, used for the dose comparison.
 * Two scenarios share the same weather: "baseline" (change nothing) and "plan".
 */
import type { AqiBand } from '../aqi/bands';
import type { Activity, DoseSlot, Place } from '../impact/dose';
import type { CommuteMode } from '../impact/emissions';
import { FACTORS } from '../impact/factors';
import { ioRatio, roomVolume } from '../impact/indoor';
import type { Profile } from '../profile/schema';
import { shouldWorkFromHome, type HourWindow } from './rules';

const SLEEP_START = 23;
const SLEEP_END = 6;
const LEAVE_HOUR = 9;
const RETURN_HOUR = 18;
const COMMUTE_KMH = 20;

export type Scenario = 'baseline' | 'plan';

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
