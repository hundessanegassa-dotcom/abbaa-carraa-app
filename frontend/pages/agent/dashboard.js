import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import AgentDashboard from '../../components/dashboards/AgentDashboard';

export default function AgentDashboardPage() {
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
    
    if (profile?.user_type !== 'agent' && profile?.role !== 'agent') {
      router.push('/dashboard');
    }
  }

  return <AgentDashboard />;
}
