// pages/admin/verify-payments.js - FIXED with AdminLayout
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout'; // ✅ ADDED

export default function VerifyPayments() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('merkato'); // merkato, city, regular
  
  // Data states
  const [merkatoParticipants, setMerkatoParticipants] = useState([]);
  const [cityParticipants, setCityParticipants] = useState([]);
  const [regularParticipants, setRegularParticipants] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    merkatoPending: 0,
    cityPending: 0,
    regularPending: 0,
    merkatoVerified: 0,
    cityVerified: 0,
    regularVerified: 0
  });

  // Filter states
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedPoolType, setSelectedPoolType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
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

      const { data: adminRecord } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (profile?.role !== 'admin' && !adminRecord) {
        toast.error('Admin access required');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadAllData();
    } catch (error) {
      console.error('Admin check error:', error);
      toast.error('Failed to verify admin access');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    await Promise.all([
      loadMerkatoParticipants(),
      loadCityParticipants(),
      loadRegularParticipants()
    ]);
  };

  const loadMerkatoParticipants = async () => {
    const { data, error } = await supabase
      .from('merkato_vip_participants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setMerkatoParticipants(data);
      setStats(prev => ({
        ...prev,
        merkatoPending: data.filter(p => p.payment_status === 'pending_verification').length,
        merkatoVerified: data.filter(p => p.payment_status === 'verified').length
      }));
    }
  };

  const loadCityParticipants = async () => {
    const { data, error } = await supabase
      .from('city_vip_participants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setCityParticipants(data);
      setStats(prev => ({
        ...prev,
        cityPending: data.filter(p => p.payment_status === 'pending_verification').length,
        cityVerified: data.filter(p => p.payment_status === 'verified').length
      }));
    }
  };

  const loadRegularParticipants = async () => {
    const { data, error } = await supabase
      .from('regular_pool_participants')
      .select('*, pools!pool_id(prize_name, target_amount)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setRegularParticipants(data);
      setStats(prev => ({
        ...prev,
        regularPending: data.filter(p => p.payment_status === 'pending_verification').length,
        regularVerified: data.filter(p => p.payment_status === 'verified').length
      }));
    }
  };

  const verifyPayment = async (tableName, participantId, approved) => {
    if (!confirm(approved ? 'Approve this payment?' : 'Reject this payment?')) return;
    
    try {
      const updateData = approved ? {
        payment_status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
        status: 'active'
      } : {
        payment_status: 'rejected',
        status: 'cancelled'
      };

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', participantId);
      
      if (error) throw error;
      
      toast.success(`Payment ${approved ? 'approved' : 'rejected'} successfully`);
      
      // Reload the appropriate data
      if (tableName === 'merkato_vip_participants') await loadMerkatoParticipants();
      else if (tableName === 'city_vip_participants') await loadCityParticipants();
      else if (tableName === 'regular_pool_participants') await loadRegularParticipants();
      
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify payment');
    }
  };

  const getFilteredParticipants = () => {
    let participants = [];
    if (activeTab === 'merkato') participants = merkatoParticipants;
    else if (activeTab === 'city') participants = cityParticipants;
    else participants = regularParticipants;

    // Filter by status (only show pending_verification by default)
    participants = participants.filter(p => p.payment_status === 'pending_verification');

    // Apply filters
    if (selectedCity !== 'all' && activeTab === 'city') {
      participants = participants.filter(p => p.city === selectedCity);
    }
    if (selectedPoolType !== 'all') {
      participants = participants.filter(p => p.pool_type === selectedPoolType);
    }
    if (searchTerm) {
      participants = participants.filter(p => 
        p.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return participants;
  };

  const getUniqueCities = () => {
    const cities = [...new Set(cityParticipants.map(p => p.city).filter(Boolean))];
    return cities;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  const filteredParticipants = getFilteredParticipants();
  const uniqueCities = getUniqueCities();

  return (
    <AdminLayout
      title="Verify Payments"
      subtitle="Approve or reject payment proofs"
      icon="🔍"
      user={user}
      profile={profile}
      activeTab="verify-payments"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">🏪 Merkato VIP</p>
              <p className="text-3xl font-bold">{stats.merkatoPending}</p>
              <p className="text-xs text-gray-400">Pending verification</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-600">✓ {stats.merkatoVerified} verified</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">🏙️ City VIP</p>
              <p className="text-3xl font-bold">{stats.cityPending}</p>
              <p className="text-xs text-gray-400">Pending verification</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-600">✓ {stats.cityVerified} verified</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">🎁 Regular Pool</p>
              <p className="text-3xl font-bold">{stats.regularPending}</p>
              <p className="text-xs text-gray-400">Pending verification</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-600">✓ {stats.regularVerified} verified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => { setActiveTab('merkato'); setSelectedCity('all'); setSelectedPoolType('all'); }}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${activeTab === 'merkato' ? 'bg-yellow-50 text-yellow-700 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🏪 Merkato VIP ({stats.merkatoPending})
          </button>
          <button
            onClick={() => { setActiveTab('city'); setSelectedCity('all'); setSelectedPoolType('all'); }}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${activeTab === 'city' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🏙️ City VIP ({stats.cityPending})
          </button>
          <button
            onClick={() => { setActiveTab('regular'); setSelectedCity('all'); setSelectedPoolType('all'); }}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${activeTab === 'regular' ? 'bg-green-50 text-green-700 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🎁 Regular Pool ({stats.regularPending})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeTab === 'city' && uniqueCities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Pool Type</label>
            <select
              value={selectedPoolType}
              onChange={(e) => setSelectedPoolType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500"
            >
              <option value="all">All Types</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Name, email or ticket number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="font-bold text-lg">
            {activeTab === 'merkato' && '🏪 Merkato VIP Participants'}
            {activeTab === 'city' && '🏙️ City VIP Participants'}
            {activeTab === 'regular' && '🎁 Regular Pool Participants'}
          </h2>
          <p className="text-sm text-gray-500">{filteredParticipants.length} pending verification</p>
        </div>
        
        <div className="p-4">
          {filteredParticipants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-3">✅</div>
              <p className="text-gray-500">No pending payments to verify</p>
              <p className="text-sm text-gray-400 mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredParticipants.map((participant) => (
                <div key={participant.id} className={`border rounded-lg p-5 ${participant.payment_proof_url ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="space-y-2">
                      {/* Header with badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeTab === 'merkato' && <span className="text-2xl">🏪</span>}
                        {activeTab === 'city' && <span className="text-2xl">🏙️</span>}
                        {activeTab === 'regular' && <span className="text-2xl">🎁</span>}
                        <span className="font-bold text-lg">{participant.user_name}</span>
                        <span className="text-sm text-gray-500 capitalize">{participant.pool_type} pool</span>
                        {activeTab === 'city' && participant.city && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{participant.city}</span>
                        )}
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">⏳ Pending</span>
                      </div>
                      
                      {/* Contact info */}
                      <p className="text-sm text-gray-600">{participant.user_email}</p>
                      
                      {/* Seat info */}
                      <p className="text-sm">Seats: <span className="font-mono font-semibold">{participant.seat_numbers?.join(', ') || 'N/A'}</span></p>
                      
                      {/* Amount info */}
                      <p className="text-lg font-bold text-green-600">ETB {participant.contribution_amount?.toLocaleString()}</p>
                      
                      {/* Ticket info */}
                      <p className="text-xs text-gray-400">Ticket #: {participant.ticket_number}</p>
                      <p className="text-xs text-gray-400">Submitted: {formatDate(participant.payment_submitted_at || participant.created_at)}</p>
                      
                      {/* Reference number if available */}
                      {participant.reference && (
                        <p className="text-xs text-gray-500">Ref: {participant.reference}</p>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-col gap-2">
                      {participant.payment_proof_url && (
                        <button
                          onClick={() => window.open(participant.payment_proof_url, '_blank')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          📸 View Payment Proof
                        </button>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const tableName = activeTab === 'merkato' ? 'merkato_vip_participants' : 
                                              activeTab === 'city' ? 'city_vip_participants' : 
                                              'regular_pool_participants';
                            verifyPayment(tableName, participant.id, true);
                          }}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => {
                            const tableName = activeTab === 'merkato' ? 'merkato_vip_participants' : 
                                              activeTab === 'city' ? 'city_vip_participants' : 
                                              'regular_pool_participants';
                            verifyPayment(tableName, participant.id, false);
                          }}
                          className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview image if available */}
                  {participant.payment_proof_url && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500 mb-2">Screenshot Preview:</p>
                      <img 
                        src={participant.payment_proof_url} 
                        alt="Payment Proof" 
                        className="max-h-48 rounded-lg border cursor-pointer hover:opacity-80 transition"
                        onClick={() => window.open(participant.payment_proof_url, '_blank')}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={loadAllData}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          🔄 Refresh Payments
        </button>
      </div>
    </AdminLayout>
  );
}
