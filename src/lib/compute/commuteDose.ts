// ============================================================
// src/lib/compute/commuteDose.ts
// Inhaled particulate exposure dose and multi-modal transit analysis
// ============================================================

import { TransitMode, type TransitRouteComparison } from '@/types';
import { assertFiniteNumber } from './asserts';

/**
 * Calculates inhaled PM2.5 exposure dose in micrograms (ug).
 * Formula: Dose = Concentration (ug/m3) * Time (hours) * BreathingRate (m3/h) * (1 - InfiltrationProtection)
 */
export function calculateExposureDose(
  pm25UgM3: number,
  durationHours: number,
  breathingRateM3H: number,
  protectionFactor = 0
): number {
  assertFiniteNumber(pm25UgM3, 'pm25UgM3');
  assertFiniteNumber(durationHours, 'durationHours');
  assertFiniteNumber(breathingRateM3H, 'breathingRateM3H');
  assertFiniteNumber(protectionFactor, 'protectionFactor');

  if (pm25UgM3 < 0) throw new RangeError(`PM2.5 cannot be negative. Received: ${pm25UgM3}`);
  if (durationHours < 0) throw new RangeError(`Duration cannot be negative. Received: ${durationHours}`);
  if (breathingRateM3H < 0) throw new RangeError(`Breathing rate cannot be negative. Received: ${breathingRateM3H}`);
  if (protectionFactor < 0 || protectionFactor > 1) {
    throw new RangeError(`Protection factor must be between 0 and 1. Received: ${protectionFactor}`);
  }

  const dose = pm25UgM3 * durationHours * breathingRateM3H * (1 - protectionFactor);
  return Math.round(dose * 10) / 10;
}

const MODE_CONFIGS: Record<
  TransitMode,
  { speed: number; breathingRate: number; protection: number; co2PerKm: number; label: string }
> = {
  [TransitMode.Metro]: { speed: 35, breathingRate: 0.6, protection: 0.75, co2PerKm: 0.02, label: 'Underground Metro' },
  [TransitMode.ElectricBus]: { speed: 20, breathingRate: 0.6, protection: 0.6, co2PerKm: 0.04, label: 'Electric City Bus' },
  [TransitMode.DieselBus]: { speed: 18, breathingRate: 0.6, protection: 0.5, co2PerKm: 0.11, label: 'Diesel Transit Bus' },
  [TransitMode.Cycling]: { speed: 15, breathingRate: 2.2, protection: 0.0, co2PerKm: 0.0, label: 'Bicycle / E-Bike' },
  [TransitMode.Walking]: { speed: 5, breathingRate: 1.2, protection: 0.0, co2PerKm: 0.0, label: 'Walking Pedestrian' },
  [TransitMode.EV]: { speed: 25, breathingRate: 0.5, protection: 0.85, co2PerKm: 0.05, label: 'Electric Vehicle (HEPA)' },
  [TransitMode.GasCar]: { speed: 25, breathingRate: 0.5, protection: 0.6, co2PerKm: 0.19, label: 'Gasoline Car' },
};

function getAdvisory(mode: TransitMode, ambientAQI: number): string {
  if (ambientAQI > 200 && (mode === TransitMode.Cycling || mode === TransitMode.Walking)) {
    return 'HAZARD: Vigorous outdoor exertion in severe smog causes deep alveolar deposition. Switch to Metro.';
  }
  if (ambientAQI > 150 && mode === TransitMode.Metro) {
    return 'OPTIMAL: Underground rail avoids outdoor thermal inversion layer and heavy surface PM2.5.';
  }
  if (mode === TransitMode.GasCar) {
    return 'High carbon emissions intensify local NO2 street canyons. Consider electric mass transit.';
  }
  return 'Normal commute conditions.';
}

/**
 * Computes multi-modal commute trade-offs for a given travel distance and ambient air quality index.
 */
export function calculateCommuteMetrics(
  distanceKm: number,
  mode: TransitMode,
  ambientAQI: number
): TransitRouteComparison {
  assertFiniteNumber(distanceKm, 'distanceKm');
  assertFiniteNumber(ambientAQI, 'ambientAQI');

  if (distanceKm <= 0) throw new RangeError(`Distance must be > 0. Received: ${distanceKm}`);
  if (ambientAQI < 0) throw new RangeError(`AQI cannot be negative. Received: ${ambientAQI}`);

  const pm25UgM3 = Math.max(5, (ambientAQI / 500) * 250);
  const config = MODE_CONFIGS[mode];
  const durationHours = distanceKm / config.speed;
  const durationMinutes = Math.max(1, Math.round(durationHours * 60));
  const dose = calculateExposureDose(pm25UgM3, durationHours, config.breathingRate, config.protection);
  const co2 = Math.round(distanceKm * config.co2PerKm * 100) / 100;

  let healthRiskRating: 'minimal' | 'low' | 'moderate' | 'severe' = 'minimal';
  if (dose > 60) healthRiskRating = 'severe';
  else if (dose > 30) healthRiskRating = 'moderate';
  else if (dose > 10) healthRiskRating = 'low';

  const isRecommended =
    (mode === TransitMode.Metro && ambientAQI > 100) ||
    (mode === TransitMode.Cycling && ambientAQI <= 50) ||
    (mode === TransitMode.Walking && ambientAQI <= 50 && distanceKm <= 3) ||
    (mode === TransitMode.ElectricBus && ambientAQI > 50 && ambientAQI <= 150);

  return {
    mode,
    modeLabel: config.label,
    durationMinutes,
    distanceKm,
    pm25ExposureDoseUg: dose,
    co2EmissionsKg: co2,
    healthRiskRating,
    isRecommended,
    advisory: getAdvisory(mode, ambientAQI),
  };
}
