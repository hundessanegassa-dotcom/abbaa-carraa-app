import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import BackButton from '../../components/BackButton';
import CreateCityVipModal from '../../components/admin/CreateCityVipModal';
import EditCityVipModal from '../../components/admin/EditCityVipModal';
import CreateRegularPoolModal from '../../components/admin/CreateRegularPoolModal';

export async function getServerSideProps() {
  return { props: {} };
}

export default function AdminDashboard() {
  const router = useRouter();
  const isMounted = useRef(true);
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
  
  // Merkato VIP Stats
  const [merkatoStats, setMerkatoStats] = useState({
    total_participants: 0,
    daily_participants: 0,
    weekly_participants: 0,
    monthly_participants: 0,
    total_collected: 0,
    total_paid_out: 0,
    pending_draws: 0,
    pending_verification: 0
  });
  
  // City VIP Stats
  const [cityVipPools, setCityVipPools] = useState([]);
  const [cityVipParticipants, setCityVipParticipants] = useState([]);
  const [selectedCityFilter, setSelectedCityFilter] = useState('all');
  const [cityVipWinners, setCityVipWinners] = useState([]);
  const [drawingCityWinner, setDrawingCityWinner] = useState(false);
  const [showCityDrawModal, setShowCityDrawModal] = useState(false);
  const [selectedCityPool, setSelectedCityPool] = useState(null);
  const [cityVipConfigs, setCityVipConfigs] = useState([]);
  
  // City VIP Modal States
  const [showCreateCityModal, setShowCreateCityModal] = useState(false);
  const [showEditCityModal, setShowEditCityModal] = useState(false);
  const [selectedCityForEdit, setSelectedCityForEdit] = useState(null);
  
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
  
  // Bank Transfers
  const [bankTransfers, setBankTransfers] = useState([]);
  const [pendingBankTransfers, setPendingBankTransfers] = useState(0);
  
  // Management data
  const [users, setUsers] = useState([]);
  const [allPools, setAllPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [charityTransactions, setCharityTransactions] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Merkato VIP specific state
  const [merkatoPools, setMerkatoPools] = useState([]);
  const [merkatoParticipants, setMerkatoParticipants] = useState([]);
  const [merkatoWinners, setMerkatoWinners] = useState([]);
  const [showMerkatoModal, setShowMerkatoModal] = useState(false);
  const [newMerkatoPool, setNewMerkatoPool] = useState({
    tier: 'daily',
    contribution_amount: 500,
    prize_amount: 1000000,
    draw_time: '20:00'
  });
  
  // Edit Merkato Pool State
  const [editingMerkatoPool, setEditingMerkatoPool] = useState(null);
  const [showEditMerkatoModal, setShowEditMerkatoModal] = useState(false);
  const [editMerkatoData, setEditMerkatoData] = useState({
    id: '',
    tier: '',
    name: '',
    contribution_amount: 0,
    prize_amount: 0,
    draw_time: '',
    status: ''
  });
  
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

  const tierConfig = {
    daily: { name: 'Daily Millionaire', contribution: 500, prize: 1000000, frequency: 'daily', winnerCount: 1, icon: '⭐', slogan: 'Make ONE participant a MILLIONAIRE Today!' },
    weekly: { name: 'Weekly Mega Winner', contribution: 2500, prize: 10000000, frequency: 'weekly', winnerCount: 1, icon: '🏆', slogan: 'Make ONE participant a MILLIONAIRE This Week!' },
    monthly: { name: 'Monthly Legend', contribution: 5000, prize: 40000000, frequency: 'monthly', winnerCount: 1, icon: '👑', slogan: 'Make ONE participant a MILLIONAIRE This Month!' }
  };

  // Helper function for date calculations
  const getNextSunday = () => {
    const today = new Date();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (7 - today.getDay()) % 7);
    return nextSunday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getNextMonthEnd = () => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      
      if (!isMounted.current) return;
      setUser(user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!isMounted.current) return;
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
      await loadMerkatoData();
      await loadCityVipData();
      await loadCityVipWinners();
      await loadCityVipConfigs();
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/login');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  async function loadCityVipConfigs() {
    try {
      const { data: configs, error } = await supabase
        .from('city_vip_config')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && configs) {
        setCityVipConfigs(configs);
      }
    } catch (error) {
      console.error('Error loading city VIP configs:', error);
    }
  }

  async function loadCityVipData() {
    try {
      // Load City VIP participants from city_vip_participants table
      const { data: participants, error: participantsError } = await supabase
        .from('city_vip_participants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!participantsError && participants) {
        setCityVipParticipants(participants);
      }
      
      // Get unique cities from participants
      const uniqueCities = [...new Set(participants?.map(p => p.city).filter(Boolean))];
      
      // Create city pools summary
      const cityPools = uniqueCities.map(city => ({
        id: `city-${city}`,
        city: city,
        name: `${city} VIP`,
        total_participants: participants?.filter(p => p.city === city).length || 0,
        total_collected: participants?.filter(p => p.city === city).reduce((sum, p) => sum + (p.contribution_amount || 0), 0) || 0,
        pending_verification: participants?.filter(p => p.city === city && p.payment_status === 'pending_verification').length || 0,
        verified_participants: participants?.filter(p => p.city === city && p.payment_status === 'verified').length || 0,
        active: true
      }));
      
      setCityVipPools(cityPools);
      
    } catch (error) {
      console.error('Error loading City VIP data:', error);
    }
  }

  async function loadCityVipWinners() {
    try {
      const { data: winners, error } = await supabase
        .from('merkato_vip_draws')
        .select('*')
        .eq('pool_type', 'city')
        .order('drawn_at', { ascending: false })
        .limit(20);
      
      if (!error && winners) {
        setCityVipWinners(winners);
      }
    } catch (error) {
      console.error('Error loading city winners:', error);
    }
  }

  async function drawCityVipWinner(cityName, poolType) {
    if (!confirm(`Draw winner for ${cityName} VIP ${poolType} pool? This action cannot be undone.`)) return;
    
    setDrawingCityWinner(true);
    
    try {
      // Get all verified participants for this city and pool type
      const { data: participants, error: participantError } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('city', cityName)
        .eq('pool_type', poolType)
        .eq('payment_status', 'verified')
        .neq('is_winner', true);
      
      if (participantError) throw participantError;
      
      if (!participants || participants.length === 0) {
        toast.error(`No verified participants in ${cityName} VIP ${poolType} pool`);
        setDrawingCityWinner(false);
        return;
      }
      
      // Random selection
      const randomIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[randomIndex];
      
      // Determine prize amount based on pool type
      const prizeAmount = poolType === 'daily' ? 1000000 : poolType === 'weekly' ? 10000000 : 40000000;
      
      // Update participant as winner
      const { error: updateError } = await supabase
        .from('city_vip_participants')
        .update({
          is_winner: true,
          winner_drawn_at: new Date().toISOString(),
          status: 'winner'
        })
        .eq('id', winner.id);
      
      if (updateError) throw updateError;
      
      // Record draw history
      const { error: historyError } = await supabase
        .from('merkato_vip_draws')
        .insert({
          pool_id: `city-${cityName}-${poolType}`,
          pool_type: 'city',
          city: cityName,
          drawn_at: new Date().toISOString(),
          winner_id: winner.user_id,
          winner_email: winner.user_email,
          winner_name: winner.user_name,
          prize_amount: prizeAmount,
          ticket_number: winner.ticket_number,
          random_seed: Math.random().toString(),
          verification_hash: btoa(`${cityName}-${winner.user_id}-${Date.now()}`),
          drawn_by: user?.id
        });
      
      if (historyError) throw historyError;
      
      // Send notification to winner
      await supabase
        .from('notifications')
        .insert({
          user_id: winner.user_id,
          title: '🎉 Congratulations! You Won!',
          message: `You have won ${prizeAmount.toLocaleString()} ETB in the ${cityName} City VIP ${poolType} pool!`,
          type: 'winner',
          link_url: `/dashboard`,
          created_at: new Date().toISOString()
        });
      
      toast.success(`🎉 Winner drawn for ${cityName} ${poolType}! ${winner.user_name || winner.user_email} wins ${prizeAmount.toLocaleString()} ETB!`);
      
      // Refresh data
      await loadCityVipData();
      await loadCityVipWinners();
      
      // Show winner details
      setSelectedCityPool({
        city: cityName,
        poolType: poolType,
        winner: winner,
        prize: prizeAmount
      });
      setShowCityDrawModal(true);
      
    } catch (error) {
      console.error('Draw error:', error);
      toast.error('Failed to draw winner');
    } finally {
      setDrawingCityWinner(false);
    }
  }

  async function verifyCityVipPayment(participantId, approved) {
    if (!confirm(approved ? 'Approve this payment?' : 'Reject this payment?')) return;
    
    try {
      const { error } = await supabase
        .from('city_vip_participants')
        .update({
          payment_status: approved ? 'verified' : 'rejected',
          verified_at: approved ? new Date().toISOString() : null,
          verified_by: user?.id,
          status: approved ? 'active' : 'cancelled'
        })
        .eq('id', participantId);
      
      if (error) throw error;
      
      toast.success(`Payment ${approved ? 'approved' : 'rejected'} successfully`);
      await loadCityVipData();
      await loadMerkatoData();
      
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify payment');
    }
  }

  async function loadMerkatoData() {
    if (!isMounted.current) return;
    
    const { data: pools } = await supabase
      .from('merkato_vip_pools')
      .select('*')
      .order('created_at', { ascending: false });
    if (!isMounted.current) return;
    setMerkatoPools(pools || []);
    
    const { data: participants } = await supabase
      .from('merkato_vip_participants')
      .select('*')
      .order('created_at', { ascending: false });
    if (!isMounted.current) return;
    setMerkatoParticipants(participants || []);
    
    const { data: winners } = await supabase
      .from('merkato_vip_pools')
      .select('*')
      .eq('status', 'completed')
      .not('winner_id', 'is', null);
    if (!isMounted.current) return;
    setMerkatoWinners(winners || []);
    
    const dailyParticipants = participants?.filter(p => p.pool_type === 'daily' && p.payment_status === 'verified')?.length || 0;
    const weeklyParticipants = participants?.filter(p => p.pool_type === 'weekly' && p.payment_status === 'verified')?.length || 0;
    const monthlyParticipants = participants?.filter(p => p.pool_type === 'monthly' && p.payment_status === 'verified')?.length || 0;
    const totalCollected = (participants?.filter(p => p.payment_status === 'verified').reduce((sum, p) => sum + (p.contribution_amount || 0), 0)) || 0;
    const totalPaidOut = winners?.reduce((sum, w) => sum + (w.prize_amount || 0), 0) || 0;
    const pendingDraws = pools?.filter(p => p.status === 'active' && new Date(p.draw_time) <= new Date())?.length || 0;
    const pendingVerification = participants?.filter(p => p.payment_status === 'pending_verification')?.length || 0;
    
    if (!isMounted.current) return;
    setMerkatoStats({
      total_participants: participants?.length || 0,
      daily_participants: dailyParticipants,
      weekly_participants: weeklyParticipants,
      monthly_participants: monthlyParticipants,
      total_collected: totalCollected,
      total_paid_out: totalPaidOut,
      pending_draws: pendingDraws,
      pending_verification: pendingVerification
    });
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
      loadDisputes(),
      loadBankTransfers()
    ]);
  }

  async function loadRecentActivity() {
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
        icon: '👤'
      });
    });
    (recentPools || []).forEach(p => {
      activities.push({
        action: `New pool created: "${p.prize_name}" (${p.status})`,
        date: p.created_at,
        icon: '🏊'
      });
    });
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (isMounted.current) setRecentActivity(activities.slice(0, 5));
  }

  async function loadStats() {
    const results = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('pools').select('*'),
      supabase.from('contributions').select('amount, status'),
      supabase.from('commissions').select('amount, status')
    ]);
    
    const pools = results[4]?.data || [];
    const contributions = results[5]?.data || [];
    const commissions = results[6]?.data || [];
    
    const total_pools = pools?.length || 0;
    const active_pools = pools?.filter(p => p.status === 'active')?.length || 0;
    const completed_pools = pools?.filter(p => p.status === 'completed')?.length || 0;
    const pending_pools = pools?.filter(p => p.status === 'pending')?.length || 0;
    const total_volume = contributions?.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const total_commission_paid = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0;
    const pending_commission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;
    const platform_revenue = total_volume * 0.10;
    const charity_total = total_volume * 0.02;
    
    if (!isMounted.current) return;
    setStats({
      total_users: results[0]?.count || 0,
      total_agents: results[1]?.count || 0,
      total_vendors: results[2]?.count || 0,
      total_organizations: results[3]?.count || 0,
      total_pools,
      active_pools,
      completed_pools,
      pending_pools,
      total_volume,
      total_commission_paid,
      pending_commission,
      charity_total,
      lives_impacted: Math.floor(charity_total / 100),
      platform_revenue
    });
  }

  async function loadMyPools() {
    const { data: pools } = await supabase
      .from('pools')
      .select('*')
      .eq('created_by', user?.id)
      .order('created_at', { ascending: false });
    if (!isMounted.current) return;
    setMyPools(pools || []);
    
    const totalRaised = pools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
    const { data: commissions } = await supabase
      .from('commissions')
      .select('amount, status')
      .eq('user_id', user?.id);
    const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const pendingCommission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;
    
    if (!isMounted.current) return;
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
    const results = await Promise.all([
      supabase.from('agents').select('*, profiles!user_id(full_name, email)').eq('verified', false),
      supabase.from('vendors').select('*, profiles!user_id(full_name, email)').eq('verified', false),
      supabase.from('organizations').select('*, profiles!user_id(full_name, email)').eq('verified', false)
    ]);
    if (!isMounted.current) return;
    setPendingAgents(results[0]?.data || []);
    setPendingVendors(results[1]?.data || []);
    setPendingOrganizations(results[2]?.data || []);
  }

  async function loadWithdrawalRequests() {
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*, profiles(full_name, email)')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });
    if (isMounted.current) setWithdrawalRequests(data || []);
  }

  async function loadBankTransfers() {
    const { data } = await supabase
      .from('bank_transfers')
      .select(`
        *,
        profiles!user_id (id, full_name, email, phone),
        pools!pool_id (prize_name, target_amount)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (isMounted.current) {
      setBankTransfers(data || []);
      setPendingBankTransfers(data?.length || 0);
    }
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (isMounted.current) setUsers(data || []);
  }

  async function loadAllPools() {
    const { data } = await supabase
      .from('pools')
      .select('*, profiles!created_by(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (isMounted.current) setAllPools(data || []);
  }

  async function loadFeaturedPools() {
    const { data } = await supabase
      .from('pools')
      .select('*')
      .eq('is_featured', true)
      .eq('status', 'active');
    if (isMounted.current) setFeaturedPools(data || []);
  }

  async function loadCharityData() {
    const { data } = await supabase
      .from('charity_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (isMounted.current) setCharityTransactions(data || []);
  }

  async function loadDisputes() {
    const { data } = await supabase
      .from('disputes')
      .select('*, pool:pools(prize_name), user:profiles(full_name)')
      .eq('status', 'pending');
    if (isMounted.current) setDisputes(data || []);
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

  // Merkato VIP Pool Management
  async function createMerkatoPool() {
    if (!newMerkatoPool.tier) {
      toast.error('Please select a tier');
      return;
    }
    
    const config = tierConfig[newMerkatoPool.tier];
    setLoading(true);
    
    try {
      let drawDate = new Date();
      if (newMerkatoPool.tier === 'daily') {
        drawDate.setDate(drawDate.getDate() + 1);
      } else if (newMerkatoPool.tier === 'weekly') {
        drawDate.setDate(drawDate.getDate() + (7 - drawDate.getDay()));
      } else {
        drawDate.setMonth(drawDate.getMonth() + 1);
        drawDate.setDate(1);
      }
      
      const [hours, minutes] = newMerkatoPool.draw_time.split(':');
      drawDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const { data, error } = await supabase
        .from('merkato_vip_pools')
        .insert({
          tier: newMerkatoPool.tier,
          name: config.name,
          contribution_amount: config.contribution,
          prize_amount: config.prize,
          winner_count: config.winnerCount,
          draw_time: drawDate.toISOString(),
          draw_frequency: newMerkatoPool.tier,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success(`${config.name} pool created successfully!`);
      setShowMerkatoModal(false);
      setNewMerkatoPool({ tier: 'daily', contribution_amount: 500, prize_amount: 1000000, draw_time: '20:00' });
      await loadMerkatoData();
    } catch (error) {
      console.error('Create Merkato pool error:', error);
      toast.error('Failed to create pool: ' + error.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  // Update Merkato Pool
  async function updateMerkatoPool() {
    if (!editMerkatoData.id) {
      toast.error('No pool selected');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('merkato_vip_pools')
        .update({
          contribution_amount: editMerkatoData.contribution_amount,
          prize_amount: editMerkatoData.prize_amount,
          draw_time: editMerkatoData.draw_time,
          name: editMerkatoData.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', editMerkatoData.id);

      if (error) throw error;

      toast.success('Merkato pool updated successfully!');
      setShowEditMerkatoModal(false);
      setEditingMerkatoPool(null);
      await loadMerkatoData();
    } catch (error) {
      console.error('Update Merkato pool error:', error);
      toast.error('Failed to update pool: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Open edit modal
  function openEditMerkatoModal(pool) {
    setEditMerkatoData({
      id: pool.id,
      tier: pool.tier,
      name: pool.name,
      contribution_amount: pool.contribution_amount,
      prize_amount: pool.prize_amount,
      draw_time: pool.draw_time ? new Date(pool.draw_time).toISOString().slice(0, 16) : '',
      status: pool.status
    });
    setEditingMerkatoPool(pool);
    setShowEditMerkatoModal(true);
  }

  // Bank Transfer verification
  async function verifyBankTransfer(transferId, userId, poolId, amount, seatNumbers, approved) {
    if (!confirm(approved ? 'Approve this payment and confirm seats?' : 'Reject this payment?')) return;
    try {
      if (approved) {
        await supabase
          .from('bank_transfers')
          .update({ status: 'verified', verified_at: new Date().toISOString(), verified_by: user?.id })
          .eq('id', transferId);

        if (seatNumbers && seatNumbers.length > 0) {
          await supabase
            .from('pool_seats')
            .update({ status: 'taken', user_id: userId })
            .in('seat_number', seatNumbers)
            .eq('pool_id', poolId);
        }

        await supabase
          .from('contributions')
          .insert({
            user_id: userId,
            pool_id: poolId,
            amount: amount,
            status: 'completed',
            payment_method: 'bank_transfer',
            seat_numbers: seatNumbers,
            created_at: new Date().toISOString()
          });

        const { data: pool } = await supabase
          .from('pools')
          .select('current_amount')
          .eq('id', poolId)
          .single();
          
        await supabase
          .from('pools')
          .update({ current_amount: (pool?.current_amount || 0) + amount })
          .eq('id', poolId);

        toast.success('Payment approved! Seats confirmed.');
      } else {
        await supabase
          .from('bank_transfers')
          .update({ status: 'rejected', rejected_at: new Date().toISOString() })
          .eq('id', transferId);

        if (seatNumbers && seatNumbers.length > 0) {
          await supabase
            .from('pool_seats')
            .update({ status: 'available', user_id: null })
            .in('seat_number', seatNumbers)
            .eq('pool_id', poolId);
        }

        toast.success('Payment rejected. Seats released.');
      }
      
      await loadBankTransfers();
      await loadStats();
    } catch (error) {
      toast.error('Failed to process');
    }
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
    
    const { error } = await supabase.storage
      .from('pool-images')
      .upload(filePath, file);
    
    if (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed.');
      setUploading(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('pool-images')
      .getPublicUrl(filePath);
    
    if (isMounted.current) {
      setNewPool({ ...newPool, image_url: publicUrl });
      setUploading(false);
    }
    toast.success('Image uploaded');
  }

  async function createAdminPool() {
    if (!newPool.prize_name || !newPool.target_amount || !newPool.end_date) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    const { error } = await supabase
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
    if (isMounted.current) setLoading(false);
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
            <div className="flex gap-3 flex-wrap">
              <Link href="/admin/draw" className="bg-white text-red-600 px-4 py-2 rounded-full font-semibold text-sm">🎲 Draw Management</Link>
              <button onClick={() => setShowPoolModal(true)} className="bg-white text-red-600 px-4 py-2 rounded-full font-semibold text-sm">+ Create Pool (20%)</button>
              <button onClick={() => setShowMerkatoModal(true)} className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-full font-semibold text-sm">🏪 Create Merkato VIP Pool</button>
              <Link href="/dashboard" className="bg-white/20 px-4 py-2 rounded-full text-sm">Home</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Role Description Card */}
      <div className="container mx-auto px-4 mt-6">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl p-5">
          <h3 className="font-bold text-red-800 text-lg mb-2">👑 Your Role: Platform Administrator</h3>
          <p className="text-red-700 text-sm leading-relaxed">
            As the Platform Administrator, you have full control over Abbaa Carraa. You can manage users, approve applications, 
            monitor all pools, process withdrawals, resolve disputes, verify bank transfers, and manage commissions.
            Additionally, you can create your own personal pools and earn <strong>20% commission</strong> on them.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="container mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-9 gap-3">
          <button onClick={() => setShowPoolModal(true)} className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">➕</div><p className="font-semibold text-xs">Create Pool</p><p className="text-xs opacity-80">20%</p>
          </button>
          <button onClick={() => setShowMerkatoModal(true)} className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">🏪</div><p className="font-semibold text-xs">Merkato VIP</p><p className="text-xs opacity-80">1M/10M/40M</p>
          </button>
          <button onClick={() => setActiveTab('city-vip')} className="bg-gradient-to-r from-gray-600 to-gray-800 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">🏙️</div><p className="font-semibold text-xs">City VIP</p><p className="text-xs opacity-80">Manage</p>
          </button>
          <button onClick={() => setActiveTab('approvals')} className="bg-yellow-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">📝</div><p className="font-semibold text-xs">Approvals</p><p className="text-xs opacity-80">{pendingAgents.length + pendingVendors.length + pendingOrganizations.length}</p>
          </button>
          <button onClick={() => setActiveTab('withdrawals')} className="bg-green-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">💰</div><p className="font-semibold text-xs">Withdrawals</p><p className="text-xs opacity-80">{withdrawalRequests.length}</p>
          </button>
          <button onClick={() => setActiveTab('bank-transfers')} className="bg-blue-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">🏦</div><p className="font-semibold text-xs">Bank Transfers</p><p className="text-xs opacity-80">{pendingBankTransfers}</p>
          </button>
          <button onClick={() => setActiveTab('disputes')} className="bg-orange-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">⚖️</div><p className="font-semibold text-xs">Disputes</p><p className="text-xs opacity-80">{disputes.length}</p>
          </button>
          <button onClick={() => setShowAnnouncementModal(true)} className="bg-purple-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">📢</div><p className="font-semibold text-xs">Announce</p>
          </button>
        </div>
      </div>
<Link href="/admin/verify-payments" className="bg-purple-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
  <div className="text-2xl mb-1">🔍</div>
  <p className="font-semibold text-xs">Verify Payments</p>
  <p className="text-xs opacity-80">Approve/Reject</p>
</Link>

      {/* Tabs */}
      <div className="border-b bg-white sticky top-0 z-10 overflow-x-auto mt-6">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 min-w-max">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-3 font-semibold ${activeTab === 'overview' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>📊 Overview</button>
            <button onClick={() => setActiveTab('my-pools')} className={`px-4 py-3 font-semibold ${activeTab === 'my-pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>🎯 My Pools (20%)</button>
            <button onClick={() => setActiveTab('merkato')} className={`px-4 py-3 font-semibold ${activeTab === 'merkato' ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-gray-500'}`}>🏪 Merkato VIP</button>
            <button onClick={() => setActiveTab('city-vip')} className={`px-4 py-3 font-semibold ${activeTab === 'city-vip' ? 'border-b-2 border-gray-600 text-gray-600' : 'text-gray-500'}`}>🏙️ City VIP</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-3 font-semibold ${activeTab === 'users' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>👥 Users</button>
            <button onClick={() => setActiveTab('pools')} className={`px-4 py-3 font-semibold ${activeTab === 'pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>🌊 All Pools</button>
            <button onClick={() => setActiveTab('approvals')} className={`px-4 py-3 font-semibold ${activeTab === 'approvals' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>📝 Approvals ({pendingAgents.length + pendingVendors.length + pendingOrganizations.length})</button>
            <button onClick={() => setActiveTab('withdrawals')} className={`px-4 py-3 font-semibold ${activeTab === 'withdrawals' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>💰 Withdrawals ({withdrawalRequests.length})</button>
            <button onClick={() => setActiveTab('bank-transfers')} className={`px-4 py-3 font-semibold ${activeTab === 'bank-transfers' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}>🏦 Bank Transfers ({pendingBankTransfers})</button>
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
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-blue-600">{stats.total_users}</p><p className="text-xs text-gray-500">Users</p></div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-yellow-600">{stats.total_agents}</p><p className="text-xs text-gray-500">Agents</p></div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-purple-600">{stats.total_vendors}</p><p className="text-xs text-gray-500">Vendors</p></div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-cyan-600">{stats.total_organizations}</p><p className="text-xs text-gray-500">Orgs</p></div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-green-600">{stats.total_pools}</p><p className="text-xs text-gray-500">Pools</p></div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-emerald-600">{stats.active_pools}</p><p className="text-xs text-gray-500">Active</p></div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm"><p className="text-2xl font-bold text-orange-600">{stats.pending_pools}</p><p className="text-xs text-gray-500">Pending</p></div>
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-3 text-center text-white shadow-sm"><p className="text-2xl font-bold">{stats.lives_impacted}</p><p className="text-xs">Lives Saved</p></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-4">💰 Financial Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-600">Total Volume:</span><span className="font-bold">ETB {stats.total_volume.toLocaleString()}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-600">Platform Revenue (10%):</span><span className="font-bold text-blue-600">ETB {stats.platform_revenue.toLocaleString()}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-600">Commission Paid:</span><span className="font-bold text-yellow-600">ETB {stats.total_commission_paid.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Charity Fund (2%):</span><span className="font-bold text-pink-600">ETB {Math.floor(stats.charity_total).toLocaleString()}</span></div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-4">👑 Admin's Personal Stats (20%)</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-2xl font-bold text-red-600">{myStats.total_pools}</p><p className="text-xs text-gray-500">My Pools</p></div>
                  <div><p className="text-2xl font-bold text-green-600">{myStats.active_pools}</p><p className="text-xs text-gray-500">Active</p></div>
                  <div><p className="text-2xl font-bold text-yellow-600">ETB {myStats.total_commission.toLocaleString()}</p><p className="text-xs text-gray-500">Commission</p></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
                <h3 className="font-bold text-lg mb-4">🏪 Merkato VIP Program</h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div><p className="text-2xl font-bold">{merkatoStats.total_participants}</p><p className="text-xs opacity-90">Participants</p></div>
                  <div><p className="text-2xl font-bold">ETB {(merkatoStats.total_collected / 1000000).toFixed(1)}M</p><p className="text-xs opacity-90">Collected</p></div>
                  <div><p className="text-2xl font-bold">{merkatoStats.pending_verification}</p><p className="text-xs opacity-90">Pending Verify</p></div>
                  <div><p className="text-2xl font-bold">{merkatoStats.pending_draws}</p><p className="text-xs opacity-90">Pending Draws</p></div>
                </div>
                <button onClick={() => setActiveTab('merkato')} className="mt-3 w-full bg-white text-orange-600 py-1 rounded-lg text-sm font-semibold">Manage →</button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-3">📋 Recent Platform Activity</h3>
              <div className="space-y-2">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No recent activity</p>
                ) : (
                  recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 border-b border-gray-100">
                      <span className="text-xl">{activity.icon}</span>
                      <div className="flex-1"><p className="text-sm text-gray-700">{activity.action}</p><p className="text-xs text-gray-400">{new Date(activity.date).toLocaleString()}</p></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Pools Tab - Keep your existing implementation */}
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

        {/* Merkato VIP Tab - Keep your existing implementation */}
        {activeTab === 'merkato' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl p-4 text-white text-center"><p className="text-2xl font-bold">{merkatoStats.total_participants}</p><p className="text-sm opacity-90">Total Participants</p></div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 text-white text-center"><p className="text-2xl font-bold">ETB {(merkatoStats.total_collected / 1000000).toFixed(1)}M</p><p className="text-sm opacity-90">Total Collected</p></div>
              <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-4 text-white text-center"><p className="text-2xl font-bold">ETB {(merkatoStats.total_paid_out / 1000000).toFixed(1)}M</p><p className="text-sm opacity-90">Paid Out</p></div>
              <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-xl p-4 text-white text-center"><p className="text-2xl font-bold">{merkatoStats.pending_draws}</p><p className="text-sm opacity-90">Pending Draws</p></div>
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-4 text-white text-center"><p className="text-2xl font-bold">{merkatoStats.pending_verification}</p><p className="text-sm opacity-90">Pending Verify</p></div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                <h2 className="font-bold text-lg">🏪 Merkato VIP Pools</h2>
                <button onClick={() => setShowMerkatoModal(true)} className="bg-yellow-600 text-white px-4 py-1 rounded-full text-sm">+ Create Pool</button>
              </div>
              <div className="p-4">
                {merkatoPools.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No Merkato pools created yet</p>
                ) : (
                  <div className="space-y-3">
                    {merkatoPools.map(pool => {
                      const getTierColors = (tier) => {
                        switch(tier) {
                          case 'daily': return { bg: 'from-yellow-500 to-orange-600', icon: '⭐', label: 'Daily (1M)' };
                          case 'weekly': return { bg: 'from-purple-500 to-pink-600', icon: '🏆', label: 'Weekly (10M)' };
                          case 'monthly': return { bg: 'from-green-600 to-teal-700', icon: '👑', label: 'Monthly (40M)' };
                          default: return { bg: 'from-gray-600 to-gray-800', icon: '🎯', label: tier };
                        }
                      };
                      const colors = getTierColors(pool.tier);
                      
                      return (
                        <div key={pool.id} className={`bg-gradient-to-r ${colors.bg} rounded-lg p-4 text-white`}>
                          <div className="flex justify-between items-center flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{colors.icon}</span>
                              <div>
                                <div className="font-bold text-lg">{pool.name}</div>
                                <div className="text-xs opacity-90">{colors.label}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center text-sm">
                              <div><p className="text-xs opacity-75">Entry Fee</p><p className="font-bold">ETB {pool.contribution_amount?.toLocaleString()}</p></div>
                              <div><p className="text-xs opacity-75">Prize</p><p className="font-bold">ETB {pool.prize_amount?.toLocaleString()}</p></div>
                              <div><p className="text-xs opacity-75">Total Seats</p><p className="font-bold">{Math.floor((pool.prize_amount * 1.2) / pool.contribution_amount).toLocaleString()}</p></div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openEditMerkatoModal(pool)} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm transition flex items-center gap-1">✏️ Edit</button>
                              <Link href={`/admin/draw-winner?pool=${pool.id}`} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">Draw Winner</Link>
                            </div>
                          </div>
                          <div className="mt-2 text-xs opacity-75">Draw Time: {pool.draw_time ? new Date(pool.draw_time).toLocaleString() : 'Not set'}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="font-bold text-lg">🏆 Merkato Participants</h2></div>
              <div className="p-4">
                {merkatoParticipants.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No participants yet</p>
                ) : (
                  <div className="space-y-3">
                    {merkatoParticipants.slice(0, 10).map(participant => (
                      <div key={participant.id} className="border-b pb-3 flex justify-between items-center">
                        <div><p className="font-semibold">{participant.user_name}</p><p className="text-sm text-gray-500">{participant.user_email}</p><p className="text-xs text-gray-400">Seats: {participant.seat_numbers?.join(', ')}</p></div>
                        <div className="text-right"><p className="font-bold text-green-600">ETB {participant.contribution_amount?.toLocaleString()}</p><p className="text-xs text-gray-400">{participant.pool_type} • {participant.payment_status}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* City VIP Tab - Updated with Create/Edit buttons */}
        {activeTab === 'city-vip' && (
          <div className="space-y-6">
            {/* City VIP Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl p-4 text-white text-center">
                <p className="text-2xl font-bold">{cityVipParticipants.length}</p><p className="text-sm opacity-90">Total Participants</p>
              </div>
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl p-4 text-white text-center">
                <p className="text-2xl font-bold">{cityVipPools.length}</p><p className="text-sm opacity-90">Active Cities</p>
              </div>
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl p-4 text-white text-center">
                <p className="text-2xl font-bold">ETB {cityVipParticipants.reduce((sum, p) => sum + (p.contribution_amount || 0), 0).toLocaleString()}</p>
                <p className="text-sm opacity-90">Total Collected</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-4 text-white text-center">
                <p className="text-2xl font-bold">{cityVipParticipants.filter(p => p.payment_status === 'pending_verification').length}</p>
                <p className="text-sm opacity-90">Pending Verify</p>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-4 text-white text-center">
                <p className="text-2xl font-bold">{cityVipParticipants.filter(p => p.pool_type === 'daily' && p.payment_status === 'verified').length}</p>
                <p className="text-sm opacity-90">Daily</p>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-white text-center">
                <p className="text-2xl font-bold">{cityVipParticipants.filter(p => p.pool_type === 'monthly' && p.payment_status === 'verified').length}</p>
                <p className="text-sm opacity-90">Monthly</p>
              </div>
            </div>

            {/* City VIP Management Actions */}
            <div className="bg-white rounded-xl shadow-md p-4 flex justify-between items-center flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by City</label>
                <select
                  value={selectedCityFilter}
                  onChange={(e) => setSelectedCityFilter(e.target.value)}
                  className="w-full md:w-64 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500"
                >
                  <option value="all">All Cities ({cityVipParticipants.length})</option>
                  {cityVipPools.map(pool => (
                    <option key={pool.city} value={pool.city}>
                      {pool.city} ({pool.total_participants} participants)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCreateCityModal(true)} 
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-2"
                >
                  ➕ Create New City VIP
                </button>
              </div>
            </div>

            {/* City VIP Participants List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="font-bold text-lg">🏙️ City VIP Participants</h2>
                <p className="text-sm text-gray-500">Manage city-specific participant payments and verification</p>
              </div>
              <div className="p-4">
                {cityVipParticipants.length === 0 ? (
                  <div className="text-center py-12"><div className="text-5xl mb-3">🏙️</div><p className="text-gray-400">No City VIP participants yet</p></div>
                ) : (
                  <div className="space-y-4">
                    {cityVipParticipants
                      .filter(p => selectedCityFilter === 'all' || p.city === selectedCityFilter)
                      .map((participant) => {
                        const isVerified = participant.payment_status === 'verified';
                        const isPending = participant.payment_status === 'pending_verification';
                        
                        return (
                          <div key={participant.id} className={`border rounded-lg p-4 ${isVerified ? 'border-green-200 bg-green-50/30' : isPending ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-200'}`}>
                            <div className="flex justify-between items-start flex-wrap gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-2xl">🏙️</span>
                                  <span className="font-semibold">{participant.city || 'Unknown City'}</span>
                                  <span className="text-sm text-gray-500">{participant.pool_type} Pool</span>
                                  {isVerified ? (<span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✓ Verified</span>) : isPending ? (<span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">⏳ Pending</span>) : (<span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">Pending Payment</span>)}
                                </div>
                                <p className="text-sm font-medium">{participant.user_name}</p>
                                <p className="text-sm text-gray-500">{participant.user_email}</p>
                                <p className="text-sm">Seats: <span className="font-mono">{participant.seat_numbers?.join(', ')}</span></p>
                                <p className="text-sm font-semibold text-green-600">Amount: ETB {participant.contribution_amount?.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">Ticket: {participant.ticket_number}</p>
                                <p className="text-xs text-gray-400">Submitted: {new Date(participant.created_at).toLocaleString()}</p>
                              </div>
                              <div className="flex gap-2">
                                {participant.payment_proof_url && (<button onClick={() => window.open(participant.payment_proof_url, '_blank')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">📸 View Proof</button>)}
                                {isPending && (<><button onClick={() => verifyCityVipPayment(participant.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">✅ Approve</button><button onClick={() => verifyCityVipPayment(participant.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">❌ Reject</button></>)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* City Summary with Draw Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityVipPools.map(pool => (
                <div key={pool.city} className="bg-white rounded-xl shadow-md p-4 border-l-4 border-gray-500">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🏙️</span>
                      <div>
                        <h3 className="font-bold text-lg">{pool.city}</h3>
                        <p className="text-xs text-gray-500">City VIP Program</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const cityConfig = cityVipConfigs.find(c => c.city_id === pool.city.toLowerCase().replace(/\s/g, '-'));
                          setSelectedCityForEdit(cityConfig || pool);
                          setShowEditCityModal(true);
                        }} 
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Participants:</span>
                      <span className="font-semibold">{pool.total_participants}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Verified:</span>
                      <span className="font-semibold text-green-600">{pool.verified_participants || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Pending Verify:</span>
                      <span className="font-semibold text-yellow-600">{pool.pending_verification}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Collected:</span>
                      <span className="font-semibold text-green-600">ETB {pool.total_collected.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex gap-2">
                    <button 
                      onClick={() => drawCityVipWinner(pool.city, 'daily')} 
                      disabled={drawingCityWinner || (pool.verified_participants || 0) === 0} 
                      className="flex-1 bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700 disabled:opacity-50"
                    >
                      ⭐ Daily Draw
                    </button>
                    <button 
                      onClick={() => drawCityVipWinner(pool.city, 'weekly')} 
                      disabled={drawingCityWinner || (pool.verified_participants || 0) === 0} 
                      className="flex-1 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                    >
                      🏆 Weekly Draw
                    </button>
                    <button 
                      onClick={() => drawCityVipWinner(pool.city, 'monthly')} 
                      disabled={drawingCityWinner || (pool.verified_participants || 0) === 0} 
                      className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                    >
                      👑 Monthly Draw
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* City VIP Winners History */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="font-bold text-lg">🏆 City VIP Winners History</h2></div>
              <div className="p-4">
                {cityVipWinners.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No winners yet. Draw the first winner!</div>
                ) : (
                  <div className="space-y-3">
                    {cityVipWinners.map(winner => (
                      <div key={winner.id} className="border-b pb-3 flex justify-between items-center">
                        <div><p className="font-semibold">{winner.winner_name || winner.winner_email}</p><p className="text-sm text-gray-500">{winner.city} - {winner.pool_type || 'city'} pool</p><p className="text-xs text-gray-400">{new Date(winner.drawn_at).toLocaleString()}</p></div>
                        <div className="text-right"><p className="font-bold text-green-600">ETB {winner.prize_amount?.toLocaleString()}</p><p className="text-xs text-gray-400">Ticket: {winner.ticket_number?.slice(-8)}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab - Keep your existing implementation */}
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
                      <td className="px-4 py-3"><select onChange={(e) => updateUserRole(u.id, e.target.value)} defaultValue={u.role || 'individual'} className="border rounded px-2 py-1 text-sm"><option value="individual">Individual</option><option value="agent">Agent</option><option value="vendor">Vendor</option><option value="organization">Organization</option><option value="admin">Admin</option></select></td>
                      <td className="px-4 py-3">{u.is_banned ? <span className="text-red-600 font-medium">Banned</span> : <span className="text-green-600">Active</span>}</td>
                      <td className="px-4 py-3"><button onClick={() => toggleUserBan(u.id, u.is_banned)} className={`px-3 py-1 rounded text-xs ${u.is_banned ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{u.is_banned ? 'Unban' : 'Ban'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pools Tab - Keep your existing implementation */}
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
                      <td className="px-4 py-3 flex gap-1 flex-wrap"><button onClick={() => togglePoolStatus(p.id, p.status)} className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">{p.status === 'active' ? 'Pause' : 'Activate'}</button><button onClick={() => toggleFeaturedPool(p.id, p.is_featured)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">{p.is_featured ? 'Unfeature' : 'Feature'}</button><button onClick={() => deletePool(p.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Delete</button><Link href={`/pools/${p.id}`} className="bg-gray-600 text-white px-2 py-1 rounded text-xs">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approvals Tab - Keep your existing implementation */}
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

        {/* Withdrawals Tab - Keep your existing implementation */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h3 className="font-bold text-lg mb-4">💰 Withdrawal Requests ({withdrawalRequests.length})</h3>
            {withdrawalRequests.length === 0 ? <p className="text-gray-400 text-center py-8">No pending withdrawal requests</p> : 
              withdrawalRequests.map(w => (<div key={w.id} className="flex justify-between items-center border-b py-3"><div><p className="font-medium">{w.profiles?.full_name}</p><p className="text-sm">ETB {w.amount?.toLocaleString()} - {w.commission_type}</p></div><div><button onClick={() => processWithdrawal(w.id, true)} className="bg-green-600 text-white px-4 py-1 rounded text-sm">Approve</button><button onClick={() => processWithdrawal(w.id, false)} className="bg-red-600 text-white px-4 py-1 rounded text-sm ml-2">Reject</button></div></div>))
            }
          </div>
        )}

        {/* Bank Transfers Tab - Keep your existing implementation */}
        {activeTab === 'bank-transfers' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="font-bold text-lg">🏦 Bank Transfer Verification</h2><p className="text-sm text-gray-500">Verify user payment proofs to confirm their seats</p></div>
            <div className="p-4">
              {bankTransfers.length === 0 ? (
                <div className="text-center py-12"><div className="text-5xl mb-3">✅</div><p className="text-gray-500">No pending bank transfers</p></div>
              ) : (
                <div className="space-y-4">
                  {bankTransfers.map((transfer) => (
                    <div key={transfer.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">{transfer.profiles?.full_name}</p>
                          <p className="text-sm text-gray-500">{transfer.profiles?.email}</p>
                          <p className="text-sm">🎯 Pool: <span className="font-medium">{transfer.pools?.prize_name}</span></p>
                          <p className="text-sm">🎟️ Seats: <span className="font-mono">{transfer.seat_numbers?.join(', ')}</span></p>
                          <p className="text-sm font-bold text-green-600">💰 ETB {transfer.amount?.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Submitted: {new Date(transfer.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">{transfer.proof_image && (<button onClick={() => window.open(transfer.proof_image, '_blank')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">📸 View Proof</button>)}</div>
                      </div>
                      <div className="flex gap-3 mt-4 pt-3 border-t"><button onClick={() => verifyBankTransfer(transfer.id, transfer.user_id, transfer.pool_id, transfer.amount, transfer.seat_numbers, true)} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold">✅ Approve & Confirm Seats</button><button onClick={() => verifyBankTransfer(transfer.id, transfer.user_id, transfer.pool_id, transfer.amount, transfer.seat_numbers, false)} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold">❌ Reject</button></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finance Tab - Keep your existing implementation */}
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

        {/* Disputes Tab - Keep your existing implementation */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            {disputes.length === 0 ? <div className="bg-white rounded-xl p-8 text-center"><p className="text-gray-400">✅ No pending disputes</p></div> : disputes.map(d => (<div key={d.id} className="bg-white rounded-xl shadow-md p-6"><p className="font-bold text-lg">Pool: {d.pool?.prize_name}</p><p className="text-gray-600">Filed by: {d.user?.full_name}</p><p className="mt-2">{d.description}</p><textarea id={`res-${d.id}`} placeholder="Enter resolution notes..." className="w-full border rounded-lg p-2 mt-3"></textarea><button onClick={() => resolveDispute(d.id, document.getElementById(`res-${d.id}`).value)} className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg">Resolve Dispute</button></div>))}
          </div>
        )}

        {/* Settings Tab - Keep your existing implementation */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-xl mb-4">⚙️ Platform Settings</h2>
            <button onClick={() => setShowAnnouncementModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg">📢 Create Announcement</button>
            <div className="mt-6 pt-6 border-t"><Link href="/admin/analytics" className="text-blue-600 hover:underline">📊 View Full Analytics →</Link></div>
            <div className="mt-4"><Link href="/admin/logs" className="text-blue-600 hover:underline">📜 View System Logs →</Link></div>
          </div>
        )}
      </div>

      {/* City Winner Draw Modal */}
      {showCityDrawModal && selectedCityPool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="text-6xl mb-3">🏆</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Winner Announced!</h2>
              <p className="text-gray-500 mb-4">{selectedCityPool.city} VIP {selectedCityPool.poolType} Pool</p>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-500">Winner</p>
                <p className="text-xl font-bold text-gray-800">{selectedCityPool.winner?.user_name || selectedCityPool.winner?.user_email}</p>
                <p className="text-2xl font-bold text-green-600 mt-2">ETB {selectedCityPool.prize?.toLocaleString()}</p>
              </div>
              <div className="text-left text-sm space-y-2 mb-4">
                <p><span className="text-gray-500">Email:</span> {selectedCityPool.winner?.user_email}</p>
                <p><span className="text-gray-500">Ticket:</span> <span className="font-mono">{selectedCityPool.winner?.ticket_number}</span></p>
                <p><span className="text-gray-500">Seats:</span> {selectedCityPool.winner?.seat_numbers?.join(', ')}</p>
              </div>
              <button onClick={() => setShowCityDrawModal(false)} className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Pool Modal */}
      {showPoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center"><h2 className="text-xl font-bold">✨ Create Featured Pool (20% Commission)</h2><button onClick={() => setShowPoolModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button></div>
            <div className="p-6 space-y-5">
              <div><label className="block text-sm font-medium mb-1">Prize Name *</label><input type="text" className="w-full border rounded-lg p-3" placeholder="e.g., iPhone 15 Pro Max" value={newPool.prize_name} onChange={(e) => setNewPool({...newPool, prize_name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><textarea rows="3" className="w-full border rounded-lg p-3" placeholder="Describe the prize and pool rules..." value={newPool.description} onChange={(e) => setNewPool({...newPool, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Target Amount (ETB) *</label><input type="number" className="w-full border rounded-lg p-3" placeholder="10000" value={newPool.target_amount} onChange={(e) => setNewPool({...newPool, target_amount: e.target.value})} /></div><div><label className="block text-sm font-medium mb-1">Entry Fee (ETB)</label><input type="number" className="w-full border rounded-lg p-3" placeholder="10" value={newPool.entry_fee} onChange={(e) => setNewPool({...newPool, entry_fee: e.target.value})} /></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Start Date</label><input type="datetime-local" className="w-full border rounded-lg p-3" value={newPool.start_date} onChange={(e) => setNewPool({...newPool, start_date: e.target.value})} /></div><div><label className="block text-sm font-medium mb-1">End Date *</label><input type="datetime-local" className="w-full border rounded-lg p-3" value={newPool.end_date} onChange={(e) => setNewPool({...newPool, end_date: e.target.value})} /></div></div>
              <div><label className="block text-sm font-medium mb-1">Pool Image</label><input type="file" accept="image/*" onChange={handlePoolImageUpload} disabled={uploading} className="w-full border rounded-lg p-2" />{uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}{newPool.image_url && <div className="mt-2"><img src={newPool.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-lg" /></div>}</div>
              <div className="flex items-center gap-3"><input type="checkbox" id="is_featured" checked={newPool.is_featured} onChange={(e) => setNewPool({...newPool, is_featured: e.target.checked})} className="w-5 h-5" /><label htmlFor="is_featured" className="text-sm font-medium">⭐ Feature this pool on homepage</label></div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm"><p className="font-semibold text-yellow-800">💰 Admin Commission: 20%</p><p className="text-yellow-700 text-xs mt-1">When this pool reaches target, you earn 20% of the total amount. Target: ETB {parseFloat(newPool.target_amount || 0).toLocaleString()} → Your commission: ETB {(parseFloat(newPool.target_amount || 0) * 0.20).toLocaleString()}</p></div>
              <div className="flex gap-3 pt-4"><button onClick={createAdminPool} disabled={loading || uploading} className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">{loading ? 'Creating...' : '✨ Create Featured Pool'}</button><button onClick={() => setShowPoolModal(false)} className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50">Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Merkato VIP Pool Creation Modal */}
      {showMerkatoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center"><h2 className="text-xl font-bold">🏪 Create Merkato VIP Pool</h2><button onClick={() => setShowMerkatoModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button></div>
            <div className="p-6 space-y-5">
              <div><label className="block text-sm font-medium mb-2">Select Tier</label>
                <div className="grid grid-cols-3 gap-3">{Object.entries(tierConfig).map(([key, config]) => (<button key={key} onClick={() => setNewMerkatoPool({...newMerkatoPool, tier: key, contribution_amount: config.contribution, prize_amount: config.prize})} className={`p-3 rounded-xl text-center transition ${newMerkatoPool.tier === key ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700'}`}><div className="text-2xl">{config.icon}</div><div className="font-bold text-xs">{config.name}</div><div className="text-xs">{config.prize.toLocaleString()} ETB</div></button>))}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4"><div className="flex justify-between mb-2"><span>Entry Fee:</span><span className="font-bold">{newMerkatoPool.contribution_amount.toLocaleString()} ETB</span></div><div className="flex justify-between mb-2"><span>Prize:</span><span className="font-bold text-green-600">{newMerkatoPool.prize_amount.toLocaleString()} ETB</span></div><div className="flex justify-between"><span>Winner:</span><span>1 Lucky Winner</span></div></div>
              <div><label className="block text-sm font-medium mb-2">Draw Time (Ethiopia Time)</label><input type="time" className="w-full border rounded-lg p-3" value={newMerkatoPool.draw_time} onChange={(e) => setNewMerkatoPool({...newMerkatoPool, draw_time: e.target.value})} /></div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm"><p className="font-semibold">📝 Pool Rules:</p><ul className="text-xs mt-1 space-y-1"><li>• Daily: 500 ETB entry → Win 1,000,000 ETB</li><li>• Weekly: 2,500 ETB entry → Win 10,000,000 ETB</li><li>• Monthly: 5,000 ETB entry → Win 40,000,000 ETB</li><li>• Draw happens automatically or via admin</li></ul></div>
              <div className="flex gap-3 pt-4"><button onClick={createMerkatoPool} disabled={loading} className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">{loading ? 'Creating...' : '✨ Create Merkato Pool'}</button><button onClick={() => setShowMerkatoModal(false)} className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50">Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Merkato VIP Pool Modal */}
      {showEditMerkatoModal && editingMerkatoPool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold">✏️ Edit Merkato VIP Pool</h2><button onClick={() => setShowEditMerkatoModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-5">
              <div className={`bg-gradient-to-r ${editingMerkatoPool.tier === 'daily' ? 'from-yellow-500 to-orange-600' : editingMerkatoPool.tier === 'weekly' ? 'from-purple-500 to-pink-600' : 'from-green-600 to-teal-700'} rounded-xl p-4 text-white text-center`}>
                <div className="text-3xl mb-1">{editingMerkatoPool.tier === 'daily' ? '⭐' : editingMerkatoPool.tier === 'weekly' ? '🏆' : '👑'}</div>
                <p className="font-bold">{editingMerkatoPool.name}</p>
                <p className="text-xs opacity-80">{editingMerkatoPool.tier === 'daily' ? 'Daily Millionaire' : editingMerkatoPool.tier === 'weekly' ? 'Weekly Mega Winner' : 'Monthly Winner'}</p>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Pool Name</label><input type="text" value={editMerkatoData.name} onChange={(e) => setEditMerkatoData({...editMerkatoData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee (ETB)</label><input type="number" value={editMerkatoData.contribution_amount} onChange={(e) => { const newEntryFee = parseInt(e.target.value); setEditMerkatoData({...editMerkatoData, contribution_amount: newEntryFee}); }} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500" /><p className="text-xs text-gray-400 mt-1">Current: ETB {editMerkatoData.contribution_amount?.toLocaleString()}</p></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Prize Amount (ETB)</label><input type="number" value={editMerkatoData.prize_amount} onChange={(e) => { const newPrize = parseInt(e.target.value); setEditMerkatoData({...editMerkatoData, prize_amount: newPrize}); }} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500" /><p className="text-xs text-gray-400 mt-1">Current: ETB {editMerkatoData.prize_amount?.toLocaleString()}</p></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-sm font-semibold text-gray-700 mb-2">📊 Updated Calculations:</p><div className="space-y-1 text-sm"><div className="flex justify-between"><span className="text-gray-600">Total Collection (+20%):</span><span className="font-bold text-green-600">ETB {(editMerkatoData.prize_amount * 1.2).toLocaleString()}</span></div><div className="flex justify-between"><span className="text-gray-600">Total Seats:</span><span className="font-bold text-blue-600">{Math.floor((editMerkatoData.prize_amount * 1.2) / editMerkatoData.contribution_amount).toLocaleString()} seats</span></div><div className="flex justify-between"><span className="text-gray-600">Admin Commission (20%):</span><span className="font-bold text-orange-600">ETB {(editMerkatoData.prize_amount * 0.2).toLocaleString()}</span></div></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Draw Time</label><input type="datetime-local" value={editMerkatoData.draw_time} onChange={(e) => setEditMerkatoData({...editMerkatoData, draw_time: e.target.value})} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500" /></div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm"><p className="font-semibold text-yellow-800">📝 Note:</p><p className="text-xs text-yellow-700 mt-1">• Changing entry fee or prize amount will automatically recalculate total seats<br/>• Colors will remain the same (Yellow for Daily, Purple for Weekly, Green for Monthly)<br/>• Changes take effect immediately for new participants</p></div>
              <div className="flex gap-3 pt-4"><button onClick={updateMerkatoPool} disabled={loading} className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition">{loading ? 'Saving...' : '💾 Save Changes'}</button><button onClick={() => setShowEditMerkatoModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
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

      {/* Create City VIP Modal */}
      <CreateCityVipModal 
        isOpen={showCreateCityModal} 
        onClose={() => setShowCreateCityModal(false)} 
        onSuccess={() => {
          loadCityVipData();
          loadCityVipConfigs();
        }} 
      />

      {/* Edit City VIP Modal */}
      <EditCityVipModal 
        isOpen={showEditCityModal} 
        onClose={() => {
          setShowEditCityModal(false);
          setSelectedCityForEdit(null);
        }} 
        onSuccess={() => {
          loadCityVipData();
          loadCityVipConfigs();
        }} 
        cityData={selectedCityForEdit} 
      />
    </div>
  );
}
