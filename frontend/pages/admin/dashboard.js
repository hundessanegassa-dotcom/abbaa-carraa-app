export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
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
  
  // Stats
  const [stats, setStats] = useState({
    total_users: 0, total_agents: 0, total_vendors: 0, total_organizations: 0,
    total_pools: 0, active_pools: 0, completed_pools: 0, pending_pools: 0,
    total_volume: 0, total_commission_paid: 0, pending_commission: 0,
    charity_total: 0, lives_impacted: 0, platform_revenue: 0
  });
  
  // Admin's personal pools (20% commission)
  const [myPools, setMyPools] = useState([]);
  const [myStats, setMyStats] = useState({
    total_pools: 0, active_pools: 0, completed_pools: 0,
    total_raised: 0, total_commission: 0, pending_commission: 0
  });
  
  // Pending approvals
  const [pendingAgents, setPendingAgents] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingOrganizations, setPendingOrganizations] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  
  // Management data
  const [users, setUsers] = useState([]);
  const [allPools, setAllPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [charityTransactions, setCharityTransactions] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Announcement modal
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', target_audience: 'all' });
  
  // Pool creation modal
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPool, setNewPool] = useState({
    prize_name: '',
    description: '',
    target_amount: '',
    entry_fee: '10',
    ticket_price: '5',
    start_date: new Date().toISOString().slice(0, 16),
    end_date: '',
    image_url: '',
    is_featured: true
  });

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
      await loadRecentActivity();
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

  async function loadRecentActivity() {
    // Fetch recent activities (new users, new pools, etc.)
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('full_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    const { data: recentPools } = await supabase
      .from('pools')
      .select('prize_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    const activities = [];
    (recentUsers || []).forEach(u => {
      activities.push({
        action: `New user registered: ${u.full_name || u.email}`,
        date: u.created_at,
        icon: '👤',
        color: 'blue'
      });
    });
    (recentPools || []).forEach(p => {
      activities.push({
        action: `New pool created: "${p.prize_name}" (${p.status})`,
        date: p.created_at,
        icon: '🏊',
        color: 'green'
      });
    });
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    setRecentActivity(activities.slice(0, 5));
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

  // Approval functions
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

  // User management
  async function updateUserRole(userId, newRole) {
    const { error } = await supabase.from('profiles').update({ role: newRole, user_type: newRole }).eq('id', userId);
    if (error) toast.error('Failed'); else { toast.success('User role updated'); loadUsers(); loadStats(); }
  }

  async function toggleUserBan(userId, isBanned) {
    const { error } = await supabase.from('profiles').update({ is_banned: !isBanned }).eq('id', userId);
    if (error) toast.error('Failed'); else { toast.success(`User ${!isBanned ? 'banned' : 'unbanned'}`); loadUsers(); }
  }

  // Pool management
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
    if (error) toast.error('Failed'); else { toast.success('Pool deleted'); loadAllPools(); loadStats(); loadMyPools(); }
  }

  // Withdrawal management
  async function processWithdrawal(requestId, approved) {
    const { error } = await supabase.from('withdrawal_requests').update({ status: approved ? 'approved' : 'rejected', processed_at: new Date().toISOString(), processed_by: user?.id }).eq('id', requestId);
    if (error) toast.error('Failed'); else { toast.success(`Withdrawal ${approved ? 'approved' : 'rejected'}`); loadWithdrawalRequests(); }
  }

  // Dispute management
  async function resolveDispute(disputeId, resolution) {
    const { error } = await supabase.from('disputes').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolution_notes: resolution }).eq('id', disputeId);
    if (error) toast.error('Failed'); else { toast.success('Dispute resolved'); loadDisputes(); }
  }

  // Announcement functions
  async function createAnnouncement() {
    if (!newAnnouncement.title || !newAnnouncement.content) { toast.error('Please fill all fields'); return; }
    const { error } = await supabase.from('announcements').insert({ title: newAnnouncement.title, content: newAnnouncement.content, target_audience: newAnnouncement.target_audience, created_by: user?.id, is_active: true });
    if (error) toast.error('Failed'); else { toast.success('Announcement created'); setShowAnnouncementModal(false); setNewAnnouncement({ title: '', content: '', target_audience: 'all' }); }
  }

  // Pool creation functions
  async function handlePoolImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `pool-${Date.now()}.${fileExt}`;
    const filePath = `pools/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('pool-images')
      .upload(filePath, file);
    
    if (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Make sure bucket "pool-images" exists.');
      setUploading(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('pool-images')
      .getPublicUrl(filePath);
    
    setNewPool({ ...newPool, image_url: publicUrl });
    setUploading(false);
    toast.success('Image uploaded');
  }

  async function createAdminPool() {
    if (!newPool.prize_name || !newPool.target_amount || !newPool.end_date) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('pools')
      .insert({
        prize_name: newPool.prize_name,
        description: newPool.description,
        target_amount: parseFloat(newPool.target_amount),
        entry_fee: parseFloat(newPool.entry_fee) || 10,
        ticket_price: parseFloat(newPool.ticket_price) || 5,
        current_amount: 0,
        status: 'active',
        is_featured: newPool.is_featured,
        image_url: newPool.image_url,
        created_by: user?.id,
        start_date: newPool.start_date,
        end_date: newPool.end_date,
        admin_commission_rate: 20
      });
    
    if (error) {
      toast.error('Failed to create pool: ' + error.message);
    } else {
      toast.success('Pool created and featured!');
      setShowPoolModal(false);
      setNewPool({
        prize_name: '', description: '', target_amount: '', entry_fee: '10', ticket_price: '5',
        start_date: new Date().toISOString().slice(0, 16), end_date: '', image_url: '', is_featured: true
      });
      loadAllPools();
      loadFeaturedPools();
      loadStats();
      loadMyPools();
      loadRecentActivity();
    }
    setLoading(false);
  }

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
            <div>
              <h1 className="text-3xl font-bold">Admin Command Center</h1>
              <p className="text-red-100">Welcome, {profile?.full_name || 'Admin'}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/draw" className="bg-white text-red-600 px-6 py-2 rounded-full font-semibold">🎲 Draw Management</Link>
              <button onClick={() => setShowPoolModal(true)} className="bg-white text-red-600 px-6 py-2 rounded-full font-semibold">+ Create Featured Pool (20%)</button>
              <Link href="/dashboard" className="bg-white/20 px-4 py-2 rounded-full text-sm">Home</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Role Description Card - NEW */}
      <div className="container mx-auto px-4 mt-6">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl p-5">
          <h3 className="font-bold text-red-800 text-lg mb-2">👑 Your Role: Platform Administrator</h3>
          <p className="text-red-700 text-sm leading-relaxed">
            As the Platform Administrator, you have full control over Abbaa Carraa. You can manage users, approve applications, 
            monitor all pools, process withdrawals, and resolve disputes. Additionally, you can <strong className="font-bold">create your own personal pools</strong> 
            and earn <strong className="font-bold">20% commission</strong> on them.
          </p>
          <div className="mt-3 bg-white/50 rounded-lg p-3 text-sm">
            <p className="font-semibold text-red-800">💰 Admin Personal Pool Commission (20%):</p>
            <p className="text-red-700 text-xs mt-1">
              • Winner gets: <strong>100% of target</strong><br/>
              • You earn: <strong>20% commission</strong> (added on top)<br/>
              • Total collected: <strong>Target + 20%</strong>
            </p>
            <p className="text-xs text-red-600 mt-2">
              Example: Create a 1,000,000 ETB personal pool → Winner gets 1,000,000 → You earn 200,000 → Total collected 1,200,000 ETB
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions - NEW */}
      <div className="container mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button onClick={() => setShowPoolModal(true)} className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">➕</div>
            <p className="font-semibold text-sm">Create Pool</p>
            <p className="text-xs opacity-80">20% commission</p>
          </button>
          <button onClick={() => setActiveTab('approvals')} className="bg-yellow-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">📝</div>
            <p className="font-semibold text-sm">Approvals</p>
            <p className="text-xs opacity-80">{pendingAgents.length + pendingVendors.length + pendingOrganizations.length} pending</p>
          </button>
          <button onClick={() => setActiveTab('withdrawals')} className="bg-green-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">💰</div>
            <p className="font-semibold text-sm">Withdrawals</p>
            <p className="text-xs opacity-80">{withdrawalRequests.length} requests</p>
          </button>
          <button onClick={() => setActiveTab('disputes')} className="bg-orange-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">⚖️</div>
            <p className="font-semibold text-sm">Disputes</p>
            <p className="text-xs opacity-80">{disputes.length} open</p>
          </button>
          <button onClick={() => setShowAnnouncementModal(true)} className="bg-purple-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">📢</div>
            <p className="font-semibold text-sm">Announce</p>
            <p className="text-xs opacity-80">Send message</p>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white sticky top-0 z-10 overflow-x-auto mt-6">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 min-w-max">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-3 font-semibold ${activeTab === 'overview' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>📊 Overview</button>
            <button onClick={() => setActiveTab('my-pools')} className={`px-4 py-3 font-semibold ${activeTab === 'my-pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>🎯 My Pools (20%)</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-3 font-semibold ${activeTab === 'users' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>👥 Users</button>
            <button onClick={() => setActiveTab('pools')} className={`px-4 py-3 font-semibold ${activeTab === 'pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>🌊 All Pools</button>
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
        
        {/* ========== OVERVIEW TAB ========== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-blue-600">{stats.total_users}</p><p className="text-xs text-gray-500">Users</p></div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-yellow-600">{stats.total_agents}</p><p className="text-xs text-gray-500">Agents</p></div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-purple-600">{stats.total_vendors}</p><p className="text-xs text-gray-500">Vendors</p></div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-cyan-600">{stats.total_organizations}</p><p className="text-xs text-gray-500">Orgs</p></div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-green-600">{stats.total_pools}</p><p className="text-xs text-gray-500">Pools</p></div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-emerald-600">{stats.active_pools}</p><p className="text-xs text-gray-500">Active</p></div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-orange-600">{stats.pending_pools}</p><p className="text-xs text-gray-500">Pending</p></div>
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-3 text-center text-white shadow-sm"><p className="text-2xl font-bold">{stats.lives_impacted}</p><p className="text-xs">Lives Saved</p></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-4">💰 Financial Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-600">Total Volume:</span><span className="font-bold">ETB {stats.total_volume.toLocaleString()}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-600">Commission Paid:</span><span className="font-bold text-yellow-600">ETB {stats.total_commission_paid.toLocaleString()}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-600">Pending Commission:</span><span className="font-bold text-orange-600">ETB {stats.pending_commission.toLocaleString()}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-600">Platform Revenue (10%):</span><span className="font-bold text-blue-600">ETB {stats.platform_revenue.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Charity Fund (2%):</span><span className="font-bold text-pink-600">ETB {Math.floor(stats.charity_total).toLocaleString()}</span></div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-4">👑 Admin's Personal Stats (20% Commission)</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-2xl font-bold text-red-600">{myStats.total_pools}</p><p className="text-xs text-gray-500">My Pools</p></div>
                  <div><p className="text-2xl font-bold text-green-600">{myStats.active_pools}</p><p className="text-xs text-gray-500">Active</p></div>
                  <div><p className="text-2xl font-bold text-yellow-600">ETB {myStats.total_commission.toLocaleString()}</p><p className="text-xs text-gray-500">Commission Earned</p></div>
                </div>
                <button onClick={() => setShowPoolModal(true)} className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg font-semibold">+ Create New Featured Pool</button>
              </div>
            </div>

            {/* Recent Activity - NEW */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-3">📋 Recent Platform Activity</h3>
              <div className="space-y-2">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No recent activity</p>
                ) : (
                  recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 border-b border-gray-100">
                      <span className="text-xl">{activity.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{activity.action}</p>
                        <p className="text-xs text-gray-400">{new Date(activity.date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Commission Breakdown - NEW */}
            <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-6 border border-red-100">
              <h3 className="font-bold text-red-800 text-lg mb-3">💰 Platform Commission Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="font-bold text-red-600">Admin Personal Pool</p>
                  <p className="text-2xl font-bold">20%</p>
                  <p className="text-xs text-gray-500">Commission</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="font-bold text-yellow-600">Agent Pool</p>
                  <p className="text-2xl font-bold">10%</p>
                  <p className="text-xs text-gray-500">+ 10% platform fee</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="font-bold text-cyan-600">Organization Pool</p>
                  <p className="text-2xl font-bold">10%</p>
                  <p className="text-xs text-gray-500">+ 10% platform fee</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="font-bold text-purple-600">Vendor Sale</p>
                  <p className="text-2xl font-bold">10%</p>
                  <p className="text-xs text-gray-500">+ 10% platform fee</p>
                </div>
              </div>
              <p className="text-xs text-red-600 text-center mt-3">
                💚 2% of all contributions goes to kidney & heart disease treatment
              </p>
            </div>
          </div>
        )}

        {/* ========== MY POOLS TAB ========== */}
        {activeTab === 'my-pools' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">💰 My Personal Pools (20% Commission)</h2>
              <button onClick={() => setShowPoolModal(true)} className="bg-red-600 text-white px-4 py-1 rounded-full text-sm">+ Create</button>
            </div>
            <div className="p-6">
              {myPools.length === 0 ? (
                <div className="text-center py-8"><p className="text-gray-400">No pools created yet</p><button onClick={() => setShowPoolModal(true)} className="mt-2 text-red-600">Create your first pool →</button></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr><th className="px-4 py-3 text-left">Prize</th><th className="px-4 py-3 text-left">Target</th><th className="px-4 py-3 text-left">Raised</th><th className="px-4 py-3 text-left">Your 20%</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Action</th></tr>
                    </thead>
                    <tbody>
                      {myPools.map(pool => (
                        <tr key={pool.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{pool.prize_name}</td>
                          <td className="px-4 py-3">ETB {pool.target_amount?.toLocaleString()}</td>
                          <td className="px-4 py-3">ETB {pool.current_amount?.toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold text-green-600">ETB {((pool.target_amount || 0) * 0.20).toLocaleString()}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{pool.status}</span></td>
                          <td className="px-4 py-3"><Link href={`/pools/${pool.id}`} className="text-red-600 text-sm hover:underline">View</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== USERS TAB ========== */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="font-bold text-lg">👥 User Management</h2></div>
            <div className="overflow-x-auto p-4">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{u.full_name || 'N/A'}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">
                        <select onChange={(e) => updateUserRole(u.id, e.target.value)} defaultValue={u.role || 'individual'} className="border rounded px-2 py-1 text-sm">
                          <option value="individual">Individual</option><option value="agent">Agent</option><option value="vendor">Vendor</option><option value="organization">Organization</option><option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">{u.is_banned ? <span className="text-red-600 font-medium">Banned</span> : <span className="text-green-600">Active</span>}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleUserBan(u.id, u.is_banned)} className={`px-3 py-1 rounded text-xs ${u.is_banned ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{u.is_banned ? 'Unban' : 'Ban'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== ALL POOLS TAB ========== */}
        {activeTab === 'pools' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="font-bold text-lg">🌊 All Platform Pools</h2></div>
            <div className="overflow-x-auto p-4">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="px-4 py-3 text-left">Prize</th><th className="px-4 py-3 text-left">Creator</th><th className="px-4 py-3 text-left">Target</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Featured</th><th className="px-4 py-3 text-left">Actions</th></tr>
                </thead>
                <tbody>
                  {allPools.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.prize_name}</td>
                      <td className="px-4 py-3">{p.profiles?.full_name || 'Admin'}</td>
                      <td className="px-4 py-3">ETB {p.target_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{p.status}</span></td>
                      <td className="px-4 py-3">{p.is_featured ? '⭐ Featured' : ''}</td>
                      <td className="px-4 py-3 flex gap-1 flex-wrap">
                        <button onClick={() => togglePoolStatus(p.id, p.status)} className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">{p.status === 'active' ? 'Pause' : 'Activate'}</button>
                        <button onClick={() => toggleFeaturedPool(p.id, p.is_featured)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">{p.is_featured ? 'Unfeature' : 'Feature'}</button>
                        <button onClick={() => deletePool(p.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Delete</button>
                        <Link href={`/pools/${p.id}`} className="bg-gray-600 text-white px-2 py-1 rounded text-xs">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== APPROVALS TAB ========== */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-lg mb-4">🤝 Pending Agents ({pendingAgents.length})</h3>
              {pendingAgents.length === 0 ? <p className="text-gray-400">No pending agents</p> : pendingAgents.map(a => (<div key={a.id} className="flex justify-between items-center border-b py-3"><div><p className="font-medium">{a.business_name}</p><p className="text-sm text-gray-500">{a.profiles?.email}</p></div><div><button onClick={() => verifyAgent(a.id, true)} className="bg-green-600 text-white px-4 py-1 rounded text-sm">Approve</button><button onClick={() => verifyAgent(a.id, false)} className="bg-red-600 text-white px-4 py-1 rounded text-sm ml-2">Reject</button></div></div>))}
            </div>
            <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-lg mb-4">🏪 Pending Vendors ({pendingVendors.length})</h3>
              {pendingVendors.length === 0 ? <p className="text-gray-400">No pending vendors</p> : pendingVendors.map(v => (<div key={v.id} className="flex justify-between items-center border-b py-3"><div><p className="font-medium">{v.business_name}</p><p className="text-sm text-gray-500">{v.profiles?.email}</p></div><div><button onClick={() => verifyVendor(v.id, true)} className="bg-green-600 text-white px-4 py-1 rounded text-sm">Approve</button><button onClick={() => verifyVendor(v.id, false)} className="bg-red-600 text-white px-4 py-1 rounded text-sm ml-2">Reject</button></div></div>))}
            </div>
            <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-lg mb-4">🏢 Pending Organizations ({pendingOrganizations.length})</h3>
              {pendingOrganizations.length === 0 ? <p className="text-gray-400">No pending organizations</p> : pendingOrganizations.map(o => (<div key={o.id} className="flex justify-between items-center border-b py-3"><div><p className="font-medium">{o.business_name}</p><p className="text-sm text-gray-500">{o.profiles?.email}</p></div><div><button onClick={() => verifyOrganization(o.id, true)} className="bg-green-600 text-white px-4 py-1 rounded text-sm">Approve</button><button onClick={() => verifyOrganization(o.id, false)} className="bg-red-600 text-white px-4 py-1 rounded text-sm ml-2">Reject</button></div></div>))}
            </div>
          </div>
        )}

        {/* ========== WITHDRAWALS TAB ========== */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h3 className="font-bold text-lg mb-4">💰 Withdrawal Requests ({withdrawalRequests.length})</h3>
            {withdrawalRequests.length === 0 ? <p className="text-gray-400 text-center py-8">No pending withdrawal requests</p> : 
              withdrawalRequests.map(w => (<div key={w.id} className="flex justify-between items-center border-b py-3"><div><p className="font-medium">{w.profiles?.full_name}</p><p className="text-sm">ETB {w.amount?.toLocaleString()} - {w.commission_type}</p></div><div><button onClick={() => processWithdrawal(w.id, true)} className="bg-green-600 text-white px-4 py-1 rounded text-sm">Approve</button><button onClick={() => processWithdrawal(w.id, false)} className="bg-red-600 text-white px-4 py-1 rounded text-sm ml-2">Reject</button></div></div>))
            }
          </div>
        )}

        {/* ========== FEATURED TAB ========== */}
        {activeTab === 'featured' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-bold text-lg mb-4">⭐ Manage Featured Pools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPools.filter(p => p.status === 'active').map(p => (
                <div key={p.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div><p className="font-medium">{p.prize_name}</p><p className="text-sm text-gray-500">ETB {p.target_amount?.toLocaleString()}</p></div>
                  <button onClick={() => toggleFeaturedPool(p.id, p.is_featured)} className={`px-3 py-1 rounded text-sm ${p.is_featured ? 'bg-gray-300 text-gray-700' : 'bg-yellow-500 text-white'}`}>{p.is_featured ? 'Remove' : 'Feature'}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== FINANCE TAB ========== */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-gray-500">Total Volume</h3><p className="text-3xl font-bold text-green-600">ETB {stats.total_volume.toLocaleString()}</p></div>
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-gray-500">Platform Revenue (10%)</h3><p className="text-3xl font-bold text-blue-600">ETB {stats.platform_revenue.toLocaleString()}</p></div>
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-6 text-white"><h3 className="font-bold">Charity Fund (2%)</h3><p className="text-3xl font-bold">ETB {Math.floor(stats.charity_total).toLocaleString()}</p><p className="text-sm">Lives Impacted: {stats.lives_impacted}</p></div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-lg mb-4">💚 Charity Transaction History</h3>{charityTransactions.length === 0 ? <p className="text-gray-400 text-center py-8">No charity transactions yet</p> : charityTransactions.map(t => (<div key={t.id} className="border-b py-3 flex justify-between"><span>{new Date(t.created_at).toLocaleDateString()}</span><span className="font-bold text-green-600">ETB {t.amount?.toLocaleString()}</span><span className="text-gray-500">{t.source}</span></div>))}</div>
          </div>
        )}

        {/* ========== DISPUTES TAB ========== */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            {disputes.length === 0 ? <div className="bg-white rounded-xl p-8 text-center"><p className="text-gray-400">✅ No pending disputes</p></div> : disputes.map(d => (<div key={d.id} className="bg-white rounded-xl shadow-md p-6"><p className="font-bold text-lg">Pool: {d.pool?.prize_name}</p><p className="text-gray-600">Filed by: {d.user?.full_name}</p><p className="mt-2">{d.description}</p><textarea id={`res-${d.id}`} placeholder="Enter resolution notes..." className="w-full border rounded-lg p-2 mt-3"></textarea><button onClick={() => resolveDispute(d.id, document.getElementById(`res-${d.id}`).value)} className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg">Resolve Dispute</button></div>))}
          </div>
        )}

        {/* ========== SETTINGS TAB ========== */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-xl mb-4">⚙️ Platform Settings</h2>
            <button onClick={() => setShowAnnouncementModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg">📢 Create Announcement</button>
            <div className="mt-6 pt-6 border-t">
              <Link href="/admin/analytics" className="text-blue-600 hover:underline">📊 View Full Analytics →</Link>
            </div>
            <div className="mt-4">
              <Link href="/admin/logs" className="text-blue-600 hover:underline">📜 View System Logs →</Link>
            </div>
          </div>
        )}
      </div>

      {/* ========== CREATE POOL MODAL ========== */}
      {showPoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold">✨ Create Featured Pool (20% Commission)</h2>
              <button onClick={() => setShowPoolModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Prize Name *</label>
                <input type="text" className="w-full border rounded-lg p-3" placeholder="e.g., iPhone 15 Pro Max" value={newPool.prize_name} onChange={(e) => setNewPool({...newPool, prize_name: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea rows="3" className="w-full border rounded-lg p-3" placeholder="Describe the prize and pool rules..." value={newPool.description} onChange={(e) => setNewPool({...newPool, description: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Target Amount (ETB) *</label><input type="number" className="w-full border rounded-lg p-3" placeholder="10000" value={newPool.target_amount} onChange={(e) => setNewPool({...newPool, target_amount: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Entry Fee (ETB)</label><input type="number" className="w-full border rounded-lg p-3" placeholder="10" value={newPool.entry_fee} onChange={(e) => setNewPool({...newPool, entry_fee: e.target.value})} /></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Start Date</label><input type="datetime-local" className="w-full border rounded-lg p-3" value={newPool.start_date} onChange={(e) => setNewPool({...newPool, start_date: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">End Date *</label><input type="datetime-local" className="w-full border rounded-lg p-3" value={newPool.end_date} onChange={(e) => setNewPool({...newPool, end_date: e.target.value})} /></div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Pool Image</label>
                <input type="file" accept="image/*" onChange={handlePoolImageUpload} disabled={uploading} className="w-full border rounded-lg p-2" />
                {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                {newPool.image_url && <div className="mt-2"><img src={newPool.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-lg" /></div>}
              </div>
              
              <div className="flex items-center gap-3"><input type="checkbox" id="is_featured" checked={newPool.is_featured} onChange={(e) => setNewPool({...newPool, is_featured: e.target.checked})} className="w-5 h-5" /><label htmlFor="is_featured" className="text-sm font-medium">⭐ Feature this pool on homepage</label></div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm"><p className="font-semibold text-yellow-800">💰 Admin Commission: 20%</p><p className="text-yellow-700 text-xs mt-1">When this pool reaches target, you earn 20% of the total amount. Target: ETB {parseFloat(newPool.target_amount || 0).toLocaleString()} → Your commission: ETB {(parseFloat(newPool.target_amount || 0) * 0.20).toLocaleString()}</p></div>
              
              <div className="flex gap-3 pt-4"><button onClick={createAdminPool} disabled={loading || uploading} className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">{loading ? 'Creating...' : '✨ Create Featured Pool'}</button><button onClick={() => setShowPoolModal(false)} className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50">Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ========== ANNOUNCEMENT MODAL ========== */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Create Announcement</h3>
            <input type="text" placeholder="Title" className="w-full border rounded-lg p-2 mb-3" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
            <textarea placeholder="Content" rows="4" className="w-full border rounded-lg p-2 mb-3" value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}></textarea>
            <select className="w-full border rounded-lg p-2 mb-4" value={newAnnouncement.target_audience} onChange={(e) => setNewAnnouncement({...newAnnouncement, target_audience: e.target.value})}><option value="all">All Users</option><option value="agents">Agents</option><option value="vendors">Vendors</option><option value="individuals">Individuals</option></select>
            <div className="flex gap-3"><button onClick={createAnnouncement} className="flex-1 bg-blue-600 text-white py-2 rounded-lg">Publish</button><button onClick={() => setShowAnnouncementModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
