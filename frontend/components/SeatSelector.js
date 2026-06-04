// components/SeatSelector.js
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function SeatSelector({ 
  poolId, 
  entryFee, 
  maxSeats = 5, 
  totalSeats,
  poolInfo,
  onSeatsSelected, 
  onCancel 
}) {
  const isMounted = useRef(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [reservationTimer, setReservationTimer] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (reservationTimer) clearTimeout(reservationTimer);
    };
  }, [reservationTimer]);

  // Fetch current user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session?.user) {
          toast.error('Please login to select seats');
          onCancel();
          return;
        }
        
        if (isMounted.current) setCurrentUser(session.user);
      } catch (err) {
        console.error('Session error:', err);
        toast.error('Session error. Please refresh and try again');
        onCancel();
      } finally {
        if (isMounted.current) setSessionLoading(false);
      }
    };
    
    getUser();
  }, [onCancel]);

  // Fetch booked seats from database
  useEffect(() => {
    if (!sessionLoading && currentUser && poolId) {
      fetchBookedSeats();
      fetchUserReservations();
      
      const interval = setInterval(() => {
        fetchBookedSeats();
        fetchUserReservations();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [poolId, sessionLoading, currentUser]);

  // Update total price
  useEffect(() => {
    if (isMounted.current) setTotalPrice(selectedSeats.length * entryFee);
  }, [selectedSeats, entryFee]);

  async function fetchBookedSeats() {
    try {
      const poolType = poolId?.replace('merkato_', '').replace('city_', '');
      const isCityPool = poolId?.startsWith('city_');
      
      let data;
      if (isCityPool) {
        const { data: cityData } = await supabase
          .from('city_vip_participants')
          .select('seat_numbers, payment_status')
          .eq('pool_type', poolType)
          .in('payment_status', ['verified', 'pending_verification']);
        data = cityData;
      } else {
        const { data: merkatoData } = await supabase
          .from('merkato_vip_participants')
          .select('seat_numbers, payment_status')
          .eq('pool_type', poolType)
          .in('payment_status', ['verified', 'pending_verification']);
        data = merkatoData;
      }
      
      const allBookedSeats = [];
      if (data) {
        data.forEach(participant => {
          if (participant.seat_numbers && Array.isArray(participant.seat_numbers)) {
            allBookedSeats.push(...participant.seat_numbers);
          }
        });
      }
      
      if (isMounted.current) {
        setBookedSeats([...new Set(allBookedSeats)]);
        setLoading(false);
      }
    } catch (err) {
      console.error('Fetch booked seats error:', err);
      if (isMounted.current) setLoading(false);
    }
  }

  async function fetchUserReservations() {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('vip_seat_reservations')
        .select('seat_number, expires_at')
        .eq('user_id', currentUser.id)
        .eq('pool_id', poolId)
        .gte('expires_at', new Date().toISOString());
      
      if (!error && data && data.length > 0) {
        const reservedSeatNumbers = data.map(r => r.seat_number);
        setReservedSeats(reservedSeatNumbers);
        setSelectedSeats(reservedSeatNumbers);
      }
    } catch (err) {
      console.error('Fetch reservations error:', err);
    }
  }

  async function reserveSeatsInDB(seatNumbers) {
    if (!currentUser) return false;
    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    
    const reservations = seatNumbers.map(seatNumber => ({
      pool_id: poolId,
      seat_number: seatNumber,
      user_id: currentUser.id,
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
      onCancel();
    }, 10 * 60 * 1000);
    setReservationTimer(timer);
    
    return true;
  }

  async function releaseUserReservations() {
    if (!currentUser) return;
    
    await supabase
      .from('vip_seat_reservations')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('pool_id', poolId);
    
    setReservedSeats([]);
    setSelectedSeats([]);
  }

  const handleSeatClick = async (seatNum) => {
    if (bookedSeats.includes(seatNum)) {
      toast.error(`Seat ${seatNum} is already taken. Please select another seat.`);
      return;
    }

    const isSelected = selectedSeats.includes(seatNum);

    if (isSelected) {
      // Remove from database reservation
      await supabase
        .from('vip_seat_reservations')
        .delete()
        .eq('pool_id', poolId)
        .eq('seat_number', seatNum)
        .eq('user_id', currentUser.id);
      
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      setReservedSeats(reservedSeats.filter(s => s !== seatNum));
    } else {
      if (selectedSeats.length >= maxSeats) {
        toast.error(`You can only select up to ${maxSeats} seats at a time`);
        return;
      }
      
      // Reserve in database
      const success = await reserveSeatsInDB([seatNum]);
      if (success) {
        setSelectedSeats([...selectedSeats, seatNum]);
        setReservedSeats([...reservedSeats, seatNum]);
        toast.success(`Seat ${seatNum} reserved for 10 minutes`);
      } else {
        toast.error(`Seat ${seatNum} is no longer available`);
        await fetchBookedSeats();
      }
    }
  };

  const confirmSelection = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }
    
    // Clear the reservation timer
    if (reservationTimer) clearTimeout(reservationTimer);
    
    onSeatsSelected({
      seats: selectedSeats,
      totalAmount: totalPrice,
      seatCount: selectedSeats.length
    });
  };

  if (sessionLoading || loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          <span className="ml-2 text-gray-600">Loading seats...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Please login to select seats</p>
          <button onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded-lg">Go Back</button>
        </div>
      </div>
    );
  }

  // Generate seat numbers - NO LIMIT, shows all seats from pool card
  const totalSeatsCount = totalSeats || 2400;
  const seatNumbers = Array.from({ length: totalSeatsCount }, (_, i) => i + 1);
  
  const cols = Math.min(15, Math.ceil(Math.sqrt(seatNumbers.length)));
  const seatRows = [];
  for (let i = 0; i < seatNumbers.length; i += cols) {
    seatRows.push(seatNumbers.slice(i, i + cols));
  }

  const getSeatColor = (seatNum) => {
    if (bookedSeats.includes(seatNum)) return 'bg-red-400 cursor-not-allowed opacity-70';
    if (selectedSeats.includes(seatNum)) return 'bg-green-600 text-white shadow-lg transform scale-105';
    return 'bg-gray-200 hover:bg-gray-300 cursor-pointer transition-all hover:transform hover:scale-105';
  };

  const availableCount = seatNumbers.filter(s => !bookedSeats.includes(s) && !selectedSeats.includes(s)).length;
  const takenCount = bookedSeats.length;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">🎯 Select Your Seat(s)</h3>
      
      {poolInfo && (
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg p-4 mb-4 text-white">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs opacity-80">Entry Fee</p><p className="text-xl font-bold">ETB {entryFee.toLocaleString()}</p></div>
            <div><p className="text-xs opacity-80">Guaranteed Prize</p><p className="text-xl font-bold">ETB {poolInfo.prize?.toLocaleString()}</p></div>
            <div><p className="text-xs opacity-80">Draw Frequency</p><p className="text-sm font-semibold">{poolInfo.frequency || 'TBA'}</p></div>
          </div>
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center">
        <p className="text-sm text-gray-800">💺 Total Seats: {totalSeatsCount.toLocaleString()} | 📊 Available: {availableCount.toLocaleString()} | 🎫 Entry Fee: ETB {entryFee.toLocaleString()} per seat</p>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-200 border border-gray-300 rounded"></div><span>Available</span></div>
        <div className="flex items-center gap-2"><div className="w-5 h-5 bg-green-600 rounded"></div><span>Your Selection</span></div>
        <div className="flex items-center gap-2"><div className="w-5 h-5 bg-red-400 rounded"></div><span>Taken/Booked</span></div>
        <div className="flex items-center gap-2"><div className="w-5 h-5 bg-yellow-400 rounded animate-pulse"></div><span>Max {maxSeats} Seats</span></div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-green-600">{availableCount.toLocaleString()}</p><p className="text-xs text-gray-500">Available Seats</p></div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-yellow-600">{selectedSeats.length}</p><p className="text-xs text-gray-500">Your Selected</p></div>
        <div className="bg-red-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-red-600">{takenCount.toLocaleString()}</p><p className="text-xs text-gray-500">Booked/Taken</p></div>
      </div>

      <div className="overflow-x-auto mb-6" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <div className="inline-block min-w-full">
          {seatRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-2 mb-2 flex-wrap">
              {row.map((seatNum) => {
                const isDisabled = bookedSeats.includes(seatNum);
                const seatColor = getSeatColor(seatNum);
                const isSelected = selectedSeats.includes(seatNum);
                
                return (
                  <button
                    key={seatNum}
                    onClick={() => handleSeatClick(seatNum)}
                    disabled={isDisabled}
                    className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-all duration-200 ${seatColor} ${isSelected ? 'ring-2 ring-green-300 ring-offset-2' : ''}`}
                    title={`Seat ${seatNum} - ${isDisabled ? 'Taken' : isSelected ? 'Selected by you' : 'Available'}`}
                  >
                    <span className="text-sm">{seatNum}</span>
                    <span className="text-[8px] mt-0.5">{isDisabled ? '🔒' : isSelected ? '✓' : '🟢'}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <div><p className="text-sm text-gray-500">Selected Seats</p><p className="font-bold text-lg">{selectedSeats.sort((a, b) => a - b).join(', ')}</p></div>
            <div className="text-right"><p className="text-sm text-gray-500">Total Amount</p><p className="font-bold text-2xl text-green-600">ETB {totalPrice.toLocaleString()}</p><p className="text-xs text-gray-400">({selectedSeats.length} seats × ETB {entryFee.toLocaleString()})</p></div>
          </div>
          <button onClick={confirmSelection} className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105">Confirm Selection & Continue to Payment</button>
          <p className="text-xs text-gray-400 text-center mt-3">⏰ Your selected seats are reserved for 10 minutes</p>
        </div>
      )}

      <button onClick={onCancel} className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition mt-3">← Cancel & Go Back</button>
    </div>
  );
}
