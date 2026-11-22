// ============================================================
// src/components/shared/AiSourceBadge.tsx
// Shows whether an answer came from live Gemini, the rules
// fallback, or the fixed emergency safety check.
// ============================================================

import { memo } from 'react';
import type { AiSource } from '@/types';
import { aiSourceLabel } from '@/lib/aiSource';

interface AiSourceBadgeProps {
  source?: AiSource;
  model?: string;
}

const STYLES: Record<AiSource, { icon: string; className: string }> = {
  gemini: { icon: '✨', className: 'bg-[#e6f0fb] text-[#174a78] border-[#a9c8ea]' },
  rules: { icon: '📐', className: 'bg-[#f3f1e8] text-[#5b4a12] border-[#d9cf9f]' },
  safety: { icon: '🚑', className: 'bg-[#fdeceb] text-[#8f1d18] border-[#efb1ac]' },
};

export const AiSourceBadge = memo(function AiSourceBadge({ source, model }: AiSourceBadgeProps) {
  if (!source) return null;
  const style = STYLES[source];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${style.className}`}
    >
      <span aria-hidden="true">{style.icon}</span>
      <span>{aiSourceLabel(source, model)}</span>
    </span>
  );
});
