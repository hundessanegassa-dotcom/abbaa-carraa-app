import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import LoyaltyPoints from '../components/LoyaltyPoints';

export default function IndividualDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [activeEntries, setActiveEntries] = useState([]);
  const [recentWins, setRecentWins] = useState([]);
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
    await fetchProfile(user.id);
    await fetchContributions(user.id);
    await fetchActiveEntries(user.id);
    await fetchRecentWins(user.id);
    setLoading(false);
  }

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  }

  async function fetchContributions(userId) {
    const { data } = await supabase.from('contributions').select('*, pools(prize_name, target_amount, status)').eq('user_id', userId).eq('status', 'completed').order('created_at', { ascending: false }).limit(10);
    setContributions(data || []);
  }

  async function fetchActiveEntries(userId) {
    const { data } = await supabase.from('contributions').select('*, pools(prize_name, target_amount, current_amount, status, end_date)').eq('user_id', userId).eq('status', 'completed').eq('pools.status', 'active');
    setActiveEntries(data || []);
  }

  async function fetchRecentWins(userId) {
    const { data } = await supabase.from('pools').select('*').eq('winner_id', userId).eq('status', 'completed').order('completed_at', { ascending: false }).limit(5);
    setRecentWins(data || []);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  }

  const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalWins = recentWins.length;
  const activeCount = activeEntries.length;

  return (
    <DashboardLayout 
      title="My Dashboard" 
      subtitle="Track your activity, wins, and contributions"
      icon="🎯"
      bgGradient="from-green-600 to-teal-500"
      user={user}
      profile={profile}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Total Contributions</p><p className="text-3xl font-bold text-green-600">ETB {totalContributions.toLocaleString()}</p></div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><span className="text-xl">💰</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Total Wins</p><p className="text-3xl font-bold text-yellow-600">{totalWins}</p></div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center"><span className="text-xl">🏆</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Active Entries</p><p className="text-3xl font-bold text-blue-600">{activeCount}</p></div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-xl">🎯</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Entries */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50"><h2 className="text-lg font-bold flex items-center gap-2">🎯 Active Entries</h2></div>
            <div className="p-6">
              {activeEntries.length === 0 ? (
                <div className="text-center py-8"><p className="text-gray-400">No active entries yet</p><Link href="/listings" className="text-green-600 text-sm mt-2 inline-block">Browse Pools →</Link></div>
              ) : (
                <div className="space-y-4">{activeEntries.map(entry => {
                  const progress = (entry.pools.current_amount / entry.pools.target_amount) * 100;
                  return (<div key={entry.id} className="border rounded-xl p-4 hover:shadow-md transition"><div className="flex justify-between items-start mb-2"><div><h3 className="font-bold text-gray-800">{entry.pools.prize_name}</h3><p className="text-sm text-gray-500">Contributed: ETB {entry.amount.toLocaleString()}</p></div><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span></div><div className="mt-2"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progress</span><span>{Math.round(progress)}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div></div></div><Link href={`/pools/${entry.pool_id}`} className="text-green-600 text-sm mt-3 inline-block hover:underline">View Details →</Link></div>);
                })}</div>
              )}
            </div>
          </div>

          {/* Recent Wins */}
          {recentWins.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50"><h2 className="text-lg font-bold flex items-center gap-2">🏆 Recent Wins</h2></div>
              <div className="p-6"><div className="space-y-3">{recentWins.map(win => (<div key={win.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl"><div><p className="font-semibold text-gray-800">{win.prize_name}</p><p className="text-sm text-gray-500">Won: {new Date(win.completed_at).toLocaleDateString()}</p></div><div className="text-right"><p className="font-bold text-green-600">ETB {win.target_amount.toLocaleString()}</p><span className="text-xs text-green-600">✓ Claimed</span></div></div>))}</div></div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <LoyaltyPoints userId={user?.id} />
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-6 text-white"><h3 className="text-xl font-bold mb-3">🎯 How to Win</h3><ul className="space-y-2 text-sm"><li>🔍 Browse prize pools</li><li>💰 Contribute small amount</li><li>🎲 Fair random draw</li><li>🏆 Win amazing prizes!</li></ul><Link href="/listings" className="inline-block mt-4 bg-white text-green-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100">Start Playing →</Link></div>
          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-6 text-white"><h3 className="text-xl font-bold mb-2">❤️ Making a Difference</h3><p className="text-sm opacity-95 mb-3">2% of all income supports Ethiopians fighting kidney & heart disease.</p><div className="flex items-center gap-2 text-sm"><span>💚</span><span>Every contribution saves lives</span></div></div>
        </div>
      </div>
    </DashboardLayout>
  );
}
