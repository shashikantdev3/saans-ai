// ============================================================
// src/components/IAQ/DIYHackGrid.tsx
// Low-Cost & DIY Indoor Air Purification Hack Cards
// ============================================================

import { memo } from 'react';
import { DIY_HACKS } from '@/lib/constants';

export const DIYHackGrid = memo(function DIYHackGrid() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span aria-hidden="true">💡</span> Low-Cost & DIY Indoor Air Purification Hacks
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Peer-reviewed open-source solutions proven to deliver high CADR at minimal household expense.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DIY_HACKS.map((hack) => (
          <div
            key={hack.id}
            className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 flex flex-col justify-between gap-3 hover:border-slate-600 transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-white text-sm">{hack.title}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  {hack.costRating}
                </span>
              </div>
              <div className="text-xs text-emerald-400 font-semibold mt-1">
                Clean Air Output: {hack.cadrDelivery}
              </div>
              <div className="text-xs text-slate-300 mt-2">
                <strong>Materials:</strong> {hack.materials}
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {hack.instructions}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-sky-400 font-medium">
              🎯 {hack.efficiencyBonus}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
