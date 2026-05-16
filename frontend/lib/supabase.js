import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
  if (typeof window !== 'undefined') {
    console.warn('Supabase credentials missing. Some features may not work.');
  }
}

// Optimized Supabase client configuration
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'X-Client-Info': 'abbaa-carraa',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2, // Limit realtime events for performance
    },
  },
});

// Helper function to check connection status
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from('pools').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { connected: true, error: null };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { connected: false, error: error.message };
  }
}

// Helper function to get pools with caching
let poolsCache = null;
let poolsCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache
export async function getPoolsWithCache() {
  const now = Date.now();
  if (poolsCache && (now - poolsCacheTime) < CACHE_DURATION) {
    return { data: poolsCache, error: null };
  }
  
  try {
    const { data, error } = await supabase
      .from('pools')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      poolsCache = data;
      poolsCacheTime = now;
      return { data, error: null };
    }
    
    // If error, return cached data if available (stale-while-revalidate)
    if (poolsCache) {
      console.warn('Using cached data due to error:', error);
      return { data: poolsCache, error: null, fromCache: true };
    }
    
    return { data: null, error };
  } catch (error) {
    console.error('Error fetching pools:', error);
    // Return cached data if available
    if (poolsCache) {
      return { data: poolsCache, error: null, fromCache: true };
    }
    return { data: null, error };
  }
}

// Helper function to invalidate cache
export function invalidatePoolsCache() {
  poolsCache = null;
  poolsCacheTime = 0;
}

// Helper function to get contributor stats efficiently
export async function getContributorStats(userId) {
  try {
    const [contributions, wins, activePools] = await Promise.all([
      supabase
        .from('contributions')
        .select('amount', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed'),
      supabase
        .from('pools')
        .select('id', { count: 'exact' })
        .eq('winner_id', userId),
      supabase
        .from('contributions')
        .select('pool_id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('pool_id', 
          supabase.from('pools').select('id').eq('status', 'active')
        ),
    ]);
    
    return {
      totalContributions: contributions.data?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0,
      totalWins: wins.count || 0,
      activeEntries: activePools.count || 0,
    };
  } catch (error) {
    console.error('Error fetching contributor stats:', error);
    return { totalContributions: 0, totalWins: 0, activeEntries: 0 };
  }
}

// Helper function for paginated pool fetching
export async function getPoolsPaginated(page = 0, pageSize = 12, filters = {}) {
  try {
    let query = supabase
      .from('pools')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    
    if (filters.city && filters.city !== 'all') {
      query = query.eq('city', filters.city);
    }
    
    const { data, error, count } = await query;
    
    return { data, error, count, hasMore: count > (page + 1) * pageSize };
  } catch (error) {
    console.error('Error fetching paginated pools:', error);
    return { data: [], error, count: 0, hasMore: false };
  }
}
