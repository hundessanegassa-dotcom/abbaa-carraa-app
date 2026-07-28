// pages/vendor/deliveries.js - Vendor Deliveries Management
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import BackButton from '../../components/BackButton';
import LoadingSpinner from '../../components/LoadingSpinner';

// ✅ Dynamically import components with SSR disabled
const DashboardLayout = dynamic(
  () => import('../../components/DashboardLayout'),
  { 
    ssr: false, 
    loading: () => <LoadingSpinner fullPage message="Loading dashboard..." /> 
  }
);

// ✅ Import toast only on client side
let toast;
if (typeof window !== 'undefined') {
  import('react-hot-toast').then(module => {
    toast = module.default;
  });
}

// Helper function to safely show toast
function showToast(message, type = 'success') {
  if (typeof window !== 'undefined' && toast) {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else toast(message);
  }
}

export default function VendorDeliveries() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(false);

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
      setVendorDetails(vendorData);

      if (!vendorData) {
        showToast('Vendor access required', 'error');
        router.push('/dashboard');
        return;
      }

      await loadDeliveries(vendorData.id);
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadDeliveries(vendorId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(name, price, image_url),
          buyer:profiles!buyer_id(full_name, email, phone)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      showToast('Failed to load deliveries', 'error');
    }
  }

  async function updateDeliveryStatus(orderId, newStatus) {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      showToast(`Order status updated to ${newStatus}`, 'success');
      await loadDeliveries(vendorDetails.id);
    } catch (error) {
      console.error('Error updating delivery:', error);
      showToast('Failed to update delivery status', 'error');
    } finally {
      setUpdating(false);
    }
  }

  const getFilteredDeliveries = () => {
    if (filter === 'all') return deliveries;
    return deliveries.filter(d => d.status === filter);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusOptions = (currentStatus) => {
    const flow = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: []
    };
    return flow[currentStatus] || [];
  };

  const filteredDeliveries = getFilteredDeliveries();
  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    processing: deliveries.filter(d => d.status === 'processing').length,
    shipped: deliveries.filter(d => d.status === 'shipped').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading deliveries..." />;
  }

  return (
    <DashboardLayout 
      title="Deliveries" 
      subtitle="Manage your product deliveries"
      icon="🚚"
      bgGradient="from-purple-600 to-pink-600"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/vendor/dashboard" />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-500">📋 Total Orders</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-yellow-600">⏳ Pending</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-200 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
          <p className="text-xs text-blue-600">🔄 Processing</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 shadow-sm border border-purple-200 text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
          <p className="text-xs text-purple-600">📦 Shipped</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
          <p className="text-xs text-green-600">✅ Delivered</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⏳ Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('processing')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔄 Processing ({stats.processing})
          </button>
          <button
            onClick={() => setFilter('shipped')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'shipped' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📦 Shipped ({stats.shipped})
          </button>
        </div>
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No deliveries found</h3>
          <p className="text-gray-400">
            {filter === 'all' 
              ? 'You don\'t have any deliveries yet' 
              : `No ${filter} deliveries to show`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-mono">
                      #{delivery.order_number || delivery.id.slice(-8)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {delivery.product?.image_url ? (
                          <img src={delivery.product.image_url} alt={delivery.product.name} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-lg">📦</div>
                        )}
                        <span className="text-sm">{delivery.product?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{delivery.buyer?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{delivery.buyer?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-sm">
                      ETB {delivery.amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                        {delivery.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusOptions(delivery.status).length > 0 ? (
                        <div className="flex gap-1">
                          {getStatusOptions(delivery.status).map((status) => (
                            <button
                              key={status}
                              onClick={() => updateDeliveryStatus(delivery.id, status)}
                              disabled={updating}
                              className={`px-2 py-1 rounded text-xs font-medium transition ${
                                status === 'cancelled' 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : status === 'delivered' 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ✅ Use getServerSideProps instead of getStaticProps to avoid prerendering issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
