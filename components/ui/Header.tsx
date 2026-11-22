'use client';

import type { Lang } from '@/lib/i18n';
import { useI18n } from './I18n';

export function Header({
  largeText,
  onLang,
  onLargeText,
}: {
  largeText: boolean;
  onLang: (l: Lang) => void;
  onLargeText: (v: boolean) => void;
}) {
  const { t, lang } = useI18n();
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-6">
      <div>
        <p className="text-4xl leading-none font-extrabold tracking-tight">
          {t('appName')}
          <span className="ml-2 align-middle text-base font-semibold text-muted">
            {lang === 'en' ? 'साँस' : 'Saans'}
          </span>
        </p>
        <p className="mt-1 text-muted">{t('tagline')}</p>
      </div>
      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label={t('language')}
          className="flex rounded-lg border border-line bg-paper p-1"
        >
          {(['en', 'hi'] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => onLang(l)}
              className={`min-h-11 rounded-md px-3 font-semibold ${lang === l ? 'bg-ink text-white' : 'text-ink'}`}
              lang={l}
            >
              {l === 'en' ? 'English' : 'हिंदी'}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={largeText}
          onClick={() => onLargeText(!largeText)}
          className={`min-h-12 rounded-lg border border-line px-3 font-semibold ${largeText ? 'bg-ink text-white' : 'bg-paper'}`}
        >
          <span aria-hidden="true" className="mr-1">
            A+
          </span>
          {t('largeText')}
        </button>
      </div>
    </header>
  );
}
