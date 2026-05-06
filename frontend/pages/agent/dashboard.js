import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AgentDashboard() {
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total_pools: 0, active_pools: 0, total_raised: 0, total_commission: 0, pending_commission: 0 });
  const [recentPools, setRecentPools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAgent(); }, []);

  async function checkAgent() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profile);
    if (profile?.user_type !== 'agent') { router.push('/dashboard'); return; }
    await loadAgentData(user.id);
  }

  async function loadAgentData(userId) {
    try {
      const { data: agentData } = await supabase.from('agents').select('*').eq('user_id', userId).single();
      setAgent(agentData);
      const { data: pools } = await supabase.from('pools').select('*').eq('agent_id', agentData?.id).order('created_at', { ascending: false });
      const activePools = pools?.filter(p => p.status === 'active') || [];
      const totalRaised = pools?.reduce((sum, p) => sum + p.current_amount, 0) || 0;
      const { data: commissions } = await supabase.from('commissions').select('amount, status').eq('agent_id', agentData?.id);
      const pendingCommission = commissions?.filter(c => c.status === 'pending')?.reduce((sum, c) => sum + c.amount, 0) || 0;
      const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
      setStats({ total_pools: pools?.length || 0, active_pools: activePools.length, total_raised: totalRaised, total_commission: totalCommission, pending_commission: pendingCommission });
      setRecentPools(pools?.slice(0, 5) || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div><h1 className="text-3xl font-bold">Agent Dashboard</h1><p className="text-yellow-100 mt-1">Create pools and earn 10% commission</p></div>
            <Link href="/create-pool" className="bg-white text-orange-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition shadow-lg">+ Create New Pool</Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6"><div className="flex justify-between"><div><p className="text-gray-500">Total Pools</p><p className="text-3xl font-bold text-orange-600">{stats.total_pools}</p></div><div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center"><span className="text-xl">📦</span></div></div></div>
          <div className="bg-white rounded-2xl shadow-md p-6"><div className="flex justify-between"><div><p className="text-gray-500">Active Pools</p><p className="text-3xl font-bold text-green-600">{stats.active_pools}</p></div><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><span className="text-xl">🔥</span></div></div></div>
          <div className="bg-white rounded-2xl shadow-md p-6"><div className="flex justify-between"><div><p className="text-gray-500">Total Raised</p><p className="text-3xl font-bold text-blue-600">ETB {stats.total_raised.toLocaleString()}</p></div><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-xl">💰</span></div></div></div>
          <div className="bg-white rounded-2xl shadow-md p-6"><div className="flex justify-between"><div><p className="text-gray-500">Commission Earned</p><p className="text-3xl font-bold text-yellow-600">ETB {stats.total_commission.toLocaleString()}</p></div><div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center"><span className="text-xl">💎</span></div></div>{stats.pending_commission > 0 && <p className="text-sm text-orange-500 mt-2">{stats.pending_commission.toLocaleString()} ETB pending</p>}</div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md overflow-hidden"><div className="px-6 py-4 border-b bg-gray-50"><h2 className="text-lg font-bold">📋 Your Prize Pools</h2></div><div className="p-6">{recentPools.length === 0 ? (<div className="text-center py-8"><p className="text-gray-400">No pools created yet</p><Link href="/create-pool" className="text-orange-600 text-sm mt-2 inline-block">Create your first pool →</Link></div>) : (<div className="space-y-3">{recentPools.map(pool => (<div key={pool.id} className="border rounded-xl p-4 flex justify-between items-center"><div><h3 className="font-bold">{pool.prize_name}</h3><p className="text-sm text-gray-500">Target: ETB {pool.target_amount?.toLocaleString()}</p></div><div className="text-right"><span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{pool.status}</span><Link href={`/pools/${pool.id}`} className="text-orange-600 text-sm ml-3">View →</Link></div></div>))}</div>)}</div></div>

          <div className="space-y-6"><div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white"><h3 className="text-xl font-bold mb-3">💰 How You Earn</h3><ul className="space-y-2 text-sm"><li>✓ 10% commission on every pool</li><li>✓ Paid when pool completes</li><li>✓ Create high-value prizes</li><li>✓ Offer discounts to participants</li></ul></div><div className="bg-white rounded-2xl shadow-md p-6"><h3 className="font-bold mb-2">💡 Pro Tips</h3><ul className="text-sm text-gray-600 space-y-1"><li>📱 Share pools on WhatsApp</li><li>🎁 Offer attractive discounts</li><li>🏆 List desirable prizes</li><li>📸 Add real product images</li></ul></div></div>
        </div>
      </div>
    </div>
  );
}
