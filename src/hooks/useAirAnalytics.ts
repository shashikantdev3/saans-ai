// ============================================================
// src/hooks/useAirAnalytics.ts
// Encapsulates air quality telemetry calculations, inversion risk, and history
// Per CODING_CONVENTIONS.md §1 & ARCHITECTURE_PATTERNS.md §2.2
// ============================================================

import { useMemo, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { calculateAQICategory, getAQIColor, evaluateInversionRisk } from '@/lib/aqiCompute';
import { PollutantType, type PollutantReading } from '@/types';

export function useAirAnalytics() {
  const { zones, selectedZoneId, setSelectedZoneId, updateZone } = useAppContext();

  const currentZone = useMemo(() => {
    return zones.find((z) => z.zoneId === selectedZoneId) || zones[0];
  }, [zones, selectedZoneId]);

  const aqiCategory = useMemo(() => {
    return calculateAQICategory(currentZone.aqi);
  }, [currentZone.aqi]);

  const aqiColor = useMemo(() => {
    return getAQIColor(currentZone.aqi);
  }, [currentZone.aqi]);

  const inversionStatus = useMemo(() => {
    // Ground temperature from zone, simulated upper air temperature based on inversion flag
    const upperTemp = currentZone.inversionRisk
      ? currentZone.temperatureC + 3.2
      : currentZone.temperatureC - 2.5;
    return evaluateInversionRisk(currentZone.temperatureC, upperTemp, currentZone.windSpeedKmh);
  }, [currentZone.temperatureC, currentZone.inversionRisk, currentZone.windSpeedKmh]);

  const pollutantBreakdown = useMemo<PollutantReading[]>(() => {
    return [
      {
        type: PollutantType.PM25,
        current: currentZone.pm25,
        unit: 'µg/m³',
        aqiContribution: Math.round((currentZone.pm25 / 150) * 100),
        history: currentZone.history.map((v) => Math.round(v * 0.7)),
        threshold: 35.4,
        status: currentZone.pm25 > 55 ? 'Hazardous' : currentZone.pm25 > 35 ? 'Moderate' : 'Good',
      },
      {
        type: PollutantType.PM10,
        current: currentZone.pm10,
        unit: 'µg/m³',
        aqiContribution: Math.round((currentZone.pm10 / 250) * 100),
        history: currentZone.history.map((v) => Math.round(v * 0.9)),
        threshold: 154,
        status: currentZone.pm10 > 154 ? 'Unhealthy' : 'Moderate',
      },
      {
        type: PollutantType.NO2,
        current: currentZone.no2,
        unit: 'ppb',
        aqiContribution: Math.round((currentZone.no2 / 100) * 100),
        history: [55, 68, 74, 82, 88, 92, currentZone.no2],
        threshold: 53,
        status: currentZone.no2 > 53 ? 'Unhealthy' : 'Acceptable',
      },
      {
        type: PollutantType.CO,
        current: currentZone.co,
        unit: 'ppm',
        aqiContribution: Math.round((currentZone.co / 9) * 100),
        history: [1.2, 1.8, 2.4, 3.1, 3.8, 4.0, currentZone.co],
        threshold: 9.0,
        status: currentZone.co > 9.0 ? 'Critical' : 'Safe',
      },
      {
        type: PollutantType.O3,
        current: currentZone.o3,
        unit: 'ppb',
        aqiContribution: Math.round((currentZone.o3 / 70) * 100),
        history: [25, 28, 30, 32, 35, 34, currentZone.o3],
        threshold: 70,
        status: currentZone.o3 > 70 ? 'High' : 'Normal',
      },
    ];
  }, [currentZone]);

  const simulateSmogSpike = useCallback(() => {
    updateZone(currentZone.zoneId, {
      aqi: Math.min(500, currentZone.aqi + 45),
      pm25: Math.round((currentZone.pm25 + 35) * 10) / 10,
      inversionRisk: true,
      history: [...currentZone.history.slice(1), Math.min(500, currentZone.aqi + 45)],
    });
  }, [currentZone, updateZone]);

  const simulateCleanDispersion = useCallback(() => {
    updateZone(currentZone.zoneId, {
      aqi: Math.max(35, currentZone.aqi - 50),
      pm25: Math.max(10, Math.round((currentZone.pm25 - 40) * 10) / 10),
      inversionRisk: false,
      history: [...currentZone.history.slice(1), Math.max(35, currentZone.aqi - 50)],
    });
  }, [currentZone, updateZone]);

  return {
    zones,
    currentZone,
    selectedZoneId,
    setSelectedZoneId,
    aqiCategory,
    aqiColor,
    inversionStatus,
    pollutantBreakdown,
    simulateSmogSpike,
    simulateCleanDispersion,
  };
}
