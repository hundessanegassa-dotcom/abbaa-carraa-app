import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../DashboardLayout';
import toast from 'react-hot-toast';

export default function OrganizationDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [org, setOrg] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [privatePools, setPrivatePools] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({ 
    total_pools: 0, 
    active_pools: 0,
    completed_pools: 0,
    total_members: 0, 
    pending_members: 0,
    total_raised: 0, 
    total_commission: 0,
    pending_commission: 0
  });
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => { checkOrg(); }, []);

  async function checkOrg() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(profile);
    if (profile?.user_type !== 'organization' && profile?.role !== 'organization') { 
      router.push('/dashboard'); 
      return; 
    }
    await loadOrgData(user.id);
  }

  async function loadOrgData(userId) {
    try {
      // Get organization record
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (orgError && orgError.code !== 'PGRST116') throw orgError;
      setOrg(orgData);
      const orgId = orgData?.id;
      setOrganizationId(orgId);

      if (orgId) {
        await Promise.all([
          fetchMembers(orgId),
          fetchPrivatePools(orgId),
          fetchRecentActivity(orgId),
          fetchStats(orgId, userId)
        ]);
      }
      
    } catch (error) { 
      console.error('Error loading organization data:', error); 
      toast.error('Failed to load dashboard data');
    } finally { 
      setLoading(false); 
    }
  }

  async function fetchMembers(organizationId) {
    // Get approved members
    const { data: approvedMembers } = await supabase
      .from('organization_members')
      .select('*, member:member_id(full_name, phone, email, avatar_url)')
      .eq('organization_id', organizationId)
      .eq('status', 'approved')
      .order('joined_at', { ascending: false });
    
    setMembers(approvedMembers || []);

    // Get pending members
    const { data: pending } = await supabase
      .from('organization_members')
      .select('*, member:member_id(full_name, phone, email)')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    setPendingMembers(pending || []);
  }

  async function fetchPrivatePools(organizationId) {
    const { data: pools } = await supabase
      .from('private_pools')
      .select('*, pool:pools(*, winner:winner_id(*))')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    setPrivatePools(pools || []);
  }

  async function fetchRecentActivity(organizationId) {
    // Get recent contributions from organization pools
    const poolIds = privatePools.map(p => p.pool?.id).filter(Boolean);
    
    if (poolIds.length > 0) {
      const { data: activities } = await supabase
        .from('contributions')
        .select('*, user:user_id(full_name, phone), pool:pool_id(prize_name)')
        .in('pool_id', poolIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentActivity(activities || []);
    }
  }

  async function fetchStats(organizationId, userId) {
    // Pool stats
    const activePools = privatePools.filter(p => p.pool?.status === 'active');
    const completedPools = privatePools.filter(p => p.pool?.status === 'completed');
    
    const totalRaised = privatePools.reduce((sum, p) => sum + (p.pool?.current_amount || 0), 0);
    
    // Commission stats
    const { data: commissions } = await supabase
      .from('commissions')
      .select('amount, status, net_amount')
      .eq('user_id', userId)
      .eq('commission_type', 'organization');

    const pendingCommission = commissions?.filter(c => c.status === 'pending')?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const totalCommission = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

    setStats({
      total_pools: privatePools.length,
      active_pools: activePools.length,
      completed_pools: completedPools.length,
      total_members: members.length,
      pending_members: pendingMembers.length,
      total_raised: totalRaised,
      total_commission: totalCommission,
      pending_commission: pendingCommission
    });
  }

  async function handleInviteMember() {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setInviting(true);
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', inviteEmail.trim())
        .maybeSingle();

      if (userError || !userData) {
        toast.error('User not found. They need to register first.');
        setInviting(false);
        return;
      }

      // Check if already a member or pending
      const { data: existing } = await supabase
        .from('organization_members')
        .select('status')
        .eq('organization_id', organizationId)
        .eq('member_id', userData.id)
        .maybeSingle();

      if (existing) {
        toast.error(`User is already ${existing.status === 'approved' ? 'a member' : 'pending approval'}`);
        setInviting(false);
        return;
      }

      // Send invitation
      const { error: insertError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          member_id: userData.id,
          status: 'pending',
          invited_by: user.id,
          invited_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      toast.success(`Invitation sent to ${userData.full_name || inviteEmail}`);
      setInviteEmail('');
      setShowInviteModal(false);
      
      // Refresh data
      await loadOrgData(user.id);
      
    } catch (error) {
      console.error('Invite error:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  }

  async function handleApproveMember(memberId) {
    const { error } = await supabase
      .from('organization_members')
      .update({ status: 'approved', joined_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) {
      toast.error('Failed to approve member');
    } else {
      toast.success('Member approved');
      await loadOrgData(user.id);
    }
  }

  async function handleRejectMember(memberId) {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast.error('Failed to reject member');
    } else {
      toast.success('Member request rejected');
      await loadOrgData(user.id);
    }
  }

  async function handleRemoveMember(memberId) {
    if (!confirm('Remove this member from the organization?')) return;
    
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast.error('Failed to remove member');
    } else {
      toast.success('Member removed');
      await loadOrgData(user.id);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading organization dashboard...</p>
        </div>
      </div>
    );
  }

  const charityAmount = stats.total_commission * 0.02;
  const livesImpacted = Math.floor(charityAmount / 100);

  return (
    <DashboardLayout 
      title={`Welcome, ${org?.business_name || profile?.full_name?.split(' ')[0] || 'Organization'}! 🏢`} 
      subtitle="Manage members, create private pools, earn 10% commission" 
      icon="🏢" 
      bgGradient="from-blue-600 to-cyan-600" 
      user={user} 
      profile={profile}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-3 text-center">
          <p className="text-gray-500 text-xs">Private Pools</p>
          <p className="text-xl font-bold text-blue-600">{stats.total_pools}</p>
          <p className="text-[10px] text-green-600">{stats.active_pools} active</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-3 text-center">
          <p className="text-gray-500 text-xs">Completed</p>
          <p className="text-xl font-bold text-blue-600">{stats.completed_pools}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-3 text-center">
          <p className="text-gray-500 text-xs">Total Members</p>
          <p className="text-xl font-bold text-green-600">{stats.total_members}</p>
          {stats.pending_members > 0 && <p className="text-[10px] text-orange-500">{stats.pending_members} pending</p>}
        </div>
        <div className="bg-white rounded-2xl shadow-md p-3 text-center">
          <p className="text-gray-500 text-xs">Total Raised</p>
          <p className="text-sm font-bold text-yellow-600">ETB {stats.total_raised.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-3 text-center">
          <p className="text-gray-500 text-xs">Commission</p>
          <p className="text-sm font-bold text-purple-600">ETB {stats.total_commission.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-3 text-white text-center">
          <p className="text-[10px] opacity-90">Charity Impact</p>
          <p className="text-xl font-bold">💚 {livesImpacted}</p>
        </div>
      </div>

      {/* Org Explanation */}
      <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-2">
          <div className="text-2xl">🏢</div>
          <div>
            <h3 className="font-bold text-blue-800 text-sm">Your Organization Dashboard</h3>
            <p className="text-xs text-blue-700">Create private pools, earn <strong>10% commission</strong>, and manage members!</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Link href="/create-pool?type=private" className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-2 text-white text-center text-xs font-semibold">
          + Create Pool
        </Link>
        <button 
          onClick={() => setShowInviteModal(true)} 
          className="bg-white rounded-xl p-2 shadow-md border text-center text-xs font-semibold text-gray-700"
        >
          + Invite Member
        </button>
        <Link href="/organization/analytics" className="bg-white rounded-xl p-2 shadow-md border text-center text-xs font-semibold text-gray-700">
          Analytics
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Private Pools Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">🏊 Your Private Pools</h2>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {privatePools.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-2">🏊</div>
                <p className="text-gray-400 text-sm">No private pools yet</p>
                <Link href="/create-pool?type=private" className="text-blue-600 text-xs mt-2 inline-block">Create your first private pool →</Link>
              </div>
            ) : (
              <div className="divide-y">
                {privatePools.map(item => {
                  const pool = item.pool;
                  const progress = pool ? (pool.current_amount / pool.target_amount) * 100 : 0;
                  return (
                    <div key={item.id} className="p-3 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-sm">{pool?.prize_name}</h3>
                          <p className="text-xs text-gray-500">Target: ETB {pool?.target_amount?.toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          pool?.status === 'active' ? 'bg-green-100 text-green-800' : 
                          pool?.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pool?.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                      </div>
                      <Link href={`/pools/${pool?.id}`} className="text-blue-600 text-xs mt-2 inline-block hover:underline">View Details →</Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Members Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-800">👥 Members</h2>
            <button 
              onClick={() => setShowInviteModal(true)} 
              className="text-blue-600 text-xs font-semibold"
            >
              + Invite
            </button>
          </div>
          
          {/* Pending Requests */}
          {pendingMembers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-orange-600 mb-2">Pending Requests ({pendingMembers.length})</h3>
              <div className="space-y-2">
                {pendingMembers.map(member => (
                  <div key={member.id} className="bg-orange-50 rounded-xl p-2 border border-orange-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{member.member?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{member.member?.email}</p>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleApproveMember(member.id)}
                          className="bg-green-600 text-white px-2 py-1 rounded text-[10px]"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRejectMember(member.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-[10px]"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Members */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {members.length === 0 && pendingMembers.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-gray-400 text-sm">No members yet</p>
                <p className="text-xs text-gray-300">Invite members to join!</p>
              </div>
            ) : (
              <div className="divide-y">
                {members.slice(0, 5).map(member => (
                  <div key={member.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{member.member?.full_name || 'Member'}</p>
                      <p className="text-xs text-gray-500">{member.member?.email}</p>
                      <p className="text-[10px] text-gray-400">Joined: {new Date(member.joined_at).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {members.length > 5 && (
                  <Link href="/organization/members" className="block p-2 text-center text-blue-600 text-xs">
                    View all {members.length} members →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🔄 Recent Activity</h2>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="divide-y">
              {recentActivity.slice(0, 5).map(activity => (
                <div key={activity.id} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{activity.user?.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">Pool: {activity.pool?.prize_name}</p>
                    <p className="text-[10px] text-gray-400">{new Date(activity.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-green-600 text-sm">ETB {activity.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Organization Info */}
      <div className="mt-6 bg-white rounded-2xl shadow-md p-4">
        <h3 className="font-bold text-gray-800 mb-2">🏢 Organization Info</h3>
        <p className="font-semibold text-base">{org?.business_name || profile?.full_name}</p>
        <p className="text-gray-500 text-xs mt-1">✓ Verified Organization • {stats.total_members} members • {stats.total_pools} private pools</p>
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">🔒 Private pools are visible only to your members. Perfect for staff savings and team building!</p>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Invite Member to Organization</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enter the email address of the user you want to invite. They must have an Abbaa Carraa account.
            </p>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={handleInviteMember}
                disabled={inviting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
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
