// pages/merkato-seat.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';
import BankTransferUpload from '../components/BankTransferUpload';
import Ticket from '../components/Ticket';

export default function MerkatoSeat() {
  const router = useRouter();
  const { type } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [poolInfo, setPoolInfo] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [participantData, setParticipantData] = useState(null);
  const [maxSeats] = useState(5);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [reservationTimer, setReservationTimer] = useState(null);

  const vipPools = {
    daily: { 
      name: "Daily Millionaire", 
      entryFee: 500, 
      prize: 1000000, 
      totalSeats: 2400, 
      frequency: "Daily", 
      drawDate: "Every Day at 8:00 PM", 
      color: "from-gray-700 to-gray-900" 
    },
    weekly: { 
      name: "Weekly Mega Winner", 
      entryFee: 2500, 
      prize: 10000000, 
      totalSeats: 4800, 
      frequency: "Weekly", 
      drawDate: "Every Sunday at 6:00 PM", 
      color: "from-gray-700 to-gray-900" 
    },
    monthly: { 
      name: "Monthly Winner", 
      entryFee: 5000, 
      prize: 40000000, 
      totalSeats: 9600, 
      frequency: "Monthly", 
      drawDate: "Last Day of Month at 8:00 PM", 
      color: "from-gray-700 to-gray-900" 
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reservationTimer) clearTimeout(reservationTimer);
      if (reservedSeats.length > 0 && user) {
        releaseSeats(reservedSeats);
      }
    };
  }, [reservedSeats, user]);

  useEffect(() => {
    checkUser();
    if (type && vipPools[type]) setPoolInfo(vipPools[type]);
    else if (type && !vipPools[type]) { 
      toast.error('Invalid pool type'); 
      router.push('/merkato-vip'); 
    }
  }, [type]);

  useEffect(() => {
    if (user && poolInfo) {
      fetchBookedSeats();
      fetchUserReservations();
      
      const interval = setInterval(() => {
        fetchBookedSeats();
        fetchUserReservations();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, poolInfo, type]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Store redirect for after login
        const redirectData = {
          type: 'merkato',
          poolType: type,
          redirectTo: `/merkato-seat?type=${type}`,
          timestamp: Date.now()
        };
        localStorage.setItem('abbaa_vip_pending', JSON.stringify(redirectData));
        sessionStorage.setItem('abbaa_vip_pending_backup', JSON.stringify(redirectData));
        
        toast.loading('Please login to select seats...');
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  };

  async function fetchBookedSeats() {
    try {
      // Fetch participants with verified or pending verification payments for this pool type
      const { data, error } = await supabase
        .from('merkato_vip_participants')
        .select('seat_numbers, payment_status')
        .eq('pool_type', type)
        .in('payment_status', ['verified', 'pending_verification']);
      
      if (error) throw error;
      
      const allBookedSeats = [];
      if (data) {
        data.forEach(participant => {
          if (participant.seat_numbers && Array.isArray(participant.seat_numbers)) {
            allBookedSeats.push(...participant.seat_numbers);
          }
        });
      }
      
      setBookedSeats([...new Set(allBookedSeats)]);
    } catch (err) {
      console.error('Error fetching booked seats:', err);
    }
  }

  async function fetchUserReservations() {
    if (!user) return;
    
    try {
      const poolId = `merkato_${type}`;
      const { data, error } = await supabase
        .from('vip_seat_reservations')
        .select('seat_number, expires_at')
        .eq('user_id', user.id)
        .eq('pool_id', poolId)
        .gte('expires_at', new Date().toISOString());
      
      if (!error && data && data.length > 0) {
        const reservedSeatNumbers = data.map(r => r.seat_number);
        setReservedSeats(reservedSeatNumbers);
        setSelectedSeats(reservedSeatNumbers);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  }

  async function reserveSeatsInDB(seatNumbers) {
    if (!user) return false;
    
    const poolId = `merkato_${type}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    
    const reservations = seatNumbers.map(seatNumber => ({
      pool_id: poolId,
      seat_number: seatNumber,
      user_id: user.id,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('vip_seat_reservations')
      .upsert(reservations, { onConflict: 'pool_id, seat_number' });
    
    if (error) {
      console.error('Reserve error:', error);
      return false;
    }
    
    // Set timer to release seats after 10 minutes
    if (reservationTimer) clearTimeout(reservationTimer);
    const timer = setTimeout(() => {
      releaseUserReservations();
      toast.warning('Your seat reservation has expired. Please reselect seats.', { duration: 5000 });
      window.location.reload();
    }, 10 * 60 * 1000);
    setReservationTimer(timer);
    
    return true;
  }

  async function releaseSeats(seatNumbers) {
    if (!seatNumbers || seatNumbers.length === 0 || !user) return;
    
    const poolId = `merkato_${type}`;
    await supabase
      .from('vip_seat_reservations')
      .delete()
      .eq('user_id', user.id)
      .eq('pool_id', poolId)
      .in('seat_number', seatNumbers);
  }

  async function releaseUserReservations() {
    if (!user) return;
    
    const poolId = `merkato_${type}`;
    await supabase
      .from('vip_seat_reservations')
      .delete()
      .eq('user_id', user.id)
      .eq('pool_id', poolId);
    
    setReservedSeats([]);
    setSelectedSeats([]);
  }

  const toggleSeat = async (seatNum) => {
    // Check if seat is already booked/taken
    if (bookedSeats.includes(seatNum)) {
      toast.error(`Seat ${seatNum} is already taken. Please select another seat.`);
      return;
    }

    const isSelected = selectedSeats.includes(seatNum);

    if (isSelected) {
      // Remove from database reservation
      await releaseSeats([seatNum]);
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      setReservedSeats(reservedSeats.filter(s => s !== seatNum));
      toast.success(`Seat ${seatNum} released`);
    } else {
      if (selectedSeats.length >= maxSeats) {
        toast.error(`You can only select up to ${maxSeats} seats at a time`);
        return;
      }
      
      // Check if seat is available
      if (bookedSeats.includes(seatNum)) {
        toast.error(`Seat ${seatNum} is no longer available`);
        return;
      }
      
      // Reserve in database
      const success = await reserveSeatsInDB([seatNum]);
      if (success) {
        setSelectedSeats([...selectedSeats, seatNum]);
        setReservedSeats([...reservedSeats, seatNum]);
        toast.success(`Seat ${seatNum} reserved for 10 minutes`);
        await fetchBookedSeats(); // Refresh to ensure seat isn't double-booked
      } else {
        toast.error(`Seat ${seatNum} is no longer available`);
        await fetchBookedSeats();
      }
    }
  };

  const confirmSeats = async () => {
    if (selectedSeats.length === 0) { 
      toast.error('Select at least one seat'); 
      return; 
    }
    
    // Double check that seats are still available
    const stillAvailable = selectedSeats.every(seat => !bookedSeats.includes(seat));
    if (!stillAvailable) {
      toast.error('Some of your selected seats are no longer available. Please reselect.');
      await fetchBookedSeats();
      setSelectedSeats([]);
      return;
    }
    
    setLoading(true);
    try {
      const ticketNumber = `MK-${type.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const totalAmount = selectedSeats.length * poolInfo.entryFee;
      
      const { data: participant, error } = await supabase
        .from('merkato_vip_participants')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0],
          pool_type: type,
          city: 'Merkato',
          seat_numbers: selectedSeats,
          contribution_amount: totalAmount,
          prize_amount: poolInfo.prize,
          payment_status: 'pending',
          ticket_number: ticketNumber,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setParticipantId(participant.id);
      setShowPayment(true);
    } catch (error) { 
      toast.error('Failed to reserve seats: ' + error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handlePaymentSuccess = async (paymentProofUrl, reference) => {
    if (!participantId) return;
    
    try {
      // Update participant with payment info
      await supabase
        .from('merkato_vip_participants')
        .update({
          payment_status: 'pending_verification',
          payment_proof_url: paymentProofUrl,
          reference: reference,
          payment_submitted_at: new Date().toISOString()
        })
        .eq('id', participantId);
      
      // Clear seat reservations after successful payment
      await releaseUserReservations();
      
      // Fetch updated participant data
      const { data: updatedParticipant } = await supabase
        .from('merkato_vip_participants')
        .select('*')
        .eq('id', participantId)
        .single();
      
      setParticipantData(updatedParticipant);
      setShowPayment(false);
      setShowTicket(true);
      toast.success('Payment submitted! Your unverified ticket is ready');
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment status');
    }
  };

  const getSeatColor = (seatNum) => {
    if (bookedSeats.includes(seatNum)) {
      return 'bg-red-400 cursor-not-allowed opacity-70';
    }
    if (selectedSeats.includes(seatNum)) {
      return 'bg-green-600 text-white shadow-lg transform scale-105';
    }
    return 'bg-gray-200 hover:bg-gray-300 cursor-pointer transition-all hover:transform hover:scale-105';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (!poolInfo) return null;

  const totalAmount = selectedSeats.length * poolInfo.entryFee;
  const totalSeatsCount = poolInfo.totalSeats;
  const seatNumbers = Array.from({ length: totalSeatsCount }, (_, i) => i + 1);
  const availableCount = seatNumbers.filter(s => !bookedSeats.includes(s) && !selectedSeats.includes(s)).length;
  const takenCount = bookedSeats.length;

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

          {/* Seat Selection Area - Only show if not in payment or ticket mode */}
          {!showPayment && !showTicket && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold mb-4">Select Your Seats (Max {maxSeats})</h3>
              
              {/* Seat Legend */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 border border-gray-300 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-600 rounded"></div>
                  <span>Your Selection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-400 rounded"></div>
                  <span>Taken/Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-yellow-400 rounded animate-pulse"></div>
                  <span>Reserved for You (10 min)</span>
                </div>
              </div>

              {/* Seat Statistics */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{availableCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Available Seats</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{selectedSeats.length}</p>
                  <p className="text-xs text-gray-500">Your Selected</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{takenCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Booked/Taken</p>
                </div>
              </div>

              {/* Seat Grid - NO LIMIT - shows all seats */}
              <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-2 mb-6 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-xl">
                {seatNumbers.map(seatNum => {
                  const isDisabled = bookedSeats.includes(seatNum);
                  const seatColor = getSeatColor(seatNum);
                  const isSelected = selectedSeats.includes(seatNum);
                  const isReserved = reservedSeats.includes(seatNum);
                  
                  let title = `Seat ${seatNum}`;
                  if (bookedSeats.includes(seatNum)) title += ' - Taken';
                  else if (isSelected) title += ' - Selected by you';
                  else title += ' - Available';
                  
                  return (
                    <button
                      key={seatNum}
                      onClick={() => toggleSeat(seatNum)}
                      disabled={isDisabled}
                      className={`
                        w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-all duration-200
                        ${seatColor}
                        ${isSelected ? 'ring-2 ring-green-300 ring-offset-2' : ''}
                        ${isReserved && !isSelected ? 'bg-yellow-400 animate-pulse' : ''}
                      `}
                      title={title}
                    >
                      <span className="text-sm">{seatNum}</span>
                      <span className="text-[8px] mt-0.5">
                        {isDisabled ? '🔒' : isSelected ? '✓' : '🟢'}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {totalSeatsCount > 500 && (
                <p className="text-xs text-gray-400 text-center mb-4">
                  Showing all {totalSeatsCount.toLocaleString()} seats (scroll to see more)
                </p>
              )}
              
              {/* Selected Seats Summary */}
              {selectedSeats.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Selected Seats</p>
                      <p className="font-bold text-lg">{selectedSeats.sort((a,b)=>a-b).join(', ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-bold text-2xl text-green-600">ETB {totalAmount.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">({selectedSeats.length} seats × ETB {poolInfo.entryFee.toLocaleString()})</p>
                    </div>
                  </div>
                  <button
                    onClick={confirmSeats}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : `Confirm ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? 's' : ''} & Proceed to Payment`}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-3">
                    ⏰ Your selected seats are reserved for 10 minutes
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Payment Modal */}
          {showPayment && participantId && (
            <BankTransferUpload
              poolId={`merkato_${type}`}
              amount={selectedSeats.length * poolInfo.entryFee}
              seatNumbers={selectedSeats}
              participantId={participantId}
              tableName="merkato_vip_participants"
              onSuccess={handlePaymentSuccess}
              onClose={() => {
                releaseUserReservations();
                setShowPayment(false);
                router.push('/merkato-vip');
              }}
            />
          )}

          {/* Unverified Ticket Display */}
          {showTicket && participantData && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <Ticket
                participant={participantData}
                pool={poolInfo}
                isVerified={false}
                seatNumbers={selectedSeats}
              />
              <div className="text-center mt-6">
                <p className="text-sm text-yellow-600">
                  ⏳ This is an UNVERIFIED ticket. Your seats will be confirmed after admin verifies your payment.
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
