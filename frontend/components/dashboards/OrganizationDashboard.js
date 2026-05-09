import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../DashboardLayout';

export default function OrganizationDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [org, setOrg] = useState(null);
  const [stats, setStats] = useState({ total_pools: 0, total_members: 0, total_raised: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkOrg(); }, []);

  async function checkOrg() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profile);
    await loadOrgData(user.id);
  }

  async function loadOrgData(userId) {
    try {
      const { data: orgData } = await supabase.from('organizations').select('*').eq('user_id', userId).single();
      setOrg(orgData);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <DashboardLayout title={`Welcome, ${org?.business_name || profile?.full_name?.split(' ')[0] || 'Organization'}!`} subtitle="Create private pools for your members" icon="🏢" bgGradient="from-blue-600 to-cyan-600" user={user} profile={profile}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Private Pools</p><p className="text-2xl font-bold text-blue-600">{stats.total_pools}</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Total Members</p><p className="text-2xl font-bold text-green-600">{stats.total_members}</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Total Raised</p><p className="text-2xl font-bold text-yellow-600">ETB {stats.total_raised.toLocaleString()}</p></div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-5 text-white"><p className="text-sm opacity-90">Charity Impact</p><p className="text-2xl font-bold">💚 {Math.floor(stats.total_raised * 0.02 / 100)} lives</p></div>
      </div>

      <div className="mb-10"><div className="flex items-center gap-3 mb-4"><span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">Phase 1</span><h2 className="text-xl font-bold text-gray-800">What You Can Do Now</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link href="/create-pool?type=private" className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-5 text-white hover:shadow-xl transition"><div className="text-3xl mb-2">🏊</div><h3 className="font-bold text-lg">Create Private Pool</h3><p className="text-sm opacity-90 mt-1">Pools visible only to members</p><div className="mt-3 text-xs">Create now →</div></Link>
        <div className="bg-white rounded-2xl p-5 shadow-md border"><div className="text-3xl mb-2">👥</div><h3 className="font-bold text-gray-800">Manage Members</h3><p className="text-sm text-gray-500 mt-1">Add and approve members</p></div>
        <div className="bg-white rounded-2xl p-5 shadow-md border"><div className="text-3xl mb-2">💰</div><h3 className="font-bold text-gray-800">Track Earnings</h3><p className="text-sm text-gray-500 mt-1">View your 10% commission</p></div>
      </div></div>

      <div className="mb-10"><div className="flex items-center gap-3 mb-4"><span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">Phase 2</span><h2 className="text-xl font-bold text-gray-800">Coming Soon</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 opacity-70">
        <div className="bg-gray-50 rounded-2xl p-5 border"><div className="text-3xl mb-2">📊</div><h3 className="font-bold">Member Analytics</h3><p className="text-sm text-gray-500">Track member participation</p></div>
        <div className="bg-gray-50 rounded-2xl p-5 border"><div className="text-3xl mb-2">🎓</div><h3 className="font-bold">Training Portal</h3><p className="text-sm text-gray-500">Resources for members</p></div>
        <div className="bg-gray-50 rounded-2xl p-5 border"><div className="text-3xl mb-2">📱</div><h3 className="font-bold">Member App</h3><p className="text-sm text-gray-500">Dedicated member experience</p></div>
      </div></div>

      <div className="bg-white rounded-2xl shadow-md p-6"><h3 className="font-bold text-gray-800 mb-2">🏢 Organization Info</h3><p className="font-semibold">{org?.business_name || profile?.full_name}</p><p className="text-gray-500 text-sm mt-1">✓ Verified Organization</p><div className="mt-4 p-3 bg-blue-50 rounded-lg"><p className="text-sm text-blue-800">Private pools visible only to your members. Perfect for staff savings, team building, and member engagement.</p></div></div>
    </DashboardLayout>
  );
}
