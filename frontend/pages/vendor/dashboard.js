import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../DashboardLayout';

export default function VendorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vendorData, setVendorData] = useState(null);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ 
    total_products: 0, 
    total_pools: 0, 
    completed_pools: 0,
    total_sales: 0,
    pending_commission: 0,
    paid_commission: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [charityStats, setCharityStats] = useState({ total_charity: 0, lives_impacted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkVendor(); }, []);

  async function checkVendor() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
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
        .single();
      
      if (vendorError && vendorError.code !== 'PGRST116') throw vendorError;
      setVendorData(vendor);
      const vendorId = vendor?.id;

      // Get vendor's products/listings
      const { data: productsData } = await supabase
        .from('listings')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      
      setProducts(productsData || []);

      // Get pools created from vendor's listings
      const { data: pools } = await supabase
        .from('pools')
        .select('*, listing:listing_id(*)')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      const activePools = pools?.filter(p => p.status === 'active') || [];
      const completedPools = pools?.filter(p => p.status === 'completed') || [];
      const totalPools = pools?.length || 0;

      // Calculate total sales/value
      const totalSales = pools?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;

      // Get commission data
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status, net_amount, withholding_tax')
        .eq('user_id', userId)
        .eq('commission_type', 'vendor');

      const pendingCommission = commissions?.filter(c => c.status === 'pending')?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const paidCommission = commissions?.filter(c => c.status === 'paid')?.reduce((sum, c) => sum + (c.net_amount || c.amount || 0), 0) || 0;
      const totalCommission = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      // Get recent orders (pools that have contributors)
      const { data: orders } = await supabase
        .from('contributions')
        .select('*, pool:pools(*, winner:winner_id(*))')
        .in('pool_id', pools?.map(p => p.id) || [])
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentOrders(orders || []);

      // Get pending deliveries (products that need to be delivered to winners)
      const { data: deliveries } = await supabase
        .from('pools')
        .select('*, winner:winner_id(full_name, phone, address)')
        .eq('vendor_id', vendorId)
        .eq('status', 'completed')
        .eq('prize_delivered', false)
        .order('completed_at', { ascending: false });

      setPendingDeliveries(deliveries || []);

      // Calculate charity contribution (2% of vendor's commission)
      const totalCharity = totalCommission * 0.02;
      setCharityStats({
        total_charity: totalCharity,
        lives_impacted: Math.floor(totalCharity / 100)
      });

      setStats({ 
        total_products: productsData?.length || 0, 
        total_pools: totalPools,
        completed_pools: completedPools.length,
        total_sales: totalSales,
        pending_commission: pendingCommission,
        paid_commission: paidCommission
      });
      
    } catch (error) { 
      console.error('Error loading vendor data:', error); 
    } finally { 
      setLoading(false); 
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

  return (
    <DashboardLayout 
      title="Vendor Dashboard" 
      subtitle="List products, create pools, and earn 10% commission" 
      icon="🏪" 
      bgGradient="from-purple-600 to-pink-600" 
      user={user} 
      profile={profile}
    >
      {/* Stats Cards - 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Total Products</p>
              <p className="text-xl md:text-3xl font-bold text-purple-600">{stats.total_products}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">📦</span>
            </div>
          </div>
          <Link href="/vendor/listings/create" className="text-xs text-purple-500 mt-1 inline-block hover:underline">
            + Add Product
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Prize Pools</p>
              <p className="text-xl md:text-3xl font-bold text-blue-600">{stats.total_pools}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">🎯</span>
            </div>
          </div>
          <div className="flex gap-2 text-xs mt-1">
            <span className="text-green-600">{stats.completed_pools} completed</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Total Sales</p>
              <p className="text-xl md:text-3xl font-bold text-green-600">ETB {stats.total_sales.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 hover:shadow-lg transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">Commission</p>
              <p className="text-xl md:text-3xl font-bold text-yellow-600">ETB {(stats.pending_commission + stats.paid_commission).toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">💎</span>
            </div>
          </div>
          {stats.pending_commission > 0 && (
            <p className="text-xs text-orange-500 mt-1">{stats.pending_commission.toLocaleString()} ETB pending</p>
          )}
        </div>

        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-md p-4 md:p-6 text-white group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">Charity Impact</p>
              <p className="text-xl md:text-2xl font-bold">💚 {Math.floor(charityStats.lives_impacted)} lives</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <span className="text-lg md:text-xl">❤️</span>
            </div>
          </div>
          <p className="text-xs opacity-80 mt-1">2% of commissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content - 2 columns on desktop */}
        <div className="lg:col-span-2 space-y-6">
          {/* Your Products Section */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b bg-gray-50">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-lg font-bold flex items-center gap-2">📋 Your Products</h2>
                <Link href="/vendor/listings/create" className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-700 transition">
                  + Add New Product
                </Link>
              </div>
            </div>
            <div className="p-4 md:p-6">
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-3">📦</div>
                  <p className="text-gray-400">No products listed yet</p>
                  <Link href="/vendor/listings/create" className="text-purple-600 text-sm mt-3 inline-block hover:underline">
                    Add Your First Product →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.slice(0, 5).map(product => (
                    <div key={product.id} className="border rounded-xl p-4 hover:shadow-md transition">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">{product.title}</h3>
                          <p className="text-sm text-gray-500">Value: ETB {product.estimated_value?.toLocaleString()}</p>
                          {product.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description.substring(0, 100)}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/vendor/products/${product.id}`} className="text-purple-600 text-sm hover:underline">
                            Edit
                          </Link>
                          <Link href={`/create-pool?listing=${product.id}`} className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700 transition">
                            Create Pool
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats.total_products > 5 && (
                    <div className="text-center pt-2">
                      <Link href="/vendor/products" className="text-purple-600 text-sm hover:underline">
                        View all {stats.total_products} products →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pending Deliveries */}
          {pendingDeliveries.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b bg-yellow-50">
                <h2 className="text-lg font-bold flex items-center gap-2">🚚 Pending Deliveries</h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="space-y-3">
                  {pendingDeliveries.map(pool => (
                    <div key={pool.id} className="border border-yellow-200 rounded-xl p-4 bg-yellow-50/30">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{pool.prize_name}</h3>
                          <p className="text-sm text-gray-600">Winner: {pool.winner?.full_name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Phone: {pool.winner?.phone || 'N/A'}</p>
                          {pool.winner?.address && (
                            <p className="text-xs text-gray-500">Address: {pool.winner.address}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Completed: {new Date(pool.completed_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
                            Mark Delivered
                          </button>
                          <Link href={`/pools/${pool.id}`} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition">
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-bold flex items-center gap-2">🛒 Recent Orders</h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="space-y-3">
                  {recentOrders.slice(0, 5).map(order => (
                    <div key={order.id} className="border rounded-xl p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{order.pool?.prize_name}</p>
                          <p className="text-sm text-gray-500">Amount: ETB {order.amount?.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Paid</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1 column on desktop */}
        <div className="space-y-6">
          {/* Grow Your Business */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 md:p-6 text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">🎯 Grow Your Business</h3>
            <div className="space-y-3">
              <div className="bg-white/20 rounded-lg p-3">
                <p className="font-semibold">10% Commission</p>
                <p className="text-sm opacity-90">On every pool created from your products</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="font-semibold">Example:</p>
                <p className="text-sm opacity-90">Product value 500,000 ETB → Pool collects 600,000 ETB → You earn 50,000 ETB</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="font-semibold">Discount Offers:</p>
                <p className="text-sm opacity-90">Offer 5-50% discounts to non-winners to boost participation</p>
              </div>
            </div>
            <Link href="/vendor/listings/create" className="inline-block mt-5 bg-white text-purple-600 px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition text-center w-full">
              + Add New Product
            </Link>
            <Link href="/create-pool" className="inline-block mt-3 bg-white/20 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-white/30 transition text-center w-full">
              Create Prize Pool →
            </Link>
          </div>

          {/* Tips for Success */}
          <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">💡 Tips for Success</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Use high-quality product images</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Write detailed product descriptions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Offer discounts (5-50%) to non-winners</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Respond to winners within 48 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Ensure fast delivery for repeat business</span>
              </li>
            </ul>
          </div>

          {/* Discount Strategy */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-4 md:p-6 text-white">
            <h3 className="font-bold mb-3 flex items-center gap-2">🏷️ Discount Strategy</h3>
            <p className="text-sm mb-3">Offer discounts to non-winners to boost participation:</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-white/20 rounded-lg p-2 text-sm">
                <span>5% discount</span>
                <span className="text-xs">For 1-10 contributors</span>
              </div>
              <div className="flex justify-between items-center bg-white/20 rounded-lg p-2 text-sm">
                <span>10% discount</span>
                <span className="text-xs">For 11-50 contributors</span>
              </div>
              <div className="flex justify-between items-center bg-white/20 rounded-lg p-2 text-sm">
                <span>20-50% discount</span>
                <span className="text-xs">For bulk participation</span>
              </div>
            </div>
          </div>

          {/* Charity Section */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-4 md:p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💚</span>
              <h3 className="text-xl font-bold">Making a Difference</h3>
            </div>
            <p className="text-sm opacity-95 mb-3">
              2% of your commissions support Ethiopians fighting <strong>kidney disease</strong> and <strong>heart disease</strong>.
            </p>
            {charityStats.total_charity > 0 && (
              <div className="bg-white/20 rounded-xl p-3 mb-3">
                <p className="text-xs opacity-90">Your contribution to health:</p>
                <p className="text-xl font-bold">ETB {charityStats.total_charity.toLocaleString()}</p>
                <p className="text-xs opacity-75">Lives impacted: {charityStats.lives_impacted}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm border-t border-white/20 pt-3 mt-2">
              <span>💚</span>
              <span className="text-xs">Every product you list saves lives</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">📊 Vendor Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Commission rate:</span>
                <span className="font-medium text-green-600">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Products sold:</span>
                <span className="font-medium">{stats.completed_pools}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Conversion rate:</span>
                <span className="font-medium">{stats.total_products > 0 ? Math.round((stats.completed_pools / stats.total_products) * 100) : 0}%</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <Link href="/vendor/earnings" className="text-purple-600 text-sm hover:underline flex justify-between">
                  View earnings report →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
