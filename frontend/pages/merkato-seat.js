// pages/merkato-seat.js - SIMPLIFIED WITH 3 COLORED BUTTONS
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

  // 3 different colored pools
  const vipPools = {
    daily: { 
      name: "Daily", 
      nameAm: "ዕለታዊ",
      entryFee: 500, 
      prize: 1000000, 
      totalSeats: 2400,
      explanation: "Pay 500 ETB, win 1,000,000 ETB",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
      activeColor: "border-blue-500 bg-blue-50",
      textColor: "text-blue-600"
    },
    weekly: { 
      name: "Weekly", 
      nameAm: "ሳምንታዊ",
      entryFee: 2500, 
      prize: 10000000, 
      totalSeats: 4800,
      explanation: "Pay 2,500 ETB, win 10,000,000 ETB",
      buttonColor: "bg-green-500 hover:bg-green-600",
      activeColor: "border-green-500 bg-green-50",
      textColor: "text-green-600"
    },
    monthly: { 
      name: "Monthly", 
      nameAm: "ወርሃዊ",
      entryFee: 5000, 
      prize: 40000000, 
      totalSeats: 9600,
      explanation: "Pay 5,000 ETB, win 40,000,000 ETB",
      buttonColor: "bg-orange-500 hover:bg-orange-600",
      activeColor: "border-orange-500 bg-orange-50",
      textColor: "text-orange-600"
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
    checkUser();
  }, []);

  useEffect(() => {
    if (selectedType) {
      setPoolInfo(vipPools[selectedType]);
      if (type !== selectedType) {
        router.replace(`/merkato-seat?type=${selectedType}`, undefined, { shallow: true });
      }
    }
  }, [selectedType]);

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
      console.error('Error checking user:', error);
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
      const poolId = `merkato_${selectedType}`;
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
      toast.warning('Your seat reservation has expired. Please reselect seats.');
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

  const handleManualSeatAdd = async () => {
    const seatNum = parseInt(manualSeatInput);
    if (isNaN(seatNum)) {
      toast.error('Please enter a valid seat number');
      return;
    }
    if (seatNum < 1 || seatNum > poolInfo.totalSeats) {
      toast.error(`Seat number must be between 1 and ${poolInfo.totalSeats.toLocaleString()}`);
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
    if (selectedSeats.length >= 5) {
      toast.error(`You can only select up to 5 seats`);
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
      toast.error(`Seat ${seatNum} is already taken`);
      return;
    }
    const isSelected = selectedSeats.includes(seatNum);
    if (isSelected) {
      await releaseSeats([seatNum]);
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      setReservedSeats(reservedSeats.filter(s => s !== seatNum));
      toast.success(`Seat ${seatNum} released`);
    } else {
      if (selectedSeats.length >= 5) {
        toast.error(`You can only select up to 5 seats`);
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
    try {
      await fetchBookedSeats();
      const stillAvailable = selectedSeats.every(seat => !bookedSeats.includes(seat));
      if (!stillAvailable) {
        toast.error('Some seats are no longer available. Please reselect.');
        await fetchBookedSeats();
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
      toast.success('Seats reserved! Please complete payment.');
    } catch (error) { 
      toast.error('Failed to reserve seats');
    } finally { 
      setLoading(false); 
    }
  };

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
      toast.success('Payment submitted! Your ticket is ready');
    } catch (error) {
      toast.error('Failed to submit payment');
    } finally {
      setUploading(false);
    }
  };

  const getSeatColor = (seatNum) => {
    if (bookedSeats.includes(seatNum)) return 'bg-red-100 border-red-300 cursor-not-allowed opacity-60';
    if (selectedSeats.includes(seatNum)) return 'bg-emerald-600 text-white shadow-md';
    if (reservedSeats.includes(seatNum)) return 'bg-amber-100 border-amber-300 animate-pulse';
    return 'bg-white hover:bg-gray-50 border-gray-200 cursor-pointer';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!poolInfo) return null;

  const totalAmount = selectedSeats.length * poolInfo.entryFee;
  const seatNumbers = Array.from({ length: poolInfo.totalSeats }, (_, i) => i + 1);
  const availableCount = seatNumbers.filter(s => !bookedSeats.includes(s) && !selectedSeats.includes(s) && !reservedSeats.includes(s)).length;
  const takenCount = bookedSeats.length;

  return (
    <>
      <Head><title>Merkato VIP - Select Your Seat | Abbaa Carraa</title></Head>
      
      <div className="min-h-screen bg-gray-50 py-6 pb-32">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 text-center">
            <div className="text-5xl mb-2">🏪</div>
            <h1 className="text-2xl font-bold text-gray-800">Merkato VIP</h1>
            <p className="text-gray-500 text-sm mt-1">Select your seat to win up to 40 Million ETB</p>
          </div>

          {/* 3 Main Buttons with different colors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setSelectedType('daily')}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                selectedType === 'daily' 
                  ? `${vipPools.daily.activeColor} shadow-md` 
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="text-lg font-bold">⭐ Daily</div>
              <div className={`text-2xl font-bold ${selectedType === 'daily' ? vipPools.daily.textColor : 'text-blue-500'}`}>ETB 500</div>
              <div className="text-xs text-gray-500 mt-1">Win 1,000,000 ETB</div>
            </button>

            <button
              onClick={() => setSelectedType('weekly')}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                selectedType === 'weekly' 
                  ? `${vipPools.weekly.activeColor} shadow-md` 
                  : 'border-gray-200 bg-white hover:border-green-300'
              }`}
            >
              <div className="text-lg font-bold">🏆 Weekly</div>
              <div className={`text-2xl font-bold ${selectedType === 'weekly' ? vipPools.weekly.textColor : 'text-green-500'}`}>ETB 2,500</div>
              <div className="text-xs text-gray-500 mt-1">Win 10,000,000 ETB</div>
            </button>

            <button
              onClick={() => setSelectedType('monthly')}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                selectedType === 'monthly' 
                  ? `${vipPools.monthly.activeColor} shadow-md` 
                  : 'border-gray-200 bg-white hover:border-orange-300'
              }`}
            >
              <div className="text-lg font-bold">👑 Monthly</div>
              <div className={`text-2xl font-bold ${selectedType === 'monthly' ? vipPools.monthly.textColor : 'text-orange-500'}`}>ETB 5,000</div>
              <div className="text-xs text-gray-500 mt-1">Win 40,000,000 ETB</div>
            </button>
          </div>

          {/* Selected Pool Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500">Selected Pool</div>
              <div className="font-bold text-lg">{poolInfo.name}</div>
              <div className="text-sm text-gray-600">{poolInfo.explanation}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Total Seats</div>
              <div className="font-bold text-xl">{poolInfo.totalSeats.toLocaleString()}</div>
            </div>
          </div>

          {/* Seat Selection */}
          {!showPayment && !showTicket && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold mb-4">Select Your Seats (Max 5)</h3>
              
              {/* Manual Input */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-medium mb-2">🎯 Enter seat number manually:</p>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={manualSeatInput}
                    onChange={(e) => setManualSeatInput(e.target.value)}
                    placeholder={`Enter seat number (1-${poolInfo.totalSeats.toLocaleString()})`}
                    className="flex-1 px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleManualSeatAdd}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700"
                  >
                    Add Seat
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">⚠️ If seat is taken, you will be notified</p>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b">
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-white border border-gray-300 rounded"></div><span className="text-xs">Available</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-emerald-600 rounded"></div><span className="text-xs">Your Seats</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-red-100 border border-red-300 rounded"></div><span className="text-xs">Taken</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-amber-100 border border-amber-300 rounded animate-pulse"></div><span className="text-xs">Reserved (10 min)</span></div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50 rounded-xl p-3 text-center border">
                  <div className="text-2xl font-bold text-emerald-600">{availableCount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Available</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border">
                  <div className="text-2xl font-bold text-amber-600">{selectedSeats.length}</div>
                  <div className="text-xs text-gray-500">Your Seats</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border">
                  <div className="text-2xl font-bold text-red-500">{takenCount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Taken</div>
                </div>
              </div>

              {/* Seat Grid */}
              <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-2 mb-6 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-xl border">
                {seatNumbers.slice(0, 500).map(seatNum => {
                  const isTaken = bookedSeats.includes(seatNum);
                  const isSelected = selectedSeats.includes(seatNum);
                  const isReserved = reservedSeats.includes(seatNum);
                  
                  let bgColor = 'bg-white hover:bg-gray-50 border-gray-200 cursor-pointer';
                  if (isSelected) bgColor = 'bg-emerald-600 text-white shadow-md';
                  if (isTaken) bgColor = 'bg-red-100 border-red-300 cursor-not-allowed opacity-60';
                  if (isReserved && !isSelected) bgColor = 'bg-amber-100 border-amber-300 animate-pulse';
                  
                  return (
                    <button
                      key={seatNum}
                      onClick={() => toggleSeat(seatNum)}
                      disabled={isTaken}
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all border ${bgColor} ${isSelected ? 'ring-2 ring-emerald-300' : ''}`}
                      title={isTaken ? `Seat ${seatNum} is already taken` : isSelected ? `Seat ${seatNum} selected by you` : `Select Seat ${seatNum}`}
                    >
                      <span>{seatNum}</span>
                    </button>
                  );
                })}
              </div>
              {poolInfo.totalSeats > 500 && (
                <p className="text-xs text-gray-400 text-center mt-2">Showing first 500 of {poolInfo.totalSeats.toLocaleString()} total seats</p>
              )}
              
              {/* Sticky Confirm Button */}
              {selectedSeats.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-lg z-50">
                  <div className="container mx-auto max-w-6xl">
                    <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Selected Seats</p>
                        <p className="font-bold text-lg">{selectedSeats.sort((a,b)=>a-b).join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="font-bold text-2xl text-emerald-600">ETB {totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">({selectedSeats.length} seats × ETB {poolInfo.entryFee.toLocaleString()})</p>
                      </div>
                      <button 
                        onClick={confirmSeats} 
                        disabled={loading} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold text-base disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : `Confirm ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? 's' : ''} & Proceed to Payment`}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 text-center">⏰ Your selected seats are reserved for 10 minutes</p>
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
                  <h2 className="text-xl font-bold">Complete Payment</h2>
                  <button onClick={() => { setShowPayment(false); setParticipantId(null); }} className="text-2xl">×</button>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                    <p>Seats: {selectedSeats.join(', ')}</p>
                    <p className="text-2xl font-bold text-emerald-600">ETB {totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <p className="font-semibold">📱 TeleBirr: 0913277922</p>
                    <p className="font-semibold mt-2">🏦 CBE Bank: 1000601091686</p>
                    <p className="text-sm">Account: Negassa Hundessa</p>
                  </div>
                  
                  <div className="border-2 border-dashed rounded-xl p-4 text-center mb-4">
                    <input type="file" accept="image/*" className="hidden" id="paymentFile" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                    }} />
                    <label htmlFor="paymentFile" className="cursor-pointer block">
                      {previewUrl ? (
                        <div><img src={previewUrl} className="max-h-32 mx-auto mb-2 rounded" /><p className="text-emerald-600">✓ Screenshot selected</p></div>
                      ) : (
                        <div><svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p className="text-gray-500 mt-2">Upload payment screenshot</p></div>
                      )}
                    </label>
                  </div>
                  
                  <button onClick={handlePaymentSubmit} disabled={uploading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold">
                    {uploading ? 'Processing...' : 'Submit Payment & Get Ticket'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Display */}
          {showTicket && participantData && (
            <div className="bg-white rounded-2xl border p-6">
              <TicketImage 
                participant={participantData}
                pool={poolInfo}
                isVerified={false}
                seatNumbers={selectedSeats}
                ticketNumber={participantData.ticket_number}
                amount={participantData.contribution_amount}
                createdAt={participantData.created_at}
                poolType="merkato"
              />
              <button onClick={() => router.push('/dashboard')} className="mt-6 w-full bg-gray-600 text-white py-2 rounded-xl">
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
