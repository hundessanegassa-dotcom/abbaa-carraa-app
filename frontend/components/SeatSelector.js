// components/SeatSelector.js - COMPLETE WITH ALL SEATS DISPLAYED
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// ============================================
// TIER CONFIGURATION - 5 TIERS
// ============================================
export const TIERS = {
  silver: {
    id: 'silver',
    labelAm: 'ብር',
    labelEn: 'Silver',
    labelOm: 'Silver',
    contribution: 100,
    prize: 100000,
    seats: 1200,
    commission: 20000,
    totalCollection: 120000,
    color: 'from-gray-400 to-gray-500',
    badgeColor: 'bg-gray-500',
    icon: '🥈',
    drawSchedule: 'daily',
    tier: 1
  },
  gold: {
    id: 'gold',
    labelAm: 'ወርቅ',
    labelEn: 'Gold',
    labelOm: 'Gold',
    contribution: 500,
    prize: 500000,
    seats: 1200,
    commission: 100000,
    totalCollection: 600000,
    color: 'from-yellow-400 to-yellow-600',
    badgeColor: 'bg-yellow-500',
    icon: '🥇',
    drawSchedule: 'daily',
    tier: 2
  },
  platinum: {
    id: 'platinum',
    labelAm: 'ፕላቲኒየም',
    labelEn: 'Platinum',
    labelOm: 'Platinum',
    contribution: 1000,
    prize: 2000000,
    seats: 2400,
    commission: 400000,
    totalCollection: 2400000,
    color: 'from-gray-300 to-blue-400',
    badgeColor: 'bg-blue-500',
    icon: '💎',
    drawSchedule: 'weekly',
    tier: 3
  },
  diamond: {
    id: 'diamond',
    labelAm: 'አልማዝ',
    labelEn: 'Diamond',
    labelOm: 'Diamond',
    contribution: 2500,
    prize: 5000000,
    seats: 2400,
    commission: 1000000,
    totalCollection: 6000000,
    color: 'from-blue-400 to-cyan-400',
    badgeColor: 'bg-cyan-500',
    icon: '💠',
    drawSchedule: 'weekly',
    tier: 4
  },
  royal: {
    id: 'royal',
    labelAm: 'ንጉሣዊ',
    labelEn: 'Royal',
    labelOm: 'Royal',
    contribution: 5000,
    prize: 10000000,
    seats: 2400,
    commission: 2000000,
    totalCollection: 12000000,
    color: 'from-purple-500 to-pink-500',
    badgeColor: 'bg-purple-500',
    icon: '👑',
    drawSchedule: 'monthly',
    tier: 5
  }
};

export const TIER_IDS = ['silver', 'gold', 'platinum', 'diamond', 'royal'];

export const getDrawScheduleText = (tierId, language = 'am') => {
  const tier = TIERS[tierId];
  if (!tier) return language === 'am' ? 'ዕለታዊ' : 'Daily';
  const schedule = tier.drawSchedule;
  if (language === 'am') {
    const map = { daily: 'ዕለታዊ እጣ', weekly: 'ሳምንታዊ እጣ', monthly: 'ወርሃዊ እጣ' };
    return map[schedule] || schedule;
  }
  if (language === 'om') {
    const map = { daily: 'Qodaa Guyyaa', weekly: 'Qodaa Torban', monthly: 'Qodaa Ji\'aa' };
    return map[schedule] || schedule;
  }
  const map = { daily: 'Daily Draw', weekly: 'Weekly Draw', monthly: 'Monthly Draw' };
  return map[schedule] || schedule;
};

