// lib/adminCheck.js - FINAL FIXED VERSION
import { supabase } from './supabase';

/**
 * Check if current user is admin
 * Returns: { isAdmin: boolean, user: object, profile: object }
 */
export async function checkAdminStatus() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { isAdmin: false, user: null, profile: null };
    }

    // Check profile role first (most reliable)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, user_type, full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    // Check admins table - FIXED: only select existing columns
    let adminRecord = null;
    try {
      const { data, error: adminError } = await supabase
        .from('admins')
        .select('is_active')  // Remove 'role as admin_role' - column doesn't exist
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!adminError) {
        adminRecord = data;
      }
    } catch (err) {
      // Table might not exist - ignore
      console.warn('Admin table check failed:', err.message);
    }

    const isAdmin = profile?.role === 'admin' || 
                    profile?.user_type === 'admin' || 
                    adminRecord?.is_active === true;

    return { 
      isAdmin, 
      user, 
      profile,
      adminRecord: adminRecord || null
    };
  } catch (error) {
    console.error('Admin check error:', error);
    return { isAdmin: false, user: null, profile: null };
  }
}

/**
 * Require admin access - redirects to dashboard if not admin
 */
export async function requireAdmin(router) {
  const { isAdmin } = await checkAdminStatus();
  
  if (!isAdmin) {
    router.push('/dashboard');
    return false;
  }
  return true;
}

/**
 * Simple check if user is admin
 */
export async function isAdmin() {
  const { isAdmin: adminStatus } = await checkAdminStatus();
  return adminStatus;
}
