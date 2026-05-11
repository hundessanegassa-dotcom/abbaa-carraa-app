import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/DashboardLayout';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AgentAnalytics() {
  const [pools, setPools] = useState([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('pools')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      setPools(data || []);
      setTotalViews((data?.length || 0) * 150);
      
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status')
        .eq('user_id', user.id);
      const total = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      setTotalCommission(total);

      // Monthly pool creation stats
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const monthly = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const count = data?.filter(p => {
          const poolDate = new Date(p.created_at);
          return poolDate.getMonth() === date.getMonth() && poolDate.getFullYear() === date.getFullYear();
        }).length || 0;
        monthly.push(count);
      }
      setMonthlyStats(monthly);
    }
    setLoading(false);
  }

  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Pools Created',
      data: monthlyStats,
      backgroundColor: '#f59e0b',
      borderRadius: 8,
    }],
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div></div>;

  const completedPools = pools.filter(p => p.status === 'completed').length;
  const activePools = pools.filter(p => p.status === 'active').length;
  const totalRaised = pools.reduce((sum, p) => sum + (p.current_amount || 0), 0);
  const conversionRate = pools.length > 0 ? (completedPools / pools.length) * 100 : 0;

  return (
    <DashboardLayout title="Agent Analytics" subtitle="Track your pool performance" icon="📊" bgGradient="from-blue-500 to-indigo-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 text-center shadow-md"><p className="text-3xl font-bold text-blue-600">{pools.length}</p><p className="text-gray-500 text-sm">Total Pools</p></div>
        <div className="bg-white rounded-2xl p-5 text-center shadow-md"><p className="text-3xl font-bold text-green-600">{activePools}</p><p className="text-gray-500 text-sm">Active Pools</p></div>
        <div className="bg-white rounded-2xl p-5 text-center shadow-md"><p className="text-3xl font-bold text-yellow-600">{completedPools}</p><p className="text-gray-500 text-sm">Completed</p></div>
        <div className="bg-white rounded-2xl p-5 text-center shadow-md"><p className="text-3xl font-bold text-purple-600">{conversionRate.toFixed(0)}%</p><p className="text-gray-500 text-sm">Success Rate</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Monthly Pool Creation */}
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <h3 className="font-bold mb-4">📅 Pools Created (Last 6 Months)</h3>
          <Bar data={barData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>

        {/* Earnings Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <h3 className="font-bold mb-4">💰 Earnings Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b"><span className="text-gray-600">Total Raised:</span><span className="font-bold text-green-600">ETB {totalRaised.toLocaleString()}</span></div>
            <div className="flex justify-between items-center pb-2 border-b"><span className="text-gray-600">Commission Earned:</span><span className="font-bold text-yellow-600">ETB {totalCommission.toLocaleString()}</span></div>
            <div className="flex justify-between items-center pb-2 border-b"><span className="text-gray-600">Pending Commission:</span><span className="font-bold text-orange-600">ETB {(totalCommission * 0.3).toFixed(0)}</span></div>
            <div className="flex justify-between items-center pt-2"><span className="text-gray-600">Estimated Views:</span><span className="font-bold text-blue-600">{totalViews.toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {/* Your Pools Table */}
      <div className="bg-white rounded-2xl p-5 shadow-md">
        <h3 className="font-bold mb-4">📋 Your Pools</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold">Pool Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold">Target</th>
                <th className="px-4 py-2 text-left text-xs font-semibold">Raised</th>
                <th className="px-4 py-2 text-left text-xs font-semibold">Progress</th>
                <th className="px-4 py-2 text-left text-xs font-semibold">Status</th>
               </tr>
            </thead>
            <tbody>
              {pools.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">No pools created yet</td></tr>
              ) : (
                pools.map(pool => {
                  const progress = (pool.current_amount / pool.target_amount) * 100;
                  return (
                    <tr key={pool.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{pool.prize_name}</td>
                      <td className="px-4 py-3 text-sm">ETB {pool.target_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">ETB {pool.current_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3"><div className="w-24 bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div></div></td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{pool.status}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
