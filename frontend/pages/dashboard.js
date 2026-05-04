import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { requestNotificationPermission, checkAndNotify } from '../utils/notifications';
import LoyaltyPoints from '../components/LoyaltyPoints';

export default function Dashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null); // ← Renamed to avoid confusion
  const [profile, setProfile] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [activeEntries, setActiveEntries] = useState([]);
  const [recentWins, setRecentWins] = useState([]);
  const [stats, setStats] = useState({
    total_contributions: 0,
    total_wins: 0,
    active_entries: 0
  });
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    checkUser();
    checkNotificationPermission();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    await fetchProfile(user.id);
    await fetchContributions(user.id);
    await fetchActiveEntries(user.id);
    await fetchRecentWins(user.id);
    setLoading(false);
  }

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      
      setStats({
        total_contributions: data.total_contributions || 0,
        total_wins: data.total_wins || 0,
        active_entries: 0
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function fetchContributions(userId) {
    try {
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          pools!inner (
            id,
            prize_name,
            target_amount,
            status
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setContributions(data || []);
      
      const active = data?.filter(c => c.pools?.status === 'active').length || 0;
      setStats(prev => ({ ...prev, active_entries: active }));
    } catch (error) {
      console.error('Error fetching contributions:', error);
    }
  }

  async function fetchActiveEntries(userId) {
    try {
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          pools!inner (
            id,
            prize_name,
            target_amount,
            current_amount,
            status,
            end_date
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .eq('pools.status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveEntries(data || []);
    } catch (error) {
      console.error('Error fetching active entries:', error);
    }
  }

  async function fetchRecentWins(userId) {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('winner_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentWins(data || []);
    } catch (error) {
      console.error('Error fetching wins:', error);
    }
  }

  async function checkNotificationPermission() {
    const hasPermission = await requestNotificationPermission();
    setNotificationsEnabled(hasPermission);
    
    if (hasPermission && currentUser) {
      await supabase
        .from('profiles')
        .update({ push_enabled: true })
        .eq('id', currentUser.id);
    }
  }

  async function enableNotifications() {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationsEnabled(true);
      toast.success('Notifications enabled!');
      
      if (currentUser) {
        await supabase
          .from('profiles')
          .update({ push_enabled: true })
          .eq('id', currentUser.id);
      }
    } else {
      toast.error('Please allow notifications in your browser settings.');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Welcome back, {profile?.full_name || currentUser?.email?.split('@')[0]}
            </p>
          </div>
          <div className="flex gap-3">
            {!notificationsEnabled && (
              <button
                onClick={enableNotifications}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                🔔 Enable Notifications
              </button>
            )}
            {notificationsEnabled && (
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                🔔 Notifications On
              </span>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards and Loyalty Points */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-2xl font-bold text-green-600">ETB {stats.total_contributions.toLocaleString()}</p>
            <p className="text-gray-500">Total Contributions</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">🏆</div>
            <p className="text-2xl font-bold text-yellow-600">{stats.total_wins}</p>
            <p className="text-gray-500">Total Wins</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-2xl font-bold text-blue-600">{stats.active_entries}</p>
            <p className="text-gray-500">Active Entries</p>
          </div>
          {/* Loyalty Points Component - FIXED */}
          <div>
            <LoyaltyPoints userId={currentUser?.id} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/listings" className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white hover:shadow-lg transition">
            <div className="text-3xl mb-2">🎁</div>
            <h3 className="font-bold text-lg">Browse Prize Pools</h3>
            <p className="text-sm opacity-90">Find your chance to win amazing prizes</p>
          </Link>
          <Link href="/agent/register" className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 text-white hover:shadow-lg transition">
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-bold text-lg">Become an Agent</h3>
            <p className="text-sm opacity-90">Create pools and earn 10% commission</p>
          </Link>
          <Link href="/winners" className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white hover:shadow-lg transition">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-bold text-lg">View Winners</h3>
            <p className="text-sm opacity-90">See who won recent prizes</p>
          </Link>
        </div>

        {/* Recent Wins */}
        {recentWins.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold p-6 pb-0">🏆 Recent Wins</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prize</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentWins.map(win => (
                    <tr key={win.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-green-600">{win.prize_name}</td>
                      <td className="px-6 py-4">ETB {win.target_amount.toLocaleString()}</td>
                      <td className="px-6 py-4">{new Date(win.completed_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">✓ Claimed</span>
                       </td>
                     </tr>
                  ))}
                </tbody>
               </table>
            </div>
          </div>
        )}

        {/* Active Entries */}
        {activeEntries.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold p-6 pb-0">🎯 Active Entries</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pool</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contribution</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeEntries.map(entry => {
                    const progress = (entry.pools.current_amount / entry.pools.target_amount) * 100;
                    const daysLeft = Math.max(0, Math.ceil((new Date(entry.pools.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{entry.pools.prize_name}</td>
                        <td className="px-6 py-4">ETB {entry.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="w-32">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}%</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">{daysLeft} days</td>
                        <td className="px-6 py-4">
                          <Link href={`/pools/${entry.pool_id}`} className="text-green-600 hover:text-green-700 text-sm">
                            View Pool →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Contributions */}
        {contributions.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold p-6 pb-0">📊 Recent Contributions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pool</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contributions.map(contribution => (
                    <tr key={contribution.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{contribution.pools?.prize_name || 'Unknown Pool'}</td>
                      <td className="px-6 py-4">ETB {contribution.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">{new Date(contribution.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          contribution.pools?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {contribution.pools?.status === 'active' ? 'Active' : 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {contributions.length === 0 && recentWins.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-2xl font-bold mb-2">No Activity Yet</h2>
            <p className="text-gray-500 mb-6">Start your journey by joining a prize pool!</p>
            <Link href="/listings" className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700">
              Browse Prize Pools →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
