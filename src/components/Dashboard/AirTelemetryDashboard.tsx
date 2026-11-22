// ============================================================
// src/components/Dashboard/AirTelemetryDashboard.tsx
// Hyperlocal AQI telemetry, custom SVG heatmap, and pollutant sparklines
// Per ACCESSIBILITY.md §3 (Twin Representation) & EFFICIENCY.md §3
// ============================================================

import { memo } from 'react';
import { useAirAnalytics } from '@/hooks/useAirAnalytics';
import { Sparkline } from '@/components/shared/Sparkline';
import { ZoneCard } from '@/components/shared/ZoneCard';
import { SmogHeatmap } from './SmogHeatmap';

export const AirTelemetryDashboard = memo(function AirTelemetryDashboard() {
  const {
    zones,
    currentZone,
    selectedZoneId,
    setSelectedZoneId,
    aqiCategory,
    aqiColor,
    inversionStatus,
    pollutantBreakdown,
    simulateSmogSpike,
    simulateCleanDispersion,
  } = useAirAnalytics();

  return (
    <section
      aria-label="Hyperlocal AQI Telemetry Dashboard"
      className="flex flex-col gap-6 fade-in"
    >
      {/* Top Hero KPI Banner */}
      <div className="bg-slate-900/70 border border-slate-700/50 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
        <div
          className="absolute -right-24 -top-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: aqiColor }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Selected Hyperlocal Sector
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span className="text-xs text-slate-300 font-semibold">{currentZone.zoneName}</span>
            </div>

            <div className="flex items-baseline gap-4 mt-2">
              <h1
                className="text-5xl font-black text-white tracking-tight"
                style={{ color: aqiColor }}
              >
                {currentZone.aqi}
              </h1>
              <div>
                <span className="text-lg font-bold text-white block leading-snug">
                  {aqiCategory}
                </span>
                <span className="text-xs text-slate-400">
                  Dominant Pollutant:{' '}
                  <strong className="text-slate-200">{currentZone.dominantPollutant}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Meteorological & Inversion Risk Indicator */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 min-w-[200px]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Boundary Layer</span>
                <span className="text-sm" aria-hidden="true">
                  🌡️
                </span>
              </div>
              <div className="text-base font-bold text-white mt-1">
                {currentZone.temperatureC}°C{' '}
                <span className="text-xs text-slate-400 font-normal">
                  / {currentZone.humidityPercent}% RH
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Wind: <strong className="text-slate-200">{currentZone.windSpeedKmh} km/h</strong>
              </div>
            </div>

            <div
              className={`rounded-2xl p-4 min-w-[230px] border transition-all ${
                inversionStatus.isInversion
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">Inversion Risk</span>
                <span aria-hidden="true">{inversionStatus.isInversion ? '⚠️' : '✅'}</span>
              </div>
              <div className="text-sm font-black mt-1 capitalize">
                {inversionStatus.severity} Risk
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
                {inversionStatus.rationale}
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Simulation Controls */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Telemetry Simulation Engine:</span>
            <button
              type="button"
              onClick={simulateSmogSpike}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-900/60 border border-red-500/50 text-red-200 hover:bg-red-800/80 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              ⚡ Simulate Winter Smog Spike (+45 AQI)
            </button>
            <button
              type="button"
              onClick={simulateCleanDispersion}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-800/80 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              🍃 Simulate Solar Wind Cleansing (-50 AQI)
            </button>
          </div>
          <span className="text-[11px] text-slate-400">
            Updated: {new Date(currentZone.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Grid: SVG Heatmap (Left) & Pollutant Sparklines (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SmogHeatmap
          zones={zones}
          selectedZoneId={selectedZoneId}
          onSelectZone={setSelectedZoneId}
        />

        {/* Pollutant Sparklines Panel */}
        <div className="lg:col-span-5 bg-slate-900/60 rounded-3xl border border-slate-700/50 p-6 flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span aria-hidden="true">📈</span> Pollutant Trend Sparklines
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-parameter gas and particle telemetry ({currentZone.zoneName})
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {pollutantBreakdown.map((pollutant) => (
              <div
                key={pollutant.type}
                className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-[90px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">{pollutant.type}</span>
                    <span className="text-[10px] text-slate-400">({pollutant.unit})</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 mt-0.5">
                    {pollutant.current}{' '}
                    <span className="text-[10px] text-slate-400">/ max {pollutant.threshold}</span>
                  </div>
                </div>

                <div className="flex-1 flex justify-center">
                  <Sparkline
                    values={pollutant.history}
                    color={pollutant.current > pollutant.threshold ? '#ef4444' : '#10b981'}
                    width={130}
                    height={32}
                    label={`${pollutant.type} 7-hour trend`}
                  />
                </div>

                <div className="text-right min-w-[70px]">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pollutant.status === 'Hazardous' || pollutant.status === 'Critical'
                        ? 'bg-red-950 text-red-400 border border-red-500/40'
                        : pollutant.status === 'Unhealthy' || pollutant.status === 'Moderate'
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {pollutant.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
            💡 <strong>Winter Smog Insight:</strong> Secondary PM2.5 formation surges when ambient
            humidity exceeds 75% in the presence of vehicle-emitted NO2 and sulfur precursors.
          </div>
        </div>
      </div>

      {/* Municipal Zone Selector Cards */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span aria-hidden="true">🏙️</span> Monitored Urban Sectors ({zones.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {zones.map((zone) => (
            <ZoneCard
              key={zone.zoneId}
              zone={zone}
              isSelected={zone.zoneId === selectedZoneId}
              onSelect={setSelectedZoneId}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
