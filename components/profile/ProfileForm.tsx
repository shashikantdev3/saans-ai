'use client';

import { useState, type FormEvent } from 'react';
import {
  EQUIPMENT_FIELDS,
  NUMBER_FIELDS,
  SENSITIVE_FIELDS,
  parseProfile,
  toDraft,
} from '@/lib/profile/form';
import {
  BUDGETS,
  COMMUTE_MODES,
  COOKING_FUELS,
  HEATING,
  SAMPLE_PROFILE,
  type Profile,
} from '@/lib/profile/schema';
import { useI18n } from '../ui/I18n';
import { ErrorNote, buttonPrimary, buttonQuiet } from '../ui/Section';
import { CheckboxInput, NumberInput, SelectInput } from './fields';

/** Household details. Validated in the browser with the same zod schema the server uses. */
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
  const [draft, setDraft] = useState(() => toDraft(initial));
  const [invalid, setInvalid] = useState<(keyof Profile)[]>([]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = parseProfile(profile, draft);
    if (!result.ok) return setInvalid(result.invalid);
    setInvalid([]);
    setProfile(result.profile);
    onSubmit(result.profile);
  }

  function loadSample() {
    setProfile(SAMPLE_PROFILE);
    setDraft(toDraft(SAMPLE_PROFILE));
    setInvalid([]);
    onSubmit(SAMPLE_PROFILE);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {NUMBER_FIELDS.map((spec) => (
          <NumberInput
            key={spec.key}
            spec={spec}
            value={draft[spec.key]}
            invalid={invalid.includes(spec.key)}
            onChange={(value) => setDraft((d) => ({ ...d, [spec.key]: value }))}
          />
        ))}
      </div>

      <fieldset>
        <legend className="font-semibold">{t('sensitiveLegend')}</legend>
        <div className="mt-1 flex flex-col">
          {SENSITIVE_FIELDS.map((key) => (
            <CheckboxInput
              key={key}
              label={t(key)}
              checked={profile[key]}
              onChange={(v) => set(key, v)}
            />
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput
          id="commuteMode"
          value={profile.commuteMode}
          options={COMMUTE_MODES}
          optionLabel={(v) => t(`mode_${v}`)}
          onChange={(v) => set('commuteMode', v)}
        />
        <SelectInput
          id="cookingFuel"
          value={profile.cookingFuel}
          options={COOKING_FUELS}
          optionLabel={(v) => t(`fuel_${v}`)}
          onChange={(v) => set('cookingFuel', v)}
        />
        <SelectInput
          id="heating"
          value={profile.heating}
          options={HEATING}
          optionLabel={(v) => t(`heat_${v}`)}
          onChange={(v) => set('heating', v)}
        />
        <SelectInput
          id="budget"
          value={profile.budget}
          options={BUDGETS}
          optionLabel={(v) => t(`budget_${v}`)}
          onChange={(v) => set('budget', v)}
        />
      </div>

      <div className="flex flex-col">
        {EQUIPMENT_FIELDS.map((key) => (
          <CheckboxInput
            key={key}
            label={t(key)}
            checked={profile[key]}
            onChange={(v) => set(key, v)}
          />
        ))}
      </div>

      {invalid.length > 0 ? <ErrorNote>{invalid.map((k) => t(k)).join(', ')}</ErrorNote> : null}

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
