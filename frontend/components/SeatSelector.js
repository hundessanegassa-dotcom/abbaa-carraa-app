// components/SeatSelector.js - COMPLETE WITH PROPER EXPORTS
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// ============================================
// TIER CONFIGURATION - 4 TIERS - MUST BE EXPORTED
// ============================================
export const TIERS = {
  bronze: {
    id: 'bronze',
    labelAm: 'ብሮንዝ',
    labelEn: 'Bronze',
    contribution: 100,
    prize: 100000,
    seats: 1200,
    commission: 20000,
    totalCollection: 120000,
    color: 'from-amber-600 to-amber-800',
    badgeColor: 'bg-amber-500',
    icon: '🥉',
    drawSchedule: 'daily'
  },
  silver: {
    id: 'silver',
    labelAm: 'ሲልቨር',
    labelEn: 'Silver',
    contribution: 500,
    prize: 500000,
    seats: 1200,
    commission: 100000,
    totalCollection: 600000,
    color: 'from-gray-400 to-gray-600',
    badgeColor: 'bg-gray-500',
    icon: '🥈',
    drawSchedule: 'daily'
  },
  gold: {
    id: 'gold',
    labelAm: 'ወርቅ',
    labelEn: 'Gold',
    contribution: 1000,
    prize: 2000000,
    seats: 2400,
    commission: 400000,
    totalCollection: 2400000,
    color: 'from-yellow-500 to-yellow-700',
    badgeColor: 'bg-yellow-500',
    icon: '🥇',
    drawSchedule: 'weekly'
  },
  platinum: {
    id: 'platinum',
    labelAm: 'ፕላቲነም',
    labelEn: 'Platinum',
    contribution: 5000,
    prize: 10000000,
    seats: 2400,
    commission: 2000000,
    totalCollection: 12000000,
    color: 'from-purple-500 to-purple-700',
    badgeColor: 'bg-purple-500',
    icon: '💎',
    drawSchedule: 'monthly'
  }
};

export const getDrawScheduleText = (tierId, language = 'am') => {
  const schedule = TIERS[tierId]?.drawSchedule;
  if (language === 'am') {
    const map = { daily: 'ዕለታዊ እጣ', weekly: 'ሳምንታዊ እጣ', monthly: 'ወርሃዊ እጣ' };
    return map[schedule] || schedule;
  }
  const map = { daily: 'Daily Draw', weekly: 'Weekly Draw', monthly: 'Monthly Draw' };
  return map[schedule] || schedule;
};

