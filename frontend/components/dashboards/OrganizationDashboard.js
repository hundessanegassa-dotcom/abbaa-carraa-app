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
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ total_pools: 0, total_members: 0, total_raised: 0, total_commission: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkOrg(); }, []);

  async function checkOrg() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(profile);
    if (profile?.user_type !== 'organization') { router.push('/dashboard'); return; }
    await loadOrgData(user.id);
  }

  async function loadOrgData(userId) {
    try {
      const { data: orgData } = await supabase.from('organizations').select('*').eq('user_id', userId).maybeSingle();
      setOrg(orgData);
      const { data: membersData } = await supabase.from('organization_members').select('*, profiles(full_name, email)').eq('organization_id', orgData?.id).eq('status', 'approved');
      setMembers(membersData || []);
      const { data: pools } = await supabase.from('pools').select('*').eq('organization_id', orgData?.id);
      const totalRaised = pools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
      const { data: commissions } = await supabase.from('commissions').select('amount').eq('organization_id', orgData?.id);
      const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
      setStats({ total_pools: pools?.length || 0, total_members: membersData?.length || 0, total_raised: totalRaised, total_commission: totalCommission });
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  const charityAmount = stats.total_commission * 0.02;
  const livesImpacted = Math.floor(charityAmount / 100);

  return (
    <DashboardLayout title={`Welcome, ${org?.business_name || profile?.full_name?.split(' ')[0] || 'Organization'}! 🏢`} subtitle="Create private pools for your members" icon="🏢" bgGradient="from-blue-600 to-cyan-600" user={user} profile={profile}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Private Pools</p><p className="text-2xl font-bold text-blue-600">{stats.total_pools}</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Total Members</p><p className="text-2xl font-bold text-green-600">{stats.total_members}</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Total Raised</p><p className="text-2xl font-bold text-yellow-600">ETB {stats.total_raised.toLocaleString()}</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Commission Earned</p><p className="text-2xl font-bold text-purple-600">ETB {stats.total_commission.toLocaleString()}</p></div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-5 text-white"><p className="text-sm opacity-90">Charity Impact</p><p className="text-2xl font-bold">💚 {livesImpacted} lives</p><p className="text-xs opacity-80">2% of commissions</p></div>
      </div>

      <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
        <div className="flex items-start gap-4"><div className="text-4xl">🏢</div><div><h3 className="font-bold text-blue-800 text-lg">Your Organization Dashboard</h3><p className="text-sm text-blue-700 mt-1">As an Organization, you create <strong>private pools</strong> visible only to your members. You earn <strong>10% commission</strong> on pools you create. Add your members, create exclusive pools, and build community savings. Perfect for staff savings, team building, and member engagement!</p><div className="flex flex-wrap gap-3 mt-3"><span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">✓ Create private pools</span><span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">✓ Manage members</span><span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">✓ Earn 10% commission</span><span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">✓ Track activity</span></div></div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Link href="/create-pool?type=private" className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-5 text-white text-center hover:shadow-xl transition"><div className="text-3xl mb-2">🏊</div><h3 className="font-bold">Create Private Pool</h3><p className="text-sm opacity-90">Exclusive for members</p></Link>
        <Link href="/organization/members" className="bg-white rounded-2xl p-5 shadow-md border text-center hover:shadow-lg transition"><div className="text-3xl mb-2">👥</div><h3 className="font-bold text-gray-800">Manage Members</h3><p className="text-sm text-gray-500">Add and approve members</p></Link>
        <Link href="/organization/analytics" className="bg-white rounded-2xl p-5 shadow-md border text-center hover:shadow-lg transition"><div className="text-3xl mb-2">📊</div><h3 className="font-bold text-gray-800">Member Analytics</h3><p className="text-sm text-gray-500">Track participation</p></Link>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6"><h3 className="font-bold text-gray-800 mb-2">🏢 Organization Info</h3><p className="font-semibold text-lg">{org?.business_name || profile?.full_name}</p><p className="text-gray-500 text-sm mt-1">✓ Verified Organization • {stats.total_members} members • {stats.total_pools} private pools</p><div className="mt-4 p-3 bg-blue-50 rounded-lg"><p className="text-sm text-blue-800">Private pools are visible only to your members. Perfect for staff savings, team building, and member engagement activities.</p></div></div>
    </DashboardLayout>
  );
}
