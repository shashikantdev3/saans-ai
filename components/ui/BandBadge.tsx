'use client';

import { memo } from 'react';
import type { AqiBand } from '@/lib/aqi/bands';
import { useI18n } from './I18n';

/** Literal class strings so Tailwind can see them. Colours always travel with a text label. */
export const BAND_CLASSES: Record<AqiBand, string> = {
  good: 'bg-[#1b7f3b] text-white',
  satisfactory: 'bg-[#9ccc65] text-[#1a2e05]',
  moderate: 'bg-[#ffeb3b] text-[#3a3000]',
  poor: 'bg-[#ff9800] text-[#2b1600]',
  very_poor: 'bg-[#d32f2f] text-white',
  severe: 'bg-[#7b1f1f] text-white',
};

export const BandBadge = memo(function BandBadge({
  band,
  className = '',
}: {
  band: AqiBand;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-block rounded-full px-3 py-0.5 text-sm font-semibold ${BAND_CLASSES[band]} ${className}`}
    >
      {t(`band_${band}`)}
    </span>
  );
});
