import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from '@/lib/data/cache';
import { fixtureFetcher } from '@/lib/data/fetcher';
import {
  airQualityUrl,
  findNowIndex,
  getAirData,
  roundCoord,
  searchPlaces,
  UpstreamError,
} from '@/lib/data/openMeteo';

describe('Open-Meteo client', () => {
  it('rounds coordinates to 0.1 degree before calling out', () => {
    expect(roundCoord(28.6519)).toBe(28.7);
    expect(airQualityUrl(28.7, 77.2)).toContain('latitude=28.7');
    expect(airQualityUrl(28.7, 77.2)).toContain('past_days=1');
  });

  it('finds the current hour', () => {
    expect(
      findNowIndex(
        ['a', '2026-11-20T08:00', '2026-11-20T09:00', '2026-11-20T10:00'],
        '2026-11-20T09:15',
      ),
    ).toBe(2);
  });

  it('merges air quality with wind', async () => {
    const data = await getAirData(28.61, 77.21, fixtureFetcher);
    expect(data.hours.length).toBe(120);
    expect(data.nowIndex).toBe(33);
    expect(data.hours[0]?.windSpeed).not.toBeNull();
    expect(data.lat).toBe(28.6);
  });

  it('serves repeat calls from the 15-minute cache', async () => {
    const spy = vi.fn(fixtureFetcher);
    await getAirData(12.91, 77.61, spy);
    await getAirData(12.94, 77.64, spy); // rounds to the same cell
    expect(spy).toHaveBeenCalledTimes(2); // air + weather once
  });

  it('still returns air quality when the wind API fails', async () => {
    const fetcher = vi.fn(async (url: string) =>
      url.includes('air-quality') ? fixtureFetcher(url) : new Response('down', { status: 503 }),
    );
    const data = await getAirData(26.8, 80.9, fetcher);
    expect(data.hours[0]?.windSpeed).toBeNull();
    expect(data.hours[0]?.pm2_5).not.toBeNull();
  });

  it('throws UpstreamError when air quality fails', async () => {
    const fetcher = vi.fn(async () => new Response('down', { status: 502 }));
    await expect(getAirData(22.5, 88.3, fetcher)).rejects.toBeInstanceOf(UpstreamError);
  });

  it('rejects malformed upstream data', async () => {
    const fetcher = vi.fn(
      async () => new Response(JSON.stringify({ hourly: {} }), { status: 200 }),
    );
    await expect(getAirData(19, 72.8, fetcher)).rejects.toThrow();
  });

  it('geocodes and handles no results', async () => {
    const places = await searchPlaces('Delhi', fixtureFetcher);
    expect(places[0]?.name).toBe('Delhi');
    expect(await searchPlaces('xyzqq', fixtureFetcher)).toEqual([]);
  });
});

describe('TtlCache', () => {
  it('expires entries and evicts the oldest when full', () => {
    let now = 0;
    const cache = new TtlCache<number>(1000, 2, () => now);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
    now = 1001;
    expect(cache.get('c')).toBeUndefined();
  });
});
