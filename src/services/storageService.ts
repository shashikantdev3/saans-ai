// ============================================================
// src/services/storageService.ts
// Offline-first resilient browser persistence with safeParse<T>()
// Per CODING_CONVENTIONS.md §5 & ARCHITECTURE_PATTERNS.md §4.2
// ============================================================

import type {
  UrbanZone,
  PersonaProfile,
  DailyRoutinePlan,
  IAQRoomConfig,
  CommunityPledge,
} from '@/types';
import {
  DEFAULT_ZONES,
  DEFAULT_PERSONAS,
  DEFAULT_ROOMS,
  DEFAULT_PLEDGES,
} from '@/lib/constants';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const STORAGE_KEYS = {
  ZONES: 'saans_zones_v1',
  SELECTED_ZONE: 'saans_selected_zone_id_v1',
  PERSONA: 'saans_active_persona_v1',
  ROUTINE: 'saans_routine_plan_v1',
  ROOMS: 'saans_iaq_rooms_v1',
  PLEDGES: 'saans_community_pledges_v1',
  LANGUAGE: 'saans_language_v1',
  ACCESSIBILITY_MODE: 'saans_accessibility_mode_v1',
} as const;

export const storageService = {
  getZones(): UrbanZone[] {
    if (typeof window === 'undefined') return DEFAULT_ZONES;
    return safeParse<UrbanZone[]>(localStorage.getItem(STORAGE_KEYS.ZONES), DEFAULT_ZONES);
  },

  saveZones(zones: UrbanZone[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(zones));
    } catch {
      // Storage quota or sandboxed iframe
    }
  },

  getSelectedZoneId(): string {
    if (typeof window === 'undefined') return DEFAULT_ZONES[0].zoneId;
    return safeParse<string>(localStorage.getItem(STORAGE_KEYS.SELECTED_ZONE), DEFAULT_ZONES[0].zoneId);
  },

  saveSelectedZoneId(zoneId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_ZONE, JSON.stringify(zoneId));
    } catch {
      // Ignored
    }
  },

  getActivePersona(): PersonaProfile {
    if (typeof window === 'undefined') return DEFAULT_PERSONAS[0];
    return safeParse<PersonaProfile>(localStorage.getItem(STORAGE_KEYS.PERSONA), DEFAULT_PERSONAS[0]);
  },

  saveActivePersona(persona: PersonaProfile): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PERSONA, JSON.stringify(persona));
    } catch {
      // Ignored
    }
  },

  getRoutinePlan(): DailyRoutinePlan | null {
    if (typeof window === 'undefined') return null;
    return safeParse<DailyRoutinePlan | null>(localStorage.getItem(STORAGE_KEYS.ROUTINE), null);
  },

  saveRoutinePlan(plan: DailyRoutinePlan): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ROUTINE, JSON.stringify(plan));
    } catch {
      // Ignored
    }
  },

  getRooms(): IAQRoomConfig[] {
    if (typeof window === 'undefined') return DEFAULT_ROOMS;
    return safeParse<IAQRoomConfig[]>(localStorage.getItem(STORAGE_KEYS.ROOMS), DEFAULT_ROOMS);
  },

  saveRooms(rooms: IAQRoomConfig[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    } catch {
      // Ignored
    }
  },

  getPledges(): CommunityPledge[] {
    if (typeof window === 'undefined') return DEFAULT_PLEDGES;
    return safeParse<CommunityPledge[]>(localStorage.getItem(STORAGE_KEYS.PLEDGES), DEFAULT_PLEDGES);
  },

  savePledges(pledges: CommunityPledge[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PLEDGES, JSON.stringify(pledges));
    } catch {
      // Ignored
    }
  },
};
