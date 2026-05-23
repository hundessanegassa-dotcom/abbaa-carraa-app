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
  const [contributing, setContributing] = useState(false);
  const [user, setUser] = useState(null);
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [showBankUpload, setShowBankUpload] = useState(false);
  const [selectedSeatsData, setSelectedSeatsData] = useState(null);
  const [availableSeats, setAvailableSeats] = useState(0);

  useEffect(() => {
    if (id) {
      fetchPool();
      getCurrentUser();
      fetchAvailableSeats();
    }
  }, [id]);

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
      console.error('Error fetching pool:', error);
      toast.error('Pool not found');
      router.push('/listings');
    } else {
      setPool(data);
    }
    setLoading(false);
  }

  async function fetchAvailableSeats() {
    const { count, error } = await supabase
      .from('pool_seats')
      .select('*', { count: 'exact', head: true })
      .eq('pool_id', id)
      .eq('status', 'available');
    
    if (!error) {
      setAvailableSeats(count || 0);
    }
  }

  const handleJoinNow = () => {
    if (!user) {
      toast.error('Please login to join this pool');
      router.push('/login');
      return;
    }
    setShowSeatSelector(true);
  };

  const handleSeatsSelected = async (seatData) => {
    // Double-check seat availability before proceeding
    const { data: seats, error: seatCheckError } = await supabase
      .from('pool_seats')
      .select('seat_number, status')
      .in('seat_number', seatData.seats)
      .eq('pool_id', pool.id);

    if (seatCheckError) {
      toast.error('Error checking seat availability');
      setShowSeatSelector(true);
      return;
    }

    const unavailableSeats = seats.filter(s => s.status !== 'available');
    if (unavailableSeats.length > 0) {
      toast.error(`Seats ${unavailableSeats.map(s => s.seat_number).join(', ')} are no longer available. Please reselect.`);
      setShowSeatSelector(true);
      await fetchAvailableSeats();
      return;
    }

    setSelectedSeatsData(seatData);
    setShowSeatSelector(false);
    setShowBankUpload(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Pool not found</h1>
          <Link href="/listings" className="text-green-600 mt-4 inline-block">Back to listings</Link>
        </div>
      </div>
    );
  }

  const progress = (pool.current_amount / pool.target_amount) * 100;
  const totalCollection = pool.target_amount * 1.2;
  const daysLeft = pool.end_date ? Math.max(0, Math.ceil((new Date(pool.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : null;
  const maxSeatsPerUser = 5;

  return (
    <>
      <Head>
        <title>{pool.prize_name} - Abbaa Carraa</title>
        <meta name="description" content={`Join the ${pool.prize_name} pool. Winner gets ETB ${pool.target_amount?.toLocaleString()}!`} />
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link href="/listings" className="text-green-600 hover:underline mb-4 inline-block">← Back to listings</Link>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Image */}
            <div className="w-full h-64 md:h-80 bg-gray-200 relative">
              {pool.image_url ? (
                <img src={pool.image_url} alt={pool.prize_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                  <span className="text-6xl">🎁</span>
                </div>
              )}
              {pool.status === 'active' && (
                <span className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  🔴 Active
                </span>
              )}
              {pool.is_featured && (
                <span className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  ⭐ Featured
                </span>
              )}
            </div>

            <div className="p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{pool.prize_name}</h1>
              <p className="text-gray-600 mb-4">{pool.description}</p>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Pool Progress</span>
                  <span>{Math.round(progress)}% funded</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>ETB {pool.current_amount?.toLocaleString()}</span>
                  <span>Target: ETB {pool.target_amount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs">Winner Gets</p>
                  <p className="text-lg font-bold text-green-600">ETB {pool.target_amount?.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs">Entry Fee</p>
                  <p className="text-lg font-bold text-blue-600">ETB {pool.entry_fee?.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs">Total Collection</p>
                  <p className="text-lg font-bold text-purple-600">ETB {totalCollection.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">Incl. 20% commission</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs">Available Seats</p>
                  <p className="text-lg font-bold text-orange-600">{availableSeats}</p>
                  <p className="text-[10px] text-gray-400">Max {maxSeatsPerUser} per person</p>
                </div>
              </div>

              {/* Commission Breakdown */}
              <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                <p className="font-semibold text-yellow-800 text-sm mb-2">💰 Commission Breakdown</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-gray-600">Winner</p>
                    <p className="font-bold text-green-600">100% of Target</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Creator</p>
                    <p className="font-bold text-blue-600">10-20%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Platform</p>
                    <p className="font-bold text-purple-600">10%</p>
                  </div>
                </div>
              </div>

              {/* Action Section */}
              {pool.status === 'active' && (
                <div className="border-t pt-6">
                  {!showSeatSelector && !showBankUpload ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <p className="text-sm text-green-800 mb-2">
                          🎯 Choose your seat(s) to participate
                        </p>
                        <p className="text-xs text-green-600">
                          {availableSeats} seats available • Max {maxSeatsPerUser} seats per person
                        </p>
                      </div>
                      <button
                        onClick={handleJoinNow}
                        disabled={contributing || availableSeats === 0}
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {availableSeats === 0 ? 'No Seats Available' : '🎯 Select Seat & Join Pool'}
                      </button>
                      <p className="text-xs text-gray-400 text-center">
                        💚 2% of your contribution supports kidney & heart disease treatment
                      </p>
                    </div>
                  ) : showSeatSelector && (
                    <SeatSelector
                      poolId={pool.id}
                      entryFee={pool.entry_fee}
                      maxSeats={maxSeatsPerUser}
                      onSeatsSelected={handleSeatsSelected}
                      onCancel={() => setShowSeatSelector(false)}
                    />
                  )}
                </div>
              )}

              {pool.status !== 'active' && (
                <div className="bg-gray-100 rounded-xl p-6 text-center">
                  <p className="text-gray-500">This pool is no longer active</p>
                  <Link href="/listings" className="text-green-600 mt-2 inline-block">Browse other pools →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Charity Message */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              💚 2% of every contribution supports kidney and heart disease treatment in Ethiopia
            </p>
          </div>
        </div>
      </div>

      {/* Bank Transfer Upload Modal */}
      {showBankUpload && selectedSeatsData && (
        <BankTransferUpload
          poolId={pool.id}
          amount={selectedSeatsData.totalAmount}
          seatNumbers={selectedSeatsData.seats}
          onSuccess={() => {
            setShowBankUpload(false);
            toast.success('Payment proof submitted! Admin will verify within 1 hour.');
            router.push('/dashboard');
          }}
          onClose={() => {
            setShowBankUpload(false);
            setShowSeatSelector(true);
          }}
        />
      )}
    </>
  );
}
