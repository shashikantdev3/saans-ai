// ============================================================
// src/components/Routine/RoutineTimeline.tsx
// Hour-by-hour exposure schedule timeline list
// ============================================================

import { memo } from 'react';
import type { DailyRoutinePlan } from '@/types';

interface RoutineTimelineProps {
  routinePlan: DailyRoutinePlan;
  zoneName: string;
}

export const RoutineTimeline = memo(function RoutineTimeline({
  routinePlan,
  zoneName,
}: RoutineTimelineProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span aria-hidden="true">📅</span> Hour-by-Hour Exposure & Routine Timeline
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Tailored for {routinePlan.persona} in {zoneName}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {routinePlan.hourlySchedule.map((slot) => {
          const isOutdoor = slot.recommendation === 'safe-outdoor';
          const isIndoorOnly = slot.recommendation === 'indoor-only';

          return (
            <div
              key={slot.hour}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isIndoorOnly
                  ? 'bg-red-950/20 border-red-500/30'
                  : isOutdoor
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-800/40 border-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-4 min-w-[130px]">
                <span className="text-base font-black text-white font-mono">{slot.timeLabel}</span>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    isIndoorOnly
                      ? 'bg-red-900 text-red-200 border border-red-500/40'
                      : isOutdoor
                        ? 'bg-emerald-900 text-emerald-200 border border-emerald-500/40'
                        : 'bg-amber-900 text-amber-200 border border-amber-500/40'
                  }`}
                >
                  {slot.recommendation.replace('-', ' ')}
                </span>
              </div>

              <div className="flex-1">
                <h4 className="font-bold text-white text-sm">{slot.activity}</h4>
                <p className="text-xs text-slate-300 mt-0.5">{slot.healthImpactNotes}</p>
              </div>

              <div className="flex items-center gap-4 text-xs min-w-[170px] justify-end">
                <div className="text-right">
                  <div className="text-slate-400 text-[10px]">Predicted AQI</div>
                  <div className="font-bold text-white">{slot.predictedAQI}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[10px]">Inversion Risk</div>
                  <div
                    className={`font-bold capitalize ${
                      slot.inversionLikelihood === 'high' ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {slot.inversionLikelihood}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
