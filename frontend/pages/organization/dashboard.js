import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function OrganizationDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [org, setOrg] = useState(null);
  const [stats, setStats] = useState({ total_pools: 0, total_members: 0, total_raised: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkOrg(); }, []);

  async function checkOrg() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-12">
        <div className="container mx-auto px-4"><div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold">Organization Dashboard</h1><p className="text-blue-100">Create private pools for your members</p></div><Link href="/create-pool?type=private" className="bg-white text-blue-600 px-6 py-2 rounded-full font-semibold">+ Create Private Pool</Link></div></div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6"><div className="flex justify-between"><div><p className="text-gray-500">Private Pools</p><p className="text-3xl font-bold text-blue-600">{stats.total_pools}</p></div><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-xl">🏊</span></div></div></div>
          <div className="bg-white rounded-2xl shadow-md p-6"><div className="flex justify-between"><div><p className="text-gray-500">Total Members</p><p className="text-3xl font-bold text-green-600">{stats.total_members}</p></div><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><span className="text-xl">👥</span></div></div></div>
          <div className="bg-white rounded-2xl shadow-md p-6"><div className="flex justify-between"><div><p className="text-gray-500">Total Raised</p><p className="text-3xl font-bold text-yellow-600">ETB {stats.total_raised.toLocaleString()}</p></div><div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center"><span className="text-xl">💰</span></div></div></div>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-md p-6"><h2 className="font-bold text-lg mb-4">🏢 Organization Info</h2><p className="font-semibold">{org?.business_name || profile?.full_name}</p><p className="text-gray-500 text-sm mt-1">✓ Verified Organization</p><div className="mt-4 p-3 bg-blue-50 rounded-lg"><p className="text-sm text-blue-800">Private pools visible only to your members. Perfect for staff savings, team building, and member engagement.</p></div></div>
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white"><h3 className="text-xl font-bold mb-3">🎯 Create Private Pools</h3><ul className="space-y-2 text-sm"><li>✓ Member-only access</li><li>✓ 10% commission for you</li><li>✓ Build community saving</li><li>✓ Easy management</li></ul><Link href="/create-pool?type=private" className="inline-block mt-4 bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">Create Private Pool →</Link></div>
        </div>
      </div>
    </div>
  );
}
