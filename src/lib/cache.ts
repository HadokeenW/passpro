"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Enterprise Multi-Tier Client Cache for PassPro:
 * - L1: High-speed In-Memory Cache (0ms synchronous access)
 * - L2: Persistent SessionStorage Cache (persists across page reloads & tabs)
 * - In-Flight Request Deduplication: prevents redundant parallel fetches
 * - Stale-While-Revalidate (SWR): instantaneous initial render + silent background refresh
 * - Event-Driven Invalidation Bus: automated cache clearing on mutations
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const DEFAULT_TTL_MS = 60_000; // 1 minute default TTL
const STORAGE_PREFIX = "passpro_cache_v1:";

// L1: Memory Cache
const memoryCache = new Map<string, CacheEntry<any>>();

// In-flight request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Safely retrieve an item from L2 (SessionStorage)
 */
function getFromSessionStorage<T>(url: string): CacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + url);
    if (!raw) return null;
    const parsed: CacheEntry<T> = JSON.parse(raw);
    const now = Date.now();
    // Validate entry structure and TTL (allow up to 2x TTL for stale-while-revalidate serving)
    if (parsed && typeof parsed.timestamp === "number") {
      if (now - parsed.timestamp < (parsed.ttl || DEFAULT_TTL_MS) * 2) {
        return parsed;
      }
    }
    window.sessionStorage.removeItem(STORAGE_PREFIX + url);
    return null;
  } catch {
    return null;
  }
}

/**
 * Safely persist an item to L2 (SessionStorage)
 */
function saveToSessionStorage<T>(url: string, entry: CacheEntry<T>) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + url, JSON.stringify(entry));
  } catch {
    // SessionStorage quota exceeded or disabled: ignore silently
  }
}

/**
 * Retrieves data from L1 or L2 cache synchronously.
 */
export function getCachedData<T>(url: string): T | null {
  if (!url) return null;

  // 1. Check L1 Memory Cache
  const memoryEntry = memoryCache.get(url);
  if (memoryEntry) {
    return memoryEntry.data as T;
  }

  // 2. Check L2 SessionStorage Cache
  const sessionEntry = getFromSessionStorage<T>(url);
  if (sessionEntry) {
    // Populate L1 cache for fast subsequent lookups
    memoryCache.set(url, sessionEntry);
    return sessionEntry.data;
  }

  return null;
}

/**
 * Checks if cached data is fresh (within its TTL).
 */
export function isCacheFresh(url: string, ttlMs: number = DEFAULT_TTL_MS): boolean {
  const entry = memoryCache.get(url) || getFromSessionStorage(url);
  if (!entry) return false;
  return Date.now() - entry.timestamp < (entry.ttl || ttlMs);
}

/**
 * Stores data into L1 (Memory) and L2 (SessionStorage) caches.
 */
export function setCachedData<T>(url: string, data: T, ttlMs: number = DEFAULT_TTL_MS) {
  if (!url || data === undefined) return;
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  };
  memoryCache.set(url, entry);
  saveToSessionStorage(url, entry);
}

/**
 * Invalidate cache for a specific URL, prefix, or array of prefixes.
 * Dispatches an event on window to notify all subscribed components to revalidate.
 */
export function invalidateCache(prefixOrPrefixes?: string | string[]) {
  if (typeof window === "undefined") return;

  const prefixes = prefixOrPrefixes
    ? Array.isArray(prefixOrPrefixes)
      ? prefixOrPrefixes
      : [prefixOrPrefixes]
    : [];

  if (prefixes.length === 0) {
    // Clear everything
    memoryCache.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    } catch {}
  } else {
    // Clear matching in L1
    for (const key of Array.from(memoryCache.keys())) {
      if (prefixes.some((p) => key.includes(p))) {
        memoryCache.delete(key);
      }
    }

    // Clear matching in L2
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          const rawUrl = key.replace(STORAGE_PREFIX, "");
          if (prefixes.some((p) => rawUrl.includes(p))) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    } catch {}
  }

  // Notify active listeners / hooks
  window.dispatchEvent(
    new CustomEvent("passpro:cache-invalidate", {
      detail: { prefixes },
    })
  );
}

export interface CachedFetchOptions {
  ttlMs?: number;
  forceRefresh?: boolean;
}

/**
 * Performs a network fetch with in-flight deduplication and caching.
 */
