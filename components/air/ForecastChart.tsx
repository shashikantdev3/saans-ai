'use client';

import { memo } from 'react';
import { BANDS } from '@/lib/aqi/bands';
import type { ForecastPoint } from '@/lib/data/summary';
import { useI18n } from '../ui/I18n';

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const compass = (deg: number) => COMPASS[Math.round(deg / 45) % 8] ?? 'N';

const W = 720;
const H = 200;
const TOP = 12;
const BOTTOM = 26;
const fill = (band: ForecastPoint['band']) => BANDS.find((b) => b.band === band)?.bg ?? '#999';

/** Hand-drawn SVG bars: no chart library, so it stays light on low-end phones. */
export const ForecastChart = memo(function ForecastChart({ points }: { points: ForecastPoint[] }) {
  const { t } = useI18n();
  if (points.length === 0) return null;
  const max = Math.max(60, ...points.map((p) => p.pm25));
  const step = W / points.length;
  const plotH = H - TOP - BOTTOM;
  const next24 = points.slice(0, 24);
  const winds = next24.map((p) => p.windSpeed).filter((v): v is number => v !== null);
  const avgWind = winds.length ? Math.round(winds.reduce((a, b) => a + b, 0) / winds.length) : null;
  const first = points[0];

  return (
    <div>
      <h3 className="font-semibold">{t('forecastHeading')}</h3>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 h-auto w-full rounded-lg border border-line bg-paper"
        role="img"
        aria-labelledby="forecast-title forecast-desc"
      >
        <title id="forecast-title">{t('forecastHeading')}</title>
        <desc id="forecast-desc">
          {points
            .filter((_, i) => i % 6 === 0)
            .map(
              (p) =>
                `${p.time.slice(5, 16).replace('T', ' ')}: ${p.pm25} µg/m³, ${t(`band_${p.band}`)}`,
            )
            .join('; ')}
        </desc>
        {points.map((p, i) => {
          const h = Math.max(2, (p.pm25 / max) * plotH);
          return (
            <rect
              key={p.time}
              x={i * step + 1}
              y={TOP + plotH - h}
              width={Math.max(1, step - 2)}
              height={h}
              fill={fill(p.band)}
            />
          );
        })}
        {points.map((p, i) =>
          i % 12 === 0 ? (
            <text key={`l-${p.time}`} x={i * step + 2} y={H - 8} fontSize="13" fill="#4d5f6c">
              {p.time.slice(8, 10)}/{p.time.slice(5, 7)} {p.time.slice(11, 16)}
            </text>
          ) : null,
        )}
      </svg>
      {avgWind !== null && first?.windDirection !== null && first?.windDirection !== undefined ? (
        <p className="mt-2 text-sm text-muted">
          {t('wind')}: {t('windValue', { speed: avgWind, dir: compass(first.windDirection) })}.{' '}
          {t('calmWindNote')}
        </p>
      ) : null}
      <details className="mt-2">
        <summary className="cursor-pointer font-semibold text-breath">{t('forecastTable')}</summary>
        <div
          className="mt-2 max-h-80 overflow-auto rounded-lg border border-line bg-paper"
          tabIndex={0}
          role="region"
          aria-label={t('forecastHeading')}
        >
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-breath-soft">
              <tr>
                <th scope="col" className="px-3 py-2">
                  {t('time')}
                </th>
                <th scope="col" className="px-3 py-2">
                  PM2.5
                </th>
                <th scope="col" className="px-3 py-2">
                  AQI
                </th>
                <th scope="col" className="px-3 py-2">
                  {t('wind')}
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.time} className="border-t border-line">
                  <td className="px-3 py-1">{p.time.replace('T', ' ')}</td>
                  <td className="px-3 py-1">{p.pm25}</td>
                  <td className="px-3 py-1">{t(`band_${p.band}`)}</td>
                  <td className="px-3 py-1">{p.windSpeed ?? '-'} km/h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
});
