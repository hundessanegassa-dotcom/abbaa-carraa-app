import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function SeatSelector({ poolId, entryFee, maxSeats = 5, onSeatsSelected, onCancel }) {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Fetch seats
  useEffect(() => {
    fetchSeats();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSeats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [poolId]);

  // Update total price when selected seats change
  useEffect(() => {
    setTotalPrice(selectedSeats.length * entryFee);
  }, [selectedSeats, entryFee]);

  async function fetchSeats() {
    const { data, error } = await supabase
      .from('pool_seats')
      .select('*')
      .eq('pool_id', poolId)
      .order('seat_number', { ascending: true });

    if (!error && data) {
      setSeats(data);
    }
    setLoading(false);
  }

  async function reserveSeats(seatNumbers) {
    if (!currentUser) {
      toast.error('Please login to select seats');
      return false;
    }

    const reservedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('pool_seats')
      .update({
        status: 'reserved',
        reserved_by: currentUser.id,
        reserved_at: new Date().toISOString(),
        reserved_until: reservedUntil
      })
      .in('seat_number', seatNumbers)
      .eq('pool_id', poolId)
      .eq('status', 'available');

    if (error) {
      toast.error('Some seats were just taken. Please reselect.');
      await fetchSeats();
      return false;
    }

    return true;
  }

  const handleSeatClick = async (seat) => {
    // Cannot select taken seats
    if (seat.status === 'taken') {
      toast.error(`Seat ${seat.seat_number} is already taken`);
      return;
    }

    // Cannot select seats reserved by others
    if (seat.status === 'reserved' && seat.reserved_by !== currentUser?.id) {
      toast.error(`Seat ${seat.seat_number} is being selected by another user`);
      return;
    }

    const isSelected = selectedSeats.includes(seat.seat_number);

    if (isSelected) {
      // Deselect seat
      setSelectedSeats(selectedSeats.filter(s => s !== seat.seat_number));
    } else {
      // Check max seats limit
      if (selectedSeats.length >= maxSeats) {
        toast.error(`You can only select up to ${maxSeats} seats at a time`);
        return;
      }
      
      // Reserve the seat
      const success = await reserveSeats([seat.seat_number]);
      if (success) {
        setSelectedSeats([...selectedSeats, seat.seat_number]);
        await fetchSeats(); // Refresh seat status
      }
    }
  };

  const confirmSelection = () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }
    
    onSeatsSelected({
      seats: selectedSeats,
      totalAmount: totalPrice,
      seatCount: selectedSeats.length
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Calculate grid dimensions
  const totalSeats = seats.length;
  const cols = Math.ceil(Math.sqrt(totalSeats));
  
  // Group seats into rows
  const seatRows = [];
  for (let i = 0; i < seats.length; i += cols) {
    seatRows.push(seats.slice(i, i + cols));
  }

  const getSeatColor = (seat) => {
    if (seat.status === 'taken') {
      return 'bg-gray-400 cursor-not-allowed opacity-50';
    }
    if (seat.status === 'reserved') {
      const isMyReservation = seat.reserved_by === currentUser?.id;
      if (isMyReservation) {
        return 'bg-yellow-400 hover:bg-yellow-500';
      }
      return 'bg-red-300 cursor-not-allowed';
    }
    if (selectedSeats.includes(seat.seat_number)) {
      return 'bg-green-600 text-white';
    }
    return 'bg-green-100 hover:bg-green-200 cursor-pointer';
  };

  const getSeatStatusText = (seat) => {
    if (seat.status === 'taken') {
      return 'Taken';
    }
    if (seat.status === 'reserved') {
      const isMyReservation = seat.reserved_by === currentUser?.id;
      if (isMyReservation) {
        return 'Selected by you';
      }
      return 'Being selected';
    }
    return 'Available';
  };

  const availableCount = seats.filter(s => s.status === 'available').length;
  const takenCount = seats.filter(s => s.status === 'taken').length;
  const reservedCount = seats.filter(s => s.status === 'reserved').length;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">🎯 Select Your Seat(s)</h3>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-100 border border-green-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-yellow-400 rounded"></div>
          <span>Your Selection</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-red-300 rounded"></div>
          <span>Being Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-400 rounded"></div>
          <span>Taken</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{availableCount}</p>
          <p className="text-xs text-gray-500">Available</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{reservedCount}</p>
          <p className="text-xs text-gray-500">Reserved</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-600">{takenCount}</p>
          <p className="text-xs text-gray-500">Taken</p>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="overflow-x-auto mb-6">
        <div className="inline-block min-w-full">
          {seatRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-2 mb-2">
              {row.map((seat) => {
                const isDisabled = seat.status === 'taken' || (seat.status === 'reserved' && seat.reserved_by !== currentUser?.id);
                const seatColor = getSeatColor(seat);
                const statusText = getSeatStatusText(seat);
                
                return (
                  <button
                    key={seat.seat_number}
                    onClick={() => handleSeatClick(seat)}
                    disabled={isDisabled}
                    className={`
                      w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-all
                      ${seatColor}
                    `}
                    title={`Seat ${seat.seat_number} - ${statusText}`}
                  >
                    <span className="text-sm">{seat.seat_number}</span>
                    <span className="text-[8px] mt-0.5">
                      {seat.status === 'taken' ? '🔒' : seat.status === 'reserved' ? '⏳' : '🟢'}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedSeats.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500">Selected Seats</p>
              <p className="font-bold text-lg">{selectedSeats.sort((a, b) => a - b).join(', ')}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-bold text-2xl text-green-600">ETB {totalPrice.toLocaleString()}</p>
              <p className="text-xs text-gray-400">({selectedSeats.length} seats × ETB {entryFee.toLocaleString()})</p>
            </div>
          </div>
          
          <button
            onClick={confirmSelection}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
          >
            Confirm Selection & Continue to Payment
          </button>
          
          <p className="text-xs text-gray-400 text-center mt-3">
            ⏰ Your selected seats are reserved for 5 minutes
          </p>
        </div>
      )}

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition mt-3"
      >
        ← Cancel & Go Back
      </button>
    </div>
  );
}
