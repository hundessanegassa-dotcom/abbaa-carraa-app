import BackButton from '../../components/BackButton';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [stats, setStats] = useState({
    total_users: 0, total_agents: 0, total_vendors: 0, total_organizations: 0,
    total_pools: 0, active_pools: 0, completed_pools: 0, pending_pools: 0,
    total_volume: 0, total_commission_paid: 0, pending_commission: 0,
    charity_total: 0, lives_impacted: 0, platform_revenue: 0
  });
  
  const [myPools, setMyPools] = useState([]);
  const [myStats, setMyStats] = useState({
    total_pools: 0, active_pools: 0, completed_pools: 0,
    total_raised: 0, total_commission: 0, pending_commission: 0
  });
  
  const [pendingAgents, setPendingAgents] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingOrganizations, setPendingOrganizations] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  
  const [users, setUsers] = useState([]);
  const [allPools, setAllPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [charityTransactions, setCharityTransactions] = useState([]);
  const [disputes, setDisputes] = useState([]);
  
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', target_audience: 'all' });

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(profile);
      
      const { data: adminRecord } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (profile?.role !== 'admin' && !adminRecord) {
        router.push('/dashboard');
        return;
      }
      
      await loadAllData();
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllData() {
    await Promise.all([
      loadStats(),
      loadMyPools(),
      loadPendingApprovals(),
      loadWithdrawalRequests(),
      loadUsers(),
      loadAllPools(),
      loadFeaturedPools(),
      loadCharityData(),
      loadDisputes()
    ]);
  }

  async function loadStats() {
    const [{ count: total_users }, { count: total_agents }, { count: total_vendors }, 
      { count: total_organizations }, { data: pools }, { data: contributions }, 
      { data: commissions }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('pools').select('*'),
      supabase.from('contributions').select('amount, status'),
      supabase.from('commissions').select('amount, status')
    ]);
    
    const total_pools = pools?.length || 0;
    const active_pools = pools?.filter(p => p.status === 'active')?.length || 0;
    const completed_pools = pools?.filter(p => p.status === 'completed')?.length || 0;
    const pending_pools = pools?.filter(p => p.status === 'pending')?.length || 0;
    const total_volume = contributions?.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const total_commission_paid = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0;
    const pending_commission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;
    const platform_revenue = total_volume * 0.10;
    const charity_total = total_volume * 0.02;
    
    setStats({
      total_users: total_users || 0, total_agents: total_agents || 0, total_vendors: total_vendors || 0,
      total_organizations: total_organizations || 0, total_pools, active_pools, completed_pools, pending_pools,
      total_volume, total_commission_paid, pending_commission, charity_total,
      lives_impacted: Math.floor(charity_total / 100), platform_revenue
    });
  }

  async function loadMyPools() {
    const { data: pools } = await supabase
      .from('pools')
      .select('*')
      .eq('created_by', user?.id)
      .order('created_at', { ascending: false });
    setMyPools(pools || []);
    
    const totalRaised = pools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
    const { data: commissions } = await supabase
      .from('commissions')
      .select('amount, status')
      .eq('user_id', user?.id);
    const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const pendingCommission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;
    
    setMyStats({
      total_pools: pools?.length || 0,
      active_pools: pools?.filter(p => p.status === 'active')?.length || 0,
      completed_pools: pools?.filter(p => p.status === 'completed')?.length || 0,
      total_raised: totalRaised,
      total_commission: totalCommission,
      pending_commission: pendingCommission
    });
  }

  async function loadPendingApprovals() {
    const [{ data: agents }, { data: vendors }, { data: organizations }] = await Promise.all([
      supabase.from('agents').select('*, profiles!user_id(full_name, email)').eq('verified', false),
      supabase.from('vendors').select('*, profiles!user_id(full_name, email)').eq('verified', false),
      supabase.from('organizations').select('*, profiles!user_id(full_name, email)').eq('verified', false)
    ]);
    setPendingAgents(agents || []);
    setPendingVendors(vendors || []);
    setPendingOrganizations(organizations || []);
  }

  async function loadWithdrawalRequests() {
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*, profiles(full_name, email)')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });
    setWithdrawalRequests(data || []);
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setUsers(data || []);
  }

  async function loadAllPools() {
    const { data } = await supabase
      .from('pools')
      .select('*, profiles!created_by(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    setAllPools(data || []);
  }

  async function loadFeaturedPools() {
    const { data } = await supabase
      .from('pools')
      .select('*')
      .eq('is_featured', true)
      .eq('status', 'active');
    setFeaturedPools(data || []);
  }

  async function loadCharityData() {
    const { data } = await supabase
      .from('charity_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setCharityTransactions(data || []);
  }

  async function loadDisputes() {
    const { data } = await supabase
      .from('disputes')
      .select('*, pool:pools(prize_name), user:profiles(full_name)')
      .eq('status', 'pending');
    setDisputes(data || []);
  }

  async function verifyAgent(agentId, verified) {
    const { error } = await supabase.from('agents').update({ verified, verified_at: new Date().toISOString() }).eq('id', agentId);
    if (error) toast.error('Failed'); else { toast.success(`Agent ${verified ? 'approved' : 'rejected'}`); loadPendingApprovals(); loadStats(); }
  }

  async function verifyVendor(vendorId, verified) {
    const { error } = await supabase.from('vendors').update({ verified, verified_at: new Date().toISOString() }).eq('id', vendorId);
    if (error) toast.error('Failed'); else { toast.success(`Vendor ${verified ? 'approved' : 'rejected'}`); loadPendingApprovals(); loadStats(); }
  }

  async function verifyOrganization(orgId, verified) {
    const { error } = await supabase.from('organizations').update({ verified, verified_at: new Date().toISOString() }).eq('id', orgId);
    if (error) toast.error('Failed'); else { toast.success(`Organization ${verified ? 'approved' : 'rejected'}`); loadPendingApprovals(); loadStats(); }
  }

  async function updateUserRole(userId, newRole) {
    const { error } = await supabase.from('profiles').update({ role: newRole, user_type: newRole }).eq('id', userId);
    if (error) toast.error('Failed'); else { toast.success('User role updated'); loadUsers(); loadStats(); }
  }

  async function toggleUserBan(userId, isBanned) {
    const { error } = await supabase.from('profiles').update({ is_banned: !isBanned }).eq('id', userId);
    if (error) toast.error('Failed'); else { toast.success(`User ${!isBanned ? 'banned' : 'unbanned'}`); loadUsers(); }
  }

  async function togglePoolStatus(poolId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const { error } = await supabase.from('pools').update({ status: newStatus }).eq('id', poolId);
    if (error) toast.error('Failed'); else { toast.success(`Pool ${newStatus === 'active' ? 'activated' : 'paused'}`); loadAllPools(); loadStats(); }
  }

  async function toggleFeaturedPool(poolId, isFeatured) {
    const { error } = await supabase.from('pools').update({ is_featured: !isFeatured }).eq('id', poolId);
    if (error) toast.error('Failed'); else { toast.success(`Pool ${!isFeatured ? 'featured' : 'removed'}`); loadAllPools(); loadFeaturedPools(); }
  }

  async function deletePool(poolId) {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    const { error } = await supabase.from('pools').delete().eq('id', poolId);
    if (error) toast.error('Failed'); else { toast.success('Pool deleted'); loadAllPools(); loadStats(); }
  }

  async function processWithdrawal(requestId, approved) {
    const { error } = await supabase.from('withdrawal_requests').update({ status: approved ? 'approved' : 'rejected', processed_at: new Date().toISOString(), processed_by: user?.id }).eq('id', requestId);
    if (error) toast.error('Failed'); else { toast.success(`Withdrawal ${approved ? 'approved' : 'rejected'}`); loadWithdrawalRequests(); }
  }

  async function resolveDispute(disputeId, resolution) {
    const { error } = await supabase.from('disputes').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolution_notes: resolution }).eq('id', disputeId);
    if (error) toast.error('Failed'); else { toast.success('Dispute resolved'); loadDisputes(); }
  }

  async function createAnnouncement() {
    if (!newAnnouncement.title || !newAnnouncement.content) { toast.error('Please fill all fields'); return; }
    const { error } = await supabase.from('announcements').insert({ title: newAnnouncement.title, content: newAnnouncement.content, target_audience: newAnnouncement.target_audience, created_by: user?.id, is_active: true });
    if (error) toast.error('Failed'); else { toast.success('Announcement created'); setShowAnnouncementModal(false); setNewAnnouncement({ title: '', content: '', target_audience: 'all' }); }
  }

  const createPool = () => router.push('/create-pool');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="mb-4"><BackButton /></div>
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div><h1 className="text-3xl font-bold">Admin Command Center</h1><p className="text-red-100">Welcome, {profile?.full_name || 'Admin'}</p></div>
            <div className="flex gap-3">
              <Link href="/admin/draw" className="bg-white text-red-600 px-6 py-2 rounded-full font-semibold">🎲 Draw Management</Link>
              <button onClick={createPool} className="bg-white text-red-600 px-6 py-2 rounded-full font-semibold">+ Create My Pool (20%)</button>
              <Link href="/dashboard" className="bg-white/20 px-4 py-2 rounded-full text-sm">Home</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white sticky top-0 z-10 overflow-x-auto">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 min-w-max">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-3 font-semibold ${activeTab === 'overview' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>📊 Overview</button>
            <button onClick={() => setActiveTab('my-pools')} className={`px-4 py-3 font-semibold ${activeTab === 'my-pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>🎯 My Pools (20%)</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-3 font-semibold ${activeTab === 'users' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>👥 Users</button>
            <button onClick={() => setActiveTab('pools')} className={`px-4 py-3 font-semibold ${activeTab === 'pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>🌊 Pools</button>
            <button onClick={() => setActiveTab('approvals')} className={`px-4 py-3 font-semibold ${activeTab === 'approvals' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>📝 Approvals ({pendingAgents.length + pendingVendors.length + pendingOrganizations.length})</button>
            <button onClick={() => setActiveTab('withdrawals')} className={`px-4 py-3 font-semibold ${activeTab === 'withdrawals' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>💰 Withdrawals ({withdrawalRequests.length})</button>
            <button onClick={() => setActiveTab('featured')} className={`px-4 py-3 font-semibold ${activeTab === 'featured' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>⭐ Featured</button>
            <button onClick={() => setActiveTab('finance')} className={`px-4 py-3 font-semibold ${activeTab === 'finance' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>💰 Finance</button>
            <button onClick={() => setActiveTab('disputes')} className={`px-4 py-3 font-semibold ${activeTab === 'disputes' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>⚖️ Disputes ({disputes.length})</button>
            <button onClick={() => setActiveTab('settings')} className={`px-4 py-3 font-semibold ${activeTab === 'settings' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>⚙️ Settings</button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-white rounded-xl p-3 text-center"><p className="text-2xl font-bold text-blue-600">{stats.total_users}</p><p className="text-xs">Users</p></div>
              <div className="bg-white rounded-xl p-3 text-center"><p className="text-2xl font-bold text-yellow-600">{stats.total_agents}</p><p className="text-xs">Agents</p></div>
              <div className="bg-white rounded-xl p-3 text-center"><p className="text-2xl font-bold text-purple-600">{stats.total_vendors}</p><p className="text-xs">Vendors</p></div>
              <div className="bg-white rounded-xl p-3 text-center"><p className="text-2xl font-bold text-cyan-600">{stats.total_organizations}</p><p className="text-xs">Orgs</p></div>
              <div className="bg-white rounded-xl p-3 text-center"><p className="text-2xl font-bold text-green-600">{stats.total_pools}</p><p className="text-xs">Pools</p></div>
              <div className="bg-white rounded-xl p-3 text-center"><p className="text-2xl font-bold text-emerald-600">{stats.active_pools}</p><p className="text-xs">Active</p></div>
              <div className="bg-white rounded-xl p-3 text-center"><p className="text-2xl font-bold text-orange-600">{stats.pending_pools}</p><p className="text-xs">Pending</p></div>
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-3 text-center text-white"><p className="text-2xl font-bold">{stats.lives_impacted}</p><p className="text-xs">Lives Saved</p></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">💰 Financial Summary</h3><div className="space-y-2"><div className="flex justify-between"><span>Total Volume:</span><span className="font-bold">ETB {stats.total_volume.toLocaleString()}</span></div><div className="flex justify-between"><span>Commission Paid:</span><span className="font-bold text-yellow-600">ETB {stats.total_commission_paid.toLocaleString()}</span></div><div className="flex justify-between"><span>Platform Revenue:</span><span className="font-bold text-blue-600">ETB {stats.platform_revenue.toLocaleString()}</span></div><div className="flex justify-between"><span>Charity Fund:</span><span className="font-bold text-pink-600">ETB {Math.floor(stats.charity_total).toLocaleString()}</span></div></div></div>
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">👑 Admin's Personal Stats (20% Commission)</h3><div className="grid grid-cols-3 gap-3"><div><p className="text-2xl font-bold text-red-600">{myStats.total_pools}</p><p className="text-xs">My Pools</p></div><div><p className="text-2xl font-bold text-green-600">{myStats.active_pools}</p><p className="text-xs">Active</p></div><div><p className="text-2xl font-bold text-yellow-600">ETB {myStats.total_commission.toLocaleString()}</p><p className="text-xs">Earned</p></div></div></div>
            </div>
          </div>
        )}

        {/* My Pools Tab */}
        {activeTab === 'my-pools' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="font-bold">💰 My Personal Pools (20% Commission)</h2></div>
            <div className="p-6">
              {myPools.length === 0 ? (
                <div className="text-center py-8"><p className="text-gray-400">No pools created yet</p><button onClick={createPool} className="mt-2 text-red-600">Create your first pool →</button></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr><th className="px-4 py-2 text-left">Prize</th><th className="px-4 py-2 text-left">Target</th><th className="px-4 py-2 text-left">Raised</th><th className="px-4 py-2 text-left">Your 20%</th><th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2 text-left">Action</th></tr>
                    </thead>
                    <tbody>
                      {myPools.map(pool => (
                        <tr key={pool.id} className="border-b">
                          <td className="px-4 py-2">{pool.prize_name}</td>
                          <td className="px-4 py-2">ETB {pool.target_amount?.toLocaleString()}</td>
                          <td className="px-4 py-2">ETB {pool.current_amount?.toLocaleString()}</td>
                          <td className="px-4 py-2 font-bold text-green-600">ETB {(pool.target_amount * 0.20).toLocaleString()}</td>
                          <td className="px-4 py-2"><span className="px-2 py-1 rounded-full text-xs">{pool.status}</span></td>
                          <td className="px-4 py-2"><Link href={`/pools/${pool.id}`} className="text-red-600 text-sm">View</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button onClick={createPool} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg">+ Create New Pool</button>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Email</th><th className="px-4 py-2 text-left">Role</th><th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2 text-left">Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b">
                      <td className="px-4 py-2">{u.full_name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2"><span className="px-2 py-1 rounded-full text-xs">{u.role || 'user'}</span></td>
                      <td className="px-4 py-2">{u.is_banned ? <span className="text-red-600">Banned</span> : <span className="text-green-600">Active</span>}</td>
                      <td className="px-4 py-2">
                        <select onChange={(e) => updateUserRole(u.id, e.target.value)} className="border rounded px-2 py-1 text-sm">
                          <option value="user">User</option>
                          <option value="agent">Agent</option>
                          <option value="vendor">Vendor</option>
                          <option value="organization">Organization</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => toggleUserBan(u.id, u.is_banned)} className={`ml-2 px-2 py-1 rounded text-xs ${u.is_banned ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{u.is_banned ? 'Unban' : 'Ban'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pools Tab */}
        {activeTab === 'pools' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="px-4 py-2 text-left">Prize</th><th className="px-4 py-2 text-left">Creator</th><th className="px-4 py-2 text-left">Target</th><th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2 text-left">Featured</th><th className="px-4 py-2 text-left">Actions</th></tr>
                </thead>
                <tbody>
                  {allPools.map(p => (
                    <tr key={p.id} className="border-b">
                      <td className="px-4 py-2">{p.prize_name}</td>
                      <td className="px-4 py-2">{p.profiles?.full_name}</td>
                      <td className="px-4 py-2">ETB {p.target_amount?.toLocaleString()}</td>
                      <td className="px-4 py-2">{p.status}</td>
                      <td className="px-4 py-2">{p.is_featured ? '⭐' : ''}</td>
                      <td className="px-4 py-2">
                        <button onClick={() => togglePoolStatus(p.id, p.status)} className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">Toggle</button>
                        <button onClick={() => toggleFeaturedPool(p.id, p.is_featured)} className="ml-1 bg-blue-600 text-white px-2 py-1 rounded text-xs">Feature</button>
                        <button onClick={() => deletePool(p.id)} className="ml-1 bg-red-600 text-white px-2 py-1 rounded text-xs">Delete</button>
                        <Link href={`/pools/${p.id}`} className="ml-1 bg-gray-600 text-white px-2 py-1 rounded text-xs">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-4"><h3 className="font-bold mb-3">🤝 Pending Agents ({pendingAgents.length})</h3>
              {pendingAgents.map(a => (<div key={a.id} className="flex justify-between border-b py-2"><span>{a.business_name}<br/><span className="text-xs text-gray-500">{a.profiles?.email}</span></span><div><button onClick={() => verifyAgent(a.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button><button onClick={() => verifyAgent(a.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm ml-2">Reject</button></div></div>))}
            </div>
            <div className="bg-white rounded-xl shadow-md p-4"><h3 className="font-bold mb-3">🏭 Pending Vendors ({pendingVendors.length})</h3>
              {pendingVendors.map(v => (<div key={v.id} className="flex justify-between border-b py-2"><span>{v.business_name}<br/><span className="text-xs text-gray-500">{v.profiles?.email}</span></span><div><button onClick={() => verifyVendor(v.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button><button onClick={() => verifyVendor(v.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm ml-2">Reject</button></div></div>))}
            </div>
            <div className="bg-white rounded-xl shadow-md p-4"><h3 className="font-bold mb-3">🏢 Pending Organizations ({pendingOrganizations.length})</h3>
              {pendingOrganizations.map(o => (<div key={o.id} className="flex justify-between border-b py-2"><span>{o.business_name}<br/><span className="text-xs text-gray-500">{o.profiles?.email}</span></span><div><button onClick={() => verifyOrganization(o.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button><button onClick={() => verifyOrganization(o.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm ml-2">Reject</button></div></div>))}
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-4">
            {withdrawalRequests.length === 0 ? <p className="text-center py-8 text-gray-400">No pending withdrawals</p> : 
              withdrawalRequests.map(w => (<div key={w.id} className="flex justify-between items-center border-b py-3"><div><p className="font-medium">{w.profiles?.full_name}</p><p className="text-sm">ETB {w.amount?.toLocaleString()} - {w.commission_type}</p></div><div><button onClick={() => processWithdrawal(w.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button><button onClick={() => processWithdrawal(w.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm ml-2">Reject</button></div></div>))
            }
          </div>
        )}

        {/* Featured Tab */}
        {activeTab === 'featured' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPools.filter(p => p.status === 'active').map(p => (<div key={p.id} className="border rounded-lg p-3 flex justify-between items-center"><span>{p.prize_name}</span><button onClick={() => toggleFeaturedPool(p.id, p.is_featured)} className={`px-3 py-1 rounded text-sm ${p.is_featured ? 'bg-gray-300' : 'bg-yellow-500 text-white'}`}>{p.is_featured ? 'Remove' : 'Feature'}</button></div>))}
            </div>
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-gray-500">Total Volume</h3><p className="text-3xl font-bold text-green-600">ETB {stats.total_volume.toLocaleString()}</p></div>
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-gray-500">Platform Revenue</h3><p className="text-3xl font-bold text-blue-600">ETB {stats.platform_revenue.toLocaleString()}</p></div>
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-6 text-white"><h3 className="font-bold">Charity Fund (2%)</h3><p className="text-3xl font-bold">ETB {Math.floor(stats.charity_total).toLocaleString()}</p><p className="text-sm">Lives Impacted: {stats.lives_impacted}</p></div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">💚 Charity Transactions</h3>{charityTransactions.length === 0 ? <p className="text-gray-400 text-center py-4">No transactions yet</p> : charityTransactions.map(t => (<div key={t.id} className="border-b py-2 flex justify-between"><span>{new Date(t.created_at).toLocaleDateString()}</span><span className="font-bold text-green-600">ETB {t.amount?.toLocaleString()}</span><span>{t.source}</span></div>))}</div>
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">{disputes.length === 0 ? <div className="bg-white rounded-xl p-8 text-center"><p className="text-gray-400">✅ No disputes</p></div> : disputes.map(d => (<div key={d.id} className="bg-white rounded-xl shadow-md p-4"><p className="font-bold">Pool: {d.pool?.prize_name}</p><p>Filed by: {d.user?.full_name}</p><p>{d.description}</p><textarea placeholder="Resolution" className="w-full border rounded p-2 mt-2" id={`res-${d.id}`}></textarea><button onClick={() => resolveDispute(d.id, document.getElementById(`res-${d.id}`).value)} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">Resolve</button></div>))}</div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-xl mb-4">⚙️ Platform Settings</h2>
            <button onClick={() => setShowAnnouncementModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">📢 Create Announcement</button>
            <div className="mt-6"><Link href="/admin/analytics" className="text-blue-600 hover:underline">View Full Analytics →</Link></div>
          </div>
        )}
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Create Announcement</h3>
            <input type="text" placeholder="Title" className="w-full border rounded-lg p-2 mb-3" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
            <textarea placeholder="Content" rows="4" className="w-full border rounded-lg p-2 mb-3" value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}></textarea>
            <select className="w-full border rounded-lg p-2 mb-3" value={newAnnouncement.target_audience} onChange={(e) => setNewAnnouncement({...newAnnouncement, target_audience: e.target.value})}><option value="all">All Users</option><option value="agents">Agents</option><option value="vendors">Vendors</option><option value="individuals">Individuals</option></select>
            <div className="flex gap-3"><button onClick={createAnnouncement} className="flex-1 bg-blue-600 text-white py-2 rounded-lg">Publish</button><button onClick={() => setShowAnnouncementModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
