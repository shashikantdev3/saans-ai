// ============================================================
// src/lib/compute/aqiBreakpoints.ts
// EPA AQI Category mapping, color coding, and sub-index calculation
// ============================================================

import { AQICategory } from '@/types';
import { assertFiniteNumber, linearInterpolation } from './asserts';

/**
 * Calculates the EPA AQI Category based on numerical AQI index (0-500+).
 */
export function calculateAQICategory(aqi: number): AQICategory {
  assertFiniteNumber(aqi, 'aqi');
  if (aqi < 0) {
    throw new RangeError(`AQI cannot be negative. Received: ${aqi}`);
  }

  if (aqi <= 50) return AQICategory.Good;
  if (aqi <= 100) return AQICategory.Moderate;
  if (aqi <= 150) return AQICategory.UnhealthySensitive;
  if (aqi <= 200) return AQICategory.Unhealthy;
  if (aqi <= 300) return AQICategory.VeryUnhealthy;
  return AQICategory.Hazardous;
}

/**
 * Maps an AQI value to its standardized high-contrast design token hex color.
 */
export function getAQIColor(aqi: number): string {
  assertFiniteNumber(aqi, 'aqi');
  if (aqi <= 50) return '#10b981'; // Emerald 500
  if (aqi <= 100) return '#f59e0b'; // Amber 500
  if (aqi <= 150) return '#f97316'; // Orange 500
  if (aqi <= 200) return '#ef4444'; // Red 500
  if (aqi <= 300) return '#a855f7'; // Purple 500
  return '#881337'; // Deep Maroon
}

/**
 * Computes AQI sub-index for PM2.5 concentration (ug/m3) using US-EPA breakpoints.
 */
export function calculatePM25SubIndex(pm25: number): number {
  assertFiniteNumber(pm25, 'pm25');
  if (pm25 < 0) {
    throw new RangeError(`PM2.5 concentration cannot be negative. Received: ${pm25}`);
  }

  // Round to one decimal place per EPA guideline
  const c = Math.round(pm25 * 10) / 10;

  if (c <= 12.0) return linearInterpolation(c, 0.0, 12.0, 0, 50);
  if (c <= 35.4) return linearInterpolation(c, 12.1, 35.4, 51, 100);
  if (c <= 55.4) return linearInterpolation(c, 35.5, 55.4, 101, 150);
  if (c <= 150.4) return linearInterpolation(c, 55.5, 150.4, 151, 200);
  if (c <= 250.4) return linearInterpolation(c, 150.5, 250.4, 201, 300);
  if (c <= 350.4) return linearInterpolation(c, 250.5, 350.4, 301, 400);
  if (c <= 500.4) return linearInterpolation(c, 350.5, 500.4, 401, 500);
  return 500;
}
