'use client';

import { useEffect, useState } from 'react';
import type { Lang } from '@/lib/i18n';
import { loadPrefs, savePrefs } from '@/lib/profile/storage';

export interface Preferences {
  lang: Lang;
  largeText: boolean;
  setLang: (lang: Lang) => void;
  setLargeText: (value: boolean) => void;
}

/**
 * Language and large-text mode. Restored from localStorage after mount (the server has no
 * access to it) and reflected on <html> so screen readers and rem-based sizes follow.
 */
export function usePreferences(): Preferences {
  const [lang, setLang] = useState<Lang>('en');
  const [largeText, setLargeText] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const prefs = loadPrefs();
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage is only readable after mount */
    setLang(prefs.lang);
    setLargeText(prefs.largeText);
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle('large-text', largeText);
    if (restored) savePrefs({ lang, largeText });
  }, [lang, largeText, restored]);

  return { lang, largeText, setLang, setLargeText };
}
