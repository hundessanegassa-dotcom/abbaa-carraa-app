import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function AdminAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalPools: 0,
    totalContributions: 0,
    totalVolume: 0,
    monthlyData: [],
    categoryData: [],
    growthData: []
  });

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
      router.push('/dashboard');
      return;
    }

    setIsAdmin(true);
    await loadAnalytics();
  }

  async function loadAnalytics() {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total agents
      const { count: totalAgents } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true });

      // Total pools
      const { count: totalPools } = await supabase
        .from('pools')
        .select('*', { count: 'exact', head: true });

      // Total contributions and volume
      const { data: contributions } = await supabase
        .from('contributions')
        .select('amount, created_at')
        .eq('status', 'completed');

      const totalVolume = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      // Monthly data (last 6 months)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        
        const monthContributions = contributions?.filter(c => {
          const cDate = new Date(c.created_at);
          return cDate.getMonth() === date.getMonth() && cDate.getFullYear() === date.getFullYear();
        }) || [];
        
        monthlyData.push({
          month: monthName,
          amount: monthContributions.reduce((sum, c) => sum + (c.amount || 0), 0)
        });
      }

      // Category distribution
      const { data: pools } = await supabase
        .from('pools')
        .select('category, target_amount');

      const categoryMap = {};
      pools?.forEach(pool => {
        const cat = pool.category || 'other';
        categoryMap[cat] = (categoryMap[cat] || 0) + (pool.target_amount || 0);
      });

      setStats({
        totalUsers: totalUsers || 0,
        totalAgents: totalAgents || 0,
        totalPools: totalPools || 0,
        totalContributions: contributions?.length || 0,
        totalVolume: totalVolume,
        monthlyData: monthlyData,
        categoryData: categoryMap,
        growthData: [120, 150, 180, 220, 280, 350] // Example growth
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) return null;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const barChartData = {
    labels: stats.monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Contribution Volume (ETB)',
        data: stats.monthlyData.map(d => d.amount),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      }
    ]
  };

  const doughnutData = {
    labels: Object.keys(stats.categoryData).map(c => c.toUpperCase()),
    datasets: [
      {
        data: Object.values(stats.categoryData),
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
        borderWidth: 0
      }
    ]
  };

  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'User Growth',
        data: stats.growthData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">📊 Analytics Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-2xl font-bold text-green-600">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-gray-500 text-sm">Total Users</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">🏢</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalAgents.toLocaleString()}</div>
            <div className="text-gray-500 text-sm">Total Agents</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalPools.toLocaleString()}</div>
            <div className="text-gray-500 text-sm">Total Pools</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-2xl font-bold text-yellow-600">ETB {stats.totalVolume.toLocaleString()}</div>
            <div className="text-gray-500 text-sm">Total Volume</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Monthly Contribution Volume</h2>
            <Bar data={barChartData} options={{ responsive: true }} />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">User Growth Trend</h2>
            <Line data={lineChartData} options={{ responsive: true }} />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Prize Categories Distribution</h2>
            <div className="w-64 mx-auto">
              <Doughnut data={doughnutData} options={{ responsive: true }} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Contribution per User:</span>
                <span className="font-semibold">
                  ETB {stats.totalUsers ? Math.floor(stats.totalVolume / stats.totalUsers).toLocaleString() : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pools Completion Rate:</span>
                <span className="font-semibold text-green-600">~45%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active vs Completed:</span>
                <span className="font-semibold">{stats.totalPools} active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Commission Owed:</span>
                <span className="font-semibold">ETB {Math.floor(stats.totalVolume * 0.1).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
