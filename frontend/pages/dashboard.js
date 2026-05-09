import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import IndividualDashboard from '../components/dashboards/IndividualDashboard';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndRedirect();
  }, []);

  async function checkUserAndRedirect() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Get user profile with role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('user_type, role, is_admin_verified')
      .eq('id', user.id)
      .maybeSingle();

    // Security: Check if admin role is legitimate
    const isAdmin = profile?.role === 'admin' || profile?.user_type === 'admin';
    
    if (isAdmin) {
      // Additional security check for admin
      const { data: adminCheck } = await supabase
        .from('admins')
        .select('id, is_active')
        .eq('user_id', user.id)
        .single();
      
      // Only allow access if admin is verified in admins table
      if (adminCheck?.is_active === true) {
        router.push('/admin/dashboard');
        return;
      } else {
        // If someone tried to manually set role to admin without proper record
        console.error('Unauthorized admin access attempt');
        router.push('/dashboard');
        return;
      }
    }

    // Redirect other roles
    if (profile?.user_type === 'agent') {
      router.push('/agent/dashboard');
      return;
    } else if (profile?.user_type === 'vendor') {
      router.push('/vendor/dashboard');
      return;
    } else if (profile?.user_type === 'organization') {
      router.push('/organization/dashboard');
      return;
    } else {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return <IndividualDashboard />;
}
