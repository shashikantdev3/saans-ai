'use client';

import { createContext, useContext } from 'react';
import { t as translate, type Lang, type MessageKey, type Params } from '@/lib/i18n';

const LangContext = createContext<Lang>('en');

export const LangProvider = LangContext.Provider;

/** Current language plus a bound translate function. */
export function useI18n() {
  const lang = useContext(LangContext);
  return { lang, t: (key: MessageKey, params?: Params) => translate(lang, key, params) };
}
