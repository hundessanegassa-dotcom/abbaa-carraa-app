export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

export default function AdminAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [categoryData, setCategoryData] = useState({});
  const [topAgents, setTopAgents] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      router.push('/');
      return;
    }

    setIsAdmin(true);
    await loadAnalytics();
  }

  async function loadAnalytics() {
    try {
      // Get all users by type
      const [{ count: totalUsers }, { count: totalAgents }, { count: totalVendors }, { count: totalOrganizations }] = await Promise.all([
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
      const { data: commissions } = await supabase.from('commissions').select('amount');
      const totalCommission = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      // Category distribution
      const categories = { vehicle: 0, machinery: 0, electronics: 0, property: 0, furniture: 0, other: 0 };
      pools?.forEach(pool => {
        const cat = pool.category || 'other';
        categories[cat] = (categories[cat] || 0) + 1;
      });
      setCategoryData(categories);

      // Top performing agents
      const { data: agentsWithPools } = await supabase
        .from('pools')
        .select('agent_id, target_amount, current_amount, status')
        .not('agent_id', 'is', null);
      
      const agentStats = {};
      agentsWithPools?.forEach(pool => {
        if (!agentStats[pool.agent_id]) {
          agentStats[pool.agent_id] = { totalRaised: 0, poolCount: 0 };
        }
        agentStats[pool.agent_id].totalRaised += pool.current_amount || 0;
        agentStats[pool.agent_id].poolCount++;
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
          .single();
        agent.name = profile?.full_name || 'Unknown Agent';
      }
      setTopAgents(topAgentsList);

      // Monthly revenue (last 6 months from actual data)
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

      // User growth
      const userGrowthData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', date.toISOString());
        userGrowthData.push(count || 0);
      }
      setUserGrowth(userGrowthData);

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
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  const pieData = {
    labels: ['Vehicles', 'Machinery', 'Electronics', 'Property', 'Furniture', 'Other'],
    datasets: [{
      data: [categoryData.vehicle, categoryData.machinery, categoryData.electronics, categoryData.property, categoryData.furniture, categoryData.other],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'],
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

  const userGrowthData = {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8">📊 Admin Analytics Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4 text-center"><div className="text-2xl mb-1">👥</div><p className="text-xl font-bold text-blue-600">{stats.totalUsers}</p><p className="text-xs text-gray-500">Users</p></div>
          <div className="bg-white rounded-xl shadow p-4 text-center"><div className="text-2xl mb-1">🤝</div><p className="text-xl font-bold text-yellow-600">{stats.totalAgents}</p><p className="text-xs text-gray-500">Agents</p></div>
          <div className="bg-white rounded-xl shadow p-4 text-center"><div className="text-2xl mb-1">🏭</div><p className="text-xl font-bold text-purple-600">{stats.totalVendors}</p><p className="text-xs text-gray-500">Vendors</p></div>
          <div className="bg-white rounded-xl shadow p-4 text-center"><div className="text-2xl mb-1">🏢</div><p className="text-xl font-bold text-cyan-600">{stats.totalOrganizations}</p><p className="text-xs text-gray-500">Orgs</p></div>
          <div className="bg-white rounded-xl shadow p-4 text-center"><div className="text-2xl mb-1">🎯</div><p className="text-xl font-bold text-green-600">{stats.totalPools}</p><p className="text-xs text-gray-500">Pools</p></div>
          <div className="bg-white rounded-xl shadow p-4 text-center"><div className="text-2xl mb-1">💰</div><p className="text-sm font-bold text-yellow-600">ETB {Math.floor(stats.totalContributions / 1000)}K</p><p className="text-xs text-gray-500">Volume</p></div>
          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow p-4 text-center text-white"><div className="text-2xl mb-1">💚</div><p className="text-xl font-bold">ETB {Math.floor(stats.charityFund / 1000)}K</p><p className="text-[10px] opacity-90">Charity</p></div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-4">📈 Revenue Trend (Last 6 Months)</h2>
            <Line data={revenueChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-4">📊 User Growth</h2>
            <Line data={userGrowthData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-4">🥧 Pool Categories</h2>
            <div className="w-full max-w-sm mx-auto">
              <Pie data={pieData} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-4">🏆 Top Performing Agents</h2>
            {topAgents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No agent data yet</p>
            ) : (
              <div className="space-y-3">
                {topAgents.map((agent, idx) => (
                  <div key={agent.id} className="flex justify-between items-center border-b pb-2">
                    <div><span className="font-bold text-yellow-600 mr-2">#{idx + 1}</span><span>{agent.name}</span></div>
                    <div><span className="font-bold text-green-600">ETB {agent.totalRaised.toLocaleString()}</span><span className="text-xs text-gray-400 ml-2">({agent.poolCount} pools)</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-4">📊 Pool Completion Rate</h2>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-green-600">{stats.avgPoolCompletion.toFixed(1)}%</span>
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div className="bg-green-600 h-4 rounded-full" style={{ width: `${stats.avgPoolCompletion}%` }}></div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{stats.totalPools} total pools, {(stats.totalPools * stats.avgPoolCompletion / 100).toFixed(0)} completed</p>
        </div>
      </div>
    </div>
  );
}
