// pages/dashboard.js - Complete Dashboard with Simplified Profile Creation
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import PoolCard from '../components/PoolCard';
import LoadingSpinner from '../components/LoadingSpinner';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';
import GlobalAnnouncement from '../components/GlobalAnnouncement';
import TicketImage from '../components/TicketImage';
import TicketStats from '../components/TicketStats';
import NotificationCenter from '../components/NotificationCenter';
import ReferralSystem from '../components/ReferralSystem';
import ActivityLog from '../components/ActivityLog';
import WinnerAnnouncement from '../components/WinnerAnnouncement';

export async function getServerSideProps() {
  return { props: {} };
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [agentData, setAgentData] = useState(null);
  const [showReferral, setShowReferral] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState(null);
  const [is3D, setIs3D] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef(null);
  const isMounted = useRef(true);
  
  const [stats, setStats] = useState({ 
    totalSpent: 0, 
    totalWon: 0, 
    activeEntries: 0, 
    winRate: 0, 
    loyaltyPoints: 0 
  });
  const [activePools, setActivePools] = useState([]);
  const [myEntries, setMyEntries] = useState([]);
  const [myWins, setMyWins] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [badges, setBadges] = useState([]);
  const [language, setLanguage] = useState('am');
  
  // Ticket states for ALL THREE types
  const [regularTickets, setRegularTickets] = useState([]);
  const [merkatoTickets, setMerkatoTickets] = useState([]);
  const [cityTickets, setCityTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  
  const [isTelegramUser, setIsTelegramUser] = useState(false);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (is3D) {
      const animate = () => {
        setRotation(prev => (prev + 0.1) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [is3D]);

  useEffect(() => {
    checkUser();
    
    return () => {
      isMounted.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const toggle3D = () => {
    setIs3D(!is3D);
  };

  const get3DTransform = () => {
    if (!is3D) return 'none';
    if (isHovered) {
      return `perspective(800px) rotateY(${rotation}deg) scale(1.01)`;
    }
    return `perspective(800px) rotateY(${rotation}deg)`;
  };

  // ============================================
  // CHECK USER - SIMPLIFIED VERSION
  // ============================================
  async function checkUser() {
    try {
      console.log('🔍 Checking user authentication...');
      
      // ✅ STEP 1: Check for Telegram session
      const telegramToken = sessionStorage.getItem('telegram_session_token');
      const telegramUserStr = sessionStorage.getItem('telegram_user');
      
      console.log('📱 Telegram token exists:', !!telegramToken);
      console.log('📱 Telegram user exists:', !!telegramUserStr);
      
      if (telegramToken && telegramUserStr) {
        try {
          const telegramUser = JSON.parse(telegramUserStr);
          console.log('📱 Telegram user data:', telegramUser);
          
          const userId = telegramUser.id || telegramUser.userId || telegramUser.telegram_id;
          
          if (!userId) {
            console.error('❌ No user ID found');
            router.push('/login');
            return;
          }
          
          // ✅ Set user state
          setIsTelegramUser(true);
          setUser({ 
            id: userId,
            email: telegramUser.email || `${userId}@telegram.user`,
            user_metadata: { 
              full_name: telegramUser.full_name || 'Telegram User' 
            }
          });
          
          // ✅ Check if profile exists
          let { data: profile, error: findError } = await supabase
            .from('profiles')
            .select('*')
            .eq('telegram_id', userId)
            .maybeSingle();
          
          // If not found by telegram_id, try by id
          if (!profile) {
            const { data: profileById } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle();
            profile = profileById;
          }
          
          if (profile) {
            console.log('✅ Profile found:', profile);
            setProfile(profile);
            
            // Load dashboard data
            await loadDashboardData(profile.id);
            await loadRecentActivities(profile.id);
            await loadUserTickets(profile.id);
            
            setLoading(false);
            return;
          }
          
          // ✅ Create new profile - SIMPLIFIED APPROACH
          console.log('👤 Creating new profile...');
          
          // Insert profile with minimal required fields
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: telegramUser.email || `${userId}@telegram.user`,
              full_name: telegramUser.full_name || 'Telegram User',
              role: 'individual',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('❌ Insert error:', insertError);
            
            // Try upsert as fallback
            const { data: upsertProfile, error: upsertError } = await supabase
              .from('profiles')
              .upsert({
                id: userId,
                email: telegramUser.email || `${userId}@telegram.user`,
                full_name: telegramUser.full_name || 'Telegram User',
                role: 'individual',
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
            
            if (upsertError) {
              console.error('❌ Upsert also failed:', upsertError);
              toast.error('Failed to create profile. Please contact support.');
              router.push('/login');
              return;
            }
            
            console.log('✅ Profile created via upsert:', upsertProfile);
            setProfile(upsertProfile);
            
            await loadDashboardData(upsertProfile.id);
            await loadRecentActivities(upsertProfile.id);
            await loadUserTickets(upsertProfile.id);
            
            setLoading(false);
            return;
          }
          
          console.log('✅ Profile created successfully:', newProfile);
          setProfile(newProfile);
          
          await loadDashboardData(newProfile.id);
          await loadRecentActivities(newProfile.id);
          await loadUserTickets(newProfile.id);
          
          setLoading(false);
          return;
          
        } catch (error) {
          console.error('❌ Telegram user error:', error);
          // Fall through to regular auth
        }
      }
      
      // ✅ STEP 2: Regular Supabase auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        console.log('❌ No session, redirecting to login');
        router.push('/login');
        return;
      }
      
      console.log('✅ Supabase user:', session.user.id);
      setUser(session.user);
      setIsTelegramUser(false);
      
      // Check if user is an agent
      const { data: agentInfo } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_approved', true)
        .single();
      
      if (agentInfo) {
        setIsAgent(true);
        setAgentData(agentInfo);
      }
      
      // Get or create profile
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (!profile) {
        // Create profile for regular user
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            role: 'individual',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (!createError && newProfile) {
          profile = newProfile;
        }
      }
      
      setProfile(profile || {});
      
      if (profile && profile.agreement_accepted !== true) {
        router.push('/login');
        return;
      }
      
      await loadDashboardData(session.user.id);
      await loadRecentActivities(session.user.id);
      await loadUserTickets(session.user.id);
      
    } catch (error) {
      console.error('❌ Check user error:', error);
      toast.error('Failed to load dashboard');
      router.push('/login');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  // ============================================
  // LOAD USER TICKETS
  // ============================================
  async function loadUserTickets(userId) {
    try {
      console.log('🎫 Loading tickets for user:', userId);
      
      // 1. Load Regular Pool tickets
      const { data: regularData, error: regularError } = await supabase
        .from('regular_pool_participants')
        .select('*, pools:pool_id(prize_name, target_amount, end_date)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (!regularError && regularData) {
        console.log('✅ Regular tickets loaded:', regularData.length);
        setRegularTickets(regularData);
      }
      
      // 2. Load Merkato VIP tickets
      const { data: merkatoData, error: merkatoError } = await supabase
        .from('merkato_vip_participants')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (!merkatoError && merkatoData) {
        console.log('✅ Merkato tickets loaded:', merkatoData.length);
        setMerkatoTickets(merkatoData);
      }
      
      // 3. Load City VIP tickets
      const { data: cityData, error: cityError } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (!cityError && cityData) {
        console.log('✅ City tickets loaded:', cityData.length);
        setCityTickets(cityData);
      }
      
    } catch (error) {
      console.error('❌ Error loading tickets:', error);
    }
  }

  // ============================================
  // LOAD DASHBOARD DATA
  // ============================================
  async function loadDashboardData(userId) {
    try {
      const { data: contributions, error: contribError } = await supabase
        .from('contributions')
        .select(`
          amount,
          pool_id,
          status,
          created_at,
          pools:pool_id (
            id,
            name,
            prize_name,
            target_amount,
            entry_fee,
            contribution_amount,
            status,
            winner_id
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (contribError) throw contribError;
      
      const totalSpent = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      
      const activeEntriesMap = new Map();
      contributions?.forEach(c => {
        if (c.pools && c.pools.status === 'active') {
          const entryFee = c.pools.entry_fee || c.pools.contribution_amount || 10;
          const totalCollection = c.pools.target_amount * 1.2;
          const totalSeats = Math.floor(totalCollection / entryFee);
          
          if (!activeEntriesMap.has(c.pool_id)) {
            activeEntriesMap.set(c.pool_id, { 
              pool: c.pools, 
              totalAmount: c.amount,
              joinedDate: c.created_at,
              entryFee: entryFee,
              totalSeats: totalSeats
            });
          } else {
            activeEntriesMap.get(c.pool_id).totalAmount += c.amount;
          }
        }
      });
      
      const activeEntries = Array.from(activeEntriesMap.values());
      
      const { data: wins, error: winsError } = await supabase
        .from('pools')
        .select('*')
        .eq('winner_id', userId)
        .order('updated_at', { ascending: false });
        
      if (winsError) throw winsError;
      
      const totalWon = wins?.reduce((sum, w) => sum + (w.target_amount || 0), 0) || 0;
      const winRate = totalSpent > 0 ? (totalWon / totalSpent) * 100 : 0;
      const loyaltyPoints = Math.floor(totalSpent / 100) + (wins?.length || 0) * 10;
      
      if (!isMounted.current) return;
      
      setStats({ 
        totalSpent, 
        totalWon, 
        activeEntries: activeEntries.length,
        winRate: winRate.toFixed(1),
        loyaltyPoints
      });
      setMyEntries(activeEntries);
      setMyWins(wins || []);
      
      await loadBadges(userId, wins?.length || 0, totalSpent, profile);
      await loadMorePools(0, true);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (isMounted.current) toast.error('Failed to load dashboard data');
    }
  }

  async function loadMorePools(pageNum = page, reset = false) {
    if (loadingMore) return;
    if (!reset && !hasMore) return;
    
    setLoadingMore(true);
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .range(pageNum * 6, (pageNum * 6) + 5);

      if (error) throw error;
      
      if (!isMounted.current) return;
      
      if (reset) {
        setActivePools(data || []);
        setPage(1);
      } else {
        setActivePools(prev => [...prev, ...(data || [])]);
        setPage(pageNum + 1);
      }
      
      setHasMore((data?.length || 0) === 6);
    } catch (error) {
      console.error('Error loading pools:', error);
    } finally {
      if (isMounted.current) setLoadingMore(false);
    }
  }

  async function loadRecentActivities(userId) {
    try {
      const { data: contributions } = await supabase
        .from('contributions')
        .select('amount, created_at, pools:pool_id(prize_name)')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: wins } = await supabase
        .from('pools')
        .select('prize_name, target_amount, updated_at')
        .eq('winner_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5);

      const { data: merkatoWins } = await supabase
        .from('merkato_vip_participants')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_status', 'verified')
        .limit(3);
      
      const { data: cityWins } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_status', 'verified')
        .limit(3);

      const activities = [
        ...(contributions || []).map(c => ({
          type: 'contribution',
          title: `Joined "${c.pools?.prize_name || 'Pool'}"`,
          amount: c.amount,
          date: c.created_at,
          icon: '🎯',
          color: 'blue'
        })),
        ...(wins || []).map(w => ({
          type: 'win',
          title: `Won "${w.prize_name}"`,
          amount: w.target_amount,
          date: w.updated_at,
          icon: '🏆',
          color: 'yellow'
        })),
        ...(merkatoWins || []).slice(0, 2).map(m => ({
          type: 'vip',
          title: `Merkato VIP - ${m.pool_type} Pool Joined`,
          amount: m.contribution_amount,
          date: m.created_at,
          icon: '🏪',
          color: 'orange'
        })),
        ...(cityWins || []).slice(0, 2).map(c => ({
          type: 'vip',
          title: `${c.city} VIP - ${c.pool_type} Pool Joined`,
          amount: c.contribution_amount,
          date: c.created_at,
          icon: '🏙️',
          color: 'purple'
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      if (isMounted.current) setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  }

  async function loadBadges(userId, winsCount, totalSpent, profile) {
    const badgesList = [];
    
    if (winsCount >= 1) badgesList.push({ name: 'First Win', nameAm: 'የመጀመሪያ ድል', icon: '🥇', color: 'bg-yellow-100 text-yellow-700' });
    if (winsCount >= 5) badgesList.push({ name: 'Rising Star', nameAm: 'እያደገ ያለ ኮከብ', icon: '⭐', color: 'bg-blue-100 text-blue-700' });
    if (winsCount >= 10) badgesList.push({ name: 'Champion', nameAm: 'ሻምፒዮን', icon: '🏆', color: 'bg-purple-100 text-purple-700' });
    if (totalSpent >= 10000) badgesList.push({ name: 'Big Spender', nameAm: 'ታላቅ አበርካች', icon: '💰', color: 'bg-green-100 text-green-700' });
    if (profile?.referral_count >= 5) badgesList.push({ name: 'Super Referrer', nameAm: 'ከፍተኛ አመላካች', icon: '🤝', color: 'bg-orange-100 text-orange-700' });
    
    const hasMerkato = await supabase.from('merkato_vip_participants').select('id').eq('user_id', userId).limit(1);
    if (hasMerkato.data?.length > 0) {
      badgesList.push({ name: 'Merkato VIP', nameAm: 'መርካቶ VIP', icon: '🏪', color: 'bg-yellow-100 text-yellow-700' });
    }
    
    const hasCityVip = await supabase.from('city_vip_participants').select('id').eq('user_id', userId).limit(1);
    if (hasCityVip.data?.length > 0) {
      badgesList.push({ name: 'City VIP', nameAm: 'ከተማ VIP', icon: '🏙️', color: 'bg-blue-100 text-blue-700' });
    }
    
    if (badgesList.length === 0) {
      badgesList.push({ name: 'Newcomer', nameAm: 'አዲስ ተሳታፊ', icon: '🌱', color: 'bg-gray-100 text-gray-700' });
    }
    
    if (isMounted.current) setBadges(badgesList.slice(0, 6));
  }

  const copyReferralLink = useCallback(() => {
    const link = `${window.location.origin}/register?ref=${user?.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied! Share with friends to earn bonuses.');
  }, [user?.id]);

  const handleWinnerClick = (poolId) => {
    setSelectedPoolId(poolId);
    setShowWinnerModal(true);
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading your dashboard..." />;
  }
  
  const isProfileIncomplete = !profile?.phone || !profile?.location || !profile?.address;
  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  // Combine ALL THREE ticket types
  const allTickets = [
    ...regularTickets.map(t => ({ 
      ...t, 
      type: 'regular', 
      verified: t.payment_status === 'verified',
      displayName: `${t.pools?.prize_name || 'Regular Pool'} - Seats ${t.seat_numbers?.join(', ') || 'N/A'}`,
      poolInfo: t.pools,
      icon: '🎁',
      bgColor: 'bg-purple-50',
      statusText: t.payment_status === 'verified' ? 'Verified ✓' : 'Pending Verification'
    })),
    ...merkatoTickets.map(t => ({ 
      ...t, 
      type: 'merkato', 
      verified: t.payment_status === 'verified',
      displayName: `Merkato VIP - ${t.pool_type === 'daily' ? 'Daily Millionaire' : t.pool_type === 'weekly' ? 'Weekly Mega Winner' : 'Monthly Winner'}`,
      city: 'Merkato',
      icon: '🏪',
      bgColor: 'bg-yellow-50',
      statusText: t.payment_status === 'verified' ? 'Verified ✓' : 'Pending Verification'
    })),
    ...cityTickets.map(t => ({ 
      ...t, 
      type: 'city', 
      verified: t.payment_status === 'verified',
      displayName: `${t.city?.charAt(0).toUpperCase() + t.city?.slice(1) || 'City'} VIP - ${t.pool_type === 'daily' ? 'Daily Millionaire' : t.pool_type === 'weekly' ? 'Weekly Mega Winner' : 'Monthly Winner'}`,
      city: t.city,
      icon: '🏙️',
      bgColor: 'bg-blue-50',
      statusText: t.payment_status === 'verified' ? 'Verified ✓' : 'Pending Verification'
    }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const displayedTickets = showAllTickets ? allTickets : allTickets.slice(0, 3);

  return (
    <DashboardLayout 
      title="Individual Dashboard" 
      subtitle="Join pools, track your entries, and win amazing prizes"
      icon="🎯"
      bgGradient="from-green-600 to-teal-500"
      user={user}
      profile={profile}
      language={language}
      toggleLanguage={() => {
        const newLang = language === 'am' ? 'en' : 'am';
        setLanguage(newLang);
        localStorage.setItem('appLanguage', newLang);
      }}
    >
      {/* 3D Controls */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggle3D}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
            is3D 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          {is3D ? '🔄 3D ON' : '🔄 3D OFF'}
        </button>
      </div>

      {/* 3D Dashboard Container */}
      <div 
        className="transition-all duration-500"
        style={{
          transform: get3DTransform(),
          transformStyle: 'preserve-3d',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BackButton fallbackHref="/" />
        
        {/* Notification Center */}
        <div className="flex justify-end mb-4">
          <NotificationCenter 
            userId={user?.id}
            maxDisplay={5}
            showSounds={true}
            autoHide={true}
            autoHideDuration={5000}
          />
        </div>

        <GlobalAnnouncement />
        
        {/* Agent Banner */}
        {isAgent && agentData && (
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 mb-6 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤝</span>
                <div>
                  <p className="font-bold">Agent Dashboard Access</p>
                  <p className="text-sm opacity-90">You are an approved agent! Manage your referrals and earnings.</p>
                </div>
              </div>
              <Link href="/agent/dashboard" className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition">
                Go to Agent Dashboard →
              </Link>
            </div>
          </div>
        )}
        
        {/* Role Description Card */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 border-l-4 border-green-500 rounded-xl p-5 mb-8">
          <h3 className="font-bold text-green-800 text-lg mb-2">✨ Your Role: Individual Participant</h3>
          <p className="text-green-700 text-sm leading-relaxed">
            As an individual participant, you can browse and join various pools created by Admins, Agents, or Organizations.
            You can participate in <strong>Regular Pools</strong>, <strong>City VIP Programs</strong>, and <strong>Merkato VIP</strong>.
            <strong className="block mt-2">💚 2% of every contribution supports kidney & heart disease patients.</strong>
          </p>
        </div>
        
        {/* Welcome & Profile Reminder */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-2xl shadow-sm p-6 mb-8 border border-green-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome back, {firstName}! 👋</h2>
            <p className="text-gray-500 mt-1">Here's what's happening with your pools today.</p>
            {isTelegramUser && (
              <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full">
                <span>📱</span>
                <span className="font-medium">Connected via Telegram</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </div>
            )}
          </div>
          
          {isProfileIncomplete && (
            <div className="mt-4 md:mt-0 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-sm">Profile Incomplete</p>
                <Link href="/profile" className="text-xs text-yellow-600 hover:underline">Complete your profile to ensure smooth prize delivery →</Link>
              </div>
            </div>
          )}
        </div>

        {/* Ticket Stats */}
        <div className="mb-8">
          <TicketStats 
            userId={user?.id}
            timeRange="all"
            showCharts={true}
            showBreakdown={true}
            compact={false}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-lg">💸</div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Spent</p>
                <p className="text-xl font-bold text-gray-800">{stats.totalSpent.toLocaleString()} ETB</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center text-lg">🏆</div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Won</p>
                <p className="text-xl font-bold text-yellow-600">{stats.totalWon.toLocaleString()} ETB</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg">🎟️</div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Active Entries</p>
                <p className="text-xl font-bold text-blue-600">{stats.activeEntries}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-lg">⭐</div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Loyalty Points</p>
                <p className="text-xl font-bold text-purple-600">{stats.loyaltyPoints}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-teal-500 p-5 rounded-2xl shadow-sm text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">📊</div>
              <div>
                <p className="text-xs font-medium opacity-90">Win Rate</p>
                <p className="text-xl font-bold">{stats.winRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Pools */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Pools Grid */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <h3 className="text-xl font-bold text-gray-800">🔥 Featured Active Pools</h3>
                <Link href="/listings" className="text-green-600 font-semibold hover:underline text-sm flex items-center gap-1">
                  Browse All Pools <span>→</span>
                </Link>
              </div>
              
              {activePools.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">🏊</div>
                  <p className="text-gray-400">No active pools available right now.</p>
                  <p className="text-xs text-gray-400 mt-1">Check back soon for new opportunities!</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {activePools.map((pool) => (
                      <PoolCard key={pool.id} pool={pool} show3D={is3D} autoRotate={false} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="text-center mt-6">
                      <button 
                        onClick={() => loadMorePools(page, false)} 
                        disabled={loadingMore}
                        className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 mx-auto"
                      >
                        {loadingMore ? 'Loading...' : 'Load More Pools ↓'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Recent Activity Feed */}
            {recentActivities.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📋</span> Recent Activity
                </h3>
                <div className="space-y-3">
                  {recentActivities.map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`text-2xl ${activity.color === 'yellow' ? 'text-yellow-500' : activity.color === 'orange' ? 'text-orange-500' : activity.color === 'purple' ? 'text-purple-500' : 'text-blue-500'}`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{activity.title}</p>
                        <p className="text-xs text-gray-400">{new Date(activity.date).toLocaleDateString()}</p>
                      </div>
                      <div className={`font-bold text-sm ${activity.type === 'win' ? 'text-yellow-600' : activity.type === 'vip' ? 'text-purple-600' : 'text-green-600'}`}>
                        {activity.type === 'win' ? '+' : ''}{activity.amount?.toLocaleString()} ETB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* How to Win Guide */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-blue-800 text-lg mb-4 flex items-center gap-2">
                <span>📖</span> How to Win
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">1</div>
                  <p className="font-semibold text-sm">Find a Pool</p>
                  <p className="text-xs text-gray-600">Browse active prize pools</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">2</div>
                  <p className="font-semibold text-sm">Contribute</p>
                  <p className="text-xs text-gray-600">Pay entry fee for seats</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">3</div>
                  <p className="font-semibold text-sm">Win!</p>
                  <p className="text-xs text-gray-600">Random winner selected</p>
                </div>
              </div>
              <p className="text-xs text-blue-600 text-center mt-3">
                💡 Tip: More entries = higher chance to win!
              </p>
            </div>
          </div>

          {/* Right Column: User Activity */}
          <div className="space-y-6">
            
            {/* MY TICKETS SECTION */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span>🎫</span> My Tickets
                  {allTickets.length > 0 && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{allTickets.length}</span>
                  )}
                </h3>
                {allTickets.length > 3 && !showAllTickets && (
                  <button 
                    onClick={() => setShowAllTickets(true)}
                    className="text-blue-600 text-xs hover:underline"
                  >
                    View All ({allTickets.length})
                  </button>
                )}
                {showAllTickets && (
                  <button 
                    onClick={() => setShowAllTickets(false)}
                    className="text-gray-500 text-xs hover:underline"
                  >
                    Show Less
                  </button>
                )}
              </div>
              
              {allTickets.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="text-3xl mb-2">🎫</div>
                  <p className="text-gray-500 text-sm">No tickets found.</p>
                  <p className="text-xs text-gray-400 mt-1">After you upload a payment screenshot, your ticket will appear here.</p>
                  <div className="mt-3 flex flex-col gap-2">
                    <Link href="/merkato-vip" className="inline-block text-yellow-600 font-medium text-sm hover:underline">
                      🏪 Join Merkato VIP →
                    </Link>
                    <Link href="/cities/addis-ababa" className="inline-block text-blue-600 font-medium text-sm hover:underline">
                      🏙️ Join City VIP →
                    </Link>
                    <Link href="/listings" className="inline-block text-purple-600 font-medium text-sm hover:underline">
                      🎁 Join Regular Pool →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {displayedTickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className={`border rounded-xl p-3 cursor-pointer transition hover:shadow-md ${
                        ticket.verified
                          ? 'border-green-200 bg-green-50/30' 
                          : 'border-yellow-200 bg-yellow-50/30'
                      }`}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setShowTicketModal(true);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{ticket.icon}</span>
                            <span className="font-semibold text-sm">{ticket.displayName}</span>
                            {ticket.verified ? (
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                ✓ Verified
                              </span>
                            ) : (
                              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                ⏳ Pending
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Ticket: <span className="font-mono">{ticket.ticket_number || ticket.id?.slice(-8)}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Seats: {ticket.seat_numbers?.join(', ') || 'N/A'}
                          </p>
                          <p className="text-xs font-semibold text-green-600 mt-1">
                            Amount: ETB {ticket.contribution_amount?.toLocaleString() || ticket.amount?.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400">
                            Date: {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(ticket);
                            setShowTicketModal(true);
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Referral Program */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-indigo-800 flex items-center gap-2">
                    <span>🤝</span> Referral Program
                  </h3>
                  <p className="text-xs text-indigo-600">Invite friends and earn bonuses!</p>
                </div>
                <button
                  onClick={() => setShowReferral(true)}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700 transition"
                >
                  Invite
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/register?ref=${user?.id}`}
                  className="flex-1 text-xs border rounded-lg px-2 py-1.5 bg-white"
                />
                <button
                  onClick={copyReferralLink}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700 transition"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Badges & Achievements */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🎖️</span> Badges & Achievements
              </h3>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge, idx) => (
                  <div key={idx} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${badge.color}`}>
                    <span>{badge.icon}</span>
                    <span>{language === 'am' ? badge.nameAm : badge.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* My Active Entries */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🎟️</span> My Active Entries
                {myEntries.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{myEntries.length}</span>
                )}
              </h3>
              {myEntries.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-gray-500 text-sm">You haven't joined any active pools.</p>
                  <Link href="/listings" className="mt-3 inline-block text-green-600 font-medium text-sm hover:underline">
                    Find a pool to join →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {myEntries.map((entry, idx) => {
                    const totalCollection = entry.pool.target_amount * 1.2;
                    const progress = (entry.totalAmount / totalCollection) * 100;
                    
                    return (
                      <Link 
                        key={idx} 
                        href={`/pools/${entry.pool.id}`} 
                        className="block p-3 rounded-xl border hover:border-green-300 hover:shadow-sm transition bg-gray-50"
                      >
                        <p className="font-semibold text-gray-800 truncate text-sm">{entry.pool.prize_name || entry.pool.name}</p>
                        <div className="flex justify-between mt-2 text-xs">
                          <span className="text-green-600 font-medium">Contributed: {entry.totalAmount.toLocaleString()} ETB</span>
                          <span className="text-gray-500">Target: {entry.pool.target_amount?.toLocaleString()} ETB</span>
                        </div>
                        <div className="mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-green-600 h-1 rounded-full" 
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {entry.entryFee} ETB per seat • {entry.totalSeats.toLocaleString()} total seats
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Wins */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-yellow-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🏆</span> My Wins
                {myWins.length > 0 && (
                  <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full">{myWins.length}</span>
                )}
              </h3>
              {myWins.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-gray-500 text-sm">No wins yet. Keep participating!</p>
                  <p className="text-xs text-gray-400 mt-1">Your first win could be just around the corner</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {myWins.map(win => (
                    <div key={win.id} className="p-3 bg-white rounded-xl shadow-sm border border-yellow-200 hover:shadow-md transition">
                      <p className="font-semibold text-gray-800 truncate text-sm">{win.prize_name || win.name}</p>
                      <div className="flex justify-between mt-2 items-center">
                        <span className="text-yellow-600 font-bold text-sm">Won {win.target_amount?.toLocaleString()} ETB</span>
                        <span className="text-xs text-gray-400">{new Date(win.updated_at).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => handleWinnerClick(win.id)}
                        className="mt-2 text-blue-600 text-xs hover:underline"
                      >
                        View Details →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Charity Section */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-5 rounded-2xl border border-pink-100">
              <h3 className="font-semibold text-pink-800 mb-2 flex items-center gap-2">
                <span>💚</span> 2% for Health
              </h3>
              <p className="text-xs text-pink-700">
                2% of every contribution goes to support kidney and heart disease patients in Ethiopia.
                Your participation helps save lives!
              </p>
              <div className="mt-3 bg-white rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Total contributed to charity from your activity:</p>
                <p className="font-bold text-pink-600">ETB {Math.floor(stats.totalSpent * 0.02).toLocaleString()}</p>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <span>💡</span> Pro Tips
              </h3>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>Join pools early for better chances</li>
                <li>Complete your profile to qualify for wins</li>
                <li>Invite friends to earn referral bonuses</li>
                <li>Check back daily for new featured pools</li>
                <li>More entries = higher chance to win!</li>
              </ul>
            </div>

            {/* Activity Log */}
            <ActivityLog 
              userId={user?.id}
              maxDisplay={10}
              showFilters={false}
              showStats={false}
              autoRefresh={false}
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold">🎫 Your Ticket</h2>
              <button onClick={() => setShowTicketModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6">
              <TicketImage
                participant={{
                  user_name: selectedTicket.user_name,
                  user_email: selectedTicket.user_email,
                  phone: selectedTicket.user_phone,
                  ticket_number: selectedTicket.ticket_number,
                  created_at: selectedTicket.created_at,
                  seat_numbers: selectedTicket.seat_numbers,
                  contribution_amount: selectedTicket.contribution_amount,
                  pool_type: selectedTicket.pool_type,
                  city: selectedTicket.city,
                  verified_at: selectedTicket.verified_at
                }}
                pool={{
                  prize_amount: selectedTicket.prize_amount || selectedTicket.target_amount,
                  prize_name: selectedTicket.type === 'merkato' 
                    ? `Merkato VIP - ${selectedTicket.pool_type === 'daily' ? 'Daily Millionaire' : selectedTicket.pool_type === 'weekly' ? 'Weekly Mega Winner' : 'Monthly Winner'}`
                    : selectedTicket.type === 'city'
                    ? `${selectedTicket.city} VIP - ${selectedTicket.pool_type === 'daily' ? 'Daily Millionaire' : selectedTicket.pool_type === 'weekly' ? 'Weekly Mega Winner' : 'Monthly Winner'}`
                    : selectedTicket.pools?.prize_name || 'Regular Pool',
                  target_amount: selectedTicket.prize_amount || selectedTicket.target_amount
                }}
                isVerified={selectedTicket.verified}
                seatNumbers={selectedTicket.seat_numbers || []}
                ticketNumber={selectedTicket.ticket_number}
                amount={selectedTicket.contribution_amount}
                createdAt={selectedTicket.created_at}
                poolType={selectedTicket.type}
                show3D={is3D}
              />
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Winner Announcement Modal */}
      {showWinnerModal && (
        <WinnerAnnouncement
          poolId={selectedPoolId}
          isOpen={showWinnerModal}
          onClose={() => {
            setShowWinnerModal(false);
            setSelectedPoolId(null);
          }}
          showConfetti={true}
          show3D={is3D}
          autoRotate={true}
          showShareMenu={true}
        />
      )}

      {/* Referral System Modal */}
      {showReferral && (
        <ReferralSystem
          isOpen={showReferral}
          onClose={() => setShowReferral(false)}
          userId={user?.id}
          showLeaderboard={false}
          showAnalytics={false}
          compact={true}
          cashbackPercentage={5}
          friendDiscount={5}
        />
      )}
    </DashboardLayout>
  );
}
