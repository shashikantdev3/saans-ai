// ============================================================
// src/test/routing.test.ts
// Tier 2: Graph Pathfinding & React Hook State Tests
// Per TESTING_STANDARDS.md §3 (Tier 2)
// ============================================================

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { dijkstraLowestExposure, type PathEdge } from '@/lib/aqiCompute';
import { useExposureRouting } from '@/hooks/useExposureRouting';
import { AppContextProvider } from '@/context/AppContext';
import { TRANSIT_GRAPH } from '@/lib/constants';
import React, { type ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) =>
  React.createElement(AppContextProvider, null, children);

describe('dijkstraLowestExposure algorithm', () => {
  it('finds lowest exposure path between origin and destination', () => {
    const result = dijkstraLowestExposure(TRANSIT_GRAPH, 'N-HOME', 'N-WORK');
    expect(result).not.toBeNull();
    if (result) {
      expect(result.path[0]).toBe('N-HOME');
      expect(result.path[result.path.length - 1]).toBe('N-WORK');
      expect(result.totalDistance).toBeGreaterThan(0);
      expect(result.totalExposure).toBeGreaterThan(0);
      // Confirms bypass of high-smog junction
      expect(result.path).not.toContain('N-JUNCTION');
    }
  });

  it('handles identity path when start equals target', () => {
    const result = dijkstraLowestExposure(TRANSIT_GRAPH, 'N-HOME', 'N-HOME');
    expect(result).toEqual({
      path: ['N-HOME'],
      totalDistance: 0,
      totalExposure: 0,
    });
  });

  it('returns null if start or target node is missing from graph', () => {
    expect(dijkstraLowestExposure(TRANSIT_GRAPH, 'UNKNOWN_START', 'N-WORK')).toBeNull();
    expect(dijkstraLowestExposure(TRANSIT_GRAPH, 'N-HOME', 'UNKNOWN_TARGET')).toBeNull();
  });

  it('returns null if target is unreachable in disconnected graph', () => {
    const disconnectedGraph: Record<string, PathEdge[]> = {
      A: [{ to: 'B', distanceKm: 2, exposureRate: 1 }],
      B: [],
      C: [],
    };
    expect(dijkstraLowestExposure(disconnectedGraph, 'A', 'C')).toBeNull();
  });
});

describe('useExposureRouting hook', () => {
  it('initializes with default home-to-work waypoints and calculates route', () => {
    const { result } = renderHook(() => useExposureRouting(), { wrapper });

    expect(result.current.originId).toBe('N-HOME');
    expect(result.current.destinationId).toBe('N-WORK');
    expect(result.current.originNode.name).toContain('Residential Heights');
    expect(result.current.destNode.name).toContain('City Financial Tower');
    expect(result.current.lowestExposureResult).not.toBeNull();
    expect(result.current.pathNodes.length).toBeGreaterThan(1);
    expect(result.current.modalComparisons.length).toBe(7);
  });

  it('updates origin and recalculates path trajectory', () => {
    const { result } = renderHook(() => useExposureRouting(), { wrapper });

    act(() => {
      result.current.setOrigin('N-PARK');
    });

    expect(result.current.originId).toBe('N-PARK');
    expect(result.current.originNode.name).toContain('Riverside Park');
    expect(result.current.lowestExposureResult?.path[0]).toBe('N-PARK');
  });

  it('updates destination and updates transit modal comparison metrics', () => {
    const { result } = renderHook(() => useExposureRouting(), { wrapper });

    act(() => {
      result.current.setDestination('N-METRO-HUB');
    });

    expect(result.current.destinationId).toBe('N-METRO-HUB');
    expect(result.current.destNode.name).toContain('Metro Interchange');
    expect(result.current.lowestExposureResult?.path.slice(-1)[0]).toBe('N-METRO-HUB');
  });
});
