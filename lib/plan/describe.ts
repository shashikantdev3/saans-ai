/** Turns plan data into words in the chosen language. Also the rule-based fallback text. */
import type { AqiBand } from '../aqi/bands';
import type { Hack } from '../impact/hacks';
import { t, type Lang } from '../i18n';
import type { Alternative, Plan } from './buildPlan';
import type { PlanItem } from './rules';

export const bandLabel = (lang: Lang, band: AqiBand) => t(lang, `band_${band}`);

export function describeItem(lang: Lang, item: PlanItem): string {
  return t(lang, item.id, item.params);
}

export interface TitleDetail {
  title: string;
  detail: string;
}

export function describeHack(lang: Lang, hack: Hack): TitleDetail {
  const params = {
    before: hack.before ?? '',
    after: hack.after ?? '',
    percent: hack.percent ?? '',
    avoided: hack.avoided ?? '',
  };
  return { title: t(lang, `hack_${hack.id}`), detail: t(lang, `hack_${hack.id}_detail`, params) };
}

export function describeAlternative(lang: Lang, alt: Alternative): TitleDetail {
  switch (alt.kind) {
    case 'commute': {
      const params = {
        from: t(lang, `mode_${alt.from}`),
        to: t(lang, `mode_${alt.to}`),
        km: alt.kmOneWay,
        gramsPerDay: alt.gramsPerDay,
        kgPerWeek: alt.kgPerWeek,
        percent: alt.percent,
      };
      return {
        title: t(lang, 'alt_commute', params),
        detail: t(lang, 'alt_commute_detail', params),
      };
    }
    case 'generator':
      return { title: t(lang, 'alt_generator'), detail: t(lang, 'alt_generator_detail', alt) };
    case 'cooking_fuel':
      return { title: t(lang, 'alt_cooking_fuel'), detail: t(lang, 'alt_cooking_fuel_detail') };
    case 'walk_errands':
      return { title: t(lang, 'alt_walk_errands'), detail: t(lang, 'alt_walk_errands_detail') };
  }
}

/** Short headline for the plan when Gemini is not used. */
export function ruleHeadline(lang: Lang, plan: Plan): string {
  return t(lang, 'doseHeadline', { percent: plan.dose.percentCut });
}
