// ============================================================
// src/types/community.ts
// Transit waypoints, comparisons, IAQ configurations, and pledges
// ============================================================

import { TransitMode } from './telemetry';

export interface TransitNode {
  id: string;
  name: string;
  zoneId: string;
  isMetro: boolean;
  isCleanCorridor: boolean;
}

export interface TransitRouteComparison {
  mode: TransitMode;
  modeLabel: string;
  durationMinutes: number;
  distanceKm: number;
  pm25ExposureDoseUg: number;
  co2EmissionsKg: number;
  healthRiskRating: 'minimal' | 'low' | 'moderate' | 'severe';
  isRecommended: boolean;
  advisory: string;
}

export interface IAQRoomConfig {
  roomId: string;
  roomName: string;
  areaSqMeters: number;
  ceilingHeightMeters: number;
  occupantsCount: number;
  hasAirPurifier: boolean;
  purifierCadrM3H: number;
  indoorPlantsCount: number;
  currentIndoorAQI: number;
  targetIndoorAQI: number;
}

export interface CommunityPledge {
  id: string;
  title: string;
  category: 'carpool' | 'clean-heating' | 'dust-control' | 'waste-management' | 'vulnerable-care';
  targetParticipants: number;
  currentParticipants: number;
  estimatedEmissionReductionKg: number;
  userPledged: boolean;
  impactDescription: string;
}

export interface CommunityAlert {
  id: string;
  severity: 'advisory' | 'warning' | 'emergency';
  zone: string;
  headline: string;
  instructions: string;
  timestamp: number;
}
