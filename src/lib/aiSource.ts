// ============================================================
// src/lib/aiSource.ts
// Human-readable labels for where an AI-facing answer came from
// ============================================================

import type { AiSource } from '@/types';

export function aiSourceLabel(source: AiSource, model?: string): string {
  if (source === 'gemini') return `Live Gemini answer${model ? ` · ${model}` : ''}`;
  if (source === 'safety') return 'Safety check · fixed emergency guidance, no AI';
  return 'Offline rules · Gemini unavailable';
}
