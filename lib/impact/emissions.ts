/**
 * CO2 from daily choices, using Delhi passenger-km factors (TERI) and CEA grid data.
 * Only CO2 is quantified. Particle and NOx savings are real but we do not have
 * India-specific per-km factors we trust enough to show as numbers.
 */
import { FACTORS } from './factors';

export type CommuteMode =
  'none' | 'walk' | 'cycle' | 'two_wheeler' | 'car' | 'carpool' | 'auto' | 'bus' | 'metro';

/** grams of CO2 per passenger-km. A solo car carries the whole vehicle's emissions. */
export function gramsPerPassengerKm(mode: CommuteMode, carpoolSize = 3): number {
  const carPerVehicleKm = FACTORS.carPetrolPkm.value * FACTORS.carOccupancy.value;
  switch (mode) {
    case 'none':
    case 'walk':
    case 'cycle':
      return 0;
    case 'two_wheeler':
      return FACTORS.twoWheelerPkm.value;
    case 'car':
      return carPerVehicleKm;
    case 'carpool':
      return carPerVehicleKm / Math.max(2, carpoolSize);
    case 'auto':
      return FACTORS.autoPkm.value;
    case 'bus':
      return FACTORS.busPkm.value;
    case 'metro':
      return FACTORS.metroPkm.value;
  }
}

/** Round trip CO2 in grams for one day. */
export function commuteCo2PerDay(mode: CommuteMode, kmOneWay: number): number {
  return gramsPerPassengerKm(mode) * kmOneWay * 2;
}

export interface SwitchSaving {
  from: CommuteMode;
  to: CommuteMode;
  gramsPerDay: number;
  kgPerWeek: number;
  percent: number;
}

export function commuteSwitchSaving(
  from: CommuteMode,
  to: CommuteMode,
  kmOneWay: number,
  commuteDaysPerWeek: number,
): SwitchSaving {
  const before = commuteCo2PerDay(from, kmOneWay);
  const after = commuteCo2PerDay(to, kmOneWay);
  const gramsPerDay = Math.max(0, before - after);
  return {
    from,
    to,
    gramsPerDay: Math.round(gramsPerDay),
    kgPerWeek: Math.round((gramsPerDay * commuteDaysPerWeek) / 100) / 10,
    percent: before > 0 ? Math.round((gramsPerDay / before) * 100) : 0,
  };
}

/** Best cleaner alternative for a mode, or null if already zero or near the floor. */
export function cleanerAlternative(mode: CommuteMode, kmOneWay: number): CommuteMode | null {
  if (kmOneWay <= 0) return null;
  if (kmOneWay <= 2 && mode !== 'walk' && mode !== 'cycle' && mode !== 'none') return 'walk';
  switch (mode) {
    case 'car':
      return 'metro';
    case 'carpool':
    case 'two_wheeler':
    case 'auto':
      return 'metro';
    default:
      return null;
  }
}

export interface GeneratorComparison {
  kwh: number;
  dieselKg: number;
  inverterKg: number;
}

/**
 * Diesel generator vs a grid-charged battery inverter for the same energy.
 * Honest result: CO2 is close, because India's grid is coal heavy. The real gain from
 * skipping the generator is no diesel exhaust at street level during smog hours.
 */
export function generatorVsInverter(kwh: number): GeneratorComparison {
  const dieselKg = kwh * FACTORS.dgLitresPerKwh.value * FACTORS.dieselCo2PerLitre.value;
  const inverterKg = (kwh / FACTORS.inverterRoundTrip.value) * FACTORS.gridCo2PerKwh.value;
  return {
    kwh,
    dieselKg: Math.round(dieselKg * 100) / 100,
    inverterKg: Math.round(inverterKg * 100) / 100,
  };
}
