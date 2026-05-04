import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode.react';

export default function AgentDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [stats, setStats] = useState({
    total_pools: 0,
    active_pools: 0,
    completed_pools: 0,
    total_contributions: 0,
    total_commission: 0,
    pending_commission: 0,
    paid_commission: 0,
    total_participants: 0,
    conversion_rate: 0,
    avg_views: 0
  });
  const [recentPools, setRecentPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoolForQR, setSelectedPoolForQR] = useState(null);
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    checkAgent();
  }, []);

  async function checkAgent() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, user_type')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'agent') {
      router.push('/dashboard');
      return;
    }

    await loadAgentData(user.id);
  }

  async function loadAgentData(userId) {
    try {
      // Get agent profile
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (agentData) setAgent(agentData);

      // Get pools stats
      const { data: pools } = await supabase
        .from('pools')
        .select('*')
        .eq('agent_id', agentData?.id)
        .order('created_at', { ascending: false });

      const activePools = pools?.filter(p => p.status === 'active') || [];
      const completedPools = pools?.filter(p => p.status === 'completed') || [];
      
      // Get contributions stats
      const poolIds = pools?.map(p => p.id) || [];
      let totalContributions = 0;
      let uniqueParticipants = 0;
      let totalViews = 0;

      if (poolIds.length > 0) {
        const { data: contributions } = await supabase
          .from('contributions')
          .select('amount, user_id')
          .in('pool_id', poolIds)
          .eq('status', 'completed');

        totalContributions = contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
        uniqueParticipants = [...new Set(contributions?.map(c => c.user_id) || [])].length;

        // Get pool views (if you have a views table)
        const { data: views } = await supabase
          .from('pool_views')
          .select('pool_id')
          .in('pool_id', poolIds);
        
        if (views) {
          totalViews = views.length;
          const avgViews = pools?.length ? (totalViews / pools.length).toFixed(1) : 0;
          const conversionRate = totalViews > 0 ? ((uniqueParticipants / totalViews) * 100).toFixed(1) : 0;
          setStats(prev => ({ ...prev, avg_views: avgViews, conversion_rate: conversionRate }));
        }
      }

      // Get commission stats
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status')
        .eq('agent_id', agentData?.id);

      const pendingCommission = commissions?.filter(c => c.status === 'pending')?.reduce((sum, c) => sum + c.amount, 0) || 0;
      const paidCommission = commissions?.filter(c => c.status === 'paid')?.reduce((sum, c) => sum + c.amount, 0) || 0;
      const totalCommission = pendingCommission + paidCommission;

      setStats({
        total_pools: pools?.length || 0,
        active_pools: activePools.length,
        completed_pools: completedPools.length,
        total_contributions: totalContributions,
        total_commission: totalCommission,
        pending_commission: pendingCommission,
        paid_commission: paidCommission,
        total_participants: uniqueParticipants,
        avg_views: stats.avg_views,
        conversion_rate: stats.conversion_rate
      });

      setRecentPools(pools?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading agent data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function requestCommissionPayout() {
    if (stats.pending_commission <= 0) {
      toast.error('No pending commission to withdraw');
      return;
    }

    setRequestingPayout(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('commission_requests')
        .insert({
          agent_id: agent?.id,
          user_id: user?.id,
          amount: stats.pending_commission,
          status: 'pending',
          requested_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success(`Payout request for ETB ${stats.pending_commission.toLocaleString()} submitted!`);
      
      // Update local state
      setStats(prev => ({ ...prev, pending_commission: 0 }));
    } catch (error) {
      console.error('Payout request error:', error);
      toast.error('Failed to submit payout request');
    } finally {
      setRequestingPayout(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header with Agent Info */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agent Dashboard</h1>
            {agent && (
              <p className="text-gray-500 mt-1">
                Welcome back, {agent.business_name || agent.user_id?.slice(0, 8)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Verification Status</p>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              agent?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {agent?.verified ? '✓ Verified' : '⏳ Pending Verification'}
            </span>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-2xl font-bold text-green-600">{stats.total_pools}</p>
            <p className="text-gray-500">Total Pools</p>
            <div className="text-sm text-gray-400 mt-1">
              {stats.active_pools} active | {stats.completed_pools} completed
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-2xl font-bold text-green-600">ETB {stats.total_contributions.toLocaleString()}</p>
            <p className="text-gray-500">Total Contributions</p>
            <div className="text-sm text-gray-400 mt-1">{stats.total_participants} participants</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-2xl mb-2">💎</div>
            <p className="text-2xl font-bold text-yellow-600">ETB {stats.total_commission.toLocaleString()}</p>
            <p className="text-gray-500">Total Commission</p>
            <div className="text-sm text-gray-400 mt-1">
              {stats.pending_commission > 0 ? (
                <span className="text-orange-600">{stats.pending_commission.toLocaleString()} ETB pending</span>
              ) : (
                'All paid'
              )}
            </div>
            {stats.pending_commission > 0 && (
              <button
                onClick={requestCommissionPayout}
                disabled={requestingPayout}
                className="mt-3 w-full bg-green-600 text-white py-1 rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400"
              >
                {requestingPayout ? 'Processing...' : 'Request Payout →'}
              </button>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-2xl mb-2">📈</div>
            <p className="text-2xl font-bold text-green-600">{Math.round((stats.completed_pools / stats.total_pools) * 100) || 0}%</p>
            <p className="text-gray-500">Completion Rate</p>
            <div className="text-sm text-gray-400 mt-1">Success rate</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">📈 Pool Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-1">Average Views per Pool</p>
              <p className="text-2xl font-bold">{stats.avg_views || '--'}</p>
              <p className="text-xs text-gray-400">Based on pool page visits</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-1">Conversion Rate (Views → Contributions)</p>
              <p className="text-2xl font-bold">{stats.conversion_rate || '--'}%</p>
              <p className="text-xs text-gray-400">Participants ÷ Views × 100</p>
            </div>
          </div>
        </div>

        {/* Shareable QR Code for Pools */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">📱 Share Your Pools</h2>
          <p className="text-gray-600 mb-4">Share your pools via WhatsApp, QR code, or social media.</p>
          <div className="flex flex-wrap gap-4">
            {recentPools.slice(0, 3).map(pool => (
              <div key={pool.id} className="border rounded-lg p-4 text-center w-48">
                <p className="text-sm font-semibold truncate">{pool.prize_name}</p>
                <p className="text-xs text-gray-500 mb-2">ETB {pool.contribution_amount}/entry</p>
                <button
                  onClick={() => setSelectedPoolForQR(selectedPoolForQR === pool.id ? null : pool.id)}
                  className="w-full bg-gray-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-700 mb-2"
                >
                  {selectedPoolForQR === pool.id ? 'Hide QR' : 'Show QR Code'}
                </button>
                {selectedPoolForQR === pool.id && (
                  <div className="mt-3 flex justify-center">
                    <QRCode 
                      value={`${window.location.origin}/pools/${pool.id}`}
                      size={100}
                      level="H"
                    />
                  </div>
                )}
                <button
                  onClick={() => {
                    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
                    const text = `🎁 Join my pool to win ${pool.prize_name}! Only ETB ${pool.contribution_amount} to enter. Let's win together!`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + poolUrl)}`, '_blank');
                  }}
                  className="w-full bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                >
                  Share via WhatsApp
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Pools Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-bold p-6 pb-0">📋 Recent Pools</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prize</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raised</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentPools.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No pools created yet. 
                      <Link href="/create-pool" className="text-green-600 ml-2 hover:underline">
                        Create your first pool →
                      </Link>
                    </td>
                  </tr>
                ) : (
                  recentPools.map(pool => {
                    const progress = (pool.current_amount / pool.target_amount) * 100;
                    return (
                      <tr key={pool.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{pool.prize_name}</td>
                        <td className="px-6 py-4">ETB {pool.target_amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="w-24">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-1.5">
                              <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">ETB {pool.current_amount.toLocaleString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{pool.participants_count || 0}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            pool.status === 'active' ? 'bg-green-100 text-green-800' : 
                            pool.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {pool.status === 'active' ? '🟢 Active' : 
                             pool.status === 'completed' ? '✅ Completed' : '⏸️ Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/pools/${pool.id}`} className="text-green-600 hover:text-green-700 text-sm font-medium">
                            View Details →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/create-pool" className="bg-green-600 text-white rounded-lg p-6 text-center hover:bg-green-700 transition">
            <div className="text-3xl mb-2">➕</div>
            <h3 className="font-bold text-lg">Create New Pool</h3>
            <p className="text-sm opacity-90">List a new prize and start earning</p>
          </Link>
          <Link href="/agent/listings" className="bg-blue-600 text-white rounded-lg p-6 text-center hover:bg-blue-700 transition">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="font-bold text-lg">Manage Listings</h3>
            <p className="text-sm opacity-90">View and edit your product listings</p>
          </Link>
          <Link href="/agent/participants" className="bg-purple-600 text-white rounded-lg p-6 text-center hover:bg-purple-700 transition">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-bold text-lg">View Participants</h3>
            <p className="text-sm opacity-90">See who joined your pools</p>
          </Link>
        </div>

        {/* Tips for Success */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-3">💡 Tips to Maximize Your Success</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p className="text-sm text-gray-700"><strong>Share your pools</strong> on social media and WhatsApp groups</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p className="text-sm text-gray-700"><strong>Offer discounts</strong> to non-winners to attract more participants</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p className="text-sm text-gray-700"><strong>Respond quickly</strong> to participant questions to build trust</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p className="text-sm text-gray-700"><strong>Create high-value prizes</strong> that attract more attention</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p className="text-sm text-gray-700"><strong>Add real images</strong> of your products (not just stock photos)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <p className="text-sm text-gray-700"><strong>Use QR codes</strong> to share pools in print materials or shops</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
