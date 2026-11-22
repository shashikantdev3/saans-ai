/**
 * CPCB National AQI categories and health statements (paraphrased).
 * Source: CPCB, "National Air Quality Index", Control of Urban Pollution Series CUPS/82/2014-15.
 * Colours follow the CPCB scheme but are never used alone: every band also has a text label.
 */
export type AqiBand = 'good' | 'satisfactory' | 'moderate' | 'poor' | 'very_poor' | 'severe';

export interface BandInfo {
  band: AqiBand;
  min: number;
  max: number;
  /** Background colour (CPCB scheme) and a text colour with at least 4.5:1 contrast on it */
  bg: string;
  fg: string;
}

export const BANDS: readonly BandInfo[] = [
  { band: 'good', min: 0, max: 50, bg: '#1b7f3b', fg: '#ffffff' },
  { band: 'satisfactory', min: 51, max: 100, bg: '#9ccc65', fg: '#1a2e05' },
  { band: 'moderate', min: 101, max: 200, bg: '#ffeb3b', fg: '#3a3000' },
  { band: 'poor', min: 201, max: 300, bg: '#ff9800', fg: '#2b1600' },
  { band: 'very_poor', min: 301, max: 400, bg: '#d32f2f', fg: '#ffffff' },
  { band: 'severe', min: 401, max: 500, bg: '#7b1f1f', fg: '#ffffff' },
];

export function bandFor(aqi: number): BandInfo {
  const rounded = Math.round(aqi);
  const found = BANDS.find((b) => rounded <= b.max);
  return found ?? (BANDS[BANDS.length - 1] as BandInfo);
}

/** Ordinal 0..5 so rules can compare severity. */
export function bandLevel(band: AqiBand): number {
  return BANDS.findIndex((b) => b.band === band);
}

/**
 * Indian AQI band for a single PM2.5 hourly value, using the 24-hour breakpoints.
 * Used only to colour forecast hours; the headline AQI uses proper averages.
 */
export function pm25Band(pm25: number): AqiBand {
  if (pm25 <= 30) return 'good';
  if (pm25 <= 60) return 'satisfactory';
  if (pm25 <= 90) return 'moderate';
  if (pm25 <= 120) return 'poor';
  if (pm25 <= 250) return 'very_poor';
  return 'severe';
}
