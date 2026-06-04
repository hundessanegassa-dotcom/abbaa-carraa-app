// pages/merkato-seat.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';
import SeatSelector from '../components/SeatSelector';

export default function MerkatoSeat() {
  const router = useRouter();
  const isMounted = useRef(true);
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
      drawDate: "Every Day at 8:00 PM",
      color: "from-gray-600 to-gray-800"
    },
    weekly: {
      name: "ሳምንታዊ ግዙፍ አሸናፊ | Weekly Mega Winner",
      entryFee: 2500,
      prize: 10000000,
      totalSeats: 4800,
      frequency: "Weekly",
      drawDate: "Every Sunday at 6:00 PM",
      color: "from-gray-600 to-gray-800"
    },
    monthly: {
      name: "ወርሃዊ አሸናፊ | Monthly Winner",
      entryFee: 5000,
      prize: 40000000,
      totalSeats: 9600,
      frequency: "Monthly",
      drawDate: "Last Day of Month at 8:00 PM",
      color: "from-gray-600 to-gray-800"
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    checkUser();
    if (type && vipPools[type]) {
      if (isMounted.current) setPoolInfo(vipPools[type]);
    } else if (type && !vipPools[type]) {
      toast.error('Invalid pool type');
      router.push('/merkato-vip');
    }
  }, [type]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Store the intended pool type and redirect to login
        sessionStorage.setItem('pendingRole', 'individual');
        sessionStorage.setItem('pendingPoolType', type);
        sessionStorage.setItem('redirectAfterLogin', `/merkato-seat?type=${type}`);
        toast.loading('Please login to select seats...');
        router.push('/login');
        return;
      }
      if (isMounted.current) setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('Please login to continue');
      router.push('/login');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleSeatsSelected = async (seatData) => {
    if (!user) {
      toast.error('Please login to continue');
      router.push('/login');
      return;
    }

    setLoading(true);
    
    try {
      // Generate unique ticket number
      const ticketNumber = `MC-${type?.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // Create participant record with seat numbers
      const { data: participant, error } = await supabase
        .from('merkato_vip_participants')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0],
          phone: user.user_metadata?.phone || null,
          pool_type: type,
          seat_numbers: seatData.seats,
          contribution_amount: seatData.totalAmount,
          prize_amount: poolInfo.prize,
          payment_status: 'pending',
          ticket_number: ticketNumber,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success(`Seats ${seatData.seats.join(', ')} reserved! Proceed to payment.`);
      
      // Redirect to payment page with seats as comma-separated string
      router.push(`/payment/merkato?type=${type}&participant=${participant.id}&seats=${seatData.seats.join(',')}&amount=${seatData.totalAmount}`);
      
    } catch (error) {
      console.error('Error saving seats:', error);
      toast.error('Failed to reserve seats: ' + error.message);
      if (isMounted.current) setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/merkato-vip');
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
        <meta name="description" content={`Select your seats for ${poolInfo.name}. Entry fee: ${poolInfo.entryFee} ETB, Prize: ${poolInfo.prize.toLocaleString()} ETB`} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Back Button */}
          <button 
            onClick={() => router.back()} 
            className="text-gray-600 hover:text-gray-800 mb-4 inline-flex items-center gap-1 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Merkato VIP
          </button>

          {/* Pool Header Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className={`bg-gradient-to-r ${poolInfo.color} p-6 text-white`}>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <div className="text-sm opacity-80 mb-1">Merkato VIP Program</div>
                  <h1 className="text-2xl md:text-3xl font-bold">{poolInfo.name}</h1>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">Guaranteed Prize</div>
                  <div className="text-2xl md:text-3xl font-bold">ETB {poolInfo.prize.toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Entry Fee</p>
                  <p className="text-xl font-bold text-blue-600">ETB {poolInfo.entryFee.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Total Seats</p>
                  <p className="text-xl font-bold text-purple-600">{poolInfo.totalSeats.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Draw Frequency</p>
                  <p className="text-xl font-bold text-green-600">{poolInfo.frequency}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Max Seats Per Person</p>
                  <p className="text-xl font-bold text-orange-600">5</p>
                </div>
              </div>
            </div>
          </div>

          {/* Seat Selector Component - Now passing poolInfo */}
          <SeatSelector
            poolId={`merkato_${type}`}
            entryFee={poolInfo.entryFee}
            maxSeats={5}
            totalSeats={poolInfo.totalSeats}
            poolInfo={poolInfo}  // Pass full pool info to seat selector
            onSeatsSelected={handleSeatsSelected}
            onCancel={handleCancel}
          />

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">💡</div>
              <div>
                <p className="text-sm font-semibold text-blue-800">How it works:</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Select up to 5 seats (more seats = higher chance to win!)</li>
                  <li>• Each seat costs ETB {poolInfo.entryFee.toLocaleString()}</li>
                  <li>• Your seats are reserved for 10 minutes</li>
                  <li>• Complete payment via TeleBirr or CBE Bank</li>
                  <li>• Get your UNVERIFIED ticket immediately after payment submission</li>
                  <li>• Admin verifies payment → Your ticket becomes VERIFIED</li>
                  <li>• Winner is drawn randomly on {poolInfo.drawDate}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Charity Note */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              💚 2% of every contribution supports kidney & heart disease patients in Ethiopia
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
