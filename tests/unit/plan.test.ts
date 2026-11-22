import { describe, expect, it } from 'vitest';
import { fixtureFetcher } from '@/lib/data/fetcher';
import { getAirData } from '@/lib/data/openMeteo';
import { buildPlan, InsufficientDataError } from '@/lib/plan/buildPlan';
import {
  bestWindow,
  commuteRule,
  cookingRule,
  heatingRule,
  maskRule,
  outdoorRule,
  windowsRule,
  type HourWindow,
} from '@/lib/plan/rules';
import { DEFAULT_PROFILE, SAMPLE_PROFILE, type Profile } from '@/lib/profile/schema';

const w = (hour: number, pm25: number, band: HourWindow['band'] = 'poor'): HourWindow => ({
  time: `${String(hour).padStart(2, '0')}:00`,
  hour,
  pm25,
  band,
  windSpeed: 5,
});

const profile = (p: Partial<Profile> = {}): Profile => ({ ...DEFAULT_PROFILE, ...p });

describe('rules', () => {
  it('picks the cleanest daytime hour, ignoring cleaner night hours', () => {
    const best = bestWindow([w(3, 20), w(7, 250), w(15, 110), w(19, 200)]);
    expect(best?.hour).toBe(15);
  });

  it('outdoor advice tightens with the band', () => {
    expect(outdoorRule(w(15, 50, 'satisfactory')).id).toBe('outdoor_best');
    expect(outdoorRule(w(15, 100, 'poor')).id).toBe('outdoor_light_only');
    expect(outdoorRule(w(15, 300, 'severe')).id).toBe('outdoor_indoor_only');
  });

  it('windows: open only when the air is clean, otherwise air out at the best hour', () => {
    expect(windowsRule(w(15, 20, 'good'), 'satisfactory').id).toBe('windows_open_ok');
    const item = windowsRule(w(15, 110, 'poor'), 'very_poor');
    expect(item.id).toBe('windows_air_out');
    expect(item.time).toBe('15:00');
    expect(item.severity).toBe('warning');
  });

  it('mask advice follows AQI bands', () => {
    expect(maskRule('good', profile()).id).toBe('mask_none');
    expect(maskRule('moderate', profile({ hasChild: true })).params.sensitive).toBe(1);
    expect(maskRule('poor', profile()).id).toBe('mask_all');
    expect(maskRule('severe', profile()).id).toBe('mask_stay_in');
  });

  it('commute: WFH on very poor days when the family has WFH days', () => {
    const best = w(15, 110);
    expect(commuteRule('very_poor', profile({ wfhDays: 2 }), best)?.id).toBe('commute_wfh');
    expect(commuteRule('very_poor', profile({ commuteMode: 'two_wheeler' }), best)?.id).toBe(
      'commute_two_wheeler',
    );
    expect(commuteRule('poor', profile({ commuteMode: 'none' }), best)).toBeNull();
  });

  it('flags solid fuels and coal or wood heaters', () => {
    expect(cookingRule(profile({ cookingFuel: 'biomass' }), 'poor').id).toBe('cooking_solid_fuel');
    expect(cookingRule(profile({ cookingFuel: 'induction' }), 'poor').id).toBe('cooking_clean');
    expect(heatingRule(profile({ heating: 'coal_wood' }))?.id).toBe('heating_coal_danger');
    expect(heatingRule(profile())).toBeNull();
  });
});

describe('buildPlan on the Delhi sample', async () => {
  const air = await getAirData(28.65, 77.23, fixtureFetcher);

  it('finds the afternoon clean window and a severe-ish Indian AQI', () => {
    const plan = buildPlan(air, SAMPLE_PROFILE);
    expect(plan.best.hour).toBeGreaterThanOrEqual(14);
    expect(plan.best.hour).toBeLessThanOrEqual(16);
    expect(plan.aqi?.aqi).toBeGreaterThan(300);
    expect(plan.forecast).toHaveLength(24);
  });

  it('the plan always cuts dose versus doing nothing', () => {
    const plan = buildPlan(air, SAMPLE_PROFILE);
    expect(plan.dose.planUg).toBeLessThan(plan.dose.baselineUg);
    expect(plan.dose.percentCut).toBeGreaterThan(20);
  });

  it('a purifier makes the plan better still', () => {
    const without = buildPlan(air, SAMPLE_PROFILE).dose.percentCut;
    const withPurifier = buildPlan(air, { ...SAMPLE_PROFILE, hasPurifier: true }).dose.percentCut;
    expect(withPurifier).toBeGreaterThan(without);
  });

  it('a car commuter gets a metro alternative with CO2 numbers', () => {
    const plan = buildPlan(air, SAMPLE_PROFILE);
    expect(plan.alternative.kind).toBe('commute');
    if (plan.alternative.kind === 'commute') expect(plan.alternative.kgPerWeek).toBeGreaterThan(0);
  });

  it('falls back to other alternatives', () => {
    expect(buildPlan(air, profile({ usesGenerator: true })).alternative.kind).toBe('generator');
    expect(buildPlan(air, profile({ cookingFuel: 'biomass' })).alternative.kind).toBe(
      'cooking_fuel',
    );
    expect(buildPlan(air, profile()).alternative.kind).toBe('walk_errands');
  });

  it('refuses to plan without enough forecast data', () => {
    expect(() =>
      buildPlan({ ...air, hours: air.hours.slice(0, 5), nowIndex: 0 }, SAMPLE_PROFILE),
    ).toThrow(InsufficientDataError);
  });
});
