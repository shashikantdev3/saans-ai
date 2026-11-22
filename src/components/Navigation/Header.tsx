// ============================================================
// src/components/Navigation/Header.tsx
// Header shell, live status, language selector, and accessible tablist
// Per DESIGN_SYSTEM.md §4 & ACCESSIBILITY.md §2
// ============================================================

import { memo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { TabId, Language, AccessibilityMode } from '@/types';
import { TRANSLATIONS } from '@/lib/constants';
import { getAQIColor } from '@/lib/aqiCompute';

export const Header = memo(function Header() {
  const {
    activeTab,
    setActiveTab,
    selectedZone,
    language,
    setLanguage,
    accessibilityMode,
    setAccessibilityMode,
  } = useAppContext();

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const aqiColor = getAQIColor(selectedZone.aqi);

  const tabs = [
    { id: TabId.Dashboard, label: t.tabDashboard || 'Air Telemetry', icon: '📡' },
    { id: TabId.Routine, label: t.tabRoutine || 'Routine Optimizer', icon: '⏰' },
    { id: TabId.Transit, label: t.tabTransit || 'Low-Emission Transit', icon: '🚇' },
    { id: TabId.IAQ, label: t.tabIAQ || 'Indoor Air & Hacks', icon: '🌿' },
    { id: TabId.Community, label: t.tabCommunity || 'Community Action', icon: '🤝' },
  ];

  return (
    <header
      aria-label="Saans application header"
      className="sticky top-0 z-40 bg-[#f7fbfb]/95 backdrop-blur-md border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Telemetry Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#176b7e] to-[#235164] flex items-center justify-center text-xl shadow-lg shadow-cyan-950/20">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-800 tracking-tight">
                Saans (साँस)
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                  aria-hidden="true"
                />
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Breathe easier through winter smog.
            </p>
          </div>
        </div>

        {/* Selected Zone Quick Telemetry & Control Badges */}
        <div className="flex items-center gap-3">
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-900/80 text-xs"
            style={{ borderColor: `${aqiColor}60` }}
          >
            <span className="text-slate-400">{selectedZone.zoneName}:</span>
            <span className="font-black text-slate-800" style={{ color: aqiColor }}>
              AQI {selectedZone.aqi}
            </span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
            <label htmlFor="language-select" className="sr-only">
              Select Language
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs text-slate-200 font-semibold px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value={Language.English} className="bg-slate-900 text-white">
                English (EN)
              </option>
              <option value={Language.Hindi} className="bg-slate-900 text-white">
                हिन्दी (HI)
              </option>
              <option value={Language.Arabic} className="bg-slate-900 text-white">
                العربية (AR)
              </option>
              <option value={Language.Spanish} className="bg-slate-900 text-white">
                Español (ES)
              </option>
            </select>
          </div>

          {/* Accessibility Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
            <label htmlFor="a11y-select" className="sr-only">
              Accessibility Mode
            </label>
            <select
              id="a11y-select"
              value={accessibilityMode}
              onChange={(e) => setAccessibilityMode(e.target.value as AccessibilityMode)}
              className="bg-transparent text-xs text-slate-300 font-medium px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value={AccessibilityMode.Standard} className="bg-slate-900 text-white">
                Default Mode
              </option>
              <option value={AccessibilityMode.HighContrast} className="bg-slate-900 text-white">
                High Contrast
              </option>
              <option value={AccessibilityMode.ReducedMotion} className="bg-slate-900 text-white">
                Reduced Motion
              </option>
              <option value={AccessibilityMode.ScreenReader} className="bg-slate-900 text-white">
                Screen Reader
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Accessible Tab Strip */}
      <nav aria-label="Main application tabs" className="max-w-7xl mx-auto px-4">
        <div
          role="tablist"
          aria-label="Main navigation panels"
          className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset ${
                  isActive
                    ? 'text-slate-800 bg-white border-b-2 border-[#176b7e] shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/70'
                }`}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
});
