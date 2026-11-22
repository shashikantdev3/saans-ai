// ============================================================
// src/components/Dashboard/SmogHeatmap.tsx
// Pure SVG Spatial Smog Heatmap with WCAG SC 1.1.1 Twin Representation
// ============================================================

import { memo } from 'react';
import type { UrbanZone } from '@/types';
import { getAQIColor } from '@/lib/aqiCompute';

interface SmogHeatmapProps {
  zones: UrbanZone[];
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
}

const NODE_COORDINATES = [
  { cx: 300, cy: 160 }, // Central
  { cx: 160, cy: 75 },  // North Industrial
  { cx: 450, cy: 90 },  // Residential
  { cx: 460, cy: 235 }, // Riverside
  { cx: 170, cy: 230 }, // Transit Hub
];

export const SmogHeatmap = memo(function SmogHeatmap({
  zones,
  selectedZoneId,
  onSelectZone,
}: SmogHeatmapProps) {
  return (
    <div className="lg:col-span-7 bg-slate-900/60 rounded-3xl border border-slate-700/50 p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span aria-hidden="true">🗺️</span> Urban Smog Heatmap & Dispersion Grid
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time spatial visualization across municipal telemetry monitoring nodes
        </p>
      </div>

      {/* WCAG SC 1.1.1 Twin Representation Rule: Textual equivalent */}
      <ul className="sr-only" aria-label="Urban air quality heatmap description">
        {zones.map((zone) => (
          <li key={zone.zoneId}>
            Sector {zone.zoneName}: AQI is {zone.aqi}, Category {zone.category},
            PM2.5 is {zone.pm25} micrograms per cubic meter,
            dominant pollutant is {zone.dominantPollutant},
            inversion risk is {zone.inversionRisk ? 'Active hazard' : 'Normal atmospheric mixing'}.
          </li>
        ))}
      </ul>

      {/* Native SVG Heatmap Canvas (Zero external heavy chart libraries) */}
      <div className="w-full bg-[#020817] rounded-2xl border border-slate-800 p-4 overflow-hidden relative">
        <svg
          viewBox="0 0 600 320"
          aria-hidden="true"
          role="presentation"
          className="w-full h-auto max-h-[340px]"
        >
          <defs>
            <linearGradient id="smogGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="600" height="320" fill="url(#smogGrad)" rx="12" />
          {[60, 120, 180, 240].map((y) => (
            <line key={`grid-h-${y}`} x1="20" y1={y} x2="580" y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
          ))}
          {[120, 240, 360, 480].map((x) => (
            <line key={`grid-v-${x}`} x1={x} y1="20" x2={x} y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
          ))}

          {/* Wind Vectors */}
          <g stroke="#64748b" strokeWidth="1" opacity="0.4">
            <path d="M 50 40 Q 150 20 250 50 T 450 40" fill="none" strokeDasharray="4 4" />
            <path d="M 100 160 Q 250 140 380 170 T 550 150" fill="none" strokeDasharray="4 4" />
            <path d="M 80 270 Q 220 250 360 280 T 520 260" fill="none" strokeDasharray="4 4" />
          </g>

          {/* Zone Nodes */}
          {zones.map((zone, idx) => {
            const pos = NODE_COORDINATES[idx] || { cx: 200 + idx * 60, cy: 150 };
            const color = getAQIColor(zone.aqi);
            const isSelected = zone.zoneId === selectedZoneId;

            return (
              <g key={zone.zoneId} className="cursor-pointer" onClick={() => onSelectZone(zone.zoneId)}>
                {zone.aqi > 200 && (
                  <circle cx={pos.cx} cy={pos.cy} r="34" fill="none" stroke={color} strokeWidth="1.5" opacity="0.3" className="animate-ping" />
                )}
                {isSelected && (
                  <circle cx={pos.cx} cy={pos.cy} r="30" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 2" />
                )}
                <circle cx={pos.cx} cy={pos.cy} r="22" fill="#0f172a" stroke={color} strokeWidth="3" />
                <text x={pos.cx} y={pos.cy + 4} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">
                  {zone.aqi}
                </text>
                <text x={pos.cx} y={pos.cy + 36} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="600">
                  {zone.zoneName.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <span>AQI guidance bands:</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Good (0-50)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate (51-100)
          </span>
          <span className="flex items-center gap-1 text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> Unhealthy (101-200)
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> Severe (201+)
          </span>
        </div>
      </div>
    </div>
  );
});
