// ============================================================
// src/test/aqiIaq.test.ts
// Unit tests for room volume, required CADR, and purification kinetics
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  calculateRoomVolume,
  calculateRequiredCADR,
  estimatePurificationTime,
} from '@/lib/aqiCompute';

describe('calculateRoomVolume', () => {
  it('computes room volume correctly', () => {
    expect(calculateRoomVolume(20, 2.5)).toBe(50);
    expect(calculateRoomVolume(16.5, 2.8)).toBe(46.2);
    expect(calculateRoomVolume(10, 3)).toBe(30);
  });

  it('throws RangeError if area is zero or negative', () => {
    expect(() => calculateRoomVolume(0, 2.5)).toThrow(RangeError);
    expect(() => calculateRoomVolume(-10, 2.5)).toThrow(RangeError);
  });

  it('throws RangeError if height is zero or negative', () => {
    expect(() => calculateRoomVolume(20, 0)).toThrow(RangeError);
    expect(() => calculateRoomVolume(20, -1)).toThrow(RangeError);
  });

  it('throws RangeError on non-finite inputs', () => {
    expect(() => calculateRoomVolume(NaN, 2.5)).toThrow(RangeError);
    expect(() => calculateRoomVolume(20, NaN)).toThrow(RangeError);
  });
});

describe('calculateRequiredCADR', () => {
  it('computes CADR for default 4 ACH', () => {
    expect(calculateRequiredCADR(50)).toBe(200);
    expect(calculateRequiredCADR(100)).toBe(400);
  });

  it('computes CADR for custom ACH', () => {
    expect(calculateRequiredCADR(50, 5)).toBe(250);
    expect(calculateRequiredCADR(50, 6)).toBe(300);
  });

  it('throws RangeError for invalid volume or ACH', () => {
    expect(() => calculateRequiredCADR(0)).toThrow(RangeError);
    expect(() => calculateRequiredCADR(-20)).toThrow(RangeError);
    expect(() => calculateRequiredCADR(50, 0)).toThrow(RangeError);
    expect(() => calculateRequiredCADR(50, -2)).toThrow(RangeError);
    expect(() => calculateRequiredCADR(NaN, 4)).toThrow(RangeError);
  });
});

describe('estimatePurificationTime', () => {
  it('estimates minutes for 80% particle reduction', () => {
    const time = estimatePurificationTime(50, 200, 0.8);
    expect(time).toBeGreaterThan(20);
    expect(time).toBeLessThan(30);
  });

  it('estimates time for custom efficiency levels', () => {
    const time50 = estimatePurificationTime(50, 200, 0.5);
    const time90 = estimatePurificationTime(50, 200, 0.9);
    expect(time90).toBeGreaterThan(time50);
  });

  it('throws RangeError on non-positive volume or CADR', () => {
    expect(() => estimatePurificationTime(0, 200)).toThrow(RangeError);
    expect(() => estimatePurificationTime(-10, 200)).toThrow(RangeError);
    expect(() => estimatePurificationTime(50, 0)).toThrow(RangeError);
    expect(() => estimatePurificationTime(50, -50)).toThrow(RangeError);
  });

  it('throws RangeError if efficiency is outside (0, 1)', () => {
    expect(() => estimatePurificationTime(50, 200, 0)).toThrow(RangeError);
    expect(() => estimatePurificationTime(50, 200, 1)).toThrow(RangeError);
    expect(() => estimatePurificationTime(50, 200, 1.5)).toThrow(RangeError);
    expect(() => estimatePurificationTime(50, 200, -0.2)).toThrow(RangeError);
  });
});
