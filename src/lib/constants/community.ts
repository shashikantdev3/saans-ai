// ============================================================
// src/lib/constants/community.ts
// Community pledges and municipal emergency smog alerts
// ============================================================

import type { CommunityPledge, CommunityAlert } from '@/types';

export const DEFAULT_PLEDGES: CommunityPledge[] = [
  {
    id: 'pledge-carpool',
    title: 'Neighborhood Carpool & Micro-Transit Days',
    category: 'carpool',
    targetParticipants: 100,
    currentParticipants: 64,
    estimatedEmissionReductionKg: 307.2,
    userPledged: true,
    impactDescription:
      'Reduces morning cold-start emissions and vehicular NO2 peaks in residential school zones.',
  },
  {
    id: 'pledge-heating',
    title: 'Zero Waste & Biomass Burning Ban',
    category: 'clean-heating',
    targetParticipants: 150,
    currentParticipants: 112,
    estimatedEmissionReductionKg: 1344.0,
    userPledged: false,
    impactDescription:
      'Directly halts night-time ground-level smoke release that exacerbates winter temperature inversions.',
  },
  {
    id: 'pledge-dust',
    title: 'Street Wet-Sweeping & Road Dust Control',
    category: 'dust-control',
    targetParticipants: 50,
    currentParticipants: 38,
    estimatedEmissionReductionKg: 57.0,
    userPledged: true,
    impactDescription:
      'Sprays treated recycled water onto unpaved verges to suppress coarse PM10 resuspended by traffic.',
  },
  {
    id: 'pledge-vulnerable',
    title: 'Vulnerable Neighbor Air-Check Network',
    category: 'vulnerable-care',
    targetParticipants: 40,
    currentParticipants: 29,
    estimatedEmissionReductionKg: 14.5,
    userPledged: false,
    impactDescription:
      'Daily check-ins, delivering N95 masks and verifying filter seals for elderly or low-income households.',
  },
];

export const DEFAULT_ALERTS: CommunityAlert[] = [
  {
    id: 'alert-1',
    severity: 'emergency',
    zone: 'North Industrial Belt',
    headline: 'Severe Inversion Trapping Stagnant PM10 & PM2.5 (AQI 342)',
    instructions:
      'Keep windows tightly latched. Cease all outdoor morning running and playground activities. Turn on HEPA filtration.',
    timestamp: Date.now() - 1000 * 60 * 25,
  },
  {
    id: 'alert-2',
    severity: 'warning',
    zone: 'Central Business District',
    headline: 'Thermal Inversion Cap Forming Over Downtown Hub (AQI 218)',
    instructions:
      'Commuters urged to choose subterranean metro lines over surface cycling or motorized diesel transport.',
    timestamp: Date.now() - 1000 * 60 * 80,
  },
];
