import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../DashboardLayout';

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
  const [charityStats, setCharityStats] = useState({ total_charity: 0, lives_impacted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAgent(); }, []);

  async function checkAgent() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profile);
    if (profile?.user_type !== 'agent' && profile?.role !== 'agent') { 
      router.push('/dashboard'); 
      return; 
    }
    await loadAgentData(user.id);
  }

  async function loadAgentData(userId) {
    try {
      // Get agent record
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (agentError && agentError.code !== 'PGRST116') throw agentError;
      setAgentData(agent);

      // Get agent's pools
      const agentFilter = agent ? { agent_id: agent.id } : { created_by: userId };
      const { data: pools } = await supabase
        .from('pools')
        .select('*')
        .match(agentFilter)
        .order('created_at', { ascending: false });

      const activePools = pools?.filter(p => p.status === 'active') || [];
      const completedPools = pools?.filter(p => p.status === 'completed') || [];
      const totalRaised = pools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;

      // Get commission data
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status, net_amount, withholding_tax')
        .eq('user_id', userId)
        .eq('commission_type', 'agent');

      const pendingCommission = commissions?.filter(c => c.status === 'pending')?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const paidCommission = commissions?.filter(c => c.status === 'paid')?.reduce((sum, c) => sum + (c.net_amount || c.amount || 0), 0) || 0;
      const totalCommission = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      // Get pending deliveries (pools that completed but prize not delivered)
      const { data: deliveries } = await supabase
        .from('pools')
        .select('*, winner:winner_id(full_name, phone)')
        .match({ ...agentFilter, status: 'completed', prize_delivered: false })
        .order('completed_at', { ascending: false });

      setPendingDeliveries(deliveries || []);

      // Calculate charity contribution (2% of agent's commission)
      const totalCharity = totalCommission * 0.02;
      setCharityStats({
        total_charity: totalCharity,
        lives_impacted: Math.floor(totalCharity / 100) // Approximate: 100 ETB can help one person
      });

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
    } finally { 
      setLoading(false); 
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Agent Dashboard" 
      subtitle="Create pools, track earnings, and deliver prizes" 
      icon="🤝" 
      bgGradient="from-yellow-600 to-orange-600" 
      user={user} 
      profile={profile}
    >
      {/* Stats Cards - 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Total Pools</p>
              <p className="text-xl md:text-3xl font-bold text-orange-600">{stats.total_pools}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">📦</span>
            </div>
          </div>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-green-600">{stats.active_pools} active</span>
            <span className="text-gray-300">|</span>
            <span className="text-blue-600">{stats.completed_pools} completed</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Total Raised</p>
              <p className="text-xl md:text-3xl font-bold text-blue-600">ETB {stats.total_raised.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Total Commission</p>
              <p className="text-xl md:text-3xl font-bold text-yellow-600">ETB {stats.total_commission.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">💎</span>
            </div>
          </div>
          {stats.pending_commission > 0 && (
            <p className="text-xs text-orange-500 mt-1">{stats.pending_commission.toLocaleString()} ETB pending</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Paid Commission</p>
              <p className="text-xl md:text-3xl font-bold text-green-600">ETB {stats.paid_commission.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-md p-4 md:p-6 text-white group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">Charity Impact</p>
              <p className="text-xl md:text-2xl font-bold">💚 {Math.floor(charityStats.lives_impacted)} lives</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">❤️</span>
            </div>
          </div>
          <p className="text-xs opacity-80 mt-1">2% of commissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content - 2 columns on desktop */}
        <div className="lg:col-span-2 space-y-6">
          {/* Your Prize Pools */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b bg-gray-50">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-lg font-bold flex items-center gap-2">📋 Your Prize Pools</h2>
                <Link href="/create-pool" className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-600 transition">
                  + Create New Pool
                </Link>
              </div>
            </div>
            <div className="p-4 md:p-6">
              {recentPools.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-3">📦</div>
                  <p className="text-gray-400">No pools created yet</p>
                  <Link href="/create-pool" className="text-orange-600 text-sm mt-3 inline-block hover:underline">
                    Create your first pool →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPools.map(pool => {
                    const progress = (pool.current_amount / pool.target_amount) * 100;
                    return (
                      <div key={pool.id} className="border rounded-xl p-4 hover:shadow-md transition">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800">{pool.prize_name}</h3>
                            <p className="text-sm text-gray-500">Target: ETB {pool.target_amount?.toLocaleString()}</p>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              pool.status === 'active' ? 'bg-green-100 text-green-800' : 
                              pool.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {pool.status === 'active' ? 'Active' : pool.status === 'completed' ? 'Completed' : pool.status}
                            </span>
                            <Link href={`/pools/${pool.id}`} className="text-orange-600 text-sm ml-3 hover:underline">
                              View Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {stats.total_pools > 5 && (
                    <div className="text-center pt-2">
                      <Link href="/agent/my-pools" className="text-orange-600 text-sm hover:underline">
                        View all {stats.total_pools} pools →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pending Deliveries */}
          {pendingDeliveries.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b bg-yellow-50">
                <h2 className="text-lg font-bold flex items-center gap-2">🚚 Pending Deliveries</h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="space-y-3">
                  {pendingDeliveries.map(pool => (
                    <div key={pool.id} className="border border-yellow-200 rounded-xl p-4 bg-yellow-50/30">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{pool.prize_name}</h3>
                          <p className="text-sm text-gray-600">Winner: {pool.winner?.full_name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Completed: {new Date(pool.completed_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
                            Mark Delivered
                          </button>
                          <Link href={`/pools/${pool.id}`} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition">
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1 column on desktop */}
        <div className="space-y-6">
          {/* How You Earn */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-4 md:p-6 text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">💰 How You Earn</h3>
            <div className="space-y-3">
              <div className="bg-white/20 rounded-lg p-3">
                <p className="font-semibold text-lg">10% Commission</p>
                <p className="text-sm opacity-90">On every pool you create</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="font-semibold text-lg">Example:</p>
                <p className="text-sm opacity-90">Pool target 500,000 ETB → You earn 50,000 ETB</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="font-semibold text-lg">Payment Timeline:</p>
                <p className="text-sm opacity-90">Paid within 14 days after winner receives prize</p>
              </div>
            </div>
            <Link href="/create-pool" className="inline-block mt-5 bg-white text-orange-600 px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition text-center w-full">
              + Create New Pool
            </Link>
          </div>

          {/* Tips for Success */}
          <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">💡 Tips for Success</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Upload high-quality prize images</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Offer discounts to non-winners (5-50%)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Share pools on social media</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Respond to winner within 48 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Deliver prize promptly for repeat business</span>
              </li>
            </ul>
          </div>

          {/* Charity Section */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-4 md:p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💚</span>
              <h3 className="text-xl font-bold">Making a Difference</h3>
            </div>
            <p className="text-sm opacity-95 mb-3">
              2% of your commissions support Ethiopians fighting <strong>kidney disease</strong> and <strong>heart disease</strong>.
            </p>
            {charityStats.total_charity > 0 && (
              <div className="bg-white/20 rounded-xl p-3 mb-3">
                <p className="text-xs opacity-90">Your contribution to health:</p>
                <p className="text-xl font-bold">ETB {charityStats.total_charity.toLocaleString()}</p>
                <p className="text-xs opacity-75">Lives impacted: {charityStats.lives_impacted}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm border-t border-white/20 pt-3 mt-2">
              <span>💚</span>
              <span className="text-xs">Every pool you create saves lives</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">📊 Agent Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Commission rate:</span>
                <span className="font-medium text-green-600">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total participants:</span>
                <span className="font-medium">{stats.total_raised > 0 ? 'Active' : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Success rate:</span>
                <span className="font-medium">{stats.completed_pools > 0 ? Math.round((stats.completed_pools / stats.total_pools) * 100) : 0}%</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <Link href="/agent/earnings" className="text-orange-600 text-sm hover:underline flex justify-between">
                  View full earnings report →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
