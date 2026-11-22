/**
 * Every constant the impact engine uses, with its source and how confident we are.
 * The UI shows these next to each result, so a judge or user can audit any number.
 */
export type Confidence = 'high' | 'medium' | 'low';

export interface Factor {
  value: number;
  unit: string;
  source: string;
  confidence: Confidence;
  note?: string;
}

const CHEN_ZHAO =
  'Chen & Zhao (2011), Review of relationship between indoor and outdoor particles, Atmospheric Environment 45(2):275-288';
const EPA_EFH =
  'US EPA Exposure Factors Handbook (2011), Chapter 6, Table 6-2 (adult mean inhalation rates by activity)';
const TERI_DELHI =
  'TERI, Per passenger emission in Delhi for different modes (2019-20 data): g CO2 per passenger-km';

export const FACTORS = {
  // Indoor mass-balance parameters
  penetration: {
    value: 0.8,
    unit: 'fraction',
    source: CHEN_ZHAO,
    confidence: 'medium',
    note: 'Share of outdoor PM2.5 that gets through cracks and openings. Reported range about 0.6 to 1.0.',
  },
  deposition: {
    value: 0.2,
    unit: 'per hour',
    source: CHEN_ZHAO,
    confidence: 'medium',
    note: 'PM2.5 settling onto indoor surfaces. Reported range about 0.1 to 0.5 per hour.',
  },
  airExchangeClosed: {
    value: 0.7,
    unit: 'air changes per hour',
    source: 'Assumption for a naturally ventilated Indian home with windows and doors shut',
    confidence: 'low',
  },
  airExchangeOpen: {
    value: 4,
    unit: 'air changes per hour',
    source: 'Assumption for a home with windows open',
    confidence: 'low',
  },
  ceilingHeight: {
    value: 2.8,
    unit: 'm',
    source: 'Assumption for a typical Indian apartment room',
    confidence: 'medium',
  },
  purifierCadr: {
    value: 250,
    unit: 'm³/h',
    source: 'Assumption for a small home HEPA purifier; check the CADR on your label',
    confidence: 'low',
  },
  acFilterCadr: {
    value: 20,
    unit: 'm³/h',
    source:
      'Assumption: a split AC mesh filter catches little PM2.5. Treated as a weak filter, not a purifier',
    confidence: 'low',
  },
  boxFanFilterCadr: {
    value: 189,
    unit: 'm³/h',
    source:
      'Holder et al. (2022), DIY air cleaners, Indoor Air (doi:10.1111/ina.13163): box fan with one MERV-13 filter measured 111 cfm',
    confidence: 'medium',
  },

  // Breathing rates (adult), m³ per hour
  breathingSleep: { value: 0.3, unit: 'm³/h', source: EPA_EFH, confidence: 'high' },
  breathingRest: { value: 0.3, unit: 'm³/h', source: EPA_EFH, confidence: 'high' },
  breathingLight: { value: 0.72, unit: 'm³/h', source: EPA_EFH, confidence: 'high' },
  breathingModerate: { value: 1.56, unit: 'm³/h', source: EPA_EFH, confidence: 'high' },

  // How much of the outdoor level reaches you while travelling (assumptions)
  inVehicleClosed: {
    value: 0.6,
    unit: 'fraction of outdoor',
    source: 'Assumption for an AC car or metro with closed windows',
    confidence: 'low',
  },
  inVehicleOpen: {
    value: 1,
    unit: 'fraction of outdoor',
    source: 'Walking, cycling, two-wheeler, auto and non-AC bus are treated as fully outdoor',
    confidence: 'medium',
  },

  // Transport CO2, grams per passenger-km in Delhi
  carPetrolPkm: {
    value: 89.93,
    unit: 'g CO2/pkm',
    source: TERI_DELHI,
    confidence: 'high',
    note: 'At TERI occupancy of 1.6 people per car, which is 143.9 g per vehicle-km',
  },
  carOccupancy: { value: 1.6, unit: 'people', source: TERI_DELHI, confidence: 'high' },
  twoWheelerPkm: { value: 41.29, unit: 'g CO2/pkm', source: TERI_DELHI, confidence: 'high' },
  autoPkm: { value: 64.1, unit: 'g CO2/pkm', source: TERI_DELHI, confidence: 'high' },
  busPkm: { value: 29.48, unit: 'g CO2/pkm', source: TERI_DELHI, confidence: 'high' },
  metroPkm: {
    value: 29.29,
    unit: 'g CO2/pkm',
    source: TERI_DELHI,
    confidence: 'high',
    note: 'Upper estimate (grid factor 0.71 t/MWh). TERI lower estimate is 20.73',
  },

  // Generator vs grid
  dieselCo2PerLitre: {
    value: 2.64,
    unit: 'kg CO2/L',
    source: 'Diesel emission factor used in the TERI Delhi study (consistent with IPCC defaults)',
    confidence: 'high',
  },
  dgLitresPerKwh: {
    value: 0.35,
    unit: 'L/kWh',
    source: 'Assumption for a small diesel generator at part load',
    confidence: 'low',
  },
  gridCo2PerKwh: {
    value: 0.727,
    unit: 'kg CO2/kWh',
    source:
      'CEA CO2 Baseline Database v20.0 (Dec 2024): weighted average grid emission factor for 2023-24',
    confidence: 'high',
  },
  inverterRoundTrip: {
    value: 0.8,
    unit: 'fraction',
    source: 'Assumption for battery inverter charge and discharge efficiency',
    confidence: 'medium',
  },

  // Indoor sources (PM2.5 emission rates)
  incenseMgPerHour: {
    value: 100,
    unit: 'mg/h',
    source:
      'Jetter et al. (2002), Characterization of emissions from burning incense, Science of the Total Environment 295:51-67 (range 7 to 202 mg/h)',
    confidence: 'medium',
  },
  fryingMgPerMin: {
    value: 2,
    unit: 'mg/min',
    source:
      "O'Leary et al. (2019), Indoor Air 29(3):423-438 (0.54 to 3.7 mg/min for full meals); Xiang et al. (2021), Building and Environment 201 (2.3 mg/min pan frying)",
    confidence: 'medium',
  },
  rangeHoodCapture: {
    value: 0.8,
    unit: 'fraction captured',
    source:
      "O'Leary et al. (2019) report apparent capture above 90% for a cooker hood; we use 80% to stay conservative",
    confidence: 'medium',
  },
} as const satisfies Record<string, Factor>;

export type FactorKey = keyof typeof FACTORS;
