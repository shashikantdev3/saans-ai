'use client';

import { memo } from 'react';
import { useI18n } from './I18n';

const REPO_URL = 'https://github.com/shashikantdev3/saans-ai';

/** Data attribution, privacy note and source link. */
export const Footer = memo(function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-8 border-t border-line pt-6 text-sm text-muted">
      <p>{t('attribution')}</p>
      <p className="mt-1">{t('privacyNote')}</p>
      <p className="mt-2">
        <a className="font-semibold text-breath underline" href={REPO_URL}>
          {t('footerSource')}
        </a>{' '}
        | {t('footerMethod')}
      </p>
    </footer>
  );
});