export default function SeatSelector({
  isOpen,
  onClose,
  poolId,
  entryFee,
  tierId,
  totalSeats: propTotalSeats,
  seatsPerRow: propSeatsPerRow = 20,
  maxSeats = 5,
  poolInfo,
  programType,
  city,
  language = 'am',
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
  const [currentRow, setCurrentRow] = useState(0);
  const seatGridRef = useRef(null);

  // Get tier config if tierId is provided
  const tier = tierId ? TIERS[tierId] : null;
  
  // Determine total seats and seats per row
  const totalSeats = propTotalSeats || tier?.seats || 2400;
  const seatsPerRow = propSeatsPerRow || 20;
  const rows = Math.ceil(totalSeats / seatsPerRow);
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Cleanup
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
          toast.error(language === 'am' ? 'እባክዎ ወደ ስርዓት ይግቡ' : 'Please login to select seats');
          onCancel?.();
          return;
        }
        if (isMounted.current) setCurrentUser(session.user);
      } catch (err) {
        console.error('Session error:', err);
        toast.error('Session error. Please refresh and try again');
        onCancel?.();
      } finally {
        if (isMounted.current) setSessionLoading(false);
      }
    };
    getUser();
  }, [onCancel, language]);

  // Fetch booked seats
  useEffect(() => {
    if (!sessionLoading && currentUser && (poolId || tierId)) {
      fetchBookedSeats();
      fetchUserReservations();
      
      const interval = setInterval(() => {
        fetchBookedSeats();
        fetchUserReservations();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [poolId, tierId, sessionLoading, currentUser]);

  // Update total price
  useEffect(() => {
    if (isMounted.current) {
      const fee = entryFee || tier?.contribution || 0;
      setTotalPrice(selectedSeats.length * fee);
    }
  }, [selectedSeats, entryFee, tier]);

  const fetchBookedSeats = async () => {
    try {
      let data;
      
      if (programType === 'merkato') {
        const { data: d, error } = await supabase
          .from('merkato_vip_participants')
          .select('seat_numbers, payment_status')
          .eq('tier', tierId || 'bronze')
          .in('payment_status', ['verified', 'pending_verification']);
        if (!error) data = d;
      } else if (programType === 'city') {
        const { data: d, error } = await supabase
          .from('city_vip_participants')
          .select('seat_numbers, payment_status')
          .eq('city', city)
          .eq('tier', tierId || 'bronze')
          .in('payment_status', ['verified', 'pending_verification']);
        if (!error) data = d;
      } else if (poolId) {
        const { data: d, error } = await supabase
          .from('pool_seats')
          .select('seat_number, status, reserved_by')
          .eq('pool_id', poolId);
        
        if (!error && d) {
          const takenSeats = d
            .filter(seat => seat.status === 'taken')
            .map(seat => seat.seat_number);
          const reservedByOthers = d
            .filter(seat => seat.status === 'reserved' && seat.reserved_by !== currentUser?.id)
            .map(seat => seat.seat_number);
          const allBooked = [...new Set([...takenSeats, ...reservedByOthers])];
          
          if (isMounted.current) {
            setBookedSeats(allBooked);
            setLoading(false);
          }
          return;
        }
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
  };

  const fetchUserReservations = async () => {
    if (!currentUser) return;
    
    try {
      if (poolId) {
        const { data, error } = await supabase
          .from('pool_seats')
          .select('seat_number, reserved_until')
          .eq('pool_id', poolId)
          .eq('reserved_by', currentUser.id)
          .eq('status', 'reserved')
          .gte('reserved_until', new Date().toISOString());
        
        if (!error && data && data.length > 0) {
          const reservedSeatNumbers = data.map(r => r.seat_number);
          setReservedSeats(reservedSeatNumbers);
          setSelectedSeats(reservedSeatNumbers);
        }
        return;
      }
      
      // For VIP programs, check reservations table
      const { data, error } = await supabase
        .from('vip_seat_reservations')
        .select('seat_number, expires_at')
        .eq('user_id', currentUser.id)
        .eq('pool_id', poolId || `${programType}_${tierId}_${city || 'default'}`)
        .gte('expires_at', new Date().toISOString());
      
      if (!error && data && data.length > 0) {
        const reservedSeatNumbers = data.map(r => r.seat_number);
        setReservedSeats(reservedSeatNumbers);
        setSelectedSeats(reservedSeatNumbers);
      }
    } catch (err) {
      console.error('Fetch reservations error:', err);
    }
  };

  const reserveSeatsInDB = async (seatNumbers) => {
    if (!currentUser) return false;
    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    try {
      if (poolId) {
        for (const seatNumber of seatNumbers) {
          const { error } = await supabase
            .from('pool_seats')
            .upsert({
              pool_id: poolId,
              seat_number: seatNumber,
              user_id: currentUser.id,
              reserved_by: currentUser.id,
              status: 'reserved',
              reserved_until: expiresAt,
              reserved_at: new Date().toISOString()
            }, { onConflict: 'pool_id, seat_number' });
          
          if (error) {
            console.error('Reserve error:', error);
            return false;
          }
        }
      } else {
        const reservations = seatNumbers.map(seatNumber => ({
          pool_id: poolId || `${programType}_${tierId}_${city || 'default'}`,
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
      }
      
      // Set timer to release seats after 10 minutes
      if (reservationTimer) clearTimeout(reservationTimer);
      const timer = setTimeout(() => {
        releaseUserReservations();
        toast.warning(language === 'am' ? 'የመቀመጫ ምርጫዎ ጊዜ አልቋል' : 'Your seat reservation has expired', { duration: 5000 });
        onCancel?.();
      }, 10 * 60 * 1000);
      setReservationTimer(timer);
      
      return true;
    } catch (error) {
      console.error('Error reserving seats:', error);
      return false;
    }
  };

  const releaseUserReservations = async () => {
    if (!currentUser) return;
    
    try {
      if (poolId) {
        await supabase
          .from('pool_seats')
          .update({
            status: 'available',
            user_id: null,
            reserved_by: null,
            reserved_at: null,
            reserved_until: null
          })
          .eq('pool_id', poolId)
          .eq('reserved_by', currentUser.id)
          .eq('status', 'reserved');
      } else {
        await supabase
          .from('vip_seat_reservations')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('pool_id', poolId || `${programType}_${tierId}_${city || 'default'}`);
      }
      
      setReservedSeats([]);
      setSelectedSeats([]);
    } catch (error) {
      console.error('Error releasing reservations:', error);
    }
  };

  const handleSeatClick = async (seatNum) => {
    if (bookedSeats.includes(seatNum)) {
      toast.error(language === 'am' ? `መቀመጫ ${seatNum} ተይዟል` : `Seat ${seatNum} is already taken`);
      return;
    }

    const isSelected = selectedSeats.includes(seatNum);

    if (isSelected) {
      if (poolId) {
        await supabase
          .from('pool_seats')
          .update({
            status: 'available',
            user_id: null,
            reserved_by: null,
            reserved_at: null,
            reserved_until: null
          })
          .eq('pool_id', poolId)
          .eq('seat_number', seatNum)
          .eq('reserved_by', currentUser.id);
      } else {
        await supabase
          .from('vip_seat_reservations')
          .delete()
          .eq('pool_id', poolId || `${programType}_${tierId}_${city || 'default'}`)
          .eq('seat_number', seatNum)
          .eq('user_id', currentUser.id);
      }
      
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      setReservedSeats(reservedSeats.filter(s => s !== seatNum));
    } else {
      if (selectedSeats.length >= maxSeats) {
        toast.error(language === 'am' ? `እስከ ${maxSeats} መቀመጫዎች ብቻ መምረጥ ይችላሉ` : `You can only select up to ${maxSeats} seats`);
        return;
      }
      
      const success = await reserveSeatsInDB([seatNum]);
      if (success) {
        setSelectedSeats([...selectedSeats, seatNum]);
        setReservedSeats([...reservedSeats, seatNum]);
        toast.success(language === 'am' ? `መቀመጫ ${seatNum} ለ10 ደቂቃ ተይዟል` : `Seat ${seatNum} reserved for 10 minutes`);
      } else {
        toast.error(language === 'am' ? `መቀመጫ ${seatNum} አይገኝም` : `Seat ${seatNum} is no longer available`);
        await fetchBookedSeats();
      }
    }
  };

  const confirmSelection = async () => {
    if (selectedSeats.length === 0) {
      toast.error(language === 'am' ? 'እባክዎ ቢያንስ አንድ መቀመጫ ይምረጡ' : 'Please select at least one seat');
      return;
    }
    
    if (reservationTimer) clearTimeout(reservationTimer);
    
    onSeatsSelected({
      seats: selectedSeats,
      totalAmount: totalPrice,
      seatCount: selectedSeats.length,
      tier: tierId
    });
  };

  const refreshSeats = async () => {
    await fetchBookedSeats();
    await fetchUserReservations();
    toast.success(language === 'am' ? 'መቀመጫዎች ታድሰዋል! ✅' : 'Seats refreshed! ✅');
  };

  const scrollToRow = (rowIndex) => {
    setCurrentRow(rowIndex);
    if (seatGridRef.current) {
      const rowElement = document.getElementById(`row-${rowIndex}`);
      if (rowElement) rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
          <p className="text-red-600 mb-4">{language === 'am' ? 'እባክዎ ወደ ስርዓት ይግቡ' : 'Please login to select seats'}</p>
          <button onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded-lg">{language === 'am' ? 'ተመለስ' : 'Go Back'}</button>
        </div>
      </div>
    );
  }

  // Generate seat rows
  const seatRows = [];
  for (let row = 0; row < rows; row++) {
    const startSeat = row * seatsPerRow + 1;
    const endSeat = Math.min(startSeat + seatsPerRow - 1, totalSeats);
    const rowSeats = [];
    for (let seat = startSeat; seat <= endSeat; seat++) {
      rowSeats.push(seat);
    }
    seatRows.push(rowSeats);
  }

  const availableCount = seatRows.flat().filter(s => 
    !bookedSeats.includes(s) && !selectedSeats.includes(s) && !reservedSeats.includes(s)
  ).length;
  const takenCount = bookedSeats.length;
  const fee = entryFee || tier?.contribution || 0;
  const prize = poolInfo?.prize || tier?.prize || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2">
      <div className="bg-gray-100 rounded-2xl shadow-xl max-w-full w-full max-h-[98vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gray-100 border-b border-gray-200 p-4 z-10">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {language === 'am' ? 'መቀመጫዎችን ይምረጡ' : 'Select Your Seats'}
              </h2>
              <div className="flex items-center gap-2 text-sm">
                {tier && (
                  <span className={`px-2 py-0.5 rounded-full text-white text-xs ${tier.badgeColor}`}>
                    {language === 'am' ? tier.labelAm : tier.labelEn}
                  </span>
                )}
                <span className="text-gray-600">
                  {language === 'am' ? 'ክፍያ:' : 'Entry:'} ETB {fee.toLocaleString()}
                </span>
                <span className="text-gray-600">
                  {language === 'am' ? 'ሽልማት:' : 'Prize:'} ETB {prize.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={refreshSeats} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition flex items-center gap-1"
              >
                🔄 Refresh
              </button>
              <button onClick={onClose || onCancel} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
          </div>
          {/* Row Navigator */}
          {rows > 10 && (
            <div className="flex overflow-x-auto gap-1 mt-3 pb-2">
              {Array.from({ length: Math.min(rows, 20) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToRow(idx)}
                  className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition ${
                    currentRow === idx
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {language === 'am' ? `ረድፍ ${idx + 1}` : `Row ${rowLetters[idx] || (idx + 1)}`}
                </button>
              ))}
              {rows > 20 && <span className="px-2 py-1 text-xs text-gray-500">+{rows - 20} more</span>}
            </div>
          )}
        </div>

        {/* Seat Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-wrap justify-center gap-4 mb-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-200 border border-gray-300 rounded"></div>
              <span className="text-xs">{language === 'am' ? 'ክፍት' : 'Available'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-600 rounded"></div>
              <span className="text-xs">{language === 'am' ? 'የእርስዎ ምርጫ' : 'Your Selection'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-400 rounded"></div>
              <span className="text-xs">{language === 'am' ? 'የተያዙ' : 'Taken/Booked'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-400 rounded animate-pulse"></div>
              <span className="text-xs">{language === 'am' ? 'ለእርስዎ የተያዘ (10 ደቂቃ)' : 'Reserved (10 min)'}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-green-50 rounded-lg p-2 text-center border">
              <p className="text-xl font-bold text-green-600">{availableCount.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">{language === 'am' ? 'ክፍት' : 'Available'}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2 text-center border">
              <p className="text-xl font-bold text-yellow-600">{selectedSeats.length}</p>
              <p className="text-[10px] text-gray-500">{language === 'am' ? 'የተመረጡ' : 'Selected'}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2 text-center border">
              <p className="text-xl font-bold text-red-600">{takenCount.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">{language === 'am' ? 'የተያዙ' : 'Booked'}</p>
            </div>
          </div>

          {/* Screen */}
          <div className="text-center mb-4">
            <div className="inline-block bg-gray-600 text-white text-[10px] px-4 py-1 rounded-full">🎬 SCREEN</div>
            <div className="w-full h-px bg-gray-300 mt-2"></div>
          </div>

          {/* Seat Grid - Theater Style */}
          <div ref={seatGridRef} className="space-y-1.5 max-h-[50vh] overflow-y-auto p-2">
            {seatRows.map((rowSeats, rowIndex) => (
              <div key={rowIndex} id={`row-${rowIndex}`} className="flex flex-wrap items-center gap-1">
                <div className="w-8 text-[10px] font-mono font-semibold text-gray-400 text-right">
                  {rowLetters[rowIndex] || (rowIndex + 1)}
                </div>
                <div className="flex flex-wrap gap-1 flex-1">
                  {rowSeats.map(seatNum => {
                    const isTaken = bookedSeats.includes(seatNum);
                    const isSelected = selectedSeats.includes(seatNum);
                    const isReserved = reservedSeats.includes(seatNum) && !isSelected;
                    
                    let bgColor = 'bg-white border border-gray-300 hover:bg-gray-100 cursor-pointer';
                    let textColor = 'text-gray-700';
                    let size = 'w-8 h-8 text-[10px]';
                    
                    if (isSelected) {
                      bgColor = 'bg-green-600 border-green-700';
                      textColor = 'text-white';
                      size = 'w-8 h-8 text-[10px] ring-2 ring-green-300 ring-offset-1';
                    }
                    if (isTaken) {
                      bgColor = 'bg-red-400 border-red-500';
                      textColor = 'text-white opacity-60';
                      size = 'w-8 h-8 text-[10px] cursor-not-allowed';
                    }
                    if (isReserved) {
                      bgColor = 'bg-yellow-400 border-yellow-500 animate-pulse';
                      textColor = 'text-gray-700';
                    }

                    return (
                      <button
                        key={seatNum}
                        onClick={() => !isTaken && handleSeatClick(seatNum)}
                        disabled={isTaken}
                        className={`${size} rounded-lg flex items-center justify-center font-mono font-semibold transition-all ${bgColor} ${textColor}`}
                        title={isTaken ? `Seat ${seatNum} taken` : `Select Seat ${seatNum}`}
                      >
                        {seatNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {totalSeats > 500 && (
            <p className="text-xs text-gray-400 text-center mt-4">
              {language === 'am' ? `ሁሉም ${totalSeats.toLocaleString()} መቀመጫዎች እዚህ ይታያሉ` : `All ${totalSeats.toLocaleString()} seats are shown here`}
            </p>
          )}
          
          {selectedSeats.length > 0 && (
            <div className="sticky bottom-0 bg-gray-100 border-t border-gray-200 p-4 mt-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <p className="text-xs text-gray-500">{language === 'am' ? 'የተመረጡ መቀመጫዎች' : 'Selected Seats'}</p>
                  <p className="font-bold text-sm">{selectedSeats.sort((a,b)=>a-b).join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{language === 'am' ? 'ጠቅላላ ክፍያ' : 'Total Amount'}</p>
                  <p className="font-bold text-xl text-green-600">ETB {totalPrice.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">({selectedSeats.length} {language === 'am' ? 'መቀመጫ ×' : 'seats ×'} ETB {fee.toLocaleString()})</p>
                </div>
                <button
                  onClick={confirmSelection}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold transition text-sm"
                >
                  {language === 'am' ? 'አረጋግጥ እና ወደ ክፍያ ቀጥል' : 'Confirm & Proceed to Payment'}
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">⏰ {language === 'am' ? 'የተመረጡት መቀመጫዎች ለ10 ደቂቃ ተይዘዋል' : 'Selected seats are reserved for 10 minutes'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
