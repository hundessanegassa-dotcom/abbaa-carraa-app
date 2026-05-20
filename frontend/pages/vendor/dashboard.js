import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';

export default function VendorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [stats, setStats] = useState({ 
    totalSales: 0, 
    orders: 0, 
    avgOrder: 0, 
    activeListings: 0, 
    views: 0, 
    conversion: 0,
    totalCommission: 0,
    pendingCommission: 0,
    charityContribution: 0
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [pendingDeliveries, setPendingDeliveries] = useState([]);

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
        .single();

      setProfile(profile || {});
      
      if (profile && profile.agreement_accepted !== true) {
        router.push('/register');
        return;
      }

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setVendorDetails(vendorData);

      await loadVendorData(user.id);
      await loadPendingDeliveries(user.id);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadVendorData(userId) {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', userId)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      
      setProducts(productsData || []);
      
      const activeListings = productsData?.filter(p => p.status === 'active')?.length || 0;
      const totalStockValue = productsData?.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0) || 0;
      
      const productIds = productsData?.map(p => p.id) || [];
      
      let ordersData = [];
      if (productIds.length > 0) {
        const { data: ordersResult, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            buyer:profiles!buyer_id(full_name, email)
          `)
          .in('product_id', productIds)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (!ordersError) ordersData = ordersResult || [];
      }
      setOrders(ordersData);
      
      const totalSales = ordersData?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
      const ordersCount = ordersData?.length || 0;
      const avgOrder = ordersCount > 0 ? totalSales / ordersCount : 0;
      
      const totalCommission = totalSales * 0.10;
      const paidCommission = ordersData?.filter(o => o.commission_paid)?.reduce((sum, o) => sum + (o.amount * 0.10), 0) || 0;
      const pendingCommission = totalCommission - paidCommission;
      const charityContribution = totalSales * 0.02;
      
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('commission_type', 'vendor')
        .order('requested_at', { ascending: false })
        .limit(10);
      
      setWithdrawalHistory(withdrawals || []);
      
      setStats({
        totalSales,
        orders: ordersCount,
        avgOrder,
        activeListings,
        views: totalStockValue,
        conversion: ordersCount > 0 ? ((ordersCount / (productsData?.length || 1)) * 100).toFixed(1) : 0,
        totalCommission,
        pendingCommission,
        charityContribution
      });
      
    } catch (error) {
      console.error('Error loading vendor data:', error);
      toast.error('Failed to load vendor data');
    }
  }

  async function loadPendingDeliveries(userId) {
    try {
      const { data: deliveries } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          amount,
          status,
          created_at,
          product:products(name),
          buyer:profiles!buyer_id(full_name)
        `)
        .eq('vendor_id', userId)
        .in('status', ['pending', 'processing', 'shipped'])
        .order('created_at', { ascending: false });
      
      setPendingDeliveries(deliveries || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  }

  const handleToggleStatus = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    setSubmitting(true);
    
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', productId);
    
    if (error) {
      toast.error('Failed to update product status');
    } else {
      toast.success(`Product ${newStatus === 'active' ? 'activated' : 'disabled'}`);
      await loadVendorData(user.id);
    }
    setSubmitting(false);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('⚠️ Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    setSubmitting(true);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted successfully');
      await loadVendorData(user.id);
    }
    setSubmitting(false);
  };

  const handleWithdrawRequest = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > stats.pendingCommission) {
      toast.error(`You can only withdraw up to ${stats.pendingCommission.toLocaleString()} ETB`);
      return;
    }
    if (amount < 100) {
      toast.error('Minimum withdrawal amount is 100 ETB');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount: amount,
        commission_type: 'vendor',
        status: 'pending',
        payment_method: 'telebirr',
        requested_at: new Date().toISOString()
      });

    if (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to submit withdrawal request');
    } else {
      toast.success(`Withdrawal request of ${amount.toLocaleString()} ETB submitted!`);
      setWithdrawalAmount('');
      setShowWithdrawModal(false);
      await loadVendorData(user.id);
    }
    setSubmitting(false);
  };

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 5);
  const outOfStockProducts = products.filter(p => p.stock === 0 && p.status === 'active');

  if (loading) return <LoadingSpinner fullPage message="Loading Vendor Dashboard..." />;

  return (
    <DashboardLayout 
      title="Vendor Dashboard" 
      subtitle="List products, manage inventory, and earn 10% commission on sales"
      icon="🏪"
      bgGradient="from-purple-600 to-pink-600"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/" />

      {/* Role Description Card - Enhanced for Vendor */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-xl p-5 mb-8">
        <h3 className="font-bold text-purple-800 text-lg mb-2">✨ Your Role: Vendor/Supplier</h3>
        <p className="text-purple-700 text-sm leading-relaxed">
          As a Vendor/Supplier, you provide products for prize pools (cars, real estate, electronics, machinery, etc.).
        </p>
        <div className="mt-3 bg-white/50 rounded-lg p-3 text-sm">
          <p className="font-semibold text-purple-800">🏪 How It Works:</p>
          <ul className="text-purple-700 text-xs mt-1 list-disc list-inside space-y-1">
            <li>You list your products on the platform (car dealer, real estate seller, electronics shop, etc.)</li>
            <li>Agents/Organizations create pools using your products as prizes</li>
            <li>When a pool reaches its target, the <strong>winner receives your product</strong> (physical or cash equivalent)</li>
            <li><strong>Non-winners</strong> receive a discount code to purchase from you directly</li>
            <li>You earn <strong>10% commission</strong> on each sale to winners</li>
            <li>Discount sales to non-winners are <strong>commission-free</strong> (direct profit)</li>
          </ul>
        </div>
        <div className="mt-3 bg-green-50 rounded-lg p-2 text-center text-xs text-green-700">
          💡 Example: A car dealer lists a Toyota. Agent creates a pool. Winner gets the car. 99 non-winners get 20% discount codes to buy from your dealership!
        </div>
        {vendorDetails && vendorDetails.verified && (
          <div className="mt-3 inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
            <span>✓</span> Verified Vendor Account
          </div>
        )}
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/vendor/listings/create" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
          <div className="text-2xl mb-1">➕</div>
          <p className="font-semibold text-sm">List Product</p>
          <p className="text-xs opacity-80">Add new item</p>
        </Link>
        <Link href="/create-pool" className="bg-blue-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
          <div className="text-2xl mb-1">🏊</div>
          <p className="font-semibold text-sm">Create Pool</p>
          <p className="text-xs opacity-80">As vendor/agent</p>
        </Link>
        <button onClick={() => window.location.href = '/vendor/analytics'} className="bg-green-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
          <div className="text-2xl mb-1">📊</div>
          <p className="font-semibold text-sm">Analytics</p>
          <p className="text-xs opacity-80">View reports</p>
        </button>
        <button onClick={() => window.location.href = '/vendor/discounts'} className="bg-orange-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition">
          <div className="text-2xl mb-1">🏷️</div>
          <p className="font-semibold text-sm">Discounts</p>
          <p className="text-xs opacity-80">Manage offers</p>
        </button>
      </div>

      {/* Warnings & Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 text-orange-800 px-5 py-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">Low Stock Alert</h3>
            <p className="text-xs mt-0.5">You have {lowStockProducts.length} product(s) with less than 5 items remaining. Please restock soon.</p>
          </div>
          <Link href="/vendor/listings" className="text-orange-600 text-sm font-medium hover:underline">View Products →</Link>
        </div>
      )}

      {outOfStockProducts.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-2xl">📦</div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">Out of Stock</h3>
            <p className="text-xs mt-0.5">{outOfStockProducts.length} product(s) are out of stock and need restocking.</p>
          </div>
          <Link href="/vendor/listings" className="text-red-600 text-sm font-medium hover:underline">Update Stock →</Link>
        </div>
      )}

      {/* Sales Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-2 text-lg">💰</div>
          <p className="text-xs text-gray-500 font-medium">Total Sales</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{stats.totalSales.toLocaleString()} ETB</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 text-lg">📦</div>
          <p className="text-xs text-gray-500 font-medium">Orders</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{stats.orders}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2 text-lg">🏷️</div>
          <p className="text-xs text-gray-500 font-medium">Active Listings</p>
          <p className="text-xl font-bold text-purple-600 mt-1">{stats.activeListings}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
          <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-2 text-lg">📈</div>
          <p className="text-xs text-gray-500 font-medium">Conversion</p>
          <p className="text-xl font-bold text-yellow-600 mt-1">{stats.conversion}%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-5 rounded-2xl shadow-sm text-center text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 text-lg">💸</div>
          <p className="text-xs font-medium opacity-90">Pending Commission</p>
          <p className="text-xl font-bold mt-1">{stats.pendingCommission.toLocaleString()} ETB</p>
          <p className="text-xs opacity-75">10% of sales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Management */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h3 className="text-xl font-bold text-gray-800">📦 My Products</h3>
              <Link href="/vendor/listings/create" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-2">
                <span>➕</span> Add New Product
              </Link>
            </div>
            
            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-3">🛍️</div>
                <p className="text-gray-400 mb-3">You haven't listed any products yet</p>
                <Link href="/vendor/listings/create" className="text-purple-600 font-semibold hover:underline">
                  Create your first product listing →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-3 px-3 font-semibold text-gray-600 text-sm">Product</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-sm">Price</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-sm">Stock</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-sm">Sales</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-sm">Status</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-sm text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {products.map((product) => (
                      <tr key={product.id} className={`border-b border-gray-100 hover:bg-gray-50 ${product.status === 'disabled' ? 'opacity-60' : ''}`}>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">📦</div>
                            )}
                            <span className="font-semibold text-gray-800">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-gray-800">{product.price?.toLocaleString()} ETB</td>
                        <td className="py-3 px-3">
                          <span className={`font-bold ${
                            product.stock === 0 ? 'text-red-500' : 
                            product.stock < 5 ? 'text-orange-500' : 
                            'text-green-600'
                          }`}>
                            {product.stock || 0}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{product.total_sales || 0}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                            product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {product.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/vendor/listings/edit/${product.id}`} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition" title="Edit">✏️</Link>
                            <button onClick={() => handleToggleStatus(product.id, product.status)} disabled={submitting} className="text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition" title={product.status === 'active' ? 'Disable' : 'Enable'}>
                              {product.status === 'active' ? '⏸️' : '▶️'}
                            </button>
                            <button onClick={() => handleDeleteProduct(product.id)} disabled={submitting} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition" title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pending Deliveries */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>🚚</span> Pending Deliveries
              {pendingDeliveries.length > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingDeliveries.length}</span>
              )}
            </h3>
            {pendingDeliveries.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No pending deliveries</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {pendingDeliveries.slice(0, 4).map(delivery => (
                  <div key={delivery.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{delivery.product?.name || 'Product'}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        delivery.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 
                        delivery.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {delivery.status || 'pending'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Buyer: {delivery.buyer?.full_name || 'Customer'}</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-400">{new Date(delivery.created_at).toLocaleDateString()}</span>
                      <button className="text-purple-600 text-xs font-medium hover:underline">Update Status</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/vendor/deliveries" className="block text-center text-purple-600 text-sm mt-3 hover:underline">
              View All Deliveries →
            </Link>
          </div>

          {/* Commission Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl shadow-sm border border-green-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>💰</span> Commission Summary (10%)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-green-100">
                <span className="text-gray-600">Total Sales</span>
                <span className="font-bold">{stats.totalSales.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between py-2 border-b border-green-100">
                <span className="text-gray-600">Your Commission (10%)</span>
                <span className="font-bold text-purple-600">{stats.totalCommission.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between py-2 border-b border-green-100">
                <span className="text-gray-600">Platform Fee (10%)</span>
                <span className="font-bold text-blue-600">{stats.totalCommission.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Pending Payout</span>
                <span className="font-bold text-orange-600">{stats.pendingCommission.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between py-2 border-t border-green-200 mt-1 pt-2">
                <span className="text-gray-600">💚 Charity (2%)</span>
                <span className="font-bold text-pink-600">{stats.charityContribution.toLocaleString()} ETB</span>
              </div>
            </div>
            <button 
              onClick={() => setShowWithdrawModal(true)} 
              disabled={stats.pendingCommission === 0}
              className={`w-full mt-4 py-2 rounded-xl font-semibold text-sm transition ${
                stats.pendingCommission > 0 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              💵 Withdraw Earnings {stats.pendingCommission > 0 && `(${stats.pendingCommission.toLocaleString()} ETB)`}
            </button>
          </div>

          {/* Tips for Success */}
          <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <span>💡</span> Tips for Success
            </h3>
            <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
              <li>List high-quality products with clear images</li>
              <li>Keep your inventory stocked and updated</li>
              <li>Offer competitive prices to attract winners</li>
              <li>Respond quickly to order inquiries</li>
              <li>Build your reputation with good ratings</li>
              <li>Create discounts to boost sales to non-winners</li>
            </ul>
          </div>

          {/* Withdrawal History */}
          {withdrawalHistory.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>📜</span> Withdrawal History
              </h3>
              <div className="space-y-2">
                {withdrawalHistory.slice(0, 3).map(w => (
                  <div key={w.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
                    <span>{new Date(w.requested_at).toLocaleDateString()}</span>
                    <span className="font-bold">{w.amount?.toLocaleString()} ETB</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      w.status === 'approved' ? 'bg-green-100 text-green-700' :
                      w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">💵 Withdraw Earnings</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <p className="text-gray-600 mb-1">Available for withdrawal: <strong className="text-green-600">{stats.pendingCommission.toLocaleString()} ETB</strong></p>
            <p className="text-xs text-gray-400 mb-4">Minimum withdrawal: 100 ETB</p>
            
            <input
              type="number"
              placeholder="Enter amount"
              className="w-full border rounded-lg p-3 mb-4"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
            />
            
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm">
              <p className="font-semibold text-blue-800">💡 Note:</p>
              <p className="text-blue-700 text-xs">Withdrawals are processed within 2-3 business days. Funds will be sent to your registered Telebirr account.</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleWithdrawRequest}
                disabled={submitting}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
              >
                {submitting ? 'Processing...' : 'Request Withdrawal'}
              </button>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
