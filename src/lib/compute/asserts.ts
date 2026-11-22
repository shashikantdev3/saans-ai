// ============================================================
// src/lib/compute/asserts.ts
// Numerical assertion and interpolation utilities
// ============================================================

/**
 * Validates that an argument is a finite number.
 */
export function assertFiniteNumber(val: number, paramName: string): void {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    throw new RangeError(`Parameter "${paramName}" must be a finite number. Received: ${val}`);
  }
}

/**
 * Piecewise linear interpolation for pollutant sub-index.
 * Formula: I = ((I_hi - I_lo) / (BP_hi - BP_lo)) * (Cp - BP_lo) + I_lo
 */
export function linearInterpolation(
  cp: number,
  bpLo: number,
  bpHi: number,
  iLo: number,
  iHi: number
): number {
  return Math.round(((iHi - iLo) / (bpHi - bpLo)) * (cp - bpLo) + iLo);
}
