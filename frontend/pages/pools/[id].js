// pages/pools/[id].js - FULLY CORRECTED (ALL SEATS VISIBLE) + 3D BANNER UPLOAD
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import TicketImage from '../../components/TicketImage';
import ThreeDBannerUpload from '../../components/ThreeDBannerUpload';

// Optimized file upload utilities
const validateFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024;
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPEG, PNG, WEBP)');
  }
  
  if (file.size > MAX_SIZE) {
    throw new Error('File size must be less than 5MB');
  }
  
  return true;
};

const compressImage = async (file) => {
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

export default function PoolDetails() {
  const router = useRouter();
  const { id } = router.query;
  const isMounted = useRef(true);
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [participantId, setParticipantId] = useState(null);
  const [participantData, setParticipantData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [reservationTimer, setReservationTimer] = useState(null);
  const [availableSeatsCount, setAvailableSeatsCount] = useState(0);
  const [manualSeatInput, setManualSeatInput] = useState('');
  const [seatsInitialized, setSeatsInitialized] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [language, setLanguage] = useState('am');

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  // Pool calculations
  const winnerPrize = pool?.target_amount || 0;
  const entryFee = pool?.entry_fee || pool?.ticket_price || 10;
  const totalCollection = winnerPrize * 1.2;
  const totalSeats = Math.max(10, Math.floor(totalCollection / entryFee) || 10);
  const currentAmount = pool?.current_amount || 0;
  const progress = (currentAmount / totalCollection) * 100;
  const maxSeatsPerUser = Math.min(5, Math.floor((totalSeats - bookedSeats.length) / 2) || 5);

  // Load saved banner
  useEffect(() => {
    if (id) {
      const savedBanner = localStorage.getItem(`pool_banner_${id}`);
      if (savedBanner) {
        setBannerUrl(savedBanner);
      }
    }
  }, [id]);

  // Generate seats if they don't exist
  const generateSeatsIfNeeded = async () => {
    if (!pool || seatsInitialized || !id) return;
    
    try {
      const { count, error: countError } = await supabase
        .from('pool_seats')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', id);
      
      if (countError) throw countError;
      
      if (count === 0 && totalSeats > 0) {
        console.log(`Generating ${totalSeats} seats for pool ${id}`);
        const seatsToInsert = [];
        for (let i = 1; i <= totalSeats; i++) {
          seatsToInsert.push({
            pool_id: id,
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
        return true;
      }
      setSeatsInitialized(true);
      return true;
    } catch (err) {
      console.error('Error generating seats:', err);
      return false;
    }
  };

  const refreshSeats = async () => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      await generateSeatsIfNeeded();
      await fetchBookedSeats();
      await fetchUserReservations();
      toast.success(language === 'am' ? 'መቀመጫዎች ታድሰዋል! ✅' : 'Seats refreshed! ✅');
    } catch (error) {
      toast.error(language === 'am' ? 'መቀመጫዎችን ማደስ አልተቻለም' : 'Failed to refresh seats');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBannerUpload = (url) => {
    setBannerUrl(url);
    if (id) {
      localStorage.setItem(`pool_banner_${id}`, url);
    }
  };

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (reservationTimer) clearTimeout(reservationTimer);
      if (reservedSeats.length > 0 && user) {
        releaseSeats(reservedSeats);
      }
    };
  }, [reservedSeats, user]);

  useEffect(() => {
    if (id) {
      fetchPool();
      getCurrentUser();
    }
  }, [id]);

  useEffect(() => {
    if (user && pool && id) {
      const initSeats = async () => {
        await generateSeatsIfNeeded();
        await fetchBookedSeats();
        await fetchUserReservations();
      };
      initSeats();
      
      const interval = setInterval(() => {
        fetchBookedSeats();
        fetchUserReservations();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, pool, id]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (isMounted.current) setUser(user);
  }

  async function fetchPool() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Pool fetch error:', error);
        toast.error('Could not load pool details. Please try again.');
        setTimeout(() => router.push('/listings'), 2000);
        return;
      }
      
      if (isMounted.current) setPool(data);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred.');
      setTimeout(() => router.push('/listings'), 2000);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBookedSeats() {
    try {
      const { data, error } = await supabase
        .from('pool_seats')
        .select('seat_number, status, reserved_by')
        .eq('pool_id', id);
      
      if (error) throw error;
      
      const takenSeats = (data || [])
        .filter(seat => seat.status === 'taken')
        .map(seat => seat.seat_number);
      
      const reservedByOthers = (data || [])
        .filter(seat => seat.status === 'reserved' && seat.reserved_by !== user?.id)
        .map(seat => seat.seat_number);
      
      const reservedByMe = (data || [])
        .filter(seat => seat.status === 'reserved' && seat.reserved_by === user?.id)
        .map(seat => seat.seat_number);
      
      const allUnavailable = [...new Set([...takenSeats, ...reservedByOthers])];
      setBookedSeats(allUnavailable);
      setReservedSeats(reservedByMe);
      
      if (reservedByMe.length > 0 && selectedSeats.length === 0) {
        setSelectedSeats(reservedByMe);
      }
      
      const availableCount = Math.max(0, totalSeats - allUnavailable.length);
      setAvailableSeatsCount(availableCount);
      
    } catch (err) {
      console.error('Error fetching booked seats:', err);
    }
  }

  async function fetchUserReservations() {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('pool_seats')
        .select('seat_number, reserved_until')
        .eq('pool_id', id)
        .eq('reserved_by', user.id)
        .eq('status', 'reserved')
        .gte('reserved_until', new Date().toISOString());
      
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
    
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    for (const seatNumber of seatNumbers) {
      const { error } = await supabase
        .from('pool_seats')
        .upsert({
          pool_id: id,
          seat_number: seatNumber,
          user_id: user.id,
          reserved_by: user.id,
          status: 'reserved',
          reserved_until: expiryTime,
          reserved_at: new Date().toISOString()
        }, { onConflict: 'pool_id, seat_number' });
      
      if (error) {
        console.error('Reserve error:', error);
        return false;
      }
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
    
    await supabase
      .from('pool_seats')
      .update({
        status: 'available',
        user_id: null,
        reserved_by: null,
        reserved_at: null,
        reserved_until: null
      })
      .in('seat_number', seatNumbers)
      .eq('pool_id', id)
      .eq('reserved_by', user.id);
  }

  async function releaseUserReservations() {
    if (!user) return;
    
    await supabase
      .from('pool_seats')
      .update({
        status: 'available',
        user_id: null,
        reserved_by: null,
        reserved_at: null,
        reserved_until: null
      })
      .eq('pool_id', id)
      .eq('reserved_by', user.id)
      .eq('status', 'reserved');
    
    setReservedSeats([]);
    setSelectedSeats([]);
    await fetchBookedSeats();
  }

  const handleJoinNow = () => {
    if (!user) {
      const redirectUrl = `/pools/${id}`;
      localStorage.setItem('abbaa_redirect_after_login', redirectUrl);
      localStorage.setItem('pendingRole', 'individual');
      sessionStorage.setItem('redirectAfterLogin', redirectUrl);
      sessionStorage.setItem('pendingRole', 'individual');
      
      toast.loading('Please login to join this pool...');
      router.push('/login');
      return;
    }
    setShowSeatSelector(true);
  };

  const handleManualSeatAdd = async () => {
    const seatNum = parseInt(manualSeatInput);
    if (isNaN(seatNum)) {
      toast.error('Please enter a valid seat number');
      return;
    }
    if (seatNum < 1 || seatNum > totalSeats) {
      toast.error(`Seat number must be between 1 and ${totalSeats.toLocaleString()}`);
      return;
    }
    if (bookedSeats.includes(seatNum)) {
      toast.error(`Seat ${seatNum} is already taken. Please select another seat.`);
      setManualSeatInput('');
      return;
    }
    if (selectedSeats.includes(seatNum)) {
      toast.error(`Seat ${seatNum} is already selected`);
      setManualSeatInput('');
      return;
    }
    if (selectedSeats.length >= maxSeatsPerUser) {
      toast.error(`You can only select up to ${maxSeatsPerUser} seats`);
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
      await fetchBookedSeats();
    } else if (isReservedByYou) {
      setSelectedSeats([...selectedSeats, seatNum]);
      toast.success(`Seat ${seatNum} selected`);
    } else {
      if (selectedSeats.length >= maxSeatsPerUser) {
        toast.error(`You can only select up to ${maxSeatsPerUser} seats`);
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
        setReservedSeats([]);
        setLoading(false);
        return;
      }
      
      const ticketNumber = `POOL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const totalAmount = selectedSeats.length * entryFee;
      
      toast.loading('Reserving your seats...', { id: checkingToast });
      
      const { data: participant, error } = await supabase
        .from('regular_pool_participants')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0],
          pool_id: pool.id,
          pool_name: pool.prize_name,
          seat_numbers: selectedSeats,
          contribution_amount: totalAmount,
          prize_amount: pool.target_amount,
          payment_status: 'pending',
          ticket_number: ticketNumber,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await supabase
        .from('pool_seats')
        .update({ 
          status: 'taken', 
          user_id: user.id,
          reserved_by: null,
          reserved_until: null
        })
        .in('seat_number', selectedSeats)
        .eq('pool_id', pool.id)
        .eq('reserved_by', user.id);
      
      setParticipantId(participant.id);
      setShowSeatSelector(false);
      setShowPayment(true);
      
      toast.success('Seats reserved! Please complete payment.', { id: checkingToast });
      
    } catch (error) { 
      console.error('Confirmation error:', error);
      toast.error('Failed to reserve seats: ' + error.message, { id: checkingToast });
      await releaseSeats(selectedSeats);
      setSelectedSeats([]);
      setReservedSeats([]);
      await fetchBookedSeats();
    } finally { 
      setLoading(false); 
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedFile) { 
      toast.error('Please upload payment screenshot'); 
      return; 
    }
    
    setIsSubmitting(true);
    const loadingToast = toast.loading('Uploading payment screenshot...');
    
    try {
      validateFile(selectedFile);
      const compressedFile = await compressImage(selectedFile);
      
      const fileName = `${user.id}/${Date.now()}_regular_${pool.id}.jpg`;
      
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
        .from('regular_pool_participants')
        .update({
          payment_status: 'pending_verification',
          payment_proof_url: publicUrl,
          payment_submitted_at: new Date().toISOString()
        })
        .eq('id', participantId);
      
      if (updateError) throw new Error(`Update failed: ${updateError.message}`);
      
      const { data: updatedParticipant, error: fetchError } = await supabase
        .from('regular_pool_participants')
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
      setIsSubmitting(false);
    }
  };

  const handleCancelSeatSelection = async () => {
    if (selectedSeats.length > 0) {
      await releaseSeats(selectedSeats);
      setSelectedSeats([]);
      setReservedSeats([]);
    }
    setShowSeatSelector(false);
  };

  const handleCancelPayment = async () => {
    if (selectedSeats.length > 0) {
      await releaseSeats(selectedSeats);
      toast.info(`Seats ${selectedSeats.join(', ')} released`);
    }
    setShowPayment(false);
    setShowSeatSelector(true);
  };

  const getSeatColor = (seatNum) => {
    if (bookedSeats.includes(seatNum)) {
      return 'bg-red-400 cursor-not-allowed opacity-70';
    }
    if (selectedSeats.includes(seatNum)) {
      return 'bg-green-600 text-white shadow-lg transform scale-105';
    }
    if (reservedSeats.includes(seatNum)) {
      return 'bg-yellow-400 animate-pulse';
    }
    return 'bg-gray-200 hover:bg-gray-300 cursor-pointer transition-all hover:transform hover:scale-105';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  }

  if (!pool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Pool not found</h1>
          <p className="text-gray-500 mt-2">The pool you're looking for may have been removed.</p>
          <Link href="/listings" className="text-green-600 hover:underline mt-4 inline-block">Back to listings</Link>
        </div>
      </div>
    );
  }

  // FIXED: Show ALL seats (not limited to 500)
  const seatNumbers = Array.from({ length: totalSeats }, (_, i) => i + 1);
  const takenCount = bookedSeats.length;
  const availableCount = totalSeats - takenCount;
  const totalAmount = selectedSeats.length * entryFee;

  const renderSeatSelector = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto pb-24">
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Select Your Seats</h2>
              <p className="text-sm text-gray-500">{pool.prize_name} • Max {maxSeatsPerUser} seats • Total {totalSeats.toLocaleString()} seats</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={refreshSeats} 
                disabled={isRefreshing}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1"
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  '🔄 Refresh Seats'
                )}
              </button>
              <button onClick={handleCancelSeatSelection} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
          </div>
          
          <div className="p-6">
            {/* Manual Seat Input */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-700 mb-2">🎯 Or enter seat number manually:</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={manualSeatInput}
                  onChange={(e) => setManualSeatInput(e.target.value)}
                  placeholder={`Enter seat number (1-${totalSeats.toLocaleString()})`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleManualSeatAdd}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700"
                >
                  Add Seat
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 mb-4 pb-3 border-b">
              <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-200 border border-gray-300 rounded"></div><span>Available</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 bg-green-600 rounded"></div><span>Your Selection</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 bg-red-400 rounded"></div><span>Taken/Booked</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 bg-yellow-400 rounded animate-pulse"></div><span>Reserved for You (10 min)</span></div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-green-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-green-600">{availableCount.toLocaleString()}</p><p className="text-xs text-gray-500">Available Seats</p></div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-yellow-600">{selectedSeats.length}</p><p className="text-xs text-gray-500">Your Selected</p></div>
              <div className="bg-red-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-red-600">{takenCount.toLocaleString()}</p><p className="text-xs text-gray-500">Booked/Taken</p></div>
            </div>

            <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-2 mb-6 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-xl">
              {seatNumbers.map(seatNum => {
                const isDisabled = bookedSeats.includes(seatNum);
                const seatColor = getSeatColor(seatNum);
                const isSelected = selectedSeats.includes(seatNum);
                const isReserved = reservedSeats.includes(seatNum);
                
                return (
                  <button
                    key={seatNum}
                    onClick={() => toggleSeat(seatNum)}
                    disabled={isDisabled || (isReserved && !isSelected)}
                    className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-all duration-200 ${seatColor} ${isSelected ? 'ring-2 ring-green-300 ring-offset-2' : ''}`}
                    title={`Seat ${seatNum}${isDisabled ? ' - Taken' : isSelected ? ' - Selected by you' : isReserved ? ' - Reserved by you' : ' - Available'}`}
                  >
                    <span className="text-sm">{seatNum}</span>
                    <span className="text-[8px] mt-0.5">{isDisabled ? '🔒' : isSelected ? '✓' : isReserved ? '⏳' : '🟢'}</span>
                  </button>
                );
              })}
            </div>
            
            {totalSeats > 500 && (
              <p className="text-xs text-gray-400 text-center mb-4">Showing all {totalSeats.toLocaleString()} seats (scroll to see more)</p>
            )}
            
            {selectedSeats.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                  <div><p className="text-sm text-gray-500">Selected Seats</p><p className="font-bold text-lg">{selectedSeats.sort((a,b)=>a-b).join(', ')}</p></div>
                  <div className="text-right"><p className="text-sm text-gray-500">Total Amount</p><p className="font-bold text-2xl text-green-600">ETB {totalAmount.toLocaleString()}</p><p className="text-xs text-gray-400">({selectedSeats.length} seats × ETB {entryFee.toLocaleString()})</p></div>
                </div>
                <button onClick={confirmSeats} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 mb-16">
                  {loading ? 'Processing...' : `Confirm ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? 's' : ''} & Proceed to Payment`}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">⏰ Your selected seats are reserved for 10 minutes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPayment = () => {
    const totalAmount = selectedSeats.length * entryFee;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
            <h2 className="text-xl font-bold">Complete Payment</h2>
            <button onClick={handleCancelPayment} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-gray-600">Pool: {pool.prize_name}</p>
              <p className="text-sm text-gray-600">Seats: {selectedSeats.join(', ')}</p>
              <p className="text-xl font-bold text-green-600 mt-2">ETB {totalAmount.toLocaleString()}</p>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">Please send payment to:</p>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="font-semibold">📱 TeleBirr: 0913277922</p>
              <p className="font-semibold mt-2">🏦 CBE Bank: 1000601091686</p>
              <p className="text-sm text-gray-600 mt-2">Account Name: Negassa Hundessa</p>
            </div>
            
            <div className="border-2 border-dashed rounded-lg p-4 text-center mb-4 hover:border-green-500 transition">
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
                    <p className="text-green-600 text-sm">✓ Payment screenshot selected</p>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 mt-2">Click to upload payment screenshot</p>
                    <p className="text-xs text-gray-400">JPEG, PNG (Max 5MB) - Auto-compressed</p>
                  </div>
                )}
              </label>
            </div>
            
            <button 
              onClick={handlePaymentSubmit} 
              disabled={isSubmitting || !selectedFile} 
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Submit Payment & Get Ticket'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head><title>{pool.prize_name} - Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gray-50 py-8 pb-32">
        <div className="container mx-auto px-4 max-w-7xl">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-800 mb-4 inline-flex items-center gap-1">← Back to listings</button>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="w-full h-64 md:h-80 bg-gray-200 relative">
              {pool.image_url ? (
                <img src={pool.image_url} alt={pool.prize_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <span className="text-6xl">🎁</span>
                </div>
              )}
              {pool.status === 'active' && <span className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">🔴 Active</span>}
              {pool.is_featured && <span className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">⭐ Featured</span>}
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{pool.prize_name}</h1>
                  <p className="text-gray-500 mt-1">{pool.description || 'Join this amazing pool for a chance to win big!'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-gray-500 text-xs">🏆 Winner Gets</p><p className="text-lg font-bold text-green-600">ETB {winnerPrize.toLocaleString()}</p></div>
                <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-gray-500 text-xs">🎫 Entry Fee</p><p className="text-lg font-bold text-blue-600">ETB {entryFee.toLocaleString()}</p></div>
                <div className="bg-purple-50 rounded-xl p-3 text-center"><p className="text-gray-500 text-xs">💺 Total Seats</p><p className="text-lg font-bold text-purple-600">{totalSeats.toLocaleString()}</p></div>
                <div className="bg-orange-50 rounded-xl p-3 text-center"><p className="text-gray-500 text-xs">📊 Available Seats</p><p className="text-lg font-bold text-orange-600">{Math.max(0, availableSeatsCount).toLocaleString()}</p></div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Pool Progress</span><span>{Math.min(Math.round(progress), 100)}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-green-600 h-3 rounded-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>ETB {currentAmount.toLocaleString()} raised</span><span>Target: ETB {totalCollection.toLocaleString()}</span></div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2"><span className="text-gray-600 text-sm">💰 Total Collection (Prize + 20% Commission):</span><span className="font-bold text-gray-800">ETB {totalCollection.toLocaleString()}</span></div>
                <div className="flex justify-between items-center mb-2"><span className="text-gray-600 text-sm">👑 Platform/Agent Commission (20% of collection):</span><span className="font-bold text-orange-600">ETB {(totalCollection * 0.2).toLocaleString()}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600 text-sm">🎯 Winner Receives:</span><span className="font-bold text-green-600">ETB {winnerPrize.toLocaleString()}</span></div>
              </div>

              {pool.status === 'active' && !showSeatSelector && !showPayment && !showTicket && (
                <button onClick={handleJoinNow} disabled={availableSeatsCount === 0} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-lg transition disabled:opacity-50">
                  {availableSeatsCount === 0 ? 'No Seats Available' : `🎯 Select Seat & Join Pool (ETB ${entryFee.toLocaleString()} per seat)`}
                </button>
              )}
            </div>
          </div>

          {/* 3D Banner Upload Section */}
          <div className="mb-6">
            <ThreeDBannerUpload 
              city={pool?.city || 'Pool'}
              poolType="regular"
              title={`${pool.prize_name || 'Pool'} Banner`}
              existingBannerUrl={bannerUrl}
              onBannerUploaded={handleBannerUpload}
              autoRotate={true}
              rotationSpeed={0.3}
              maxFileSize={10}
            />
          </div>

          {showSeatSelector && renderSeatSelector()}
          {showPayment && renderPayment()}
          
          {showTicket && participantData && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <TicketImage 
                participant={participantData}
                pool={pool}
                isVerified={false}
                seatNumbers={participantData.seat_numbers}
                ticketNumber={participantData.ticket_number}
                amount={participantData.contribution_amount}
                createdAt={participantData.created_at}
                poolType="regular"
              />
              <div className="text-center mt-6">
                <button onClick={() => router.push('/dashboard')} className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition">
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
