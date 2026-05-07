import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { calculateCommission, formatCommission } from '../../lib/commission';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Admin Stats
  const [stats, setStats] = useState({
    total_users: 0,
    total_agents: 0,
    total_vendors: 0,
    total_organizations: 0,
    total_pools: 0,
    active_pools: 0,
    completed_pools: 0,
    total_volume: 0,
    total_commission_paid: 0,
    pending_commission: 0,
    charity_total: 0,
    lives_impacted: 0
  });
  
  // Admin's Personal Pools
  const [myPools, setMyPools] = useState([]);
  const [myStats, setMyStats] = useState({
    total_pools: 0,
    active_pools: 0,
    completed_pools: 0,
    total_raised: 0,
    total_commission: 0,
    pending_commission: 0
  });
  
  // Pending Approvals
  const [pendingAgents, setPendingAgents] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingOrganizations, setPendingOrganizations] = useState([]);
  
  // Users List
  const [users, setUsers] = useState([]);
  const [allPools, setAllPools] = useState([]);
  
  // Featured Pools
  const [featuredPools, setFeaturedPools] = useState([]);
  
  // Charity Stats
  const [charityTransactions, setCharityTransactions] = useState([]);
  
  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  
  // Disputes
  const [disputes, setDisputes] = useState([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
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

    if (profile?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setProfile(profile);
    
    await loadAllData();
    setLoading(false);
  }

  async function loadAllData() {
    await Promise.all([
      loadStats(),
      loadMyPools(),
      loadPendingApprovals(),
      loadUsers(),
      loadAllPools(),
      loadFeaturedPools(),
      loadCharityData(),
      loadDisputes(),
      loadAnnouncements()
    ]);
  }

  async function loadStats() {
    // Platform-wide stats
    const [
      { count: total_users },
      { count: total_agents },
      { count: total_vendors },
      { count: total_organizations },
      { data: pools },
      { data: contributions },
      { data: commissions }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('pools').select('*'),
      supabase.from('contributions').select('amount').eq('status', 'completed'),
      supabase.from('commissions').select('amount, status')
    ]);

    const total_pools = pools?.length || 0;
    const active_pools = pools?.filter(p => p.status === 'active').length || 0;
    const completed_pools = pools?.filter(p => p.status === 'completed').length || 0;
    const total_volume = contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const total_commission_paid = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0;
    const pending_commission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;
    
    // Charity calculation (2% of total volume)
    const charity_total = total_volume * 0.02;
    const lives_impacted = Math.floor(charity_total / 100);

    setStats({
      total_users: total_users || 0,
      total_agents: total_agents || 0,
      total_vendors: total_vendors || 0,
      total_organizations: total_organizations || 0,
      total_pools,
      active_pools,
      completed_pools,
      total_volume,
      total_commission_paid,
      pending_commission,
      charity_total,
      lives_impacted
    });
  }

  async function loadMyPools() {
    const { data: pools } = await supabase
      .from('pools')
      .select('*')
      .eq('created_by', user?.id)
      .order('created_at', { ascending: false });

    setMyPools(pools || []);
    
    const activePools = pools?.filter(p => p.status === 'active') || [];
    const completedPools = pools?.filter(p => p.status === 'completed') || [];
    const totalRaised = pools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
    
    const { data: commissions } = await supabase
      .from('commissions')
      .select('amount, status')
      .eq('user_id', user?.id);

    const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const pendingCommission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;

    setMyStats({
      total_pools: pools?.length || 0,
      active_pools: activePools.length,
      completed_pools: completedPools.length,
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

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setUsers(data || []);
  }

  async function loadAllPools() {
    const { data } = await supabase
      .from('pools')
      .select('*, profiles!created_by(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(50);
    setAllPools(data || []);
  }

  async function loadFeaturedPools() {
    const { data } = await supabase
      .from('pools')
      .select('*')
      .eq('is_featured', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
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
      .eq('status', 'pending')
      .order('filed_at', { ascending: false });
    setDisputes(data || []);
  }

  async function loadAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    setAnnouncements(data || []);
  }

  async function verifyAgent(agentId, verified) {
    const { error } = await supabase
      .from('agents')
      .update({ verified: verified, verified_at: new Date().toISOString() })
      .eq('id', agentId);
    
    if (error) {
      toast.error('Failed to update agent');
    } else {
      toast.success(`Agent ${verified ? 'approved' : 'rejected'}`);
      loadPendingApprovals();
      loadStats();
    }
  }

  async function verifyVendor(vendorId, verified) {
    const { error } = await supabase
      .from('vendors')
      .update({ verified: verified, verified_at: new Date().toISOString() })
      .eq('id', vendorId);
    
    if (error) {
      toast.error('Failed to update vendor');
    } else {
      toast.success(`Vendor ${verified ? 'approved' : 'rejected'}`);
      loadPendingApprovals();
      loadStats();
    }
  }

  async function updateUserRole(userId, newRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, user_type: newRole })
      .eq('id', userId);
    
    if (error) {
      toast.error('Failed to update user role');
    } else {
      toast.success('User role updated');
      loadUsers();
      loadStats();
    }
  }

  async function toggleFeaturedPool(poolId, isFeatured) {
    const { error } = await supabase
      .from('pools')
      .update({ is_featured: !isFeatured })
      .eq('id', poolId);
    
    if (error) {
      toast.error('Failed to update featured status');
    } else {
      toast.success(`Pool ${!isFeatured ? 'featured' : 'removed from featured'}`);
      loadAllPools();
      loadFeaturedPools();
    }
  }

  async function createAnnouncement() {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in all fields');
      return;
    }
    
    const { error } = await supabase
      .from('announcements')
      .insert({
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        created_by: user?.id,
        is_active: true
      });
    
    if (error) {
      toast.error('Failed to create announcement');
    } else {
      toast.success('Announcement created successfully');
      setNewAnnouncement({ title: '', content: '' });
      setShowAnnouncementModal(false);
      loadAnnouncements();
    }
  }

  async function resolveDispute(disputeId, resolution) {
    const { error } = await supabase
      .from('disputes')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolution_notes: resolution })
      .eq('id', disputeId);
    
    if (error) {
      toast.error('Failed to resolve dispute');
    } else {
      toast.success('Dispute resolved');
      loadDisputes();
    }
  }

  const createPool = () => {
    router.push('/create-pool');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-red-100 mt-1">Welcome, {profile?.full_name || 'Admin'}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={createPool}
                className="bg-white text-red-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition shadow-lg"
              >
                + Create My Pool (20%)
              </button>
              <Link href="/dashboard" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 font-semibold transition ${activeTab === 'overview' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>📊 Overview</button>
            <button onClick={() => setActiveTab('my-pools')} className={`px-6 py-3 font-semibold transition ${activeTab === 'my-pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>🎯 My Pools (20%)</button>
            <button onClick={() => setActiveTab('featured')} className={`px-6 py-3 font-semibold transition ${activeTab === 'featured' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>⭐ Featured Listings</button>
            <button onClick={() => setActiveTab('approvals')} className={`px-6 py-3 font-semibold transition relative ${activeTab === 'approvals' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>
              📝 Approvals
              {(pendingAgents.length + pendingVendors.length + pendingOrganizations.length) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingAgents.length + pendingVendors.length + pendingOrganizations.length}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('users')} className={`px-6 py-3 font-semibold transition ${activeTab === 'users' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>👥 Users</button>
            <button onClick={() => setActiveTab('all-pools')} className={`px-6 py-3 font-semibold transition ${activeTab === 'all-pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>🌊 All Pools</button>
            <button onClick={() => setActiveTab('charity')} className={`px-6 py-3 font-semibold transition ${activeTab === 'charity' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>💚 Charity</button>
            <button onClick={() => setActiveTab('disputes')} className={`px-6 py-3 font-semibold transition relative ${activeTab === 'disputes' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>
              ⚖️ Disputes
              {disputes.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{disputes.length}</span>}
            </button>
            <button onClick={() => setActiveTab('announcements')} className={`px-6 py-3 font-semibold transition ${activeTab === 'announcements' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>📢 Announcements</button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Platform Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><div className="text-2xl mb-2">👥</div><p className="text-2xl font-bold text-blue-600">{stats.total_users}</p><p className="text-xs text-gray-500">Total Users</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><div className="text-2xl mb-2">🤝</div><p className="text-2xl font-bold text-yellow-600">{stats.total_agents}</p><p className="text-xs text-gray-500">Agents</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><div className="text-2xl mb-2">🏭</div><p className="text-2xl font-bold text-purple-600">{stats.total_vendors}</p><p className="text-xs text-gray-500">Vendors</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><div className="text-2xl mb-2">🏢</div><p className="text-2xl font-bold text-cyan-600">{stats.total_organizations}</p><p className="text-xs text-gray-500">Organizations</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><div className="text-2xl mb-2">🎯</div><p className="text-2xl font-bold text-green-600">{stats.total_pools}</p><p className="text-xs text-gray-500">Total Pools</p></div>
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-md p-4 text-center text-white"><div className="text-2xl mb-2">💚</div><p className="text-2xl font-bold">{stats.lives_impacted}</p><p className="text-xs opacity-90">Lives Impacted</p></div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-gray-500 mb-2">Total Volume</h3><p className="text-3xl font-bold text-green-600">ETB {Math.floor(stats.total_volume / 1000)}K</p><p className="text-sm text-gray-400">+20% from last month</p></div>
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-gray-500 mb-2">Commission Paid</h3><p className="text-3xl font-bold text-yellow-600">ETB {stats.total_commission_paid.toLocaleString()}</p><p className="text-sm text-gray-400">{stats.pending_commission.toLocaleString()} ETB pending</p></div>
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-gray-500 mb-2">Admin Earnings</h3><p className="text-3xl font-bold text-red-600">ETB {myStats.total_commission.toLocaleString()}</p><p className="text-sm text-gray-400">From personal pools (20%)</p></div>
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-gray-500 mb-2">Charity Fund</h3><p className="text-3xl font-bold text-pink-600">ETB {Math.floor(stats.charity_total).toLocaleString()}</p><p className="text-sm text-gray-400">2% of all contributions</p></div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link href="/admin/draw" className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-4 text-white text-center hover:shadow-lg transition"><div className="text-2xl mb-1">🎲</div><p className="font-semibold">Run Draws</p><p className="text-xs opacity-90">Manage prize draws</p></Link>
              <Link href="/admin/analytics" className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-4 text-white text-center hover:shadow-lg transition"><div className="text-2xl mb-1">📊</div><p className="font-semibold">Analytics</p><p className="text-xs opacity-90">Platform insights</p></Link>
              <Link href="/admin/bank-transfers" className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-white text-center hover:shadow-lg transition"><div className="text-2xl mb-1">🏦</div><p className="font-semibold">Bank Transfers</p><p className="text-xs opacity-90">Verify payments</p></Link>
              <button onClick={() => setActiveTab('featured')} className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-4 text-white text-center hover:shadow-lg transition"><div className="text-2xl mb-1">⭐</div><p className="font-semibold">Featured</p><p className="text-xs opacity-90">Manage featured pools</p></button>
              <button onClick={createPool} className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-4 text-white text-center hover:shadow-lg transition"><div className="text-2xl mb-1">➕</div><p className="font-semibold">Create My Pool</p><p className="text-xs opacity-90">Earn 20% commission</p></button>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">🔄 Recent Pools</h3><div className="space-y-2">{allPools.slice(0, 5).map(pool => (<div key={pool.id} className="flex justify-between items-center p-2 border-b"><span className="font-medium">{pool.prize_name}</span><span className={`text-xs px-2 py-1 rounded-full ${pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{pool.status}</span></div>))}</div></div>
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">👤 Recent Users</h3><div className="space-y-2">{users.slice(0, 5).map(user => (<div key={user.id} className="flex justify-between items-center p-2 border-b"><span>{user.full_name || user.email}</span><span className="text-xs text-gray-500">{user.user_type || 'individual'}</span></div>))}</div></div>
            </div>
          </div>
        )}

        {/* My Pools Tab */}
        {activeTab === 'my-pools' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">💰 My Pools (20% Commission)</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-red-600">{myStats.total_pools}</p><p className="text-xs text-gray-500">Total Pools</p></div>
                <div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-green-600">{myStats.active_pools}</p><p className="text-xs text-gray-500">Active</p></div>
                <div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-blue-600">{myStats.completed_pools}</p><p className="text-xs text-gray-500">Completed</p></div>
                <div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-purple-600">ETB {Math.floor(myStats.total_raised / 1000)}K</p><p className="text-xs text-gray-500">Total Raised</p></div>
                <div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-yellow-600">ETB {myStats.total_commission.toLocaleString()}</p><p className="text-xs text-gray-500">Commission Earned</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Prize</th><th className="px-6 py-3 text-left">Target</th><th className="px-6 py-3 text-left">Raised</th><th className="px-6 py-3 text-left">Your 20%</th><th className="px-6 py-3 text-left">Status</th><th className="px-6 py-3 text-left">Action</th></tr></thead><tbody>{myPools.length === 0 ? <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No pools created. <button onClick={createPool} className="text-red-600">Create your first pool →</button></td></tr> : myPools.map(pool => {const commission = pool.target_amount * 0.20;return (<tr key={pool.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium">{pool.prize_name}</td><td className="px-6 py-4">ETB {pool.target_amount?.toLocaleString()}</td><td className="px-6 py-4">ETB {pool.current_amount?.toLocaleString()}</td><td className="px-6 py-4 font-semibold text-green-600">ETB {commission?.toLocaleString()}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{pool.status}</span></td><td className="px-6 py-4"><Link href={`/pools/${pool.id}`} className="text-red-600 text-sm">View →</Link></td></tr>))})}</tbody></table></div>
            </div>
          </div>
        )}

        {/* Featured Listings Tab */}
        {activeTab === 'featured' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
              <h2 className="text-xl font-bold mb-2">⭐ Featured Listings Management</h2>
              <p className="text-sm opacity-90">Featured pools appear on the homepage and get more visibility. Admin can feature any pool.</p>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Prize Name</th><th className="px-6 py-3 text-left">Created By</th><th className="px-6 py-3 text-left">Target</th><th className="px-6 py-3 text-left">Status</th><th className="px-6 py-3 text-left">Featured</th><th className="px-6 py-3 text-left">Action</th></tr></thead><tbody>{allPools.map(pool => (<tr key={pool.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium">{pool.prize_name}</td><td className="px-6 py-4">{pool.profiles?.full_name || 'Admin'}</td><td className="px-6 py-4">ETB {pool.target_amount?.toLocaleString()}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{pool.status}</span></td><td className="px-6 py-4">{pool.is_featured ? <span className="text-yellow-500">⭐ Featured</span> : <span className="text-gray-400">Not featured</span>}</td><td className="px-6 py-4"><button onClick={() => toggleFeaturedPool(pool.id, pool.is_featured)} className={`px-3 py-1 rounded text-sm ${pool.is_featured ? 'bg-gray-300 text-gray-700' : 'bg-yellow-500 text-white'}`}>{pool.is_featured ? 'Remove' : 'Feature'}</button></td></tr>))}</tbody></table></div>
            </div>
          </div>
        )}

        {/* Approvals Tab - Keep existing */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden"><div className="px-6 py-4 bg-yellow-50 border-b"><h2 className="font-bold text-yellow-800">🤝 Pending Agents ({pendingAgents.length})</h2></div><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Name</th><th className="px-6 py-3 text-left">Email</th><th className="px-6 py-3 text-left">Business</th><th className="px-6 py-3 text-left">Action</th></tr></thead><tbody>{pendingAgents.map(agent => (<tr key={agent.id}><td className="px-6 py-4">{agent.business_name}</td><td className="px-6 py-4">{agent.email}</td><td className="px-6 py-4">{agent.business_type}</td><td className="px-6 py-4"><button onClick={() => verifyAgent(agent.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm mr-2">Approve</button><button onClick={() => verifyAgent(agent.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button></td></tr>))}</tbody></table></div></div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden"><div className="px-6 py-4 bg-purple-50 border-b"><h2 className="font-bold text-purple-800">🏭 Pending Vendors ({pendingVendors.length})</h2></div><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Name</th><th className="px-6 py-3 text-left">Email</th><th className="px-6 py-3 text-left">Action</th></tr></thead><tbody>{pendingVendors.map(vendor => (<tr key={vendor.id}><td className="px-6 py-4">{vendor.business_name}</td><td className="px-6 py-4">{vendor.email}</td><td className="px-6 py-4"><button onClick={() => verifyVendor(vendor.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm mr-2">Approve</button><button onClick={() => verifyVendor(vendor.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button></td></tr>))}</tbody></table></div></div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden"><div className="px-6 py-4 bg-blue-50 border-b"><h2 className="font-bold text-blue-800">🏢 Pending Organizations ({pendingOrganizations.length})</h2></div><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Name</th><th className="px-6 py-3 text-left">Email</th><th className="px-6 py-3 text-left">Action</th></tr></thead><tbody>{pendingOrganizations.map(org => (<tr key={org.id}><td className="px-6 py-4">{org.business_name}</td><td className="px-6 py-4">{org.email}</td><td className="px-6 py-4"><button onClick={() => verifyAgent(org.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm mr-2">Approve</button><button onClick={() => verifyAgent(org.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button></td></tr>))}</tbody></table></div></div>
          </div>
        )}

        {/* Users Tab - Keep existing */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Name</th><th className="px-6 py-3 text-left">Email</th><th className="px-6 py-3 text-left">Role</th><th className="px-6 py-3 text-left">User Type</th><th className="px-6 py-3 text-left">Action</th></tr></thead><tbody>{users.map(user => (<tr key={user.id}><td className="px-6 py-4">{user.full_name}</td><td className="px-6 py-4">{user.email}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>{user.role || 'user'}</span></td><td className="px-6 py-4">{user.user_type || 'individual'}</td><td className="px-6 py-4">{user.role !== 'admin' && (<select onChange={(e) => updateUserRole(user.id, e.target.value)} className="text-sm border rounded px-2 py-1"><option value="user">User</option><option value="agent">Agent</option><option value="vendor">Vendor</option><option value="organization">Organization</option></select>)}</td></tr>))}</tbody></tr></div>
          </div>
        )}

        {/* All Pools Tab - Keep existing */}
        {activeTab === 'all-pools' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Prize</th><th className="px-6 py-3 text-left">Created By</th><th className="px-6 py-3 text-left">Target</th><th className="px-6 py-3 text-left">Featured</th><th className="px-6 py-3 text-left">Status</th><th className="px-6 py-3 text-left">Action</th></tr></thead><tbody>{allPools.map(pool => (<tr key={pool.id}><td className="px-6 py-4 font-medium">{pool.prize_name}</td><td className="px-6 py-4">{pool.profiles?.full_name || 'Admin'}</td><td className="px-6 py-4">ETB {pool.target_amount?.toLocaleString()}</td><td className="px-6 py-4">{pool.is_featured ? '⭐ Yes' : 'No'}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{pool.status}</span></td><td className="px-6 py-4"><Link href={`/pools/${pool.id}`} className="text-red-600 text-sm">View →</Link></td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* Charity Tab - New */}
        {activeTab === 'charity' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-6 text-white">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-5xl">💚</div>
                <div><h2 className="text-2xl font-bold">2% for Health</h2><p className="text-red-100">Supporting Ethiopians fighting kidney & heart disease</p></div>
                <div className="ml-auto text-right"><p className="text-3xl font-bold">ETB {Math.floor(stats.charity_total).toLocaleString()}</p><p className="text-sm opacity-90">Total Raised for Charity</p></div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6"><div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-lg mb-4">💚 Impact Statistics</h3><div className="space-y-3"><div className="flex justify-between items-center border-b pb-2"><span className="text-gray-600">Lives Impacted</span><span className="text-2xl font-bold text-red-600">{stats.lives_impacted}</span></div><div className="flex justify-between items-center border-b pb-2"><span className="text-gray-600">Total Contributions</span><span className="text-2xl font-bold text-green-600">{stats.total_users}</span></div><div className="flex justify-between items-center border-b pb-2"><span className="text-gray-600">Monthly Average</span><span className="text-2xl font-bold text-blue-600">ETB {Math.floor(stats.charity_total / 3).toLocaleString()}</span></div></div></div><div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-lg mb-4">🏦 Direct Donation Information</h3><div className="bg-green-50 rounded-lg p-4"><p className="font-semibold">Commercial Bank of Ethiopia</p><p className="text-sm">Account Name: Abbaa Carraa Health Foundation</p><p className="text-sm font-mono">Account Number: 1000XXXXXX</p><p className="text-sm">Reference: "Health Support"</p></div><Link href="/charity" className="inline-block mt-4 text-red-600 text-sm hover:underline">Learn more about our impact →</Link></div></div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden"><div className="px-6 py-4 border-b"><h3 className="font-bold">📋 Recent Charity Transactions</h3></div><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Date</th><th className="px-6 py-3 text-left text-xs">Amount</th><th className="px-6 py-3 text-left text-xs">Source</th><th className="px-6 py-3 text-left text-xs">Status</th></tr></thead><tbody>{charityTransactions.length === 0 ? <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No charity transactions yet</td></tr> : charityTransactions.map(tx => (<tr key={tx.id}><td className="px-6 py-4">{new Date(tx.created_at).toLocaleDateString()}</td><td className="px-6 py-4 font-semibold text-green-600">ETB {tx.amount?.toLocaleString()}</td><td className="px-6 py-4">{tx.source}</td><td className="px-6 py-4"><span className="capitalize">{tx.status}</span></td></tr>))}</tbody></table></div></div>
          </div>
        )}

        {/* Disputes Tab - New */}
        {activeTab === 'disputes' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white"><h2 className="text-xl font-bold">⚖️ Dispute Resolution</h2><p className="text-sm opacity-90">Manage and resolve user disputes</p></div>
            <div className="space-y-4">{disputes.length === 0 ? (<div className="bg-white rounded-xl shadow-md p-12 text-center"><p className="text-gray-400 text-lg">✅ No pending disputes</p></div>) : (disputes.map(dispute => (<div key={dispute.id} className="bg-white rounded-xl shadow-md p-6"><div className="flex justify-between items-start flex-wrap gap-4"><div><h3 className="font-bold text-lg">Pool: {dispute.pool?.prize_name}</h3><p className="text-sm text-gray-500">Filed by: {dispute.user?.full_name}</p><p className="text-sm text-gray-500">Type: {dispute.dispute_type}</p><p className="mt-2">{dispute.description}</p></div><div><button onClick={() => resolveDispute(dispute.id, 'Resolved by admin - winner confirmed')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm mr-2">Resolve</button><button className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm">Mediate</button></div></div></div>)))}</div>
          </div>
        )}

        {/* Announcements Tab - New */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-6 text-white"><div className="flex justify-between items-center flex-wrap gap-4"><div><h2 className="text-xl font-bold">📢 Platform Announcements</h2><p className="text-sm opacity-90">Create announcements visible to all users</p></div><button onClick={() => setShowAnnouncementModal(true)} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100">+ New Announcement</button></div></div>
            <div className="space-y-3">{announcements.map(ann => (<div key={ann.id} className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-lg text-blue-600">{ann.title}</h3><p className="text-gray-600 mt-2">{ann.content}</p><p className="text-xs text-gray-400 mt-3">{new Date(ann.created_at).toLocaleDateString()}</p></div>))}</div>
          </div>
        )}
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Create Announcement</h3><button onClick={() => setShowAnnouncementModal(false)} className="text-gray-400">✕</button></div><div className="space-y-4"><input type="text" placeholder="Announcement Title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /><textarea placeholder="Announcement Content" rows="4" value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea><div className="flex gap-3"><button onClick={createAnnouncement} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold">Publish</button><button onClick={() => setShowAnnouncementModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancel</button></div></div></div></div>)}
    </div>
  );
}
