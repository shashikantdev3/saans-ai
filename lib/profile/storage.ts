/** Browser-only storage for the household profile and UI preferences. */
import type { Lang } from '../i18n';
import { profileSchema, type Profile } from './schema';

const PROFILE_KEY = 'saans.profile.v1';
const PREFS_KEY = 'saans.prefs.v1';

export interface Prefs {
  lang: Lang;
  largeText: boolean;
}

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private mode); the app still works without it.
  }
}

export function loadProfile(): Profile | null {
  const parsed = profileSchema.safeParse(read(PROFILE_KEY));
  return parsed.success ? parsed.data : null;
}

export const saveProfile = (profile: Profile) => write(PROFILE_KEY, profile);

export function clearProfile(): void {
  try {
    window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    // ignore
  }
}

export function loadPrefs(): Prefs {
  const raw = read(PREFS_KEY) as Partial<Prefs> | null;
  return { lang: raw?.lang === 'hi' ? 'hi' : 'en', largeText: raw?.largeText === true };
}

export const savePrefs = (prefs: Prefs) => write(PREFS_KEY, prefs);
