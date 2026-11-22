// ============================================================
// src/components/shared/ZoneCard.tsx
// Memoized urban zone status card with AQI badge & inversion indicators
// Per CODING_CONVENTIONS.md §4 & ACCESSIBILITY.md §7
// ============================================================

import { memo } from 'react';
import type { UrbanZone } from '@/types';
import { getAQIColor } from '@/lib/aqiCompute';

interface ZoneCardProps {
  zone: UrbanZone;
  isSelected: boolean;
  onSelect: (zoneId: string) => void;
}

export const ZoneCard = memo(function ZoneCard({
  zone,
  isSelected,
  onSelect,
}: ZoneCardProps) {
  const aqiColor = getAQIColor(zone.aqi);

  return (
    <div
      role="article"
      aria-label={`${zone.zoneName} air quality status`}
      className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
        isSelected
          ? 'bg-slate-900/90 border-emerald-500 shadow-lg shadow-emerald-950/40'
          : 'bg-slate-900/60 border-slate-700/50 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-white text-sm leading-snug">{zone.zoneName}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Primary: <span className="text-slate-200 font-semibold">{zone.dominantPollutant}</span>
          </p>
        </div>
        <div
          className="px-2.5 py-1 rounded-xl text-xs font-black text-white flex items-center gap-1 shadow-inner"
          style={{ backgroundColor: `${aqiColor}25`, borderColor: aqiColor, borderWidth: '1px' }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: aqiColor }} aria-hidden="true" />
          <span>AQI {zone.aqi}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 px-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
        <div>
          <div className="text-slate-400 text-[10px] uppercase">PM2.5</div>
          <div className="font-bold text-slate-100">{zone.pm25} µg</div>
        </div>
        <div>
          <div className="text-slate-400 text-[10px] uppercase">Wind</div>
          <div className="font-bold text-slate-100">{zone.windSpeedKmh} km/h</div>
        </div>
        <div>
          <div className="text-slate-400 text-[10px] uppercase">Temp</div>
          <div className="font-bold text-slate-100">{zone.temperatureC}°C</div>
        </div>
      </div>

      {zone.inversionRisk && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/50">
          <span aria-hidden="true">⚠️</span>
          <span className="font-medium">Atmospheric Inversion Trap</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => onSelect(zone.zoneId)}
        aria-pressed={isSelected}
        className={`w-full py-2 rounded-xl text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
          isSelected
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 hover:text-white'
        }`}
      >
        {isSelected ? 'Active Telemetry' : 'Switch Telemetry'}
      </button>
    </div>
  );
});
