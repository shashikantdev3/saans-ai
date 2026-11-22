// ============================================================
// src/components/IAQ/WindowSchedule.tsx
// Smart Inversion-Aware Window Ventilation Schedule
// ============================================================

import { memo } from 'react';

interface WindowScheduleProps {
  currentAqi: number;
}

export const WindowSchedule = memo(function WindowSchedule({ currentAqi }: WindowScheduleProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 flex flex-col gap-3">
      <h3 className="text-base font-bold text-white flex items-center gap-2">
        <span aria-hidden="true">🪟</span> Smart Inversion-Aware Window Ventilation Schedule
      </h3>
      <p className="text-xs text-slate-400">
        Tailored to current outdoor AQI ({currentAqi}) and meteorological boundary layer dynamics.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-2">
        <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-red-400 block">
            Morning Inversion Lock (6:00 AM – 10:30 AM)
          </span>
          <strong className="text-white text-sm block mt-1">Windows Tightly Latched</strong>
          <p className="text-slate-300 text-[11px] mt-1">
            Cold nocturnal air traps ground-level vehicular soot. Opening windows increases indoor
            PM2.5 by 300%.
          </p>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
            Optimal Flush Window (1:30 PM – 3:30 PM)
          </span>
          <strong className="text-white text-sm block mt-1">
            Crack Opposing Windows (15 mins)
          </strong>
          <p className="text-slate-300 text-[11px] mt-1">
            Solar radiation breaks the surface inversion, maximizing natural vertical air mixing and
            flushing stale CO2.
          </p>
        </div>

        <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
            Evening Rush Trap (5:30 PM – 9:00 PM)
          </span>
          <strong className="text-white text-sm block mt-1">Seal Perimeter & Run HEPA</strong>
          <p className="text-slate-300 text-[11px] mt-1">
            Commuter traffic and cooling surface temperatures cause toxic secondary particulate
            settling.
          </p>
        </div>
      </div>
    </div>
  );
});
