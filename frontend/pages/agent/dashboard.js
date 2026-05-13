import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAgent();
  }, []);

  async function checkAgent() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(profile || {});

      if (!profile) {
        router.push('/register');
        return;
      }

      if (profile.agreement_accepted !== true) {
        router.push('/register');
        return;
      }

      if (profile.user_type !== 'agent' && profile.role !== 'agent') {
        router.push('/dashboard');
        return;
      }

    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Agent Dashboard" 
      subtitle="Create pools and earn 10% commission"
      icon="🤝"
      bgGradient="from-yellow-600 to-orange-600"
      user={user}
      profile={profile}
    >
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Welcome, Agent {profile?.full_name?.split(' ')[0] || ''}!</h2>
        <p className="text-gray-600">Your agent dashboard content goes here.</p>
      </div>
    </DashboardLayout>
  );
}
