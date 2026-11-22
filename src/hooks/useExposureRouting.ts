// ============================================================
// src/hooks/useExposureRouting.ts
// Dijkstra pathfinder & multi-modal exposure comparison hook
// Per CODING_CONVENTIONS.md §1 & ARCHITECTURE_PATTERNS.md §2.2
// ============================================================

import { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  dijkstraLowestExposure,
  calculateCommuteMetrics,
} from '@/lib/aqiCompute';
import {
  TRANSIT_NODES,
  TRANSIT_GRAPH,
} from '@/lib/constants';
import {
  TransitMode,
  type TransitRouteComparison,
} from '@/types';

export function useExposureRouting() {
  const { selectedZone } = useAppContext();
  const [originId, setOriginId] = useState<string>('N-HOME');
  const [destinationId, setDestinationId] = useState<string>('N-WORK');

  const originNode = useMemo(() => {
    return TRANSIT_NODES.find((n) => n.id === originId) || TRANSIT_NODES[0];
  }, [originId]);

  const destNode = useMemo(() => {
    return TRANSIT_NODES.find((n) => n.id === destinationId) || TRANSIT_NODES[TRANSIT_NODES.length - 1];
  }, [destinationId]);

  const lowestExposureResult = useMemo(() => {
    return dijkstraLowestExposure(TRANSIT_GRAPH, originId, destinationId);
  }, [originId, destinationId]);

  const pathNodes = useMemo(() => {
    if (!lowestExposureResult) return [];
    return lowestExposureResult.path.map(
      (nodeId) => TRANSIT_NODES.find((n) => n.id === nodeId) || { id: nodeId, name: nodeId, zoneId: '', isMetro: false, isCleanCorridor: false }
    );
  }, [lowestExposureResult]);

  const routeDistanceKm = useMemo(() => {
    return lowestExposureResult?.totalDistance || 8.0;
  }, [lowestExposureResult]);

  const modalComparisons = useMemo<TransitRouteComparison[]>(() => {
    const modes = [
      TransitMode.Metro,
      TransitMode.ElectricBus,
      TransitMode.DieselBus,
      TransitMode.Cycling,
      TransitMode.Walking,
      TransitMode.EV,
      TransitMode.GasCar,
    ];

    return modes.map((mode) => calculateCommuteMetrics(routeDistanceKm, mode, selectedZone.aqi));
  }, [routeDistanceKm, selectedZone.aqi]);

  const setOrigin = useCallback((id: string) => {
    setOriginId(id);
  }, []);

  const setDestination = useCallback((id: string) => {
    setDestinationId(id);
  }, []);

  return {
    nodes: TRANSIT_NODES,
    originId,
    destinationId,
    originNode,
    destNode,
    setOrigin,
    setDestination,
    lowestExposureResult,
    pathNodes,
    routeDistanceKm,
    modalComparisons,
  };
}
