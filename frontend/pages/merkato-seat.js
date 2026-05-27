import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';
import SeatSelector from '../components/SeatSelector';

export default function MerkatoSeat() {
  const router = useRouter();
  const { type } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [poolInfo, setPoolInfo] = useState(null);

  const vipPools = {
    daily: {
      name: "ዕለታዊ ሚሊየነር | Daily Millionaire",
      entryFee: 500,
      prize: 1000000,
      totalSeats: 2400,
      frequency: "Daily",
      color: "from-gray-600 to-gray-800"
    },
    weekly: {
      name: "ሳምንታዊ ግዙፍ አሸናፊ | Weekly Mega Winner",
      entryFee: 2500,
      prize: 10000000,
      totalSeats: 4800,
      frequency: "Weekly",
      color: "from-gray-600 to-gray-800"
    },
    monthly: {
      name: "ወርሃዊ አሸናፊ | Monthly Winner",
      entryFee: 5000,
      prize: 40000000,
      totalSeats: 9600,
      frequency: "Monthly",
      color: "from-gray-600 to-gray-800"
    }
  };

  useEffect(() => {
    checkUser();
    if (type && vipPools[type]) {
      setPoolInfo(vipPools[type]);
    } else {
      router.push('/merkato-vip');
    }
  }, [type]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      sessionStorage.setItem('pendingRole', 'individual');
      sessionStorage.setItem('pendingPoolType', type);
      sessionStorage.setItem('redirectAfterLogin', `/merkato-seat?type=${type}`);
      router.push('/login');
      return;
    }
    setUser(user);
    setLoading(false);
  };

  const handleSeatsSelected = async (seatData) => {
    // Create participant record with seat numbers
    const { data: participant, error } = await supabase
      .from('merkato_vip_participants')
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email.split('@')[0],
        pool_type: type,
        seat_numbers: seatData.seats,
        contribution_amount: seatData.totalAmount,
        prize_amount: poolInfo.prize,
        payment_status: 'pending',
        ticket_number: `MC-${type?.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create participant record');
      return;
    }

    // Redirect to payment page
    router.push(`/payment/merkato?type=${type}&participant=${participant.id}&seats=${seatData.seats.join(',')}&amount=${seatData.totalAmount}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (!poolInfo) return null;

  return (
    <>
      <Head>
        <title>Select Seats - {poolInfo.name} | Abbaa Carraa</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <button 
            onClick={() => router.back()} 
            className="text-gray-600 hover:text-gray-800 mb-4 inline-flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className={`bg-gradient-to-r ${poolInfo.color} p-6 text-white`}>
              <h1 className="text-2xl font-bold">Select Your Seats</h1>
              <p className="text-gray-200 mt-1">{poolInfo.name}</p>
              <div className="mt-3 flex gap-4 text-sm">
                <span>💰 Prize: ETB {poolInfo.prize.toLocaleString()}</span>
                <span>🎫 Entry Fee: ETB {poolInfo.entryFee.toLocaleString()}</span>
                <span>💺 Total Seats: {poolInfo.totalSeats.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-6">
              <SeatSelector
                poolId={`merkato_${type}`}
                entryFee={poolInfo.entryFee}
                maxSeats={5}
                totalSeats={poolInfo.totalSeats}
                onSeatsSelected={handleSeatsSelected}
                onCancel={() => router.push('/merkato-vip')}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
