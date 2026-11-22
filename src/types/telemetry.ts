// ============================================================
// src/types/telemetry.ts
// Core telemetry types, enums, and zone interfaces
// ============================================================

export enum AQICategory {
  Good = 'Good',
  Moderate = 'Moderate',
  UnhealthySensitive = 'Unhealthy for Sensitive Groups',
  Unhealthy = 'Unhealthy',
  VeryUnhealthy = 'Very Unhealthy',
  Hazardous = 'Hazardous',
}

export enum PollutantType {
  PM25 = 'PM2.5',
  PM10 = 'PM10',
  NO2 = 'NO2',
  CO = 'CO',
  O3 = 'O3',
}

export enum TransitMode {
  Metro = 'metro',
  ElectricBus = 'electric-bus',
  DieselBus = 'diesel-bus',
  Cycling = 'cycling',
  Walking = 'walking',
  EV = 'ev-car',
  GasCar = 'gas-car',
}

export enum Language {
  English = 'en',
  Hindi = 'hi',
  Arabic = 'ar',
  Spanish = 'es',
}

export enum AccessibilityMode {
  Standard = 'standard',
  HighContrast = 'high-contrast',
  ScreenReader = 'screen-reader',
  ReducedMotion = 'reduced-motion',
}

export enum TabId {
  Dashboard = 'dashboard',
  Routine = 'routine',
  Transit = 'transit',
  IAQ = 'iaq',
  Community = 'community',
}

export interface PollutantReading {
  type: PollutantType;
  current: number;
  unit: string;
  aqiContribution: number;
  history: number[];
  threshold: number;
  status: string;
}

export interface UrbanZone {
  zoneId: string;
  zoneName: string;
  aqi: number;
  category: AQICategory;
  dominantPollutant: PollutantType;
  pm25: number;
  pm10: number;
  no2: number;
  co: number;
  o3: number;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  inversionRisk: boolean;
  history: number[];
  lat: number;
  lng: number;
  lastUpdated: number;
}
