import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../DashboardLayout';
import toast from 'react-hot-toast';

export default function VendorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vendorData, setVendorData] = useState(null);
  const [products, setProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [stats, setStats] = useState({ 
    total_products: 0, 
    total_pools: 0, 
    completed_pools: 0,
    total_sales: 0, 
    total_commission: 0,
    pending_commission: 0,
    paid_commission: 0
  });
  const [loading, setLoading] = useState(true);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => { checkVendor(); }, []);

  async function checkVendor() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(profile);
    if (profile?.user_type !== 'vendor' && profile?.role !== 'vendor') { 
      router.push('/dashboard'); 
      return; 
    }
    await loadVendorData(user.id);
  }

  async function loadVendorData(userId) {
    try {
      // Get vendor record
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (vendorError && vendorError.code !== 'PGRST116') throw vendorError;
      setVendorData(vendor);
      const vendorId = vendor?.id;

      // Get products
      const { data: productsData } = await supabase
        .from('listings')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      
      setProducts(productsData || []);

      // Get pools created from vendor's products
      const { data: pools } = await supabase
        .from('pools')
        .select('*, listing:listing_id(*)')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      const completedPools = pools?.filter(p => p.status === 'completed') || [];
      const totalPools = pools?.length || 0;
      const totalSales = pools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;

      // Get commission data
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status, net_amount, created_at')
        .eq('user_id', userId)
        .eq('commission_type', 'vendor');

      const pendingCommission = commissions?.filter(c => c.status === 'pending')?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const paidCommission = commissions?.filter(c => c.status === 'paid')?.reduce((sum, c) => sum + (c.net_amount || c.amount || 0), 0) || 0;
      const totalCommission = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      // Get recent orders (contributions to vendor's pools)
      const poolIds = pools?.map(p => p.id) || [];
      if (poolIds.length > 0) {
        const { data: orders } = await supabase
          .from('contributions')
          .select('*, user:user_id(full_name, phone), pool:pool_id(prize_name)')
          .in('pool_id', poolIds)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10);
        setRecentOrders(orders || []);
      }

      // Get pending deliveries
      const { data: deliveries } = await supabase
        .from('pools')
        .select('*, winner:winner_id(full_name, phone, address)')
        .eq('vendor_id', vendorId)
        .eq('status', 'completed')
        .eq('prize_delivered', false)
        .order('completed_at', { ascending: false });

      setPendingDeliveries(deliveries || []);

      setStats({ 
        total_products: productsData?.length || 0, 
        total_pools: totalPools,
        completed_pools: completedPools.length,
        total_sales: totalSales,
        total_commission: totalCommission,
        pending_commission: pendingCommission,
        paid_commission: paidCommission
      });
      
    } catch (error) { 
      console.error('Error loading vendor data:', error); 
      toast.error('Failed to load dashboard data');
    } finally { 
      setLoading(false); 
    }
  }

  async function updateProductDiscount(productId, discountRate) {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ discount_rate: discountRate, updated_at: new Date().toISOString() })
        .eq('id', productId);
      
      if (error) throw error;
      
      toast.success(`Discount set to ${discountRate}%`);
      await loadVendorData(user.id);
      setShowDiscountModal(false);
    } catch (error) {
      console.error('Discount update error:', error);
      toast.error('Failed to update discount');
    }
  }

  async function markDeliveryComplete(poolId) {
    try {
      const { error } = await supabase
        .from('pools')
        .update({ prize_delivered: true, delivered_at: new Date().toISOString() })
        .eq('id', poolId);
      
      if (error) throw error;
      
      toast.success('Prize delivery confirmed!');
      await loadVendorData(user.id);
    } catch (error) {
      console.error('Delivery error:', error);
      toast.error('Failed to update delivery status');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading vendor dashboard...</p>
        </div>
      </div>
    );
  }

  const charityAmount = stats.total_commission * 0.02;
  const livesImpacted = Math.floor(charityAmount / 100);

  return (
    <DashboardLayout 
      title={`Welcome, Vendor ${profile?.full_name?.split(' ')[0] || ''}! 🏪`} 
      subtitle="List products, create pools, earn 10% commission" 
      icon="🏪" 
      bgGradient="from-purple-600 to-pink-600" 
      user={user} 
      profile={profile}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-3 text-center">
          <p className="text-gray-500 text-xs">Products</p>
          <p className="text-xl font-bold text-purple-600">{stats.total_products}</p>
          <Link href="/vendor/listings/create" className="text-[10px] text-purple-500">+ Add</Link>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-3 text-center">
          <p className="text-gray-500 text-xs">Prize Pools</p>
          <p className="text-xl font-bold text-blue-600">{stats.total_pools}</p>
          <p className="text-[10px] text-green-600">{stats.completed_pools} completed</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-3 text-center">
          <p className="text-gray-500 text-xs">Total Sales</p>
          <p className="text-sm font-bold text-green-600">ETB {stats.total_sales.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-3 text-center">
          <p className="text-gray-500 text-xs">Commission</p>
          <p className="text-sm font-bold text-yellow-600">ETB {stats.total_commission.toLocaleString()}</p>
          {stats.pending_commission > 0 && <p className="text-[10px] text-orange-500">{stats.pending_commission.toLocaleString()} pending</p>}
        </div>
        <div className="bg-white rounded-2xl shadow-md p-3 text-center">
          <p className="text-gray-500 text-xs">Paid</p>
          <p className="text-xl font-bold text-green-600">ETB {stats.paid_commission.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-3 text-white text-center">
          <p className="text-[10px] opacity-90">Charity Impact</p>
          <p className="text-xl font-bold">💚 {livesImpacted}</p>
          <p className="text-[9px] opacity-80">from commissions</p>
        </div>
      </div>

      {/* Vendor Explanation */}
      <div className="mb-6 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
        <div className="flex items-start gap-2">
          <div className="text-2xl">🏪</div>
          <div>
            <h3 className="font-bold text-purple-800 text-sm">Your Vendor Dashboard</h3>
            <p className="text-xs text-purple-700">List products, earn <strong>10% commission</strong>, offer discounts (5-50%) to non-winners!</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Link href="/vendor/listings/create" className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-2 text-white text-center text-xs font-semibold">
          + List Product
        </Link>
        <Link href="/create-pool" className="bg-white rounded-xl p-2 shadow-md border text-center text-xs font-semibold text-gray-700">
          Create Pool
        </Link>
        <Link href="/vendor/analytics" className="bg-white rounded-xl p-2 shadow-md border text-center text-xs font-semibold text-gray-700">
          Analytics
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">📋 Your Products</h2>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {products.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-gray-400 text-sm">No products yet</p>
                <Link href="/vendor/listings/create" className="text-purple-600 text-xs mt-2 inline-block">Add your first product →</Link>
              </div>
            ) : (
              <div className="divide-y">
                {products.map(product => (
                  <div key={product.id} className="p-3 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-sm">{product.title}</h3>
                        <p className="text-xs text-gray-500">Value: ETB {product.estimated_value?.toLocaleString()}</p>
                        {product.discount_rate > 0 && (
                          <p className="text-xs text-green-600">Discount: {product.discount_rate}% off</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDiscountModal(true);
                          }}
                          className="text-blue-600 text-xs hover:underline"
                        >
                          💰 Discount
                        </button>
                        <Link href={`/vendor/products/${product.id}`} className="text-purple-600 text-xs hover:underline">
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">🛒 Recent Orders</h2>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-gray-400 text-sm">No orders yet</p>
                <p className="text-xs text-gray-300">Create a pool to start selling!</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentOrders.map(order => (
                  <div key={order.id} className="p-3 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm text-gray-800">{order.user?.full_name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">Pool: {order.pool?.prize_name}</p>
                        <p className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="font-bold text-green-600 text-sm">ETB {order.amount?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Deliveries */}
      {pendingDeliveries.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🚚 Pending Deliveries</h2>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="divide-y">
              {pendingDeliveries.map(pool => (
                <div key={pool.id} className="p-3 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-sm">{pool.prize_name}</h3>
                      <p className="text-xs text-gray-600">Winner: {pool.winner?.full_name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">Phone: {pool.winner?.phone || 'N/A'}</p>
                      {pool.winner?.address && (
                        <p className="text-[10px] text-gray-400">Address: {pool.winner.address}</p>
                      )}
                    </div>
                    <button
                      onClick={() => markDeliveryComplete(pool.id)}
                      className="bg-green-600 text-white px-2 py-1 rounded-lg text-[10px] hover:bg-green-700 transition"
                    >
                      Delivered
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Set Discount for {selectedProduct.title}</h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-gray-400">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Offer discounts to non-winners to boost participation!</p>
            <div className="flex gap-3 mb-4">
              {[5, 10, 15, 20, 30, 50].map(rate => (
                <button
                  key={rate}
                  onClick={() => updateProductDiscount(selectedProduct.id, rate)}
                  className="flex-1 bg-gray-100 py-2 rounded-lg text-sm hover:bg-purple-100 transition"
                >
                  {rate}%
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Custom %"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    updateProductDiscount(selectedProduct.id, parseInt(e.target.value));
                  }
                }}
              />
              <button
                onClick={() => updateProductDiscount(selectedProduct.id, 0)}
                className="text-red-600 text-sm px-3"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
