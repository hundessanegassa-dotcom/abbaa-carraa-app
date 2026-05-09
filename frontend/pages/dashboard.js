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
      router.replace('/login');
      return;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, role')
      .eq('id', user.id)
      .maybeSingle();

    // Check if user is admin
    const isAdmin = profile?.role === 'admin' || profile?.user_type === 'admin';
    
    if (isAdmin) {
      const { data: adminCheck } = await supabase
        .from('admins')
        .select('is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (adminCheck) {
        router.replace('/admin/dashboard');
        return;
      }
    }

    // Redirect other roles
    if (profile?.user_type === 'agent') {
      router.replace('/agent/dashboard');
      return;
    } else if (profile?.user_type === 'vendor') {
      router.replace('/vendor/dashboard');
      return;
    } else if (profile?.user_type === 'organization') {
      router.replace('/organization/dashboard');
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
