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
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({ totalSales: 0, orders: 0, avgOrder: 0, activeListings: 0, views: 0, conversion: 0 });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

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

      await loadVendorData(user.id);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadVendorData(userId) {
    // MOCK DATA since schema might not fully support vendor products yet
    setStats({
      totalSales: 150000,
      orders: 24,
      avgOrder: 6250,
      activeListings: 5,
      views: 1240,
      conversion: 1.9
    });
    
    setProducts([
      { id: 1, name: 'Samsung 55" 4K TV', price: 45000, stock: 12, status: 'active', image: null },
      { id: 2, name: 'PlayStation 5', price: 65000, stock: 3, status: 'active', image: null }, // Low stock
      { id: 3, name: 'iPhone 15 Pro', price: 120000, stock: 0, status: 'disabled', image: null } // Out of stock
    ]);

    setOrders([
      { id: 'ORD-001', product: 'PlayStation 5', buyer: 'Abebe K.', date: '2026-05-15', amount: 65000, status: 'Delivered' },
      { id: 'ORD-002', product: 'Samsung 55" 4K TV', buyer: 'Tirhas H.', date: '2026-05-16', amount: 45000, status: 'Processing' },
    ]);
  }

  const handleDeleteProduct = (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted successfully');
    }
  };

  const handleToggleStatus = (id) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        const newStatus = p.status === 'active' ? 'disabled' : 'active';
        toast.success(`Product marked as ${newStatus}`);
        return { ...p, status: newStatus };
      }
      return p;
    }));
  };

  if (loading) return <LoadingSpinner fullPage message="Loading Vendor Dashboard..." />;

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 5);

  return (
    <DashboardLayout 
      title="Vendor Dashboard" 
      subtitle="Manage inventory and track your sales"
      icon="🏪"
      bgGradient="from-purple-500 to-pink-500"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/" />

      {/* Warnings & Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="mb-8 bg-orange-50 border border-orange-200 text-orange-800 px-6 py-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
          <div className="text-3xl">⚠️</div>
          <div>
            <h3 className="font-bold">Low Stock Alert</h3>
            <p className="text-sm mt-1">You have {lowStockProducts.length} product(s) with less than 5 items in stock. Please restock soon.</p>
          </div>
        </div>
      )}

      {/* Sales Summary & Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-sm text-gray-500 font-medium">Total Sales</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalSales.toLocaleString()} ETB</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-sm text-gray-500 font-medium">Orders</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.orders}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-sm text-gray-500 font-medium">Active Listings</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.activeListings}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-sm text-gray-500 font-medium">Conversion Rate</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.conversion}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Management */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">My Products</h3>
              <Link href="/vendor/listings/create" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-1">
                <span>➕</span> Add Product
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-sm">
                    <th className="pb-3 px-2 font-medium">Product</th>
                    <th className="pb-3 px-2 font-medium">Price</th>
                    <th className="pb-3 px-2 font-medium">Stock</th>
                    <th className="pb-3 px-2 font-medium">Status</th>
                    <th className="pb-3 px-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {products.map((product) => (
                    <tr key={product.id} className={`border-b border-gray-100 hover:bg-gray-50 ${product.status === 'disabled' ? 'opacity-60' : ''}`}>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xl">
                            {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded" /> : '📦'}
                          </div>
                          <span className="font-semibold text-gray-800">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 font-medium text-gray-800">{product.price.toLocaleString()} ETB</td>
                      <td className="py-4 px-2">
                        <span className={`font-bold ${product.stock === 0 ? 'text-red-500' : product.stock < 5 ? 'text-orange-500' : 'text-green-600'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/vendor/listings/create?edit=${product.id}`} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition" title="Edit">✏️</Link>
                          <button onClick={() => handleToggleStatus(product.id)} className="text-orange-600 hover:bg-orange-50 p-1.5 rounded transition" title={product.status === 'active' ? 'Disable' : 'Enable'}>
                            {product.status === 'active' ? '⏸️' : '▶️'}
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition" title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-500">You haven't listed any products yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Recent Orders */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>📦</span> Recent Orders
              </h3>
              <button className="text-sm text-purple-600 hover:underline">View All</button>
            </div>
            
            <div className="space-y-4">
              {orders.map((order, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-800 text-sm">{order.product}</span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{order.id}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Buyer: {order.buyer}</span>
                    <span>{order.date}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                    <span className="font-bold text-purple-600">{order.amount.toLocaleString()} ETB</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No recent orders.</p>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
