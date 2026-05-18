import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [myPools, setMyPools] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);

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
      await loadMyPools(user.id);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAgentData(userId) {
    try {
      // 1. Fetch referrals from database
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_id,
          commission_earned,
          status,
          created_at,
          referred:profiles!referred_id(full_name, email)
        `)
        .eq('agent_id', userId)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('Referrals fetch error:', referralsError);
      }

      const formattedReferrals = (referralsData || []).map(ref => ({
        id: ref.id,
        name: ref.referred?.full_name || 'Anonymous User',
        email: ref.referred?.email || 'N/A',
        joined: new Date(ref.created_at).toLocaleDateString(),
        totalSpent: ref.commission_earned ? ref.commission_earned / 0.1 : 0,
        commission: ref.commission_earned || 0,
        status: ref.status
      }));

      setReferrals(formattedReferrals);

      // 2. Calculate stats
      const totalEarned = formattedReferrals.reduce((sum, r) => sum + r.commission, 0);
      const pending = formattedReferrals.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.commission, 0);
      const paid = formattedReferrals.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.commission, 0);

      setStats({ totalEarned, pending, paid });

      // 3. Top performers (by commission earned)
      const sorted = [...formattedReferrals].sort((a, b) => b.commission - a.commission).slice(0, 5);
      setTopPerformers(sorted.map(r => ({ name: r.name, spent: r.totalSpent, commission: r.commission })));

      // 4. Fetch withdrawal history
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false })
        .limit(10);

      setWithdrawalHistory(withdrawals || []);

    } catch (error) {
      console.error('Error loading agent data:', error);
    }
  }

  async function loadMyPools(userId) {
    try {
      const { data: pools } = await supabase
        .from('pools')
        .select('*')
        .eq('created_by', userId)
        .eq('creator_role', 'agent')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setMyPools(pools || []);
      
      // Mock pending deliveries (in real app, fetch from orders/deliveries table)
      setPendingDeliveries([
        { id: 1, product: 'iPhone 15 Pro', buyer: 'Abebe K.', status: 'processing', date: '2026-05-20' },
        { id: 2, product: 'Samsung TV', buyer: 'Tirhas H.', status: 'shipped', date: '2026-05-19' },
      ]);
    } catch (error) {
      console.error('Error loading pools:', error);
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${user?.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied to clipboard!');
  };

  const handleWithdrawRequest = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > stats.pending) {
      toast.error(`You can only withdraw up to ${stats.pending.toLocaleString()} ETB`);
      return;
    }
    if (amount < 100) {
      toast.error('Minimum withdrawal amount is 100 ETB');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount: amount,
        commission_type: 'agent',
        status: 'pending',
        payment_method: 'telebirr',
        requested_at: new Date().toISOString()
      });

    if (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to submit withdrawal request. Please try again.');
    } else {
      toast.success(`Withdrawal request of ${amount.toLocaleString()} ETB submitted!`);
      setWithdrawalAmount('');
      setShowWithdrawModal(false);
      await loadAgentData(user.id);
    }
    setSubmitting(false);
  };

  if (loading) return <LoadingSpinner fullPage message="Loading Agent Dashboard..." />;

  return (
    <DashboardLayout 
      title="Agent Dashboard" 
      subtitle="Create pools, recruit users, and earn 10% commission"
      icon="🤝"
      bgGradient="from-yellow-500 to-orange-500"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/" />

      {/* Role Description Card - Enhanced */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-xl p-5 mb-8">
        <h3 className="font-bold text-yellow-800 text-lg mb-2">✨ Your Role: Agent</h3>
        <p className="text-yellow-700 text-sm leading-relaxed">
          As an Agent, you can <strong className="font-bold">create prize pools</strong> for clients to participate in. 
          When your pool reaches its target and a winner is selected, you earn <strong className="font-bold">10% commission</strong> on the target amount.
        </p>
        <div className="mt-3 bg-white/50 rounded-lg p-3 text-sm">
          <p className="font-semibold text-yellow-800">💰 Commission Structure:</p>
          <p className="text-yellow-700 text-xs mt-1">
            • Winner gets: <strong>100% of target</strong><br/>
            • You earn: <strong>10% commission</strong> (added on top)<br/>
            • Platform fee: <strong>10%</strong> (added on top)<br/>
            • Total collected from participants: <strong>Target + 20%</strong>
          </p>
          <p className="text-xs text-yellow-600 mt-2">
            Example: Create a 1,000,000 ETB pool → Winner gets 1,000,000 → You earn 100,000 → Platform gets 100,000 → Total collected 1,200,000 ETB
          </p>
        </div>
      </div>

      {/* Welcome & Referral Link */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white rounded-2xl shadow-sm p-6 mb-8 border border-yellow-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome back, {profile?.full_name?.split(' ')[0] || 'Agent'}! 👋</h2>
          <p className="text-gray-500 mt-1">Your commission rate: <span className="font-bold text-green-600">{agentDetails?.commission_rate || 10}%</span></p>
        </div>
        
        <div className="mt-4 md:mt-0 bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
          <div className="text-sm">
            <p className="text-gray-500 font-medium mb-1">Your Referral Link</p>
            <code className="bg-gray-100 px-2 py-1 rounded text-gray-700 truncate max-w-[200px] inline-block">
              {window.location.origin}/register?ref={user?.id?.substring(0,8)}...
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

      {/* Quick Actions - Added Create Pool Button */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/create-pool" className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
          <div className="text-2xl mb-1">➕</div>
          <p className="font-semibold text-sm">Create Pool</p>
          <p className="text-xs opacity-80">Earn 10% commission</p>
        </Link>
        <button onClick={copyReferralLink} className="bg-blue-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
          <div className="text-2xl mb-1">🔗</div>
          <p className="font-semibold text-sm">Share Link</p>
          <p className="text-xs opacity-80">Invite users</p>
        </button>
        <button onClick={() => window.location.href = '/agent/earnings'} className="bg-purple-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
          <div className="text-2xl mb-1">📊</div>
          <p className="font-semibold text-sm">Earnings</p>
          <p className="text-xs opacity-80">View details</p>
        </button>
        <button onClick={() => window.location.href = '/agent/training'} className="bg-orange-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
          <div className="text-2xl mb-1">🎓</div>
          <p className="font-semibold text-sm">Training</p>
          <p className="text-xs opacity-80">Learn to earn more</p>
        </button>
      </div>

      {/* Commission Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-sm">
          <p className="text-sm text-green-700 font-medium">💰 Total Earned</p>
          <p className="text-3xl font-bold text-green-800 mt-2">{stats.totalEarned.toLocaleString()} ETB</p>
          <p className="text-xs text-green-600 mt-1">Lifetime commission</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl shadow-sm">
          <p className="text-sm text-yellow-700 font-medium">⏳ Pending Payout</p>
          <p className="text-3xl font-bold text-yellow-700 mt-2">{stats.pending.toLocaleString()} ETB</p>
          <p className="text-xs text-yellow-600 mt-1">Awaiting approval</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-sm">
          <p className="text-sm text-blue-700 font-medium">✅ Paid Successfully</p>
          <p className="text-3xl font-bold text-blue-700 mt-2">{stats.paid.toLocaleString()} ETB</p>
          <p className="text-xs text-blue-600 mt-1">Withdrawn to your account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referrals Table */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">📋 My Referrals</h3>
              <p className="text-sm text-gray-500">Total: {referrals.length} users</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-sm">
                    <th className="pb-3 px-2 font-medium">Name</th>
                    <th className="pb-3 px-2 font-medium">Email</th>
                    <th className="pb-3 px-2 font-medium">Joined</th>
                    <th className="pb-3 px-2 font-medium text-right">Total Spent</th>
                    <th className="pb-3 px-2 font-medium text-right">Commission</th>
                    <th className="pb-3 px-2 font-medium text-center">Status</th>
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
                      <td className="py-4 px-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          ref.status === 'paid' ? 'bg-green-100 text-green-700' : 
                          ref.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {ref.status || 'pending'}
                        </span>
                       </td>
                     </tr>
                  ))}
                  {referrals.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-4xl">🔗</span>
                          <p>No referrals yet. Share your link to start earning!</p>
                          <button onClick={copyReferralLink} className="mt-2 text-yellow-600 underline text-sm">Copy referral link</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Performers */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🏆</span> Top Performers
            </h3>
            <div className="space-y-3">
              {topPerformers.length > 0 ? (
                topPerformers.map((performer, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        idx === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        'bg-gradient-to-r from-amber-600 to-amber-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{performer.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-green-600 font-bold text-sm">{performer.commission.toLocaleString()} ETB</span>
                      <p className="text-xs text-gray-400">commission</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No referral activity yet</p>
              )}
            </div>
          </div>

          {/* My Pools Section - NEW */}
          {myPools.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>🏊</span> My Pools
              </h3>
              <div className="space-y-2">
                {myPools.slice(0, 3).map(pool => (
                  <div key={pool.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
                    <span className="font-medium">{pool.prize_name}</span>
                    <span className="text-green-600">{pool.status}</span>
                  </div>
                ))}
              </div>
              <Link href="/create-pool" className="block text-center text-yellow-600 text-sm mt-3 hover:underline">
                + Create New Pool
              </Link>
            </div>
          )}

          {/* Pending Deliveries - NEW */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>🚚</span> Pending Deliveries
            </h3>
            {pendingDeliveries.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No pending deliveries</p>
            ) : (
              <div className="space-y-2">
                {pendingDeliveries.map(delivery => (
                  <div key={delivery.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium">{delivery.product}</p>
                      <p className="text-xs text-gray-400">Buyer: {delivery.buyer}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      delivery.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {delivery.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Commission Breakdown - NEW */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-2xl shadow-sm border border-green-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>💰</span> Commission Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Your Commission Rate:</span>
                <span className="font-bold text-green-600">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee:</span>
                <span className="font-bold text-blue-600">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Winner Gets:</span>
                <span className="font-bold text-purple-600">100% of Target</span>
              </div>
              <div className="border-t border-green-200 mt-2 pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Example (1M ETB pool):</span>
                  <span className="font-bold">1,200,000 ETB total</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Winner: 1,000,000</span>
                  <span>You: 100,000</span>
                  <span>Platform: 100,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-yellow-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚡</span> Quick Actions
            </h3>
            <div className="space-y-3">
              <Link href="/create-pool" className="w-full bg-white border border-yellow-300 hover:border-yellow-500 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2">
                🏊 Create New Pool
              </Link>
              <button onClick={copyReferralLink} className="w-full bg-white border border-yellow-300 hover:border-yellow-500 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2">
                🔗 Share Referral Link
              </button>
              <button 
                onClick={() => setShowWithdrawModal(true)} 
                disabled={stats.pending === 0}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                  stats.pending > 0 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                💵 Withdraw Earnings {stats.pending > 0 && `(${stats.pending.toLocaleString()} ETB available)`}
              </button>
            </div>
          </div>

          {/* Tips for Success - NEW */}
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <span>💡</span> Tips for Success
            </h3>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Share your referral link on social media</li>
              <li>Create attractive prize pools to draw participants</li>
              <li>Follow up with your referrals to keep them active</li>
              <li>Withdraw earnings early to see your progress</li>
              <li>Complete your agent profile for better credibility</li>
            </ul>
          </div>

          {/* Withdrawal History */}
          {withdrawalHistory.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>📜</span> Recent Withdrawals
              </h3>
              <div className="space-y-2">
                {withdrawalHistory.slice(0, 3).map(w => (
                  <div key={w.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
                    <span>{new Date(w.requested_at).toLocaleDateString()}</span>
                    <span className="font-bold">{w.amount?.toLocaleString()} ETB</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      w.status === 'approved' ? 'bg-green-100 text-green-700' :
                      w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">💵 Withdraw Earnings</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <p className="text-gray-600 mb-2">Available for withdrawal: <strong className="text-green-600">{stats.pending.toLocaleString()} ETB</strong></p>
            <p className="text-xs text-gray-400 mb-4">Minimum withdrawal: 100 ETB</p>
            
            <input
              type="number"
              placeholder="Enter amount"
              className="w-full border rounded-lg p-3 mb-4"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
            />
            
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm">
              <p className="font-semibold text-blue-800">💡 Note:</p>
              <p className="text-blue-700 text-xs">Withdrawals are processed within 2-3 business days. Funds will be sent to your registered Telebirr account.</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleWithdrawRequest}
                disabled={submitting}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
              >
                {submitting ? 'Processing...' : 'Request Withdrawal'}
              </button>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
