// ============================================================
// src/components/Community/PledgeCard.tsx
// Community pledge card with participation progress bar
// ============================================================

import { memo } from 'react';
import type { CommunityPledge } from '@/types';

interface PledgeCardProps {
  pledge: CommunityPledge;
  onToggle: (id: string) => void;
  pledgedLabel: string;
  pledgeNowLabel: string;
}

export const PledgeCard = memo(function PledgeCard({
  pledge,
  onToggle,
  pledgedLabel,
  pledgeNowLabel,
}: PledgeCardProps) {
  const progress = Math.min(
    100,
    Math.round((pledge.currentParticipants / pledge.targetParticipants) * 100),
  );

  return (
    <div
      className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 transition-all ${
        pledge.userPledged
          ? 'bg-slate-900/80 border-emerald-500/70 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/40'
          : 'bg-slate-900/60 border-slate-700/50'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-bold text-white text-base leading-snug">{pledge.title}</h4>
          {pledge.userPledged && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/50">
              {pledgedLabel}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-300 mt-2 leading-relaxed">{pledge.impactDescription}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span>
            Participation: <strong className="text-white">{pledge.currentParticipants}</strong> /{' '}
            {pledge.targetParticipants} households
          </span>
          <span className="font-bold text-emerald-400">{progress}%</span>
        </div>

        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={pledge.currentParticipants}
            aria-valuemin={0}
            aria-valuemax={pledge.targetParticipants}
            aria-label={`${pledge.title} progress`}
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-1">
          <span className="text-xs text-slate-400">
            Est. Relief:{' '}
            <strong className="text-slate-200">
              ~{pledge.estimatedEmissionReductionKg} kg CO₂ / wk
            </strong>
          </span>

          <button
            type="button"
            onClick={() => onToggle(pledge.id)}
            aria-pressed={pledge.userPledged}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              pledge.userPledged
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/40'
            }`}
          >
            {pledge.userPledged ? 'Cancel Pledge' : pledgeNowLabel}
          </button>
        </div>
      </div>
    </div>
  );
});
