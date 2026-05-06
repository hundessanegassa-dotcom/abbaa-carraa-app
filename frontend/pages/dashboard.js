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
    if (profile?.user_type === 'agent') {
      router.push('/agent/dashboard');
    } else if (profile?.user_type === 'vendor') {
      router.push('/vendor/dashboard');
    } else if (profile?.user_type === 'organization') {
      router.push('/organization/dashboard');
    } else if (profile?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      // Individual user stays on dashboard
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // If we get here, it's the Individual Dashboard
  return <IndividualDashboard />;
}
