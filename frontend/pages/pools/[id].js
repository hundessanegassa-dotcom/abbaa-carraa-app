import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SeatSelector from '../../components/SeatSelector';
import BankTransferUpload from '../../components/BankTransferUpload';

export async function getServerSideProps() {
  return { props: {} };
}

export default function PoolDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [showBankUpload, setShowBankUpload] = useState(false);
  const [selectedSeatsData, setSelectedSeatsData] = useState(null);
  const [availableSeats, setAvailableSeats] = useState(0);
  const [reservedSeats, setReservedSeats] = useState([]);

  useEffect(() => {
    if (id) {
      fetchPool();
      getCurrentUser();
      fetchAvailableSeats();
    }
  }, [id]);

  useEffect(() => {
    return () => {
      if (reservedSeats.length > 0) {
        releaseSeats(reservedSeats);
      }
    };
  }, [reservedSeats]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchPool() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pools')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      router.push('/listings');
    } else {
      setPool(data);
    }
    setLoading(false);
  }

  async function fetchAvailableSeats() {
    const { count } = await supabase
      .from('pool_seats')
      .select('*', { count: 'exact', head: true })
      .eq('pool_id', id)
      .eq('status', 'available');
    setAvailableSeats(count || 0);
  }

  async function releaseSeats(seatNumbers) {
    if (!seatNumbers || seatNumbers.length === 0) return;
    
    await supabase
      .from('pool_seats')
      .update({
        status: 'available',
        user_id: null,
        reserved_by: null,
        reserved_at: null,
        reserved_until: null
      })
      .in('seat_number', seatNumbers)
      .eq('pool_id', id)
      .eq('status', 'reserved');
  }

  async function releaseUserPreviousReservations() {
    if (!user) return;
    
    const { data: userReservations } = await supabase
      .from('pool_seats')
      .select('seat_number')
      .eq('pool_id', id)
      .eq('reserved_by', user.id)
      .eq('status', 'reserved');
    
    if (userReservations && userReservations.length > 0) {
      const seatNumbers = userReservations.map(s => s.seat_number);
      await releaseSeats(seatNumbers);
    }
  }

  const handleJoinNow = () => {
    if (!user) {
      toast.error('Please login');
      router.push('/login');
      return;
    }
    setShowSeatSelector(true);
  };

  const handleSeatsSelected = async (seatData) => {
    // Release any previous reservations
    await releaseUserPreviousReservations();

    // Check seat status
    const { data: seats, error: seatCheckError } = await supabase
      .from('pool_seats')
      .select('seat_number, status, reserved_by')
      .in('seat_number', seatData.seats)
      .eq('pool_id', pool.id);

    if (seatCheckError) {
      toast.error('Error checking seats');
      setShowSeatSelector(true);
      return;
    }

    // KEY FIX: Seats are unavailable if NOT available AND NOT reserved by current user
    const unavailableSeats = seats.filter(s => s.status !== 'available' && s.reserved_by !== user?.id);
    
    if (unavailableSeats.length > 0) {
      toast.error(`Seats ${unavailableSeats.map(s => s.seat_number).join(', ')} are not available`);
      await fetchAvailableSeats();
      setShowSeatSelector(true);
      return;
    }

    // Reserve seats that are available
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const availableSeatNumbers = seats.filter(s => s.status === 'available').map(s => s.seat_number);
    
    if (availableSeatNumbers.length > 0) {
      await supabase
        .from('pool_seats')
        .update({
          status: 'reserved',
          user_id: user.id,
          reserved_by: user.id,
          reserved_until: expiryTime
        })
        .in('seat_number', availableSeatNumbers)
        .eq('pool_id', pool.id)
        .eq('status', 'available');
    }

    setSelectedSeatsData(seatData);
    setReservedSeats(seatData.seats);
    setShowSeatSelector(false);
    setShowBankUpload(true);
    
    toast.success(`✅ Seats ${seatData.seats.join(', ')} reserved!`);
  };

  const handlePaymentSuccess = async () => {
    if (reservedSeats.length > 0) {
      await supabase
        .from('pool_seats')
        .update({ status: 'taken' })
        .in('seat_number', reservedSeats)
        .eq('pool_id', pool.id);
    }
    setShowBankUpload(false);
    router.push('/dashboard');
  };

  const handleCancelReservation = async () => {
    if (reservedSeats.length > 0) {
      await releaseSeats(reservedSeats);
      toast.info(`Seats ${reservedSeats.join(', ')} released`);
    }
    setReservedSeats([]);
    setShowBankUpload(false);
    setShowSeatSelector(true);
  };

  const handleCancelSeatSelection = async () => {
    if (reservedSeats.length > 0) {
      await releaseSeats(reservedSeats);
      setReservedSeats([]);
    }
    setShowSeatSelector(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  }

  if (!pool) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold">Pool not found</h1><Link href="/listings" className="text-green-600 mt-4 inline-block">Back to listings</Link></div></div>;
  }

  const progress = (pool.current_amount / pool.target_amount) * 100;
  const totalCollection = pool.target_amount * 1.2;
  const maxSeatsPerUser = 5;

  return (
    <>
      <Head><title>{pool.prize_name} - Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link href="/listings" className="text-green-600 hover:underline mb-4 inline-block">← Back to listings</Link>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="w-full h-64 md:h-80 bg-gray-200 relative">
              {pool.image_url ? (
                <img src={pool.image_url} alt={pool.prize_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                  <span className="text-6xl">🎁</span>
                </div>
              )}
              {pool.status === 'active' && <span className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">🔴 Active</span>}
              {pool.is_featured && <span className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">⭐ Featured</span>}
            </div>

            <div className="p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{pool.prize_name}</h1>
              <p className="text-gray-600 mb-4">{pool.description}</p>

              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Pool Progress</span><span>{Math.round(progress)}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-green-600 h-3 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-gray-500 text-xs">Winner Gets</p><p className="text-lg font-bold text-green-600">ETB {pool.target_amount?.toLocaleString()}</p></div>
                <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-gray-500 text-xs">Entry Fee</p><p className="text-lg font-bold text-blue-600">ETB {pool.entry_fee?.toLocaleString()}</p></div>
                <div className="bg-purple-50 rounded-xl p-3 text-center"><p className="text-gray-500 text-xs">Total Collection</p><p className="text-lg font-bold text-purple-600">ETB {totalCollection.toLocaleString()}</p></div>
                <div className="bg-orange-50 rounded-xl p-3 text-center"><p className="text-gray-500 text-xs">Available Seats</p><p className="text-lg font-bold text-orange-600">{availableSeats}</p></div>
              </div>

              {pool.status === 'active' && (
                <div className="border-t pt-6">
                  {!showSeatSelector && !showBankUpload ? (
                    <button onClick={handleJoinNow} disabled={availableSeats === 0} className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-xl font-semibold text-lg">
                      {availableSeats === 0 ? 'No Seats Available' : '🎯 Select Seat & Join Pool'}
                    </button>
                  ) : showSeatSelector && (
                    <SeatSelector
                      poolId={pool.id}
                      entryFee={pool.entry_fee}
                      maxSeats={maxSeatsPerUser}
                      onSeatsSelected={handleSeatsSelected}
                      onCancel={handleCancelSeatSelection}
                    />
                  )}
                </div>
              )}

              {showBankUpload && selectedSeatsData && (
                <BankTransferUpload
                  poolId={pool.id}
                  amount={selectedSeatsData.totalAmount}
                  seatNumbers={selectedSeatsData.seats}
                  onSuccess={handlePaymentSuccess}
                  onClose={handleCancelReservation}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
