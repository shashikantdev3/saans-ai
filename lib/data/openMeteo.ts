/**
 * Open-Meteo clients (no API key, free for non-commercial use).
 * Air quality comes from the CAMS global forecast (~0.4°, about 45 km), so values are modelled,
 * not station measurements. Attribution: CAMS ENSEMBLE via Open-Meteo (CC BY 4.0).
 * Docs: https://open-meteo.com/en/docs/air-quality-api
 */
import { z } from 'zod';
import { FIFTEEN_MINUTES_MS, TtlCache } from './cache';
import type { AirData, Fetcher, HourPoint, Place } from './types';

const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const AIR_VARS = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'ozone',
  'sulphur_dioxide',
  'carbon_monoxide',
  'us_aqi',
] as const;

const series = z.array(z.number().nullable());

const airSchema = z.object({
  timezone: z.string(),
  current: z.object({ time: z.string() }),
  hourly: z.object({
    time: z.array(z.string()),
    pm2_5: series,
    pm10: series,
    nitrogen_dioxide: series,
    ozone: series,
    sulphur_dioxide: series,
    carbon_monoxide: series,
    us_aqi: series,
  }),
});

const weatherSchema = z.object({
  hourly: z.object({
    time: z.array(z.string()),
    wind_speed_10m: series,
    wind_direction_10m: series,
  }),
});

const geoSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        admin1: z.string().optional(),
        country: z.string().optional(),
        country_code: z.string().optional(),
      }),
    )
    .optional(),
});

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

/**
 * Round to 0.1° (about 11 km). Still finer than the 45 km CAMS grid, so no accuracy is lost,
 * the user's exact position never leaves our server, and nearby users share cache entries.
 */
export function roundCoord(value: number): number {
  return Math.round(value * 10) / 10;
}

export function airQualityUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: AIR_VARS.join(','),
    current: 'pm2_5',
    past_days: '1',
    forecast_days: '4',
    timezone: 'auto',
  });
  return `${AIR_URL}?${params}`;
}

export function weatherUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: 'wind_speed_10m,wind_direction_10m',
    past_days: '1',
    forecast_days: '4',
    timezone: 'auto',
    wind_speed_unit: 'kmh',
  });
  return `${WEATHER_URL}?${params}`;
}

export function geocodeUrl(name: string): string {
  const params = new URLSearchParams({ name, count: '6', language: 'en', format: 'json' });
  return `${GEO_URL}?${params}`;
}

async function getJson(fetcher: Fetcher, url: string): Promise<unknown> {
  const res = await fetcher(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 900 },
  } as RequestInit);
  if (!res.ok) throw new UpstreamError(`Open-Meteo responded ${res.status}`, res.status);
  return res.json();
}

/** Index of the last hourly slot at or before the API's current time. */
export function findNowIndex(times: readonly string[], currentTime: string): number {
  let index = 0;
  for (let i = 0; i < times.length; i += 1) {
    const t = times[i];
    if (t !== undefined && t <= currentTime) index = i;
  }
  return index;
}

export function mergeHours(
  air: z.infer<typeof airSchema>,
  weather: z.infer<typeof weatherSchema> | null,
): HourPoint[] {
  const wind = new Map<string, { speed: number | null; dir: number | null }>();
  weather?.hourly.time.forEach((t, i) => {
    wind.set(t, {
      speed: weather.hourly.wind_speed_10m[i] ?? null,
      dir: weather.hourly.wind_direction_10m[i] ?? null,
    });
  });
  const h = air.hourly;
  return h.time.map((time, i) => ({
    time,
    pm2_5: h.pm2_5[i] ?? null,
    pm10: h.pm10[i] ?? null,
    no2: h.nitrogen_dioxide[i] ?? null,
    o3: h.ozone[i] ?? null,
    so2: h.sulphur_dioxide[i] ?? null,
    co: h.carbon_monoxide[i] ?? null,
    usAqi: h.us_aqi[i] ?? null,
    windSpeed: wind.get(time)?.speed ?? null,
    windDirection: wind.get(time)?.dir ?? null,
  }));
}

const airCache = new TtlCache<AirData>(FIFTEEN_MINUTES_MS);
const geoCache = new TtlCache<Place[]>(FIFTEEN_MINUTES_MS);

/** Air quality plus wind for a location. Wind is optional: if the forecast API fails we still return AQ. */
export async function getAirData(
  rawLat: number,
  rawLon: number,
  fetcher: Fetcher,
): Promise<AirData> {
  const lat = roundCoord(rawLat);
  const lon = roundCoord(rawLon);
  const key = `${lat},${lon}`;
  const cached = airCache.get(key);
  if (cached) return cached;

  const [airRaw, weatherRaw] = await Promise.all([
    getJson(fetcher, airQualityUrl(lat, lon)),
    getJson(fetcher, weatherUrl(lat, lon)).catch(() => null),
  ]);
  const air = airSchema.parse(airRaw);
  const weather = weatherRaw ? weatherSchema.safeParse(weatherRaw) : null;
  const data: AirData = {
    lat,
    lon,
    timezone: air.timezone,
    nowIndex: findNowIndex(air.hourly.time, air.current.time),
    hours: mergeHours(air, weather?.success ? weather.data : null),
  };
  airCache.set(key, data);
  return data;
}

export async function searchPlaces(name: string, fetcher: Fetcher): Promise<Place[]> {
  const key = name.trim().toLowerCase();
  const cached = geoCache.get(key);
  if (cached) return cached;
  const parsed = geoSchema.parse(await getJson(fetcher, geocodeUrl(name.trim())));
  const places: Place[] = (parsed.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    admin1: r.admin1,
    country: r.country,
    countryCode: r.country_code,
  }));
  geoCache.set(key, places);
  return places;
}
