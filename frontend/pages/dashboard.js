import { useEffect, useState } from 'react';
import { supabase, getPoolsPaginated } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import PoolCard from '../components/PoolCard';
import LoadingSpinner from '../components/LoadingSpinner';
import BackButton from '../components/BackButton';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({ totalSpent: 0, totalWon: 0, activeEntries: 0 });
  const [activePools, setActivePools] = useState([]);
  const [myEntries, setMyEntries] = useState([]);
  const [myWins, setMyWins] = useState([]);
  
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
        router.push('/register');
        return;
      }
      
      await loadDashboardData(user.id);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboardData(userId) {
    // Fetch Quick Stats & My Entries
    const { data: contributions } = await supabase
      .from('contributions')
      .select('amount, pool_id, pools(*)')
      .eq('user_id', userId)
      .eq('status', 'completed');
      
    const totalSpent = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    
    // Group active entries uniquely by pool
    const activeEntriesMap = new Map();
    contributions?.forEach(c => {
      if (c.pools && c.pools.status === 'active') {
        if (!activeEntriesMap.has(c.pool_id)) {
          activeEntriesMap.set(c.pool_id, { pool: c.pools, totalAmount: c.amount });
        } else {
          activeEntriesMap.get(c.pool_id).totalAmount += c.amount;
        }
      }
    });
    
    const activeEntries = Array.from(activeEntriesMap.values());
    
    // Fetch My Wins
    const { data: wins } = await supabase
      .from('pools')
      .select('*')
      .eq('winner_id', userId);
      
    const totalWon = wins?.reduce((sum, w) => sum + (w.target_amount || 0), 0) || 0;
    
    setStats({ totalSpent, totalWon, activeEntries: activeEntries.length });
    setMyEntries(activeEntries);
    setMyWins(wins || []);
    
    // Fetch some general active pools (paginated, just first page)
    const { data: generalPools } = await getPoolsPaginated(0, 6, { category: 'all', city: 'all' });
    setActivePools(generalPools || []);
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Loading your dashboard..." />;
  }
  
  const isProfileIncomplete = !profile?.phone || !profile?.location;
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <DashboardLayout 
      title="My Dashboard" 
      subtitle="Track your activity and wins"
      icon="🎯"
      bgGradient="from-green-600 to-teal-500"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/" />
      
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl">💸</div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Spent</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalSpent.toLocaleString()} ETB</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xl">🏆</div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Won</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalWon.toLocaleString()} ETB</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl">🎟️</div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Entries</p>
            <p className="text-2xl font-bold text-gray-800">{stats.activeEntries}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Pools */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Pools Grid */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Featured Active Pools</h3>
              <Link href="/listings" className="text-green-600 font-semibold hover:underline text-sm">
                Browse All Pools →
              </Link>
            </div>
            
            {activePools.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active pools available right now.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {activePools.slice(0, 6).map((pool) => (
                  <PoolCard key={pool.id} pool={pool} compact={true} />
                ))}
              </div>
            )}
          </div>
          
        </div>

        {/* Right Column: User Activity */}
        <div className="space-y-8">
          
          {/* My Active Entries */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🎟️</span> My Active Entries
            </h3>
            {myEntries.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 text-sm">You haven't joined any active pools.</p>
                <Link href="/listings" className="mt-2 inline-block text-green-600 font-medium text-sm hover:underline">Find a pool to join</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myEntries.map((entry, idx) => (
                  <Link key={idx} href={`/pools/${entry.pool.id}`} className="block p-3 rounded-xl border hover:border-green-300 hover:shadow-sm transition bg-gray-50">
                    <p className="font-semibold text-gray-800 truncate">{entry.pool.name}</p>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-green-600 font-medium">Contributed: {entry.totalAmount.toLocaleString()} ETB</span>
                      <span className="text-gray-500">Target: {entry.pool.target_amount?.toLocaleString()} ETB</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* My Wins */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-yellow-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🏆</span> My Wins
            </h3>
            {myWins.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4 opacity-75">No wins yet. Keep participating!</p>
            ) : (
              <div className="space-y-3">
                {myWins.map(win => (
                  <div key={win.id} className="p-3 bg-white rounded-xl shadow-sm border border-yellow-200">
                    <p className="font-semibold text-gray-800 truncate">{win.name}</p>
                    <div className="flex justify-between mt-1 items-center">
                      <span className="text-yellow-600 font-bold text-sm">Won {win.target_amount?.toLocaleString()} ETB</span>
                      <span className="text-xs text-gray-400">{new Date(win.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </DashboardLayout>
  );
}
