// Simple in-memory cache for API responses
const cache = new Map();

export const CACHE_DURATION = {
  SHORT: 30 * 1000,      // 30 seconds
  MEDIUM: 5 * 60 * 1000,  // 5 minutes
  LONG: 30 * 60 * 1000,   // 30 minutes
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
};

export async function cachedFetch(key, fetcher, duration = CACHE_DURATION.MEDIUM) {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < duration) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

export function clearCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// Preload critical data
export async function preloadCriticalData() {
  const preloadPromises = [
    cachedFetch('featured-pools', () => fetchFeaturedPools(), CACHE_DURATION.LONG),
    cachedFetch('stats', () => fetchStats(), CACHE_DURATION.MEDIUM),
  ];
  
  await Promise.all(preloadPromises);
}
