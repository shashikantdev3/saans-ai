// ============================================================
// src/context/AppContext.tsx
// Cross-cutting global state management (Auth, Language, Zones, Tabs)
// Per CODING_CONVENTIONS.md §1 & ARCHITECTURE_PATTERNS.md §2.1
// ============================================================
/* oxlint-disable react/only-export-components */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  TabId,
  Language,
  AccessibilityMode,
  type UrbanZone,
  type PersonaProfile,
  type DailyRoutinePlan,
  type IAQRoomConfig,
  type CommunityPledge,
  type CommunityAlert,
} from '@/types';
import { DEFAULT_ZONES, DEFAULT_PERSONAS, DEFAULT_ALERTS } from '@/lib/constants';
import { storageService } from '@/services/storageService';
import type { AppContextValue } from './types';

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabState] = useState<TabId>(TabId.Dashboard);
  const [zones, setZones] = useState<UrbanZone[]>(() => storageService.getZones());
  const [selectedZoneId, setSelectedZoneIdState] = useState<string>(() =>
    storageService.getSelectedZoneId(),
  );
  const [activePersona, setActivePersonaState] = useState<PersonaProfile>(() =>
    storageService.getActivePersona(),
  );
  const [language, setLanguageState] = useState<Language>(Language.English);
  const [accessibilityMode, setAccessibilityModeState] = useState<AccessibilityMode>(
    AccessibilityMode.Standard,
  );
  const [routinePlan, setRoutinePlanState] = useState<DailyRoutinePlan | null>(() =>
    storageService.getRoutinePlan(),
  );
  const [rooms, setRooms] = useState<IAQRoomConfig[]>(() => storageService.getRooms());
  const [pledges, setPledges] = useState<CommunityPledge[]>(() => storageService.getPledges());
  const [alerts, setAlerts] = useState<CommunityAlert[]>(DEFAULT_ALERTS);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  const selectedZone = useMemo(() => {
    return zones.find((z) => z.zoneId === selectedZoneId) || zones[0] || DEFAULT_ZONES[0];
  }, [zones, selectedZoneId]);

  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabState(tab);
  }, []);

  const setSelectedZoneId = useCallback((id: string) => {
    setSelectedZoneIdState(id);
    storageService.saveSelectedZoneId(id);
  }, []);

  const updateZone = useCallback((zoneId: string, updates: Partial<UrbanZone>) => {
    setZones((prev) => {
      const next = prev.map((z) =>
        z.zoneId === zoneId ? { ...z, ...updates, lastUpdated: Date.now() } : z,
      );
      storageService.saveZones(next);
      return next;
    });
  }, []);

  const setActivePersona = useCallback((persona: PersonaProfile) => {
    setActivePersonaState(persona);
    storageService.saveActivePersona(persona);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', lang === Language.Arabic ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', lang);
    }
  }, []);

  const setAccessibilityMode = useCallback((mode: AccessibilityMode) => {
    setAccessibilityModeState(mode);
  }, []);

  const setRoutinePlan = useCallback((plan: DailyRoutinePlan | null) => {
    setRoutinePlanState(plan);
    if (plan) storageService.saveRoutinePlan(plan);
  }, []);

  const updateRoom = useCallback((roomId: string, updates: Partial<IAQRoomConfig>) => {
    setRooms((prev) => {
      const next = prev.map((r) => (r.roomId === roomId ? { ...r, ...updates } : r));
      storageService.saveRooms(next);
      return next;
    });
  }, []);

  const togglePledge = useCallback((pledgeId: string) => {
    setPledges((prev) => {
      const next = prev.map((p) => {
        if (p.id === pledgeId) {
          const userPledged = !p.userPledged;
          return {
            ...p,
            userPledged,
            currentParticipants: userPledged
              ? p.currentParticipants + 1
              : Math.max(0, p.currentParticipants - 1),
          };
        }
        return p;
      });
      storageService.savePledges(next);
      return next;
    });
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      zones,
      selectedZoneId,
      selectedZone,
      setSelectedZoneId,
      updateZone,
      personas: DEFAULT_PERSONAS,
      activePersona,
      setActivePersona,
      language,
      setLanguage,
      accessibilityMode,
      setAccessibilityMode,
      routinePlan,
      setRoutinePlan,
      rooms,
      updateRoom,
      pledges,
      togglePledge,
      alerts,
      dismissAlert,
      globalBanner,
      setGlobalBanner,
    }),
    [
      activeTab,
      setActiveTab,
      zones,
      selectedZoneId,
      selectedZone,
      setSelectedZoneId,
      updateZone,
      activePersona,
      setActivePersona,
      language,
      setLanguage,
      accessibilityMode,
      setAccessibilityMode,
      routinePlan,
      setRoutinePlan,
      rooms,
      updateRoom,
      pledges,
      togglePledge,
      alerts,
      dismissAlert,
      globalBanner,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
