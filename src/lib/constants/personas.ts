// ============================================================
// src/lib/constants/personas.ts
// Persona vulnerability profiles for smog mitigation scheduling
// ============================================================

import type { PersonaProfile } from '@/types';

export const DEFAULT_PERSONAS: PersonaProfile[] = [
  {
    id: 'persona-asthma',
    name: 'Asthmatic Child & Family',
    subCategory: 'asthmatic',
    sensitivityLevel: 'high',
    preferredStartHour: 7,
    preferredEndHour: 19,
    description:
      'Pediatric asthma profile. Requires strict morning smog avoidance, HEPA filtration, and zero outdoor PE during temperature inversions.',
  },
  {
    id: 'persona-infant',
    name: 'Newborn Infant & Nursing Mother',
    subCategory: 'infant',
    sensitivityLevel: 'high',
    preferredStartHour: 8,
    preferredEndHour: 18,
    description:
      'Underdeveloped pulmonary defense. High risk from ultrafine PM2.5 and NO2. Focus on sealed indoor nurseries and CADR tuning.',
  },
  {
    id: 'persona-elderly',
    name: 'Elderly Relative (Cardiovascular Risk)',
    subCategory: 'elderly',
    sensitivityLevel: 'high',
    preferredStartHour: 9,
    preferredEndHour: 17,
    description:
      'Hypertension and cardiac sensitivity. Extreme risk during sudden winter smog spikes. Priority on midday sun windows with low inversion.',
  },
  {
    id: 'persona-commuter',
    name: 'Daily Urban Commuter',
    subCategory: 'transit-rider',
    sensitivityLevel: 'moderate',
    preferredStartHour: 8,
    preferredEndHour: 20,
    description:
      'Professional navigating peak-hour congestion. Balancing metro transit, cycling corridors, and cabin-filtered vehicle options.',
  },
  {
    id: 'persona-school',
    name: 'School Run Coordinator',
    subCategory: 'school-run',
    sensitivityLevel: 'high',
    preferredStartHour: 7,
    preferredEndHour: 16,
    description:
      'Managing morning school drop-off and afternoon pick-up across multiple urban zones during winter temperature inversions.',
  },
  {
    id: 'persona-lead',
    name: 'Community Resilience Coordinator',
    subCategory: 'neighborhood-lead',
    sensitivityLevel: 'low',
    preferredStartHour: 6,
    preferredEndHour: 22,
    description:
      'Managing neighborhood air monitoring, vulnerable resident welfare checks, and anti-waste burning taskforces.',
  },
];
