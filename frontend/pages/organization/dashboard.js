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
  const [orgDetails, setOrgDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [stats, setStats] = useState({ totalPools: 0, totalParticipants: 0, totalCollected: 0, totalPaid: 0, commissionEarned: 0 });
  const [pools, setPools] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [winnerId, setWinnerId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

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

      // Get organization details
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setOrgDetails(orgData);

      await loadOrganizationData(user.id);
      await loadMembers(user.id);
      await loadRecentActivity(user.id);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrganizationData(userId) {
    try {
      // Fetch pools created by this organization
      const { data: myPools, error } = await supabase
        .from('pools')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPools(myPools || []);
      
      const totalPools = myPools?.length || 0;
      const totalParticipants = myPools?.reduce((sum, p) => sum + (p.participants_count || 0), 0) || 0;
      const totalCollected = myPools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
      
      // Commission earned: 10% of total collected from organization pools
      const commissionEarned = totalCollected * 0.10;
      
      // Find pools that need payout (completed but no winner)
      const payouts = myPools?.filter(p => p.status === 'completed' && !p.winner_id) || [];
      setPendingPayouts(payouts);

      // Calculate total paid out
      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('amount')
        .eq('organization_id', userId)
        .eq('status', 'completed');

      const totalPaid = payoutsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setStats({
        totalPools,
        totalParticipants,
        totalCollected,
        totalPaid,
        commissionEarned
      });

    } catch (error) {
      console.error('Error loading organization data:', error);
      toast.error('Failed to load organization data');
    }
  }

  async function loadMembers(userId) {
    try {
      // Fetch organization members
      const { data: memberData } = await supabase
        .from('organization_members')
        .select(`
          id,
          status,
          joined_at,
          user:profiles!user_id(full_name, email, phone)
        `)
        .eq('organization_id', userId);
      
      const approved = memberData?.filter(m => m.status === 'approved') || [];
      const pending = memberData?.filter(m => m.status === 'pending') || [];
      
      setMembers(approved);
      setPendingMembers(pending);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  async function loadRecentActivity(userId) {
    try {
      // Fetch recent pool activities
      const { data: recentPools } = await supabase
        .from('pools')
        .select('prize_name, status, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      const activities = (recentPools || []).map(pool => ({
        action: `Pool "${pool.prize_name}" was ${pool.status}`,
        date: pool.created_at,
        icon: pool.status === 'active' ? '✅' : '📋'
      }));
      
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  }

  async function loadPoolParticipants(poolId) {
    try {
      const { data, error } = await supabase
        .from('pool_entries')
        .select(`
          id,
          user_id,
          ticket_count,
          entry_amount,
          created_at,
          user:profiles!user_id(full_name, email, phone)
        `)
        .eq('pool_id', poolId);

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Error loading participants:', error);
      toast.error('Failed to load participants');
    }
  }

  const exportParticipants = async (poolId, poolName) => {
    try {
      toast.loading('Generating export...');
      
      const { data, error } = await supabase
        .from('pool_entries')
        .select(`
          user:profiles!user_id(full_name, email, phone),
          ticket_count,
          entry_amount,
          created_at
        `)
        .eq('pool_id', poolId);

      if (error) throw error;

      const headers = ['Name', 'Email', 'Phone', 'Tickets', 'Entry Amount', 'Joined Date'];
      const rows = (data || []).map(entry => [
        entry.user?.full_name || 'N/A',
        entry.user?.email || 'N/A',
        entry.user?.phone || 'N/A',
        entry.ticket_count || 1,
        entry.entry_amount || 0,
        new Date(entry.created_at).toLocaleDateString()
      ]);

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `participants_${poolName.replace(/\s/g, '_')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success(`Exported ${data?.length || 0} participants!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss();
      toast.error('Failed to export participants');
    }
  };

  const handleEndPool = async (poolId) => {
    if (!confirm('Are you sure you want to manually end this pool? This will stop all new entries.')) return;
    
    setSubmitting(true);
    const { error } = await supabase
      .from('pools')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', poolId);
    
    if (error) {
      toast.error('Failed to end pool');
    } else {
      toast.success('Pool ended successfully');
      await loadOrganizationData(user.id);
      await loadRecentActivity(user.id);
    }
    setSubmitting(false);
  };

  const handleDeletePool = async (poolId) => {
    if (!confirm('⚠️ WARNING: This will permanently delete the pool and all entries. This cannot be undone. Are you sure?')) return;
    
    setSubmitting(true);
    const { error } = await supabase
      .from('pools')
      .delete()
      .eq('id', poolId);
    
    if (error) {
      toast.error('Failed to delete pool');
    } else {
      toast.success('Pool deleted successfully');
      await loadOrganizationData(user.id);
    }
    setSubmitting(false);
  };

  const openPayoutModal = async (pool) => {
    setSelectedPool(pool);
    await loadPoolParticipants(pool.id);
    setPayoutAmount(pool.target_amount?.toString() || '');
    setWinnerId('');
    setShowPayoutModal(true);
  };

  const processPayout = async () => {
    if (!winnerId) {
      toast.error('Please select a winner');
      return;
    }

    setSubmitting(true);
    
    const { error: poolError } = await supabase
      .from('pools')
      .update({
        winner_id: winnerId,
        status: 'paid',
        paid_at: new Date().toISOString(),
        payout_amount: parseFloat(payoutAmount)
      })
      .eq('id', selectedPool.id);

    if (poolError) {
      toast.error('Failed to process payout: ' + poolError.message);
      setSubmitting(false);
      return;
    }

    const { error: payoutError } = await supabase
      .from('payouts')
      .insert({
        pool_id: selectedPool.id,
        organization_id: user.id,
        winner_id: winnerId,
        amount: parseFloat(payoutAmount),
        status: 'completed',
        processed_at: new Date().toISOString()
      });

    if (payoutError) {
      console.error('Payout record error:', payoutError);
    }

    await supabase
      .from('profiles')
      .update({
        total_wins: supabase.raw('total_wins + 1'),
        total_won: supabase.raw(`total_won + ${parseFloat(payoutAmount)}`)
      })
      .eq('id', winnerId);

    toast.success(`Payout of ${parseFloat(payoutAmount).toLocaleString()} ETB processed!`);
    setShowPayoutModal(false);
    await loadOrganizationData(user.id);
    await loadRecentActivity(user.id);
    setSubmitting(false);
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }
    
    setSubmitting(true);
    // In real app, send invitation email and create pending member record
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
    setShowInviteModal(false);
    setSubmitting(false);
  };

  if (loading) return <LoadingSpinner fullPage message="Loading Organization Dashboard..." />;

  return (
    <DashboardLayout 
      title="Organization Dashboard" 
      subtitle="Create private pools for members, manage participation, and earn 10% commission"
      icon="🏢"
      bgGradient="from-blue-600 to-cyan-600"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/" />

      {/* Role Description Card - Enhanced with correct 10% commission */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-xl p-5 mb-8">
        <h3 className="font-bold text-blue-800 text-lg mb-2">✨ Your Role: Organization Organizer</h3>
        <p className="text-blue-700 text-sm leading-relaxed">
          As an Organization Organizer, you can <strong className="font-bold">create private prize pools</strong> exclusively for your organization members. 
          When your pool reaches its target and a winner is selected, you earn <strong className="font-bold">10% commission</strong> on the target amount.
        </p>
        <div className="mt-3 bg-white/50 rounded-lg p-3 text-sm">
          <p className="font-semibold text-blue-800">💰 Commission Structure (Organization Pools):</p>
          <p className="text-blue-700 text-xs mt-1">
            • Winner gets: <strong>100% of target</strong><br/>
            • You earn: <strong>10% commission</strong> (added on top)<br/>
            • Platform fee: <strong>10%</strong> (added on top)<br/>
            • Total collected from members: <strong>Target + 20%</strong>
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Example: Create a 1,000,000 ETB private pool → Winner gets 1,000,000 → Your organization earns 100,000 → Platform gets 100,000 → Total collected 1,200,000 ETB
          </p>
        </div>
        {orgDetails && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">📧 {orgDetails.business_email}</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">📞 {orgDetails.phone}</span>
            {orgDetails.verified && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">✓ Verified Organization</span>}
          </div>
        )}
      </div>

      {/* Quick Actions - New Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/create-pool?type=private" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
          <div className="text-2xl mb-1">➕</div>
          <p className="font-semibold text-sm">Create Private Pool</p>
          <p className="text-xs opacity-80">Earn 10% commission</p>
        </Link>
        <button onClick={() => setShowInviteModal(true)} className="bg-green-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
          <div className="text-2xl mb-1">📧</div>
          <p className="font-semibold text-sm">Invite Member</p>
          <p className="text-xs opacity-80">Add to organization</p>
        </button>
        <button onClick={() => window.location.href = '/organization/analytics'} className="bg-purple-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
          <div className="text-2xl mb-1">📊</div>
          <p className="font-semibold text-sm">Analytics</p>
          <p className="text-xs opacity-80">View reports</p>
        </button>
        <button onClick={() => window.location.href = '/organization/settings'} className="bg-gray-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
          <div className="text-2xl mb-1">⚙️</div>
          <p className="font-semibold text-sm">Settings</p>
          <p className="text-xs opacity-80">Manage organization</p>
        </button>
      </div>

      {/* Analytics Cards - Added Commission Earned */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl">🏊</div>
          <p className="text-sm text-gray-500 font-medium">Total Pools</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalPools}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl">👥</div>
          <p className="text-sm text-gray-500 font-medium">Members</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{members.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl">💰</div>
          <p className="text-sm text-gray-500 font-medium">Fees Collected</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{stats.totalCollected.toLocaleString()} ETB</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl">💸</div>
          <p className="text-sm text-gray-500 font-medium">Commission Earned</p>
          <p className="text-xl font-bold text-purple-600 mt-1">{Math.floor(stats.commissionEarned).toLocaleString()} ETB</p>
          <p className="text-xs text-gray-400">10% of collections</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-5 rounded-2xl shadow-sm text-center text-white">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl">🎯</div>
          <p className="text-sm font-medium opacity-90">Paid Out</p>
          <p className="text-2xl font-bold mt-1">{stats.totalPaid.toLocaleString()} ETB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Pools List */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h3 className="text-xl font-bold text-gray-800">🏊 My Private Pools</h3>
              <Link href="/create-pool?type=private" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-2">
                <span>➕</span> Create New Pool
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-3 px-3 font-semibold text-gray-600 text-sm">Pool Name</th>
                    <th className="py-3 px-3 font-semibold text-gray-600 text-sm">Entry Fee</th>
                    <th className="py-3 px-3 font-semibold text-gray-600 text-sm">Target</th>
                    <th className="py-3 px-3 font-semibold text-gray-600 text-sm text-center">Members</th>
                    <th className="py-3 px-3 font-semibold text-gray-600 text-sm">Status</th>
                    <th className="py-3 px-3 font-semibold text-gray-600 text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pools.map((pool) => (
                    <tr key={pool.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-4 px-3">
                        <span className="font-semibold text-gray-800 block">{pool.prize_name}</span>
                        <span className="text-xs text-gray-400">{pool.category || 'Private Pool'}</span>
                      </td>
                      <td className="py-4 px-3 font-medium text-gray-800">{pool.entry_fee?.toLocaleString()} ETB</td>
                      <td className="py-4 px-3 font-bold text-blue-600">{pool.target_amount?.toLocaleString()} ETB</td>
                      <td className="py-4 px-3 text-center font-semibold">{pool.participants_count || 0}</td>
                      <td className="py-4 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                          pool.status === 'active' ? 'bg-green-100 text-green-700' : 
                          pool.status === 'completed' ? 'bg-yellow-100 text-yellow-700' : 
                          pool.status === 'paid' ? 'bg-gray-100 text-gray-600' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {pool.status === 'paid' ? 'PAID' : pool.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                       </td>
                      <td className="py-4 px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => exportParticipants(pool.id, pool.prize_name)} 
                            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition" 
                            title="Export Participants"
                          >
                            📥
                          </button>
                          <Link 
                            href={`/pools/${pool.id}`} 
                            className="text-gray-500 hover:text-green-600 hover:bg-green-50 p-2 rounded-lg transition" 
                            title="View Pool"
                          >
                            👁️
                          </Link>
                          {pool.status === 'active' && (
                            <button 
                              onClick={() => handleEndPool(pool.id)} 
                              disabled={submitting}
                              className="text-gray-500 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition" 
                              title="End Pool Early"
                            >
                              🛑
                            </button>
                          )}
                          {pool.status === 'completed' && !pool.winner_id && (
                            <button 
                              onClick={() => openPayoutModal(pool)} 
                              className="text-gray-500 hover:text-green-600 hover:bg-green-50 p-2 rounded-lg transition" 
                              title="Process Payout"
                            >
                              💸
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeletePool(pool.id)} 
                            disabled={submitting}
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition" 
                            title="Delete Pool"
                          >
                            🗑️
                          </button>
                        </div>
                       </td>
                     </tr>
                  ))}
                  {pools.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-5xl">🏊</span>
                          <p>You haven't created any private pools yet.</p>
                          <Link href="/create-pool?type=private" className="text-blue-600 font-semibold hover:underline">
                            Create your first pool →
                          </Link>
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
          {/* Member Management - NEW */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>👥</span> Member Management
              {pendingMembers.length > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingMembers.length} pending</span>
              )}
            </h3>
            
            {pendingMembers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">Pending Approvals</p>
                {pendingMembers.map(member => (
                  <div key={member.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-sm">{member.user?.full_name || 'New Member'}</p>
                      <p className="text-xs text-gray-400">{member.user?.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-green-500 text-white px-2 py-1 rounded text-xs">Approve</button>
                      <button className="bg-red-500 text-white px-2 py-1 rounded text-xs">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Members ({members.length})</p>
              {members.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No members yet. Invite members to join your organization.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {members.slice(0, 5).map(member => (
                    <div key={member.id} className="flex justify-between items-center text-sm py-1">
                      <span>{member.user?.full_name?.split(' ')[0]}</span>
                      <span className="text-xs text-gray-400">Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <button 
                onClick={() => setShowInviteModal(true)}
                className="w-full mt-3 text-blue-600 text-sm font-medium hover:underline"
              >
                + Invite New Member
              </button>
            </div>
          </div>

          {/* Pending Payouts */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-yellow-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚠️</span> Pending Payouts
              {pendingPayouts.length > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingPayouts.length}</span>
              )}
            </h3>
            <div className="space-y-3">
              {pendingPayouts.map((pool) => (
                <div key={pool.id} className="p-4 bg-white rounded-xl shadow-sm border border-yellow-200">
                  <h4 className="font-bold text-gray-800 text-sm mb-1">{pool.prize_name}</h4>
                  <div className="flex justify-between text-xs mb-3">
                    <span className="text-gray-500">Participants: {pool.participants_count || 0}</span>
                    <span className="font-bold text-orange-600">{pool.target_amount?.toLocaleString()} ETB</span>
                  </div>
                  <button 
                    onClick={() => openPayoutModal(pool)} 
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2 rounded-lg font-semibold text-xs transition"
                  >
                    Process Payout
                  </button>
                </div>
              ))}
              {pendingPayouts.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">✅ No pending payouts</p>
                  <p className="text-xs text-gray-400 mt-1">All completed pools have been paid out</p>
                </div>
              )}
            </div>
          </div>

          {/* Commission Breakdown - NEW */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-2xl shadow-sm border border-green-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>💰</span> Commission Breakdown (10%)
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

          {/* Recent Activity - NEW */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>📋</span> Recent Activity
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm py-2 border-b border-gray-100">
                    <span>{activity.icon}</span>
                    <span className="text-gray-600">{activity.action}</span>
                    <span className="text-xs text-gray-400 ml-auto">{new Date(activity.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help Resources */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📚 Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq#organization" className="text-blue-600 hover:underline flex items-center gap-2">📖 How to manage private pools?</Link></li>
              <li><Link href="/faq#payouts" className="text-blue-600 hover:underline flex items-center gap-2">💰 Payout processing guide</Link></li>
              <li><Link href="/faq#members" className="text-blue-600 hover:underline flex items-center gap-2">👥 Member management tips</Link></li>
              <li><Link href="/contact" className="text-blue-600 hover:underline flex items-center gap-2">📞 Contact Organization Support</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">📧 Invite Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">Enter the email address of the person you want to invite to your organization.</p>
            
            <input
              type="email"
              placeholder="member@example.com"
              className="w-full border rounded-lg p-3 mb-4"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm">
              <p className="font-semibold text-blue-800">💡 Note:</p>
              <p className="text-blue-700 text-xs">Invited members will receive an email to join your organization. Once approved, they can participate in your private pools.</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleInviteMember}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? 'Sending...' : 'Send Invitation'}
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && selectedPool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold">💸 Process Payout</h3>
              <button onClick={() => setShowPayoutModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-semibold text-blue-800">{selectedPool.prize_name}</p>
                <p className="text-sm text-blue-600">Payout Amount: <strong>{parseFloat(payoutAmount).toLocaleString()} ETB</strong></p>
                <p className="text-xs text-blue-500 mt-1">Participants: {selectedPool.participants_count || 0}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select Winner</label>
                <select 
                  className="w-full border rounded-lg p-3"
                  value={winnerId}
                  onChange={(e) => setWinnerId(e.target.value)}
                >
                  <option value="">-- Select a winner --</option>
                  {participants.map(p => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.user?.full_name || 'Anonymous'} - {p.ticket_count} tickets ({p.entry_amount} ETB)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payout Amount (ETB)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-3"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                <p className="font-semibold text-yellow-800">⚠️ Important:</p>
                <p className="text-yellow-700 text-xs">Once you process this payout, the winner will be notified and the pool will be marked as paid. This action cannot be undone.</p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg text-sm">
                <p className="font-semibold text-green-800">💰 Your 10% Commission:</p>
                <p className="text-green-700 text-xs">On this {parseFloat(payoutAmount).toLocaleString()} ETB pool, your organization earns <strong>{Math.floor(parseFloat(payoutAmount) * 0.10).toLocaleString()} ETB</strong> commission.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={processPayout}
                  disabled={submitting || !winnerId}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 transition"
                >
                  {submitting ? 'Processing...' : '✅ Confirm Payout'}
                </button>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
