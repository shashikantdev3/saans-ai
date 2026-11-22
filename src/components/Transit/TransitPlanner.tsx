// ============================================================
// src/components/Transit/TransitPlanner.tsx
// Multi-modal route exposure calculator & Dijkstra clean-corridor pathfinder
// Per PROBLEM_ALIGNMENT.md §1.3 & CODING_CONVENTIONS.md §4
// ============================================================

import { memo } from 'react';
import { useExposureRouting } from '@/hooks/useExposureRouting';
import { useAppContext } from '@/context/AppContext';
import { TransitComparisonTable } from './TransitComparisonTable';

export const TransitPlanner = memo(function TransitPlanner() {
  const { selectedZone } = useAppContext();
  const {
    nodes,
    originId,
    destinationId,
    setOrigin,
    setDestination,
    lowestExposureResult,
    pathNodes,
    routeDistanceKm,
    modalComparisons,
  } = useExposureRouting();

  return (
    <section aria-label="Low-Emission Commute & Transit Planner" className="flex flex-col gap-6 fade-in">
      {/* Route Pathfinder Selector */}
      <div className="bg-slate-900/70 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-md flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span aria-hidden="true">🚇</span> Low-Exposure Commute & Transit Path Optimizer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dijkstra-powered algorithm identifying subterranean and clean-air corridors to bypass surface smog hotspots.
          </p>
        </div>

        {/* Origin / Destination Waypoints */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="origin-select" className="text-xs font-semibold text-slate-300">
              Commute Origin Waypoint:
            </label>
            <select
              id="origin-select"
              value={originId}
              onChange={(e) => setOrigin(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} {node.isCleanCorridor ? '(Clean Corridor)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="destination-select" className="text-xs font-semibold text-slate-300">
              Destination Waypoint:
            </label>
            <select
              id="destination-select"
              value={destinationId}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lowest Exposure Path Breadcrumbs */}
        {lowestExposureResult && (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Optimal Clean-Air Trajectory (Dijkstra Min-Exposure Cost: {lowestExposureResult.totalExposure})
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Distance: <strong className="text-white">{routeDistanceKm} km</strong>
              </span>
            </div>

            <nav aria-label="Lowest pollution route steps">
              <ol className="flex flex-wrap items-center gap-2 text-xs">
                {pathNodes.map((n, idx) => (
                  <li key={n.id} className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 ${
                        n.isMetro
                          ? 'bg-sky-950/80 text-sky-300 border-sky-500/50'
                          : n.isCleanCorridor
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <span>{n.isMetro ? '🚇' : n.isCleanCorridor ? '🌲' : '📍'}</span>
                      <span>{n.name}</span>
                    </span>
                    {idx < pathNodes.length - 1 && (
                      <span className="text-slate-500 font-bold" aria-hidden="true">➔</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        )}
      </div>

      {/* Multi-Modal Comparison Table */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span aria-hidden="true">⚖️</span> Multi-Modal Exposure & Carbon Comparison
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated against current ambient air quality in {selectedZone.zoneName} (AQI {selectedZone.aqi})
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Trip Length: <strong className="text-slate-200">{routeDistanceKm} km</strong>
          </span>
        </div>

        <TransitComparisonTable modalComparisons={modalComparisons} />
      </div>
    </section>
  );
});
