import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../DashboardLayout';

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total_pools: 0, active_pools: 0, total_raised: 0, total_commission: 0 });
  const [recentPools, setRecentPools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAgent(); }, []);

  async function checkAgent() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profile);
    await loadAgentData(user.id);
  }

  async function loadAgentData(userId) {
    try {
      const { data: agent } = await supabase.from('agents').select('*').eq('user_id', userId).single();
      const { data: pools } = await supabase.from('pools').select('*').eq('agent_id', agent?.id).order('created_at', { ascending: false });
      const activePools = pools?.filter(p => p.status === 'active') || [];
      const totalRaised = pools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
      const { data: commissions } = await supabase.from('commissions').select('amount, status').eq('agent_id', agent?.id);
      const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
      setStats({ total_pools: pools?.length || 0, active_pools: activePools.length, total_raised: totalRaised, total_commission: totalCommission });
      setRecentPools(pools?.slice(0, 5) || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  }

  return (
    <DashboardLayout title={`Welcome, Agent ${profile?.full_name?.split(' ')[0] || ''}!`} subtitle="Create pools, earn 10% commission" icon="🤝" bgGradient="from-yellow-600 to-orange-600" user={user} profile={profile}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Total Pools</p><p className="text-2xl font-bold text-orange-600">{stats.total_pools}</p><p className="text-xs text-green-600 mt-1">{stats.active_pools} active</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Total Raised</p><p className="text-2xl font-bold text-blue-600">ETB {stats.total_raised.toLocaleString()}</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Commission Earned</p><p className="text-2xl font-bold text-yellow-600">ETB {stats.total_commission.toLocaleString()}</p></div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-5 text-white"><p className="text-sm opacity-90">Charity Impact</p><p className="text-2xl font-bold">💚 {Math.floor(stats.total_commission * 0.02 / 100)} lives</p></div>
      </div>

      {/* Phase 1 - Available Now */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4"><span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">Phase 1</span><h2 className="text-xl font-bold text-gray-800">What You Can Do Now</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link href="/create-pool" className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-5 text-white hover:shadow-xl transition">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="font-bold text-lg">Create Prize Pool</h3>
            <p className="text-sm opacity-90 mt-1">Set up a new pool and earn 10% commission</p>
            <div className="mt-3 text-xs">Start earning →</div>
          </Link>
          <div className="bg-white rounded-2xl p-5 shadow-md border">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-bold text-gray-800">Manage Your Pools</h3>
            <p className="text-sm text-gray-500 mt-1">Track progress, view contributors</p>
            {stats.active_pools > 0 && <p className="text-xs text-green-600 mt-2">✓ {stats.active_pools} active pool(s)</p>}
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md border">
            <div className="text-3xl mb-2">🚚</div>
            <h3 className="font-bold text-gray-800">Deliver Prizes</h3>
            <p className="text-sm text-gray-500 mt-1">Complete deliveries to earn commission</p>
          </div>
        </div>
      </div>

      {/* Phase 2 - Coming Soon */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4"><span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">Phase 2</span><h2 className="text-xl font-bold text-gray-800">Coming Soon</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 opacity-70">
          <div className="bg-gray-50 rounded-2xl p-5 border"><div className="text-3xl mb-2">📊</div><h3 className="font-bold">Advanced Analytics</h3><p className="text-sm text-gray-500">Detailed pool performance</p></div>
          <div className="bg-gray-50 rounded-2xl p-5 border"><div className="text-3xl mb-2">📱</div><h3 className="font-bold">Mobile Management</h3><p className="text-sm text-gray-500">Manage pools from phone</p></div>
          <div className="bg-gray-50 rounded-2xl p-5 border"><div className="text-3xl mb-2">🎓</div><h3 className="font-bold">Agent Training</h3><p className="text-sm text-gray-500">Tips to maximize earnings</p></div>
        </div>
      </div>

      {/* Your Recent Pools */}
      <div><h2 className="text-xl font-bold text-gray-800 mb-4">📋 Your Recent Pools</h2><div className="bg-white rounded-2xl shadow-md overflow-hidden">{recentPools.length === 0 ? <div className="p-8 text-center"><p className="text-gray-400">No pools yet</p><Link href="/create-pool" className="text-orange-600 text-sm">Create your first pool →</Link></div> : <div className="divide-y">{recentPools.map(pool => (<div key={pool.id} className="p-4 flex justify-between items-center"><div><p className="font-medium">{pool.prize_name}</p><p className="text-xs text-gray-400">Target: ETB {pool.target_amount?.toLocaleString()}</p></div><span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{pool.status}</span></div>))}</div>}</div></div>
    </DashboardLayout>
  );
}
