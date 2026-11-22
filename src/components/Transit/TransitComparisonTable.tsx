// ============================================================
// src/components/Transit/TransitComparisonTable.tsx
// Multi-modal transit comparison table with health risk indicators
// ============================================================

import { memo } from 'react';
import type { TransitRouteComparison } from '@/types';

interface TransitComparisonTableProps {
  modalComparisons: TransitRouteComparison[];
}

export const TransitComparisonTable = memo(function TransitComparisonTable({
  modalComparisons,
}: TransitComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-200 border-collapse">
        <caption className="sr-only">
          Comparison of transit modes by duration, PM2.5 exposure dose, carbon emissions, and health risk
        </caption>
        <thead>
          <tr className="border-b border-slate-700/60 text-slate-400 uppercase text-[10px] tracking-wider">
            <th scope="col" className="py-3 px-3">Transit Mode</th>
            <th scope="col" className="py-3 px-3">Duration</th>
            <th scope="col" className="py-3 px-3">PM2.5 Inhaled Dose</th>
            <th scope="col" className="py-3 px-3">CO₂ Footprint</th>
            <th scope="col" className="py-3 px-3">Health Risk</th>
            <th scope="col" className="py-3 px-3">Clinical Advisory</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {modalComparisons.map((item) => (
            <tr
              key={item.mode}
              className={`hover:bg-slate-800/30 transition-colors ${
                item.isRecommended ? 'bg-emerald-950/20 font-semibold' : ''
              }`}
            >
              <td className="py-3.5 px-3 flex items-center gap-2">
                {item.isRecommended && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Recommended Option" aria-hidden="true" />
                )}
                <span className="text-white">{item.modeLabel}</span>
              </td>
              <td className="py-3.5 px-3 whitespace-nowrap">{item.durationMinutes} mins</td>
              <td className="py-3.5 px-3 font-mono font-bold">
                <span
                  className={
                    item.pm25ExposureDoseUg > 40
                      ? 'text-red-400'
                      : item.pm25ExposureDoseUg > 20
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }
                >
                  {item.pm25ExposureDoseUg} µg
                </span>
              </td>
              <td className="py-3.5 px-3 whitespace-nowrap">{item.co2EmissionsKg} kg</td>
              <td className="py-3.5 px-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    item.healthRiskRating === 'severe'
                      ? 'bg-red-950 text-red-400 border border-red-500/40'
                      : item.healthRiskRating === 'moderate'
                      ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      : item.healthRiskRating === 'low'
                      ? 'bg-sky-950 text-sky-400 border border-sky-500/40'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {item.healthRiskRating}
                </span>
              </td>
              <td className="py-3.5 px-3 text-slate-300 max-w-xs">{item.advisory}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
