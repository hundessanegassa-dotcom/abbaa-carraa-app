// pages/admin/dashboard.js - COMPLETE 1900+ LINE ADMIN DASHBOARD
// FULLY INTERLINKED WITH ALL ABBAA CARRAA PLATFORM
// UPDATED WITH UNIFIED MODALS (CREATE, EDIT, DELETE)
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import BackButton from '../../components/BackButton';
// IMPORT UNIFIED MODALS - REPLACES THE THREE OLD MODALS
import CityVipModal from '../../components/admin/CityVipModal';
import MerkatoVipModal from '../../components/admin/MerkatoVipModal';
import RegularPoolModal from '../../components/admin/RegularPoolModal';

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
    total_participants: 0, daily_participants: 0, weekly_participants: 0, monthly_participants: 0,
    total_collected: 0, total_paid_out: 0, pending_draws: 0, pending_verification: 0
  });
  
  // City VIP States
  const [cityVipPools, setCityVipPools] = useState([]);
  const [cityVipParticipants, setCityVipParticipants] = useState([]);
  const [selectedCityFilter, setSelectedCityFilter] = useState('all');
  const [cityVipWinners, setCityVipWinners] = useState([]);
  const [drawingCityWinner, setDrawingCityWinner] = useState(false);
  const [showCityDrawModal, setShowCityDrawModal] = useState(false);
  const [selectedCityPool, setSelectedCityPool] = useState(null);
  const [cityVipConfigs, setCityVipConfigs] = useState([]);
  
  // UNIFIED MODAL STATES - REPLACES THE THREE OLD MODAL STATES
  const [cityModalMode, setCityModalMode] = useState(null); // 'create', 'edit', 'delete'
  const [selectedCityData, setSelectedCityData] = useState(null);
  const [merkatoModalMode, setMerkatoModalMode] = useState(null); // 'create', 'edit', 'delete'
  const [selectedMerkatoData, setSelectedMerkatoData] = useState(null);
  const [regularModalMode, setRegularModalMode] = useState(null); // 'create', 'edit', 'delete'
  const [selectedRegularData, setSelectedRegularData] = useState(null);
  
  // KEEP THESE FOR BACKWARD COMPATIBILITY WITH EXISTING BUTTONS
  const [showCreateCityModal, setShowCreateCityModal] = useState(false);
  const [showEditCityModal, setShowEditCityModal] = useState(false);
  const [selectedCityForEdit, setSelectedCityForEdit] = useState(null);
  
  // Admin's personal pools
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
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // Management data
  const [users, setUsers] = useState([]);
  const [allPools, setAllPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [charityTransactions, setCharityTransactions] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Merkato VIP specific
  const [merkatoPools, setMerkatoPools] = useState([]);
  const [merkatoParticipants, setMerkatoParticipants] = useState([]);
  const [merkatoWinners, setMerkatoWinners] = useState([]);
  const [showMerkatoModal, setShowMerkatoModal] = useState(false);
  const [newMerkatoPool, setNewMerkatoPool] = useState({ tier: 'daily', contribution_amount: 500, prize_amount: 1000000, draw_time: '20:00' });
  
  // Edit Merkato Pool
  const [editingMerkatoPool, setEditingMerkatoPool] = useState(null);
  const [showEditMerkatoModal, setShowEditMerkatoModal] = useState(false);
  const [editMerkatoData, setEditMerkatoData] = useState({ id: '', tier: '', name: '', contribution_amount: 0, prize_amount: 0, draw_time: '', status: '' });
  
  // Announcement modal
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', target_audience: 'all' });
  
  // Pool creation modal (KEPT for backward compatibility)
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPool, setNewPool] = useState({
    prize_name: '', description: '', target_amount: '', entry_fee: '10', ticket_price: '5',
    start_date: new Date().toISOString().slice(0, 16), end_date: '', image_url: '', is_featured: true
  });

  // Document viewer modal
  const [viewingDocument, setViewingDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const tierConfig = {
    daily: { name: 'Daily Millionaire', contribution: 500, prize: 1000000, frequency: 'daily', winnerCount: 1, icon: '⭐', slogan: 'Make ONE participant a MILLIONAIRE Today!' },
    weekly: { name: 'Weekly Mega Winner', contribution: 2500, prize: 10000000, frequency: 'weekly', winnerCount: 1, icon: '🏆', slogan: 'Make ONE participant a MILLIONAIRE This Week!' },
    monthly: { name: 'Monthly Legend', contribution: 5000, prize: 40000000, frequency: 'monthly', winnerCount: 1, icon: '👑', slogan: 'Make ONE participant a MILLIONAIRE This Month!' }
  };

  // Cleanup
  useEffect(() => { 
    return () => { isMounted.current = false; }; 
  }, []);

  // Check admin on mount
  useEffect(() => { 
    checkAdmin(); 
  }, []);

  // Real-time notification subscription
  useEffect(() => {
    if (!user) return;
    
    const subscription = supabase
      .channel('admin_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'admin_notifications' 
      }, (payload) => {
        if (isMounted.current) {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadNotifications(prev => prev + 1);
          toast.info(payload.new.title);
        }
      })
      .subscribe();
    
    return () => { subscription.unsubscribe(); };
  }, [user]);

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
      await loadNotifications();
      setLoading(false);
    } catch (error) {
      console.error('Admin check error:', error);
      setLoading(false);
    }
  }

  async function loadNotifications() {
    try {
      const { data } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (isMounted.current) {
        setNotifications(data || []);
        setUnreadNotifications(data?.filter(n => !n.read).length || 0);
      }
    } catch (error) { 
      console.error('Error loading notifications:', error); 
    }
  }

  async function markNotificationRead(id) {
    try {
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id);
      loadNotifications();
    } catch (error) { 
      console.error('Error marking notification read:', error); 
    }
  }

  async function loadAllData() {
    try {
      await Promise.all([
        loadStats(),
        loadPendingApprovals(),
        loadMyPools(),
        loadUsers(),
        loadAllPools(),
        loadFeaturedPools(),
        loadWithdrawalRequests(),
        loadBankTransfers(),
        loadCharityData(),
        loadDisputes(),
        loadRecentActivity(),
        loadMerkatoData(),
        loadCityVipData(),
        loadCityVipWinners(),
        loadCityVipConfigs()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Some data failed to load. Refreshing...');
    }
  }

  async function loadStats() {
    try {
      const [
        { count: userCount },
        { data: agentsData },
        { data: vendorsData },
        { data: orgsData },
        { data: pools },
        { data: contributions },
        { data: commissions }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('agents').select('*').eq('is_approved', true),
        supabase.from('vendors').select('*'),
        supabase.from('organizations').select('*'),
        supabase.from('pools').select('*'),
        supabase.from('contributions').select('amount, status'),
        supabase.from('commissions').select('commission_amount, status')
      ]);
      
      const total_volume = contributions?.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const total_commission_paid = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0) || 0;
      const pending_commission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0) || 0;
      const platform_revenue = total_volume * 0.10;
      const charity_total = total_volume * 0.02;
      
      if (!isMounted.current) return;
      setStats({
        total_users: userCount || 0,
        total_agents: agentsData?.length || 0,
        total_vendors: vendorsData?.length || 0,
        total_organizations: orgsData?.length || 0,
        total_pools: pools?.length || 0,
        active_pools: pools?.filter(p => p.status === 'active').length || 0,
        completed_pools: pools?.filter(p => p.status === 'completed').length || 0,
        pending_pools: pools?.filter(p => p.status === 'pending').length || 0,
        total_volume,
        total_commission_paid,
        pending_commission,
        charity_total,
        lives_impacted: Math.floor(charity_total / 100),
        platform_revenue
      });
    } catch (error) { 
      console.error('Stats loading error:', error); 
    }
  }

  async function loadCityVipConfigs() {
    try {
      const { data: configs } = await supabase
        .from('city_vip_config')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (isMounted.current) setCityVipConfigs(configs || []);
    } catch (error) { 
      console.error('Error loading city VIP configs:', error); 
    }
  }

  async function loadCityVipData() {
    try {
      const { data: participants } = await supabase
        .from('city_vip_participants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!isMounted.current) return;
      setCityVipParticipants(participants || []);
      
      const uniqueCities = [...new Set(participants?.map(p => p.city).filter(Boolean))];
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
      const { data: winners } = await supabase
        .from('merkato_vip_draws')
        .select('*')
        .eq('pool_type', 'city')
        .order('drawn_at', { ascending: false })
        .limit(20);
      
      if (isMounted.current) setCityVipWinners(winners || []);
    } catch (error) { 
      console.error('Error loading city winners:', error); 
    }
  }

  async function drawCityVipWinner(cityName, poolType) {
    if (!confirm(`Draw winner for ${cityName} VIP ${poolType} pool? This action cannot be undone.`)) return;
    setDrawingCityWinner(true);
    try {
      const { data: participants } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('city', cityName)
        .eq('pool_type', poolType)
        .eq('payment_status', 'verified')
        .neq('is_winner', true);
      
      if (!participants || participants.length === 0) { 
        toast.error(`No verified participants in ${cityName} VIP ${poolType} pool`); 
        setDrawingCityWinner(false); 
        return; 
      }
      
      const randomIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[randomIndex];
      const prizeAmount = poolType === 'daily' ? 1000000 : poolType === 'weekly' ? 10000000 : 40000000;
      
      await supabase
        .from('city_vip_participants')
        .update({ is_winner: true, winner_drawn_at: new Date().toISOString(), status: 'winner' })
        .eq('id', winner.id);
      
      await supabase
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
      await loadCityVipData();
      await loadCityVipWinners();
      
      setSelectedCityPool({ city: cityName, poolType: poolType, winner: winner, prize: prizeAmount });
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
      await supabase
        .from('city_vip_participants')
        .update({ 
          payment_status: approved ? 'verified' : 'rejected', 
          verified_at: approved ? new Date().toISOString() : null, 
          verified_by: user?.id, 
          status: approved ? 'active' : 'cancelled' 
        })
        .eq('id', participantId);
      
      toast.success(`Payment ${approved ? 'approved' : 'rejected'} successfully`);
      await loadCityVipData();
      await loadMerkatoData();
    } catch (error) { 
      console.error('Verification error:', error); 
      toast.error('Failed to verify payment'); 
    }
  }

  async function loadMerkatoData() {
    try {
      const [{ data: pools }, { data: participants }, { data: winners }] = await Promise.all([
        supabase.from('merkato_vip_pools').select('*').order('created_at', { ascending: false }),
        supabase.from('merkato_vip_participants').select('*').order('created_at', { ascending: false }),
        supabase.from('merkato_vip_pools').select('*').eq('status', 'completed').not('winner_id', 'is', null)
      ]);
      
      if (!isMounted.current) return;
      setMerkatoPools(pools || []);
      setMerkatoParticipants(participants || []);
      setMerkatoWinners(winners || []);
      
      const dailyParticipants = participants?.filter(p => p.pool_type === 'daily' && p.payment_status === 'verified')?.length || 0;
      const weeklyParticipants = participants?.filter(p => p.pool_type === 'weekly' && p.payment_status === 'verified')?.length || 0;
      const monthlyParticipants = participants?.filter(p => p.pool_type === 'monthly' && p.payment_status === 'verified')?.length || 0;
      const totalCollected = participants?.filter(p => p.payment_status === 'verified').reduce((sum, p) => sum + (p.contribution_amount || 0), 0) || 0;
      const totalPaidOut = winners?.reduce((sum, w) => sum + (w.prize_amount || 0), 0) || 0;
      const pendingDraws = pools?.filter(p => p.status === 'active' && new Date(p.draw_time) <= new Date())?.length || 0;
      const pendingVerification = participants?.filter(p => p.payment_status === 'pending_verification')?.length || 0;
      
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
    } catch (error) { 
      console.error('Error loading Merkato data:', error); 
    }
  }

  async function loadMyPools() {
    try {
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
      
      setMyStats({ 
        total_pools: pools?.length || 0, 
        active_pools: pools?.filter(p => p.status === 'active')?.length || 0, 
        completed_pools: pools?.filter(p => p.status === 'completed')?.length || 0, 
        total_raised: totalRaised, 
        total_commission: totalCommission, 
        pending_commission: pendingCommission 
      });
    } catch (error) { 
      console.error('Error loading my pools:', error); 
    }
  }

  async function loadPendingApprovals() {
    try {
      const [{ data: agents }, { data: vendors }, { data: organizations }] = await Promise.all([
        supabase.from('agents').select('*').eq('is_approved', false).order('created_at', { ascending: false }),
        supabase.from('vendors').select('*, profiles!user_id(full_name, email)').eq('verified', false).order('created_at', { ascending: false }),
        supabase.from('organizations').select('*, profiles!user_id(full_name, email)').eq('verified', false).order('created_at', { ascending: false })
      ]);
      
      if (agents && agents.length > 0) {
        const agentsWithProfiles = await Promise.all(agents.map(async (agent) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', agent.user_id)
            .single();
          return { ...agent, profile };
        }));
        if (isMounted.current) setPendingAgents(agentsWithProfiles || []);
      } else { 
        if (isMounted.current) setPendingAgents([]); 
      }
      
      if (isMounted.current) {
        setPendingVendors(vendors || []);
        setPendingOrganizations(organizations || []);
      }
    } catch (error) { 
      console.error('Error loading pending approvals:', error); 
    }
  }

  async function verifyAgent(agentId, approved, rejectionReason = null) {
    try {
      const { data: agent } = await supabase
        .from('agents')
        .select('user_id, full_name, email')
        .eq('id', agentId)
        .single();
      
      if (approved) {
        await supabase
          .from('agents')
          .update({ 
            is_approved: true, 
            approved_at: new Date().toISOString(), 
            approved_by: user?.id, 
            status: 'active' 
          })
          .eq('id', agentId);
        
        if (agent) {
          await supabase
            .from('notifications')
            .insert({ 
              user_id: agent.user_id, 
              title: '🎉 Agent Application Approved!', 
              message: `Congratulations ${agent.full_name}! Your agent application has been approved.`, 
              type: 'agent_approval', 
              created_at: new Date().toISOString() 
            });
        }
        toast.success('Agent approved successfully');
      } else {
        await supabase
          .from('agents')
          .update({ 
            is_approved: false, 
            status: 'rejected', 
            rejection_reason: rejectionReason, 
            rejected_at: new Date().toISOString() 
          })
          .eq('id', agentId);
        
        if (agent) {
          await supabase
            .from('notifications')
            .insert({ 
              user_id: agent.user_id, 
              title: 'Agent Application Update', 
              message: `Dear ${agent.full_name}, your agent application has been reviewed. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please contact support.'}`, 
              type: 'agent_rejection', 
              created_at: new Date().toISOString() 
            });
        }
        toast.success('Agent rejected');
      }
      await loadPendingApprovals();
      await loadStats();
    } catch (error) { 
      console.error('Agent approval error:', error); 
      toast.error('Failed to process agent application'); 
    }
  }

  async function verifyVendor(vendorId, approved, rejectionReason = null) {
    try {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('user_id, business_name')
        .eq('id', vendorId)
        .single();
      
      if (approved) {
        await supabase
          .from('vendors')
          .update({ 
            verified: true, 
            verified_at: new Date().toISOString(), 
            verified_by: user?.id, 
            status: 'active' 
          })
          .eq('id', vendorId);
        
        await supabase
          .from('profiles')
          .update({ role: 'vendor', user_type: 'vendor' })
          .eq('id', vendor.user_id);
        
        await supabase
          .from('notifications')
          .insert({ 
            user_id: vendor.user_id, 
            title: '🎉 Vendor Application Approved!', 
            message: `Congratulations! Your vendor application for "${vendor.business_name}" has been approved.`, 
            type: 'vendor_approval', 
            created_at: new Date().toISOString() 
          });
        
        toast.success('Vendor approved successfully');
      } else {
        await supabase
          .from('vendors')
          .update({ 
            verified: false, 
            status: 'rejected', 
            rejection_reason: rejectionReason, 
            rejected_at: new Date().toISOString() 
          })
          .eq('id', vendorId);
        
        await supabase
          .from('notifications')
          .insert({ 
            user_id: vendor.user_id, 
            title: 'Vendor Application Update', 
            message: `Your vendor application for "${vendor.business_name}" has been reviewed. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please contact support.'}`, 
            type: 'vendor_rejection', 
            created_at: new Date().toISOString() 
          });
        
        toast.success('Vendor rejected');
      }
      await loadPendingApprovals();
      await loadStats();
    } catch (error) { 
      console.error('Vendor approval error:', error); 
      toast.error('Failed to process vendor application'); 
    }
  }

  async function verifyOrganization(orgId, approved, rejectionReason = null) {
    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('user_id, business_name')
        .eq('id', orgId)
        .single();
      
      if (approved) {
        await supabase
          .from('organizations')
          .update({ 
            verified: true, 
            verified_at: new Date().toISOString(), 
            verified_by: user?.id, 
            status: 'active' 
          })
          .eq('id', orgId);
        
        await supabase
          .from('profiles')
          .update({ role: 'organization', user_type: 'organization' })
          .eq('id', org.user_id);
        
        await supabase
          .from('notifications')
          .insert({ 
            user_id: org.user_id, 
            title: '🎉 Organization Application Approved!', 
            message: `Congratulations! Your organization "${org.business_name}" has been approved.`, 
            type: 'organization_approval', 
            created_at: new Date().toISOString() 
          });
        
        toast.success('Organization approved successfully');
      } else {
        await supabase
          .from('organizations')
          .update({ 
            verified: false, 
            status: 'rejected', 
            rejection_reason: rejectionReason, 
            rejected_at: new Date().toISOString() 
          })
          .eq('id', orgId);
        
        await supabase
          .from('notifications')
          .insert({ 
            user_id: org.user_id, 
            title: 'Organization Application Update', 
            message: `Your organization application for "${org.business_name}" has been reviewed. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please contact support.'}`, 
            type: 'organization_rejection', 
            created_at: new Date().toISOString() 
          });
        
        toast.success('Organization rejected');
      }
      await loadPendingApprovals();
      await loadStats();
    } catch (error) { 
      console.error('Organization approval error:', error); 
      toast.error('Failed to process organization application'); 
    }
  }

  async function loadWithdrawalRequests() {
    try {
      const { data } = await supabase
        .from('withdrawals')
        .select('*, agents!agent_id(full_name, email)')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });
      
      if (isMounted.current) setWithdrawalRequests(data || []);
    } catch (error) { 
      console.error('Error loading withdrawals:', error); 
    }
  }

  async function loadBankTransfers() {
    try {
      const { data } = await supabase
        .from('bank_transfers')
        .select('*, profiles!user_id (id, full_name, email, phone), pools!pool_id (prize_name, target_amount)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (isMounted.current) { 
        setBankTransfers(data || []); 
        setPendingBankTransfers(data?.length || 0); 
      }
    } catch (error) { 
      console.error('Error loading bank transfers:', error); 
    }
  }

  async function loadUsers() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (isMounted.current) setUsers(data || []);
    } catch (error) { 
      console.error('Error loading users:', error); 
    }
  }

  async function loadAllPools() {
    try {
      const { data } = await supabase
        .from('pools')
        .select('*, profiles!created_by(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (isMounted.current) setAllPools(data || []);
    } catch (error) { 
      console.error('Error loading pools:', error); 
    }
  }

  async function loadFeaturedPools() {
    try {
      const { data } = await supabase
        .from('pools')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'active');
      
      if (isMounted.current) setFeaturedPools(data || []);
    } catch (error) { 
      console.error('Error loading featured pools:', error); 
    }
  }

  async function loadCharityData() {
    try {
      const { data } = await supabase
        .from('charity_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (isMounted.current) setCharityTransactions(data || []);
    } catch (error) { 
      console.error('Error loading charity data:', error); 
    }
  }

  async function loadDisputes() {
    try {
      const { data } = await supabase
        .from('disputes')
        .select('*, pool:pools(prize_name), user:profiles(full_name)')
        .eq('status', 'pending');
      
      if (isMounted.current) setDisputes(data || []);
    } catch (error) { 
      console.error('Error loading disputes:', error); 
    }
  }

  async function loadRecentActivity() {
    try {
      const [{ data: recentUsers }, { data: recentPools }, { data: recentAgents }] = await Promise.all([
        supabase.from('profiles').select('full_name, email, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('pools').select('prize_name, status, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('agents').select('full_name, business_name, created_at').eq('is_approved', false).order('created_at', { ascending: false }).limit(3)
      ]);
      
      const activities = [];
      (recentUsers || []).forEach(u => { 
        activities.push({ action: `New user registered: ${u.full_name || u.email}`, date: u.created_at, icon: '👤' }); 
      });
      (recentPools || []).forEach(p => { 
        activities.push({ action: `New pool created: "${p.prize_name}" (${p.status})`, date: p.created_at, icon: '🏊' }); 
      });
      (recentAgents || []).forEach(a => { 
        activities.push({ action: `New agent application: ${a.full_name} - ${a.business_name}`, date: a.created_at, icon: '🤝' }); 
      });
      
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      if (isMounted.current) setRecentActivity(activities.slice(0, 5));
    } catch (error) { 
      console.error('Error loading recent activity:', error); 
    }
  }

  async function processWithdrawal(requestId, approved) {
    try {
      await supabase
        .from('withdrawals')
        .update({ 
          status: approved ? 'completed' : 'rejected', 
          processed_at: new Date().toISOString(), 
          processed_by: user?.id 
        })
        .eq('id', requestId);
      
      toast.success(`Withdrawal ${approved ? 'approved' : 'rejected'}`);
      loadWithdrawalRequests();
    } catch (error) { 
      toast.error('Failed'); 
    }
  }

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

  async function resolveDispute(disputeId, resolution) {
    try {
      await supabase
        .from('disputes')
        .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolution_notes: resolution })
        .eq('id', disputeId);
      
      toast.success('Dispute resolved');
      loadDisputes();
    } catch (error) { 
      toast.error('Failed'); 
    }
  }

  async function updateUserRole(userId, newRole) {
    try {
      await supabase
        .from('profiles')
        .update({ role: newRole, user_type: newRole })
        .eq('id', userId);
      
      toast.success('User role updated');
      loadUsers();
      loadStats();
    } catch (error) { 
      toast.error('Failed'); 
    }
  }

  async function toggleUserBan(userId, isBanned) {
    try {
      await supabase
        .from('profiles')
        .update({ is_banned: !isBanned, banned_at: !isBanned ? new Date() : null })
        .eq('id', userId);
      
      toast.success(`User ${!isBanned ? 'banned' : 'unbanned'}`);
      loadUsers();
    } catch (error) { 
      toast.error('Failed'); 
    }
  }

  async function togglePoolStatus(poolId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await supabase
        .from('pools')
        .update({ status: newStatus })
        .eq('id', poolId);
      
      toast.success(`Pool ${newStatus === 'active' ? 'activated' : 'paused'}`);
      loadAllPools();
      loadStats();
    } catch (error) { 
      toast.error('Failed'); 
    }
  }

  async function toggleFeaturedPool(poolId, isFeatured) {
    try {
      await supabase
        .from('pools')
        .update({ is_featured: !isFeatured })
        .eq('id', poolId);
      
      toast.success(`Pool ${!isFeatured ? 'featured' : 'removed'}`);
      loadAllPools();
      loadFeaturedPools();
    } catch (error) { 
      toast.error('Failed'); 
    }
  }

  async function deletePool(poolId) {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    try {
      await supabase
        .from('pools')
        .delete()
        .eq('id', poolId);
      
      toast.success('Pool deleted');
      loadAllPools();
      loadStats();
      loadMyPools();
    } catch (error) { 
      toast.error('Failed'); 
    }
  }

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
      
      await supabase
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
        });
      
      toast.success(`${config.name} pool created successfully!`);
      setShowMerkatoModal(false);
      setNewMerkatoPool({ tier: 'daily', contribution_amount: 500, prize_amount: 1000000, draw_time: '20:00' });
      await loadMerkatoData();
    } catch (error) { 
      console.error('Create Merkato pool error:', error); 
      toast.error('Failed to create pool'); 
    } finally { 
      setLoading(false); 
    }
  }

  async function updateMerkatoPool() {
    if (!editMerkatoData.id) { 
      toast.error('No pool selected'); 
      return; 
    }
    
    setLoading(true);
    try {
      await supabase
        .from('merkato_vip_pools')
        .update({ 
          contribution_amount: editMerkatoData.contribution_amount, 
          prize_amount: editMerkatoData.prize_amount, 
          draw_time: editMerkatoData.draw_time, 
          name: editMerkatoData.name, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', editMerkatoData.id);
      
      toast.success('Merkato pool updated successfully!');
      setShowEditMerkatoModal(false);
      setEditingMerkatoPool(null);
      await loadMerkatoData();
    } catch (error) { 
      console.error('Update Merkato pool error:', error); 
      toast.error('Failed to update pool'); 
    } finally { 
      setLoading(false); 
    }
  }

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

  async function createAnnouncement() {
    if (!newAnnouncement.title || !newAnnouncement.content) { 
      toast.error('Please fill all fields'); 
      return; 
    }
    
    try {
      await supabase
        .from('announcements')
        .insert({ 
          title: newAnnouncement.title, 
          content: newAnnouncement.content, 
          target_audience: newAnnouncement.target_audience, 
          created_by: user?.id, 
          is_active: true 
        });
      
      toast.success('Announcement created');
      setShowAnnouncementModal(false);
      setNewAnnouncement({ title: '', content: '', target_audience: 'all' });
    } catch (error) { 
      toast.error('Failed'); 
    }
  }

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
    try {
      await supabase
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
    } catch (error) { 
      toast.error('Failed to create pool'); 
    } finally { 
      setLoading(false); 
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
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
              <div className="relative">
                <button className="bg-white/20 px-3 py-2 rounded-full text-sm flex items-center gap-2">
                  🔔 {unreadNotifications > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                {notifications.length > 0 && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b font-semibold text-gray-800">Notifications</div>
                    {notifications.slice(0, 10).map(n => (
                      <div 
                        key={n.id} 
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`} 
                        onClick={() => markNotificationRead(n.id)}
                      >
                        <p className="font-medium text-sm text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-500">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Link href="/admin/draw" className="bg-white text-red-600 px-4 py-2 rounded-full font-semibold text-sm">🎲 Draw Management</Link>
              <button onClick={() => setRegularModalMode('create')} className="bg-white text-red-600 px-4 py-2 rounded-full font-semibold text-sm">+ Create Pool (20%)</button>
              <button onClick={() => setShowMerkatoModal(true)} className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-full font-semibold text-sm">🏪 Create Merkato VIP Pool</button>
              <Link href="/dashboard" className="bg-white/20 px-4 py-2 rounded-full text-sm">Home</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Role Description */}
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
          <button onClick={() => setRegularModalMode('create')} className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">➕</div>
            <p className="font-semibold text-xs">Create Pool</p>
            <p className="text-xs opacity-80">20%</p>
          </button>
          <button onClick={() => setShowMerkatoModal(true)} className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">🏪</div>
            <p className="font-semibold text-xs">Merkato VIP</p>
            <p className="text-xs opacity-80">1M/10M/40M</p>
          </button>
          <button onClick={() => setActiveTab('city-vip')} className="bg-gradient-to-r from-gray-600 to-gray-800 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">🏙️</div>
            <p className="font-semibold text-xs">City VIP</p>
            <p className="text-xs opacity-80">Manage</p>
          </button>
          <button onClick={() => setActiveTab('approvals')} className="bg-yellow-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">📝</div>
            <p className="font-semibold text-xs">Approvals</p>
            <p className="text-xs opacity-80">{pendingAgents.length + pendingVendors.length + pendingOrganizations.length}</p>
          </button>
          <button onClick={() => setActiveTab('withdrawals')} className="bg-green-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">💰</div>
            <p className="font-semibold text-xs">Withdrawals</p>
            <p className="text-xs opacity-80">{withdrawalRequests.length}</p>
          </button>
          <button onClick={() => setActiveTab('bank-transfers')} className="bg-blue-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">🏦</div>
            <p className="font-semibold text-xs">Bank Transfers</p>
            <p className="text-xs opacity-80">{pendingBankTransfers}</p>
          </button>
          <button onClick={() => setActiveTab('disputes')} className="bg-orange-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">⚖️</div>
            <p className="font-semibold text-xs">Disputes</p>
            <p className="text-xs opacity-80">{disputes.length}</p>
          </button>
          <button onClick={() => setShowAnnouncementModal(true)} className="bg-purple-600 text-white p-3 rounded-xl text-center hover:shadow-lg transition">
            <div className="text-2xl mb-1">📢</div>
            <p className="font-semibold text-xs">Announce</p>
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
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{activity.action}</p>
                        <p className="text-xs text-gray-400">{new Date(activity.date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Pools Tab */}
        {activeTab === 'my-pools' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">💰 My Personal Pools (20% Commission)</h2>
              <button onClick={() => setRegularModalMode('create')} className="bg-red-600 text-white px-4 py-1 rounded-full text-sm">+ Create</button>
            </div>
            <div className="p-6">
              {myPools.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No pools created yet</p>
                  <button onClick={() => setRegularModalMode('create')} className="mt-2 text-red-600">Create your first pool →</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">Prize</th>
                        <th className="px-4 py-3 text-left">Target</th>
                        <th className="px-4 py-3 text-left">Raised</th>
                        <th className="px-4 py-3 text-left">Your 20%</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Action</th>
                      </tr>
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

        {/* Merkato VIP Tab */}
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
                      const colors = pool.tier === 'daily' ? 'from-yellow-500 to-orange-600' : pool.tier === 'weekly' ? 'from-purple-500 to-pink-600' : 'from-green-600 to-teal-700';
                      const icon = pool.tier === 'daily' ? '⭐' : pool.tier === 'weekly' ? '🏆' : '👑';
                      return (
                        <div key={pool.id} className={`bg-gradient-to-r ${colors} rounded-lg p-4 text-white`}>
                          <div className="flex justify-between items-center flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{icon}</span>
                              <div>
                                <div className="font-bold text-lg">{pool.name}</div>
                                <div className="text-xs opacity-90">{pool.tier === 'daily' ? 'Daily (1M)' : pool.tier === 'weekly' ? 'Weekly (10M)' : 'Monthly (40M)'}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center text-sm">
                              <div><p className="text-xs opacity-75">Entry Fee</p><p className="font-bold">ETB {pool.contribution_amount?.toLocaleString()}</p></div>
                              <div><p className="text-xs opacity-75">Prize</p><p className="font-bold">ETB {pool.prize_amount?.toLocaleString()}</p></div>
                              <div><p className="text-xs opacity-75">Total Seats</p><p className="font-bold">{Math.floor((pool.prize_amount * 1.2) / pool.contribution_amount).toLocaleString()}</p></div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setSelectedMerkatoData(pool); setMerkatoModalMode('edit'); }} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm transition">✏️ Edit</button>
                              <Link href={`/admin/draw-winner?pool=${pool.id}`} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">Draw Winner</Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* City VIP Tab */}
        {activeTab === 'city-vip' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl p-4 text-white text-center"><p className="text-2xl font-bold">{cityVipParticipants.length}</p><p className="text-sm opacity-90">Total Participants</p></div>
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl p-4 text-white text-center"><p className="text-2xl font-bold">{cityVipPools.length}</p><p className="text-sm opacity-90">Active Cities</p></div>
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl p-4 text-white text-center"><p className="text-2xl font-bold">ETB {cityVipParticipants.reduce((sum, p) => sum + (p.contribution_amount || 0), 0).toLocaleString()}</p><p className="text-sm opacity-90">Total Collected</p></div>
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-4 text-white text-center"><p className="text-2xl font-bold">{cityVipParticipants.filter(p => p.payment_status === 'pending_verification').length}</p><p className="text-sm opacity-90">Pending Verify</p></div>
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-4 text-white text-center"><p className="text-2xl font-bold">{cityVipParticipants.filter(p => p.pool_type === 'daily' && p.payment_status === 'verified').length}</p><p className="text-sm opacity-90">Daily</p></div>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-white text-center"><p className="text-2xl font-bold">{cityVipParticipants.filter(p => p.pool_type === 'monthly' && p.payment_status === 'verified').length}</p><p className="text-sm opacity-90">Monthly</p></div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 flex justify-between items-center flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by City</label>
                <select value={selectedCityFilter} onChange={(e) => setSelectedCityFilter(e.target.value)} className="w-full md:w-64 border rounded-lg px-3 py-2">
                  <option value="all">All Cities ({cityVipParticipants.length})</option>
                  {cityVipPools.map(pool => (
                    <option key={pool.city} value={pool.city}>{pool.city} ({pool.total_participants} participants)</option>
                  ))}
                </select>
              </div>
              <button onClick={() => setCityModalMode('create')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">➕ Create New City VIP</button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="font-bold text-lg">🏙️ City VIP Participants</h2></div>
              <div className="p-4">
                {cityVipParticipants.length === 0 ? (
                  <div className="text-center py-12"><div className="text-5xl mb-3">🏙️</div><p className="text-gray-400">No City VIP participants yet</p></div>
                ) : (
                  <div className="space-y-4">
                    {cityVipParticipants.filter(p => selectedCityFilter === 'all' || p.city === selectedCityFilter).map((participant) => {
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
                                {isVerified ? <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✓ Verified</span> : isPending ? <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">⏳ Pending</span> : <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">Pending Payment</span>}
                              </div>
                              <p className="text-sm font-medium">{participant.user_name}</p>
                              <p className="text-sm text-gray-500">{participant.user_email}</p>
                              <p className="text-sm">Seats: <span className="font-mono">{participant.seat_numbers?.join(', ')}</span></p>
                              <p className="text-sm font-semibold text-green-600">Amount: ETB {participant.contribution_amount?.toLocaleString()}</p>
                              <p className="text-xs text-gray-400">Ticket: {participant.ticket_number}</p>
                              <p className="text-xs text-gray-400">Submitted: {new Date(participant.created_at).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                              {participant.payment_proof_url && (
                                <button onClick={() => window.open(participant.payment_proof_url, '_blank')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">📸 View Proof</button>
                              )}
                              {isPending && (
                                <>
                                  <button onClick={() => verifyCityVipPayment(participant.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">✅ Approve</button>
                                  <button onClick={() => verifyCityVipPayment(participant.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">❌ Reject</button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

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
                      <button onClick={() => { const cityConfig = cityVipConfigs.find(c => c.city_id === pool.city.toLowerCase().replace(/\s/g, '-')); setSelectedCityData(cityConfig || pool); setCityModalMode('edit'); }} className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700">✏️ Edit</button>
                      <button onClick={() => { const cityConfig = cityVipConfigs.find(c => c.city_id === pool.city.toLowerCase().replace(/\s/g, '-')); setSelectedCityData(cityConfig || pool); setCityModalMode('delete'); }} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">🗑️ Delete</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Participants:</span><span className="font-semibold">{pool.total_participants}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Verified:</span><span className="font-semibold text-green-600">{pool.verified_participants || 0}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Pending Verify:</span><span className="font-semibold text-yellow-600">{pool.pending_verification}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Total Collected:</span><span className="font-semibold text-green-600">ETB {pool.total_collected.toLocaleString()}</span></div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex gap-2">
                    <button onClick={() => drawCityVipWinner(pool.city, 'daily')} disabled={drawingCityWinner || (pool.verified_participants || 0) === 0} className="flex-1 bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700 disabled:opacity-50">⭐ Daily Draw</button>
                    <button onClick={() => drawCityVipWinner(pool.city, 'weekly')} disabled={drawingCityWinner || (pool.verified_participants || 0) === 0} className="flex-1 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 disabled:opacity-50">🏆 Weekly Draw</button>
                    <button onClick={() => drawCityVipWinner(pool.city, 'monthly')} disabled={drawingCityWinner || (pool.verified_participants || 0) === 0} className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50">👑 Monthly Draw</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">🤝 Pending Agent Applications ({pendingAgents.length})</h3>
                <span className="text-xs text-gray-500">Requires Digital ID & Business License</span>
              </div>
              {pendingAgents.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No pending agent applications</p>
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
                            <p><span className="text-gray-500">TIN Number:</span> {agent.tin_number || 'N/A'}</p>
                            <p><span className="text-gray-500">Business Address:</span> {agent.business_address || 'N/A'}</p>
                            <p><span className="text-gray-500">Applied:</span> {new Date(agent.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {agent.digital_id_url && (
                              <button onClick={() => { setViewingDocument(agent.digital_id_url); setShowDocumentModal(true); }} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">📄 View Digital ID</button>
                            )}
                            {agent.business_license_url && (
                              <button onClick={() => { setViewingDocument(agent.business_license_url); setShowDocumentModal(true); }} className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700">📜 View Business License</button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => verifyAgent(agent.id, true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">✅ Approve</button>
                          <button onClick={() => { const reason = prompt('Enter rejection reason (optional):'); verifyAgent(agent.id, false, reason); }} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">❌ Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">🏪 Pending Vendor Applications ({pendingVendors.length})</h3>
                <span className="text-xs text-gray-500">Requires Business License</span>
              </div>
              {pendingVendors.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No pending vendor applications</p>
              ) : (
                <div className="space-y-4">
                  {pendingVendors.map(vendor => (
                    <div key={vendor.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl">🏪</span>
                            <div>
                              <p className="font-semibold text-lg">{vendor.business_name}</p>
                              <p className="text-sm text-gray-500">{vendor.profiles?.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <p><span className="text-gray-500">Business Type:</span> {vendor.business_type || 'N/A'}</p>
                            <p><span className="text-gray-500">TIN:</span> {vendor.tin || 'N/A'}</p>
                            <p><span className="text-gray-500">Phone:</span> {vendor.phone || 'N/A'}</p>
                            <p><span className="text-gray-500">Address:</span> {vendor.address || 'N/A'}</p>
                            <p><span className="text-gray-500">Applied:</span> {new Date(vendor.created_at).toLocaleDateString()}</p>
                          </div>
                          {vendor.business_license_url && (
                            <button onClick={() => { setViewingDocument(vendor.business_license_url); setShowDocumentModal(true); }} className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700">📜 View Business License</button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => verifyVendor(vendor.id, true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">✅ Approve</button>
                          <button onClick={() => { const reason = prompt('Enter rejection reason (optional):'); verifyVendor(vendor.id, false, reason); }} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">❌ Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">🏢 Pending Organization Applications ({pendingOrganizations.length})</h3>
                <span className="text-xs text-gray-500">Requires Registration Document</span>
              </div>
              {pendingOrganizations.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No pending organization applications</p>
              ) : (
                <div className="space-y-4">
                  {pendingOrganizations.map(org => (
                    <div key={org.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl">🏢</span>
                            <div>
                              <p className="font-semibold text-lg">{org.business_name}</p>
                              <p className="text-sm text-gray-500">{org.profiles?.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <p><span className="text-gray-500">Organization Type:</span> {org.organization_type || 'N/A'}</p>
                            <p><span className="text-gray-500">Registration No:</span> {org.registration_number || 'N/A'}</p>
                            <p><span className="text-gray-500">TIN:</span> {org.tin || 'N/A'}</p>
                            <p><span className="text-gray-500">Phone:</span> {org.phone || 'N/A'}</p>
                            <p><span className="text-gray-500">Address:</span> {org.address || 'N/A'}</p>
                            <p><span className="text-gray-500">Applied:</span> {new Date(org.created_at).toLocaleDateString()}</p>
                          </div>
                          {org.registration_document_url && (
                            <button onClick={() => { setViewingDocument(org.registration_document_url); setShowDocumentModal(true); }} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">📄 View Registration Document</button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => verifyOrganization(org.id, true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">✅ Approve</button>
                          <button onClick={() => { const reason = prompt('Enter rejection reason (optional):'); verifyOrganization(org.id, false, reason); }} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">❌ Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
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

        {/* Bank Transfers Tab */}
        {activeTab === 'bank-transfers' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="font-bold text-lg">🏦 Bank Transfer Verification</h2></div>
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
                        <div className="flex gap-2">
                          {transfer.proof_image && (
                            <button onClick={() => window.open(transfer.proof_image, '_blank')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">📸 View Proof</button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4 pt-3 border-t">
                        <button onClick={() => verifyBankTransfer(transfer.id, transfer.user_id, transfer.pool_id, transfer.amount, transfer.seat_numbers, true)} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold">✅ Approve & Confirm Seats</button>
                        <button onClick={() => verifyBankTransfer(transfer.id, transfer.user_id, transfer.pool_id, transfer.amount, transfer.seat_numbers, false)} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold">❌ Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-500">Total Volume</h3>
                <p className="text-3xl font-bold text-green-600">ETB {stats.total_volume.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-500">Platform Revenue (10%)</h3>
                <p className="text-3xl font-bold text-blue-600">ETB {stats.platform_revenue.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-6 text-white">
                <h3 className="font-bold">Charity Fund (2%)</h3>
                <p className="text-3xl font-bold">ETB {Math.floor(stats.charity_total).toLocaleString()}</p>
                <p className="text-sm">Lives Impacted: {stats.lives_impacted}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">💚 Charity Transaction History</h3>
              {charityTransactions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No charity transactions yet</p>
              ) : (
                charityTransactions.map(t => (
                  <div key={t.id} className="border-b py-3 flex justify-between">
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    <span className="font-bold text-green-600">ETB {t.amount?.toLocaleString()}</span>
                    <span className="text-gray-500">{t.source}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="font-bold text-lg">👥 User Management</h2></div>
            <div className="overflow-x-auto p-4">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{u.full_name || 'N/A'}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">
                        <select onChange={(e) => updateUserRole(u.id, e.target.value)} defaultValue={u.role || 'individual'} className="border rounded px-2 py-1 text-sm">
                          <option value="individual">Individual</option>
                          <option value="agent">Agent</option>
                          <option value="vendor">Vendor</option>
                          <option value="organization">Organization</option>
                          <option value="admin">Admin</option>
                        </select>
                       </td>
                      <td className="px-4 py-3">
                        {u.is_banned ? <span className="text-red-600 font-medium">Banned</span> : <span className="text-green-600">Active</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleUserBan(u.id, u.is_banned)} className={`px-3 py-1 rounded text-xs ${u.is_banned ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                          {u.is_banned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Pools Tab */}
        {activeTab === 'pools' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b"><h2 className="font-bold text-lg">🌊 All Platform Pools</h2></div>
            <div className="overflow-x-auto p-4">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Prize</th>
                    <th className="px-4 py-3 text-left">Creator</th>
                    <th className="px-4 py-3 text-left">Target</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Featured</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
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

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            {disputes.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <p className="text-gray-400">✅ No pending disputes</p>
              </div>
            ) : (
              disputes.map(d => (
                <div key={d.id} className="bg-white rounded-xl shadow-md p-6">
                  <p className="font-bold text-lg">Pool: {d.pool?.prize_name}</p>
                  <p className="text-gray-600">Filed by: {d.user?.full_name}</p>
                  <p className="mt-2">{d.description}</p>
                  <textarea 
                    id={`res-${d.id}`} 
                    placeholder="Enter resolution notes..." 
                    className="w-full border rounded-lg p-2 mt-3"
                  ></textarea>
                  <button 
                    onClick={() => resolveDispute(d.id, document.getElementById(`res-${d.id}`).value)} 
                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Resolve Dispute
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-xl mb-4">⚙️ Platform Settings</h2>
            <button onClick={() => setShowAnnouncementModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg">
              📢 Create Announcement
            </button>
            <div className="mt-6 pt-6 border-t">
              <Link href="/admin/analytics" className="text-blue-600 hover:underline">📊 View Full Analytics →</Link>
            </div>
            <div className="mt-4">
              <Link href="/admin/logs" className="text-blue-600 hover:underline">📜 View System Logs →</Link>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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

      {/* UNIFIED MODALS - REPLACES THE THREE OLD MODALS */}
      
      {/* City VIP Modal - Unified (Create, Edit, Delete) */}
      <CityVipModal
        isOpen={cityModalMode !== null}
        onClose={() => { setCityModalMode(null); setSelectedCityData(null); }}
        onSuccess={() => { loadCityVipData(); loadCityVipConfigs(); loadStats(); }}
        mode={cityModalMode}
        cityData={selectedCityData}
        userId={user?.id}
      />

      {/* Merkato VIP Modal - Unified (Create, Edit, Delete) */}
      <MerkatoVipModal
        isOpen={merkatoModalMode !== null}
        onClose={() => { setMerkatoModalMode(null); setSelectedMerkatoData(null); }}
        onSuccess={() => { loadMerkatoData(); loadStats(); }}
        mode={merkatoModalMode}
        poolData={selectedMerkatoData}
        userId={user?.id}
      />

      {/* Regular Pool Modal - Unified (Create, Edit, Delete) */}
      <RegularPoolModal
        isOpen={regularModalMode !== null}
        onClose={() => { setRegularModalMode(null); setSelectedRegularData(null); }}
        onSuccess={() => { loadAllPools(); loadFeaturedPools(); loadStats(); loadMyPools(); }}
        mode={regularModalMode}
        poolData={selectedRegularData}
        userId={user?.id}
      />

      {/* Keep these for backward compatibility with existing code that might still use them */}
      {/* These are hidden - the unified modals above handle everything */}
      <div style={{ display: 'none' }}>
        <CreateCityVipModal isOpen={false} />
        <EditCityVipModal isOpen={false} />
        <CreateRegularPoolModal isOpen={false} />
      </div>
      
      {/* Keep existing modals that are still needed */}
      {showPoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold">✨ Create Featured Pool (20% Commission)</h2>
              <button onClick={() => setShowPoolModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
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

      {showMerkatoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold">🏪 Create Merkato VIP Pool</h2>
              <button onClick={() => setShowMerkatoModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-5">
              <div><label className="block text-sm font-medium mb-2">Select Tier</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(tierConfig).map(([key, config]) => (
                    <button key={key} onClick={() => setNewMerkatoPool({...newMerkatoPool, tier: key, contribution_amount: config.contribution, prize_amount: config.prize})} className={`p-3 rounded-xl text-center transition ${newMerkatoPool.tier === key ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700'}`}>
                      <div className="text-2xl">{config.icon}</div>
                      <div className="font-bold text-xs">{config.name}</div>
                      <div className="text-xs">{config.prize.toLocaleString()} ETB</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4"><div className="flex justify-between mb-2"><span>Entry Fee:</span><span className="font-bold">{newMerkatoPool.contribution_amount.toLocaleString()} ETB</span></div><div className="flex justify-between mb-2"><span>Prize:</span><span className="font-bold text-green-600">{newMerkatoPool.prize_amount.toLocaleString()} ETB</span></div><div className="flex justify-between"><span>Winner:</span><span>1 Lucky Winner</span></div></div>
              <div><label className="block text-sm font-medium mb-2">Draw Time (Ethiopia Time)</label><input type="time" className="w-full border rounded-lg p-3" value={newMerkatoPool.draw_time} onChange={(e) => setNewMerkatoPool({...newMerkatoPool, draw_time: e.target.value})} /></div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm"><p className="font-semibold">📝 Pool Rules:</p><ul className="text-xs mt-1 space-y-1"><li>• Daily: 500 ETB entry → Win 1,000,000 ETB</li><li>• Weekly: 2,500 ETB entry → Win 10,000,000 ETB</li><li>• Monthly: 5,000 ETB entry → Win 40,000,000 ETB</li></ul></div>
              <div className="flex gap-3 pt-4"><button onClick={createMerkatoPool} disabled={loading} className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">{loading ? 'Creating...' : '✨ Create Merkato Pool'}</button><button onClick={() => setShowMerkatoModal(false)} className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50">Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      {showEditMerkatoModal && editingMerkatoPool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold">✏️ Edit Merkato VIP Pool</h2>
              <button onClick={() => setShowEditMerkatoModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-100 rounded-xl p-4 text-center"><p className="font-bold">{editingMerkatoPool.name}</p><p className="text-xs text-gray-500">{editingMerkatoPool.tier === 'daily' ? 'Daily Millionaire' : editingMerkatoPool.tier === 'weekly' ? 'Weekly Mega Winner' : 'Monthly Winner'}</p></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Pool Name</label><input type="text" value={editMerkatoData.name} onChange={(e) => setEditMerkatoData({...editMerkatoData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee (ETB)</label><input type="number" value={editMerkatoData.contribution_amount} onChange={(e) => setEditMerkatoData({...editMerkatoData, contribution_amount: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Prize Amount (ETB)</label><input type="number" value={editMerkatoData.prize_amount} onChange={(e) => setEditMerkatoData({...editMerkatoData, prize_amount: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2" /></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Draw Time</label><input type="datetime-local" value={editMerkatoData.draw_time} onChange={(e) => setEditMerkatoData({...editMerkatoData, draw_time: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              <div className="flex gap-3 pt-4"><button onClick={updateMerkatoPool} disabled={loading} className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-2 rounded-lg font-semibold">{loading ? 'Saving...' : '💾 Save Changes'}</button><button onClick={() => setShowEditMerkatoModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg">Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Create Announcement</h3>
            <input type="text" placeholder="Title" className="w-full border rounded-lg p-2 mb-3" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
            <textarea placeholder="Content" rows="4" className="w-full border rounded-lg p-2 mb-3" value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}></textarea>
            <select className="w-full border rounded-lg p-2 mb-4" value={newAnnouncement.target_audience} onChange={(e) => setNewAnnouncement({...newAnnouncement, target_audience: e.target.value})}>
              <option value="all">All Users</option>
              <option value="agents">Agents</option>
              <option value="vendors">Vendors</option>
              <option value="individuals">Individuals</option>
            </select>
            <div className="flex gap-3">
              <button onClick={createAnnouncement} className="flex-1 bg-blue-600 text-white py-2 rounded-lg">Publish</button>
              <button onClick={() => setShowAnnouncementModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
