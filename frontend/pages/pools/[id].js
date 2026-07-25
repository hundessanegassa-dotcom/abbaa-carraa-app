// pages/pools/[id].js - Regular pool details + unified seat checkout
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SeatCheckout from '../../components/SeatCheckout';
import { getRegularPoolSeats, OCCUPIED_STATUSES } from '../../lib/seatPrograms';

export default function PoolDetails() {
  const router = useRouter();
  const { id } = router.query;
  const isMounted = useRef(true);
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [takenSeatsCount, setTakenSeatsCount] = useState(0);
  const [language, setLanguage] = useState('am');

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  // Pool calculations
  const winnerPrize = pool?.target_amount || 0;
  const entryFee = pool?.entry_fee || pool?.ticket_price || 10;
  const totalCollection = winnerPrize * 1.2;
  const totalSeats = getRegularPoolSeats(pool ? { ...pool, entry_fee: entryFee } : null);
  const currentAmount = pool?.current_amount || 0;
  const progress = totalCollection > 0 ? (currentAmount / totalCollection) * 100 : 0;
  const availableSeatsCount = Math.max(0, totalSeats - takenSeatsCount);

  useEffect(() => {
    if (id) {
      fetchPool();
      getCurrentUser();
    }
  }, [id]);

  useEffect(() => {
    if (!id && !loading && router.isReady) {
      toast.error('No pool selected');
      router.push('/listings');
    }
  }, [id, loading, router.isReady]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  async function getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted.current) setUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  }

  async function fetchPool() {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error('Pool fetch error:', error);
        toast.error('Could not load pool details. Please try again.');
        setTimeout(() => router.push('/listings'), 2000);
        return;
      }
      
      if (!data) {
        toast.error('Pool not found');
        setTimeout(() => router.push('/listings'), 2000);
        setLoading(false);
        return;
      }
      
      if (isMounted.current) setPool(data);
      await fetchTakenSeatCount(data.id);
      
    } catch (err) {
      console.error('Unexpected error fetching pool:', err);
      toast.error('An unexpected error occurred.');
      setTimeout(() => router.push('/listings'), 2000);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  async function fetchTakenSeatCount(currentPoolId) {
    try {
      const { data, error } = await supabase
        .from('regular_pool_participants')
        .select('seat_numbers, payment_status')
        .eq('pool_id', currentPoolId);

      if (error) throw error;

      const taken = new Set();
      (data || [])
        .filter(row => OCCUPIED_STATUSES.includes(row.payment_status))
        .forEach(row => (row.seat_numbers || []).forEach(seat => taken.add(Number(seat))));

      if (isMounted.current) setTakenSeatsCount(taken.size);
    } catch (error) {
      console.error('Error fetching taken seats:', error);
      if (isMounted.current) setTakenSeatsCount(0);
    }
  }

  const handleJoinNow = () => {
    if (!user) {
      const redirectUrl = `/pools/${id}`;
      localStorage.setItem('abbaa_redirect_after_login', redirectUrl);
      localStorage.setItem('pendingRole', 'individual');
      sessionStorage.setItem('redirectAfterLogin', redirectUrl);
      sessionStorage.setItem('pendingRole', 'individual');
      
      toast.loading('Please login to join this pool...');
      router.push('/login');
      return;
    }
    setShowCheckout(true);
  };

  const handleCheckoutCompleted = () => {
    setShowCheckout(false);
    fetchTakenSeatCount(pool.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading pool details...</p>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-800">Pool Not Found</h1>
          <p className="text-gray-500 mt-2">The pool you're looking for may have been removed or doesn't exist.</p>
          <Link href="/listings" className="inline-block mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition">
            Browse All Pools →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>{pool.prize_name} - Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gray-50 py-8 pb-32">
        <div className="container mx-auto px-4 max-w-7xl">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-800 mb-4 inline-flex items-center gap-1">← Back to listings</button>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="w-full h-64 md:h-80 bg-gray-200 relative">
              {pool.image_url ? (
                <img src={pool.image_url} alt={pool.prize_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <span className="text-6xl">🎁</span>
                </div>
              )}
              {pool.status === 'active' && <span className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">🔴 Active</span>}
              {pool.is_featured && <span className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">⭐ Featured</span>}
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{pool.prize_name}</h1>
                  <p className="text-gray-500 mt-1">{pool.description || 'Join this amazing pool for a chance to win big!'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-gray-500 text-xs">🏆 Winner Gets</p><p className="text-lg font-bold text-green-600">ETB {winnerPrize.toLocaleString()}</p></div>
                <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-gray-500 text-xs">🎫 Entry Fee</p><p className="text-lg font-bold text-blue-600">ETB {entryFee.toLocaleString()}</p></div>
                <div className="bg-purple-50 rounded-xl p-3 text-center"><p className="text-gray-500 text-xs">💺 Total Seats</p><p className="text-lg font-bold text-purple-600">{totalSeats.toLocaleString()}</p></div>
                <div className="bg-orange-50 rounded-xl p-3 text-center"><p className="text-gray-500 text-xs">📊 Available Seats</p><p className="text-lg font-bold text-orange-600">{Math.max(0, availableSeatsCount).toLocaleString()}</p></div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Pool Progress</span><span>{Math.min(Math.round(progress), 100)}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-green-600 h-3 rounded-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>ETB {currentAmount.toLocaleString()} raised</span><span>Target: ETB {totalCollection.toLocaleString()}</span></div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2"><span className="text-gray-600 text-sm">💰 Total Collection (Prize + 20% Commission):</span><span className="font-bold text-gray-800">ETB {totalCollection.toLocaleString()}</span></div>
                <div className="flex justify-between items-center mb-2"><span className="text-gray-600 text-sm">👑 Platform/Agent Commission (20% of collection):</span><span className="font-bold text-orange-600">ETB {(totalCollection * 0.2).toLocaleString()}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600 text-sm">🎯 Winner Receives:</span><span className="font-bold text-green-600">ETB {winnerPrize.toLocaleString()}</span></div>
              </div>

              {pool.status === 'active' && !showCheckout && (
                <button onClick={handleJoinNow} disabled={availableSeatsCount === 0} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-lg transition disabled:opacity-50">
                  {availableSeatsCount === 0 ? 'No Seats Available' : `🎯 Select Seat & Join Pool (ETB ${entryFee.toLocaleString()} per seat)`}
                </button>
              )}
            </div>
          </div>

          {showCheckout && (
            <SeatCheckout
              programType="regular"
              pool={pool}
              poolId={pool.id}
              entryFee={entryFee}
              totalSeats={totalSeats}
              prize={pool.target_amount}
              poolName={pool.prize_name}
              user={user}
              language={language}
              onClose={() => setShowCheckout(false)}
              onCompleted={handleCheckoutCompleted}
            />
          )}
        </div>
      </div>
    </>
  );
}
