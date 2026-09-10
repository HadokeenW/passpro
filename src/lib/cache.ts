/**
 * Lightweight in-memory client-side cache with Stale-While-Revalidate pattern.
 * Enables instant 0ms page transitions without flickering spinners.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Returns cached data immediately if available, or null.
 */
export function getCachedData<T>(url: string): T | null {
  const entry = memoryCache.get(url);
  return entry ? (entry.data as T) : null;
}

/**
 * Stores data in memory cache with timestamp.
 */
export function setCachedData<T>(url: string, data: T) {
  memoryCache.set(url, { data, timestamp: Date.now() });
}

/**
 * Invalidate cache for a specific URL or prefix (e.g. after mutations).
 */
export function invalidateCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Fetches data using Stale-While-Revalidate:
 * - Immediately returns cached data if fresh
 * - Performs fetch and caches the result
 */
export async function cachedFetch<T>(
  url: string,
  options?: { ttlMs?: number }
): Promise<T> {
  const ttl = options?.ttlMs ?? 60_000;
  const now = Date.now();
  const cached = memoryCache.get(url);

  if (cached && now - cached.timestamp < ttl) {
    return cached.data as T;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }
  const data = await res.json();
  memoryCache.set(url, { data, timestamp: now });
  return data;
}

/**
 * Prewarms a route by fetching it in the background if not cached yet.
 */
export function prewarmRoute(url: string) {
  if (typeof window === "undefined") return;
  if (!memoryCache.has(url)) {
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.error) {
          setCachedData(url, data);
        }
      })
      .catch(() => {});
  }
}

/**
 * Prewarms all core management views in idle time.
 */
export function prewarmAllCoreRoutes() {
  if (typeof window === "undefined") return;
  const coreRoutes = [
    "/api/dashboard/metrics",
    "/api/dashboard/heatmap",
    "/api/dashboard/activity?limit=15",
    "/api/members?page=1&pageSize=15&filter=all&q=",
    "/api/subscriptions?page=1&pageSize=15&status=all",
    "/api/cards?page=1&pageSize=15&status=all&q=",
    "/api/payments?page=1&pageSize=15&period=today",
    "/api/access/logs?page=1&pageSize=25&decision=all&q=",
    "/api/plans?includeInactive=true",
  ];
  coreRoutes.forEach((url, idx) => {
    setTimeout(() => prewarmRoute(url), idx * 120);
  });
}
