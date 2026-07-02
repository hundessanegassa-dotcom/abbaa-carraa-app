// pages/merkato-seat.js - COMPLETE REDESIGNED LIKE CITY VIP (Theater Style Seats)
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';
import TicketImage from '../components/TicketImage';

export default function MerkatoSeat() {
  const router = useRouter();
  const { type } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState(type || 'daily');
  const [poolInfo, setPoolInfo] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [participantData, setParticipantData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [reservationTimer, setReservationTimer] = useState(null);
  const [manualSeatInput, setManualSeatInput] = useState('');
  const [showSeatSelector, setShowSeatSelector] = useState(true);
  const [language, setLanguage] = useState('am');
  const [currentRow, setCurrentRow] = useState(0);
  const seatGridRef = useRef(null);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  // VIP Pools with flexible configuration
  const vipPools = {
    daily: {
      name: "Daily Millionaire",
      nameAm: "ዕለታዊ",
      entryFee: 500,
      prize: 1000000,
      totalSeats: 2400,
      seatsPerRow: 20,
      rows: 120,
      explanation: "Pay 500 ETB, win 1,000,000 ETB",
      explanationAm: "500 ብር ከፍለው 1,000,000 ብር ያሸንፉ",
      color: "from-blue-600 to-blue-800",
      icon: "⭐",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
      textColor: "text-blue-600",
      drawDate: "Every Day at 8:00 PM"
    },
    weekly: {
      name: "Weekly Mega Winner",
      nameAm: "ሳምንታዊ",
      entryFee: 2500,
      prize: 10000000,
      totalSeats: 4800,
      seatsPerRow: 20,
      rows: 240,
      explanation: "Pay 2,500 ETB, win 10,000,000 ETB",
      explanationAm: "2,500 ብር ከፍለው 10,000,000 ብር ያሸንፉ",
      color: "from-green-600 to-green-800",
      icon: "🏆",
      buttonColor: "bg-green-500 hover:bg-green-600",
      textColor: "text-green-600",
      drawDate: "Every Sunday at 6:00 PM"
    },
    monthly: {
      name: "Monthly Legend",
      nameAm: "ወርሃዊ",
      entryFee: 5000,
      prize: 40000000,
      totalSeats: 9600,
      seatsPerRow: 20,
      rows: 480,
      explanation: "Pay 5,000 ETB, win 40,000,000 ETB",
      explanationAm: "5,000 ብር ከፍለው 40,000,000 ብር ያሸንፉ",
      color: "from-orange-600 to-orange-800",
      icon: "👑",
      buttonColor: "bg-orange-500 hover:bg-orange-600",
      textColor: "text-orange-600",
      drawDate: "Last Day of Month at 8:00 PM"
    }
  };

  useEffect(() => {
    return () => {
      if (reservationTimer) clearTimeout(reservationTimer);
      if (reservedSeats.length > 0 && user) releaseSeats(reservedSeats);
    };
  }, [reservedSeats, user]);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (selectedType) {
      setPoolInfo(vipPools[selectedType]);
      if (type !== selectedType) router.replace(`/merkato-seat?type=${selectedType}`, undefined, { shallow: true });
    }
  }, [selectedType]);

  useEffect(() => {
    if (user && poolInfo) {
      fetchBookedSeats();
      fetchUserReservations();
      const interval = setInterval(() => { fetchBookedSeats(); fetchUserReservations(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, poolInfo, selectedType]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const currentUrl = `/merkato-seat?type=${selectedType}`;
        localStorage.setItem('abbaa_redirect_after_login', currentUrl);
        sessionStorage.setItem('redirectAfterLogin', currentUrl);
        localStorage.setItem('pendingRole', 'individual');
        sessionStorage.setItem('pendingRole', 'individual');
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    } catch (error) {
      router.push('/login');
    }
  };

  async function fetchBookedSeats() {
    try {
      const { data, error } = await supabase
        .from('merkato_vip_participants')
        .select('seat_numbers, payment_status')
        .eq('pool_type', selectedType)
        .in('payment_status', ['verified', 'pending_verification']);
      
      if (error) throw error;
      const allBookedSeats = [];
      if (data) data.forEach(p => { if (p.seat_numbers) allBookedSeats.push(...p.seat_numbers); });
      setBookedSeats([...new Set(allBookedSeats)]);
    } catch (err) { console.error(err); }
  }

  async function fetchUserReservations() {
    if (!user) return;
    try {
      const poolId = `merkato_${selectedType}`;
      const { data, error } = await supabase
        .from('vip_seat_reservations')
        .select('seat_number, expires_at')
        .eq('user_id', user.id)
        .eq('pool_id', poolId)
        .gte('expires_at', new Date().toISOString());
      
      if (!error && data && data.length > 0) {
        setReservedSeats(data.map(r => r.seat_number));
        setSelectedSeats(data.map(r => r.seat_number));
      }
    } catch (err) { console.error(err); }
  }

  async function reserveSeatsInDB(seatNumbers) {
    if (!user) return false;
    const poolId = `merkato_${selectedType}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
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
    
    if (error) return false;
    
    if (reservationTimer) clearTimeout(reservationTimer);
    const timer = setTimeout(() => {
      releaseUserReservations();
      toast.warning('Your seat reservation has expired.');
      window.location.reload();
    }, 10 * 60 * 1000);
    setReservationTimer(timer);
    return true;
  }

  async function releaseSeats(seatNumbers) {
    if (!seatNumbers || seatNumbers.length === 0 || !user) return;
    const poolId = `merkato_${selectedType}`;
    await supabase
      .from('vip_seat_reservations')
      .delete()
      .eq('user_id', user.id)
      .eq('pool_id', poolId)
      .in('seat_number', seatNumbers);
  }

  async function releaseUserReservations() {
    if (!user) return;
    const poolId = `merkato_${selectedType}`;
    await supabase
      .from('vip_seat_reservations')
      .delete()
      .eq('user_id', user.id)
      .eq('pool_id', poolId);
    setReservedSeats([]);
    setSelectedSeats([]);
  }

  const refreshSeats = async () => {
    setIsRefreshing(true);
    try {
      await fetchBookedSeats();
      await fetchUserReservations();
      toast.success(language === 'am' ? 'መቀመጫዎች ታድሰዋል! ✅' : 'Seats refreshed! ✅');
    } catch (error) {
      toast.error(language === 'am' ? 'መቀመጫዎችን ማደስ አልተቻለም' : 'Failed to refresh seats');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleSeat = async (seatNum) => {
    if (bookedSeats.includes(seatNum)) {
      toast.error(language === 'am' ? `መቀመጫ ${seatNum} ተይዟል` : `Seat ${seatNum} taken`);
      return;
    }
    if (selectedSeats.includes(seatNum)) {
      await releaseSeats([seatNum]);
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      setReservedSeats(reservedSeats.filter(s => s !== seatNum));
      toast.success(language === 'am' ? `መቀመጫ ${seatNum} ተለቋል` : `Seat ${seatNum} released`);
    } else {
      if (selectedSeats.length >= 5) {
        toast.error(language === 'am' ? 'እስከ 5 መቀመጫዎች ብቻ መምረጥ ይችላሉ' : 'Max 5 seats');
        return;
      }
      const success = await reserveSeatsInDB([seatNum]);
      if (success) {
        setSelectedSeats([...selectedSeats, seatNum]);
        setReservedSeats([...reservedSeats, seatNum]);
        toast.success(language === 'am' ? `መቀመጫ ${seatNum} ለ10 ደቂቃ ተይዟል` : `Seat ${seatNum} reserved for 10 min`);
        await fetchBookedSeats();
      } else {
        toast.error(language === 'am' ? `መቀመጫ ${seatNum} አይገኝም` : `Seat ${seatNum} unavailable`);
        await fetchBookedSeats();
      }
    }
  };

  const confirmSeats = async () => {
    if (selectedSeats.length === 0) {
      toast.error(language === 'am' ? 'እባክዎ ቢያንስ አንድ መቀመጫ ይምረጡ' : 'Select at least one seat');
      return;
    }
    setLoading(true);
    try {
      await fetchBookedSeats();
      const stillAvailable = selectedSeats.every(seat => !bookedSeats.includes(seat));
      if (!stillAvailable) {
        toast.error(language === 'am' ? 'አንዳንድ መቀመጫዎች አይገኙም' : 'Some seats no longer available');
        setSelectedSeats([]);
        setLoading(false);
        return;
      }
      
      const ticketNumber = `MK-${selectedType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const totalAmount = selectedSeats.length * poolInfo.entryFee;
      
      const { data: participant, error } = await supabase
        .from('merkato_vip_participants')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0],
          pool_type: selectedType,
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
      setShowSeatSelector(false);
      setShowPayment(true);
      toast.success(language === 'am' ? 'መቀመጫዎች ተይዘዋል! እባክዎ ክፍያ ይፈጽሙ' : 'Seats reserved! Complete payment.');
    } catch (error) {
      toast.error(language === 'am' ? 'መቀመጫዎችን ማስያዝ አልተቻለም' : 'Failed to reserve seats');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedFile) {
      toast.error(language === 'am' ? 'እባክዎ የክፍያ ማስረጃ ይስቀሉ' : 'Upload payment screenshot');
      return;
    }
    setUploading(true);
    try {
      const compressedFile = await compressImage(selectedFile);
      const fileName = `${user.id}/${Date.now()}_merkato_${selectedType}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, compressedFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);
      
      await supabase
        .from('merkato_vip_participants')
        .update({
          payment_status: 'pending_verification',
          payment_proof_url: publicUrl,
          payment_submitted_at: new Date().toISOString()
        })
        .eq('id', participantId);
      
      await releaseUserReservations();
      
      const { data: updatedParticipant } = await supabase
        .from('merkato_vip_participants')
        .select('*')
        .eq('id', participantId)
        .single();
      
      setParticipantData(updatedParticipant);
      setShowPayment(false);
      setShowTicket(true);
      toast.success(language === 'am' ? 'ክፍያ ተልኳል! ቲኬትዎ ዝግጁ ነው' : 'Payment submitted! Ticket ready');
    } catch (error) {
      toast.error(language === 'am' ? 'ክፍያ መላክ አልተቻለም' : 'Payment failed');
    } finally {
      setUploading(false);
    }
  };

  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const maxSize = 1024;
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.7);
      };
    };
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>;
  }

  if (!poolInfo) return null;

  const totalAmount = selectedSeats.length * poolInfo.entryFee;
  const totalSeatsCount = poolInfo.totalSeats;
  const seatsPerRow = poolInfo.seatsPerRow || 20;
  const rows = Math.ceil(totalSeatsCount / seatsPerRow);
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Build seat rows for theater display
  const seatRows = [];
  for (let row = 0; row < rows; row++) {
    const startSeat = row * seatsPerRow + 1;
    const endSeat = Math.min(startSeat + seatsPerRow - 1, totalSeatsCount);
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

  const scrollToRow = (rowIndex) => {
    setCurrentRow(rowIndex);
    if (seatGridRef.current) {
      const rowElement = document.getElementById(`row-${rowIndex}`);
      if (rowElement) rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <>
      <Head>
        <title>Merkato VIP - Select Your Seat | Abbaa Carraa</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-6 pb-32">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Language Toggle */}
          <div className="flex justify-end mb-4">
            <button onClick={toggleLanguage} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-300 transition">
              {language === 'am' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}
            </button>
          </div>

          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-2xl p-6 mb-6 text-center text-white shadow-xl">
            <div className="text-6xl mb-3">🏪</div>
            <h1 className="text-3xl font-bold">Merkato VIP</h1>
            <p className="text-xl font-bold mt-2 animate-pulse">
              {language === 'am'
                ? '✨ ዛሬ የመርካቶ ተሳታፊ ሚሊየነር እናድርገው! ✨'
                : '✨ Let\'s make a Merkato participant a millionaire today! ✨'}
            </p>
            <p className="text-sm opacity-90 mt-1">
              {language === 'am' ? 'እስከ 40 ሚሊዮን ብር ለማሸነፍ መቀመጫዎን ይምረጡ' : 'Select your seat to win up to 40 Million ETB'}
            </p>
          </div>

          {/* 3 Type Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {Object.entries(vipPools).map(([key, pool]) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`p-5 rounded-2xl border-2 text-left transition-all transform hover:scale-105 ${
                  selectedType === key
                    ? `${pool.buttonColor} text-white shadow-lg border-transparent`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-1">{pool.icon}</div>
                <div className="text-lg font-bold">{language === 'am' ? pool.nameAm : pool.name}</div>
                <div className={`text-2xl font-bold ${selectedType === key ? 'text-white' : pool.textColor}`}>
                  ETB {pool.entryFee.toLocaleString()}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {language === 'am' ? pool.explanationAm : pool.explanation}
                </div>
              </button>
            ))}
          </div>

          {/* Pool Info */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex justify-between items-center border border-gray-200">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                {language === 'am' ? 'የተመረጠ ፑል' : 'Selected Pool'}
              </div>
              <div className="font-bold text-lg">
                {language === 'am' ? poolInfo.nameAm : poolInfo.name}
              </div>
              <div className="text-sm text-gray-600">
                {language === 'am' ? poolInfo.explanationAm : poolInfo.explanation}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                📅 {poolInfo.drawDate}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                {language === 'am' ? 'ጠቅላላ መቀመጫዎች' : 'Total Seats'}
              </div>
              <div className="font-bold text-2xl text-gray-800">
                {totalSeatsCount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Seat Selection */}
          {!showPayment && !showTicket && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <h3 className="text-xl font-bold">
                  {language === 'am' ? 'መቀመጫዎችን ይምረጡ (ከፍተኛ 5)' : 'Select Your Seats (Max 5)'}
                </h3>
                <button
                  onClick={refreshSeats}
                  disabled={isRefreshing}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isRefreshing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Refreshing...
                    </>
                  ) : (
                    '🔄 Refresh Seats'
                  )}
                </button>
              </div>

              {/* Row Navigation */}
              <div className="flex overflow-x-auto gap-1 mb-4 pb-2">
                {Array.from({ length: Math.min(rows, 20) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToRow(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                      currentRow === idx
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {language === 'am' ? `ረድፍ ${idx + 1}` : `Row ${rowLetters[idx] || (idx + 1)}`}
                  </button>
                ))}
                {rows > 20 && (
                  <span className="px-3 py-1.5 text-xs text-gray-400">
                    +{rows - 20} more
                  </span>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-4 pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white border border-gray-300 rounded"></div>
                  <span className="text-xs">{language === 'am' ? 'ክፍት' : 'Available'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-emerald-600 rounded"></div>
                  <span className="text-xs">{language === 'am' ? 'የእርስዎ' : 'Your Seats'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-400 rounded"></div>
                  <span className="text-xs">{language === 'am' ? 'የተያዙ' : 'Taken'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-yellow-400 rounded animate-pulse"></div>
                  <span className="text-xs">{language === 'am' ? 'ተይዘዋል (10 ደቂቃ)' : 'Reserved (10 min)'}</span>
                </div>
              </div>

              {/* Screen */}
              <div className="text-center mb-4">
                <div className="inline-block bg-gray-700 text-white text-[10px] px-6 py-1 rounded-full uppercase tracking-wider">
                  🎬 SCREEN
                </div>
                <div className="w-full h-px bg-gray-300 mt-2"></div>
              </div>

              {/* Seat Grid - Theater Style */}
              <div ref={seatGridRef} className="space-y-1.5 max-h-[50vh] overflow-y-auto p-2">
                {seatRows.map((rowSeats, rowIndex) => (
                  <div key={rowIndex} id={`row-${rowIndex}`} className="flex flex-wrap items-center gap-1">
                    <div className="w-10 text-[10px] font-mono font-semibold text-gray-400 text-right">
                      {rowLetters[rowIndex] || (rowIndex + 1)}
                    </div>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {rowSeats.map(seatNum => {
                        const isTaken = bookedSeats.includes(seatNum);
                        const isSelected = selectedSeats.includes(seatNum);
                        const isReserved = reservedSeats.includes(seatNum);
                        let bgColor = 'bg-white border border-gray-300 hover:bg-gray-100 cursor-pointer';
                        let textColor = 'text-gray-700';
                        let size = 'w-8 h-8 text-[10px]';
                        
                        if (isSelected) {
                          bgColor = 'bg-emerald-600 border-emerald-700';
                          textColor = 'text-white';
                          size = 'w-8 h-8 text-[10px] ring-2 ring-emerald-300 ring-offset-1';
                        }
                        if (isTaken) {
                          bgColor = 'bg-red-400 border-red-500';
                          textColor = 'text-white opacity-60';
                          size = 'w-8 h-8 text-[10px] cursor-not-allowed';
                        }
                        if (isReserved && !isSelected) {
                          bgColor = 'bg-yellow-400 border-yellow-500 animate-pulse';
                          textColor = 'text-gray-700';
                        }

                        return (
                          <button
                            key={seatNum}
                            onClick={() => !isTaken && toggleSeat(seatNum)}
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

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t">
                <div className="bg-gray-50 rounded-lg p-2 text-center border">
                  <p className="text-xl font-bold text-emerald-600">{availableCount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">{language === 'am' ? 'ክፍት' : 'Available'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center border">
                  <p className="text-xl font-bold text-amber-600">{selectedSeats.length}</p>
                  <p className="text-[10px] text-gray-500">{language === 'am' ? 'የእርስዎ' : 'Your Seats'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center border">
                  <p className="text-xl font-bold text-red-500">{takenCount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">{language === 'am' ? 'የተያዙ' : 'Taken'}</p>
                </div>
              </div>

              {/* Selected Seats Footer */}
              {selectedSeats.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-lg z-50">
                  <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <p className="text-sm text-gray-500">
                          {language === 'am' ? 'የተመረጡ መቀመጫዎች' : 'Selected Seats'}
                        </p>
                        <p className="font-bold text-lg">
                          {selectedSeats.sort((a, b) => a - b).join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {language === 'am' ? 'ጠቅላላ ክፍያ' : 'Total Amount'}
                        </p>
                        <p className="font-bold text-2xl text-emerald-600">
                          ETB {totalAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          ({selectedSeats.length} {language === 'am' ? 'መቀመጫ ×' : 'seats ×'} ETB {poolInfo.entryFee.toLocaleString()})
                        </p>
                      </div>
                      <button
                        onClick={confirmSeats}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold text-base transition disabled:opacity-50"
                      >
                        {loading
                          ? (language === 'am' ? 'በሂደት ላይ...' : 'Processing...')
                          : (language === 'am' ? 'አረጋግጥ እና ወደ ክፍያ ቀጥል' : 'Confirm & Proceed to Payment')}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-2">
                      ⏰ {language === 'am' ? 'የተመረጡት መቀመጫዎች ለ10 ደቂቃ ተይዘዋል' : 'Your selected seats are reserved for 10 minutes'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Modal */}
          {showPayment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-5 flex justify-between">
                  <h2 className="text-xl font-bold">
                    {language === 'am' ? 'ክፍያ ያጠናቅቁ' : 'Complete Payment'}
                  </h2>
                  <button onClick={() => { setShowPayment(false); setParticipantId(null); }} className="text-2xl">×</button>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                    <p>{language === 'am' ? 'መቀመጫዎች:' : 'Seats:'} {selectedSeats.join(', ')}</p>
                    <p className="text-2xl font-bold text-emerald-600">ETB {totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <p className="font-semibold">📱 TeleBirr: 0913277922</p>
                    <p className="font-semibold mt-2">🏦 CBE Bank: 1000601091686</p>
                    <p className="text-sm">{language === 'am' ? 'የሂሳብ ባለቤት:' : 'Account:'} Negassa Hundessa</p>
                  </div>
                  <div className="border-2 border-dashed rounded-xl p-4 text-center mb-4">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="paymentFile"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setSelectedFile(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <label htmlFor="paymentFile" className="cursor-pointer block">
                      {previewUrl ? (
                        <div>
                          <img src={previewUrl} className="max-h-32 mx-auto mb-2 rounded" />
                          <p className="text-emerald-600">✓ {language === 'am' ? 'ማስረጃ ተመርጧል' : 'Screenshot selected'}</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 mt-2">
                            {language === 'am' ? 'የክፍያ ማስረጃ ለመጫን ጠቅ ያድርጉ' : 'Upload payment screenshot'}
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  <button
                    onClick={handlePaymentSubmit}
                    disabled={uploading}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold"
                  >
                    {uploading
                      ? (language === 'am' ? 'በሂደት ላይ...' : 'Processing...')
                      : (language === 'am' ? 'ክፍያ አስገባ እና ቲኬት አግኝ' : 'Submit Payment & Get Ticket')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Display - SINGLE TICKET ONLY */}
          {showTicket && participantData && (
            <div className="bg-white rounded-2xl shadow-xl border p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-4">
                🎫 {language === 'am' ? 'የእርስዎ ቲኬት' : 'Your Ticket'}
              </h2>
              <TicketImage
                participant={participantData}
                pool={{
                  prize_amount: poolInfo.prize,
                  target_amount: poolInfo.prize,
                  prize_name: poolInfo.name,
                  drawDate: poolInfo.drawDate,
                  name: 'Merkato VIP'
                }}
                isVerified={false}
                seatNumbers={selectedSeats}
                ticketNumber={participantData.ticket_number}
                amount={participantData.contribution_amount}
                createdAt={participantData.created_at}
                poolType="merkato"
              />
              <div className="text-center mt-4">
                <p className="text-sm text-yellow-600">
                  ⏳ {language === 'am' ? 'ይህ ያልተረጋገጠ ቲኬት ነው. ክፍያዎ ከተረጋገጠ በኋላ መቀመጫዎችዎ ይረጋገጣሉ.' : 'This is an UNVERIFIED ticket. Your seats will be confirmed after payment verification.'}
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  {language === 'am' ? 'ወደ ዳሽቦርድ ሂድ' : 'Go to Dashboard'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