export async function cachedFetch<T>(
  url: string,
  options?: CachedFetchOptions
): Promise<T> {
  const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;

  // 1. Check if fresh in cache
  if (!options?.forceRefresh) {
    const cached = memoryCache.get(url) || getFromSessionStorage<T>(url);
    if (cached && Date.now() - cached.timestamp < (cached.ttl || ttl)) {
      return cached.data as T;
    }
  }

  // 2. In-flight request deduplication
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url) as Promise<T>;
  }

  // 3. Initiate request
  const fetchPromise = fetch(url)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setCachedData(url, data, ttl);
      return data as T;
    })
    .finally(() => {
      pendingRequests.delete(url);
    });

  pendingRequests.set(url, fetchPromise);
  return fetchPromise;
}

/**
 * Prewarms a route by fetching it in the background if not already fresh.
 */
export function prewarmRoute(url: string, ttlMs?: number) {
  if (typeof window === "undefined" || !url) return;
  if (!isCacheFresh(url, ttlMs)) {
    cachedFetch(url, { ttlMs }).catch(() => {});
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

  const scheduleTask = (fn: () => void, delayMs: number) => {
    setTimeout(() => {
      if (typeof window !== "undefined" && typeof (window as any).requestIdleCallback === "function") {
        (window as any).requestIdleCallback(fn, { timeout: 1000 });
      } else {
        fn();
      }
    }, delayMs);
  };

  coreRoutes.forEach((url, idx) => {
    scheduleTask(() => prewarmRoute(url), 100 + idx * 80);
  });
}

/**
 * React Hook for seamless SWR querying with instant cached UI.
 */
export function useCachedQuery<T>(
  url: string | null,
  options?: {
    ttlMs?: number;
    enabled?: boolean;
    fallbackData?: T;
    revalidateOnFocus?: boolean;
  }
) {
  const enabled = options?.enabled ?? true;
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const fallbackData = options?.fallbackData;
  const revalidateOnFocus = options?.revalidateOnFocus ?? false;

  const initialCached = url ? getCachedData<T>(url) : null;
  const [data, setData] = useState<T | null>(initialCached ?? fallbackData ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCached && enabled && !!url);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);

  const executeFetch = useCallback(
    async (force: boolean = false) => {
      if (!url || !enabled) return;

      const hasCached = !!getCachedData(url);
      if (!hasCached) {
        setIsLoading(true);
      } else {
        setIsValidating(true);
      }

      try {
        const result = await cachedFetch<T>(url, { ttlMs, forceRefresh: force });
        if (mountedRef.current) {
          setData(result);
          setError(null);
        }
      } catch (err: any) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsValidating(false);
        }
      }
    },
    [url, enabled, ttlMs]
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!url || !enabled) return;

    // Check if we can hydrate immediately from cache
    const cached = getCachedData<T>(url);
    if (cached) {
      setData(cached);
      setIsLoading(false);
    }

    // Always revalidate in background if not fresh or if first mount
    executeFetch(false);

    // Listen for global cache invalidations
    const handleInvalidation = (event: Event) => {
      const customEvent = event as CustomEvent<{ prefixes?: string[] }>;
      const prefixes = customEvent.detail?.prefixes;
      if (!prefixes || prefixes.length === 0 || prefixes.some((p) => url.includes(p))) {
        executeFetch(true);
      }
    };

    window.addEventListener("passpro:cache-invalidate", handleInvalidation);

    let focusHandler: (() => void) | null = null;
    if (revalidateOnFocus) {
      focusHandler = () => executeFetch(false);
      window.addEventListener("focus", focusHandler);
    }

    return () => {
      mountedRef.current = false;
      window.removeEventListener("passpro:cache-invalidate", handleInvalidation);
      if (focusHandler) window.removeEventListener("focus", focusHandler);
    };
  }, [url, enabled, executeFetch, revalidateOnFocus]);

  const mutate = useCallback(
    (newData: T | ((prev: T | null) => T), shouldRevalidate: boolean = true) => {
      if (!url) return;
      const resolved = typeof newData === "function" ? (newData as any)(data) : newData;
      setData(resolved);
      setCachedData(url, resolved, ttlMs);
      if (shouldRevalidate) {
        executeFetch(true);
      }
    },
    [url, data, ttlMs, executeFetch]
  );

  return {
    data,
    isLoading,
    isValidating,
    error,
    mutate,
    refetch: () => executeFetch(true),
  };
}
