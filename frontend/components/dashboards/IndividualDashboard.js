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
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    await Promise.all([
      fetchProfile(user.id),
      fetchContributions(user.id),
      fetchActiveEntries(user.id),
      fetchRecentWins(user.id),
      fetchFeaturedPools(),
      fetchBadges(user.id),
      fetchLoyaltyPoints(user.id)
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
      .select('amount, created_at, pools(prize_name, target_amount)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);
    setContributions(data || []);
  }

  async function fetchActiveEntries(userId) {
    const { data } = await supabase
      .from('contributions')
      .select('*, pools(prize_name, target_amount, current_amount, status, image_url)')
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
    const { data } = await supabase.from('user_badges').select('*').eq('user_id', userId);
    
    if (data && data.length > 0) {
      setBadges(data);
    } else {
      const { count: contribCount } = await supabase
        .from('contributions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      const newBadges = [];
      if (contribCount > 0) {
        newBadges.push({ badge_type: 'first_contribution', name: 'First Step', icon: '🌟', description: 'Made your first contribution' });
      }
      const { count: winCount } = await supabase
        .from('pools')
        .select('*', { count: 'exact', head: true })
        .eq('winner_id', userId);
      if (winCount > 0) {
        newBadges.push({ badge_type: 'first_win', name: 'Winner!', icon: '🏆', description: 'Won your first prize' });
      }
      setBadges(newBadges);
    }
  }

  async function fetchLoyaltyPoints(userId) {
    const { data } = await supabase
      .from('contributions')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');
    const total = data?.reduce((sum, c) => sum + c.amount, 0) || 0;
    setLoyaltyPoints(Math.floor(total / 100));
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

  const badgeConfig = {
    first_contribution: { name: 'First Step', icon: '🌟', color: 'bg-blue-100 text-blue-700' },
    first_win: { name: 'Winner!', icon: '🏆', color: 'bg-yellow-100 text-yellow-700' },
    top_contributor: { name: 'Top Contributor', icon: '👑', color: 'bg-purple-100 text-purple-700' },
    early_bird: { name: 'Early Bird', icon: '🐦', color: 'bg-green-100 text-green-700' },
    loyal_member: { name: 'Loyal Member', icon: '💎', color: 'bg-indigo-100 text-indigo-700' },
    charity_champion: { name: 'Charity Champion', icon: '💚', color: 'bg-red-100 text-red-700' }
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Total Contributions</p><p className="text-2xl font-bold text-green-600">ETB {totalContributions.toLocaleString()}</p></div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">💰</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Total Wins</p><p className="text-2xl font-bold text-yellow-600">{totalWins}</p></div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">🏆</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Active Entries</p><p className="text-2xl font-bold text-blue-600">{activeCount}</p></div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">🎯</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-md p-4 text-white">
          <div className="flex items-center justify-between">
            <div><p className="text-sm opacity-90">Charity Impact</p><p className="text-2xl font-bold">💚 {livesImpacted} lives</p></div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">❤️</div>
          </div>
          <p className="text-xs opacity-80 mt-1">2% of your contributions</p>
        </div>
      </div>

      {/* Welcome Explanation Card */}
      <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-3xl">🎯</div>
          <div>
            <h3 className="font-bold text-blue-800 text-base">About Your Dashboard</h3>
            <p className="text-sm text-blue-700 mt-1">
              As an <strong>Individual Participant</strong>, you can join prize pools and win amazing prizes!
              Every contribution you make helps charity.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="flex items-center gap-2 text-xs text-blue-700"><span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">✓</span>Browse active pools</div>
              <div className="flex items-center gap-2 text-xs text-blue-700"><span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">✓</span>Contribute as low as 100 ETB</div>
              <div className="flex items-center gap-2 text-xs text-blue-700"><span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">✓</span>Track your entries</div>
              <div className="flex items-center gap-2 text-xs text-blue-700"><span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">✓</span>Earn badges & points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Loyalty Points */}
      <div className="mb-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-4 text-white">
        <div className="flex justify-between items-center">
          <div><p className="text-sm opacity-90">Your Loyalty Points</p><p className="text-3xl font-bold">{loyaltyPoints}</p></div>
          <div className="text-right"><p className="text-xs opacity-80">Earn 1 point per 100 ETB</p><Link href="/dashboard/rewards" className="text-xs underline opacity-80">Redeem →</Link></div>
        </div>
      </div>

      {/* Featured Pools */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-gray-800">⭐ Featured Pools</h2><Link href="/listings" className="text-green-600 text-sm">View all →</Link></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredPools.slice(0, 3).map(pool => {
            const progress = (pool.current_amount / pool.target_amount) * 100;
            return (
              <div key={pool.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
                <img src={pool.image_url || '/images/placeholder.jpg'} alt={pool.prize_name} className="w-full h-40 object-cover" />
                <div className="p-4"><h3 className="font-bold text-gray-800">{pool.prize_name}</h3><p className="text-sm text-gray-500">Target: ETB {pool.target_amount?.toLocaleString()}</p>
                <div className="mt-2"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progress</span><span>{Math.round(progress)}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div></div></div>
                <Link href={`/pools/${pool.id}`} className="mt-3 inline-block text-green-600 text-sm font-semibold">Join Pool →</Link></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Entries */}
      <div className="mb-8"><h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Your Active Entries</h2>
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {activeEntries.length === 0 ? (<div className="p-8 text-center"><div className="text-5xl mb-3">🎯</div><p className="text-gray-400">No active entries yet</p><Link href="/listings" className="text-green-600 text-sm mt-2 inline-block">Browse pools →</Link></div>) : (
            <div className="divide-y">{activeEntries.map(entry => {
              const progress = (entry.pools?.current_amount / entry.pools?.target_amount) * 100;
              return (<div key={entry.id} className="p-4 hover:bg-gray-50"><div className="flex justify-between items-start"><div><h3 className="font-bold text-gray-800">{entry.pools?.prize_name}</h3><p className="text-sm text-gray-500">Your contribution: ETB {entry.amount?.toLocaleString()}</p></div><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span></div>
              <div className="mt-2"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progress</span><span>{Math.round(progress)}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div></div></div>
              <Link href={`/pools/${entry.pool_id}`} className="text-green-600 text-sm mt-2 inline-block">View Details →</Link></div>);
            })}</div>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="mb-8"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-gray-800">⭐ Your Badges</h2><Link href="/dashboard/badges" className="text-green-600 text-sm">View all →</Link></div>
        <div className="flex flex-wrap gap-3">{badges.length === 0 ? (<p className="text-gray-400 text-sm">Start contributing to earn badges!</p>) : (badges.map((badge, i) => {
          const config = badgeConfig[badge.badge_type] || { name: badge.badge_type || 'Badge', icon: '🎖️', color: 'bg-gray-100 text-gray-700' };
          return (<div key={i} className={`${config.color} rounded-full px-4 py-2 flex items-center gap-2 shadow-sm`}><span className="text-lg">{config.icon}</span><span className="text-sm font-semibold">{config.name}</span></div>);
        }))}</div>
      </div>

      {/* Recent Wins */}
      {recentWins.length > 0 && (<div className="mb-8"><h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Your Recent Wins</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{recentWins.map(win => (<div key={win.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200 flex items-center gap-4"><div className="text-4xl">🏆</div><div><h3 className="font-bold text-gray-800">{win.prize_name}</h3><p className="text-sm text-green-600 font-semibold">ETB {win.target_amount?.toLocaleString()}</p><p className="text-xs text-gray-500">Won on {new Date(win.completed_at).toLocaleDateString()}</p></div></div>))}</div></div>)}

      {/* How to Win Guide */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-6 text-white mb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">🎯 How to Win</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div><p className="text-sm">Browse Pools</p></div>
          <div><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div><p className="text-sm">Make Contribution</p></div>
          <div><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div><p className="text-sm">Get Ticket</p></div>
          <div><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">4</div><p className="text-sm">Watch Live Draw</p></div>
          <div><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">5</div><p className="text-sm">Win & Celebrate!</p></div>
        </div>
        <Link href="/listings" className="inline-block mt-5 bg-white text-green-600 px-6 py-2 rounded-full text-sm font-semibold w-full text-center">Start Playing Now →</Link>
      </div>

      {/* Referral Program */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4"><div><h3 className="text-xl font-bold">🤝 Referral Program</h3><p className="text-sm opacity-90">Invite friends, earn 5% bonus on their contributions</p></div><button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user?.id}`); alert('Referral link copied!'); }} className="bg-white text-purple-600 px-4 py-2 rounded-full text-sm font-semibold">Copy Link</button></div>
      </div>

      {/* Charity Section */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3"><span className="text-3xl">💚</span><h3 className="text-xl font-bold">Making a Difference</h3></div>
        <p className="text-sm opacity-95 mb-3">2% of every contribution supports Ethiopians fighting <strong>kidney disease</strong> and <strong>heart disease</strong>.</p>
        {charityAmount > 0 && (<div className="bg-white/20 rounded-xl p-3 mb-3"><p className="text-xs opacity-90">Your contribution to health:</p><p className="text-xl font-bold">ETB {charityAmount.toLocaleString()}</p><p className="text-xs opacity-75">Lives touched: {livesImpacted}</p></div>)}
        <div className="flex items-center gap-2 text-sm border-t border-white/20 pt-3 mt-2"><span>💚</span><span className="text-xs">Every contribution saves a life</span></div>
      </div>
    </DashboardLayout>
  );
}
