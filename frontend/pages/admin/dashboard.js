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
  
  // ============ PLATFORM STATS ============
  const [stats, setStats] = useState({
    total_users: 0, total_agents: 0, total_vendors: 0, total_organizations: 0,
    total_pools: 0, active_pools: 0, completed_pools: 0,
    total_volume: 0, total_commission_paid: 0, pending_commission: 0,
    charity_total: 0, lives_impacted: 0, platform_revenue: 0
  });
  
  // ============ ADMIN'S PERSONAL POOLS ============
  const [myPools, setMyPools] = useState([]);
  const [myStats, setMyStats] = useState({
    total_pools: 0, active_pools: 0, completed_pools: 0, paused_pools: 0,
    total_raised: 0, total_commission: 0, pending_commission: 0
  });
  const [selectedPool, setSelectedPool] = useState(null);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [poolContributors, setPoolContributors] = useState([]);
  
  // ============ PENDING APPROVALS ============
  const [pendingAgents, setPendingAgents] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingOrganizations, setPendingOrganizations] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  
  // ============ PLATFORM MANAGEMENT ============
  const [users, setUsers] = useState([]);
  const [allPools, setAllPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({});
  const [bankAccounts, setBankAccounts] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  
  // ============ CHARITY & FINANCE ============
  const [charityTransactions, setCharityTransactions] = useState([]);
  const [charityTransfers, setCharityTransfers] = useState([]);
  const [revenueReport, setRevenueReport] = useState({ daily: [], monthly: [], yearly: 0 });
  
  // ============ COMMUNICATIONS ============
  const [announcements, setAnnouncements] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [smsTemplates, setSmsTemplates] = useState([]);
  
  // ============ DISPUTES ============
  const [disputes, setDisputes] = useState([]);
  
  // ============ MODAL STATES ============
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCharityTransferModal, setShowCharityTransferModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [newBankAccount, setNewBankAccount] = useState({ bank_name: '', account_name: '', account_number: '', account_type: 'platform' });
  const [charityTransfer, setCharityTransfer] = useState({ amount: '', bank_reference: '', notes: '' });

  useEffect(() => { checkAdmin(); }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile?.role !== 'admin') { router.push('/dashboard'); return; }
    setProfile(profile);
    await loadAllData();
    setLoading(false);
  }

  async function loadAllData() {
    await Promise.all([
      loadStats(), loadMyPools(), loadPendingApprovals(), loadWithdrawalRequests(),
      loadUsers(), loadAllPools(), loadFeaturedPools(), loadPlatformSettings(),
      loadBankAccounts(), loadSystemLogs(), loadCharityData(), loadAnnouncements(),
      loadEmailTemplates(), loadSmsTemplates(), loadDisputes(), loadRevenueReport()
    ]);
  }

  async function loadStats() {
    const [{ count: total_users }, { count: total_agents }, { count: total_vendors }, 
      { count: total_organizations }, { data: pools }, { data: contributions }, 
      { data: commissions }, { data: platformFees }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('pools').select('*'),
      supabase.from('contributions').select('amount').eq('status', 'completed'),
      supabase.from('commissions').select('amount, status'),
      supabase.from('commissions').select('amount').eq('commission_type', 'platform')
    ]);
    const total_pools = pools?.length || 0;
    const active_pools = pools?.filter(p => p.status === 'active' && !p.is_paused).length || 0;
    const completed_pools = pools?.filter(p => p.status === 'completed').length || 0;
    const total_volume = contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const total_commission_paid = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0;
    const pending_commission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;
    const platform_revenue = platformFees?.reduce((sum, f) => sum + f.amount, 0) || 0;
    const charity_total = total_volume * 0.02;
    setStats({ total_users: total_users || 0, total_agents: total_agents || 0, total_vendors: total_vendors || 0,
      total_organizations: total_organizations || 0, total_pools, active_pools, completed_pools,
      total_volume, total_commission_paid, pending_commission, charity_total, 
      lives_impacted: Math.floor(charity_total / 100), platform_revenue });
  }

  async function loadMyPools() {
    const { data: pools } = await supabase.from('pools').select('*').eq('created_by', user?.id).order('created_at', { ascending: false });
    setMyPools(pools || []);
    const activePools = pools?.filter(p => p.status === 'active' && !p.is_paused) || [];
    const pausedPools = pools?.filter(p => p.is_paused === true) || [];
    const completedPools = pools?.filter(p => p.status === 'completed') || [];
    const totalRaised = pools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
    const { data: commissions } = await supabase.from('commissions').select('amount, status').eq('user_id', user?.id);
    const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const pendingCommission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;
    setMyStats({ total_pools: pools?.length || 0, active_pools: activePools.length, paused_pools: pausedPools.length,
      completed_pools: completedPools.length, total_raised: totalRaised, total_commission: totalCommission, pending_commission: pendingCommission });
  }

  async function loadPendingApprovals() {
    const [{ data: agents }, { data: vendors }, { data: organizations }] = await Promise.all([
      supabase.from('agents').select('*, profiles!user_id(full_name, email)').eq('verified', false),
      supabase.from('vendors').select('*, profiles!user_id(full_name, email)').eq('verified', false),
      supabase.from('organizations').select('*, profiles!user_id(full_name, email)').eq('verified', false)
    ]);
    setPendingAgents(agents || []); setPendingVendors(vendors || []); setPendingOrganizations(organizations || []);
  }

  async function loadWithdrawalRequests() {
    const { data } = await supabase.from('withdrawal_requests').select('*, profiles(full_name, email)').eq('status', 'pending').order('requested_at', { ascending: false });
    setWithdrawalRequests(data || []);
  }

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
    setUsers(data || []);
  }

  async function loadAllPools() {
    const { data } = await supabase.from('pools').select('*, profiles!created_by(full_name, email)').order('created_at', { ascending: false }).limit(100);
    setAllPools(data || []);
  }

  async function loadFeaturedPools() {
    const { data } = await supabase.from('pools').select('*').eq('is_featured', true).eq('status', 'active');
    setFeaturedPools(data || []);
  }

  async function loadPlatformSettings() {
    const { data } = await supabase.from('platform_settings').select('*');
    const settingsObj = {};
    data?.forEach(s => { settingsObj[s.setting_key] = s.setting_value; });
    setPlatformSettings(settingsObj);
  }

  async function loadBankAccounts() {
    const { data } = await supabase.from('bank_accounts').select('*').eq('is_active', true);
    setBankAccounts(data || []);
  }

  async function loadSystemLogs() {
    const { data } = await supabase.from('system_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(50);
    setSystemLogs(data || []);
  }

  async function loadCharityData() {
    const { data: transactions } = await supabase.from('charity_transactions').select('*').order('created_at', { ascending: false }).limit(20);
    const { data: transfers } = await supabase.from('charity_transfers').select('*').order('created_at', { ascending: false });
    setCharityTransactions(transactions || []);
    setCharityTransfers(transfers || []);
  }

  async function loadAnnouncements() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements(data || []);
  }

  async function loadEmailTemplates() {
    const { data } = await supabase.from('email_templates').select('*');
    setEmailTemplates(data || []);
  }

  async function loadSmsTemplates() {
    const { data } = await supabase.from('sms_templates').select('*');
    setSmsTemplates(data || []);
  }

  async function loadDisputes() {
    const { data } = await supabase.from('disputes').select('*, pool:pools(prize_name), user:profiles(full_name)').eq('status', 'pending');
    setDisputes(data || []);
  }

  async function loadRevenueReport() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const { data: monthlyData } = await supabase.rpc('get_monthly_revenue', { year_param: currentYear });
    setRevenueReport({ monthly: monthlyData || [], yearly: 0 });
  }

  // ============ ADMIN POOL MANAGEMENT FUNCTIONS ============
  async function updatePool(poolId, updates) {
    const { error } = await supabase.from('pools').update(updates).eq('id', poolId);
    if (error) { toast.error('Failed to update pool'); return false; }
    toast.success('Pool updated successfully');
    loadMyPools(); loadAllPools();
    return true;
  }

  async function togglePausePool(poolId, isPaused) {
    await updatePool(poolId, { is_paused: !isPaused, paused_at: !isPaused ? new Date().toISOString() : null });
  }

  async function deletePool(poolId) {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    const { error } = await supabase.from('pools').delete().eq('id', poolId);
    if (error) { toast.error('Failed to delete pool'); return; }
    toast.success('Pool deleted');
    loadMyPools(); loadAllPools();
  }

  async function viewPoolContributors(poolId) {
    const { data } = await supabase.from('contributions').select('*, profiles(full_name, phone, email)').eq('pool_id', poolId).eq('status', 'completed');
    setPoolContributors(data || []);
    setShowPoolModal(true);
  }

  async function markPrizeDelivered(poolId) {
    await updatePool(poolId, { prize_delivered: true, delivered_at: new Date().toISOString() });
  }

  // ============ APPROVAL FUNCTIONS ============
  async function verifyAgent(agentId, verified) {
    const { error } = await supabase.from('agents').update({ verified, verified_at: new Date().toISOString() }).eq('id', agentId);
    if (error) toast.error('Failed'); else { toast.success(`Agent ${verified ? 'approved' : 'rejected'}`); loadPendingApprovals(); loadStats(); }
  }

  async function verifyVendor(vendorId, verified) {
    const { error } = await supabase.from('vendors').update({ verified, verified_at: new Date().toISOString() }).eq('id', vendorId);
    if (error) toast.error('Failed'); else { toast.success(`Vendor ${verified ? 'approved' : 'rejected'}`); loadPendingApprovals(); loadStats(); }
  }

  async function processWithdrawal(requestId, approved, rejectionReason = '') {
    if (approved) {
      const { error } = await supabase.from('withdrawal_requests').update({ status: 'approved', processed_at: new Date().toISOString(), processed_by: user?.id }).eq('id', requestId);
      if (error) toast.error('Failed'); else toast.success('Withdrawal approved');
    } else {
      const { error } = await supabase.from('withdrawal_requests').update({ status: 'rejected', rejection_reason: rejectionReason, processed_at: new Date().toISOString() }).eq('id', requestId);
      if (error) toast.error('Failed'); else toast.success('Withdrawal rejected');
    }
    loadWithdrawalRequests();
  }

  async function updateUserRole(userId, newRole) {
    const { error } = await supabase.from('profiles').update({ role: newRole, user_type: newRole }).eq('id', userId);
    if (error) toast.error('Failed'); else { toast.success('User role updated'); loadUsers(); loadStats(); }
  }

  async function toggleFeaturedPool(poolId, isFeatured) {
    const { error } = await supabase.from('pools').update({ is_featured: !isFeatured }).eq('id', poolId);
    if (error) toast.error('Failed'); else { toast.success(`Pool ${!isFeatured ? 'featured' : 'removed'}`); loadAllPools(); loadFeaturedPools(); }
  }

  // ============ PLATFORM SETTINGS FUNCTIONS ============
  async function updatePlatformSettings(settingKey, settingValue) {
    const { error } = await supabase.from('platform_settings').upsert({ setting_key: settingKey, setting_value: settingValue, updated_at: new Date().toISOString(), updated_by: user?.id });
    if (error) toast.error('Failed to update settings'); else { toast.success('Settings updated'); loadPlatformSettings(); }
  }

  async function addBankAccount() {
    const { error } = await supabase.from('bank_accounts').insert(newBankAccount);
    if (error) toast.error('Failed to add bank account'); else { toast.success('Bank account added'); setShowBankModal(false); setNewBankAccount({ bank_name: '', account_name: '', account_number: '', account_type: 'platform' }); loadBankAccounts(); }
  }

  async function createAnnouncement() {
    if (!newAnnouncement.title || !newAnnouncement.content) { toast.error('Please fill all fields'); return; }
    const { error } = await supabase.from('announcements').insert({ title: newAnnouncement.title, content: newAnnouncement.content, created_by: user?.id, is_active: true });
    if (error) toast.error('Failed'); else { toast.success('Announcement created'); setNewAnnouncement({ title: '', content: '' }); setShowAnnouncementModal(false); loadAnnouncements(); }
  }

  async function transferCharityFund() {
    if (!charityTransfer.amount || !charityTransfer.bank_reference) { toast.error('Please fill all fields'); return; }
    const { error } = await supabase.from('charity_transfers').insert({ amount: parseFloat(charityTransfer.amount), bank_reference: charityTransfer.bank_reference, notes: charityTransfer.notes, approved_by: user?.id, transfer_date: new Date().toISOString().split('T')[0] });
    if (error) toast.error('Failed'); else { toast.success('Charity transfer recorded'); setShowCharityTransferModal(false); setCharityTransfer({ amount: '', bank_reference: '', notes: '' }); loadCharityData(); }
  }

  async function resolveDispute(disputeId, resolution) {
    const { error } = await supabase.from('disputes').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolution_notes: resolution }).eq('id', disputeId);
    if (error) toast.error('Failed'); else { toast.success('Dispute resolved'); loadDisputes(); }
  }

  const createPool = () => router.push('/create-pool');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-6 sticky top-0 z-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div><h1 className="text-3xl font-bold">🏛️ Full Admin Dashboard</h1><p className="text-red-100">Platform Management + Personal Listings (20% Commission)</p></div>
            <div className="flex gap-3"><button onClick={createPool} className="bg-white text-red-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100">+ Create My Pool (20%)</button><Link href="/dashboard" className="bg-white/20 px-4 py-2 rounded-full text-sm">Home</Link></div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b bg-white sticky top-24 z-10 overflow-x-auto">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 min-w-max">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-3 font-semibold ${activeTab === 'overview' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>📊 Overview</button>
            <button onClick={() => setActiveTab('my-pools')} className={`px-4 py-3 font-semibold ${activeTab === 'my-pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>🎯 My Pools (20%)</button>
            <button onClick={() => setActiveTab('platform-pools')} className={`px-4 py-3 font-semibold ${activeTab === 'platform-pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>🌊 All Platform Pools</button>
            <button onClick={() => setActiveTab('approvals')} className={`px-4 py-3 font-semibold relative ${activeTab === 'approvals' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>📝 Approvals {(pendingAgents.length + pendingVendors.length + pendingOrganizations.length + withdrawalRequests.length) > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded-full">{pendingAgents.length + pendingVendors.length + pendingOrganizations.length + withdrawalRequests.length}</span>}</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-3 font-semibold ${activeTab === 'users' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>👥 Users</button>
            <button onClick={() => setActiveTab('featured')} className={`px-4 py-3 font-semibold ${activeTab === 'featured' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>⭐ Featured</button>
            <button onClick={() => setActiveTab('finance')} className={`px-4 py-3 font-semibold ${activeTab === 'finance' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>💰 Finance</button>
            <button onClick={() => setActiveTab('charity')} className={`px-4 py-3 font-semibold ${activeTab === 'charity' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>💚 Charity</button>
            <button onClick={() => setActiveTab('settings')} className={`px-4 py-3 font-semibold ${activeTab === 'settings' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>⚙️ Settings</button>
            <button onClick={() => setActiveTab('communications')} className={`px-4 py-3 font-semibold ${activeTab === 'communications' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>📢 Comms</button>
            <button onClick={() => setActiveTab('disputes')} className={`px-4 py-3 font-semibold ${activeTab === 'disputes' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>⚖️ Disputes {disputes.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded-full">{disputes.length}</span>}</button>
            <button onClick={() => setActiveTab('logs')} className={`px-4 py-3 font-semibold ${activeTab === 'logs' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>📋 Logs</button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        
        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><div className="text-2xl">👥</div><p className="text-2xl font-bold text-blue-600">{stats.total_users}</p><p className="text-xs">Users</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><div className="text-2xl">🤝</div><p className="text-2xl font-bold text-yellow-600">{stats.total_agents}</p><p className="text-xs">Agents</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><div className="text-2xl">🏭</div><p className="text-2xl font-bold text-purple-600">{stats.total_vendors}</p><p className="text-xs">Vendors</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><div className="text-2xl">🏢</div><p className="text-2xl font-bold text-cyan-600">{stats.total_organizations}</p><p className="text-xs">Orgs</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><div className="text-2xl">🎯</div><p className="text-2xl font-bold text-green-600">{stats.total_pools}</p><p className="text-xs">Pools</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><div className="text-2xl">🟢</div><p className="text-2xl font-bold text-emerald-600">{stats.active_pools}</p><p className="text-xs">Active</p></div>
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-md p-4 text-center text-white"><div className="text-2xl">💚</div><p className="text-2xl font-bold">{stats.lives_impacted}</p><p className="text-xs">Lives Saved</p></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">💰 Financial Summary</h3><div className="space-y-3"><div className="flex justify-between"><span>Total Volume:</span><span className="font-bold text-green-600">ETB {stats.total_volume.toLocaleString()}</span></div><div className="flex justify-between"><span>Commission Paid:</span><span className="font-bold text-yellow-600">ETB {stats.total_commission_paid.toLocaleString()}</span></div><div className="flex justify-between"><span>Pending Commission:</span><span className="font-bold text-orange-600">ETB {stats.pending_commission.toLocaleString()}</span></div><div className="flex justify-between"><span>Platform Revenue:</span><span className="font-bold text-blue-600">ETB {stats.platform_revenue.toLocaleString()}</span></div><div className="flex justify-between"><span>Charity Fund:</span><span className="font-bold text-pink-600">ETB {Math.floor(stats.charity_total).toLocaleString()}</span></div></div></div>
              <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">🎯 Admin's Personal Stats (20% Commission)</h3><div className="grid grid-cols-3 gap-3 text-center"><div><p className="text-2xl font-bold text-red-600">{myStats.total_pools}</p><p className="text-xs">Total Pools</p></div><div><p className="text-2xl font-bold text-green-600">{myStats.active_pools}</p><p className="text-xs">Active</p></div><div><p className="text-2xl font-bold text-yellow-600">ETB {myStats.total_commission.toLocaleString()}</p><p className="text-xs">Earned</p></div></div></div>
            </div>
            <div className="grid lg:grid-cols-2 gap-6"><div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-3">🔄 Recent Platform Activity</h3><div className="space-y-2">{allPools.slice(0, 5).map(p => <div key={p.id} className="flex justify-between border-b pb-2"><span>{p.prize_name}</span><span className={`text-xs px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>{p.status}</span></div>)}</div></div><div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-3">👤 New Users</h3><div className="space-y-2">{users.slice(0, 5).map(u => <div key={u.id} className="flex justify-between border-b pb-2"><span>{u.full_name || u.email}</span><span className="text-xs text-gray-500">{u.user_type || 'user'}</span></div>)}</div></div></div>
          </div>
        )}

        {/* ============ MY POOLS TAB (Full CRUD for Admin's Personal Pools) ============ */}
        {activeTab === 'my-pools' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-6">
              <div className="flex justify-between items-center flex-wrap gap-4"><div><h2 className="text-xl font-bold">💰 My Personal Pools (20% Commission)</h2><p className="text-gray-600">Create, manage, and earn 20% commission on your pools</p></div><button onClick={createPool} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">+ Create New Pool</button></div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4"><div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-red-600">{myStats.total_pools}</p><p className="text-xs">Total</p></div><div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-green-600">{myStats.active_pools}</p><p className="text-xs">Active</p></div><div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-yellow-600">{myStats.paused_pools}</p><p className="text-xs">Paused</p></div><div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-blue-600">{myStats.completed_pools}</p><p className="text-xs">Completed</p></div><div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-purple-600">ETB {Math.floor(myStats.total_raised / 1000)}K</p><p className="text-xs">Raised</p></div><div className="bg-white rounded-lg p-3 text-center"><p className="text-2xl font-bold text-amber-600">ETB {myStats.total_commission.toLocaleString()}</p><p className="text-xs">Commission</p></div></div>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Prize</th><th className="px-4 py-3 text-left">Target</th><th className="px-4 py-3 text-left">Raised</th><th className="px-4 py-3 text-left">Your 20%</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Actions</th></tr></thead><tbody>{myPools.map(pool => { const commission = pool.target_amount * 0.20; return (<tr key={pool.id} className="border-b hover:bg-gray-50"><td className="px-4 py-3 font-medium">{pool.prize_name}</td><td className="px-4 py-3">ETB {pool.target_amount?.toLocaleString()}</td><td className="px-4 py-3">ETB {pool.current_amount?.toLocaleString()}</td><td className="px-4 py-3 font-semibold text-green-600">ETB {commission?.toLocaleString()}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' && !pool.is_paused ? 'bg-green-100 text-green-800' : pool.is_paused ? 'bg-yellow-100 text-yellow-800' : pool.status === 'completed' ? 'bg-blue-100' : 'bg-gray-100'}`}>{pool.is_paused ? 'Paused' : pool.status}</span></td><td className="px-4 py-3"><div className="flex gap-2 flex-wrap"><Link href={`/pools/${pool.id}`} className="text-blue-600 text-sm">View</Link><button onClick={() => togglePausePool(pool.id, pool.is_paused)} className={`text-sm ${pool.is_paused ? 'text-green-600' : 'text-yellow-600'}`}>{pool.is_paused ? 'Resume' : 'Pause'}</button><button onClick={() => viewPoolContributors(pool.id)} className="text-purple-600 text-sm">Contributors</button>{pool.status === 'completed' && !pool.prize_delivered && <button onClick={() => markPrizeDelivered(pool.id)} className="text-green-600 text-sm">Mark Delivered</button>}<button onClick={() => deletePool(pool.id)} className="text-red-600 text-sm">Delete</button></div></td></tr>)}))}</tbody></table></div>
            </div>
          </div>
        )}

        {/* ============ ALL PLATFORM POOLS TAB ============ */}
        {activeTab === 'platform-pools' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="font-bold">🌊 All Platform Pools</h2></div>
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3">Prize</th><th className="px-4 py-3">Created By</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{allPools.map(pool => (<tr key={pool.id} className="border-b"><td className="px-4 py-3">{pool.prize_name}</td><td className="px-4 py-3">{pool.profiles?.full_name || 'Admin'}</td><td className="px-4 py-3">ETB {pool.target_amount?.toLocaleString()}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>{pool.status}</span></td><td className="px-4 py-3"><Link href={`/pools/${pool.id}`} className="text-red-600 text-sm">Manage →</Link></td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* ============ APPROVALS TAB ============ */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            {/* Pending Agents */}
            <div className="bg-white rounded-xl shadow-md"><div className="px-6 py-3 bg-yellow-50 border-b"><h3 className="font-bold">🤝 Pending Agents ({pendingAgents.length})</h3></div><div className="p-4 space-y-2">{pendingAgents.map(a => (<div key={a.id} className="flex justify-between items-center border-b pb-2"><div><p className="font-medium">{a.business_name}</p><p className="text-sm text-gray-500">{a.email}</p></div><div><button onClick={() => verifyAgent(a.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm mr-2">Approve</button><button onClick={() => verifyAgent(a.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button></div></div>))}</div></div>
            {/* Pending Vendors */}
            <div className="bg-white rounded-xl shadow-md"><div className="px-6 py-3 bg-purple-50 border-b"><h3 className="font-bold">🏭 Pending Vendors ({pendingVendors.length})</h3></div><div className="p-4 space-y-2">{pendingVendors.map(v => (<div key={v.id} className="flex justify-between items-center border-b pb-2"><div><p className="font-medium">{v.business_name}</p><p className="text-sm text-gray-500">{v.email}</p></div><div><button onClick={() => verifyVendor(v.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm mr-2">Approve</button><button onClick={() => verifyVendor(v.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button></div></div>))}</div></div>
            {/* Withdrawal Requests */}
            <div className="bg-white rounded-xl shadow-md"><div className="px-6 py-3 bg-blue-50 border-b"><h3 className="font-bold">💰 Withdrawal Requests ({withdrawalRequests.length})</h3></div><div className="p-4 space-y-2">{withdrawalRequests.map(w => (<div key={w.id} className="flex justify-between items-center border-b pb-2"><div><p className="font-medium">{w.profiles?.full_name}</p><p className="text-sm">Amount: <span className="font-bold text-green-600">ETB {w.amount?.toLocaleString()}</span></p><p className="text-xs text-gray-500">Type: {w.commission_type}</p></div><div><button onClick={() => processWithdrawal(w.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm mr-2">Approve</button><button onClick={() => { const reason = prompt('Rejection reason:'); if (reason) processWithdrawal(w.id, false, reason); }} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button></div></div>))}</div></div>
          </div>
        )}

        {/* ============ USERS TAB ============ */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{users.map(u => (<tr key={u.id} className="border-b"><td className="px-4 py-3">{u.full_name}</td><td className="px-4 py-3">{u.email}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-red-100' : 'bg-gray-100'}`}>{u.role || 'user'}</span></td><td className="px-4 py-3">{u.user_type || 'individual'}</td><td className="px-4 py-3">{u.role !== 'admin' && <select onChange={(e) => updateUserRole(u.id, e.target.value)} className="border rounded px-2 py-1 text-sm"><option value="user">User</option><option value="agent">Agent</option><option value="vendor">Vendor</option><option value="organization">Organization</option></select>}</td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* ============ FEATURED TAB ============ */}
        {activeTab === 'featured' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-yellow-50 border-b"><h2 className="font-bold">⭐ Manage Featured Listings</h2></div>
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3">Prize</th><th className="px-4 py-3">Created By</th><th className="px-4 py-3">Featured</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{allPools.map(pool => (<tr key={pool.id} className="border-b"><td className="px-4 py-3">{pool.prize_name}</td><td className="px-4 py-3">{pool.profiles?.full_name}</td><td className="px-4 py-3">{pool.is_featured ? '⭐ Featured' : 'Not featured'}</td><td className="px-4 py-3"><button onClick={() => toggleFeaturedPool(pool.id, pool.is_featured)} className={`px-3 py-1 rounded text-sm ${pool.is_featured ? 'bg-gray-300' : 'bg-yellow-500 text-white'}`}>{pool.is_featured ? 'Remove' : 'Feature'}</button></td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* ============ FINANCE TAB ============ */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4"><div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-gray-500">Platform Revenue</h3><p className="text-3xl font-bold text-green-600">ETB {stats.platform_revenue.toLocaleString()}</p></div><div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-gray-500">Total Commission Paid</h3><p className="text-3xl font-bold text-yellow-600">ETB {stats.total_commission_paid.toLocaleString()}</p></div><div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold text-gray-500">Pending Payouts</h3><p className="text-3xl font-bold text-orange-600">ETB {stats.pending_commission.toLocaleString()}</p></div></div>
            <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">🏦 Bank Accounts</h3><button onClick={() => setShowBankModal(true)} className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">+ Add Bank Account</button><div className="space-y-2">{bankAccounts.map(acc => (<div key={acc.id} className="border rounded-lg p-3"><p className="font-semibold">{acc.bank_name}</p><p className="text-sm">{acc.account_name}</p><p className="text-sm font-mono">{acc.account_number}</p><p className="text-xs text-gray-500">{acc.account_type}</p></div>))}</div></div>
          </div>
        )}

        {/* ============ CHARITY TAB ============ */}
        {activeTab === 'charity' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-6 text-white"><div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold">💚 2% for Health</h2><p>Supporting kidney & heart disease treatment in Ethiopia</p></div><div className="text-right"><p className="text-3xl font-bold">ETB {Math.floor(stats.charity_total).toLocaleString()}</p><p className="text-sm">Total Raised</p></div></div></div>
            <div className="grid md:grid-cols-2 gap-6"><div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">💚 Impact Stats</h3><div className="space-y-3"><div className="flex justify-between"><span>Lives Impacted:</span><span className="font-bold text-red-600">{stats.lives_impacted}</span></div><div className="flex justify-between"><span>Monthly Average:</span><span className="font-bold">ETB {Math.floor(stats.charity_total / 3).toLocaleString()}</span></div></div><button onClick={() => setShowCharityTransferModal(true)} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Record Charity Transfer</button></div><div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">🏦 Direct Donation</h3><div className="bg-green-50 rounded-lg p-4"><p className="font-semibold">Commercial Bank of Ethiopia</p><p className="text-sm">Abbaa Carraa Health Foundation</p><p className="text-sm font-mono">Account: 1000XXXXXX</p><p className="text-xs">Reference: "Health Support"</p></div></div></div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden"><div className="px-6 py-3 border-b"><h3 className="font-bold">📋 Charity Transfers</h3></div><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Reference</th><th className="px-4 py-2">Status</th></tr></thead><tbody>{charityTransfers.map(t => (<tr key={t.id} className="border-b"><td className="px-4 py-2">{new Date(t.transfer_date).toLocaleDateString()}</td><td className="px-4 py-2 font-bold text-green-600">ETB {t.amount?.toLocaleString()}</td><td className="px-4 py-2">{t.bank_reference}</td><td className="px-4 py-2 capitalize">{t.status}</td></tr>))}</tbody></table></div></div>
          </div>
        )}

        {/* ============ SETTINGS TAB ============ */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">⚙️ Platform Settings</h3><div className="space-y-4">{Object.entries(platformSettings).map(([key, value]) => (<div key={key} className="flex justify-between items-center border-b pb-3"><div><p className="font-medium">{key.replace(/_/g, ' ').toUpperCase()}</p><p className="text-sm text-gray-500">{typeof value === 'object' ? JSON.stringify(value) : value}</p></div><button onClick={() => { const newValue = prompt(`Enter new value for ${key}:`, typeof value === 'object' ? JSON.stringify(value) : value); if (newValue) updatePlatformSettings(key, isNaN(newValue) ? newValue : parseFloat(newValue)); }} className="text-blue-600 text-sm">Edit</button></div>))}</div></div>
            <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">🏦 Bank Accounts</h3><button onClick={() => setShowBankModal(true)} className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg">+ Add Bank Account</button><div className="space-y-2">{bankAccounts.map(acc => (<div key={acc.id} className="flex justify-between items-center border rounded-lg p-3"><div><p className="font-semibold">{acc.bank_name}</p><p className="text-sm">{acc.account_name}</p><p className="text-xs font-mono">{acc.account_number}</p></div><span className={`text-xs px-2 py-1 rounded ${acc.account_type === 'platform' ? 'bg-blue-100' : acc.account_type === 'charity' ? 'bg-pink-100' : 'bg-green-100'}`}>{acc.account_type}</span></div>))}</div></div>
          </div>
        )}

        {/* ============ COMMUNICATIONS TAB ============ */}
        {activeTab === 'communications' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-6 text-white"><div className="flex justify-between items-center"><div><h2 className="text-xl font-bold">📢 Communications</h2><p>Manage announcements, email, and SMS templates</p></div><button onClick={() => setShowAnnouncementModal(true)} className="bg-white text-blue-600 px-4 py-2 rounded-lg">+ New Announcement</button></div></div>
            <div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-4">📢 Recent Announcements</h3><div className="space-y-3">{announcements.map(a => (<div key={a.id} className="border-b pb-3"><h4 className="font-semibold">{a.title}</h4><p className="text-sm text-gray-600">{a.content}</p><p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</p></div>))}</div></div>
            <div className="grid md:grid-cols-2 gap-6"><div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-3">📧 Email Templates</h3><div className="space-y-2">{emailTemplates.map(t => (<div key={t.id} className="border-b pb-2"><p className="font-medium">{t.template_key}</p><p className="text-sm text-gray-500">{t.subject}</p></div>))}</div></div><div className="bg-white rounded-xl shadow-md p-6"><h3 className="font-bold mb-3">📱 SMS Templates</h3><div className="space-y-2">{smsTemplates.map(t => (<div key={t.id} className="border-b pb-2"><p className="font-medium">{t.template_key}</p><p className="text-sm text-gray-500">{t.message.substring(0, 50)}...</p></div>))}</div></div>
          </div>
          </div>
        )}

        {/* ============ DISPUTES TAB ============ */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white"><h2 className="text-xl font-bold">⚖️ Dispute Resolution</h2></div>
            {disputes.length === 0 ? <div className="bg-white rounded-xl p-12 text-center"><p className="text-gray-400">✅ No pending disputes</p></div> : disputes.map(d => (<div key={d.id} className="bg-white rounded-xl shadow-md p-6"><div className="flex justify-between flex-wrap gap-4"><div><h3 className="font-bold">Pool: {d.pool?.prize_name}</h3><p className="text-sm text-gray-500">Filed by: {d.user?.full_name}</p><p className="text-sm text-gray-500">Type: {d.dispute_type}</p><p className="mt-2">{d.description}</p></div><div><button onClick={() => resolveDispute(d.id, 'Resolved by admin')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm mr-2">Resolve</button><button className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm">Mediate</button></div></div></div>))}
          </div>
        )}

        {/* ============ LOGS TAB ============ */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="font-bold">📋 System Activity Logs</h2></div>
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-2">Time</th><th className="px-4 py-2">User</th><th className="px-4 py-2">Action</th><th className="px-4 py-2">Entity</th></tr></thead><tbody>{systemLogs.map(log => (<tr key={log.id} className="border-b"><td className="px-4 py-2 text-sm">{new Date(log.created_at).toLocaleString()}</td><td className="px-4 py-2">{log.profiles?.full_name || 'System'}</td><td className="px-4 py-2">{log.action}</td><td className="px-4 py-2 text-sm text-gray-500">{log.entity_type}</td></tr>))}</tbody></table></div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAnnouncementModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-2xl max-w-lg w-full p-6"><div className="flex justify-between mb-4"><h3 className="text-xl font-bold">Create Announcement</h3><button onClick={() => setShowAnnouncementModal(false)}>✕</button></div><div className="space-y-4"><input type="text" placeholder="Title" className="w-full border rounded-lg p-2" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} /><textarea placeholder="Content" rows="4" className="w-full border rounded-lg p-2" value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}></textarea><button onClick={createAnnouncement} className="w-full bg-blue-600 text-white py-2 rounded-lg">Publish</button></div></div></div>)}

      {showBankModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-2xl max-w-md w-full p-6"><div className="flex justify-between mb-4"><h3 className="text-xl font-bold">Add Bank Account</h3><button onClick={() => setShowBankModal(false)}>✕</button></div><div className="space-y-3"><select className="w-full border rounded-lg p-2" value={newBankAccount.account_type} onChange={(e) => setNewBankAccount({...newBankAccount, account_type: e.target.value})}><option value="platform">Platform</option><option value="charity">Charity</option><option value="commission">Commission</option></select><input type="text" placeholder="Bank Name" className="w-full border rounded-lg p-2" value={newBankAccount.bank_name} onChange={(e) => setNewBankAccount({...newBankAccount, bank_name: e.target.value})} /><input type="text" placeholder="Account Name" className="w-full border rounded-lg p-2" value={newBankAccount.account_name} onChange={(e) => setNewBankAccount({...newBankAccount, account_name: e.target.value})} /><input type="text" placeholder="Account Number" className="w-full border rounded-lg p-2" value={newBankAccount.account_number} onChange={(e) => setNewBankAccount({...newBankAccount, account_number: e.target.value})} /><button onClick={addBankAccount} className="w-full bg-blue-600 text-white py-2 rounded-lg">Add Account</button></div></div></div>)}

      {showCharityTransferModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-2xl max-w-md w-full p-6"><div className="flex justify-between mb-4"><h3 className="text-xl font-bold">Record Charity Transfer</h3><button onClick={() => setShowCharityTransferModal(false)}>✕</button></div><div className="space-y-3"><input type="number" placeholder="Amount (ETB)" className="w-full border rounded-lg p-2" value={charityTransfer.amount} onChange={(e) => setCharityTransfer({...charityTransfer, amount: e.target.value})} /><input type="text" placeholder="Bank Reference" className="w-full border rounded-lg p-2" value={charityTransfer.bank_reference} onChange={(e) => setCharityTransfer({...charityTransfer, bank_reference: e.target.value})} /><textarea placeholder="Notes (optional)" className="w-full border rounded-lg p-2" rows="2" value={charityTransfer.notes} onChange={(e) => setCharityTransfer({...charityTransfer, notes: e.target.value})}></textarea><button onClick={transferCharityFund} className="w-full bg-green-600 text-white py-2 rounded-lg">Record Transfer</button></div></div></div>)}

      {showPoolModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"><div className="flex justify-between mb-4"><h3 className="text-xl font-bold">Pool Contributors</h3><button onClick={() => setShowPoolModal(false)}>✕</button></div><div className="space-y-2">{poolContributors.map(c => (<div key={c.id} className="border rounded-lg p-3"><p className="font-medium">{c.profiles?.full_name}</p><p className="text-sm">Amount: ETB {c.amount?.toLocaleString()}</p><p className="text-xs text-gray-500">{c.profiles?.phone || c.profiles?.email}</p></div>))}</div></div></div>)}
    </div>
  );
}
