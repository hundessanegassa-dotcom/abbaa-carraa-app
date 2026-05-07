import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import OrganizationDashboard from '../../components/dashboards/OrganizationDashboard';

export default function OrganizationDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profile?.user_type !== 'organization' && profile?.role !== 'organization') {
      router.push('/dashboard');
    }
  }

  return <OrganizationDashboard />;
}
