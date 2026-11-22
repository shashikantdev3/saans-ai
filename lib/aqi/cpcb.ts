/**
 * Indian National Air Quality Index (NAQI), computed in our own code.
 *
 * Source: Central Pollution Control Board (CPCB), "National Air Quality Index",
 * Control of Urban Pollution Series CUPS/82/2014-15 (October 2014), breakpoint table and
 * sub-index formula:  Ip = ((IHi - ILo) / (BHi - BLo)) * (Cp - BLo) + ILo
 *
 * Averaging rules from the same document:
 *  - PM2.5, PM10, NO2, SO2: 24-hour average (we need at least 16 valid hours, as CPCB does)
 *  - O3, CO: 8-hour average (we take the highest 8-hour running mean in the last 24 hours)
 *  - The AQI is the highest sub-index, and needs at least 3 pollutants including PM2.5 or PM10.
 *
 * CPCB publishes concentrations as whole numbers (CO to one decimal), so we round before lookup;
 * that removes the gaps in the table (for example 30 to 31 for PM2.5).
 *
 * Assumption (ours, not CPCB's): the Severe band has no published upper concentration.
 * We map [Severe lower bound, 1.5 x that bound] onto 401..500 and cap at 500.
 */
import type { HourPoint, PollutantKey } from '../data/types';
import { bandFor, type BandInfo } from './bands';

type Segment = readonly [bLo: number, bHi: number, iLo: number, iHi: number];

const INDEX = [
  [0, 50],
  [51, 100],
  [101, 200],
  [201, 300],
  [301, 400],
  [401, 500],
] as const;

/** Concentration breakpoints: µg/m³, except CO in mg/m³. Last value is the Severe lower bound. */
const CONC: Record<PollutantKey, readonly (readonly [number, number])[]> = {
  pm2_5: [
    [0, 30],
    [31, 60],
    [61, 90],
    [91, 120],
    [121, 250],
    [251, 250 * 1.5],
  ],
  pm10: [
    [0, 50],
    [51, 100],
    [101, 250],
    [251, 350],
    [351, 430],
    [431, 430 * 1.5],
  ],
  no2: [
    [0, 40],
    [41, 80],
    [81, 180],
    [181, 280],
    [281, 400],
    [401, 400 * 1.5],
  ],
  o3: [
    [0, 50],
    [51, 100],
    [101, 168],
    [169, 208],
    [209, 748],
    [749, 748 * 1.5],
  ],
  so2: [
    [0, 40],
    [41, 80],
    [81, 380],
    [381, 800],
    [801, 1600],
    [1601, 1600 * 1.5],
  ],
  co: [
    [0, 1],
    [1.1, 2],
    [2.1, 10],
    [10.1, 17],
    [17.1, 34],
    [34.1, 34 * 1.5],
  ],
};

function segments(pollutant: PollutantKey): Segment[] {
  return CONC[pollutant].map(([bLo, bHi], i) => {
    const [iLo, iHi] = INDEX[i] as readonly [number, number];
    return [bLo, bHi, iLo, iHi] as const;
  });
}

/** Round the way CPCB reports concentrations. */
export function roundConcentration(pollutant: PollutantKey, value: number): number {
  return pollutant === 'co' ? Math.round(value * 10) / 10 : Math.round(value);
}

/** Sub-index for one pollutant from an already averaged concentration (CO in mg/m³). */
export function subIndex(pollutant: PollutantKey, concentration: number): number {
  if (!Number.isFinite(concentration) || concentration < 0) {
    throw new RangeError(`Invalid concentration for ${pollutant}: ${concentration}`);
  }
  const c = roundConcentration(pollutant, concentration);
  for (const [bLo, bHi, iLo, iHi] of segments(pollutant)) {
    if (c <= bHi) {
      const clamped = Math.max(c, bLo);
      return Math.round(((iHi - iLo) / (bHi - bLo)) * (clamped - bLo) + iLo);
    }
  }
  return 500;
}

function mean(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function valid(values: readonly (number | null)[]): number[] {
  return values.filter((v): v is number => v !== null && Number.isFinite(v));
}

/** 24-hour mean, or null if fewer than 16 valid hours (CPCB minimum). */
export function average24h(values: readonly (number | null)[]): number | null {
  const v = valid(values.slice(-24));
  return v.length >= 16 ? mean(v) : null;
}

/** Highest 8-hour running mean over the window; each 8-hour block needs 6 valid hours. */
export function max8hRunningMean(values: readonly (number | null)[]): number | null {
  const window = values.slice(-24);
  let best: number | null = null;
  for (let end = 8; end <= window.length; end += 1) {
    const block = valid(window.slice(end - 8, end));
    if (block.length >= 6) {
      const m = mean(block);
      best = best === null ? m : Math.max(best, m);
    }
  }
  return best;
}

export interface IndianAqi {
  aqi: number;
  band: BandInfo;
  dominant: PollutantKey;
  subIndices: Partial<Record<PollutantKey, number>>;
  /** Averaged concentrations used (CO in mg/m³) */
  averages: Partial<Record<PollutantKey, number>>;
}

const POLLUTANTS: readonly PollutantKey[] = ['pm2_5', 'pm10', 'no2', 'o3', 'so2', 'co'];
const EIGHT_HOUR: ReadonlySet<PollutantKey> = new Set(['o3', 'co']);

/**
 * Indian AQI for the 24 hours ending at `nowIndex` (inclusive).
 * Returns null when CPCB's minimum data rule is not met.
 */
export function indianAqi(hours: readonly HourPoint[], nowIndex: number): IndianAqi | null {
  const window = hours.slice(Math.max(0, nowIndex - 23), nowIndex + 1);
  const averages: Partial<Record<PollutantKey, number>> = {};
  const subIndices: Partial<Record<PollutantKey, number>> = {};

  for (const p of POLLUTANTS) {
    const raw = window.map((h) => h[p]);
    const avg = EIGHT_HOUR.has(p) ? max8hRunningMean(raw) : average24h(raw);
    if (avg === null) continue;
    // Open-Meteo gives CO in µg/m³; CPCB breakpoints are in mg/m³.
    const value = p === 'co' ? avg / 1000 : avg;
    averages[p] = value;
    subIndices[p] = subIndex(p, value);
  }

  const available = Object.keys(subIndices) as PollutantKey[];
  const hasPm = available.includes('pm2_5') || available.includes('pm10');
  if (available.length < 3 || !hasPm) return null;

  let dominant = available[0] as PollutantKey;
  for (const p of available) {
    if ((subIndices[p] ?? 0) > (subIndices[dominant] ?? 0)) dominant = p;
  }
  const aqi = subIndices[dominant] ?? 0;
  return { aqi, band: bandFor(aqi), dominant, subIndices, averages };
}
