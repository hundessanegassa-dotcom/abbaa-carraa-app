import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../DashboardLayout';
import LoyaltyPoints from '../LoyaltyPoints';

export default function IndividualDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [activeEntries, setActiveEntries] = useState([]);
  const [recentWins, setRecentWins] = useState([]);
  const [badges, setBadges] = useState([]);
  const [charityTotal, setCharityTotal] = useState(0);
  const [featuredPools, setFeaturedPools] = useState([]);
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
      fetchBadges(user.id),
      fetchCharityTotal(user.id),
      fetchFeaturedPools()
    ]);
    setLoading(false);
  }

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data || {});
  }

  async function fetchContributions(userId) {
    const { data } = await supabase
      .from('contributions')
      .select('*, pools(prize_name, target_amount, status)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);
    setContributions(data || []);
  }

  async function fetchActiveEntries(userId) {
    const { data } = await supabase
      .from('contributions')
      .select('*, pools(prize_name, target_amount, current_amount, status, end_date)')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    const active = data?.filter(item => item.pools?.status === 'active') || [];
    setActiveEntries(active);
  }

  async function fetchRecentWins(userId) {
    const { data } = await supabase
      .from('pools')
      .select('*')
      .eq('winner_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5);
    setRecentWins(data || []);
  }

  async function fetchBadges(userId) {
    const { data } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('awarded_at', { ascending: false });
    
    if (data && data.length > 0) {
      setBadges(data);
    } else {
      // Default badges based on activity
      const newBadges = [];
      const { count: contribCount } = await supabase
        .from('contributions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (contribCount > 0) {
        newBadges.push({
          badge_type: 'first_contribution',
          name: 'First Step',
          icon: '🌟',
          description: 'Made your first contribution'
        });
      }
      
      const { count: winCount } = await supabase
        .from('pools')
        .select('*', { count: 'exact', head: true })
        .eq('winner_id', userId);
      
      if (winCount > 0) {
        newBadges.push({
          badge_type: 'first_win',
          name: 'Winner!',
          icon: '🏆',
          description: 'Won your first prize'
        });
      }
      
      setBadges(newBadges);
    }
  }

  async function fetchCharityTotal(userId) {
    const { data } = await supabase
      .from('contributions')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    const totalContributions = data?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const charityAmount = totalContributions * 0.02;
    setCharityTotal(charityAmount);
  }

  async function fetchFeaturedPools() {
    const { data } = await supabase
      .from('pools')
      .select('*')
      .eq('status', 'active')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(3);
    setFeaturedPools(data || []);
  }

  const badgeConfig = {
    first_contribution: { name: 'First Step', icon: '🌟', color: 'bg-blue-100 text-blue-700' },
    first_win: { name: 'Winner!', icon: '🏆', color: 'bg-yellow-100 text-yellow-700' },
    top_contributor: { name: 'Top Contributor', icon: '👑', color: 'bg-purple-100 text-purple-700' },
    early_bird: { name: 'Early Bird', icon: '🐦', color: 'bg-green-100 text-green-700' },
    loyal_member: { name: 'Loyal Member', icon: '💎', color: 'bg-indigo-100 text-indigo-700' },
    charity_champion: { name: 'Charity Champion', icon: '💚', color: 'bg-red-100 text-red-700' }
  };

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
  const badgeCount = badges.length;

  return (
    <DashboardLayout 
      title="My Dashboard" 
      subtitle="Track your activity, wins, and badges"
      icon="🎯"
      bgGradient="from-green-600 to-teal-500"
      user={user}
      profile={profile}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-xs md:text-sm">Total Contributions</p><p className="text-xl md:text-3xl font-bold text-green-600">ETB {totalContributions.toLocaleString()}</p></div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center"><span className="text-lg md:text-xl">💰</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-xs md:text-sm">Total Wins</p><p className="text-xl md:text-3xl font-bold text-yellow-600">{totalWins}</p></div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center"><span className="text-lg md:text-xl">🏆</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-xs md:text-sm">Active Entries</p><p className="text-xl md:text-3xl font-bold text-blue-600">{activeCount}</p></div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-lg md:text-xl">🎯</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-xs md:text-sm">Badges Earned</p><p className="text-xl md:text-3xl font-bold text-purple-600">{badgeCount}</p></div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center"><span className="text-lg md:text-xl">🎖️</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b bg-gray-50"><h2 className="text-lg font-bold flex items-center gap-2">🎯 Active Entries</h2></div>
            <div className="p-4 md:p-6">
              {activeEntries.length === 0 ? (
                <div className="text-center py-8"><p className="text-gray-400">No active entries yet</p><Link href="/listings" className="text-green-600 text-sm mt-2 inline-block">Browse Pools →</Link></div>
              ) : (
                <div className="space-y-4">
                  {activeEntries.map(entry => {
                    const progress = (entry.pools?.current_amount / entry.pools?.target_amount) * 100;
                    return (
                      <div key={entry.id} className="border rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2"><div><h3 className="font-bold text-gray-800">{entry.pools?.prize_name}</h3><p className="text-sm text-gray-500">Your contribution: ETB {entry.amount?.toLocaleString()}</p></div><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span></div>
                        <div className="mt-2"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Pool Progress</span><span>{Math.round(progress)}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div></div></div>
                        <Link href={`/pools/${entry.pool_id}`} className="text-green-600 text-sm mt-3 inline-block">View Details →</Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {recentWins.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b bg-gray-50"><h2 className="text-lg font-bold flex items-center gap-2">🏆 Recent Wins</h2></div>
              <div className="p-4 md:p-6">
                <div className="space-y-3">{recentWins.map(win => (<div key={win.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl"><div><p className="font-semibold text-gray-800">{win.prize_name}</p><p className="text-xs text-gray-500">Won: {new Date(win.completed_at).toLocaleDateString()}</p></div><div className="text-right"><p className="font-bold text-green-600">ETB {win.target_amount?.toLocaleString()}</p><span className="text-xs text-green-600">✓ Prize Ready</span></div></div>))}</div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b bg-gray-50"><h2 className="text-lg font-bold flex items-center gap-2">🎖️ My Badges</h2></div>
            <div className="p-4 md:p-6">
              {badges.length === 0 ? (<div className="text-center py-6"><p className="text-gray-400 text-sm">No badges yet</p><p className="text-xs text-gray-400 mt-1">Start contributing to earn badges!</p></div>) : (
                <div className="grid grid-cols-2 gap-3">{badges.map((badge, index) => { const config = badgeConfig[badge.badge_type] || { name: badge.badge_type, icon: '🎖️', color: 'bg-gray-100 text-gray-700' }; return (<div key={index} className={`${config.color} rounded-xl p-3 text-center transition hover:scale-105`}><div className="text-2xl mb-1">{config.icon}</div><p className="font-semibold text-sm">{config.name}</p><p className="text-xs opacity-75">{badge.description || config.description}</p></div>);})}</div>)}
            </div>
          </div>

          <LoyaltyPoints userId={user?.id} />
          
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-4 md:p-6 text-white">
            <h3 className="text-xl font-bold mb-4">🎯 How to Win</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3"><div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">1</div><div><p className="font-semibold">Browse Prize Pools</p><p className="text-xs opacity-90">Find a prize you love</p></div></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">2</div><div><p className="font-semibold">Make a Contribution</p><p className="text-xs opacity-90">As low as 100 ETB per entry</p></div></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">3</div><div><p className="font-semibold">Get Your Ticket</p><p className="text-xs opacity-90">More contributions = more chances</p></div></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">4</div><div><p className="font-semibold">Watch Live Draw</p><p className="text-xs opacity-90">Fair & transparent selection</p></div></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">5</div><div><p className="font-semibold">Win & Celebrate! 🎉</p><p className="text-xs opacity-90">Prize delivered to your door</p></div></div>
            </div>
            <Link href="/listings" className="inline-block mt-5 bg-white text-green-600 px-5 py-2 rounded-full text-sm font-semibold text-center w-full">Start Playing Now →</Link>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-4 md:p-6 text-white">
            <div className="flex items-center gap-2 mb-3"><span className="text-2xl">💚</span><h3 className="text-xl font-bold">Making a Difference</h3></div>
            <p className="text-sm opacity-95 mb-3">2% of every contribution supports Ethiopians fighting <strong>kidney disease</strong> and <strong>heart disease</strong>.</p>
            {charityTotal > 0 && (<div className="bg-white/20 rounded-xl p-3 mb-3"><p className="text-xs opacity-90">Your contribution to health:</p><p className="text-xl font-bold">ETB {charityTotal.toLocaleString()}</p><p className="text-xs opacity-75">Lives touched: {Math.floor(charityTotal / 100)}</p></div>)}
            <div className="flex items-center gap-2 text-sm border-t border-white/20 pt-3 mt-2"><span>💚</span><span className="text-xs">Every contribution saves a life</span></div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
