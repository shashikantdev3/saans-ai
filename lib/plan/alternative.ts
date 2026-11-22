/** Picks the one sustainable switch to suggest, in order of how much it changes. */
import {
  cleanerAlternative,
  commuteSwitchSaving,
  generatorVsInverter,
  type CommuteMode,
} from '../impact/emissions';
import type { Profile } from '../profile/schema';

export type Alternative =
  | {
      kind: 'commute';
      from: CommuteMode;
      to: CommuteMode;
      kmOneWay: number;
      commuteDays: number;
      gramsPerDay: number;
      kgPerWeek: number;
      percent: number;
    }
  | { kind: 'generator'; kwh: number; dieselKg: number; inverterKg: number }
  | { kind: 'cooking_fuel' }
  | { kind: 'walk_errands' };

/** Typical daily generator use when someone says they use one (assumption). */
const GENERATOR_KWH_PER_DAY = 4;

export function chooseAlternative(profile: Profile): Alternative {
  const to = cleanerAlternative(profile.commuteMode, profile.commuteKm);
  const commuteDays = Math.max(0, 5 - profile.wfhDays);
  if (to && commuteDays > 0) {
    const saving = commuteSwitchSaving(profile.commuteMode, to, profile.commuteKm, commuteDays);
    return { kind: 'commute', kmOneWay: profile.commuteKm, commuteDays, ...saving };
  }
  if (profile.usesGenerator)
    return { kind: 'generator', ...generatorVsInverter(GENERATOR_KWH_PER_DAY) };
  if (profile.cookingFuel === 'biomass' || profile.cookingFuel === 'kerosene')
    return { kind: 'cooking_fuel' };
  return { kind: 'walk_errands' };
}
