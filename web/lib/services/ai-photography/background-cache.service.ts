type CacheEntry = { url: string; expiresAt: number };

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 12;

export function getCachedBackground(cacheKey: string): string | null {
  const entry = cache.get(cacheKey);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(cacheKey);
    return null;
  }
  return entry.url;
}

export function setCachedBackground(cacheKey: string, url: string, ttlMs = DEFAULT_TTL_MS) {
  cache.set(cacheKey, { url, expiresAt: Date.now() + ttlMs });
}
