import { describe, expect, it } from 'vitest';
import { bandFor, pm25Band } from '@/lib/aqi/bands';
import { average24h, indianAqi, max8hRunningMean, subIndex } from '@/lib/aqi/cpcb';
import type { HourPoint } from '@/lib/data/types';

describe('CPCB sub-index: breakpoint edges from the NAQI table', () => {
  it.each([
    ['pm2_5', 0, 0],
    ['pm2_5', 30, 50],
    ['pm2_5', 31, 51],
    ['pm2_5', 60, 100],
    ['pm2_5', 90, 200],
    ['pm2_5', 120, 300],
    ['pm2_5', 250, 400],
    ['pm2_5', 251, 401],
    ['pm10', 50, 50],
    ['pm10', 100, 100],
    ['pm10', 250, 200],
    ['pm10', 350, 300],
    ['pm10', 430, 400],
    ['no2', 40, 50],
    ['no2', 80, 100],
    ['no2', 180, 200],
    ['no2', 280, 300],
    ['no2', 400, 400],
    ['o3', 100, 100],
    ['o3', 168, 200],
    ['o3', 208, 300],
    ['o3', 748, 400],
    ['so2', 80, 100],
    ['so2', 380, 200],
    ['so2', 800, 300],
    ['so2', 1600, 400],
    ['co', 1, 50],
    ['co', 2, 100],
    ['co', 10, 200],
    ['co', 17, 300],
    ['co', 34, 400],
  ] as const)('%s at %d gives %d', (pollutant, conc, expected) => {
    expect(subIndex(pollutant, conc)).toBe(expected);
  });

  it('interpolates inside a band (hand-worked with the CPCB formula)', () => {
    // PM2.5 = 45: 51 + (100-51)/(60-31) x (45-31) = 74.66 -> 75 (Satisfactory)
    expect(subIndex('pm2_5', 45)).toBe(75);
    // PM2.5 = 150: 301 + (400-301)/(250-121) x (150-121) = 323.3 -> 323 (Very Poor)
    expect(subIndex('pm2_5', 150)).toBe(323);
    // PM10 = 180: 101 + (200-101)/(250-101) x (180-101) = 153.49 -> 153 (Moderate)
    expect(subIndex('pm10', 180)).toBe(153);
  });

  it('rounds concentrations the way CPCB reports them, so 30.4 is still Good', () => {
    expect(subIndex('pm2_5', 30.4)).toBe(50);
    expect(subIndex('pm2_5', 30.6)).toBe(51);
  });

  it('caps at 500 above our Severe ceiling assumption', () => {
    expect(subIndex('pm2_5', 375)).toBe(500);
    expect(subIndex('pm2_5', 999)).toBe(500);
  });

  it('rejects invalid concentrations', () => {
    expect(() => subIndex('pm2_5', -1)).toThrow(RangeError);
    expect(() => subIndex('pm2_5', Number.NaN)).toThrow(RangeError);
  });
});

describe('averaging rules', () => {
  it('needs 16 valid hours for a 24-hour mean', () => {
    expect(average24h(Array(15).fill(100))).toBeNull();
    expect(average24h([...Array(16).fill(100), ...Array(8).fill(null)])).toBe(100);
  });

  it('takes the highest 8-hour running mean', () => {
    const values = [...Array(16).fill(10), ...Array(8).fill(90)];
    expect(max8hRunningMean(values)).toBe(90);
  });
});

function hour(i: number, v: Partial<HourPoint>): HourPoint {
  return {
    time: `2026-11-20T${String(i % 24).padStart(2, '0')}:00`,
    pm2_5: null,
    pm10: null,
    no2: null,
    o3: null,
    so2: null,
    co: null,
    usAqi: null,
    windSpeed: null,
    windDirection: null,
    ...v,
  };
}

describe('indianAqi', () => {
  it('uses the highest sub-index and reports the dominant pollutant', () => {
    const hours = Array.from({ length: 24 }, (_, i) =>
      hour(i, { pm2_5: 150, pm10: 180, no2: 40, o3: 50, co: 1000 }),
    );
    const result = indianAqi(hours, 23);
    expect(result?.aqi).toBe(323);
    expect(result?.dominant).toBe('pm2_5');
    expect(result?.band.band).toBe('very_poor');
    // CO arrives in µg/m³ and is converted to mg/m³
    expect(result?.averages.co).toBe(1);
  });

  it('returns null without at least 3 pollutants including PM', () => {
    const noPm = Array.from({ length: 24 }, (_, i) => hour(i, { no2: 40, o3: 50, so2: 10 }));
    expect(indianAqi(noPm, 23)).toBeNull();
    const twoOnly = Array.from({ length: 24 }, (_, i) => hour(i, { pm2_5: 40, no2: 40 }));
    expect(indianAqi(twoOnly, 23)).toBeNull();
  });
});

describe('bands', () => {
  it('maps AQI and PM2.5 to labelled bands', () => {
    expect(bandFor(0).band).toBe('good');
    expect(bandFor(100).band).toBe('satisfactory');
    expect(bandFor(101).band).toBe('moderate');
    expect(bandFor(450).band).toBe('severe');
    expect(pm25Band(25)).toBe('good');
    expect(pm25Band(100)).toBe('poor');
    expect(pm25Band(300)).toBe('severe');
  });
});
