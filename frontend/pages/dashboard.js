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

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, role')
      .eq('id', user.id)
      .single();

    // Redirect to role-specific dashboard
    if (profile?.user_type === 'agent' || profile?.role === 'agent') {
      router.push('/agent/dashboard');
      return;
    } else if (profile?.user_type === 'vendor' || profile?.role === 'vendor') {
      router.push('/vendor/dashboard');
      return;
    } else if (profile?.user_type === 'organization' || profile?.role === 'organization') {
      router.push('/organization/dashboard');
      return;
    } else if (profile?.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    } else {
      // Individual user stays on dashboard
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return <IndividualDashboard />;
}
