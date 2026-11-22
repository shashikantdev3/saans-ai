// ============================================================
// src/test/aqiCommute.test.ts
// Unit tests for exposure dose, commute metrics, inversion modeling, and offset
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  calculateExposureDose,
  calculateCommuteMetrics,
  evaluateInversionRisk,
  calculateCommunityOffset,
} from '@/lib/aqiCompute';
import { TransitMode } from '@/types';

describe('calculateExposureDose', () => {
  it('calculates inhaled PM2.5 dose in micrograms', () => {
    expect(calculateExposureDose(100, 2, 1.0, 0)).toBe(200);
    expect(calculateExposureDose(50, 1, 0.5, 0)).toBe(25);
  });

  it('accounts for cabin or mask filtration protection factor', () => {
    expect(calculateExposureDose(100, 2, 1.0, 0.75)).toBe(50);
    expect(calculateExposureDose(200, 1, 1.0, 0.95)).toBe(10);
  });

  it('throws RangeError on negative parameters or invalid protection', () => {
    expect(() => calculateExposureDose(-10, 2, 1, 0)).toThrow(RangeError);
    expect(() => calculateExposureDose(100, -1, 1, 0)).toThrow(RangeError);
    expect(() => calculateExposureDose(100, 2, -1, 0)).toThrow(RangeError);
    expect(() => calculateExposureDose(100, 2, 1, -0.1)).toThrow(RangeError);
    expect(() => calculateExposureDose(100, 2, 1, 1.1)).toThrow(RangeError);
  });
});

describe('calculateCommuteMetrics across all transit modes', () => {
  it('evaluates Metro mode under high smog', () => {
    const result = calculateCommuteMetrics(10, TransitMode.Metro, 220);
    expect(result.mode).toBe(TransitMode.Metro);
    expect(result.durationMinutes).toBe(17);
    expect(result.isRecommended).toBe(true);
    expect(result.co2EmissionsKg).toBe(0.2);
  });

  it('evaluates Electric Bus mode', () => {
    const result = calculateCommuteMetrics(10, TransitMode.ElectricBus, 120);
    expect(result.mode).toBe(TransitMode.ElectricBus);
    expect(result.durationMinutes).toBe(30);
    expect(result.isRecommended).toBe(true);
    expect(result.co2EmissionsKg).toBe(0.4);
  });

  it('evaluates Diesel Bus mode', () => {
    const result = calculateCommuteMetrics(10, TransitMode.DieselBus, 100);
    expect(result.mode).toBe(TransitMode.DieselBus);
    expect(result.durationMinutes).toBe(33);
    expect(result.co2EmissionsKg).toBe(1.1);
  });

  it('evaluates Cycling mode under high smog and issues hazard advisory', () => {
    const result = calculateCommuteMetrics(10, TransitMode.Cycling, 220);
    expect(result.mode).toBe(TransitMode.Cycling);
    expect(result.durationMinutes).toBe(40);
    expect(result.isRecommended).toBe(false);
    expect(result.healthRiskRating).toBe('severe');
    expect(result.advisory).toContain('HAZARD');
  });

  it('evaluates Walking mode under clean air (AQI <= 50) and recommends it for short distance', () => {
    const result = calculateCommuteMetrics(2, TransitMode.Walking, 40);
    expect(result.mode).toBe(TransitMode.Walking);
    expect(result.durationMinutes).toBe(24);
    expect(result.isRecommended).toBe(true);
    expect(result.co2EmissionsKg).toBe(0);
  });

  it('evaluates EV with HEPA cabin filtration', () => {
    const result = calculateCommuteMetrics(15, TransitMode.EV, 180);
    expect(result.mode).toBe(TransitMode.EV);
    expect(result.durationMinutes).toBe(36);
    expect(result.co2EmissionsKg).toBe(0.75);
    expect(result.healthRiskRating).toBe('minimal');
  });

  it('evaluates Gasoline Car and notes emissions canyon effect', () => {
    const result = calculateCommuteMetrics(15, TransitMode.GasCar, 180);
    expect(result.mode).toBe(TransitMode.GasCar);
    expect(result.co2EmissionsKg).toBe(2.85);
    expect(result.advisory).toContain('High carbon emissions');
  });

  it('throws RangeError for invalid distance or negative AQI', () => {
    expect(() => calculateCommuteMetrics(0, TransitMode.Metro, 100)).toThrow(RangeError);
    expect(() => calculateCommuteMetrics(-5, TransitMode.Metro, 100)).toThrow(RangeError);
    expect(() => calculateCommuteMetrics(10, TransitMode.Metro, -10)).toThrow(RangeError);
  });
});

describe('evaluateInversionRisk', () => {
  it('detects severe inversion when upper air is significantly warmer with low wind', () => {
    const risk = evaluateInversionRisk(8, 12, 3);
    expect(risk.isInversion).toBe(true);
    expect(risk.severity).toBe('severe');
    expect(risk.rationale).toContain('thermal cap');
  });

  it('detects moderate inversion under mild thermal inversion and light wind', () => {
    const risk = evaluateInversionRisk(10, 11, 8);
    expect(risk.isInversion).toBe(true);
    expect(risk.severity).toBe('moderate');
  });

  it('returns none when atmosphere has normal lapse rate and active wind', () => {
    const risk = evaluateInversionRisk(14, 11, 16);
    expect(risk.isInversion).toBe(false);
    expect(risk.severity).toBe('none');
    expect(risk.rationale).toContain('Normal vertical adiabatic');
  });

  it('throws RangeError for non-finite temperature or wind speed', () => {
    expect(() => evaluateInversionRisk(NaN, 12, 5)).toThrow(RangeError);
    expect(() => evaluateInversionRisk(10, NaN, 5)).toThrow(RangeError);
    expect(() => evaluateInversionRisk(10, 12, NaN)).toThrow(RangeError);
  });
});

describe('calculateCommunityOffset', () => {
  it('calculates total CO2 and PM2.5 abatement from pledge counts across all categories', () => {
    const result = calculateCommunityOffset({
      carpool: 10,
      'clean-heating': 5,
      'dust-control': 8,
      'waste-management': 4,
      'vulnerable-care': 12,
    });
    expect(result.totalCo2Kg).toBe(150.8);
    expect(result.totalPm25Grams).toBe(2100);
  });

  it('handles empty and unrecognized pledges gracefully', () => {
    expect(calculateCommunityOffset({})).toEqual({ totalCo2Kg: 0, totalPm25Grams: 0 });
    expect(calculateCommunityOffset({ unknownCategory: 50 })).toEqual({ totalCo2Kg: 0, totalPm25Grams: 0 });
  });
});
