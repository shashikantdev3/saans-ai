/**
 * Inhaled PM2.5 dose:  dose (µg) = Σ  C_exposure (µg/m³) x breathing rate (m³/h) x hours
 * where C_exposure = outdoor PM2.5 x the factor for where the person is
 * (indoor/outdoor ratio at home, in-vehicle ratio while commuting, 1.0 outdoors).
 * Breathing rates come from the US EPA Exposure Factors Handbook (see factors.ts).
 */
import { FACTORS } from './factors';

export type Activity = 'sleep' | 'rest' | 'light' | 'moderate';
export type Place = 'home' | 'work' | 'commute' | 'outdoor';

export interface DoseSlot {
  /** Local clock hour 0..23, for display */
  hour: number;
  outdoorPm25: number;
  place: Place;
  activity: Activity;
  /** Fraction of the outdoor level the person breathes in this slot */
  factor: number;
  hours: number;
}

export function breathingRate(activity: Activity): number {
  switch (activity) {
    case 'sleep':
      return FACTORS.breathingSleep.value;
    case 'rest':
      return FACTORS.breathingRest.value;
    case 'light':
      return FACTORS.breathingLight.value;
    case 'moderate':
      return FACTORS.breathingModerate.value;
  }
}

export function slotDose(slot: DoseSlot): number {
  return slot.outdoorPm25 * slot.factor * breathingRate(slot.activity) * slot.hours;
}

/** Total inhaled PM2.5 in µg over all slots. */
export function totalDose(slots: readonly DoseSlot[]): number {
  return slots.reduce((sum, s) => sum + slotDose(s), 0);
}

/** Dose grouped by place, for the breakdown chart. */
export function doseByPlace(slots: readonly DoseSlot[]): Record<Place, number> {
  const out: Record<Place, number> = { home: 0, work: 0, commute: 0, outdoor: 0 };
  for (const s of slots) out[s.place] += slotDose(s);
  return out;
}
