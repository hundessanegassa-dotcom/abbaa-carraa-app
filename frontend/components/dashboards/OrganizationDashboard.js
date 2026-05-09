import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../DashboardLayout';

export default function OrganizationDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [org, setOrg] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [privatePools, setPrivatePools] = useState([]);
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
  const [charityStats, setCharityStats] = useState({ total_charity: 0, lives_impacted: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => { checkOrg(); }, []);

  async function checkOrg() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
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
        .single();
      
      if (orgError && orgError.code !== 'PGRST116') throw orgError;
      setOrg(orgData);
      const organizationId = orgData?.id;
      setOrgId(organizationId);

      if (organizationId) {
        await Promise.all([
          fetchMembers(organizationId),
          fetchPrivatePools(organizationId),
          fetchStats(organizationId, userId)
        ]);
      }
      
    } catch (error) { 
      console.error('Error loading organization data:', error); 
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

  async function fetchStats(organizationId, userId) {
    // Pool stats
    const activePools = privatePools.filter(p => p.pool?.status === 'active');
    const completedPools = privatePools.filter(p => p.pool?.status === 'completed');
    
    const totalRaised = privatePools.reduce((sum, p) => sum + (p.pool?.current_amount || 0), 0);
    
    // Commission stats (10% to individual creator)
    const { data: commissions } = await supabase
      .from('commissions')
      .select('amount, status, net_amount')
      .eq('user_id', userId)
      .eq('commission_type', 'organization');

    const pendingCommission = commissions?.filter(c => c.status === 'pending')?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const totalCommission = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

    // Charity contribution (2% of commission)
    const totalCharity = totalCommission * 0.02;
    setCharityStats({
      total_charity: totalCharity,
      lives_impacted: Math.floor(totalCharity / 100)
    });

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

  async function handleAddMember() {
    if (!newMemberEmail) return;
    
    setAddingMember(true);
    try {
      // Find user by email
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', newMemberEmail)
        .single();

      if (!userData) {
        alert('User not found with this email. They need to register first.');
        setAddingMember(false);
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId)
        .eq('member_id', userData.id)
        .single();

      if (existing) {
        alert('User is already a member or has a pending request.');
        setAddingMember(false);
        return;
      }

      // Add member request
      const { error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgId,
          member_id: userData.id,
          status: 'pending'
        });

      if (error) throw error;

      alert(`Invitation sent to ${userData.full_name || newMemberEmail}`);
      setNewMemberEmail('');
      setShowAddMember(false);
      
      // Refresh members list
      await fetchMembers(orgId);
      
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    } finally {
      setAddingMember(false);
    }
  }

  async function handleApproveMember(memberId) {
    const { error } = await supabase
      .from('organization_members')
      .update({ status: 'approved', joined_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) {
      alert('Failed to approve member');
    } else {
      await fetchMembers(orgId);
    }
  }

  async function handleRejectMember(memberId) {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      alert('Failed to reject member');
    } else {
      await fetchMembers(orgId);
    }
  }

  async function handleRemoveMember(memberId) {
    if (!confirm('Remove this member from the organization?')) return;
    
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      alert('Failed to remove member');
    } else {
      await fetchMembers(orgId);
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

  return (
    <DashboardLayout 
      title="Organization Dashboard" 
      subtitle="Manage members, create private pools, and build community" 
      icon="🏢" 
      bgGradient="from-blue-600 to-cyan-600" 
      user={user} 
      profile={profile}
    >
      {/* Stats Cards - 6 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Private Pools</p>
              <p className="text-xl md:text-3xl font-bold text-blue-600">{stats.total_pools}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">🏊</span>
            </div>
          </div>
          <div className="flex gap-2 text-xs mt-1">
            <span className="text-green-600">{stats.active_pools} active</span>
            <span className="text-gray-300">|</span>
            <span className="text-blue-600">{stats.completed_pools} completed</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Total Members</p>
              <p className="text-xl md:text-3xl font-bold text-green-600">{stats.total_members}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">👥</span>
            </div>
          </div>
          {stats.pending_members > 0 && (
            <p className="text-xs text-orange-500 mt-1">{stats.pending_members} pending requests</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Total Raised</p>
              <p className="text-xl md:text-3xl font-bold text-yellow-600">ETB {stats.total_raised.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Commission</p>
              <p className="text-xl md:text-3xl font-bold text-purple-600">ETB {stats.total_commission.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">💎</span>
            </div>
          </div>
          {stats.pending_commission > 0 && (
            <p className="text-xs text-orange-500 mt-1">{stats.pending_commission.toLocaleString()} ETB pending</p>
          )}
        </div>

        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-md p-4 md:p-6 text-white group col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">Charity Impact</p>
              <p className="text-xl md:text-2xl font-bold">💚 {Math.floor(charityStats.lives_impacted)} lives</p>
              <p className="text-xs opacity-80">2% of commissions</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Your contribution</p>
              <p className="text-lg font-bold">ETB {charityStats.total_charity.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content - 2 columns on desktop */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organization Info */}
          <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 mb-2">🏢 Organization Info</h2>
                <p className="font-semibold text-gray-800">{org?.business_name || profile?.full_name}</p>
                <p className="text-sm text-gray-500">Verified Organization ✓</p>
                <p className="text-xs text-gray-400 mt-1">Member since: {new Date(profile?.created_at).toLocaleDateString()}</p>
              </div>
              <Link href="/create-pool?type=private" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                + Create Private Pool
              </Link>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Private pools are visible only to your organization members. Perfect for staff savings, 
                team building events, and member engagement activities.
              </p>
            </div>
          </div>

          {/* Private Pools */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold flex items-center gap-2">🏊 Your Private Pools</h2>
            </div>
            <div className="p-4 md:p-6">
              {privatePools.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-3">🏊</div>
                  <p className="text-gray-400">No private pools created yet</p>
                  <Link href="/create-pool?type=private" className="text-blue-600 text-sm mt-3 inline-block hover:underline">
                    Create your first private pool →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {privatePools.slice(0, 5).map(item => {
                    const pool = item.pool;
                    const progress = pool ? (pool.current_amount / pool.target_amount) * 100 : 0;
                    return (
                      <div key={item.id} className="border rounded-xl p-4 hover:shadow-md transition">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800">{pool?.prize_name}</h3>
                            <p className="text-sm text-gray-500">Target: ETB {pool?.target_amount?.toLocaleString()}</p>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Members only pool</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              pool?.status === 'active' ? 'bg-green-100 text-green-800' : 
                              pool?.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {pool?.status === 'active' ? 'Active' : pool?.status === 'completed' ? 'Completed' : pool?.status}
                            </span>
                            <Link href={`/pools/${pool?.id}`} className="text-blue-600 text-sm ml-3 hover:underline">
                              View →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {stats.total_pools > 5 && (
                    <div className="text-center pt-2">
                      <Link href="/organization/pools" className="text-blue-600 text-sm hover:underline">
                        View all {stats.total_pools} private pools →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Member Management Section */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b bg-gray-50">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-lg font-bold flex items-center gap-2">👥 Member Management</h2>
                <button 
                  onClick={() => setShowAddMember(true)}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition"
                >
                  + Add Member
                </button>
              </div>
            </div>
            <div className="p-4 md:p-6">
              {/* Pending Requests */}
              {pendingMembers.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-orange-600 mb-3 flex items-center gap-2">
                    <span>⏳</span> Pending Requests ({pendingMembers.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingMembers.map(member => (
                      <div key={member.id} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <p className="font-medium">{member.member?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{member.member?.email || member.member?.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApproveMember(member.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectMember(member.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
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
              {members.length === 0 && pendingMembers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No members yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add members to create private pools for them</p>
                </div>
              ) : members.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                    <span>✓</span> Organization Members ({members.length})
                  </h3>
                  <div className="space-y-2">
                    {members.map(member => (
                      <div key={member.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <p className="font-medium">{member.member?.full_name || 'Member'}</p>
                            <p className="text-xs text-gray-500">{member.member?.email || member.member?.phone}</p>
                            <p className="text-xs text-gray-400">Joined: {new Date(member.joined_at).toLocaleDateString()}</p>
                          </div>
                          <button 
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 text-sm hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - 1 column on desktop */}
        <div className="space-y-6">
          {/* How It Works */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-4 md:p-6 text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">🎯 How It Works</h3>
            <div className="space-y-3">
              <div className="bg-white/20 rounded-lg p-3">
                <p className="font-semibold">1. Add Members</p>
                <p className="text-sm opacity-90">Invite members by email</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="font-semibold">2. Create Private Pool</p>
                <p className="text-sm opacity-90">Pools visible only to members</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="font-semibold">3. Members Participate</p>
                <p className="text-sm opacity-90">Contribute to win prizes</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="font-semibold">4. You Earn 10%</p>
                <p className="text-sm opacity-90">Commission on every pool</p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">✨ Organization Benefits</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Build community savings culture</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Engage employees/members</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Raise funds for group activities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>No upfront costs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Full management dashboard</span>
              </li>
            </ul>
          </div>

          {/* Charity Section */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-4 md:p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💚</span>
              <h3 className="text-xl font-bold">Making a Difference</h3>
            </div>
            <p className="text-sm opacity-95 mb-3">
              2% of your commissions support Ethiopians fighting <strong>kidney disease</strong> and <strong>heart disease</strong>.
            </p>
            {charityStats.total_charity > 0 && (
              <div className="bg-white/20 rounded-xl p-3 mb-3">
                <p className="text-xs opacity-90">Your organization's contribution:</p>
                <p className="text-xl font-bold">ETB {charityStats.total_charity.toLocaleString()}</p>
                <p className="text-xs opacity-75">Lives impacted: {charityStats.lives_impacted}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm border-t border-white/20 pt-3 mt-2">
              <span>💚</span>
              <span className="text-xs">Every private pool saves lives</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">📊 Organization Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Commission rate:</span>
                <span className="font-medium text-green-600">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Member participation:</span>
                <span className="font-medium">{stats.total_members > 0 ? Math.round((stats.total_pools / stats.total_members) * 100) : 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg pool size:</span>
                <span className="font-medium">{stats.total_pools > 0 ? Math.round(stats.total_raised / stats.total_pools).toLocaleString() : 0} ETB</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <Link href="/organization/earnings" className="text-blue-600 text-sm hover:underline flex justify-between">
                  View earnings report →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Organization Member</h3>
              <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Enter the email address of the user you want to add. They must have an Abbaa Carraa account.
            </p>
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex gap-3">
              <button
                onClick={handleAddMember}
                disabled={addingMember || !newMemberEmail}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {addingMember ? 'Adding...' : 'Send Invitation'}
              </button>
              <button
                onClick={() => setShowAddMember(false)}
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
