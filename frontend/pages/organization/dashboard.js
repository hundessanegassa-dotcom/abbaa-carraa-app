import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';

export default function OrganizationDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({ totalPools: 0, totalParticipants: 0, totalCollected: 0, totalPaid: 0 });
  const [pools, setPools] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);

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
        .single();

      setProfile(profile || {});
      
      if (profile && profile.agreement_accepted !== true) {
        router.push('/register');
        return;
      }

      await loadOrganizationData(user.id);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrganizationData(userId) {
    // Real data fetch from pools created by this user
    const { data: myPools, error } = await supabase
      .from('pools')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (!error && myPools) {
      setPools(myPools);
      
      const totalPools = myPools.length;
      const totalParticipants = myPools.reduce((sum, p) => sum + (p.participants_count || 0), 0);
      const totalCollected = myPools.reduce((sum, p) => sum + (p.current_amount || 0), 0);
      
      // Filter ended pools without a winner payout or marked pending
      const payouts = myPools.filter(p => p.status === 'completed' && !p.winner_id); // basic logic
      setPendingPayouts(payouts);

      setStats({
        totalPools,
        totalParticipants,
        totalCollected,
        totalPaid: 0 // Mock for now unless tracked
      });
    }
  }

  const exportParticipants = (poolId, poolName) => {
    // In a real app, fetch participants for this pool
    // For now, mock CSV download
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Tickets\nAbebe,abebe@example.com,2\nTirhas,tirhas@example.com,1";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `participants_${poolName.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Participant list exported!');
  };

  const handleEndPool = async (id) => {
    if (confirm('Are you sure you want to manually end this pool early?')) {
      const { error } = await supabase.from('pools').update({ status: 'completed' }).eq('id', id);
      if (error) toast.error('Failed to end pool');
      else {
        toast.success('Pool ended successfully');
        loadOrganizationData(user.id);
      }
    }
  };

  if (loading) return <LoadingSpinner fullPage message="Loading Organization Dashboard..." />;

  return (
    <DashboardLayout 
      title="Organization Dashboard" 
      subtitle="Create pools, manage participants, and handle payouts"
      icon="🏢"
      bgGradient="from-blue-500 to-cyan-500"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/" />

      {/* Analytics Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">🏊</div>
          <p className="text-sm text-gray-500 font-medium">Total Pools</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalPools}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">👥</div>
          <p className="text-sm text-gray-500 font-medium">Total Participants</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalParticipants}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">💰</div>
          <p className="text-sm text-gray-500 font-medium">Fees Collected</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{stats.totalCollected.toLocaleString()} ETB</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">💸</div>
          <p className="text-sm text-gray-500 font-medium">Total Paid Out</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{stats.totalPaid.toLocaleString()} ETB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Pools List */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">My Pools</h3>
              <Link href="/create-pool?type=private" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-1">
                <span>➕</span> Create New Pool
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-sm">
                    <th className="pb-3 px-2 font-medium">Pool Name</th>
                    <th className="pb-3 px-2 font-medium">Entry Fee</th>
                    <th className="pb-3 px-2 font-medium">Prize (Target)</th>
                    <th className="pb-3 px-2 font-medium text-center">Users</th>
                    <th className="pb-3 px-2 font-medium">Status</th>
                    <th className="pb-3 px-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pools.map((pool) => (
                    <tr key={pool.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-2">
                        <span className="font-semibold text-gray-800 block">{pool.prize_name}</span>
                        <span className="text-[10px] text-gray-400">{pool.category}</span>
                      </td>
                      <td className="py-4 px-2 font-medium text-gray-800">{pool.contribution_amount?.toLocaleString()} ETB</td>
                      <td className="py-4 px-2 font-bold text-blue-600">{pool.target_amount?.toLocaleString()} ETB</td>
                      <td className="py-4 px-2 text-center font-semibold">{pool.participants_count || 0}</td>
                      <td className="py-4 px-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          pool.status === 'active' ? 'bg-green-100 text-green-700' : 
                          pool.status === 'completed' ? 'bg-gray-200 text-gray-600' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {pool.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => exportParticipants(pool.id, pool.prize_name)} className="text-gray-600 hover:bg-gray-200 p-1.5 rounded transition" title="Export Participants">📥</button>
                          {pool.status === 'active' && (
                            <>
                              <Link href={`/pools/${pool.id}`} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition" title="View">👁️</Link>
                              <button onClick={() => handleEndPool(pool.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition" title="End Pool Early">🛑</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pools.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-500">
                        <p className="mb-2">You haven't created any pools yet.</p>
                        <Link href="/create-pool?type=private" className="text-blue-600 font-semibold hover:underline">Create your first pool</Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Pending Payouts & Quick Actions */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-yellow-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚠️</span> Pending Payouts
            </h3>
            <div className="space-y-4">
              {pendingPayouts.map((pool) => (
                <div key={pool.id} className="p-4 bg-white rounded-xl shadow-sm border border-yellow-200">
                  <h4 className="font-bold text-gray-800 text-sm mb-1">{pool.prize_name}</h4>
                  <div className="flex justify-between text-xs mb-3">
                    <span className="text-gray-500">Ended: {new Date(pool.end_date || pool.updated_at).toLocaleDateString()}</span>
                    <span className="font-bold text-orange-600">{pool.target_amount?.toLocaleString()} ETB</span>
                  </div>
                  <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold text-xs transition">
                    Process Payout
                  </button>
                </div>
              ))}
              {pendingPayouts.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-2 opacity-70">No pending payouts. Great job!</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="text-blue-600 hover:underline">How to manage private pools?</Link></li>
              <li><Link href="/faq" className="text-blue-600 hover:underline">Payout processing guide</Link></li>
              <li><Link href="/contact" className="text-blue-600 hover:underline">Contact Organization Support</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
