import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import VendorDashboard from '../../components/dashboards/VendorDashboard';

export default function VendorDashboardPage() {
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
      .single();
    
    if (profile?.user_type !== 'vendor' && profile?.role !== 'vendor') {
      router.push('/dashboard');
    }
  }

  return <VendorDashboard />;
}
