// ============================================================
// src/lib/compute/dijkstraRouter.ts
// Dijkstra pathfinding for minimum cumulative smog exposure
// ============================================================

export interface PathEdge {
  to: string;
  distanceKm: number;
  exposureRate: number; // Pollutant intensity multiplier (1.0 = clean, 3.5 = smog hotspot)
}

export interface DijkstraResult {
  path: string[];
  totalDistance: number;
  totalExposure: number;
}

/**
 * Reconstructs the shortest path from start to target using the previous node map.
 */
function reconstructPath(previous: Record<string, string | null>, target: string): string[] {
  const path: string[] = [];
  let step: string | null = target;
  while (step !== null) {
    path.unshift(step);
    step = previous[step];
  }
  return path;
}

/**
 * Finds the unvisited node with the lowest cumulative exposure distance.
 */
function findClosestNode(unvisited: Set<string>, distances: Record<string, number>): string | null {
  let closest: string | null = null;
  let minExposure = Infinity;
  for (const node of unvisited) {
    if (distances[node] < minExposure) {
      minExposure = distances[node];
      closest = node;
    }
  }
  return closest;
}

/**
 * Dijkstra lowest-exposure pathfinding algorithm.
 * Optimizes for minimum cumulative exposure = Sum(distanceKm * exposureRate).
 */
export function dijkstraLowestExposure(
  graph: Record<string, PathEdge[]>,
  start: string,
  target: string,
): DijkstraResult | null {
  if (!graph[start] || !graph[target]) return null;
  if (start === target) return { path: [start], totalDistance: 0, totalExposure: 0 };

  const distances: Record<string, number> = {};
  const kmDistances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  for (const node of Object.keys(graph)) {
    distances[node] = Infinity;
    kmDistances[node] = Infinity;
    previous[node] = null;
    unvisited.add(node);
  }

  distances[start] = 0;
  kmDistances[start] = 0;

  while (unvisited.size > 0) {
    const current = findClosestNode(unvisited, distances);
    if (current === null || distances[current] === Infinity) break;

    if (current === target) {
      return {
        path: reconstructPath(previous, target),
        totalDistance: Math.round(kmDistances[target] * 100) / 100,
        totalExposure: Math.round(distances[target] * 100) / 100,
      };
    }

    unvisited.delete(current);

    const neighbors = graph[current] ?? [];
    for (const edge of neighbors) {
      if (!unvisited.has(edge.to)) continue;

      const alt = distances[current] + edge.distanceKm * edge.exposureRate;
      if (alt < distances[edge.to]) {
        distances[edge.to] = alt;
        kmDistances[edge.to] = kmDistances[current] + edge.distanceKm;
        previous[edge.to] = current;
      }
    }
  }

  return null;
}
