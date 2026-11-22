'use client';

import type { PlanResponse } from '@/lib/client/api';
import { describeItem } from '@/lib/plan/describe';
import type { Severity } from '@/lib/plan/rules';
import { BandBadge } from '../ui/BandBadge';
import { useI18n } from '../ui/I18n';

const SEVERITY_BAR: Record<Severity, string> = {
  info: 'border-breath',
  caution: 'border-[#c77700]',
  warning: 'border-[#b3261e]',
};

export function PlanTimeline({ data }: { data: PlanResponse }) {
  const { t, lang } = useI18n();
  const { plan, explanation } = data;
  const ai = explanation.source === 'gemini';
  const source = t(ai ? 'planSourceAi' : 'planSourceRules');

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl border border-line bg-paper px-4 py-3">
          <p className="text-sm text-muted">{t('bestWindow')}</p>
          <p className="text-3xl font-extrabold" data-testid="best-time">
            {plan.best.time}
          </p>
          <p className="text-sm">
            PM2.5 {plan.best.pm25} <BandBadge band={plan.best.band} className="ml-1 text-xs" />
          </p>
        </div>
        <div className="rounded-xl border border-line bg-paper px-4 py-3">
          <p className="text-sm text-muted">{t('worstWindow')}</p>
          <p className="text-3xl font-extrabold">{plan.worst.time}</p>
          <p className="text-sm">
            PM2.5 {plan.worst.pm25} <BandBadge band={plan.worst.band} className="ml-1 text-xs" />
          </p>
        </div>
      </div>

      <article
        className="mt-5 rounded-2xl bg-paper p-5 shadow-[0_1px_0_#cfd9e0]"
        aria-live="polite"
      >
        <p
          className={`inline-block rounded-full px-3 py-0.5 text-sm font-semibold ${ai ? 'bg-breath text-white' : 'bg-breath-soft text-ink'}`}
          data-testid="plan-source"
        >
          {source}
        </p>
        <h3 className="mt-3 text-xl font-extrabold">{explanation.headline}</h3>
        <p className="mt-1 max-w-prose">{explanation.summary}</p>
        <ol className="mt-4 flex flex-col gap-3">
          {explanation.steps.map((s, i) => (
            <li key={i} className="grid grid-cols-[4.5rem_1fr] gap-3">
              <span className="pt-0.5 font-extrabold text-breath">{s.time}</span>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted">{t('planSourceNote', { source })}</p>
      </article>

      <details className="mt-4">
        <summary className="cursor-pointer font-semibold text-breath">
          {t('planSourceRules')}
        </summary>
        <ul className="mt-3 flex flex-col gap-2">
          {plan.items.map((item) => (
            <li
              key={item.id}
              className={`border-l-4 bg-paper py-2 pr-3 pl-3 ${SEVERITY_BAR[item.severity]}`}
            >
              {item.time ? <strong className="mr-2">{item.time}</strong> : null}
              {describeItem(lang, item)}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
