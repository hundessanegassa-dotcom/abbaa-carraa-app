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

    // Check profile role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, user_type, full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    // Check admins table
    const { data: adminRecord, error: adminError } = await supabase
      .from('admins')
      .select('is_active, role as admin_role')
      .eq('user_id', user.id)
      .maybeSingle();

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
 * Use this in pages that require admin access
 */
export async function requireAdmin(router) {
  const { isAdmin } = await checkAdminStatus();
  
  if (!isAdmin) {
    router.push('/dashboard');
    return false;
  }
  return true;
}
