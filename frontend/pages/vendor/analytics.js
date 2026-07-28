// pages/vendor/analytics.js - COMPLETE FIXED
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';

export default function VendorAnalytics() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalPools: 0,
    totalSales: 0,
    totalCommission: 0,
    pendingCommission: 0,
    activePools: 0,
    completedPools: 0
  });
  const [products, setProducts] = useState([]);
  const [pools, setPools] = useState([]);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
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

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendorData) {
        toast.error('Vendor access required');
        router.push('/dashboard');
        return;
      }

      await loadData(vendorData.id);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadData(vendorId) {
    try {
      // Get products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId);
      setProducts(productsData || []);

      // Get pools
      const { data: poolsData } = await supabase
        .from('pools')
        .select('*')
        .eq('vendor_id', vendorId);
      setPools(poolsData || []);

      const totalProducts = productsData?.length || 0;
      const totalPools = poolsData?.length || 0;
      const activePools = poolsData?.filter(p => p.status === 'active').length || 0;
      const completedPools = poolsData?.filter(p => p.status === 'completed').length || 0;
      const totalSales = poolsData?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
      const totalCommission = totalSales * 0.10;

      // Get paid commissions
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status')
        .eq('vendor_id', vendorId);
      
      const paidCommission = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0;
      const pendingCommission = totalCommission - paidCommission;

      setStats({
        totalProducts,
        totalPools,
        totalSales,
        totalCommission,
        pendingCommission,
        activePools,
        completedPools
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load analytics data');
    }
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Loading analytics..." />;
  }

  return (
    <DashboardLayout 
      title="Analytics" 
      subtitle="Track your vendor performance"
      icon="📊"
      bgGradient="from-purple-600 to-pink-600"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/vendor/dashboard" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.totalProducts}</p>
          <p className="text-xs text-gray-500">📦 Products</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.totalPools}</p>
          <p className="text-xs text-gray-500">🏊 Pools</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border text-center">
          <p className="text-3xl font-bold text-green-600">ETB {stats.totalSales.toLocaleString()}</p>
          <p className="text-xs text-gray-500">💰 Total Sales</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-5 shadow-sm text-center text-white">
          <p className="text-3xl font-bold">ETB {stats.pendingCommission.toLocaleString()}</p>
          <p className="text-xs opacity-90">💵 Pending Commission</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="font-bold text-gray-800 mb-4">📊 Pool Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Pools</span>
              <span className="font-bold text-green-600">{stats.activePools}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed Pools</span>
              <span className="font-bold text-blue-600">{stats.completedPools}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Pools</span>
              <span className="font-bold text-purple-600">{stats.totalPools}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="font-bold text-gray-800 mb-4">💰 Commission Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Commission (10%)</span>
              <span className="font-bold text-yellow-600">ETB {stats.totalCommission.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Paid</span>
              <span className="font-bold text-green-600">ETB {(stats.totalCommission - stats.pendingCommission).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-gray-600 font-medium">Pending</span>
              <span className="font-bold text-orange-600">ETB {stats.pendingCommission.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <h3 className="font-bold text-gray-800 mb-4">📋 Your Products</h3>
        {products.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No products listed yet</p>
        ) : (
          <div className="space-y-2">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">{product.name}</span>
                <span className="text-sm text-gray-500">ETB {product.price?.toLocaleString()}</span>
              </div>
            ))}
            {products.length > 5 && (
              <p className="text-xs text-gray-400 text-center pt-2">+{products.length - 5} more products</p>
            )}
          </div>
        )}
      </div>

      {/* Pools List */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="font-bold text-gray-800 mb-4">🏊 Your Pools</h3>
        {pools.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No pools created yet</p>
        ) : (
          <div className="space-y-2">
            {pools.slice(0, 5).map((pool) => (
              <div key={pool.id} className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">{pool.prize_name || pool.name}</span>
                <span className={`text-sm px-2 py-0.5 rounded-full ${
                  pool.status === 'active' ? 'bg-green-100 text-green-700' :
                  pool.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {pool.status}
                </span>
              </div>
            ))}
            {pools.length > 5 && (
              <p className="text-xs text-gray-400 text-center pt-2">+{pools.length - 5} more pools</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
