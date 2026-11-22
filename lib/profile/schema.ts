/**
 * Household profile. Lives only in the browser (localStorage). It is sent with a request
 * when a calculation needs it, validated here, used in memory and never stored or logged.
 */
import { z } from 'zod';

export const COMMUTE_MODES = [
  'none',
  'walk',
  'cycle',
  'two_wheeler',
  'car',
  'carpool',
  'auto',
  'bus',
  'metro',
] as const;
export const COOKING_FUELS = ['lpg', 'png', 'induction', 'biomass', 'kerosene'] as const;
export const HEATING = ['none', 'electric', 'gas', 'coal_wood'] as const;
export const BUDGETS = ['low', 'medium', 'high'] as const;

export const profileSchema = z.object({
  people: z.number().int().min(1).max(20),
  hasChild: z.boolean(),
  hasElderly: z.boolean(),
  hasBreathingCondition: z.boolean(),
  commuteMode: z.enum(COMMUTE_MODES),
  commuteKm: z.number().min(0).max(100),
  cookingFuel: z.enum(COOKING_FUELS),
  heating: z.enum(HEATING),
  hasPurifier: z.boolean(),
  hasAc: z.boolean(),
  usesGenerator: z.boolean(),
  roomSizeM2: z.number().min(4).max(100),
  wfhDays: z.number().int().min(0).max(5),
  budget: z.enum(BUDGETS),
  /** Hour the family usually goes out to walk, exercise or play (local time) */
  usualOutdoorHour: z.number().int().min(5).max(21),
});

export type Profile = z.infer<typeof profileSchema>;

export const DEFAULT_PROFILE: Profile = {
  people: 3,
  hasChild: false,
  hasElderly: false,
  hasBreathingCondition: false,
  commuteMode: 'metro',
  commuteKm: 10,
  cookingFuel: 'lpg',
  heating: 'none',
  hasPurifier: false,
  hasAc: false,
  usesGenerator: false,
  roomSizeM2: 14,
  wfhDays: 0,
  budget: 'medium',
  usualOutdoorHour: 7,
};

/** Example household for a quick look; the demo video fills the form by hand instead. */
export const SAMPLE_PROFILE: Profile = {
  people: 4,
  hasChild: true,
  hasElderly: true,
  hasBreathingCondition: false,
  commuteMode: 'car',
  commuteKm: 14,
  cookingFuel: 'lpg',
  heating: 'electric',
  hasPurifier: false,
  hasAc: true,
  usesGenerator: false,
  roomSizeM2: 16,
  wfhDays: 1,
  budget: 'medium',
  usualOutdoorHour: 7,
};

export function hasSensitiveMember(p: Profile): boolean {
  return p.hasChild || p.hasElderly || p.hasBreathingCondition;
}
