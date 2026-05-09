import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../DashboardLayout';

export default function IndividualDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [activeEntries, setActiveEntries] = useState([]);
  const [recentWins, setRecentWins] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkUser(); }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    await Promise.all([
      fetchProfile(user.id),
      fetchContributions(user.id),
      fetchActiveEntries(user.id),
      fetchRecentWins(user.id),
      fetchFeaturedPools()
    ]);
    setLoading(false);
  }

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data || {});
  }

  async function fetchContributions(userId) {
    const { data } = await supabase
      .from('contributions')
      .select('amount, created_at, pools(prize_name)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);
    setContributions(data || []);
  }

  async function fetchActiveEntries(userId) {
    const { data } = await supabase
      .from('contributions')
      .select('*, pools(prize_name, target_amount, current_amount, status)')
      .eq('user_id', userId)
      .eq('status', 'completed');
    const active = data?.filter(item => item.pools?.status === 'active') || [];
    setActiveEntries(active);
  }

  async function fetchRecentWins(userId) {
    const { data } = await supabase
      .from('pools')
      .select('prize_name, target_amount, completed_at')
      .eq('winner_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5);
    setRecentWins(data || []);
  }

  async function fetchFeaturedPools() {
    const { data } = await supabase
      .from('pools')
      .select('*')
      .eq('status', 'active')
      .eq('is_featured', true)
      .limit(3);
    setFeaturedPools(data || []);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const totalContributions = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalWins = recentWins.length;
  const activeCount = activeEntries.length;

  return (
    <DashboardLayout 
      title={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'User'}!`}
      subtitle="Join pools, win prizes, and make a difference"
      icon="🎯"
      bgGradient="from-green-600 to-teal-500"
      user={user}
      profile={profile}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Contributions</p>
              <p className="text-2xl font-bold text-green-600">ETB {totalContributions.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">💰</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Wins</p>
              <p className="text-2xl font-bold text-yellow-600">{totalWins}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">🏆</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Entries</p>
              <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">🎯</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-md p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Charity Impact</p>
              <p className="text-2xl font-bold">💚 {Math.floor(totalContributions * 0.02 / 100)} lives</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">❤️</div>
          </div>
        </div>
      </div>

      {/* Phase 1 - Available Now */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">Phase 1</span>
          <h2 className="text-xl font-bold text-gray-800">Available Now</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link href="/listings" className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-5 text-white hover:shadow-xl transition transform hover:-translate-y-1">
            <div className="text-3xl mb-2">🎁</div>
            <h3 className="font-bold text-lg">Browse Prize Pools</h3>
            <p className="text-sm opacity-90 mt-1">Join active pools and win amazing prizes</p>
            <div className="mt-3 text-xs opacity-75">12 active pools →</div>
          </Link>
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-bold text-gray-800">Make a Contribution</h3>
            <p className="text-sm text-gray-500 mt-1">As low as 100 ETB per entry</p>
            <p className="text-xs text-green-600 mt-2">✓ 2% goes to charity</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-bold text-gray-800">Track Your Wins</h3>
            <p className="text-sm text-gray-500 mt-1">View all your prizes and delivery status</p>
            {totalWins > 0 && <p className="text-xs text-yellow-600 mt-2">✓ You've won {totalWins} prize(s)!</p>}
          </div>
        </div>
      </div>

      {/* Phase 2 - Coming Soon */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">Phase 2</span>
          <h2 className="text-xl font-bold text-gray-800">Coming Soon</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 opacity-70">
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="font-bold text-gray-800">Loyalty Rewards</h3>
            <p className="text-sm text-gray-500 mt-1">Earn points for every contribution</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-bold text-gray-800">Referral Program</h3>
            <p className="text-sm text-gray-500 mt-1">Invite friends and earn bonuses</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-bold text-gray-800">Mobile App</h3>
            <p className="text-sm text-gray-500 mt-1">Play on the go with our app</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Recent Activity</h2>
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {contributions.length === 0 && recentWins.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No activity yet</p>
              <Link href="/listings" className="text-green-600 text-sm mt-2 inline-block">Start playing →</Link>
            </div>
          ) : (
            <div className="divide-y">
              {contributions.slice(0, 5).map((c, i) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <div><p className="font-medium">Contributed to {c.pools?.prize_name}</p><p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p></div>
                  <span className="font-bold text-green-600">ETB {c.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
