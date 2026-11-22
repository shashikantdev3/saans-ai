import { en, type MessageKey } from './en';
import { hi } from './hi';

export type Lang = 'en' | 'hi';
export const LANGS: readonly Lang[] = ['en', 'hi'];
export type { MessageKey };

const dictionaries: Record<Lang, Record<MessageKey, string>> = { en, hi };

export type Params = Record<string, string | number>;

/** Fill {name} placeholders. Unknown placeholders are left visible so bugs are easy to spot. */
export function format(template: string, params: Params = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

export function t(lang: Lang, key: MessageKey, params?: Params): string {
  return format(dictionaries[lang][key], params);
}

export function isMessageKey(key: string): key is MessageKey {
  return key in en;
}
