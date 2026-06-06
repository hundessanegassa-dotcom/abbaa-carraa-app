// pages/agent/dashboard.js - UPDATED FOR UNIFIED AGENT SYSTEM
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
  
  const [stats, setStats] = useState({ 
    totalEarned: 0, 
    pending: 0, 
    paid: 0,
    totalCustomers: 0,
    totalContributions: 0
  });
  const [referrals, setReferrals] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [programStats, setProgramStats] = useState({
    regular: { customers: 0, commission: 0 },
    cityVip: { customers: 0, commission: 0 },
    merkatoVip: { customers: 0, commission: 0 }
  });
  const [paymentMethod, setPaymentMethod] = useState('telebirr');
  const [accountInfo, setAccountInfo] = useState({ account_number: '', account_name: '', account_phone: '' });

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

      // Check agent table
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (agentError || !agentData) {
        toast.error('You are not registered as an agent. Please apply first.');
        router.push('/become-agent');
        return;
      }
      
      if (!agentData.is_approved) {
        toast.error('Your agent application is pending approval.');
        router.push('/dashboard');
        return;
      }
      
      setAgentDetails(agentData);
      await loadAgentData(user.id);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAgentData(userId) {
    try {
      // 1. Fetch agent's referral code and link
      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (agent) {
        setAgentDetails(agent);
      }

      // 2. Fetch all referrals from agent_referrals table
      const { data: referralsData, error: referralsError } = await supabase
        .from('agent_referrals')
        .select(`
          id,
          customer_id,
          program_type,
          city_code,
          assigned_via,
          is_active,
          first_contribution_amount,
          total_contribution_amount,
          assigned_at,
          profiles:customer_id(full_name, email)
        `)
        .eq('agent_id', agent?.id);

      if (referralsError) {
        console.error('Referrals fetch error:', referralsError);
      }

      // 3. Fetch all commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('*')
        .eq('agent_id', agent?.id)
        .order('created_at', { ascending: false });

      if (commissionsError) {
        console.error('Commissions fetch error:', commissionsError);
      }

      setCommissions(commissionsData || []);

      // 4. Calculate program stats
      const programStatsCalc = {
        regular: { customers: 0, commission: 0 },
        cityVip: { customers: 0, commission: 0 },
        merkatoVip: { customers: 0, commission: 0 }
      };

      referralsData?.forEach(ref => {
        if (ref.program_type === 'regular') programStatsCalc.regular.customers++;
        else if (ref.program_type === 'city_vip') programStatsCalc.cityVip.customers++;
        else if (ref.program_type === 'merkato_vip') programStatsCalc.merkatoVip.customers++;
      });

      commissionsData?.forEach(comm => {
        if (comm.program_type === 'regular') programStatsCalc.regular.commission += comm.commission_amount;
        else if (comm.program_type === 'city_vip') programStatsCalc.cityVip.commission += comm.commission_amount;
        else if (comm.program_type === 'merkato_vip') programStatsCalc.merkatoVip.commission += comm.commission_amount;
      });

      setProgramStats(programStatsCalc);

      // 5. Format referrals for display
      const formattedReferrals = (referralsData || []).map(ref => {
        // Find matching commission for this customer
        const customerCommissions = (commissionsData || []).filter(c => 
          c.participant_id === ref.customer_id || 
          (c.program_type === ref.program_type && c.city_code === ref.city_code)
        );
        
        const totalCommission = customerCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
        const paidCommission = customerCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0);
        
        return {
          id: ref.id,
          name: ref.profiles?.full_name || 'Anonymous User',
          email: ref.profiles?.email || 'N/A',
          joined: new Date(ref.assigned_at).toLocaleDateString(),
          programType: ref.program_type,
          cityCode: ref.city_code,
          totalContribution: ref.total_contribution_amount || 0,
          commission: totalCommission,
          paidCommission: paidCommission,
          status: totalCommission > paidCommission ? 'pending' : 'paid',
          isActive: ref.is_active
        };
      });

      setReferrals(formattedReferrals);

      // 6. Calculate stats
      const totalEarned = commissionsData?.reduce((sum, c) => sum + (c.status === 'paid' ? c.commission_amount : 0), 0) || 0;
      const pending = commissionsData?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0) || 0;
      const paid = commissionsData?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0) || 0;
      const totalCustomers = formattedReferrals.length;
      const totalContributions = commissionsData?.reduce((sum, c) => sum + c.contribution_amount, 0) || 0;

      setStats({ totalEarned, pending, paid, totalCustomers, totalContributions });

      // 7. Top performers (by commission)
      const sorted = [...formattedReferrals].sort((a, b) => b.commission - a.commission).slice(0, 5);
      setTopPerformers(sorted.map(r => ({ 
        name: r.name, 
        spent: r.totalContribution, 
        commission: r.commission,
        programType: r.programType 
      })));

      // 8. Fetch withdrawal history
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('agent_id', agent?.id)
        .order('requested_at', { ascending: false })
        .limit(10);

      setWithdrawalHistory(withdrawals || []);

    } catch (error) {
      console.error('Error loading agent data:', error);
    }
  }

  const getProgramIcon = (programType) => {
    switch(programType) {
      case 'regular': return '🎁';
      case 'city_vip': return '🏙️';
      case 'merkato_vip': return '🏪';
      default: return '🎯';
    }
  };

  const getProgramLabel = (programType) => {
    switch(programType) {
      case 'regular': return 'Regular Pools';
      case 'city_vip': return 'City VIP';
      case 'merkato_vip': return 'Merkato VIP';
      default: return 'All Programs';
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${agentDetails?.referral_code}&program=${agentDetails?.program_type}&city=${agentDetails?.city_code || ''}`;
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
    if (!accountInfo.account_number && paymentMethod !== 'telebirr') {
      toast.error('Please enter your account number');
      return;
    }
    if (paymentMethod === 'telebirr' && !accountInfo.account_phone) {
      toast.error('Please enter your Telebirr phone number');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('withdrawals')
      .insert({
        agent_id: agentDetails?.id,
        amount: amount,
        payment_method: paymentMethod,
        account_number: paymentMethod === 'telebirr' ? accountInfo.account_phone : accountInfo.account_number,
        account_name: accountInfo.account_name,
        account_phone: accountInfo.account_phone,
        status: 'pending',
        requested_at: new Date().toISOString()
      });

    if (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to submit withdrawal request. Please try again.');
    } else {
      toast.success(`Withdrawal request of ${amount.toLocaleString()} ETB submitted!`);
      setWithdrawalAmount('');
      setAccountInfo({ account_number: '', account_name: '', account_phone: '' });
      setShowWithdrawModal(false);
      await loadAgentData(user.id);
    }
    setSubmitting(false);
  };

  if (loading) return <LoadingSpinner fullPage message="Loading Agent Dashboard..." />;

  return (
    <DashboardLayout 
      title="Agent Dashboard" 
      subtitle={`Earn 10% commission - ${getProgramLabel(agentDetails?.program_type)}`}
      icon="🤝"
      bgGradient="from-yellow-500 to-orange-500"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/" />

      {/* Agent Info Card */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-xl p-5 mb-8">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h3 className="font-bold text-yellow-800 text-lg mb-2">✨ Agent Information</h3>
            <p className="text-yellow-700 text-sm">
              <strong>Program:</strong> {getProgramLabel(agentDetails?.program_type)}<br/>
              {agentDetails?.city_code && <><strong>City:</strong> {agentDetails?.city_name}<br/></>}
              <strong>Referral Code:</strong> <code className="bg-yellow-100 px-2 py-0.5 rounded">{agentDetails?.referral_code}</code>
            </p>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="text-xs text-gray-600">Your Referral Link</p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1 truncate max-w-[250px]">
              {window.location.origin}/register?ref={agentDetails?.referral_code}
            </code>
          </div>
        </div>
      </div>

      {/* Commission Structure Banner */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 mb-8 border border-green-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <p className="font-bold text-green-800">Commission Structure</p>
              <p className="text-sm text-green-700">You earn <strong>10% commission</strong> on every successful contribution from customers you bring!</p>
              <p className="text-xs text-green-600 mt-1">Example: Customer contributes 10,000 ETB → You earn 1,000 ETB</p>
            </div>
          </div>
          <div className="bg-green-200 rounded-full px-4 py-2">
            <p className="font-bold text-green-800">Active: {stats.totalCustomers} Customers</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-lg">👥</div>
            <div>
              <p className="text-xs text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg">💰</div>
            <div>
              <p className="text-xs text-gray-500">Total Contributions</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalContributions.toLocaleString()} ETB</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center text-lg">⏳</div>
            <div>
              <p className="text-xs text-gray-500">Pending Commission</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending.toLocaleString()} ETB</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-teal-500 p-5 rounded-2xl shadow-sm text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">🏆</div>
            <div>
              <p className="text-xs font-medium opacity-90">Total Earned</p>
              <p className="text-2xl font-bold">{stats.totalEarned.toLocaleString()} ETB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Program-wise Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎁</span>
            <h4 className="font-semibold text-purple-800">Regular Pools</h4>
          </div>
          <p className="text-sm text-purple-700">Customers: {programStats.regular.customers}</p>
          <p className="text-sm font-bold text-purple-800">Commission: {programStats.regular.commission.toLocaleString()} ETB</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🏙️</span>
            <h4 className="font-semibold text-blue-800">City VIP</h4>
          </div>
          <p className="text-sm text-blue-700">Customers: {programStats.cityVip.customers}</p>
          <p className="text-sm font-bold text-blue-800">Commission: {programStats.cityVip.commission.toLocaleString()} ETB</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🏪</span>
            <h4 className="font-semibold text-yellow-800">Merkato VIP</h4>
          </div>
          <p className="text-sm text-yellow-700">Customers: {programStats.merkatoVip.customers}</p>
          <p className="text-sm font-bold text-yellow-800">Commission: {programStats.merkatoVip.commission.toLocaleString()} ETB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referrals Table */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h3 className="text-xl font-bold text-gray-800">📋 My Referrals</h3>
              <div className="flex gap-2">
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">Total: {referrals.length}</span>
                <button onClick={copyReferralLink} className="text-yellow-600 text-sm hover:underline">Share Link</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-sm">
                    <th className="pb-3 px-2 font-medium">Customer</th>
                    <th className="pb-3 px-2 font-medium">Program</th>
                    <th className="pb-3 px-2 font-medium">Joined</th>
                    <th className="pb-3 px-2 font-medium text-right">Contribution</th>
                    <th className="pb-3 px-2 font-medium text-right">Commission</th>
                    <th className="pb-3 px-2 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-2">
                        <div>
                          <p className="font-semibold text-gray-800">{ref.name}</p>
                          <p className="text-xs text-gray-400">{ref.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="flex items-center gap-1">
                          <span>{getProgramIcon(ref.programType)}</span>
                          <span className="text-xs">{getProgramLabel(ref.programType)}</span>
                        </span>
                      </td>
                      <td className="py-4 px-2 text-gray-500">{ref.joined}</td>
                      <td className="py-4 px-2 font-medium text-gray-800 text-right">{ref.totalContribution.toLocaleString()} ETB</td>
                      <td className="py-4 px-2 font-bold text-green-600 text-right">{ref.commission.toLocaleString()} ETB</td>
                      <td className="py-4 px-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          ref.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ref.status === 'paid' ? 'Paid' : 'Pending'}
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
              <span>🏆</span> Top Customers
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
                      <div>
                        <span className="font-semibold text-gray-800 text-sm">{performer.name}</span>
                        <p className="text-xs text-gray-400">{getProgramLabel(performer.programType)}</p>
                      </div>
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

          {/* Recent Commissions */}
          {commissions.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>📊</span> Recent Commissions
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {commissions.slice(0, 5).map(comm => (
                  <div key={comm.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium">{getProgramLabel(comm.program_type)}</p>
                      <p className="text-xs text-gray-400">{new Date(comm.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{comm.commission_amount.toLocaleString()} ETB</p>
                      <span className={`text-xs ${comm.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {comm.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-yellow-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚡</span> Quick Actions
            </h3>
            <div className="space-y-3">
              <button onClick={copyReferralLink} className="w-full bg-white border border-yellow-300 hover:border-yellow-500 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2">
                🔗 Share Referral Link
              </button>
              <Link href="/listings" className="w-full bg-white border border-yellow-300 hover:border-yellow-500 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 block text-center">
                🎁 Browse Pools
              </Link>
              <button 
                onClick={() => setShowWithdrawModal(true)} 
                disabled={stats.pending === 0}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                  stats.pending > 0 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                💵 Withdraw {stats.pending > 0 && `(${stats.pending.toLocaleString()} ETB)`}
              </button>
            </div>
          </div>

          {/* Tips for Success */}
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <span>💡</span> Tips for Success
            </h3>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Share your referral link on social media</li>
              <li>Share with friends and family in your city</li>
              <li>Follow up with your referrals to keep them active</li>
              <li>Withdraw earnings early to see your progress</li>
              <li>Complete your profile for better credibility</li>
            </ul>
          </div>

          {/* Withdrawal History */}
          {withdrawalHistory.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>📜</span> Withdrawal History
              </h3>
              <div className="space-y-2">
                {withdrawalHistory.slice(0, 3).map(w => (
                  <div key={w.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
                    <span>{new Date(w.requested_at).toLocaleDateString()}</span>
                    <span className="font-bold">{w.amount?.toLocaleString()} ETB</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      w.status === 'completed' ? 'bg-green-100 text-green-700' :
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
            
            {/* Payment Method Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('telebirr')}
                  className={`flex-1 py-2 rounded-lg border transition ${
                    paymentMethod === 'telebirr' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  📱 Telebirr
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`flex-1 py-2 rounded-lg border transition ${
                    paymentMethod === 'bank' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  🏦 Bank Transfer
                </button>
              </div>
            </div>
            
            {paymentMethod === 'telebirr' && (
              <input
                type="tel"
                placeholder="Telebirr Phone Number"
                className="w-full border rounded-lg p-3 mb-4"
                value={accountInfo.account_phone}
                onChange={(e) => setAccountInfo({ ...accountInfo, account_phone: e.target.value })}
              />
            )}
            
            {paymentMethod === 'bank' && (
              <>
                <input
                  type="text"
                  placeholder="Bank Account Number"
                  className="w-full border rounded-lg p-3 mb-3"
                  value={accountInfo.account_number}
                  onChange={(e) => setAccountInfo({ ...accountInfo, account_number: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Account Holder Name"
                  className="w-full border rounded-lg p-3 mb-3"
                  value={accountInfo.account_name}
                  onChange={(e) => setAccountInfo({ ...accountInfo, account_name: e.target.value })}
                />
              </>
            )}
            
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm">
              <p className="font-semibold text-blue-800">💡 Note:</p>
              <p className="text-blue-700 text-xs">Withdrawals are processed within 2-3 business days after draw completion.</p>
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
