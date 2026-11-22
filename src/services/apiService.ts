// ============================================================
// src/services/apiService.ts
// Frontend API client communicating with backend Express routes
// Per ARCHITECTURE_PATTERNS.md §1 & SECURITY_STANDARDS.md §1
// ============================================================

import type {
  UrbanZone,
  PersonaProfile,
  DailyRoutinePlan,
  Language,
  AskResponse,
  AdvisoryResponse,
} from '@/types';

export interface RoutineRequestPayload {
  persona: PersonaProfile;
  zone: UrbanZone;
  language: Language;
}

export interface AskRequestPayload {
  question: string;
  persona: PersonaProfile;
  zone: UrbanZone;
  language: Language;
}

export interface CommuteRequestPayload {
  originZone: string;
  destZone: string;
  distanceKm: number;
  currentAQI: number;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

export const apiService = {
  async fetchHealth(): Promise<{ status: string; uptime: number }> {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) {
      throw new Error(`Health check failed with status ${res.status}`);
    }
    return (await res.json()) as { status: string; uptime: number };
  },

  async generateDailyRoutine(payload: RoutineRequestPayload): Promise<DailyRoutinePlan> {
    const res = await fetch(`${API_BASE}/api/routine-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${res.status} failed to generate routine`);
    }

    return (await res.json()) as DailyRoutinePlan;
  },

  async generateEmergencyAdvisory(zone: UrbanZone, language: Language): Promise<AdvisoryResponse> {
    const res = await fetch(`${API_BASE}/api/emergency-advisory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone, language }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${res.status} failed to generate advisory`);
    }

    return (await res.json()) as AdvisoryResponse;
  },

  async askSaans(payload: AskRequestPayload): Promise<AskResponse> {
    const res = await fetch(`${API_BASE}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${res.status} failed to answer`);
    }

    return (await res.json()) as AskResponse;
  },
};
