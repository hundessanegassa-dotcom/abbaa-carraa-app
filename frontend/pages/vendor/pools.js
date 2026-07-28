// pages/vendor/pools.js - Vendor Pools Management
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';

export default function VendorPools() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState([]);
  const [vendorDetails, setVendorDetails] = useState(null);

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
        toast.error('Vendor access required');
        router.push('/dashboard');
        return;
      }

      await loadPools(vendorData.id);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPools(vendorId) {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPools(data || []);
    } catch (error) {
      console.error('Error loading pools:', error);
      toast.error('Failed to load pools');
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    const labels = {
      active: '🟢 Active',
      pending: '⏳ Pending',
      completed: '✅ Completed',
      cancelled: '❌ Cancelled'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading your pools..." />;
  }

  return (
    <DashboardLayout 
      title="My Pools" 
      subtitle="Manage your prize pools"
      icon="🏊"
      bgGradient="from-purple-600 to-pink-600"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/vendor/dashboard" />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🏊 Prize Pools</h2>
          <p className="text-sm text-gray-500">Manage all your pools and track their progress</p>
        </div>
        <Link href="/create-pool" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition">
          + Create New Pool
        </Link>
      </div>

      {pools.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🏊</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No pools created yet</h3>
          <p className="text-gray-400 mb-6">Start creating prize pools to earn 10% commission!</p>
          <Link href="/create-pool" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition">
            Create Your First Pool
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pools.map((pool) => (
            <div key={pool.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition">
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800 truncate">{pool.prize_name || pool.name}</h3>
                  {getStatusBadge(pool.status)}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{pool.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">🎯 Target:</span>
                    <span className="font-bold">ETB {pool.target_amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">💰 Collected:</span>
                    <span className="font-bold text-green-600">ETB {pool.current_amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">👥 Participants:</span>
                    <span className="font-bold">{pool.total_participants || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">📊 Progress:</span>
                    <span className="font-bold">
                      {pool.target_amount > 0 
                        ? `${Math.min(Math.round((pool.current_amount / pool.target_amount) * 100), 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.round((pool.current_amount / pool.target_amount) * 100), 100)}%` }}
                  />
                </div>
                
                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {new Date(pool.created_at).toLocaleDateString()}
                  </span>
                  <Link href={`/pools/${pool.id}`} className="text-purple-600 text-sm font-medium hover:underline">
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
