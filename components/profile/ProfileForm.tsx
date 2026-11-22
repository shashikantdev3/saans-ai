'use client';

import { useState, type FormEvent } from 'react';
import type { MessageKey } from '@/lib/i18n';
import {
  BUDGETS,
  COMMUTE_MODES,
  COOKING_FUELS,
  HEATING,
  profileSchema,
  SAMPLE_PROFILE,
  type Profile,
} from '@/lib/profile/schema';
import { useI18n } from '../ui/I18n';
import { ErrorNote, buttonPrimary, buttonQuiet, inputClass } from '../ui/Section';

type NumberField = 'people' | 'commuteKm' | 'roomSizeM2' | 'wfhDays' | 'usualOutdoorHour';
type BoolField =
  'hasChild' | 'hasElderly' | 'hasBreathingCondition' | 'hasPurifier' | 'hasAc' | 'usesGenerator';

const NUMBERS: { key: NumberField; min: number; max: number; step?: number; hint?: MessageKey }[] =
  [
    { key: 'people', min: 1, max: 20 },
    { key: 'commuteKm', min: 0, max: 100, step: 0.5 },
    { key: 'roomSizeM2', min: 4, max: 100, hint: 'roomSizeHint' },
    { key: 'wfhDays', min: 0, max: 5 },
    { key: 'usualOutdoorHour', min: 5, max: 21 },
  ];

const toDraft = (p: Profile) =>
  Object.fromEntries(NUMBERS.map(({ key }) => [key, String(p[key])])) as Record<
    NumberField,
    string
  >;

export function ProfileForm({
  initial,
  onSubmit,
  onClear,
}: {
  initial: Profile;
  onSubmit: (p: Profile) => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  const [profile, setProfile] = useState<Profile>(initial);
  const [draft, setDraft] = useState(toDraft(initial));
  const [invalid, setInvalid] = useState<string[]>([]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const candidate = {
      ...profile,
      ...Object.fromEntries(
        NUMBERS.map(({ key }) => [key, draft[key].trim() === '' ? Number.NaN : Number(draft[key])]),
      ),
    };
    const parsed = profileSchema.safeParse(candidate);
    if (!parsed.success) {
      setInvalid(parsed.error.issues.map((i) => String(i.path[0])));
      return;
    }
    setInvalid([]);
    setProfile(parsed.data);
    onSubmit(parsed.data);
  }

  function loadSample() {
    setProfile(SAMPLE_PROFILE);
    setDraft(toDraft(SAMPLE_PROFILE));
    setInvalid([]);
    onSubmit(SAMPLE_PROFILE);
  }

  const select = <K extends 'commuteMode' | 'cookingFuel' | 'heating' | 'budget'>(
    key: K,
    options: readonly Profile[K][],
    label: (v: Profile[K]) => string,
  ) => (
    <div>
      <label htmlFor={key} className="mb-1 block font-semibold">
        {t(key)}
      </label>
      <select
        id={key}
        className={inputClass}
        value={profile[key]}
        onChange={(e) => set(key, e.target.value as Profile[K])}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {label(o)}
          </option>
        ))}
      </select>
    </div>
  );

  const checkbox = (key: BoolField) => (
    <label key={key} className="flex min-h-11 items-center gap-3">
      <input
        type="checkbox"
        className="size-5 accent-[#1f5f7a]"
        checked={profile[key]}
        onChange={(e) => set(key, e.target.checked)}
      />
      <span>{t(key)}</span>
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {NUMBERS.map(({ key, min, max, step, hint }) => {
          const bad = invalid.includes(key);
          return (
            <div key={key}>
              <label htmlFor={key} className="mb-1 block font-semibold">
                {t(key)}
              </label>
              <input
                id={key}
                type="number"
                inputMode="decimal"
                min={min}
                max={max}
                step={step ?? 1}
                className={`${inputClass} ${bad ? 'border-2 border-[#d32f2f]' : ''}`}
                value={draft[key]}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                aria-invalid={bad}
                aria-describedby={`${key}-hint`}
              />
              <p
                id={`${key}-hint`}
                className={`mt-1 text-sm ${bad ? 'font-semibold text-[#b3261e]' : 'text-muted'}`}
              >
                {hint ? `${t(hint)} ` : ''}
                {min} to {max}
              </p>
            </div>
          );
        })}
      </div>

      <fieldset>
        <legend className="font-semibold">{t('sensitiveLegend')}</legend>
        <div className="mt-1 flex flex-col">
          {(['hasChild', 'hasElderly', 'hasBreathingCondition'] as const).map(checkbox)}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {select('commuteMode', COMMUTE_MODES, (v) => t(`mode_${v}`))}
        {select('cookingFuel', COOKING_FUELS, (v) => t(`fuel_${v}`))}
        {select('heating', HEATING, (v) => t(`heat_${v}`))}
        {select('budget', BUDGETS, (v) => t(`budget_${v}`))}
      </div>

      <div className="flex flex-col">
        {(['hasPurifier', 'hasAc', 'usesGenerator'] as const).map(checkbox)}
      </div>

      {invalid.length > 0 ? (
        <ErrorNote>{invalid.map((k) => t(k as MessageKey)).join(', ')}</ErrorNote>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={buttonPrimary}>
          {t('saveProfile')}
        </button>
        <button type="button" className={buttonQuiet} onClick={loadSample}>
          {t('sampleFamily')}
        </button>
        <button
          type="button"
          className={`${buttonQuiet} border-transparent bg-transparent`}
          onClick={onClear}
        >
          {t('clearProfile')}
        </button>
      </div>
      <p className="text-sm text-muted">{t('privacyNote')}</p>
    </form>
  );
}
