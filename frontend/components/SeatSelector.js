// components/SeatSelector.js - COMPLETE UNIFIED SEAT SELECTOR
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// ============================================
// TIER CONFIGURATION
// ============================================
export const TIERS = {
  silver: {
    id: 'silver',
    labelAm: 'ብር',
    labelEn: 'Silver',
    contribution: 100,
    prize: 100000,
    seats: 1200,
    color: 'from-gray-400 to-gray-500',
    badgeColor: 'bg-gray-500',
    icon: '🥈',
    image_url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%"><defs><linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23e2e8f0"/><stop offset="50%" stop-color="%2394a3b8"/><stop offset="100%" stop-color="%23475569"/></linearGradient><linearGradient id="shine" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0"/><stop offset="50%" stop-color="%23ffffff" stop-opacity="0.4"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></linearGradient></defs><rect width="400" height="250" rx="20" fill="url(%23silver-grad)"/><path d="M 200 40 L 320 80 L 290 200 L 110 200 L 80 80 Z" fill="%23cbd5e1" stroke="%2394a3b8" stroke-width="4" opacity="0.9"/><text x="200" y="145" font-family="system-ui" font-size="24" font-weight="bold" fill="%23475569" text-anchor="middle" letter-spacing="4">SILVER 999</text><rect width="400" height="250" rx="20" fill="url(%23shine)"/></svg>`,
    drawSchedule: 'daily',
    tier: 1
  },
  gold: {
    id: 'gold',
    labelAm: 'ወርቅ',
    labelEn: 'Gold',
    contribution: 500,
    prize: 500000,
    seats: 1200,
    color: 'from-yellow-400 to-yellow-600',
    badgeColor: 'bg-yellow-500',
    icon: '🥇',
    image_url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%"><defs><linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fef08a"/><stop offset="50%" stop-color="%23eab308"/><stop offset="100%" stop-color="%23854d0e"/></linearGradient><linearGradient id="shine" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0"/><stop offset="50%" stop-color="%23ffffff" stop-opacity="0.5"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></linearGradient></defs><rect width="400" height="250" rx="20" fill="url(%23gold-grad)"/><path d="M 200 40 L 320 80 L 290 200 L 110 200 L 80 80 Z" fill="%23fef08a" stroke="%23ca8a04" stroke-width="4" opacity="0.9"/><text x="200" y="145" font-family="system-ui" font-size="24" font-weight="bold" fill="%23854d0e" text-anchor="middle" letter-spacing="4">FINE GOLD 99.9</text><rect width="400" height="250" rx="20" fill="url(%23shine)"/></svg>`,
    drawSchedule: 'daily',
    tier: 2
  },
  platinum: {
    id: 'platinum',
    labelAm: 'ፕላቲኒየም',
    labelEn: 'Platinum',
    contribution: 1000,
    prize: 2000000,
    seats: 2400,
    color: 'from-gray-300 to-blue-400',
    badgeColor: 'bg-blue-500',
    icon: '💎',
    image_url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%"><defs><linearGradient id="plat-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f1f5f9"/><stop offset="50%" stop-color="%23cbd5e1"/><stop offset="100%" stop-color="%2364748b"/></linearGradient><linearGradient id="shine" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0"/><stop offset="50%" stop-color="%23ffffff" stop-opacity="0.6"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></linearGradient></defs><rect width="400" height="250" rx="20" fill="url(%23plat-grad)"/><circle cx="200" cy="125" r="60" fill="none" stroke="%23cbd5e1" stroke-width="8" opacity="0.4"/><text x="200" y="135" font-family="system-ui" font-size="26" font-weight="bold" fill="%23334155" text-anchor="middle" letter-spacing="6">PLATINUM</text><rect width="400" height="250" rx="20" fill="url(%23shine)"/></svg>`,
    drawSchedule: 'weekly',
    tier: 3
  },
  diamond: {
    id: 'diamond',
    labelAm: 'አልማዝ',
    labelEn: 'Diamond',
    contribution: 2500,
    prize: 5000000,
    seats: 2400,
    color: 'from-blue-400 to-cyan-400',
    badgeColor: 'bg-cyan-500',
    icon: '💠',
    image_url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%"><defs><linearGradient id="diam-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ecfeff"/><stop offset="50%" stop-color="%2322d3ee"/><stop offset="100%" stop-color="%230369a1"/></linearGradient><linearGradient id="shine" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0"/><stop offset="50%" stop-color="%23ffffff" stop-opacity="0.6"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></linearGradient></defs><rect width="400" height="250" rx="20" fill="url(%23diam-grad)"/><polygon points="200,40 260,100 200,160 140,100" fill="%23ecfeff" stroke="%2322d3ee" stroke-width="4" opacity="0.9"/><line x1="140" y1="100" x2="260" y2="100" stroke="%2322d3ee" stroke-width="2" opacity="0.5"/><line x1="200" y1="40" x2="200" y2="160" stroke="%2322d3ee" stroke-width="2" opacity="0.5"/><text x="200" y="215" font-family="system-ui" font-size="24" font-weight="bold" fill="%230891b2" text-anchor="middle" letter-spacing="4">DIAMOND 999</text><rect width="400" height="250" rx="20" fill="url(%23shine)"/></svg>`,
    drawSchedule: 'weekly',
    tier: 4
  },
  royal: {
    id: 'royal',
    labelAm: 'ንጉሣዊ',
    labelEn: 'Royal',
    contribution: 5000,
    prize: 10000000,
    seats: 2400,
    color: 'from-purple-500 to-pink-500',
    badgeColor: 'bg-purple-500',
    icon: '👑',
    image_url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%"><defs><linearGradient id="royal-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fae8ff"/><stop offset="50%" stop-color="%23d946ef"/><stop offset="100%" stop-color="%23701a75"/></linearGradient><linearGradient id="shine" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0"/><stop offset="50%" stop-color="%23ffffff" stop-opacity="0.7"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></linearGradient></defs><rect width="400" height="250" rx="20" fill="url(%23royal-grad)"/><path d="M 120 180 L 100 100 L 150 140 L 200 80 L 250 140 L 300 100 L 280 180 Z" fill="%23fdf4ff" stroke="%23d946ef" stroke-width="4" opacity="0.8"/><circle cx="100" cy="100" r="6" fill="%23fdbaf8"/><circle cx="200" cy="80" r="8" fill="%23fdbaf8"/><circle cx="300" cy="100" r="6" fill="%23fdbaf8"/><rect width="400" height="250" rx="20" fill="url(%23shine)"/></svg>`,
    drawSchedule: 'monthly',
    tier: 5
  }
};

export default function SeatSelector({
  isOpen,
  onClose,
  poolId,
  entryFee,
  tierId,
  totalSeats: propTotalSeats,
  maxSeats = 5,
  poolInfo,
  programType, // 'regular', 'merkato', 'city'
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
  const [currentPage, setCurrentPage] = useState(0);
  const [manualSeatInput, setManualSeatInput] = useState('');
  const [seatsPerPage] = useState(200);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const containerRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  // Get tier config
  const tier = tierId ? TIERS[tierId] : null;
  const totalSeats = propTotalSeats || tier?.seats || 2400;
  const totalPages = Math.ceil(totalSeats / seatsPerPage);
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // ✅ TIMEOUT: Prevent infinite loading
  useEffect(() => {
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && loading) {
        console.log('⚠️ Loading timeout - forcing ready');
        setLoading(false);
        toast.warning(
          language === 'am' 
            ? 'መቀመጫዎችን መጫን ቀርቷል. እባክዎ እንደገና ይሞክሩ' 
            : 'Seat loading timed out. Please try again.'
        );
      }
    }, 8000);
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [loading]);

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
        setSessionLoading(false);
      } catch (err) {
        console.error('Session error:', err);
        toast.error('Session error. Please refresh and try again');
        onCancel?.();
        setSessionLoading(false);
      }
    };
    getUser();
  }, [onCancel, language]);

  // Fetch booked seats
  useEffect(() => {
    if (!sessionLoading && currentUser) {
      fetchBookedSeats();
      fetchUserReservations();
      
      const interval = setInterval(() => {
        fetchBookedSeats();
        fetchUserReservations();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [sessionLoading, currentUser, poolId, tierId, programType, city]);

  useEffect(() => {
    const fee = entryFee || tier?.contribution || 0;
    setTotalPrice(selectedSeats.length * fee);
  }, [selectedSeats, entryFee, tier]);

  const fetchBookedSeats = async () => {
    try {
      let data = [];
      
      if (programType === 'merkato' && tierId) {
        const { data: d, error } = await supabase
          .from('merkato_vip_participants')
          .select('seat_numbers')
          .eq('tier', tierId)
          .in('payment_status', ['verified', 'pending_verification']);
        
        if (!error && d) data = d;
      } else if (programType === 'city' && city && tierId) {
        const { data: d, error } = await supabase
          .from('city_vip_participants')
          .select('seat_numbers')
          .eq('city', city)
          .eq('tier', tierId)
          .in('payment_status', ['verified', 'pending_verification']);
        
        if (!error && d) data = d;
      } else if (poolId) {
        const { data: d, error } = await supabase
          .from('pool_seats')
          .select('seat_number, status, reserved_by')
          .eq('pool_id', poolId);
        
        if (!error && d) {
          const takenSeats = (d || [])
            .filter(seat => seat.status === 'taken')
            .map(seat => seat.seat_number);
          const reservedByOthers = (d || [])
            .filter(seat => seat.status === 'reserved' && seat.reserved_by !== currentUser?.id)
            .map(seat => seat.seat_number);
          const allBooked = [...new Set([...takenSeats, ...reservedByOthers])];
          
          setBookedSeats(allBooked);
          setLoading(false);
          return;
        }
      }
      
      const allBookedSeats = [];
      if (data) {
        data.forEach(p => {
          if (p.seat_numbers && Array.isArray(p.seat_numbers)) {
            allBookedSeats.push(...p.seat_numbers);
          }
        });
      }
      
      setBookedSeats([...new Set(allBookedSeats)]);
      setLoading(false);
    } catch (err) {
      console.error('Fetch booked seats error:', err);
      setBookedSeats([]);
      setLoading(false);
    }
  };

  const fetchUserReservations = async () => {
    if (!currentUser) return;
    
    try {
      // Try to get reservations from vip_seat_reservations
      const poolIdText = poolId || `${programType}_${tierId}_${city || 'default'}`;
      const { data, error } = await supabase
        .from('vip_seat_reservations')
        .select('seat_number')
        .eq('user_id', currentUser.id)
        .eq('pool_id', poolIdText)
        .gte('expires_at', new Date().toISOString());
      
      if (!error && data && data.length > 0) {
        const reservedSeatNumbers = data.map(r => r.seat_number);
        setReservedSeats(reservedSeatNumbers);
        setSelectedSeats(reservedSeatNumbers);
      }
    } catch (err) {
      // Table may not exist, ignore
      console.log('VIP reservations table may not exist yet');
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
          
          if (error) return false;
        }
      } else {
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
        
        if (error && error.code !== '42P01') return false;
      }
      
      if (reservationTimer) clearTimeout(reservationTimer);
      const timer = setTimeout(() => {
        releaseUserReservations();
        toast.warning(
          language === 'am' 
            ? 'የመቀመጫ ምርጫዎ ጊዜ አልቋል' 
            : 'Your seat reservation has expired',
          { duration: 5000 }
        );
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
        const poolIdText = poolId || `${programType}_${tierId}_${city || 'default'}`;
        await supabase
          .from('vip_seat_reservations')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('pool_id', poolIdText);
      }
      setReservedSeats([]);
      setSelectedSeats([]);
    } catch (error) {
      console.error('Error releasing reservations:', error);
    }
  };

  const handleSeatClick = async (seatNum) => {
    if (bookedSeats.includes(seatNum)) {
      toast.error(
        language === 'am' 
          ? `መቀመጫ ${seatNum} ተይዟል` 
          : `Seat ${seatNum} is already taken`
      );
      return;
    }
    
    const isSelected = selectedSeats.includes(seatNum);
    
    if (isSelected) {
      // Release seat
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
        const poolIdText = poolId || `${programType}_${tierId}_${city || 'default'}`;
        await supabase
          .from('vip_seat_reservations')
          .delete()
          .eq('pool_id', poolIdText)
          .eq('seat_number', seatNum)
          .eq('user_id', currentUser.id);
      }
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      setReservedSeats(reservedSeats.filter(s => s !== seatNum));
    } else {
      if (selectedSeats.length >= maxSeats) {
        toast.error(
          language === 'am' 
            ? `እስከ ${maxSeats} መቀመጫዎች ብቻ መምረጥ ይችላሉ` 
            : `You can only select up to ${maxSeats} seats`
        );
        return;
      }
      
      const success = await reserveSeatsInDB([seatNum]);
      if (success) {
        setSelectedSeats([...selectedSeats, seatNum]);
        setReservedSeats([...reservedSeats, seatNum]);
        toast.success(
          language === 'am' 
            ? `መቀመጫ ${seatNum} ለ10 ደቂቃ ተይዟል` 
            : `Seat ${seatNum} reserved for 10 minutes`
        );
      } else {
        toast.error(
          language === 'am' 
            ? `መቀመጫ ${seatNum} አይገኝም` 
            : `Seat ${seatNum} is no longer available`
        );
        await fetchBookedSeats();
      }
    }
  };

  const handleManualSeatSelection = async () => {
    if (!manualSeatInput.trim()) {
      toast.error(
        language === 'am' 
          ? 'እባክዎ መቀመጫ ቁጥር ያስገቡ' 
          : 'Please enter seat number(s)'
      );
      return;
    }
    
    const seatNumbers = manualSeatInput
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n > 0 && n <= totalSeats);
    
    if (seatNumbers.length === 0) {
      toast.error(
        language === 'am' 
          ? 'እባክዎ ትክክለኛ መቀመጫ ቁጥሮች ያስገቡ' 
          : 'Please enter valid seat numbers'
      );
      return;
    }
    
    if (selectedSeats.length + seatNumbers.length > maxSeats) {
      toast.error(
        language === 'am' 
          ? `እስከ ${maxSeats} መቀመጫዎች ብቻ መምረጥ ይችላሉ` 
          : `You can only select up to ${maxSeats} seats`
      );
      return;
    }
    
    const takenSeats = seatNumbers.filter(n => bookedSeats.includes(n));
    if (takenSeats.length > 0) {
      toast.error(
        language === 'am' 
          ? `መቀመጫዎች ${takenSeats.join(', ')} ተይዘዋል` 
          : `Seats ${takenSeats.join(', ')} are taken`
      );
      return;
    }
    
    const success = await reserveSeatsInDB(seatNumbers);
    if (success) {
      setSelectedSeats([...selectedSeats, ...seatNumbers]);
      setReservedSeats([...reservedSeats, ...seatNumbers]);
      setManualSeatInput('');
      toast.success(
        language === 'am' 
          ? `${seatNumbers.length} መቀመጫዎች ተይዘዋል` 
          : `${seatNumbers.length} seats reserved`
      );
    }
  };

  const confirmSelection = async () => {
    if (selectedSeats.length === 0) {
      toast.error(
        language === 'am' 
          ? 'እባክዎ ቢያንስ አንድ መቀመጫ ይምረጡ' 
          : 'Please select at least one seat'
      );
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
    setLoading(true);
    await fetchBookedSeats();
    await fetchUserReservations();
    setLoading(false);
    toast.success(
      language === 'am' 
        ? 'መቀመጫዎች ታድሰዋል! ✅' 
        : 'Seats refreshed! ✅'
    );
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

  const currentPageSeatsList = getCurrentPageSeats();
  const displayRows = Math.ceil(currentPageSeatsList.length / 20);

  // Build seat rows
  const seatRows = [];
  for (let row = 0; row < displayRows; row++) {
    const startSeat = row * 20;
    const endSeat = Math.min(startSeat + 20, currentPageSeatsList.length);
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

  // Scroll to top when page changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  if (sessionLoading || loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <span className="ml-4 text-gray-600">
              {language === 'am' ? 'መቀመጫዎችን በመጫን ላይ...' : 'Loading seats...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <p className="text-red-600 mb-4">
            {language === 'am' ? 'እባክዎ ወደ ስርዓት ይግቡ' : 'Please login to select seats'}
          </p>
          <button 
            onClick={onCancel} 
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            {language === 'am' ? 'ተመለስ' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  const availableCount = Math.max(0, totalSeats - bookedSeats.length - selectedSeats.length);
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
              <h2 className="text-xl font-bold text-gray-800">
                {language === 'am' ? 'መቀመጫዎችን ይምረጡ' : 'Select Your Seats'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm">
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
                <span className="text-gray-600">
                  {language === 'am' ? 'ጠቅላላ መቀመጫዎች:' : 'Total Seats:'} {totalSeats.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={refreshSeats} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition"
              >
                🔄 Refresh
              </button>
              <button onClick={onClose || onCancel} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
          </div>
        </div>

        {/* Seat Grid */}
        <div className="flex-1 overflow-y-auto p-4" ref={containerRef}>
          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
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
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                ▶
              </button>
              <span className="text-xs text-gray-400 ml-2">
                {currentPage * seatsPerPage + 1} - {Math.min((currentPage + 1) * seatsPerPage, totalSeats)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const input = prompt(
                    language === 'am' 
                      ? `የመቀመጫ ቁጥሮችን በነጠላ ሰረዝ ይለያዩ (ከ1 እስከ ${totalSeats.toLocaleString()})` 
                      : `Enter seat numbers separated by commas (1 to ${totalSeats.toLocaleString()})`
                  );
                  if (input) {
                    setManualSeatInput(input);
                    handleManualSeatSelection();
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition"
              >
                🎯 {language === 'am' ? 'በቁጥር አስገባ' : 'Enter Numbers'}
              </button>
            </div>
          </div>

          {/* Row Navigation */}
          {displayRows > 10 && (
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

          {/* Seat Grid */}
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
              <p className="text-xs text-gray-400 text-center mt-2">
                ⏰ {language === 'am' ? 'የተመረጡት መቀመጫዎች ለ10 ደቂቃ ተይዘዋል' : 'Selected seats are reserved for 10 minutes'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
