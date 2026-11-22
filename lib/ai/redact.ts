/**
 * What Gemini is allowed to see about a household: coarse, non-identifying buckets only.
 * No names, no coordinates, no free text from the profile. The chat UI shows this exact
 * object so users can check it.
 */
import type { Profile } from '../profile/schema';
import { hasSensitiveMember } from '../profile/schema';

export interface HouseholdContext {
  householdSize: '1' | '2-4' | '5+';
  sensitiveMemberAtHome: boolean;
  commuteMode: Profile['commuteMode'];
  commuteDistance: 'none' | 'under 5 km' | '5-15 km' | 'over 15 km';
  cookingFuel: Profile['cookingFuel'];
  heating: Profile['heating'];
  hasPurifier: boolean;
  workFromHomeDays: number;
}

export function householdContext(p: Profile): HouseholdContext {
  const km = p.commuteKm;
  return {
    householdSize: p.people === 1 ? '1' : p.people <= 4 ? '2-4' : '5+',
    sensitiveMemberAtHome: hasSensitiveMember(p),
    commuteMode: p.commuteMode,
    commuteDistance:
      p.commuteMode === 'none' || km === 0
        ? 'none'
        : km < 5
          ? 'under 5 km'
          : km <= 15
            ? '5-15 km'
            : 'over 15 km',
    cookingFuel: p.cookingFuel,
    heating: p.heating,
    hasPurifier: p.hasPurifier,
    workFromHomeDays: p.wfhDays,
  };
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g;
const LONG_NUMBER = /\b\d(?:[\s-]?\d){9,}\b/g;

/** Best-effort removal of contact details a user might paste into chat. */
export function scrubPii(text: string): string {
  return text
    .replace(EMAIL, '[email removed]')
    .replace(PHONE, '[phone removed]')
    .replace(LONG_NUMBER, '[number removed]');
}
