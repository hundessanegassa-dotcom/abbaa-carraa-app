// pages/admin/analytics.js - COMPLETE ADMIN ANALYTICS DASHBOARD
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

export default function AdminAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalVendors: 0,
    totalOrganizations: 0,
    totalPools: 0,
    totalContributions: 0,
    totalCommission: 0,
    charityFund: 0,
    avgPoolCompletion: 0,
    // Merkato VIP Stats
    merkatoParticipants: 0,
    merkatoCollected: 0,
    merkatoPaidOut: 0,
    // City VIP Stats
    cityParticipants: 0,
    cityCollected: 0,
    activeCities: 0,
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [categoryData, setCategoryData] = useState({});
  const [topAgents, setTopAgents] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [language, setLanguage] = useState('am');

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
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
        .maybeSingle();
      setProfile(profile);

      const { data: adminRecord } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (profile?.role !== 'admin' && !adminRecord) {
        toast.error('Admin access required');
        router.push('/');
        return;
      }

      setIsAdmin(true);
      await loadAnalytics();
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/');
    }
  }

  async function loadAnalytics() {
    try {
      // Get all users by type
      const [
        { count: totalUsers },
        { count: totalAgents },
        { count: totalVendors },
        { count: totalOrganizations }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('agents').select('*', { count: 'exact', head: true }),
        supabase.from('vendors').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select('*', { count: 'exact', head: true })
      ]);

      // Get all pools
      const { data: pools } = await supabase.from('pools').select('*');
      const totalPools = pools?.length || 0;
      const completedPools = pools?.filter(p => p.status === 'completed').length || 0;
      const avgPoolCompletion = totalPools > 0 ? (completedPools / totalPools) * 100 : 0;

      // Get contributions
      const { data: contributions } = await supabase.from('contributions').select('amount, created_at, status');
      const totalContributions = contributions?.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const charityFund = totalContributions * 0.02;

      // Get commissions
      const { data: commissions } = await supabase.from('commissions').select('commission_amount, status');
      const totalCommission = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;

      // Get Merkato VIP stats
      const { data: merkatoParticipants } = await supabase
        .from('merkato_vip_participants')
        .select('contribution_amount, payment_status');
      
      const merkatoTotal = merkatoParticipants?.filter(p => p.payment_status === 'verified').length || 0;
      const merkatoCollected = merkatoParticipants?.filter(p => p.payment_status === 'verified').reduce((sum, p) => sum + (p.contribution_amount || 0), 0) || 0;

      // Get City VIP stats
      const { data: cityParticipants } = await supabase
        .from('city_vip_participants')
        .select('contribution_amount, payment_status, city');
      
      const cityTotal = cityParticipants?.filter(p => p.payment_status === 'verified').length || 0;
      const cityCollected = cityParticipants?.filter(p => p.payment_status === 'verified').reduce((sum, p) => sum + (p.contribution_amount || 0), 0) || 0;
      const activeCities = [...new Set(cityParticipants?.filter(p => p.payment_status === 'verified').map(p => p.city))].length || 0;

      // Category distribution
      const categories = { vehicle: 0, machinery: 0, electronics: 0, property: 0, furniture: 0, cash: 0, vip: 0, other: 0 };
      pools?.forEach(pool => {
        const cat = pool.category || 'other';
        categories[cat] = (categories[cat] || 0) + 1;
      });
      setCategoryData(categories);

      // Top performing agents
      const { data: agentsWithPools } = await supabase
        .from('pools')
        .select('created_by, target_amount, current_amount, status')
        .not('created_by', 'is', null);
      
      const agentStats = {};
      agentsWithPools?.forEach(pool => {
        if (!agentStats[pool.created_by]) {
          agentStats[pool.created_by] = { totalRaised: 0, poolCount: 0 };
        }
        agentStats[pool.created_by].totalRaised += pool.current_amount || 0;
        agentStats[pool.created_by].poolCount++;
      });
      
      const topAgentsList = Object.entries(agentStats)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.totalRaised - a.totalRaised)
        .slice(0, 5);
      
      // Get agent names
      for (const agent of topAgentsList) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', agent.id)
          .maybeSingle();
        agent.name = profile?.full_name || 'Unknown Agent';
      }
      setTopAgents(topAgentsList);

      // Monthly revenue (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const monthly = [];
      for (let i = 0; i < 6; i++) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        const monthContributions = contributions?.filter(c => {
          const date = new Date(c.created_at);
          return date >= monthStart && date < monthEnd && c.status === 'completed';
        }) || [];
        const total = monthContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
        monthly.unshift(total);
      }
      setMonthlyRevenue(monthly);

      // User growth (last 6 months)
      const userGrowthData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', date.toISOString());
        userGrowthData.push(count || 0);
      }
      setUserGrowth(userGrowthData);

      // Recent activities
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      const { data: recentPools } = await supabase
        .from('pools')
        .select('prize_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      const activities = [];
      (recentUsers || []).forEach(u => {
        activities.push({ action: `New user registered: ${u.full_name || u.email}`, date: u.created_at, icon: '👤' });
      });
      (recentPools || []).forEach(p => {
        activities.push({ action: `New pool created: "${p.prize_name}" (${p.status})`, date: p.created_at, icon: '🏊' });
      });
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivities(activities.slice(0, 5));

      setStats({
        totalUsers: totalUsers || 0,
        totalAgents: totalAgents || 0,
        totalVendors: totalVendors || 0,
        totalOrganizations: totalOrganizations || 0,
        totalPools,
        totalContributions,
        totalCommission,
        charityFund,
        avgPoolCompletion,
        merkatoParticipants: merkatoTotal,
        merkatoCollected: merkatoCollected,
        merkatoPaidOut: merkatoCollected * 0.9,
        cityParticipants: cityTotal,
        cityCollected: cityCollected,
        activeCities: activeCities,
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;

  // Chart data
  const pieData = {
    labels: ['Vehicles', 'Machinery', 'Electronics', 'Property', 'Furniture', 'Cash', 'VIP', 'Other'],
    datasets: [{
      data: [
        categoryData.vehicle || 0,
        categoryData.machinery || 0,
        categoryData.electronics || 0,
        categoryData.property || 0,
        categoryData.furniture || 0,
        categoryData.cash || 0,
        categoryData.vip || 0,
        categoryData.other || 0
      ],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#6b7280'],
    }],
  };

  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue (ETB)',
      data: monthlyRevenue,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const userGrowthChartData = {
    labels: ['6 months ago', '5 months', '4 months', '3 months', '2 months', 'Last month'],
    datasets: [{
      label: 'Total Users',
      data: userGrowth,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  return (
    <AdminLayout
      title="Analytics Dashboard"
      subtitle="Comprehensive platform analytics and insights"
      icon="📊"
      bgGradient="from-purple-600 to-pink-600"
      user={user}
      profile={profile}
      activeTab="analytics"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        <div className="bg-white rounded-xl shadow p-3 text-center border border-gray-100">
          <div className="text-2xl mb-1">👥</div>
          <p className="text-xl font-bold text-blue-600">{stats.totalUsers}</p>
          <p className="text-[10px] text-gray-500">Users</p>
        </div>
        <div className="bg-white rounded-xl shadow p-3 text-center border border-gray-100">
          <div className="text-2xl mb-1">🤝</div>
          <p className="text-xl font-bold text-yellow-600">{stats.totalAgents}</p>
          <p className="text-[10px] text-gray-500">Agents</p>
        </div>
        <div className="bg-white rounded-xl shadow p-3 text-center border border-gray-100">
          <div className="text-2xl mb-1">🏭</div>
          <p className="text-xl font-bold text-purple-600">{stats.totalVendors}</p>
          <p className="text-[10px] text-gray-500">Vendors</p>
        </div>
        <div className="bg-white rounded-xl shadow p-3 text-center border border-gray-100">
          <div className="text-2xl mb-1">🏢</div>
          <p className="text-xl font-bold text-cyan-600">{stats.totalOrganizations}</p>
          <p className="text-[10px] text-gray-500">Orgs</p>
        </div>
        <div className="bg-white rounded-xl shadow p-3 text-center border border-gray-100">
          <div className="text-2xl mb-1">🎯</div>
          <p className="text-xl font-bold text-green-600">{stats.totalPools}</p>
          <p className="text-[10px] text-gray-500">Pools</p>
        </div>
        <div className="bg-white rounded-xl shadow p-3 text-center border border-gray-100">
          <div className="text-2xl mb-1">💰</div>
          <p className="text-sm font-bold text-yellow-600">ETB {(stats.totalContributions / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-gray-500">Volume</p>
        </div>
        <div className="bg-white rounded-xl shadow p-3 text-center border border-gray-100">
          <div className="text-2xl mb-1">🏪</div>
          <p className="text-xl font-bold text-orange-600">{stats.merkatoParticipants}</p>
          <p className="text-[10px] text-gray-500">Merkato VIP</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow p-3 text-center text-white">
          <div className="text-2xl mb-1">💚</div>
          <p className="text-xl font-bold">ETB {(stats.charityFund / 1000).toFixed(0)}K</p>
          <p className="text-[9px] opacity-90">Charity</p>
        </div>
      </div>

      {/* VIP Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl shadow p-3 text-center text-white">
          <div className="text-2xl mb-1">🏪</div>
          <p className="text-xl font-bold">{stats.merkatoParticipants}</p>
          <p className="text-[10px] opacity-90">Merkato Participants</p>
          <p className="text-[8px] opacity-75">ETB {(stats.merkatoCollected / 1000000).toFixed(1)}M collected</p>
        </div>
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl shadow p-3 text-center text-white">
          <div className="text-2xl mb-1">🏙️</div>
          <p className="text-xl font-bold">{stats.cityParticipants}</p>
          <p className="text-[10px] opacity-90">City VIP Participants</p>
          <p className="text-[8px] opacity-75">{stats.activeCities} active cities</p>
        </div>
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow p-3 text-center text-white">
          <div className="text-2xl mb-1">📊</div>
          <p className="text-xl font-bold">{stats.avgPoolCompletion.toFixed(1)}%</p>
          <p className="text-[10px] opacity-90">Pool Completion</p>
          <p className="text-[8px] opacity-75">{Math.round(stats.totalPools * stats.avgPoolCompletion / 100)} completed</p>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow p-3 text-center text-white">
          <div className="text-2xl mb-1">💎</div>
          <p className="text-xl font-bold">ETB {(stats.totalCommission / 1000).toFixed(0)}K</p>
          <p className="text-[10px] opacity-90">Commissions Paid</p>
          <p className="text-[8px] opacity-75">Total agent earnings</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-bold mb-4">📈 Revenue Trend (Last 6 Months)</h2>
          <Line data={revenueChartData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-bold mb-4">📊 User Growth</h2>
          <Line data={userGrowthChartData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-bold mb-4">🥧 Pool Categories</h2>
          <div className="w-full max-w-sm mx-auto">
            <Pie data={pieData} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-bold mb-4">🏆 Top Performing Agents</h2>
          {topAgents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No agent data yet</p>
          ) : (
            <div className="space-y-3">
              {topAgents.map((agent, idx) => (
                <div key={agent.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <span className={`font-bold mr-2 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-500' : 'text-gray-500'}`}>
                      #{idx + 1}
                    </span>
                    <span>{agent.name}</span>
                  </div>
                  <div>
                    <span className="font-bold text-green-600">ETB {agent.totalRaised.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-2">({agent.poolCount} pools)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100 mb-8">
        <h2 className="text-lg font-bold mb-4">📋 Recent Activity</h2>
        {recentActivities.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 border-b border-gray-100">
                <span className="text-xl">{activity.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{activity.action}</p>
                  <p className="text-xs text-gray-400">{new Date(activity.date).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completion Rate */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h2 className="text-lg font-bold mb-4">📊 Pool Completion Rate</h2>
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-green-600">{stats.avgPoolCompletion.toFixed(1)}%</span>
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div className="bg-green-600 h-4 rounded-full transition-all duration-500" style={{ width: `${Math.min(stats.avgPoolCompletion, 100)}%` }}></div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{stats.totalPools} total pools, {Math.round(stats.totalPools * stats.avgPoolCompletion / 100)} completed</p>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={loadAnalytics}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          🔄 Refresh Data
        </button>
      </div>
    </AdminLayout>
  );
}
