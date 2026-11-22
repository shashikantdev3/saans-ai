'use client';

import type { Place } from '@/lib/impact/dose';
import { FACTORS, type FactorKey } from '@/lib/impact/factors';
import type { Plan } from '@/lib/plan/buildPlan';
import { describeAlternative, describeHack } from '@/lib/plan/describe';
import { useI18n } from '../ui/I18n';

const PLACES: Place[] = ['home', 'work', 'commute', 'outdoor'];

function DoseBars({ plan }: { plan: Plan }) {
  const { t } = useI18n();
  const rows = [
    {
      label: t('baseline'),
      total: plan.dose.baselineUg,
      parts: plan.dose.baselineByPlace,
      tone: 'fill-[#8f877a]',
    },
    {
      label: t('withPlan'),
      total: plan.dose.planUg,
      parts: plan.dose.planByPlace,
      tone: 'fill-[#1f5f7a]',
    },
  ];
  const max = Math.max(1, plan.dose.baselineUg);
  return (
    <div className="mt-4 flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.label}>
          <p className="flex justify-between text-sm">
            <span className="font-semibold">{r.label}</span>
            <span>{r.total} µg</span>
          </p>
          <svg viewBox="0 0 100 6" className="mt-1 h-4 w-full" aria-hidden="true">
            <rect x="0" y="0" width="100" height="6" className="fill-[#e3eaef]" rx="1" />
            <rect x="0" y="0" width={(r.total / max) * 100} height="6" className={r.tone} rx="1" />
          </svg>
          <p className="mt-1 text-xs text-muted">
            {PLACES.filter((p) => r.parts[p] > 0)
              .map((p) => `${t(`place_${p}`)} ${r.parts[p]} µg`)
              .join(' | ')}
          </p>
        </div>
      ))}
    </div>
  );
}

function Sources({ keys }: { keys: FactorKey[] }) {
  const { t } = useI18n();
  if (keys.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
      {keys.map((k) => (
        <li key={k}>
          {k}: {FACTORS[k].value} {FACTORS[k].unit}. {FACTORS[k].source}.{' '}
          {t(`confidence_${FACTORS[k].confidence}`)}.
        </li>
      ))}
    </ul>
  );
}

export function ImpactPanel({ plan }: { plan: Plan }) {
  const { t, lang } = useI18n();
  const alt = describeAlternative(lang, plan.alternative);
  const altKeys: FactorKey[] =
    plan.alternative.kind === 'commute'
      ? ['carPetrolPkm', 'carOccupancy', 'metroPkm']
      : plan.alternative.kind === 'generator'
        ? ['dieselCo2PerLitre', 'dgLitresPerKwh', 'gridCo2PerKwh', 'inverterRoundTrip']
        : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-ink p-5 text-white">
        <p className="text-2xl font-extrabold sm:text-3xl" data-testid="dose-headline">
          {t('doseHeadline', { percent: plan.dose.percentCut })}
        </p>
        <p className="mt-2 text-[#dcebf2]">
          {t('doseDetail', { baseline: plan.dose.baselineUg, plan: plan.dose.planUg })}
        </p>
      </div>
      <div>
        <h3 className="font-semibold">{t('doseByPlace')}</h3>
        <DoseBars plan={plan} />
        <details className="mt-3">
          <summary className="cursor-pointer font-semibold text-breath">
            {t('howCalculated')}
          </summary>
          <div className="mt-2 rounded-lg bg-paper p-3 text-sm">
            <p>{t('doseFormula')}</p>
            <p className="mt-1 font-semibold">{t('indoorFormula')}</p>
            <p className="mt-1">{t('doseAssumptions')}</p>
            <Sources
              keys={[
                'penetration',
                'deposition',
                'airExchangeOpen',
                'airExchangeClosed',
                'breathingRest',
                'breathingModerate',
                'inVehicleClosed',
                'purifierCadr',
              ]}
            />
          </div>
        </details>
      </div>

      <div>
        <h3 className="text-xl font-extrabold">{t('hacksHeading')}</h3>
        <ul className="mt-3 flex flex-col gap-3">
          {plan.hacks.map((hack) => {
            const { title, detail } = describeHack(lang, hack);
            return (
              <li key={hack.id} className="rounded-xl border border-line bg-paper p-4">
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold">{title}</span>
                  {hack.percent !== undefined ? (
                    <span className="text-lg font-extrabold text-breath">-{hack.percent}%</span>
                  ) : null}
                </p>
                <p className="mt-1">{detail}</p>
                <p className="mt-1 text-xs text-muted">{t(`confidence_${hack.confidence}`)}</p>
                <details>
                  <summary className="cursor-pointer text-sm text-breath">{t('sources')}</summary>
                  <Sources keys={hack.factors} />
                </details>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl border-2 border-breath bg-breath-soft p-5">
        <h3 className="font-semibold">{t('altHeading')}</h3>
        <p className="mt-1 text-xl font-extrabold">{alt.title}</p>
        <p className="mt-1">{alt.detail}</p>
        <Sources keys={altKeys} />
      </div>
    </div>
  );
}
