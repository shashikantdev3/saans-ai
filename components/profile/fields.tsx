'use client';

import type { MessageKey } from '@/lib/i18n';
import type { NumberFieldSpec } from '@/lib/profile/form';
import { useI18n } from '../ui/I18n';
import { inputClass } from '../ui/Section';

/** Labelled number input with its allowed range announced as a hint. */
export function NumberInput({
  spec,
  value,
  invalid,
  onChange,
}: {
  spec: NumberFieldSpec;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const hintId = `${spec.key}-hint`;
  return (
    <div>
      <label htmlFor={spec.key} className="mb-1 block font-semibold">
        {t(spec.key)}
      </label>
      <input
        id={spec.key}
        type="number"
        inputMode="decimal"
        min={spec.min}
        max={spec.max}
        step={spec.step ?? 1}
        className={`${inputClass} ${invalid ? 'border-2 border-[#d32f2f]' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={hintId}
      />
      <p
        id={hintId}
        className={`mt-1 text-sm ${invalid ? 'font-semibold text-[#b3261e]' : 'text-muted'}`}
      >
        {spec.hint ? `${t(spec.hint)} ` : ''}
        {spec.min} to {spec.max}
      </p>
    </div>
  );
}

/** Labelled select whose option labels come from the translation table. */
export function SelectInput<V extends string>({
  id,
  value,
  options,
  optionLabel,
  onChange,
}: {
  id: MessageKey;
  value: V;
  options: readonly V[];
  optionLabel: (v: V) => string;
  onChange: (value: V) => void;
}) {
  const { t } = useI18n();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-semibold">
        {t(id)}
      </label>
      <select
        id={id}
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value as V)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {optionLabel(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Checkbox with a 44 px tall touch target. */
export function CheckboxInput({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3">
      <input
        type="checkbox"
        className="size-5 accent-[#1f5f7a]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
