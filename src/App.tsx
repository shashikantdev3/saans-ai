// ============================================================
// src/App.tsx
// Thin AppShell Router and Layout Orchestrator
// Per ARCHITECTURE_PATTERNS.md §2.1 & ACCESSIBILITY.md §2
// ============================================================

import { memo } from 'react';
import { AppContextProvider, useAppContext } from '@/context/AppContext';
import { TabId } from '@/types';
import { Header } from '@/components/Navigation/Header';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { AirTelemetryDashboard } from '@/components/Dashboard/AirTelemetryDashboard';
import { DailyRoutineOptimizer } from '@/components/Routine/DailyRoutineOptimizer';
import { TransitPlanner } from '@/components/Transit/TransitPlanner';
import { IAQCenter } from '@/components/IAQ/IAQCenter';
import { CommunityHub } from '@/components/Community/CommunityHub';

const AppShell = memo(function AppShell() {
  const { activeTab, alerts, dismissAlert, accessibilityMode } = useAppContext();

  return (
    <div
        className={`saans-shell min-h-screen bg-[#eef7f8] text-slate-800 flex flex-col justify-between ${
        accessibilityMode === 'high-contrast' ? 'contrast-125' : ''
      }`}
    >
      {/* 1. Header with Tab Navigation */}
      <Header />

      {/* 2. Global Alert Banner Overlay */}
      <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

      {/* 3. Primary Semantic Landmark Viewport */}
      <main
        id="main-content"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={-1}
        className="max-w-7xl w-full mx-auto px-4 py-6 flex-1 focus:outline-none"
      >
        {activeTab === TabId.Dashboard && <AirTelemetryDashboard />}
        {activeTab === TabId.Routine && <DailyRoutineOptimizer />}
        {activeTab === TabId.Transit && <TransitPlanner />}
        {activeTab === TabId.IAQ && <IAQCenter />}
        {activeTab === TabId.Community && <CommunityHub />}
      </main>

      {/* 4. Footer Landmark */}
      <footer
        aria-label="Application footer"
        className="border-t border-slate-200 bg-[#f7fbfb]/90 py-6 text-xs text-slate-600"
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Saans (साँस)</span>
            <span>•</span>
            <span>WCAG 2.2 Level AA Compliant</span>
            <span>•</span>
            <span>AQI guidance bands</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>AI-assisted daily guidance</span>
            <span>•</span>
            <span>Built for winter-smog routines</span>
          </div>
        </div>
      </footer>
    </div>
  );
});

export default function App() {
  return (
    <AppContextProvider>
      <AppShell />
    </AppContextProvider>
  );
}
