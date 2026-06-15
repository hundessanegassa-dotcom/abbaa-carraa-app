// pages/cities/seat.js - LIGHT & ATTRACTIVE VERSION WITH 3 BUTTONS
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';
import TicketImage from '../../components/TicketImage';

export default function CitySeat() {
  const router = useRouter();
  const { city, type } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const [maxSeats] = useState(5);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [reservationTimer, setReservationTimer] = useState(null);
  const [manualSeatInput, setManualSeatInput] = useState('');
  const [showSeatSelector, setShowSeatSelector] = useState(true);
  const [language, setLanguage] = useState('am');

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  const vipPools = {
    daily: { 
      name: "Daily", 
      nameAm: "ዕለታዊ",
      entryFee: 500, 
      prize: 1000000, 
      totalSeats: 2400,
      explanation: "Pay 500 ETB, win 1,000,000 ETB",
      explanationAm: "500 ብር ከፍለው 1,000,000 ብር ያሸንፉ",
      badge: "⭐ Daily Draw"
    },
    weekly: { 
      name: "Weekly", 
      nameAm: "ሳምንታዊ",
      entryFee: 2500, 
      prize: 10000000, 
      totalSeats: 4800,
      explanation: "Pay 2,500 ETB, win 10,000,000 ETB",
      explanationAm: "2,500 ብር ከፍለው 10,000,000 ብር ያሸንፉ",
      badge: "⭐ Weekly Draw"
    },
    monthly: { 
      name: "Monthly", 
      nameAm: "ወርሃዊ",
      entryFee: 5000, 
      prize: 40000000, 
      totalSeats: 9600,
      explanation: "Pay 5,000 ETB, win 40,000,000 ETB",
      explanationAm: "5,000 ብር ከፍለው 40,000,000 ብር ያሸንፉ",
      badge: "⭐ Monthly Draw"
    }
  };

  useEffect(() => {
    return () => {
      if (reservationTimer) clearTimeout(reservationTimer);
      if (reservedSeats.length > 0 && user) {
        releaseSeats(reservedSeats);
      }
    };
  }, [reservedSeats, user]);

  useEffect(() => {
    if (city) {
      checkUser();
    }
  }, [city]);

  useEffect(() => {
    if (selectedType) {
      setPoolInfo(vipPools[selectedType]);
      const newUrl = `/cities/seat?city=${city}&type=${selectedType}`;
      router.replace(newUrl, undefined, { shallow: true });
    }
  }, [selectedType, city]);

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
  }, [user, poolInfo, city, selectedType]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const currentUrl = `/cities/seat?city=${city}&type=${selectedType}`;
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
      console.error('Error checking user:', error);
      router.push('/login');
    }
  };

  async function fetchBookedSeats() {
    try {
      const { data, error } = await supabase
        .from('city_vip_participants')
        .select('seat_numbers, payment_status')
        .eq('city', city)
        .eq('pool_type', selectedType)
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
      const poolId = `city_${city}_${selectedType}`;
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
    
    const poolId = `city_${city}_${selectedType}`;
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
    
    if (error) {
      console.error('Reserve error:', error);
      return false;
    }
    
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
    
    const poolId = `city_${city}_${selectedType}`;
    await supabase
      .from('vip_seat_reservations')
      .delete()
      .eq('user_id', user.id)
      .eq('pool_id', poolId)
      .in('seat_number', seatNumbers);
  }

  async function releaseUserReservations() {
    if (!user) return;
    
    const poolId = `city_${city}_${selectedType}`;
    await supabase
      .from('vip_seat_reservations')
      .delete()
      .eq('user_id', user.id)
      .eq('pool_id', poolId);
    
    setReservedSeats([]);
    setSelectedSeats([]);
  }

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) throw new Error('Please upload a valid image file');
    if (file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB');
    return true;
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
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
  };

  const handlePaymentSubmit = async () => {
    if (!selectedFile) { 
      toast.error('Please upload payment screenshot'); 
      return; 
    }
    
    setUploading(true);
    const loadingToast = toast.loading('Uploading payment screenshot...');
    
    try {
      validateFile(selectedFile);
      const compressedFile = await compressImage(selectedFile);
      
      const fileName = `${user.id}/${Date.now()}_city_${city}_${selectedType}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });
      
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);
      
      const { error: updateError } = await supabase
        .from('city_vip_participants')
        .update({
          payment_status: 'pending_verification',
          payment_proof_url: publicUrl,
          payment_submitted_at: new Date().toISOString()
        })
        .eq('id', participantId);
      
      if (updateError) throw new Error(`Update failed: ${updateError.message}`);
      
      await releaseUserReservations();
      
      const { data: updatedParticipant, error: fetchError } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('id', participantId)
        .single();
      
      if (fetchError) throw new Error(`Fetch failed: ${fetchError.message}`);
      
      setParticipantData(updatedParticipant);
      setShowPayment(false);
      setShowTicket(true);
      
      toast.success('Payment submitted! Your unverified ticket is ready', { id: loadingToast });
      
    } catch (error) {
      console.error('Payment submission error:', error);
      toast.error(error.message || 'Failed to submit payment. Please try again.', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const handleManualSeatAdd = async () => {
    const seatNum = parseInt(manualSeatInput);
    if (isNaN(seatNum)) {
      toast.error('Please enter a valid seat number');
      return;
    }
    if (seatNum < 1 || seatNum > poolInfo.totalSeats) {
      toast.error(`Seat number must be between 1 and ${poolInfo.totalSeats}`);
      return;
    }
    if (bookedSeats.includes(seatNum)) {
      toast.error(`Seat ${seatNum} is already taken. Please select another seat.`);
      return;
    }
    if (selectedSeats.includes(seatNum)) {
      toast.error(`Seat ${seatNum} is already selected`);
      return;
    }
    if (selectedSeats.length >= maxSeats) {
      toast.error(`You can only select up to ${maxSeats} seats`);
      return;
    }
    
    const success = await reserveSeatsInDB([seatNum]);
    if (success) {
      setSelectedSeats([...selectedSeats, seatNum]);
      setReservedSeats([...reservedSeats, seatNum]);
      toast.success(`Seat ${seatNum} reserved for 10 minutes`);
      await fetchBookedSeats();
      setManualSeatInput('');
    } else {
      toast.error(`Seat ${seatNum} is no longer available`);
      await fetchBookedSeats();
    }
  };

  const toggleSeat = async (seatNum) => {
    if (bookedSeats.includes(seatNum)) {
      toast.error(`Seat ${seatNum} is already taken.`);
      return;
    }

    const isSelected = selectedSeats.includes(seatNum);
    const isReservedByYou = reservedSeats.includes(seatNum);

    if (isSelected) {
      await releaseSeats([seatNum]);
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      setReservedSeats(reservedSeats.filter(s => s !== seatNum));
      toast.success(`Seat ${seatNum} released`);
    } else if (isReservedByYou) {
      setSelectedSeats([...selectedSeats, seatNum]);
      toast.success(`Seat ${seatNum} selected`);
    } else {
      if (selectedSeats.length >= maxSeats) {
        toast.error(`You can only select up to ${maxSeats} seats`);
        return;
      }
      
      const success = await reserveSeatsInDB([seatNum]);
      if (success) {
        setSelectedSeats([...selectedSeats, seatNum]);
        setReservedSeats([...reservedSeats, seatNum]);
        toast.success(`Seat ${seatNum} reserved for 10 minutes`);
        await fetchBookedSeats();
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
    
    setLoading(true);
    const checkingToast = toast.loading('Verifying seat availability...');
    
    try {
      await fetchBookedSeats();
      
      const stillAvailable = selectedSeats.every(seat => !bookedSeats.includes(seat));
      if (!stillAvailable) {
        const unavailableSeats = selectedSeats.filter(seat => bookedSeats.includes(seat));
        toast.error(`Seats ${unavailableSeats.join(', ')} are no longer available.`, { id: checkingToast });
        await fetchBookedSeats();
        setSelectedSeats([]);
        setLoading(false);
        return;
      }
      
      const ticketNumber = `CITY-${selectedType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const totalAmount = selectedSeats.length * poolInfo.entryFee;
      
      toast.loading('Reserving your seats...', { id: checkingToast });
      
      const { data: participant, error } = await supabase
        .from('city_vip_participants')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0],
          pool_type: selectedType,
          city: city,
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
      
      toast.success('Seats reserved! Please complete payment.', { id: checkingToast });
      
    } catch (error) { 
      console.error('Confirmation error:', error);
      toast.error('Failed to reserve seats: ' + error.message, { id: checkingToast });
    } finally { 
      setLoading(false); 
    }
  };

  const getSeatColor = (seatNum) => {
    if (bookedSeats.includes(seatNum)) {
      return 'bg-red-100 text-red-800 border-red-200 cursor-not-allowed opacity-70';
    }
    if (selectedSeats.includes(seatNum)) {
      return 'bg-emerald-600 text-white shadow-md transform scale-105';
    }
    if (reservedSeats.includes(seatNum)) {
      return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
    }
    return 'bg-white hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md border border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!poolInfo || !city) return null;

  const totalAmount = selectedSeats.length * poolInfo.entryFee;
  const totalSeatsCount = poolInfo.totalSeats;
  const seatNumbers = Array.from({ length: Math.min(totalSeatsCount, 500) }, (_, i) => i + 1);
  const availableCount = seatNumbers.filter(s => !bookedSeats.includes(s) && !selectedSeats.includes(s) && !reservedSeats.includes(s)).length;
  const takenCount = bookedSeats.length;
  const cityDisplayName = decodeURIComponent(city).replace(/-/g, ' ');

  return (
    <>
      <Head>
        <title>{cityDisplayName} VIP - Select Seats | Abbaa Carraa</title>
        <meta name="description" content={`Select your seats for ${cityDisplayName} VIP program. Win up to 40 Million ETB!`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 pb-32">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Back Button */}
          <button 
            onClick={() => router.back()} 
            className="mb-5 inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to {cityDisplayName} VIP
          </button>

          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                🏙️ {cityDisplayName} VIP Program
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Select Your Seat</h1>
              <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
                {language === 'am' 
                  ? `በ${cityDisplayName} እስከ 40 ሚሊዮን ብር ለማሸነፍ መቀመጫዎን ይምረጡ`
                  : `Choose your seat to win up to 40 Million ETB in ${cityDisplayName}`}
              </p>
            </div>
          </div>

          {/* Type Selection Buttons - 3 Simple Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => setSelectedType('daily')}
              className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                selectedType === 'daily'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-800">
                    {language === 'am' ? vipPools.daily.nameAm : vipPools.daily.name}
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    ETB {vipPools.daily.entryFee.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 max-w-[200px]">
                    {language === 'am' ? vipPools.daily.explanationAm : vipPools.daily.explanation}
                  </div>
                </div>
                {selectedType === 'daily' && (
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setSelectedType('weekly')}
              className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                selectedType === 'weekly'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-800">
                    {language === 'am' ? vipPools.weekly.nameAm : vipPools.weekly.name}
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    ETB {vipPools.weekly.entryFee.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 max-w-[200px]">
                    {language === 'am' ? vipPools.weekly.explanationAm : vipPools.weekly.explanation}
                  </div>
                </div>
                {selectedType === 'weekly' && (
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setSelectedType('monthly')}
              className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                selectedType === 'monthly'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-800">
                    {language === 'am' ? vipPools.monthly.nameAm : vipPools.monthly.name}
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    ETB {vipPools.monthly.entryFee.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 max-w-[200px]">
                    {language === 'am' ? vipPools.monthly.explanationAm : vipPools.monthly.explanation}
                  </div>
                </div>
                {selectedType === 'monthly' && (
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Selected Pool Info Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap justify-between items-center">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Selected Pool</span>
              <div className="font-bold text-gray-800">
                {language === 'am' ? vipPools[selectedType].nameAm : vipPools[selectedType].name}
              </div>
              <div className="text-sm text-gray-500">
                {language === 'am' ? vipPools[selectedType].explanationAm : vipPools[selectedType].explanation}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Prize Pool</div>
              <div className="font-bold text-xl text-emerald-600">
                ETB {vipPools[selectedType].prize.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Seat Selection Section */}
          {!showPayment && !showTicket && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Select Your Seats • Max {maxSeats} seats
              </h3>
              
              {/* Manual Seat Input */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">🎯 Or enter seat number manually:</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="number"
                    value={manualSeatInput}
                    onChange={(e) => setManualSeatInput(e.target.value)}
                    placeholder={`Enter seat number (1-${poolInfo.totalSeats.toLocaleString()})`}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <button
                    onClick={handleManualSeatAdd}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Add Seat
                  </button>
                </div>
              </div>
              
              {/* Seat Legend */}
              <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white border border-gray-300 rounded"></div>
                  <span className="text-xs text-gray-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-emerald-600 rounded"></div>
                  <span className="text-xs text-gray-600">Your Selection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-100 border border-red-200 rounded"></div>
                  <span className="text-xs text-gray-600">Taken</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-amber-100 border border-amber-200 rounded animate-pulse"></div>
                  <span className="text-xs text-gray-600">Reserved (10 min)</span>
                </div>
              </div>

              {/* Seat Statistics */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
                  <div className="text-2xl font-bold text-emerald-600">{availableCount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Available Seats</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
                  <div className="text-2xl font-bold text-amber-600">{selectedSeats.length}</div>
                  <div className="text-xs text-gray-500">Your Selected</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
                  <div className="text-2xl font-bold text-red-500">{takenCount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Taken</div>
                </div>
              </div>

              {/* Seat Grid */}
              <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-2 mb-6 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-xl border border-gray-200">
                {seatNumbers.map(seatNum => {
                  const isDisabled = bookedSeats.includes(seatNum);
                  const isSelected = selectedSeats.includes(seatNum);
                  const isReserved = reservedSeats.includes(seatNum);
                  const seatColor = getSeatColor(seatNum);
                  
                  return (
                    <button
                      key={seatNum}
                      onClick={() => toggleSeat(seatNum)}
                      disabled={isDisabled || (isReserved && !isSelected)}
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all duration-200 ${seatColor} ${isSelected ? 'ring-2 ring-emerald-300 ring-offset-2' : ''}`}
                      title={`Seat ${seatNum}${isDisabled ? ' - Taken' : isSelected ? ' - Selected by you' : isReserved ? ' - Reserved by you' : ' - Available'}`}
                    >
                      <span className="text-sm">{seatNum}</span>
                      <span className="text-[9px] mt-0.5">{isDisabled ? '🔒' : isSelected ? '✓' : isReserved ? '⏳' : '🟢'}</span>
                    </button>
                  );
                })}
              </div>
              
              {totalSeatsCount > 500 && (
                <p className="text-xs text-gray-400 text-center mb-4">
                  Showing first 500 of {totalSeatsCount.toLocaleString()} seats
                </p>
              )}
              
              {/* Selected Seats Summary */}
              {selectedSeats.length > 0 && (
                <div className="border-t border-gray-200 pt-5 mt-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                    <div>
                      <p className="text-sm text-gray-500">Selected Seats</p>
                      <p className="font-bold text-lg text-gray-800">{selectedSeats.sort((a,b)=>a-b).join(', ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-bold text-2xl text-emerald-600">ETB {totalAmount.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">({selectedSeats.length} seats × ETB {poolInfo.entryFee.toLocaleString()})</p>
                    </div>
                  </div>
                  <button 
                    onClick={confirmSeats} 
                    disabled={loading} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-semibold text-base transition-colors disabled:opacity-50 mb-4"
                  >
                    {loading ? 'Processing...' : `Confirm ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? 's' : ''} & Proceed to Payment`}
                  </button>
                  <p className="text-xs text-gray-400 text-center">⏰ Your selected seats are reserved for 10 minutes</p>
                </div>
              )}
            </div>
          )}

          {/* Payment Modal */}
          {showPayment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
                  <h2 className="text-xl font-bold">Complete Payment</h2>
                  <button onClick={() => { setShowPayment(false); setParticipantId(null); }} className="text-2xl text-gray-400 hover:text-gray-600">×</button>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center border border-gray-200">
                    <p className="text-sm text-gray-600">City: {cityDisplayName}</p>
                    <p className="text-sm text-gray-600">Pool: {vipPools[selectedType].name}</p>
                    <p className="text-sm text-gray-600">Seats: {selectedSeats.join(', ')}</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-2">ETB {totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                    <p className="font-semibold text-blue-800">📱 TeleBirr: 0913277922</p>
                    <p className="font-semibold text-blue-800 mt-2">🏦 CBE Bank: 1000601091686</p>
                    <p className="text-sm text-gray-600 mt-2">Account Name: Negassa Hundessa</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center mb-4 hover:border-emerald-400 transition-colors cursor-pointer">
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
                          <img src={previewUrl} className="max-h-32 mx-auto mb-2 rounded-lg" />
                          <p className="text-emerald-600 text-sm font-medium">✓ Payment screenshot selected</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 mt-2 text-sm">Click to upload payment screenshot</p>
                          <p className="text-xs text-gray-400 mt-1">JPEG, PNG (Max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  <button 
                    onClick={handlePaymentSubmit} 
                    disabled={uploading} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Processing...' : 'Submit Payment & Get Ticket'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Display */}
          {showTicket && participantData && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <TicketImage 
                participant={participantData}
                pool={poolInfo}
                isVerified={false}
                seatNumbers={selectedSeats}
                ticketNumber={participantData.ticket_number}
                amount={participantData.contribution_amount}
                createdAt={participantData.created_at}
                poolType="city"
              />
              <div className="text-center mt-6">
                <button onClick={() => router.push('/dashboard')} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-xl font-semibold transition-colors">
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
