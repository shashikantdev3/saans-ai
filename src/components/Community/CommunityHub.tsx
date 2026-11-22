// ============================================================
// src/components/Community/CommunityHub.tsx
// Neighborhood collective pledges, live emission offsets, and multilingual advisories
// Per PROBLEM_ALIGNMENT.md §1.5 & ACCESSIBILITY.md §7
// ============================================================

import { memo, useState, useMemo, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { calculateCommunityOffset } from '@/lib/aqiCompute';
import { apiService } from '@/services/apiService';
import { TRANSLATIONS } from '@/lib/constants';
import { AiSourceBadge } from '@/components/shared/AiSourceBadge';
import type { AdvisoryResponse } from '@/types';
import { PledgeCard } from './PledgeCard';

export const CommunityHub = memo(function CommunityHub() {
  const { pledges, togglePledge, alerts, dismissAlert, selectedZone, language } = useAppContext();

  const [aiAdvisory, setAiAdvisory] = useState<AdvisoryResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const collectiveMetrics = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of pledges) {
      counts[p.category] = p.currentParticipants;
    }
    return calculateCommunityOffset(counts);
  }, [pledges]);

  const handleGenerateAdvisory = useCallback(async () => {
    setIsGenerating(true);
    try {
      setAiAdvisory(await apiService.generateEmergencyAdvisory(selectedZone, language));
    } catch {
      setAiAdvisory({
        source: 'rules',
        advisory: `URGENT NOTICE for ${selectedZone.zoneName}: AQI is ${selectedZone.aqi}. Please run indoor air filtration, seal doors, and check on vulnerable neighbours.`,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedZone, language]);

  return (
    <section
      aria-label="Community Action and Collective Impact Hub"
      className="flex flex-col gap-6 fade-in"
    >
      {/* Top Collective Impact KPI Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900/80 border border-emerald-500/40 rounded-3xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
            Collective Neighborhood Resilience Impact
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            Community Smog Abatement Dashboard
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            When neighbors coordinate emission curbs—eliminating backyard burning, coordinating
            carpools, and wet-sweeping streets—local PM2.5 levels decrease by up to 28%.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-900/80 border border-emerald-500/40 rounded-2xl p-4 text-center min-w-[140px]">
            <span className="text-[10px] text-slate-400 uppercase font-bold">CO₂ Prevented</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">
              {collectiveMetrics.totalCo2Kg} <span className="text-xs text-slate-400">kg</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-sky-500/40 rounded-2xl p-4 text-center min-w-[140px]">
            <span className="text-[10px] text-slate-400 uppercase font-bold">PM2.5 Averted</span>
            <div className="text-3xl font-black text-sky-400 mt-1">
              {collectiveMetrics.totalPm25Grams} <span className="text-xs text-slate-400">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Smog Hazard Advisories & AI Generator */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span aria-hidden="true">📢</span> Multilingual Emergency Smog Advisories
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live automated broadcast generation for neighborhood associations and school boards.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateAdvisory}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {isGenerating ? 'Synthesizing Broadcast…' : 'Generate Localized Advisory'}
          </button>
        </div>

        {aiAdvisory && (
          <div
            role="region"
            aria-label="Generated community advisory"
            className={`p-4 bg-slate-800/80 border border-slate-700 rounded-2xl text-slate-100 text-sm leading-relaxed ${
              language === 'ar' ? 'font-arabic text-right' : ''
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
              <span aria-hidden="true">📡</span>
              <span>Official Air Resilience Broadcast ({language.toUpperCase()}):</span>
              <AiSourceBadge source={aiAdvisory.source} model={aiAdvisory.model} />
            </div>
            <p>{aiAdvisory.advisory}</p>
          </div>
        )}

        {/* Community AQI Alert Banners */}
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              role="alert"
              aria-live="assertive"
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                alert.severity === 'emergency'
                  ? 'bg-red-950/30 border-red-500/50 text-red-200'
                  : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl" aria-hidden="true">
                  {alert.severity === 'emergency' ? '🚨' : '⚠️'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                      {alert.zone}
                    </span>
                    <h4 className="font-bold text-sm text-white">{alert.headline}</h4>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{alert.instructions}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismissAlert(alert.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 self-end sm:self-center focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Community Action Pledges Grid */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span aria-hidden="true">🤝</span> Neighborhood Emission Reduction Pledges
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Join collective community pacts to eliminate localized winter pollution hotspots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pledges.map((pledge) => (
            <PledgeCard
              key={pledge.id}
              pledge={pledge}
              onToggle={togglePledge}
              pledgedLabel={t.pledged || 'Pledged Active'}
              pledgeNowLabel={t.pledgeNow || 'Take the Pledge'}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
