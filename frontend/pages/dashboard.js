import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import PoolCard from '../components/PoolCard';
import LoadingSpinner from '../components/LoadingSpinner';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';
import GlobalAnnouncement from '../components/GlobalAnnouncement';

export async function getServerSideProps() {
  return { props: {} };
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [stats, setStats] = useState({ 
    totalSpent: 0, 
    totalWon: 0, 
    activeEntries: 0, 
    winRate: 0, 
    loyaltyPoints: 0 
  });
  const [activePools, setActivePools] = useState([]);
  const [myEntries, setMyEntries] = useState([]);
  const [myWins, setMyWins] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [badges, setBadges] = useState([]);
  
  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
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

      setProfile(profile || {});
      
      if (profile && profile.agreement_accepted !== true) {
        router.push('/login');
        return;
      }
      
      await loadDashboardData(user.id);
      await loadRecentActivities(user.id);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboardData(userId) {
    try {
      // Fetch contributions with pool details
      const { data: contributions, error: contribError } = await supabase
        .from('contributions')
        .select(`
          amount,
          pool_id,
          status,
          created_at,
          pools:pool_id (
            id,
            name,
            prize_name,
            target_amount,
            entry_fee,
            contribution_amount,
            status,
            winner_id
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (contribError) throw contribError;
      
      const totalSpent = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      
      // Group active entries uniquely by pool
      const activeEntriesMap = new Map();
      contributions?.forEach(c => {
        if (c.pools && c.pools.status === 'active') {
          const entryFee = c.pools.entry_fee || c.pools.contribution_amount || 10;
          const totalCollection = c.pools.target_amount * 1.2;
          const totalSeats = Math.floor(totalCollection / entryFee);
          
          if (!activeEntriesMap.has(c.pool_id)) {
            activeEntriesMap.set(c.pool_id, { 
              pool: c.pools, 
              totalAmount: c.amount,
              joinedDate: c.created_at,
              entryFee: entryFee,
              totalSeats: totalSeats
            });
          } else {
            activeEntriesMap.get(c.pool_id).totalAmount += c.amount;
          }
        }
      });
      
      const activeEntries = Array.from(activeEntriesMap.values());
      
      // Fetch wins (pools where user is winner)
      const { data: wins, error: winsError } = await supabase
        .from('pools')
        .select('*')
        .eq('winner_id', userId)
        .order('updated_at', { ascending: false });
        
      if (winsError) throw winsError;
      
      const totalWon = wins?.reduce((sum, w) => sum + (w.target_amount || 0), 0) || 0;
      const winRate = totalSpent > 0 ? (totalWon / totalSpent) * 100 : 0;
      const loyaltyPoints = Math.floor(totalSpent / 100) + (wins?.length || 0) * 10;
      
      setStats({ 
        totalSpent, 
        totalWon, 
        activeEntries: activeEntries.length,
        winRate: winRate.toFixed(1),
        loyaltyPoints
      });
      setMyEntries(activeEntries);
      setMyWins(wins || []);
      
      // Load badges after wins are set
      await loadBadges(userId, wins?.length || 0, totalSpent, profile);
      
      // Fetch active pools
      await loadMorePools(0, true);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  }

  async function loadMorePools(pageNum = page, reset = false) {
    if (loadingMore) return;
    if (!reset && !hasMore) return;
    
    setLoadingMore(true);
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .range(pageNum * 6, (pageNum * 6) + 5);

      if (error) throw error;
      
      if (reset) {
        setActivePools(data || []);
        setPage(1);
      } else {
        setActivePools(prev => [...prev, ...(data || [])]);
        setPage(pageNum + 1);
      }
      
      setHasMore((data?.length || 0) === 6);
    } catch (error) {
      console.error('Error loading pools:', error);
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadRecentActivities(userId) {
    try {
      // Combine contributions and wins for activity feed
      const { data: contributions } = await supabase
        .from('contributions')
        .select('amount, created_at, pools:pool_id(prize_name)')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: wins } = await supabase
        .from('pools')
        .select('prize_name, target_amount, updated_at')
        .eq('winner_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5);

      const activities = [
        ...(contributions || []).map(c => ({
          type: 'contribution',
          title: `Joined "${c.pools?.prize_name}"`,
          amount: c.amount,
          date: c.created_at,
          icon: '🎯',
          color: 'blue'
        })),
        ...(wins || []).map(w => ({
          type: 'win',
          title: `Won "${w.prize_name}"`,
          amount: w.target_amount,
          date: w.updated_at,
          icon: '🏆',
          color: 'yellow'
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  }

  async function loadBadges(userId, winsCount, totalSpent, profile) {
    const badgesList = [];
    
    if (winsCount >= 1) badgesList.push({ name: 'First Win', icon: '🥇', color: 'bg-yellow-100 text-yellow-700' });
    if (winsCount >= 5) badgesList.push({ name: 'Rising Star', icon: '⭐', color: 'bg-blue-100 text-blue-700' });
    if (winsCount >= 10) badgesList.push({ name: 'Champion', icon: '🏆', color: 'bg-purple-100 text-purple-700' });
    if (totalSpent >= 10000) badgesList.push({ name: 'Big Spender', icon: '💰', color: 'bg-green-100 text-green-700' });
    if (profile?.referral_count >= 5) badgesList.push({ name: 'Super Referrer', icon: '🤝', color: 'bg-orange-100 text-orange-700' });
    
    if (badgesList.length === 0) {
      badgesList.push({ name: 'Newcomer', icon: '🌱', color: 'bg-gray-100 text-gray-700' });
    }
    
    setBadges(badgesList);
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${user?.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied! Share with friends to earn bonuses.');
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading your dashboard..." />;
  }
  
  const isProfileIncomplete = !profile?.phone || !profile?.location || !profile?.address;
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <DashboardLayout 
      title="Individual Dashboard" 
      subtitle="Join pools, track your entries, and win amazing prizes"
      icon="🎯"
      bgGradient="from-green-600 to-teal-500"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/" />
      
      <GlobalAnnouncement />
      
      {/* Role Description Card */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 border-l-4 border-green-500 rounded-xl p-5 mb-8">
        <h3 className="font-bold text-green-800 text-lg mb-2">✨ Your Role: Individual Participant</h3>
        <p className="text-green-700 text-sm leading-relaxed">
          As an individual participant, you can browse and join various pools created by Admins, Agents, or Organizations.
          Each pool has <strong>one winner</strong> who receives <strong>100% of the target amount</strong>. 
          The pool creator earns their commission (10% or 20%), and the platform/admin earns a 10% fee on agent/organization pools.
          <strong className="block mt-2">💚 2% of every contribution supports kidney & heart disease patients.</strong>
        </p>
      </div>
      
      {/* Welcome & Profile Reminder */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-2xl shadow-sm p-6 mb-8 border border-green-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome back, {firstName}! 👋</h2>
          <p className="text-gray-500 mt-1">Here's what's happening with your pools today.</p>
        </div>
        
        {isProfileIncomplete && (
          <div className="mt-4 md:mt-0 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-sm">Profile Incomplete</p>
              <Link href="/profile" className="text-xs text-yellow-600 hover:underline">Complete your profile to ensure smooth prize delivery →</Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-lg">💸</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Spent</p>
              <p className="text-xl font-bold text-gray-800">{stats.totalSpent.toLocaleString()} ETB</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center text-lg">🏆</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Won</p>
              <p className="text-xl font-bold text-yellow-600">{stats.totalWon.toLocaleString()} ETB</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg">🎟️</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Active Entries</p>
              <p className="text-xl font-bold text-blue-600">{stats.activeEntries}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-lg">⭐</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Loyalty Points</p>
              <p className="text-xl font-bold text-purple-600">{stats.loyaltyPoints}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-teal-500 p-5 rounded-2xl shadow-sm text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">📊</div>
            <div>
              <p className="text-xs font-medium opacity-90">Win Rate</p>
              <p className="text-xl font-bold">{stats.winRate}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Pools */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Pools Grid */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h3 className="text-xl font-bold text-gray-800">🔥 Featured Active Pools</h3>
              <Link href="/listings" className="text-green-600 font-semibold hover:underline text-sm flex items-center gap-1">
                Browse All Pools <span>→</span>
              </Link>
            </div>
            
            {activePools.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🏊</div>
                <p className="text-gray-400">No active pools available right now.</p>
                <p className="text-xs text-gray-400 mt-1">Check back soon for new opportunities!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {activePools.map((pool) => (
                    <PoolCard key={pool.id} pool={pool} />
                  ))}
                </div>
                {hasMore && (
                  <div className="text-center mt-6">
                    <button 
                      onClick={() => loadMorePools(page, false)} 
                      disabled={loadingMore}
                      className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 mx-auto"
                    >
                      {loadingMore ? 'Loading...' : 'Load More Pools ↓'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Recent Activity Feed */}
          {recentActivities.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📋</span> Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`text-2xl ${activity.color === 'yellow' ? 'text-yellow-500' : 'text-blue-500'}`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{activity.title}</p>
                      <p className="text-xs text-gray-400">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                    <div className={`font-bold text-sm ${activity.type === 'win' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {activity.type === 'win' ? '+' : ''}{activity.amount?.toLocaleString()} ETB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* How to Win Guide */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-bold text-blue-800 text-lg mb-4 flex items-center gap-2">
              <span>📖</span> How to Win
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">1</div>
                <p className="font-semibold text-sm">Find a Pool</p>
                <p className="text-xs text-gray-600">Browse active prize pools</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">2</div>
                <p className="font-semibold text-sm">Contribute</p>
                <p className="text-xs text-gray-600">Pay entry fee for seats</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">3</div>
                <p className="font-semibold text-sm">Win!</p>
                <p className="text-xs text-gray-600">Random winner selected</p>
              </div>
            </div>
            <p className="text-xs text-blue-600 text-center mt-3">
              💡 Tip: More entries = higher chance to win!
            </p>
          </div>
        </div>

        {/* Right Column: User Activity */}
        <div className="space-y-6">
          
          {/* My Active Entries */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🎟️</span> My Active Entries
              {myEntries.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{myEntries.length}</span>
              )}
            </h3>
            {myEntries.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-gray-500 text-sm">You haven't joined any active pools.</p>
                <Link href="/listings" className="mt-3 inline-block text-green-600 font-medium text-sm hover:underline">
                  Find a pool to join →
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {myEntries.map((entry, idx) => {
                  const totalCollection = entry.pool.target_amount * 1.2;
                  const progress = (entry.totalAmount / totalCollection) * 100;
                  
                  return (
                    <Link 
                      key={idx} 
                      href={`/pools/${entry.pool.id}`} 
                      className="block p-3 rounded-xl border hover:border-green-300 hover:shadow-sm transition bg-gray-50"
                    >
                      <p className="font-semibold text-gray-800 truncate text-sm">{entry.pool.prize_name || entry.pool.name}</p>
                      <div className="flex justify-between mt-2 text-xs">
                        <span className="text-green-600 font-medium">Contributed: {entry.totalAmount.toLocaleString()} ETB</span>
                        <span className="text-gray-500">Target: {entry.pool.target_amount?.toLocaleString()} ETB</span>
                      </div>
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-green-600 h-1 rounded-full" 
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {entry.entryFee} ETB per seat • {entry.totalSeats.toLocaleString()} total seats
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Wins */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-yellow-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🏆</span> My Wins
              {myWins.length > 0 && (
                <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full">{myWins.length}</span>
              )}
            </h3>
            {myWins.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-gray-500 text-sm">No wins yet. Keep participating!</p>
                <p className="text-xs text-gray-400 mt-1">Your first win could be just around the corner</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {myWins.map(win => (
                  <div key={win.id} className="p-3 bg-white rounded-xl shadow-sm border border-yellow-200 hover:shadow-md transition">
                    <p className="font-semibold text-gray-800 truncate text-sm">{win.prize_name || win.name}</p>
                    <div className="flex justify-between mt-2 items-center">
                      <span className="text-yellow-600 font-bold text-sm">Won {win.target_amount?.toLocaleString()} ETB</span>
                      <span className="text-xs text-gray-400">{new Date(win.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Badges & Achievements */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>🎖️</span> Badges & Achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, idx) => (
                <div key={idx} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${badge.color}`}>
                  <span>{badge.icon}</span>
                  <span>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Referral Program */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100">
            <h3 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
              <span>🤝</span> Referral Program
            </h3>
            <p className="text-xs text-indigo-600 mb-3">Invite friends and earn bonuses when they join!</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/register?ref=${user?.id}`}
                className="flex-1 text-xs border rounded-lg px-2 py-1.5 bg-white"
              />
              <button
                onClick={copyReferralLink}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Charity Section */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-5 rounded-2xl border border-pink-100">
            <h3 className="font-semibold text-pink-800 mb-2 flex items-center gap-2">
              <span>💚</span> 2% for Health
            </h3>
            <p className="text-xs text-pink-700">
              2% of every contribution goes to support kidney and heart disease patients in Ethiopia.
              Your participation helps save lives!
            </p>
            <div className="mt-3 bg-white rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Total contributed to charity from your activity:</p>
              <p className="font-bold text-pink-600">ETB {Math.floor(stats.totalSpent * 0.02).toLocaleString()}</p>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <span>💡</span> Pro Tips
            </h3>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Join pools early for better chances</li>
              <li>Complete your profile to qualify for wins</li>
              <li>Invite friends to earn referral bonuses</li>
              <li>Check back daily for new featured pools</li>
              <li>More entries = higher chance to win!</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
