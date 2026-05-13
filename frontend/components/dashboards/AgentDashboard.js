import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../DashboardLayout';
import toast from 'react-hot-toast';

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [stats, setStats] = useState({ 
    total_pools: 0, 
    active_pools: 0, 
    completed_pools: 0, 
    total_raised: 0, 
    total_commission: 0, 
    pending_commission: 0,
    paid_commission: 0
  });
  const [recentPools, setRecentPools] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [recentContributions, setRecentContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentData();
  }, []);

  async function loadAgentData() {
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
      setProfile(profile);
      
      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setAgentData(agent);
      
      const agentFilter = agent ? { agent_id: agent.id } : { created_by: user.id };
      const { data: pools } = await supabase
        .from('pools')
        .select('*')
        .match(agentFilter)
        .order('created_at', { ascending: false });

      const activePools = pools?.filter(p => p.status === 'active') || [];
      const completedPools = pools?.filter(p => p.status === 'completed') || [];
      const totalRaised = pools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;

      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status, net_amount')
        .eq('user_id', user.id);

      const pendingCommission = commissions?.filter(c => c.status === 'pending')?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const paidCommission = commissions?.filter(c => c.status === 'paid')?.reduce((sum, c) => sum + (c.net_amount || c.amount || 0), 0) || 0;
      const totalCommission = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      const { data: deliveries } = await supabase
        .from('pools')
        .select('*, winner:winner_id(full_name, phone)')
        .match(agentFilter)
        .eq('status', 'completed')
        .eq('prize_delivered', false)
        .order('completed_at', { ascending: false });

      setPendingDeliveries(deliveries || []);

      const poolIds = pools?.map(p => p.id) || [];
      if (poolIds.length > 0) {
        const { data: contributions } = await supabase
          .from('contributions')
          .select('*, user:user_id(full_name), pool:pool_id(prize_name)')
          .in('pool_id', poolIds)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10);
        setRecentContributions(contributions || []);
      }

      setStats({ 
        total_pools: pools?.length || 0, 
        active_pools: activePools.length, 
        completed_pools: completedPools.length, 
        total_raised: totalRaised, 
        total_commission: totalCommission, 
        pending_commission: pendingCommission,
        paid_commission: paidCommission
      });
      
      setRecentPools(pools?.slice(0, 5) || []);
      
    } catch (error) { 
      console.error('Error loading agent data:', error); 
      toast.error('Failed to load dashboard data');
    } finally { 
      setLoading(false); 
    }
  }

  async function markDeliveryComplete(poolId) {
    try {
      const { error } = await supabase
        .from('pools')
        .update({ prize_delivered: true, delivered_at: new Date().toISOString() })
        .eq('id', poolId);
      
      if (error) throw error;
      
      toast.success('Prize delivery confirmed!');
      loadAgentData();
    } catch (error) {
      console.error('Delivery error:', error);
      toast.error('Failed to update delivery status');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading agent dashboard...</p>
      </div>
    );
  }

  const charityAmount = stats.total_commission * 0.02;
  const livesImpacted = Math.floor(charityAmount / 100);
  const commissionRate = 10;

  return (
    <DashboardLayout 
      title={`Welcome, Agent ${profile?.full_name?.split(' ')[0] || ''}! 🤝`} 
      subtitle="Create pools, earn 10% commission, deliver prizes" 
      icon="🤝" 
      bgGradient="from-yellow-600 to-orange-600" 
      user={user} 
      profile={profile}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-4 text-center hover:shadow-lg transition">
          <p className="text-gray-500 text-xs">Total Pools</p>
          <p className="text-2xl font-bold text-orange-600">{stats.total_pools}</p>
          <p className="text-xs text-green-600">{stats.active_pools} active</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4 text-center">
          <p className="text-gray-500 text-xs">Completed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.completed_pools}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4 text-center">
          <p className="text-gray-500 text-xs">Total Raised</p>
          <p className="text-base font-bold text-green-600">ETB {stats.total_raised.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4 text-center">
          <p className="text-gray-500 text-xs">Commission Earned</p>
          <p className="text-base font-bold text-yellow-600">ETB {stats.total_commission.toLocaleString()}</p>
          {stats.pending_commission > 0 && <p className="text-xs text-orange-500">{stats.pending_commission.toLocaleString()} pending</p>}
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4 text-center">
          <p className="text-gray-500 text-xs">Paid Commission</p>
          <p className="text-2xl font-bold text-green-600">ETB {stats.paid_commission.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-4 text-white text-center">
          <p className="text-xs opacity-90">Charity Impact</p>
          <p className="text-2xl font-bold">💚 {livesImpacted}</p>
          <p className="text-[10px] opacity-80">from {commissionRate}% commission</p>
        </div>
      </div>

      {/* Agent Explanation Card */}
      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
        <div className="flex items-start gap-3">
          <div className="text-3xl">🤝</div>
          <div>
            <h3 className="font-bold text-yellow-800 text-base">Your Agent Dashboard</h3>
            <p className="text-sm text-yellow-700 mt-1">
              As an <strong>Agent</strong>, you can create prize pools and earn <strong>{commissionRate}% commission</strong> on every pool that completes successfully.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <div className="flex items-center gap-2 text-xs text-yellow-700"><span className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">✓</span>Create pools with your own prizes</div>
              <div className="flex items-center gap-2 text-xs text-yellow-700"><span className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">✓</span>Earn 10% commission on total collection</div>
              <div className="flex items-center gap-2 text-xs text-yellow-700"><span className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">✓</span>Deliver prizes to winners</div>
              <div className="flex items-center gap-2 text-xs text-yellow-700"><span className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">✓</span>Track your earnings and pending commissions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 shadow-md border text-center">
          <div className="text-2xl mb-1">💰</div>
          <h3 className="font-bold text-gray-800">How Commission Works</h3>
          <p className="text-xs text-gray-600 mt-2">You earn <strong className="text-green-600">10%</strong> of target amount</p>
          <p className="text-xs text-gray-500 mt-1">Example: 500,000 ETB pool</p>
          <p className="text-lg font-bold text-yellow-600">= 50,000 ETB</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-md border text-center">
          <div className="text-2xl mb-1">📋</div>
          <h3 className="font-bold text-gray-800">Payment Timeline</h3>
          <ul className="mt-2 text-xs text-gray-600 space-y-1">
            <li>✓ Pool completes → Winner selected</li>
            <li>✓ Prize delivered → You confirm</li>
            <li>✓ Commission paid within <strong>14 days</strong></li>
          </ul>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-md border text-center">
          <div className="text-2xl mb-1">📊</div>
          <h3 className="font-bold text-gray-800">Success Tip</h3>
          <p className="text-xs text-gray-600 mt-2">High-quality prize images and detailed descriptions attract more participants!</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Link href="/create-pool" className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-3 text-white text-center hover:shadow-lg transition transform hover:-translate-y-0.5">
          <div className="text-xl">📦</div>
          <p className="text-xs font-semibold">Create Pool</p>
        </Link>
        <Link href="/agent/analytics" className="bg-white rounded-xl p-3 shadow-md border text-center hover:shadow-lg transition">
          <div className="text-xl">📊</div>
          <p className="text-xs font-semibold text-gray-700">Analytics</p>
        </Link>
        <Link href="/agent/earnings" className="bg-white rounded-xl p-3 shadow-md border text-center hover:shadow-lg transition">
          <div className="text-xl">💰</div>
          <p className="text-xs font-semibold text-gray-700">Earnings</p>
        </Link>
        <Link href="/agent/training" className="bg-white rounded-xl p-3 shadow-md border text-center hover:shadow-lg transition">
          <div className="text-xl">🎓</div>
          <p className="text-xs font-semibold text-gray-700">Training</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pools */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">📋 Your Recent Pools</h2>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {recentPools.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-gray-400 text-sm">No pools created yet</p>
                <Link href="/create-pool" className="text-orange-600 text-xs mt-2 inline-block">Create your first pool →</Link>
              </div>
            ) : (
              <div className="divide-y">
                {recentPools.map(pool => {
                  const progress = (pool.current_amount / pool.target_amount) * 100;
                  const potentialCommission = pool.target_amount * 0.10;
                  return (
                    <div key={pool.id} className="p-3 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-sm">{pool.prize_name}</h3>
                          <p className="text-xs text-gray-500">Target: ETB {pool.target_amount?.toLocaleString()}</p>
                          <p className="text-xs text-green-600">Potential: ETB {potentialCommission.toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          pool.status === 'active' ? 'bg-green-100 text-green-800' : 
                          pool.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pool.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                      </div>
                      <Link href={`/pools/${pool.id}`} className="text-orange-600 text-xs mt-2 inline-block hover:underline">View Details →</Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pending Deliveries */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">🚚 Pending Deliveries</h2>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {pendingDeliveries.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-gray-400 text-sm">No pending deliveries</p>
                <p className="text-xs text-gray-300">All prizes delivered!</p>
              </div>
            ) : (
              <div className="divide-y">
                {pendingDeliveries.map(pool => (
                  <div key={pool.id} className="p-3 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-sm">{pool.prize_name}</h3>
                        <p className="text-xs text-gray-600">Winner: {pool.winner?.full_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">Phone: {pool.winner?.phone || 'N/A'}</p>
                        <p className="text-[10px] text-gray-400">Completed: {new Date(pool.completed_at).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => markDeliveryComplete(pool.id)}
                        className="bg-green-600 text-white px-2 py-1 rounded-lg text-[10px] hover:bg-green-700 transition"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Contributions */}
      {recentContributions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🔄 Recent Contributions</h2>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="divide-y">
              {recentContributions.slice(0, 5).map(contribution => (
                <div key={contribution.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{contribution.user?.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">Pool: {contribution.pool?.prize_name}</p>
                    <p className="text-[10px] text-gray-400">{new Date(contribution.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-green-600 text-sm">ETB {contribution.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tips for Success */}
      <div className="mt-6 bg-white rounded-2xl shadow-md p-4">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">💡 Tips for Success</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-green-600">✓</span> Use high-quality prize images</li>
          <li className="flex items-start gap-2"><span className="text-green-600">✓</span> Write detailed prize descriptions</li>
          <li className="flex items-start gap-2"><span className="text-green-600">✓</span> Respond to winners within 48 hours</li>
          <li className="flex items-start gap-2"><span className="text-green-600">✓</span> Deliver prizes promptly for repeat business</li>
          <li className="flex items-start gap-2"><span className="text-green-600">✓</span> Share your pools on social media</li>
        </ul>
      </div>

      {/* Charity Section */}
      <div className="mt-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2"><span className="text-2xl">💚</span><h3 className="font-bold">Making a Difference</h3></div>
        <p className="text-sm opacity-95">2% of your commissions support kidney & heart disease treatment in Ethiopia.</p>
        {charityAmount > 0 && <p className="text-sm mt-2">Your contribution: ETB {charityAmount.toLocaleString()} | Lives impacted: {livesImpacted}</p>}
      </div>
    </DashboardLayout>
  );
}
