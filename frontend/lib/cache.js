// Simple in-memory cache for API responses
import { supabase } from './supabase';

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

// ✅ FIXED: Removed calls to undefined functions
// Preload critical data - safely wrapped
export async function preloadCriticalData() {
  try {
    // Only preload data that actually exists
    if (!supabase) {
      console.warn('Supabase not configured, skipping preload');
      return;
    }
    
    // Fetch featured pools if the table exists
    try {
      await cachedFetch(
        'featured-pools',
        () => supabase
          .from('pools')
          .select('*')
          .eq('status', 'active')
          .eq('featured', true)
          .limit(6),
        CACHE_DURATION.LONG
      );
    } catch (error) {
      console.warn('Could not preload featured pools:', error.message);
    }

    // Fetch platform stats if the table exists
    try {
      await cachedFetch(
        'stats',
        () => supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true }),
        CACHE_DURATION.MEDIUM
      );
    } catch (error) {
      console.warn('Could not preload stats:', error.message);
    }
  } catch (error) {
    console.error('Error preloading critical data:', error);
    // Don't throw - preload failures should not break the app
  }
}
