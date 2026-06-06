// pages/pools/[id].js - COMPLETE FIXED VERSION
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import Ticket from '../../components/Ticket';

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
  const [user, setUser] = useState(null);
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [maxSeats, setMaxSeats] = useState(5);
  const [participantId, setParticipantId] = useState(null);
  const [participantData, setParticipantData] = useState(null);
  const [ticketType, setTicketType] = useState('unverified');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSeats, setAvailableSeats] = useState(0);
  const [takenSeats, setTakenSeats] = useState([]);
  const [reference, setReference] = useState('');

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (id) {
      fetchPool();
      getCurrentUser();
      fetchAvailableSeats();
      fetchTakenSeats();
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      sessionStorage.removeItem('redirectAfterLogin');
      sessionStorage.removeItem('pendingPoolId');
      sessionStorage.removeItem('pendingRole');
    }
  }, [user]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (isMounted.current) setUser(user);
  }

  async function fetchPool() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pools')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      router.push('/listings');
    } else {
      if (isMounted.current) setPool(data);
    }
    setLoading(false);
  }

  async function fetchAvailableSeats() {
    const { count } = await supabase
      .from('pool_seats')
      .select('*', { count: 'exact', head: true })
      .eq('pool_id', id)
      .eq('status', 'available');
    if (isMounted.current) setAvailableSeats(count || 0);
  }

  async function fetchTakenSeats() {
    const { data } = await supabase
      .from('pool_seats')
      .select('seat_number')
      .eq('pool_id', id)
      .eq('status', 'taken');
    
    if (data) {
      setTakenSeats(data.map(s => s.seat_number));
    }
  }

  async function releaseSeats(seatNumbers) {
    if (!seatNumbers || seatNumbers.length === 0) return;
    
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
      .eq('status', 'reserved');
  }

  async function releaseUserPreviousReservations() {
    if (!user) return;
    
    const { data: userReservations } = await supabase
      .from('pool_seats')
      .select('seat_number')
      .eq('pool_id', id)
      .eq('reserved_by', user.id)
      .eq('status', 'reserved');
    
    if (userReservations && userReservations.length > 0) {
      const seatNumbers = userReservations.map(s => s.seat_number);
      await releaseSeats(seatNumbers);
    }
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

  const handlePaymentSuccess = async () => {
    const { data: participant } = await supabase
      .from('regular_pool_participants')
      .select('*')
      .eq('id', participantId)
      .single();
    
    setParticipantData(participant);
    setShowPayment(false);
    setShowTicket(true);
    toast.success('Payment submitted! Your unverified ticket is ready');
  };

  const handlePaymentSubmit = async () => {
    if (!selectedFile) { 
      toast.error('Please upload payment screenshot'); 
      return; 
    }
    
    setIsSubmitting(true);
    try {
      validateFile(selectedFile);
      const compressedFile = await compressImage(selectedFile);
      const fileName = `regular-payments/${participantId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(fileName, compressedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
      
      await supabase.from('regular_pool_participants').update({
        payment_status: 'pending_verification',
        payment_proof_url: publicUrl,
        reference: reference,
        payment_submitted_at: new Date().toISOString()
      }).eq('id', participantId);
      
      await supabase
        .from('pool_seats')
        .update({ status: 'taken' })
        .in('seat_number', selectedSeats)
        .eq('pool_id', pool.id);
      
      await handlePaymentSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to submit payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeatsSelected = async (seatData) => {
    await releaseUserPreviousReservations();

    const { data: seats, error: seatCheckError } = await supabase
      .from('pool_seats')
      .select('seat_number, status, reserved_by')
      .in('seat_number', seatData.seats)
      .eq('pool_id', pool.id);

    if (seatCheckError) {
      toast.error('Error checking seats');
      setShowSeatSelector(true);
      return;
    }

    const unavailableSeats = seats.filter(s => s.status !== 'available' && s.reserved_by !== user?.id);
    
    if (unavailableSeats.length > 0) {
      toast.error(`Seats ${unavailableSeats.map(s => s.seat_number).join(', ')} are not available`);
      await fetchAvailableSeats();
      await fetchTakenSeats();
      setShowSeatSelector(true);
      return;
    }

    const expiryTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const availableSeatNumbers = seats.filter(s => s.status === 'available').map(s => s.seat_number);
    
    if (availableSeatNumbers.length > 0) {
      await supabase
        .from('pool_seats')
        .update({
          status: 'reserved',
          user_id: user.id,
          reserved_by: user.id,
          reserved_until: expiryTime
        })
        .in('seat_number', availableSeatNumbers)
        .eq('pool_id', pool.id)
        .eq('status', 'available');
    }

    setSelectedSeats(seatData.seats);
    
    const ticketNumber = `POOL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const { data: participant, error } = await supabase
      .from('regular_pool_participants')
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email.split('@')[0],
        pool_id: pool.id,
        pool_name: pool.prize_name,
        seat_numbers: seatData.seats,
        contribution_amount: seatData.totalAmount,
        prize_amount: pool.target_amount,
        payment_status: 'pending',
        ticket_number: ticketNumber,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    setParticipantId(participant.id);
    setShowSeatSelector(false);
    setShowPayment(true);
    toast.success(`✅ Seats ${seatData.seats.join(', ')} reserved!`);
  };

  const handleCancelSeatSelection = async () => {
    if (selectedSeats.length > 0) {
      await releaseSeats(selectedSeats);
      setSelectedSeats([]);
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  }

  if (!pool) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold">Pool not found</h1><Link href="/listings" className="text-green-600 mt-4 inline-block">Back to listings</Link></div></div>;
  }

  const winnerPrize = pool.target_amount || 0;
  const entryFee = pool.entry_fee || pool.ticket_price || 10;
  const totalCollection = winnerPrize * 1.2;
  const totalSeats = Math.floor(totalCollection / entryFee);
  const currentAmount = pool.current_amount || 0;
  const currentSeatsFilled = Math.floor(currentAmount / entryFee);
  const availableSeatsCount = totalSeats - currentSeatsFilled;
  const progress = (currentAmount / totalCollection) * 100;
  const maxSeatsPerUser = Math.min(5, Math.floor(availableSeatsCount / 2) || 5);

  // IMPROVED: Render seat selector with ALL seats visible and color coding
  const renderSeatSelector = () => {
    const seatNumbers = Array.from({ length: totalSeats }, (_, i) => i + 1);
    const toggleSeat = (seatNum) => {
      if (takenSeats.includes(seatNum)) {
        toast.error(`Seat ${seatNum} is already taken`);
        return;
      }
      if (selectedSeats.includes(seatNum)) {
        setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      } else if (selectedSeats.length < maxSeatsPerUser) {
        setSelectedSeats([...selectedSeats, seatNum]);
      } else {
        toast.error(`You can only select up to ${maxSeatsPerUser} seats`);
      }
    };
    const totalAmount = selectedSeats.length * entryFee;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Select Your Seats</h2>
              <p className="text-sm text-gray-500">{pool.prize_name} • Max {maxSeatsPerUser} seats • Total {totalSeats.toLocaleString()} seats</p>
            </div>
            <button onClick={handleCancelSeatSelection} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
          
          <div className="p-6">
            {/* Seat Legend */}
            <div className="flex flex-wrap justify-center gap-4 mb-4 pb-3 border-b">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span className="text-xs">Selected by You</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-400 rounded"></div>
                <span className="text-xs">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
                <span className="text-xs">Taken by Others</span>
              </div>
            </div>

            {/* Seat Grid - ALL SEATS VISIBLE */}
            <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-2 mb-6 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-xl">
              {seatNumbers.map(seatNum => {
                const isTaken = takenSeats.includes(seatNum);
                const isSelected = selectedSeats.includes(seatNum);
                
                let bgColor = 'bg-yellow-400 hover:bg-yellow-500 text-gray-800'; // Available = Yellow
                if (isSelected) bgColor = 'bg-green-600 text-white';
                if (isTaken) bgColor = 'bg-gray-400 text-white cursor-not-allowed';
                
                return (
                  <button
                    key={seatNum}
                    onClick={() => !isTaken && toggleSeat(seatNum)}
                    disabled={isTaken}
                    className={`w-10 h-10 rounded-lg font-semibold transition ${bgColor} ${isTaken ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={isTaken ? `Seat ${seatNum} is already taken` : `Select Seat ${seatNum}`}
                  >
                    {seatNum}
                  </button>
                );
              })}
            </div>
            
            {totalSeats > 500 && (
              <p className="text-xs text-gray-400 text-center mb-4">
                Showing all {totalSeats.toLocaleString()} seats (scroll to see more)
              </p>
            )}
            
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
                    <p className="text-xs text-gray-400">({selectedSeats.length} seats × ETB {entryFee.toLocaleString()})</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSeatsSelected({ seats: selectedSeats, totalAmount })}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Confirm & Proceed to Payment
                </button>
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
            
            {/* Reference Number Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Reference Number/Transaction ID *</label>
              <input
                type="text"
                placeholder="Enter transaction ID or reference number"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            
            {/* Upload Section */}
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
                    <p className="text-xs text-gray-400">JPEG, PNG (Max 5MB) - Will be auto-compressed</p>
                  </div>
                )}
              </label>
            </div>
            
            <button 
              onClick={handlePaymentSubmit} 
              disabled={isSubmitting || !reference.trim()} 
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link href="/listings" className="text-green-600 hover:underline mb-4 inline-block">← Back to listings</Link>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="w-full h-64 md:h-80 bg-gray-200 relative">
              {pool.image_url ? (
                <img src={pool.image_url} alt={pool.prize_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                  <span className="text-6xl">🎁</span>
                </div>
              )}
              {pool.status === 'active' && <span className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">🔴 Active</span>}
              {pool.is_featured && <span className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">⭐ Featured</span>}
            </div>

            <div className="p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{pool.prize_name}</h1>
              <p className="text-gray-600 mb-6">{pool.description || 'Join this amazing pool for a chance to win big!'}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100"><p className="text-gray-500 text-xs">🏆 Winner Gets</p><p className="text-lg font-bold text-green-600">ETB {winnerPrize.toLocaleString()}</p></div>
                <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100"><p className="text-gray-500 text-xs">🎫 Entry Fee</p><p className="text-lg font-bold text-blue-600">ETB {entryFee.toLocaleString()}</p></div>
                <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100"><p className="text-gray-500 text-xs">💺 Total Seats</p><p className="text-lg font-bold text-purple-600">{totalSeats.toLocaleString()}</p></div>
                <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100"><p className="text-gray-500 text-xs">📊 Available Seats</p><p className="text-lg font-bold text-orange-600">{Math.max(0, availableSeatsCount).toLocaleString()}</p></div>
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
                <div className="border-t pt-6">
                  <button onClick={handleJoinNow} disabled={availableSeatsCount === 0} className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition disabled:opacity-50">
                    {availableSeatsCount === 0 ? 'No Seats Available' : `🎯 Select Seat & Join Pool (ETB ${entryFee.toLocaleString()} per seat)`}
                  </button>
                </div>
              )}

              {showSeatSelector && renderSeatSelector()}
              {showPayment && renderPayment()}
              {showTicket && participantData && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <Ticket 
                    participant={{
                      user_name: participantData.user_name,
                      user_email: participantData.user_email,
                      ticket_number: participantData.ticket_number,
                      created_at: participantData.created_at,
                      contribution_amount: participantData.contribution_amount
                    }}
                    pool={{
                      prize_name: pool.prize_name,
                      target_amount: pool.target_amount,
                      end_date: pool.end_date,
                      created_at: pool.created_at
                    }}
                    isVerified={false}
                    seatNumbers={participantData.seat_numbers}
                    ticketNumber={participantData.ticket_number}
                    amount={participantData.contribution_amount}
                    createdAt={participantData.created_at}
                  />
                  <div className="text-center mt-6">
                    <button onClick={() => router.push('/dashboard')} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition">
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
