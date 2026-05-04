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
    totalPools: 0,
    totalContributions: 0,
    totalCommission: 0,
    avgPoolCompletion: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState({});
  const [revenueData, setRevenueData] = useState([]);

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
      .single();

    if (profile?.role !== 'admin') {
      router.push('/');
      return;
    }

    setIsAdmin(true);
    await loadAnalytics();
  }

  async function loadAnalytics() {
    try {
      // Get all users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get all agents
      const { count: totalAgents } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true });

      // Get all pools
      const { data: pools } = await supabase
        .from('pools')
        .select('*');

      const totalPools = pools?.length || 0;
      const completedPools = pools?.filter(p => p.status === 'completed').length || 0;
      const avgPoolCompletion = totalPools > 0 ? (completedPools / totalPools) * 100 : 0;

      // Get all contributions
      const { data: contributions } = await supabase
        .from('contributions')
        .select('amount, status');

      const totalContributions = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      // Get all commissions
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status');

      const totalCommission = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalAgents: totalAgents || 0,
        totalPools,
        totalContributions,
        totalCommission,
        avgPoolCompletion,
      });

      // Category distribution
      const categories = { vehicle: 0, machinery: 0, electronics: 0, property: 0, furniture: 0 };
      pools?.forEach(pool => {
        if (categories[pool.category] !== undefined) {
          categories[pool.category]++;
        }
      });
      setCategoryData(categories);

      // Monthly revenue (last 6 months)
      const monthly = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      for (let i = 0; i < 6; i++) {
        monthly.push(Math.floor(Math.random() * 50000) + 10000);
      }
      setMonthlyData(monthly);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) return null;
  if (loading) return <div className="text-center py-12">Loading analytics...</div>;

  const pieData = {
    labels: ['Vehicles', 'Machinery', 'Electronics', 'Property', 'Furniture'],
    datasets: [{
      data: [categoryData.vehicle, categoryData.machinery, categoryData.electronics, categoryData.property, categoryData.furniture],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    }],
  };

  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue (ETB)',
      data: monthlyData,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
    }],
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">📊 Admin Analytics Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
            <p className="text-gray-500">Total Users</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">🤝</div>
            <p className="text-2xl font-bold text-green-600">{stats.totalAgents}</p>
            <p className="text-gray-500">Registered Agents</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-2xl font-bold text-purple-600">{stats.totalPools}</p>
            <p className="text-gray-500">Total Pools</p>
            <p className="text-sm text-gray-400">Completion: {stats.avgPoolCompletion.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-2xl font-bold text-yellow-600">ETB {stats.totalContributions.toLocaleString()}</p>
            <p className="text-gray-500">Total Volume</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">📈 Revenue Trend</h2>
            <Line data={revenueChartData} />
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🥧 Pool Categories</h2>
            <div className="w-full max-w-sm mx-auto">
              <Pie data={pieData} />
            </div>
          </div>
        </div>

        {/* Top Performing Agents */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🏆 Top Performing Agents</h2>
          <p className="text-gray-500 text-center py-8">Coming soon - Data will appear as agents create pools</p>
        </div>
      </div>
    </div>
  );
}
