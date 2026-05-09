
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

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

    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('user_type, role')
      .eq('id', user.id)
      .single();

    console.log('Dashboard - User Profile:', profile);

    if (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
      return;
    }

    // Check user_type first, then role
    const userType = profile?.user_type || profile?.role || 'individual';
    
    console.log('Detected user type:', userType);

    // Redirect based on user type
    switch(userType) {
      case 'agent':
        console.log('Redirecting to Agent Dashboard');
        router.replace('/agent/dashboard');
        break;
      case 'vendor':
        console.log('Redirecting to Vendor Dashboard');
        router.replace('/vendor/dashboard');
        break;
      case 'organization':
        console.log('Redirecting to Organization Dashboard');
        router.replace('/organization/dashboard');
        break;
      case 'admin':
        console.log('Redirecting to Admin Dashboard');
        router.replace('/admin/dashboard');
        break;
      default:
        console.log('Showing Individual Dashboard');
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

  // Only reaches here for individual users
  const IndividualDashboard = require('../components/dashboards/IndividualDashboard').default;
  return <IndividualDashboard />;
}
