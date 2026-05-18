import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [agentDetails, setAgentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({ totalEarned: 0, pending: 0, paid: 0 });
  const [referrals, setReferrals] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);

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

      // Check agent specific table
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      setAgentDetails(agentData || { commission_rate: 10 });
      await loadAgentData(user.id);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAgentData(userId) {
    // In a real scenario, you'd fetch from a commissions/referrals table.
    // Assuming some mock logic here for the schema or basic fetch if tables exist.
    // For now, we mock some realistic data structure since schema isn't fully defined for agent referrals.
    
    // MOCK DATA for demonstration as per requirements
    setStats({
      totalEarned: 45000,
      pending: 15000,
      paid: 30000
    });
    
    setReferrals([
      { id: 1, name: 'Abebe Kebede', email: 'abebe@example.com', joined: '2026-05-01', totalSpent: 5000, commission: 500 },
      { id: 2, name: 'Tirhas Hailu', email: 'tirhas@example.com', joined: '2026-05-03', totalSpent: 12000, commission: 1200 },
      { id: 3, name: 'Dawit Mengistu', email: 'dawit@example.com', joined: '2026-05-10', totalSpent: 2000, commission: 200 },
    ]);

    setTopPerformers([
      { name: 'Tirhas Hailu', spent: 12000 },
      { name: 'Abebe Kebede', spent: 5000 },
      { name: 'Dawit Mengistu', spent: 2000 }
    ]);
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${user?.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied to clipboard!');
  };

  if (loading) return <LoadingSpinner fullPage message="Loading Agent Dashboard..." />;

  return (
    <DashboardLayout 
      title="Agent Dashboard" 
      subtitle="Recruit users, manage referrals, earn commissions"
      icon="🤝"
      bgGradient="from-yellow-500 to-orange-500"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/" />

      {/* Welcome & Referral Link */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white rounded-2xl shadow-sm p-6 mb-8 border border-yellow-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Agent Portal</h2>
          <p className="text-gray-500 mt-1">Your commission rate: <span className="font-bold text-green-600">{agentDetails?.commission_rate || 10}%</span></p>
        </div>
        
        <div className="mt-4 md:mt-0 bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
          <div className="text-sm">
            <p className="text-gray-500 font-medium mb-1">Your Referral Link</p>
            <code className="bg-gray-100 px-2 py-1 rounded text-gray-700 truncate max-w-[200px] inline-block">
              {window.location.origin}/register?ref={user?.id.substring(0,8)}...
            </code>
          </div>
          <button 
            onClick={copyReferralLink}
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition"
            title="Copy Link"
          >
            📋 Copy
          </button>
        </div>
      </div>

      {/* Commission Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-medium">Total Earned</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalEarned.toLocaleString()} ETB</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-medium">Pending Payout</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending.toLocaleString()} ETB</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-medium">Paid Successfully</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.paid.toLocaleString()} ETB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referrals Table */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-xl font-bold text-gray-800 mb-6">My Referrals</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-sm">
                    <th className="pb-3 px-2 font-medium">Name</th>
                    <th className="pb-3 px-2 font-medium">Email</th>
                    <th className="pb-3 px-2 font-medium">Joined</th>
                    <th className="pb-3 px-2 font-medium text-right">Total Spent</th>
                    <th className="pb-3 px-2 font-medium text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-2 font-semibold text-gray-800">{ref.name}</td>
                      <td className="py-4 px-2 text-gray-500">{ref.email}</td>
                      <td className="py-4 px-2 text-gray-500">{ref.joined}</td>
                      <td className="py-4 px-2 font-medium text-gray-800 text-right">{ref.totalSpent.toLocaleString()} ETB</td>
                      <td className="py-4 px-2 font-bold text-green-600 text-right">{ref.commission.toLocaleString()} ETB</td>
                    </tr>
                  ))}
                  {referrals.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">No referrals yet. Share your link to start earning!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Performance & Quick Actions */}
        <div className="space-y-8">
          {/* Top Performers */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⭐</span> Top Performers
            </h3>
            <div className="space-y-4">
              {topPerformers.map((user, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">{user.name}</span>
                  </div>
                  <span className="text-green-600 font-bold text-sm">{user.spent.toLocaleString()} ETB</span>
                </div>
              ))}
              {topPerformers.length === 0 && <p className="text-gray-500 text-sm text-center">Not enough data.</p>}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚡</span> Quick Actions
            </h3>
            <div className="space-y-3">
              <button onClick={copyReferralLink} className="w-full bg-white border border-gray-300 hover:border-yellow-500 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition">
                🔗 Share Referral Link
              </button>
              <button className="w-full bg-white border border-gray-300 hover:border-yellow-500 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition">
                📊 View History
              </button>
              <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl font-semibold text-sm transition shadow-sm">
                💵 Withdraw Earnings
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
