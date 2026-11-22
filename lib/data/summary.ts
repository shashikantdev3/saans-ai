/** Trimmed view of AirData for the browser: current levels, AQIs and a 72-hour forecast. */
import { pm25Band, type AqiBand } from '../aqi/bands';
import { indianAqi, type IndianAqi } from '../aqi/cpcb';
import type { AirData } from './types';

export interface ForecastPoint {
  time: string;
  pm25: number;
  band: AqiBand;
  windSpeed: number | null;
  windDirection: number | null;
}

export interface AirSummary {
  timezone: string;
  now: string;
  aqi: IndianAqi | null;
  usAqi: number | null;
  current: {
    pm2_5: number | null;
    pm10: number | null;
    no2: number | null;
    o3: number | null;
    so2: number | null;
  };
  forecast: ForecastPoint[];
}

const round = (v: number | null | undefined) =>
  v === null || v === undefined ? null : Math.round(v);

export function summarise(air: AirData): AirSummary {
  const now = air.hours[air.nowIndex];
  return {
    timezone: air.timezone,
    now: now?.time ?? '',
    aqi: indianAqi(air.hours, air.nowIndex),
    usAqi: round(now?.usAqi),
    current: {
      pm2_5: round(now?.pm2_5),
      pm10: round(now?.pm10),
      no2: round(now?.no2),
      o3: round(now?.o3),
      so2: round(now?.so2),
    },
    forecast: air.hours
      .slice(air.nowIndex, air.nowIndex + 72)
      .filter((h) => h.pm2_5 !== null)
      .map((h) => ({
        time: h.time,
        pm25: Math.round(h.pm2_5 ?? 0),
        band: pm25Band(h.pm2_5 ?? 0),
        windSpeed: round(h.windSpeed),
        windDirection: round(h.windDirection),
      })),
  };
}
