// pages/admin/dashboard.js - UPDATED FOR UNIFIED AGENT SYSTEM
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
  
  // Pending approvals - UPDATED for new agents table
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

  // View document modal
  const [viewingDocument, setViewingDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

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
    
    const { data: recentAgents } = await supabase
      .from('agents')
      .select('full_name, business_name, created_at')
      .eq('is_approved', false)
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
    (recentAgents || []).forEach(a => {
      activities.push({
        action: `New agent application: ${a.full_name} - ${a.business_name}`,
        date: a.created_at,
        icon: '🤝'
      });
    });
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (isMounted.current) setRecentActivity(activities.slice(0, 5));
  }

  async function loadStats() {
    const results = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('agents').select('*', { count: 'exact', head: true }).eq('is_approved', true),
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('pools').select('*'),
      supabase.from('contributions').select('amount, status'),
      supabase.from('commissions').select('commission_amount, status')
    ]);
    
    const pools = results[4]?.data || [];
    const contributions = results[5]?.data || [];
    const commissions = results[6]?.data || [];
    
    const total_pools = pools?.length || 0;
    const active_pools = pools?.filter(p => p.status === 'active')?.length || 0;
    const completed_pools = pools?.filter(p => p.status === 'completed')?.length || 0;
    const pending_pools = pools?.filter(p => p.status === 'pending')?.length || 0;
    const total_volume = contributions?.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const total_commission_paid = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0) || 0;
    const pending_commission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0) || 0;
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
      .select('commission_amount, status')
      .eq('agent_id', user?.id);
    const totalCommission = commissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;
    const pendingCommission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0) || 0;
    
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

  // UPDATED: Load pending approvals from new agents table
  async function loadPendingApprovals() {
    // Load pending agents from the unified agents table
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    
    if (!agentsError && agents) {
      // Get profile info for each agent
      const agentsWithProfiles = await Promise.all(
        agents.map(async (agent) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', agent.user_id)
            .single();
          return { ...agent, profile };
        })
      );
      setPendingAgents(agentsWithProfiles || []);
    }
    
    // Load vendors and organizations (keep as is for now)
    const { data: vendors } = await supabase
      .from('vendors')
      .select('*, profiles!user_id(full_name, email)')
      .eq('verified', false);
    
    const { data: organizations } = await supabase
      .from('organizations')
      .select('*, profiles!user_id(full_name, email)')
      .eq('verified', false);
    
    if (!isMounted.current) return;
    setPendingVendors(vendors || []);
    setPendingOrganizations(organizations || []);
  }

  // UPDATED: Approve agent application
  async function verifyAgent(agentId, approved, rejectionReason = null) {
    try {
      if (approved) {
        const { error } = await supabase
          .from('agents')
          .update({ 
            is_approved: true, 
            approved_at: new Date().toISOString(),
            approved_by: user?.id,
            status: 'active'
          })
          .eq('id', agentId);
        
        if (error) throw error;
        
        // Get agent details for notification
        const { data: agent } = await supabase
          .from('agents')
          .select('user_id, full_name, email')
          .eq('id', agentId)
          .single();
        
        if (agent) {
          await supabase.from('notifications').insert({
            user_id: agent.user_id,
            title: '🎉 Agent Application Approved!',
            message: `Congratulations ${agent.full_name}! Your agent application has been approved. You can now start earning 10% commission on referrals.`,
            type: 'agent_approval',
            created_at: new Date().toISOString()
          });
        }
        
        toast.success('Agent approved successfully');
      } else {
        const { error } = await supabase
          .from('agents')
          .update({ 
            is_approved: false, 
            status: 'rejected',
            rejection_reason: rejectionReason
          })
          .eq('id', agentId);
        
        if (error) throw error;
        toast.success('Agent rejected');
      }
      
      await loadPendingApprovals();
      await loadStats();
    } catch (error) {
      console.error('Agent approval error:', error);
      toast.error('Failed to process agent application');
    }
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

  // Withdrawal management - UPDATED for withdrawals table
  async function processWithdrawal(requestId, approved) {
    const { error } = await supabase
      .from('withdrawals')
      .update({ 
        status: approved ? 'completed' : 'rejected', 
        processed_at: new Date().toISOString(), 
        processed_by: user?.id 
      })
      .eq('id', requestId);
    
    if (error) toast.error('Failed'); 
    else { 
      toast.success(`Withdrawal ${approved ? 'approved' : 'rejected'}`); 
      loadWithdrawalRequests(); 
    }
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

  async function loadWithdrawalRequests() {
    const { data } = await supabase
      .from('withdrawals')
      .select('*, agents!agent_id(full_name, email)')
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
        <div className="grid grid-cols-2 md:grid-cols-10 gap-3">
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
          <Link href="/admin/verify-payments" className="bg-indigo-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">🔍</div>
            <p className="font-semibold text-xs">Verify Payments</p>
            <p className="text-xs opacity-80">Approve/Reject</p>
          </Link>
        </div>
      </div>

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
            {/* Keep your existing overview tab content */}
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

        {/* Approvals Tab - UPDATED for unified agent system */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            {/* Pending Agents Section - UPDATED */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">🤝 Pending Agent Applications ({pendingAgents.length})</h3>
              {pendingAgents.length === 0 ? (
                <p className="text-gray-400">No pending agent applications</p>
              ) : (
                <div className="space-y-4">
                  {pendingAgents.map(agent => (
                    <div key={agent.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl">🤝</span>
                            <div>
                              <p className="font-semibold text-lg">{agent.full_name}</p>
                              <p className="text-sm text-gray-500">{agent.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <p><span className="text-gray-500">Business:</span> {agent.business_name || 'N/A'}</p>
                            <p><span className="text-gray-500">Phone:</span> {agent.phone || 'N/A'}</p>
                            <p><span className="text-gray-500">Program Type:</span> 
                              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-gray-100">
                                {agent.program_type === 'city_vip' ? 'City VIP' : 
                                 agent.program_type === 'merkato_vip' ? 'Merkato VIP' : 
                                 agent.program_type === 'regular' ? 'Regular Pools' : 'All Programs'}
                              </span>
                            </p>
                            {agent.city_code && <p><span className="text-gray-500">City:</span> {agent.city_name || agent.city_code}</p>}
                            <p><span className="text-gray-500">TIN Number:</span> {agent.tin_number || 'N/A'}</p>
                            <p><span className="text-gray-500">Business Address:</span> {agent.business_address || 'N/A'}</p>
                            <p><span className="text-gray-500">Applied:</span> {new Date(agent.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {agent.digital_id_url && (
                              <button 
                                onClick={() => { setViewingDocument(agent.digital_id_url); setShowDocumentModal(true); }}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                              >
                                📄 View Digital ID
                              </button>
                            )}
                            {agent.business_license_url && (
                              <button 
                                onClick={() => { setViewingDocument(agent.business_license_url); setShowDocumentModal(true); }}
                                className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                              >
                                📜 View Business License
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => verifyAgent(agent.id, true)} 
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                          >
                            ✅ Approve
                          </button>
                          <button 
                            onClick={() => {
                              const reason = prompt('Enter rejection reason (optional):');
                              verifyAgent(agent.id, false, reason);
                            }} 
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Vendors - Keep existing */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">🏪 Pending Vendors ({pendingVendors.length})</h3>
              {pendingVendors.length === 0 ? <p className="text-gray-400">No pending vendors</p> : pendingVendors.map(v => (<div key={v.id} className="flex justify-between items-center border-b py-3"><div><p className="font-medium">{v.business_name}</p><p className="text-sm text-gray-500">{v.profiles?.email}</p></div><div><button onClick={() => verifyVendor(v.id, true)} className="bg-green-600 text-white px-4 py-1 rounded text-sm">Approve</button><button onClick={() => verifyVendor(v.id, false)} className="bg-red-600 text-white px-4 py-1 rounded text-sm ml-2">Reject</button></div></div>))}
            </div>

            {/* Pending Organizations - Keep existing */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">🏢 Pending Organizations ({pendingOrganizations.length})</h3>
              {pendingOrganizations.length === 0 ? <p className="text-gray-400">No pending organizations</p> : pendingOrganizations.map(o => (<div key={o.id} className="flex justify-between items-center border-b py-3"><div><p className="font-medium">{o.business_name}</p><p className="text-sm text-gray-500">{o.profiles?.email}</p></div><div><button onClick={() => verifyOrganization(o.id, true)} className="bg-green-600 text-white px-4 py-1 rounded text-sm">Approve</button><button onClick={() => verifyOrganization(o.id, false)} className="bg-red-600 text-white px-4 py-1 rounded text-sm ml-2">Reject</button></div></div>))}
            </div>
          </div>
        )}

        {/* Withdrawals Tab - UPDATED for withdrawals table */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h3 className="font-bold text-lg mb-4">💰 Withdrawal Requests ({withdrawalRequests.length})</h3>
            {withdrawalRequests.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No pending withdrawal requests</p>
            ) : (
              withdrawalRequests.map(w => (
                <div key={w.id} className="flex justify-between items-center border-b py-3">
                  <div>
                    <p className="font-medium">{w.agents?.full_name || 'Agent'}</p>
                    <p className="text-sm">ETB {w.amount?.toLocaleString()} - {w.payment_method === 'telebirr' ? 'Telebirr' : 'Bank Transfer'}</p>
                    <p className="text-xs text-gray-500">Account: {w.account_number || w.account_phone}</p>
                    <p className="text-xs text-gray-400">Requested: {new Date(w.requested_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <button onClick={() => processWithdrawal(w.id, true)} className="bg-green-600 text-white px-4 py-1 rounded text-sm mr-2">Approve</button>
                    <button onClick={() => processWithdrawal(w.id, false)} className="bg-red-600 text-white px-4 py-1 rounded text-sm">Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Document View Modal */}
        {showDocumentModal && viewingDocument && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h3 className="font-bold text-lg">Document Viewer</h3>
                <button onClick={() => { setShowDocumentModal(false); setViewingDocument(null); }} className="text-gray-500 text-2xl">×</button>
              </div>
              <div className="p-4">
                {viewingDocument.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={viewingDocument} alt="Document" className="w-full rounded-lg" />
                ) : (
                  <iframe src={viewingDocument} className="w-full h-[70vh]" title="Document" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Keep your other tabs (my-pools, merkato, city-vip, users, pools, bank-transfers, finance, disputes, settings) as they are */}
        {/* They remain unchanged from your original implementation */}

        {/* ... (rest of your tabs - my-pools, merkato, city-vip, users, pools, bank-transfers, finance, disputes, settings) ... */}
        {/* For brevity, I'm not repeating them here, but they should remain exactly as in your original code */}
      </div>

      {/* Modals - Keep all your existing modals */}
      {/* Create Pool Modal, Merkato VIP Modal, Edit Merkato Modal, Announcement Modal, Create City VIP Modal, Edit City VIP Modal */}
      {/* ... (keep your existing modal implementations) ... */}
    </div>
  );
}
