// ============================================================
// src/lib/compute/cadrCalculations.ts
// Indoor room volume, CADR sizing, and purification kinetics
// ============================================================

import { assertFiniteNumber } from './asserts';

/**
 * Calculates room volume in cubic meters.
 */
export function calculateRoomVolume(areaSqM: number, heightM: number): number {
  assertFiniteNumber(areaSqM, 'areaSqM');
  assertFiniteNumber(heightM, 'heightM');
  if (areaSqM <= 0) {
    throw new RangeError(`Room area must be strictly positive. Received: ${areaSqM}`);
  }
  if (heightM <= 0) {
    throw new RangeError(`Room height must be strictly positive. Received: ${heightM}`);
  }
  return Math.round(areaSqM * heightM * 100) / 100;
}

/**
 * Calculates required Clean Air Delivery Rate (CADR in m³/h) to achieve target Air Changes per Hour (ACH).
 * Standard ASHRAE recommends at least 4 to 5 ACH for wildfire and severe winter smog events.
 */
export function calculateRequiredCADR(volumeM3: number, desiredACH = 4): number {
  assertFiniteNumber(volumeM3, 'volumeM3');
  assertFiniteNumber(desiredACH, 'desiredACH');
  if (volumeM3 <= 0) {
    throw new RangeError(`Room volume must be strictly positive. Received: ${volumeM3}`);
  }
  if (desiredACH <= 0) {
    throw new RangeError(`Desired ACH must be strictly positive. Received: ${desiredACH}`);
  }
  return Math.round(volumeM3 * desiredACH);
}

/**
 * Estimates time (in minutes) required to reduce indoor airborne particulate by target efficiency (default 80%).
 * Uses single-compartment mass balance first-order decay:
 * t = (-ln(1 - efficiency) * V / CADR) * 60
 */
export function estimatePurificationTime(
  volumeM3: number,
  cadrM3H: number,
  targetEfficiency = 0.8,
): number {
  assertFiniteNumber(volumeM3, 'volumeM3');
  assertFiniteNumber(cadrM3H, 'cadrM3H');
  assertFiniteNumber(targetEfficiency, 'targetEfficiency');

  if (volumeM3 <= 0) throw new RangeError(`Volume must be > 0. Received: ${volumeM3}`);
  if (cadrM3H <= 0) throw new RangeError(`CADR must be > 0. Received: ${cadrM3H}`);
  if (targetEfficiency <= 0 || targetEfficiency >= 1) {
    throw new RangeError(
      `Target efficiency must be between 0 and 1. Received: ${targetEfficiency}`,
    );
  }

  const hours = (-Math.log(1 - targetEfficiency) * volumeM3) / cadrM3H;
  return Math.max(1, Math.round(hours * 60));
}
