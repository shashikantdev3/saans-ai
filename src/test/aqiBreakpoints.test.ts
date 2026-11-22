// ============================================================
// src/test/aqiBreakpoints.test.ts
// Unit tests for EPA AQI categorizations, colors, and PM2.5 breakpoints
// ============================================================

import { describe, it, expect } from 'vitest';
import { calculateAQICategory, getAQIColor, calculatePM25SubIndex } from '@/lib/aqiCompute';
import { AQICategory } from '@/types';

describe('calculateAQICategory', () => {
  it('categorizes 0 to 50 as Good', () => {
    expect(calculateAQICategory(0)).toBe(AQICategory.Good);
    expect(calculateAQICategory(25)).toBe(AQICategory.Good);
    expect(calculateAQICategory(50)).toBe(AQICategory.Good);
  });

  it('categorizes 51 to 100 as Moderate', () => {
    expect(calculateAQICategory(51)).toBe(AQICategory.Moderate);
    expect(calculateAQICategory(75)).toBe(AQICategory.Moderate);
    expect(calculateAQICategory(100)).toBe(AQICategory.Moderate);
  });

  it('categorizes 101 to 150 as Unhealthy for Sensitive Groups', () => {
    expect(calculateAQICategory(101)).toBe(AQICategory.UnhealthySensitive);
    expect(calculateAQICategory(125)).toBe(AQICategory.UnhealthySensitive);
    expect(calculateAQICategory(150)).toBe(AQICategory.UnhealthySensitive);
  });

  it('categorizes 151 to 200 as Unhealthy', () => {
    expect(calculateAQICategory(151)).toBe(AQICategory.Unhealthy);
    expect(calculateAQICategory(175)).toBe(AQICategory.Unhealthy);
    expect(calculateAQICategory(200)).toBe(AQICategory.Unhealthy);
  });

  it('categorizes 201 to 300 as Very Unhealthy', () => {
    expect(calculateAQICategory(201)).toBe(AQICategory.VeryUnhealthy);
    expect(calculateAQICategory(250)).toBe(AQICategory.VeryUnhealthy);
    expect(calculateAQICategory(300)).toBe(AQICategory.VeryUnhealthy);
  });

  it('categorizes 301 and above as Hazardous', () => {
    expect(calculateAQICategory(301)).toBe(AQICategory.Hazardous);
    expect(calculateAQICategory(400)).toBe(AQICategory.Hazardous);
    expect(calculateAQICategory(500)).toBe(AQICategory.Hazardous);
    expect(calculateAQICategory(850)).toBe(AQICategory.Hazardous);
  });

  it('throws RangeError on negative AQI', () => {
    expect(() => calculateAQICategory(-1)).toThrow(RangeError);
    expect(() => calculateAQICategory(-100)).toThrow(RangeError);
  });

  it('throws RangeError on non-finite values', () => {
    expect(() => calculateAQICategory(NaN)).toThrow(RangeError);
    expect(() => calculateAQICategory(Infinity)).toThrow(RangeError);
    expect(() => calculateAQICategory(-Infinity)).toThrow(RangeError);
  });
});

describe('getAQIColor', () => {
  it('returns emerald-500 for AQI <= 50', () => {
    expect(getAQIColor(25)).toBe('#10b981');
    expect(getAQIColor(50)).toBe('#10b981');
  });

  it('returns amber-500 for AQI <= 100', () => {
    expect(getAQIColor(75)).toBe('#f59e0b');
    expect(getAQIColor(100)).toBe('#f59e0b');
  });

  it('returns orange-500 for AQI <= 150', () => {
    expect(getAQIColor(125)).toBe('#f97316');
  });

  it('returns red-500 for AQI <= 200', () => {
    expect(getAQIColor(175)).toBe('#ef4444');
  });

  it('returns purple-500 for AQI <= 300', () => {
    expect(getAQIColor(250)).toBe('#a855f7');
  });

  it('returns maroon for AQI > 300', () => {
    expect(getAQIColor(400)).toBe('#881337');
  });
});

describe('calculatePM25SubIndex', () => {
  it('computes exact EPA breakpoints correctly', () => {
    expect(calculatePM25SubIndex(0.0)).toBe(0);
    expect(calculatePM25SubIndex(12.0)).toBe(50);
    expect(calculatePM25SubIndex(12.1)).toBe(51);
    expect(calculatePM25SubIndex(35.4)).toBe(100);
    expect(calculatePM25SubIndex(35.5)).toBe(101);
    expect(calculatePM25SubIndex(55.4)).toBe(150);
    expect(calculatePM25SubIndex(55.5)).toBe(151);
    expect(calculatePM25SubIndex(150.4)).toBe(200);
    expect(calculatePM25SubIndex(150.5)).toBe(201);
    expect(calculatePM25SubIndex(250.4)).toBe(300);
    expect(calculatePM25SubIndex(250.5)).toBe(301);
    expect(calculatePM25SubIndex(350.4)).toBe(400);
    expect(calculatePM25SubIndex(350.5)).toBe(401);
    expect(calculatePM25SubIndex(500.4)).toBe(500);
  });

  it('caps at 500 when concentration exceeds 500.4', () => {
    expect(calculatePM25SubIndex(501)).toBe(500);
    expect(calculatePM25SubIndex(999)).toBe(500);
  });

  it('throws RangeError on negative concentrations', () => {
    expect(() => calculatePM25SubIndex(-0.1)).toThrow(RangeError);
    expect(() => calculatePM25SubIndex(-50)).toThrow(RangeError);
  });

  it('throws RangeError on non-finite values', () => {
    expect(() => calculatePM25SubIndex(NaN)).toThrow(RangeError);
    expect(() => calculatePM25SubIndex(Infinity)).toThrow(RangeError);
  });
});
