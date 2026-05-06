import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';

export default function OrganizationDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkOrg(); }, []);

  async function checkOrg() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profile);
    if (profile?.user_type !== 'organization') { router.push('/dashboard'); return; }
    await loadOrgData(user.id);
  }

  async function loadOrgData(userId) {
    try {
      const { data: orgData } = await supabase.from('organizations').select('*').eq('user_id', userId).single();
      setOrg(orgData);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <DashboardLayout title="Organization Dashboard" subtitle="Create private pools for your members" icon="🏢" bgGradient="from-blue-600 to-cyan-600" user={user} profile={profile}>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-md p-6"><h2 className="font-bold text-lg mb-4">🏢 Organization Info</h2><p className="font-semibold">{org?.business_name || 'Your Organization'}</p><p className="text-gray-500 text-sm mt-1">✓ Verified Organization</p><div className="mt-4 p-3 bg-blue-50 rounded-lg"><p className="text-sm text-blue-800">Create private pools for your employees/members only. Perfect for staff savings, team building, and member engagement.</p></div></div>
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white"><h3 className="text-xl font-bold mb-3">🎯 Create Private Pools</h3><ul className="space-y-2 text-sm"><li>✓ Member-only access</li><li>✓ No commission fees</li><li>✓ Build community saving</li><li>✓ Easy management</li></ul><Link href="/create-pool?type=private" className="inline-block mt-4 bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">Create Private Pool →</Link></div>
      </div>
    </DashboardLayout>
  );
}
