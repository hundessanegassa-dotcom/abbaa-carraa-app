import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../DashboardLayout';

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total_pools: 0, active_pools: 0, completed_pools: 0, total_raised: 0, total_commission: 0, pending_commission: 0 });
  const [recentPools, setRecentPools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAgent(); }, []);

  async function checkAgent() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(profile);
    if (profile?.user_type !== 'agent') { router.push('/dashboard'); return; }
    await loadAgentData(user.id);
  }

  async function loadAgentData(userId) {
    try {
      const { data: agent } = await supabase.from('agents').select('*').eq('user_id', userId).maybeSingle();
      const { data: pools } = await supabase.from('pools').select('*').eq('agent_id', agent?.id).order('created_at', { ascending: false });
      const activePools = pools?.filter(p => p.status === 'active') || [];
      const completedPools = pools?.filter(p => p.status === 'completed') || [];
      const totalRaised = pools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
      const { data: commissions } = await supabase.from('commissions').select('amount, status').eq('agent_id', agent?.id);
      const pendingCommission = commissions?.filter(c => c.status === 'pending')?.reduce((sum, c) => sum + c.amount, 0) || 0;
      const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
      setStats({ total_pools: pools?.length || 0, active_pools: activePools.length, completed_pools: completedPools.length, total_raised: totalRaised, total_commission: totalCommission, pending_commission: pendingCommission });
      setRecentPools(pools?.slice(0, 5) || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div></div>;
  }

  const charityAmount = stats.total_commission * 0.02;
  const livesImpacted = Math.floor(charityAmount / 100);

  return (
    <DashboardLayout title={`Welcome, Agent ${profile?.full_name?.split(' ')[0] || ''}! 🤝`} subtitle="Create pools, earn 10% commission" icon="🤝" bgGradient="from-yellow-600 to-orange-600" user={user} profile={profile}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Total Pools</p><p className="text-2xl font-bold text-orange-600">{stats.total_pools}</p><p className="text-xs text-green-600">{stats.active_pools} active</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Completed Pools</p><p className="text-2xl font-bold text-blue-600">{stats.completed_pools}</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Total Raised</p><p className="text-2xl font-bold text-green-600">ETB {stats.total_raised.toLocaleString()}</p></div>
        <div className="bg-white rounded-2xl shadow-md p-5"><p className="text-gray-500 text-sm">Commission Earned</p><p className="text-2xl font-bold text-yellow-600">ETB {stats.total_commission.toLocaleString()}</p>{stats.pending_commission > 0 && <p className="text-xs text-orange-500">{stats.pending_commission.toLocaleString()} pending</p>}</div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-5 text-white"><p className="text-sm opacity-90">Charity Impact</p><p className="text-2xl font-bold">💚 {livesImpacted} lives</p><p className="text-xs opacity-80">2% of commissions</p></div>
      </div>

      {/* Agent Explanation */}
      <div className="mb-8 p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🤝</div>
          <div>
            <h3 className="font-bold text-yellow-800 text-lg">Your Agent Dashboard</h3>
            <p className="text-sm text-yellow-700 mt-1">
              As an Agent, you create prize pools and earn <strong>10% commission</strong> on every pool!
              When you create a pool, we add 20% to your target amount (10% for you, 10% for platform).
              You deliver the prize to the winner and receive your commission.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">✓ Create pools</span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">✓ Earn 10% commission</span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">✓ Manage your pools</span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">✓ Track deliveries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Link href="/create-pool" className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-5 text-white text-center hover:shadow-xl transition transform hover:-translate-y-1">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="font-bold">Create Prize Pool</h3>
          <p className="text-sm opacity-90 mt-1">Start earning 10% commission</p>
        </Link>
        <Link href="/agent/analytics" className="bg-white rounded-2xl p-5 shadow-md border text-center hover:shadow-lg transition">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-bold text-gray-800">Pool Analytics</h3>
          <p className="text-sm text-gray-500 mt-1">Track performance metrics</p>
        </Link>
        <Link href="/agent/training" className="bg-white rounded-2xl p-5 shadow-md border text-center hover:shadow-lg transition">
          <div className="text-3xl mb-2">🎓</div>
          <h3 className="font-bold text-gray-800">Agent Training</h3>
          <p className="text-sm text-gray-500 mt-1">Learn best practices</p>
        </Link>
      </div>

      {/* Recent Pools */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Your Recent Pools</h2>
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {recentPools.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-gray-400">No pools created yet</p>
              <Link href="/create-pool" className="text-orange-600 text-sm mt-2 inline-block">Create your first pool →</Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentPools.map(pool => {
                const progress = (pool.current_amount / pool.target_amount) * 100;
                return (
                  <div key={pool.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div><h3 className="font-bold text-gray-800">{pool.prize_name}</h3><p className="text-sm text-gray-500">Target: ETB {pool.target_amount?.toLocaleString()}</p></div>
                      <span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100 text-green-800' : pool.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>{pool.status}</span>
                    </div>
                    <div className="mt-2"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progress</span><span>{Math.round(progress)}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div></div></div>
                    <Link href={`/pools/${pool.id}`} className="text-orange-600 text-sm mt-2 inline-block hover:underline">View Details →</Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
