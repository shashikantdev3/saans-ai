/** Pollutants we read from Open-Meteo. Gases and PM in µg/m³, CO converted to mg/m³ where CPCB needs it. */
export type PollutantKey = 'pm2_5' | 'pm10' | 'no2' | 'o3' | 'so2' | 'co';

export interface HourPoint {
  /** Local time at the location, ISO without offset, e.g. 2026-11-20T07:00 */
  time: string;
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  so2: number | null;
  /** µg/m³ as delivered by Open-Meteo */
  co: number | null;
  usAqi: number | null;
  /** km/h at 10 m */
  windSpeed: number | null;
  /** degrees, direction the wind comes from */
  windDirection: number | null;
}

export interface AirData {
  lat: number;
  lon: number;
  timezone: string;
  /** Index into hours for the current local hour */
  nowIndex: number;
  /** About 24 past hours plus about 96 forecast hours */
  hours: HourPoint[];
}

export interface Place {
  id: number;
  name: string;
  lat: number;
  lon: number;
  admin1?: string;
  country?: string;
  countryCode?: string;
}

export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;
