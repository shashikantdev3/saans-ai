// ============================================================
// server/cache.ts
// In-Memory SHA-256 LRU Response Cache (100 Entries)
// ============================================================

import { createHash } from 'crypto';

export interface CacheEntry {
  data: unknown;
  cachedAt: number;
}

export const insightCache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 100;

/**
 * Creates a deterministic 16-character SHA-256 hex digest for an input payload.
 */
export function hashPayload(obj: unknown): string {
  return createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

/**
 * Evicts oldest entry when cache capacity exceeds maximum limit.
 */
export function pruneCache(): void {
  if (insightCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = insightCache.keys().next().value;
    if (firstKey !== undefined) insightCache.delete(firstKey);
  }
}
