// ============================================================
// src/components/shared/AlertBanner.tsx
// Assertive emergency smog notification banner (WCAG role="alert")
// Per ACCESSIBILITY.md §6 & ARCHITECTURE_PATTERNS.md §2.1
// ============================================================

import { memo } from 'react';
import type { CommunityAlert } from '@/types';

interface AlertBannerProps {
  alerts: CommunityAlert[];
  onDismiss: (id: string) => void;
}

export const AlertBanner = memo(function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="false"
      className="fixed top-18 right-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {alerts.slice(0, 2).map((alert) => (
        <div
          key={alert.id}
          className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all ${
            alert.severity === 'emergency'
              ? 'bg-red-950/90 border-red-500/80 text-red-100 shadow-red-950/50'
              : 'bg-amber-950/90 border-amber-500/80 text-amber-100 shadow-amber-950/50'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg animate-pulse" aria-hidden="true">
                {alert.severity === 'emergency' ? '🚨' : '⚠️'}
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-900/60 border border-red-500/50">
                  {alert.zone}
                </span>
                <h4 className="font-bold text-sm text-white mt-1 leading-snug">{alert.headline}</h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              aria-label={`Dismiss alert for ${alert.zone}`}
              className="text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-200 mt-2 leading-relaxed">{alert.instructions}</p>
        </div>
      ))}
    </div>
  );
});