export const getTierLabel = (tierId, language = 'am') => {
  const tier = TIERS[tierId];
  if (!tier) return tierId;
  if (language === 'am') return tier.labelAm;
  if (language === 'om') return tier.labelOm;
  return tier.labelEn;
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
  onCancel,
  endDate
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
  const [currentPage, setCurrentPage] = useState(0);
  const [seatsPerPage, setSeatsPerPage] = useState(200);
  const [seatInputMode, setSeatInputMode] = useState(false);
  const [manualSeatInput, setManualSeatInput] = useState('');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [seatsInitialized, setSeatsInitialized] = useState(false);
  const seatGridRef = useRef(null);
  const containerRef = useRef(null);

  // Get tier config
  const tier = tierId ? TIERS[tierId] : null;
  const totalSeats = propTotalSeats || tier?.seats || 2400;
  const seatsPerRow = propSeatsPerRow || 20;
  const totalPages = Math.ceil(totalSeats / seatsPerPage);
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Adjust seats per page based on total seats
  useEffect(() => {
    if (totalSeats > 5000) {
      setSeatsPerPage(300);
    } else if (totalSeats > 3000) {
      setSeatsPerPage(250);
    } else {
      setSeatsPerPage(200);
    }
  }, [totalSeats]);

  // Countdown Timer
  useEffect(() => {
    if (!endDate) return;
    const target = new Date(endDate).getTime();
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (reservationTimer) clearTimeout(reservationTimer);
    };
  }, [reservationTimer]);

  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
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

  // Initialize seats for regular pools
  const initializeSeats = async () => {
    if (!poolId || seatsInitialized || programType !== 'regular') return;
    
    try {
      const { count, error: countError } = await supabase
        .from('pool_seats')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', poolId);
      
      if (countError) {
        console.error('Count error:', countError);
        return;
      }
      
      if (count === 0 && totalSeats > 0) {
        console.log(`Generating ${totalSeats} seats for pool ${poolId}`);
        const seatsToInsert = [];
        for (let i = 1; i <= totalSeats; i++) {
          seatsToInsert.push({
            pool_id: poolId,
            seat_number: i,
            status: 'available'
          });
        }
        
        const batchSize = 500;
        for (let i = 0; i < seatsToInsert.length; i += batchSize) {
          const batch = seatsToInsert.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from('pool_seats')
            .insert(batch);
          if (insertError) console.error('Batch insert error:', insertError);
        }
        setSeatsInitialized(true);
        console.log(`Successfully generated ${totalSeats} seats`);
      } else {
        setSeatsInitialized(true);
      }
    } catch (error) {
      console.error('Error initializing seats:', error);
    }
  };

  // Fetch booked seats and initialize
  useEffect(() => {
    if (!sessionLoading && currentUser && (poolId || tierId || programType)) {
      if (programType === 'regular' && poolId) {
        initializeSeats();
      }
      fetchBookedSeats();
      fetchUserReservations();
      
      const interval = setInterval(() => {
        fetchBookedSeats();
        fetchUserReservations();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [poolId, tierId, sessionLoading, currentUser, programType]);

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
        const { data: d } = await supabase
          .from('merkato_vip_participants')
          .select('seat_numbers, payment_status')
          .eq('tier', tierId || 'silver')
          .in('payment_status', ['verified', 'pending_verification']);
        data = d;
      } else if (programType === 'city') {
        const { data: d } = await supabase
          .from('city_vip_participants')
          .select('seat_numbers, payment_status')
          .eq('city', city)
          .eq('tier', tierId || 'silver')
          .in('payment_status', ['verified', 'pending_verification']);
        data = d;
      } else if (poolId) {
        const { data: d } = await supabase
          .from('pool_seats')
          .select('seat_number, status, reserved_by')
          .eq('pool_id', poolId);
        
        const takenSeats = (d || [])
          .filter(seat => seat.status === 'taken')
          .map(seat => seat.seat_number);
        const reservedByOthers = (d || [])
          .filter(seat => seat.status === 'reserved' && seat.reserved_by !== currentUser?.id)
          .map(seat => seat.seat_number);
        const allBooked = [...new Set([...takenSeats, ...reservedByOthers])];
        
        if (isMounted.current) {
          setBookedSeats(allBooked);
          setLoading(false);
        }
        return;
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
      if (poolId && programType === 'regular') {
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
      try {
        const poolIdText = poolId || `${programType}_${tierId}_${city || 'default'}`;
        const { data, error } = await supabase
          .from('vip_seat_reservations')
          .select('seat_number, expires_at')
          .eq('user_id', currentUser.id)
          .eq('pool_id', poolIdText)
          .gte('expires_at', new Date().toISOString());
        
        if (!error && data && data.length > 0) {
          const reservedSeatNumbers = data.map(r => r.seat_number);
          setReservedSeats(reservedSeatNumbers);
          setSelectedSeats(reservedSeatNumbers);
        }
      } catch (err) {
        // Table may not exist yet, ignore
        console.log('VIP reservations table may not exist yet');
      }
    } catch (err) {
      console.error('Fetch reservations error:', err);
    }
  };

  const reserveSeatsInDB = async (seatNumbers) => {
    if (!currentUser) return false;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    try {
      if (poolId && programType === 'regular') {
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
        // For VIP programs, try to insert into reservations
        try {
          const poolIdText = poolId || `${programType}_${tierId}_${city || 'default'}`;
          const reservations = seatNumbers.map(seatNumber => ({
            pool_id: poolIdText,
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
            if (error.code === '42P01') {
              console.log('vip_seat_reservations table not found, continuing without reservation');
              return true;
            }
            return false;
          }
        } catch (err) {
          console.log('VIP reservations table may not exist, continuing:', err.message);
          return true;
        }
      }
      
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
      if (poolId && programType === 'regular') {
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
        try {
          const poolIdText = poolId || `${programType}_${tierId}_${city || 'default'}`;
          await supabase
            .from('vip_seat_reservations')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('pool_id', poolIdText);
        } catch (err) {
          // Table may not exist, ignore
          console.log('VIP reservations table may not exist');
        }
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
      if (poolId && programType === 'regular') {
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
        try {
          const poolIdText = poolId || `${programType}_${tierId}_${city || 'default'}`;
          await supabase
            .from('vip_seat_reservations')
            .delete()
            .eq('pool_id', poolIdText)
            .eq('seat_number', seatNum)
            .eq('user_id', currentUser.id);
        } catch (err) {
          // Table may not exist, ignore
        }
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

  const handleManualSeatSelection = async () => {
    if (!manualSeatInput.trim()) {
      toast.error(language === 'am' ? 'እባክዎ መቀመጫ ቁጥር ያስገቡ' : 'Please enter seat number(s)');
      return;
    }
    
    const seatNumbers = manualSeatInput
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n > 0 && n <= totalSeats);
    
    if (seatNumbers.length === 0) {
      toast.error(language === 'am' ? 'እባክዎ ትክክለኛ መቀመጫ ቁጥሮች ያስገቡ' : 'Please enter valid seat numbers');
      return;
    }
    
    if (selectedSeats.length + seatNumbers.length > maxSeats) {
      toast.error(language === 'am' ? `እስከ ${maxSeats} መቀመጫዎች ብቻ መምረጥ ይችላሉ` : `You can only select up to ${maxSeats} seats`);
      return;
    }
    
    const takenSeats = seatNumbers.filter(n => bookedSeats.includes(n));
    if (takenSeats.length > 0) {
      toast.error(language === 'am' ? `መቀመጫዎች ${takenSeats.join(', ')} ተይዘዋል` : `Seats ${takenSeats.join(', ')} are taken`);
      return;
    }
    
    const success = await reserveSeatsInDB(seatNumbers);
    if (success) {
      setSelectedSeats([...selectedSeats, ...seatNumbers]);
      setReservedSeats([...reservedSeats, ...seatNumbers]);
      setManualSeatInput('');
      setSeatInputMode(false);
      toast.success(language === 'am' ? `${seatNumbers.length} መቀመጫዎች ተይዘዋል` : `${seatNumbers.length} seats reserved`);
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

  // Get current page seats
  const getCurrentPageSeats = () => {
    const start = currentPage * seatsPerPage;
    const end = Math.min(start + seatsPerPage, totalSeats);
    const pageSeats = [];
    for (let i = start; i < end; i++) {
      pageSeats.push(i + 1);
    }
    return pageSeats;
  };

  const currentPageSeats = getCurrentPageSeats();

  // Scroll to top when page changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

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

  const availableCount = Math.max(0, totalSeats - bookedSeats.length - selectedSeats.length);
  const takenCount = bookedSeats.length;
  const fee = entryFee || tier?.contribution || 0;
  const prize = poolInfo?.prize || tier?.prize || 0;

  // Build seat rows for current page
  const currentPageSeatsList = getCurrentPageSeats();
  const displayRows = Math.ceil(currentPageSeatsList.length / seatsPerRow);
  const seatRows = [];
  
  for (let row = 0; row < displayRows; row++) {
    const startSeat = row * seatsPerRow;
    const endSeat = Math.min(startSeat + seatsPerRow, currentPageSeatsList.length);
    const rowSeats = [];
    for (let i = startSeat; i < endSeat; i++) {
      rowSeats.push(currentPageSeatsList[i]);
    }
    seatRows.push(rowSeats);
  }

  const scrollToRow = (rowIndex) => {
    if (containerRef.current) {
      const rowElement = document.getElementById(`row-${rowIndex}`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

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
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {tier && (
                  <span className={`px-2 py-0.5 rounded-full text-white text-xs ${tier.badgeColor}`}>
                    {language === 'am' ? tier.labelAm : (language === 'om' ? tier.labelOm : tier.labelEn)}
                  </span>
                )}
                <span className="text-gray-600">
                  {language === 'am' ? 'ክፍያ:' : 'Entry:'} ETB {fee.toLocaleString()}
                </span>
                <span className="text-gray-600">
                  {language === 'am' ? 'ሽልማት:' : 'Prize:'} ETB {prize.toLocaleString()}
                </span>
                <span className="text-gray-600">
                  {language === 'am' ? 'ጠቅላላ መቀመጫዎች:' : 'Total Seats:'} {totalSeats.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={refreshSeats} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition flex items-center gap-1">
                🔄 Refresh
              </button>
              <button onClick={onClose || onCancel} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
          </div>

          {/* Countdown Timer */}
          {endDate && (
            <div className="mt-3 bg-white/80 backdrop-blur-sm rounded-xl py-2 px-4 text-center border border-gray-200">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                {language === 'am' ? 'የሚቀረው ጊዜ' : 'Time Remaining'}
              </p>
              <div className="flex justify-center items-center gap-3 font-mono text-lg font-bold">
                <div className="flex flex-col items-center">
                  <span className="text-2xl text-green-700">{String(timeLeft.days).padStart(2, '0')}</span>
                  <span className="text-[8px] text-gray-500 uppercase tracking-wider">{language === 'am' ? 'ቀናት' : 'Days'}</span>
                </div>
                <span className="text-2xl text-gray-400">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl text-green-700">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[8px] text-gray-500 uppercase tracking-wider">{language === 'am' ? 'ሰዓታት' : 'Hrs'}</span>
                </div>
                <span className="text-2xl text-gray-400">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl text-green-700">{String(timeLeft.mins).padStart(2, '0')}</span>
                  <span className="text-[8px] text-gray-500 uppercase tracking-wider">{language === 'am' ? 'ደቂቃ' : 'Min'}</span>
                </div>
                <span className="text-2xl text-gray-400">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl text-green-700">{String(timeLeft.secs).padStart(2, '0')}</span>
                  <span className="text-[8px] text-gray-500 uppercase tracking-wider">{language === 'am' ? 'ሰከንድ' : 'Sec'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seat Grid */}
        <div className="flex-1 overflow-y-auto p-4" ref={containerRef}>
          {/* Pagination - Show page numbers */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ◀
              </button>
              <span className="text-xs text-gray-600">
                {language === 'am' 
                  ? `ገጽ ${currentPage + 1} ከ ${totalPages}` 
                  : `Page ${currentPage + 1} of ${totalPages}`}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ▶
              </button>
              <span className="text-xs text-gray-400 ml-2">
                {language === 'am' ? 'መቀመጫዎች' : 'Seats'} {currentPage * seatsPerPage + 1} - {Math.min((currentPage + 1) * seatsPerPage, totalSeats)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSeatInputMode(!seatInputMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  seatInputMode ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {seatInputMode ? '📋 ' + (language === 'am' ? 'ዝርዝር ምረጥ' : 'Select Grid') : '🎯 ' + (language === 'am' ? 'በቁጥር አስገባ' : 'Enter Numbers')}
              </button>
            </div>
          </div>

          {/* Row Navigation - Quick jump to rows */}
          {displayRows > 10 && !seatInputMode && (
            <div className="flex overflow-x-auto gap-1 mb-4 pb-2">
              {Array.from({ length: Math.min(displayRows, 15) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToRow(idx)}
                  className="px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  {language === 'am' ? `ረድፍ ${idx + 1}` : `Row ${rowLetters[idx] || (idx + 1)}`}
                </button>
              ))}
              {displayRows > 15 && (
                <span className="px-2 py-1 text-[10px] text-gray-400">+{displayRows - 15} more</span>
              )}
            </div>
          )}

          {/* Manual Seat Input Mode */}
          {seatInputMode && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm font-semibold text-blue-700 mb-2">
                {language === 'am' 
                  ? `🎯 የመቀመጫ ቁጥሮችን በነጠላ ሰረዝ ይለያዩ (ከ1 እስከ ${totalSeats.toLocaleString()})`
                  : `🎯 Enter seat numbers separated by commas (1 to ${totalSeats.toLocaleString()})`}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualSeatInput}
                  onChange={(e) => setManualSeatInput(e.target.value)}
                  placeholder={language === 'am' ? 'ለምሳሌ: 5, 12, 23' : 'Example: 5, 12, 23'}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleManualSeatSelection}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  {language === 'am' ? 'አስይዝ' : 'Reserve'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {language === 'am' ? `ከፍተኛ ${maxSeats} መቀመጫዎች` : `Maximum ${maxSeats} seats`}
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mb-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white border border-gray-300 rounded"></div>
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
            <div className="inline-block bg-gray-700 text-white text-[10px] px-6 py-1 rounded-full uppercase tracking-wider">🎬 SCREEN</div>
            <div className="w-full h-px bg-gray-300 mt-2"></div>
          </div>

          {/* Seat Grid - Theater Style with ALL seats */}
          {!seatInputMode && (
            <div className="space-y-1.5 max-h-[45vh] overflow-y-auto p-2" ref={containerRef}>
              {seatRows.map((rowSeats, rowIndex) => (
                <div key={rowIndex} id={`row-${rowIndex}`} className="flex flex-wrap items-center gap-1">
                  <div className="w-8 text-[10px] font-mono font-semibold text-gray-400 text-right flex-shrink-0">
                    {rowLetters[rowIndex] || (rowIndex + 1)}
                  </div>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {rowSeats.map(seatNum => {
                      const isTaken = bookedSeats.includes(seatNum);
                      const isSelected = selectedSeats.includes(seatNum);
                      const isReserved = reservedSeats.includes(seatNum) && !isSelected;
                      
                      let bgColor = 'bg-white border border-gray-300 hover:bg-gray-100 cursor-pointer';
                      let textColor = 'text-gray-700';
                      let size = 'w-7 h-7 text-[9px] sm:w-8 sm:h-8 sm:text-[10px]';
                      
                      if (isSelected) {
                        bgColor = 'bg-green-600 border-green-700';
                        textColor = 'text-white';
                        size = 'w-7 h-7 text-[9px] sm:w-8 sm:h-8 sm:text-[10px] ring-2 ring-green-300 ring-offset-1';
                      }
                      if (isTaken) {
                        bgColor = 'bg-red-400 border-red-500';
                        textColor = 'text-white opacity-60';
                        size = 'w-7 h-7 text-[9px] sm:w-8 sm:h-8 sm:text-[10px] cursor-not-allowed';
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
          )}

          {/* Page info */}
          <p className="text-xs text-gray-400 text-center mt-4">
            {language === 'am' 
              ? `ገጽ ${currentPage + 1}/${totalPages} • መቀመጫዎች ${currentPage * seatsPerPage + 1} - ${Math.min((currentPage + 1) * seatsPerPage, totalSeats)} ከ ${totalSeats.toLocaleString()}`
              : `Page ${currentPage + 1}/${totalPages} • Seats ${currentPage * seatsPerPage + 1} - ${Math.min((currentPage + 1) * seatsPerPage, totalSeats)} of ${totalSeats.toLocaleString()}`}
          </p>
          
          {/* Selection Footer */}
          {selectedSeats.length > 0 && (
            <div className="sticky bottom-0 bg-gray-100 border-t border-gray-200 p-4 mt-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
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
