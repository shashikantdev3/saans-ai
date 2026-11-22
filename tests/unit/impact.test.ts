import { describe, expect, it } from 'vitest';
import { breathingRate, doseByPlace, totalDose, type DoseSlot } from '@/lib/impact/dose';
import {
  cleanerAlternative,
  commuteCo2PerDay,
  commuteSwitchSaving,
  generatorVsInverter,
  gramsPerPassengerKm,
} from '@/lib/impact/emissions';
import { FACTORS } from '@/lib/impact/factors';
import { indoorHacks } from '@/lib/impact/hacks';
import { indoorPm25, ioRatio, percentCut, roomVolume, sourceIncrement } from '@/lib/impact/indoor';

describe('indoor mass balance', () => {
  it('matches the formula by hand: (P a C) / (a + k)', () => {
    // P=0.8, a=0.7, k=0.2, C=200 -> 0.8*0.7*200/0.9 = 124.4
    const c = indoorPm25({ outdoor: 200, airExchange: 0.7, volumeM3: 40 });
    expect(c).toBeCloseTo(124.44, 1);
  });

  it('a purifier adds CADR/V to the removal rate', () => {
    // V = 40, CADR = 250 -> CADR/V = 6.25; 112 / (0.7+0.2+6.25) = 15.66
    const c = indoorPm25({ outdoor: 200, airExchange: 0.7, volumeM3: 40, cadrM3h: 250 });
    expect(c).toBeCloseTo(15.66, 1);
  });

  it('indoor sources add S/V on top', () => {
    // 100 mg/h incense in 40 m³ with a=0.7: 100000/40/0.9 = 2777.8 µg/m³
    expect(sourceIncrement(100, 0.7, 40)).toBeCloseTo(2777.8, 0);
  });

  it('closing windows lowers the I/O ratio; ratio never exceeds penetration', () => {
    const open = ioRatio(4, 40);
    const closed = ioRatio(0.7, 40);
    expect(closed).toBeLessThan(open);
    expect(open).toBeLessThan(FACTORS.penetration.value);
  });

  it('room volume uses the ceiling height assumption', () => {
    expect(roomVolume(10)).toBeCloseTo(28);
  });

  it('guards against bad input', () => {
    expect(() => indoorPm25({ outdoor: 100, airExchange: 1, volumeM3: 0 })).toThrow(RangeError);
    expect(percentCut(0, 10)).toBe(0);
    expect(percentCut(200, 50)).toBe(75);
  });
});

describe('dose', () => {
  const slot = (o: Partial<DoseSlot>): DoseSlot => ({
    hour: 7,
    outdoorPm25: 100,
    place: 'outdoor',
    activity: 'moderate',
    factor: 1,
    hours: 1,
    ...o,
  });

  it('is concentration x breathing rate x hours', () => {
    expect(totalDose([slot({})])).toBeCloseTo(100 * 1.56);
    expect(totalDose([slot({ factor: 0.5, activity: 'rest', hours: 2 })])).toBeCloseTo(
      100 * 0.5 * 0.3 * 2,
    );
  });

  it('breathing rises with activity', () => {
    expect(breathingRate('sleep')).toBeLessThan(breathingRate('light'));
    expect(breathingRate('light')).toBeLessThan(breathingRate('moderate'));
  });

  it('groups by place', () => {
    const byPlace = doseByPlace([slot({}), slot({ place: 'home', factor: 0.5 })]);
    expect(byPlace.outdoor).toBeCloseTo(156);
    expect(byPlace.home).toBeCloseTo(78);
    expect(byPlace.work).toBe(0);
  });
});

describe('emissions (TERI Delhi factors)', () => {
  it('a solo car carries the whole vehicle: 89.93 x 1.6 g/km', () => {
    expect(gramsPerPassengerKm('car')).toBeCloseTo(143.888, 2);
    expect(gramsPerPassengerKm('carpool', 3)).toBeCloseTo(47.96, 1);
    expect(gramsPerPassengerKm('walk')).toBe(0);
  });

  it('car to metro for 10 km each way, 5 days a week', () => {
    // (143.888 - 29.29) x 20 km = 2292 g/day; x5 = 11.5 kg/week
    const s = commuteSwitchSaving('car', 'metro', 10, 5);
    expect(s.gramsPerDay).toBe(2292);
    expect(s.kgPerWeek).toBe(11.5);
    expect(s.percent).toBe(80);
    expect(commuteCo2PerDay('metro', 10)).toBeCloseTo(585.8);
  });

  it('suggests a cleaner mode only when it helps', () => {
    expect(cleanerAlternative('car', 12)).toBe('metro');
    expect(cleanerAlternative('car', 1.5)).toBe('walk');
    expect(cleanerAlternative('metro', 12)).toBeNull();
    expect(cleanerAlternative('car', 0)).toBeNull();
  });

  it('generator vs inverter is close on CO2 (coal-heavy grid)', () => {
    const g = generatorVsInverter(4);
    expect(g.dieselKg).toBeCloseTo(3.7, 1);
    expect(g.inverterKg).toBeCloseTo(3.64, 1);
  });
});

describe('indoor hacks', () => {
  it('quantifies window, filter and source hacks', () => {
    const hacks = indoorHacks({ outdoorPm25: 200, roomSizeM2: 14, hasPurifier: false });
    const ids = hacks.map((h) => h.id);
    expect(ids).toEqual(['close_windows', 'fan_filter', 'no_incense', 'cook_smart', 'wet_mop']);
    const close = hacks[0];
    // Closing windows alone helps less than people expect (about 18% at steady state)
    expect(close?.percent).toBe(18);
    expect(hacks[1]?.percent).toBeGreaterThan(50);
    expect(hacks[2]?.avoided).toBeGreaterThan(1000);
    expect(hacks[4]?.percent).toBeUndefined();
  });

  it('uses the purifier when the family has one', () => {
    const hacks = indoorHacks({ outdoorPm25: 200, roomSizeM2: 14, hasPurifier: true });
    expect(hacks[1]?.id).toBe('run_purifier');
  });
});
