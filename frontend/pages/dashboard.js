import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import IndividualDashboard from '../components/dashboards/IndividualDashboard';
import Head from 'next/head';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkUserAndRedirect();
  }, []);

  async function checkUserAndRedirect() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Get user profile to determine role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_type, role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const role = profile?.user_type || profile?.role || 'individual';
      setUserRole(role);

      // Redirect to role-specific dashboard
      if (role === 'agent') {
        router.push('/agent/dashboard');
      } else if (role === 'vendor') {
        router.push('/vendor/dashboard');
      } else if (role === 'organization') {
        router.push('/organization/dashboard');
      } else if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        // Individual user stays on dashboard
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking user:', error);
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

  return (
    <>
      <Head>
        <title>My Dashboard - Abbaa Carraa</title>
        <meta name="description" content="Track your contributions, wins, and badges" />
      </Head>
      <IndividualDashboard />
    </>
  );
}
