'use client';

import type { AqiBand } from '@/lib/aqi/bands';
import type { AirSummary } from '@/lib/data/summary';
import type { PollutantKey } from '@/lib/data/types';
import { BandBadge } from '../ui/BandBadge';
import { useI18n } from '../ui/I18n';

/** Haze density per band: the hero literally gets murkier as the air gets worse. */
const HAZE: Record<AqiBand, string> = {
  good: 'opacity-0',
  satisfactory: 'opacity-10',
  moderate: 'opacity-25',
  poor: 'opacity-40',
  very_poor: 'opacity-55',
  severe: 'opacity-70',
};

const POLLUTANTS: Exclude<PollutantKey, 'co'>[] = ['pm2_5', 'pm10', 'no2', 'o3', 'so2'];

export function AirNow({ place, air }: { place: string; air: AirSummary }) {
  const { t } = useI18n();
  const band = air.aqi?.band.band ?? air.forecast[0]?.band ?? 'moderate';
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#cfe6f3] to-[#f4f8fa] p-6 sm:p-8">
        <div aria-hidden="true" className={`haze absolute inset-0 bg-haze ${HAZE[band]}`} />
        <div className="relative">
          <p className="text-lg font-semibold">{t('airHeading', { place })}</p>
          {air.aqi ? (
            <>
              <p className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
                <span
                  className="text-7xl leading-none font-extrabold tracking-tighter sm:text-8xl"
                  data-testid="indian-aqi"
                >
                  {air.aqi.aqi}
                </span>
                <span className="pb-2">
                  <span className="block text-sm font-semibold">{t('indianAqi')}</span>
                  <BandBadge band={air.aqi.band.band} className="mt-1" />
                </span>
              </p>
              <p className="mt-3 max-w-prose text-lg">{t(`health_${air.aqi.band.band}`)}</p>
              <p className="mt-1 text-sm">
                {t('dominant', { pollutant: t(`pollutant_${air.aqi.dominant}`) })}
                {air.usAqi !== null ? ` | ${t('usAqi')}: ${air.usAqi}` : ''}
              </p>
            </>
          ) : (
            <p className="mt-2">{t('aqiUnavailable')}</p>
          )}
        </div>
      </div>

      <h3 className="mt-6 font-semibold">{t('pollutantsHeading')}</h3>
      <dl className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {POLLUTANTS.map((p) => (
          <div key={p} className="rounded-lg border border-line bg-paper px-3 py-2">
            <dt className="text-sm text-muted">{t(`pollutant_${p}`)}</dt>
            <dd className="text-xl font-semibold">{air.current[p] ?? '-'}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted">
        {t('aqiNote')} {t('usAqiNote')} {t('dataLabel')}
      </p>
    </div>
  );
}
