// lib/adminCheck.js - ENHANCED with better error handling
import { supabase } from './supabase';

export async function checkAdminStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAdmin: false, error: 'No user' };

    // Check profile role - using maybeSingle to prevent 406 errors
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile check error:', profileError);
    }

    // Check admin record - using maybeSingle to prevent 406 errors
    const { data: adminRecord, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (adminError) {
      console.error('Admin record check error:', adminError);
    }

    const isAdmin = profile?.role === 'admin' || !!adminRecord;
    
    return { 
      isAdmin, 
      role: profile?.role || null,
      isSuperAdmin: !!adminRecord
    };
  } catch (error) {
    console.error('Admin check error:', error);
    return { isAdmin: false, error: error.message };
  }
}

export async function requireAdmin(context) {
  const { isAdmin } = await checkAdminStatus();
  
  if (!isAdmin) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
  
  return { props: {} };
}
