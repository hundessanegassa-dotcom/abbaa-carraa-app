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
  const [badges, setBadges] = useState([]);
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
      fetchFeaturedPools(),
      fetchBadges(user.id)
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
      .select('prize_name, target_amount, completed_at, image_url')
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
      .limit(6);
    setFeaturedPools(data || []);
  }

  async function fetchBadges(userId) {
    const { data } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId);
    
    if (data && data.length > 0) {
      setBadges(data);
    } else {
      const { count: contribCount } = await supabase
        .from('contributions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      const newBadges = [];
      if (contribCount > 0) {
        newBadges.push({ badge_type: 'first_contribution', name: 'First Step', icon: '🌟' });
      }
      const { count: winCount } = await supabase
        .from('pools')
        .select('*', { count: 'exact', head: true })
        .eq('winner_id', userId);
      if (winCount > 0) {
        newBadges.push({ badge_type: 'first_win', name: 'Winner!', icon: '🏆' });
      }
      setBadges(newBadges);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  const totalContributions = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalWins = recentWins.length;
  const activeCount = activeEntries.length;
  const charityAmount = totalContributions * 0.02;
  const livesImpacted = Math.floor(charityAmount / 100);

  return (
    <DashboardLayout 
      title={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'Player'}! 🎯`}
      subtitle="Join pools, contribute, and win amazing prizes"
      icon="🎯"
      bgGradient="from-green-600 to-teal-500"
      user={user}
      profile={profile}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Contributions</p>
              <p className="text-2xl font-bold text-green-600">ETB {totalContributions.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">💰</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Wins</p>
              <p className="text-2xl font-bold text-yellow-600">{totalWins}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">🏆</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Entries</p>
              <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">🎯</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-md p-5 text-white group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Charity Impact</p>
              <p className="text-2xl font-bold">💚 {livesImpacted} lives</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition">❤️</div>
          </div>
          <p className="text-xs opacity-80 mt-1">2% of your contributions</p>
        </div>
      </div>

      {/* Welcome Explanation */}
      <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🎯</div>
          <div>
            <h3 className="font-bold text-blue-800 text-lg">How Digital ETA Works for You</h3>
            <p className="text-sm text-blue-700 mt-1">
              As an Individual participant, you can browse active prize pools, make contributions (as low as 100 ETB), 
              get ticket numbers, and win amazing prizes! Every contribution you make helps charities.
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">✓ Browse by category</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">✓ Track entries</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">✓ View win history</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">✓ Earn badges</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Pools to Join */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">🔥 Featured Pools</h2>
          <Link href="/listings" className="text-green-600 text-sm hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredPools.slice(0, 3).map(pool => (
            <div key={pool.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
              <img src={pool.image_url || '/images/placeholder.jpg'} alt={pool.prize_name} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-gray-800">{pool.prize_name}</h3>
                <p className="text-sm text-gray-500">Target: ETB {pool.target_amount?.toLocaleString()}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round((pool.current_amount / pool.target_amount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min((pool.current_amount / pool.target_amount) * 100, 100)}%` }}></div>
                  </div>
                </div>
                <Link href={`/pools/${pool.id}`} className="mt-3 inline-block text-green-600 text-sm font-semibold">Join Pool →</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Entries */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Your Active Entries</h2>
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {activeEntries.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-5xl mb-3">🎯</div>
              <p className="text-gray-400">No active entries yet</p>
              <Link href="/listings" className="text-green-600 text-sm mt-2 inline-block">Browse pools →</Link>
            </div>
          ) : (
            <div className="divide-y">
              {activeEntries.map(entry => {
                const progress = (entry.pools?.current_amount / entry.pools?.target_amount) * 100;
                return (
                  <div key={entry.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-800">{entry.pools?.prize_name}</h3>
                        <p className="text-sm text-gray-500">Your contribution: ETB {entry.amount?.toLocaleString()}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Pool Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                      </div>
                    </div>
                    <Link href={`/pools/${entry.pool_id}`} className="text-green-600 text-sm mt-2 inline-block hover:underline">View Details →</Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Wins */}
      {recentWins.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Your Recent Wins</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentWins.map(win => (
              <div key={win.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200 flex items-center gap-4">
                <div className="text-4xl">🏆</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{win.prize_name}</h3>
                  <p className="text-sm text-green-600 font-semibold">ETB {win.target_amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Won on {new Date(win.completed_at).toLocaleDateString()}</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Claimed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges & Achievements */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">⭐ Your Badges</h2>
          <Link href="/dashboard/badges" className="text-green-600 text-sm hover:underline">View all →</Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {badges.length === 0 ? (
            <p className="text-gray-400 text-sm">Start contributing to earn badges!</p>
          ) : (
            badges.map((badge, i) => (
              <div key={i} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-md">
                <span className="text-lg">{badge.icon || '⭐'}</span>
                <span className="text-sm font-semibold">{badge.name || badge.badge_type?.replace('_', ' ')}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* How to Win Guide */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">🎯 How to Win</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center"><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div><p className="text-sm">Browse Pools</p></div>
          <div className="text-center"><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div><p className="text-sm">Make Contribution</p></div>
          <div className="text-center"><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div><p className="text-sm">Get Ticket Number</p></div>
          <div className="text-center"><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">4</div><p className="text-sm">Watch Live Draw</p></div>
          <div className="text-center"><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">5</div><p className="text-sm">Win & Celebrate! 🎉</p></div>
        </div>
        <Link href="/listings" className="inline-block mt-5 bg-white text-green-600 px-6 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition w-full text-center">
          Start Playing Now →
        </Link>
      </div>
    </DashboardLayout>
  );
}
