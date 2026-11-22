/**
 * Steady-state single-room mass balance for PM2.5.
 *
 *   C_in = (P * a * C_out + S / V) / (a + k + CADR / V)
 *
 *   P    penetration factor (fraction of outdoor particles that get in)
 *   a    air exchange rate (1/h)
 *   k    deposition rate (1/h)
 *   CADR clean air delivery rate of any filter running in the room (m³/h)
 *   V    room volume (m³)
 *   S    indoor source emission rate (µg/h), e.g. incense or frying
 *
 * This is the standard well-mixed indoor model (see Chen & Zhao 2011 in factors.ts).
 * It assumes the room is well mixed and conditions hold long enough to reach steady state
 * (usually 1 to 3 hours), so treat results as estimates, not measurements.
 */
import { FACTORS } from './factors';

export interface IndoorInput {
  outdoor: number;
  airExchange: number;
  volumeM3: number;
  cadrM3h?: number;
  sourceUgPerHour?: number;
  penetration?: number;
  deposition?: number;
}

export function roomVolume(floorAreaM2: number): number {
  return floorAreaM2 * FACTORS.ceilingHeight.value;
}

export function indoorPm25(input: IndoorInput): number {
  const {
    outdoor,
    airExchange: a,
    volumeM3: v,
    cadrM3h = 0,
    sourceUgPerHour = 0,
    penetration: p = FACTORS.penetration.value,
    deposition: k = FACTORS.deposition.value,
  } = input;
  if (v <= 0) throw new RangeError('Room volume must be positive');
  const removal = a + k + cadrM3h / v;
  return (p * a * outdoor + sourceUgPerHour / v) / removal;
}

/** Indoor/outdoor ratio with no indoor sources. */
export function ioRatio(airExchange: number, volumeM3: number, cadrM3h = 0): number {
  return indoorPm25({ outdoor: 1, airExchange, volumeM3, cadrM3h });
}

/** Extra indoor PM2.5 (µg/m³) at steady state while a source burns. */
export function sourceIncrement(
  sourceMgPerHour: number,
  airExchange: number,
  volumeM3: number,
  cadrM3h = 0,
): number {
  return indoorPm25({
    outdoor: 0,
    airExchange,
    volumeM3,
    cadrM3h,
    sourceUgPerHour: sourceMgPerHour * 1000,
  });
}

/** Percentage change from `before` to `after`, as a positive number when it falls. */
export function percentCut(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.round(((before - after) / before) * 100);
}
