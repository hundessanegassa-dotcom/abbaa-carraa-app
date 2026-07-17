// lib/supabase.js - COMPLETE WITH ALL HELPER FUNCTIONS
import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ FIX: Only create client if credentials exist
// This prevents build-time errors on Vercel
const hasCredentials = supabaseUrl && supabaseAnonKey;

// Validate environment variables
if (!hasCredentials) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
  if (typeof window !== 'undefined') {
    console.warn('Supabase credentials missing. Some features may not work.');
  }
}

// ✅ FIX: Create client only if credentials exist
export const supabase = hasCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey, {
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
          eventsPerSecond: 2,
        },
      },
    })
  : null;

// ✅ FIX: Create a fallback client for build time
// This allows the build to succeed even without env vars
export const supabaseClient = supabase || {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      order: () => ({
        limit: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};

// ✅ FIX: Export a helper to check if Supabase is configured
export const isSupabaseConfigured = () => hasCredentials;

// ============================================
// IMAGE OPTIMIZATION FUNCTIONS
// ============================================

export const compressImage = async (file, maxWidth = 1024, maxHeight = 1024, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const optimizeImage = (url, options = {}) => {
  if (!url) return null;
  const { width = 800, quality = 80, format = 'webp' } = options;
  
  if (url.includes('supabase.co')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${quality}&format=${format}`;
  }
  return url;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function checkSupabaseConnection() {
  if (!supabase) {
    return { connected: false, error: 'Supabase not configured' };
  }
  try {
    const { error } = await supabase.from('pools').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { connected: true, error: null };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { connected: false, error: error.message };
  }
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

export async function getProfile(userId) {
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
}

export async function updateProfile(userId, updates) {
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
}

// ============================================
// POOL FUNCTIONS
// ============================================

let poolsCache = null;
let poolsCacheTime = 0;
const CACHE_DURATION = 60000;

export async function getPoolsWithCache() {
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  
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
    
    if (poolsCache) {
      console.warn('Using cached data due to error:', error);
      return { data: poolsCache, error: null, fromCache: true };
    }
    
    return { data: null, error };
  } catch (error) {
    console.error('Error fetching pools:', error);
    if (poolsCache) {
      return { data: poolsCache, error: null, fromCache: true };
    }
    return { data: null, error };
  }
}

export function invalidatePoolsCache() {
  poolsCache = null;
  poolsCacheTime = 0;
}

export async function getPoolsPaginated(page = 0, pageSize = 12, filters = {}) {
  if (!supabase) return { data: [], error: 'Supabase not configured', count: 0, hasMore: false };
  
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
    
    return { 
      data: data || [], 
      error, 
      count: count || 0, 
      hasMore: (count || 0) > (page + 1) * pageSize 
    };
  } catch (error) {
    console.error('Error fetching paginated pools:', error);
    return { data: [], error, count: 0, hasMore: false };
  }
}

// ============================================
// STATS FUNCTIONS
// ============================================

export async function getContributorStats(userId) {
  if (!supabase) return { totalContributions: 0, totalWins: 0, activeEntries: 0 };
  
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

// ============================================
// ADMIN FUNCTIONS
// ============================================

export async function isUserAdmin(userId) {
  if (!supabase) return false;
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profile?.role === 'admin') return true;
    
    const { data: adminRecord } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    return !!adminRecord;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function getPlatformStats() {
  if (!supabase) return null;
  
  try {
    const [
      { count: totalUsers },
      { data: agents },
      { data: vendors },
      { data: organizations },
      { data: pools },
      { data: contributions },
      { data: commissions }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('agents').select('*'),
      supabase.from('vendors').select('*'),
      supabase.from('organizations').select('*'),
      supabase.from('pools').select('*'),
      supabase.from('contributions').select('amount, status'),
      supabase.from('commissions').select('amount, status')
    ]);
    
    const totalVolume = contributions?.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const totalCommissionPaid = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0;
    const pendingCommission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;
    
    return {
      totalUsers: totalUsers || 0,
      totalAgents: agents?.length || 0,
      totalVendors: vendors?.length || 0,
      totalOrganizations: organizations?.length || 0,
      totalPools: pools?.length || 0,
      activePools: pools?.filter(p => p.status === 'active').length || 0,
      completedPools: pools?.filter(p => p.status === 'completed').length || 0,
      totalVolume,
      totalCommissionPaid,
      pendingCommission,
      platformRevenue: totalVolume * 0.10,
      charityFund: totalVolume * 0.02
    };
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return null;
  }
}

// ============================================
// FORMATTING FUNCTIONS
// ============================================

export function formatCurrency(amount) {
  if (!amount) return 'ETB 0';
  return `ETB ${amount.toLocaleString()}`;
}

export function calculatePoolProgress(currentAmount, targetAmount) {
  if (!targetAmount || targetAmount === 0) return 0;
  const totalCollection = targetAmount * 1.2;
  return Math.min((currentAmount / totalCollection) * 100, 100);
}

export function calculateTotalSeats(targetAmount, entryFee) {
  if (!targetAmount || !entryFee) return 0;
  const totalCollection = targetAmount * 1.2;
  return Math.floor(totalCollection / entryFee);
}

export function calculateCommission(targetAmount) {
  if (!targetAmount) return 0;
  const totalCollection = targetAmount * 1.2;
  return totalCollection * 0.2;
}

// ============================================
// RETRY FUNCTION
// ============================================

export async function withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      if (error.message?.includes('timeout') || error.message?.includes('connect') || error.message?.includes('network')) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default supabase;
