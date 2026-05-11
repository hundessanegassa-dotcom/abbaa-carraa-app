import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/DashboardLayout';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function VendorAnalytics() {
  const [products, setProducts] = useState([]);
  const [pools, setPools] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (vendor) {
        const { data: productsData } = await supabase
          .from('listings')
          .select('*')
          .eq('vendor_id', vendor.id);
        setProducts(productsData || []);
        
        const { data: poolsData } = await supabase
          .from('pools')
          .select('*')
          .eq('vendor_id', vendor.id);
        setPools(poolsData || []);
        
        const total = poolsData?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
        setTotalSales(total);
        
        const { data: commissions } = await supabase
          .from('commissions')
          .select('amount')
          .eq('vendor_id', vendor.id);
        setTotalCommission(commissions?.reduce((sum, c) => sum + c.amount, 0) || 0);
      }
    }
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;

  const activePools = pools.filter(p => p.status === 'active').length;
  const completedPools = pools.filter(p => p.status === 'completed').length;
  const conversionRate = products.length > 0 ? (pools.length / products.length) * 100 : 0;

  return (
    <DashboardLayout title="Vendor Analytics" subtitle="Track your sales performance" icon="📊" bgGradient="from-purple-500 to-pink-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 text-center shadow-md"><p className="text-3xl font-bold text-purple-600">{products.length}</p><p className="text-gray-500 text-sm">Products Listed</p></div>
        <div className="bg-white rounded-2xl p-5 text-center shadow-md"><p className="text-3xl font-bold text-blue-600">{pools.length}</p><p className="text-gray-500 text-sm">Prize Pools</p></div>
        <div className="bg-white rounded-2xl p-5 text-center shadow-md"><p className="text-3xl font-bold text-green-600">ETB {Math.floor(totalSales / 1000)}K</p><p className="text-gray-500 text-sm">Total Sales</p></div>
        <div className="bg-white rounded-2xl p-5 text-center shadow-md"><p className="text-3xl font-bold text-yellow-600">ETB {totalCommission.toLocaleString()}</p><p className="text-gray-500 text-sm">Commission</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-md"><h3 className="font-bold mb-4">📊 Performance Summary</h3><div className="space-y-3"><div className="flex justify-between"><span>Active Pools:</span><span className="font-bold">{activePools}</span></div><div className="flex justify-between"><span>Completed Pools:</span><span className="font-bold">{completedPools}</span></div><div className="flex justify-between"><span>Conversion Rate:</span><span className="font-bold text-green-600">{conversionRate.toFixed(1)}%</span></div></div></div>
        <div className="bg-white rounded-2xl p-5 shadow-md"><h3 className="font-bold mb-4">💰 Commission Breakdown</h3><div className="space-y-3"><div className="flex justify-between"><span>Total Commission:</span><span className="font-bold text-yellow-600">ETB {totalCommission.toLocaleString()}</span></div><div className="flex justify-between"><span>Average per Pool:</span><span className="font-bold">{pools.length > 0 ? `ETB ${(totalCommission / pools.length).toFixed(0)}` : 'N/A'}</span></div></div></div>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-md"><h3 className="font-bold mb-4">📋 Your Products</h3>{products.length === 0 ? <p className="text-center py-8 text-gray-400">No products listed yet</p> : <div className="divide-y">{products.map(p => (<div key={p.id} className="py-3 flex justify-between items-center"><div><p className="font-medium">{p.title}</p><p className="text-sm text-gray-500">ETB {p.estimated_value?.toLocaleString()}</p></div><span className="text-xs text-green-600">{p.status || 'Active'}</span></div>))}</div>}</div>
    </DashboardLayout>
  );
}
