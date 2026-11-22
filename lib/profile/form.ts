/**
 * Form helpers for the household profile. Number inputs are kept as strings while the user
 * types, then parsed and validated with the same zod schema the API uses.
 */
import type { MessageKey } from '../i18n';
import { profileSchema, type Profile } from './schema';

export type NumberField = 'people' | 'commuteKm' | 'roomSizeM2' | 'wfhDays' | 'usualOutdoorHour';
export type BoolField =
  'hasChild' | 'hasElderly' | 'hasBreathingCondition' | 'hasPurifier' | 'hasAc' | 'usesGenerator';
export type SelectField = 'commuteMode' | 'cookingFuel' | 'heating' | 'budget';

export interface NumberFieldSpec {
  key: NumberField;
  min: number;
  max: number;
  step?: number;
  hint?: MessageKey;
}

export const NUMBER_FIELDS: readonly NumberFieldSpec[] = [
  { key: 'people', min: 1, max: 20 },
  { key: 'commuteKm', min: 0, max: 100, step: 0.5 },
  { key: 'roomSizeM2', min: 4, max: 100, hint: 'roomSizeHint' },
  { key: 'wfhDays', min: 0, max: 5 },
  { key: 'usualOutdoorHour', min: 5, max: 21 },
];

export const SENSITIVE_FIELDS: readonly BoolField[] = [
  'hasChild',
  'hasElderly',
  'hasBreathingCondition',
];
export const EQUIPMENT_FIELDS: readonly BoolField[] = ['hasPurifier', 'hasAc', 'usesGenerator'];

export type Draft = Record<NumberField, string>;

export function toDraft(profile: Profile): Draft {
  return {
    people: String(profile.people),
    commuteKm: String(profile.commuteKm),
    roomSizeM2: String(profile.roomSizeM2),
    wfhDays: String(profile.wfhDays),
    usualOutdoorHour: String(profile.usualOutdoorHour),
  };
}

const toNumber = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

export type ParseResult =
  { ok: true; profile: Profile } | { ok: false; invalid: (keyof Profile)[] };

/** Merge typed numbers into the profile and validate; returns the fields that failed. */
export function parseProfile(profile: Profile, draft: Draft): ParseResult {
  const candidate = {
    ...profile,
    people: toNumber(draft.people),
    commuteKm: toNumber(draft.commuteKm),
    roomSizeM2: toNumber(draft.roomSizeM2),
    wfhDays: toNumber(draft.wfhDays),
    usualOutdoorHour: toNumber(draft.usualOutdoorHour),
  };
  const parsed = profileSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, profile: parsed.data };
  const invalid = [...new Set(parsed.error.issues.map((i) => String(i.path[0]) as keyof Profile))];
  return { ok: false, invalid };
}
