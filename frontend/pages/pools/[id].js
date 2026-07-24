// pages/pools/[id].js - COMPLETE WITH UNIFIED SEAT SELECTOR
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import TicketImage from '../../components/TicketImage';
import SeatSelector from '../../components/SeatSelector';

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
  const [participantId, setParticipantId] = useState(null);
  const [participantData, setParticipantData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSeatsCount, setAvailableSeatsCount] = useState(0);
  const [language, setLanguage] = useState('am');
  
  // Ticket verification states
  const [ticketVerified, setTicketVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

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
  const totalSeats = pool?.total_seats || Math.max(10, Math.floor(totalCollection / entryFee) || 10);
  const currentAmount = pool?.current_amount || 0;
  const progress = (currentAmount / totalCollection) * 100;

  useEffect(() => {
    if (id) {
      fetchPool();
      getCurrentUser();
    }
  }, [id]);

  useEffect(() => {
    if (!id && !loading && router.isReady) {
      toast.error('No pool selected');
      router.push('/listings');
    }
  }, [id, loading, router.isReady]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check ticket verification status periodically
  useEffect(() => {
    if (participantId && paymentSubmitted) {
      checkVerificationStatus();
      const interval = setInterval(checkVerificationStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [participantId, paymentSubmitted]);

  async function getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted.current) setUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  }

  const checkVerificationStatus = async () => {
    if (!participantId || checkingVerification) return;
    
    setCheckingVerification(true);
    try {
      const { data: participant, error } = await supabase
        .from('regular_pool_participants')
        .select('payment_status')
        .eq('id', participantId)
        .single();

      if (error) throw error;

      if (participant?.payment_status === 'verified') {
        setTicketVerified(true);
        toast.success(
          language === 'am' 
            ? '✅ ቲኬትዎ ተረጋግጧል! የተረጋገጠ ቲኬትዎን ያውርዱ' 
            : '✅ Your ticket is verified! Download your verified ticket'
        );
        const { data: updatedParticipant } = await supabase
          .from('regular_pool_participants')
          .select('*')
          .eq('id', participantId)
          .single();
        if (updatedParticipant) {
          setParticipantData(updatedParticipant);
        }
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setCheckingVerification(false);
    }
  };

  async function fetchPool() {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error('Pool fetch error:', error);
        toast.error('Could not load pool details. Please try again.');
        setTimeout(() => router.push('/listings'), 2000);
        return;
      }
      
      if (!data) {
        toast.error('Pool not found');
        setTimeout(() => router.push('/listings'), 2000);
        setLoading(false);
        return;
      }
      
      if (isMounted.current) setPool(data);
      // Get available seats count
      await fetchAvailableSeats(data.id);
      
    } catch (err) {
      console.error('Unexpected error fetching pool:', err);
      toast.error('An unexpected error occurred.');
      setTimeout(() => router.push('/listings'), 2000);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  async function fetchAvailableSeats(poolId) {
    try {
      const { data, error } = await supabase
        .from('pool_seats')
        .select('seat_number, status')
        .eq('pool_id', poolId);
      
      if (error) {
        console.error('Error fetching seats:', error);
        setAvailableSeatsCount(0);
        return;
      }
      
      const taken = data?.filter(s => s.status === 'taken').length || 0;
      const reserved = data?.filter(s => s.status === 'reserved').length || 0;
      const available = Math.max(0, totalSeats - taken - reserved);
      setAvailableSeatsCount(available);
    } catch (error) {
      console.error('Error fetching seats:', error);
      setAvailableSeatsCount(0);
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

  const handleSeatsSelected = async ({ seats, totalAmount, seatCount, tier }) => {
    setLoading(true);
    
    try {
      const ticketNumber = `POOL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      const { data: participant, error } = await supabase
        .from('regular_pool_participants')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0],
          pool_id: pool.id,
          pool_name: pool.prize_name,
          seat_numbers: seats,
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
      
      // Mark seats as taken
      await supabase
        .from('pool_seats')
        .update({ 
          status: 'taken', 
          user_id: user.id,
          reserved_by: null,
          reserved_until: null
        })
        .in('seat_number', seats)
        .eq('pool_id', pool.id);
      
      setParticipantId(participant.id);
      setSelectedSeats(seats);
      setShowSeatSelector(false);
      setShowPayment(true);
      
      toast.success('Seats reserved! Please complete payment.');
      
    } catch (error) { 
      console.error('Error:', error);
      toast.error('Failed to reserve seats: ' + error.message);
    } finally { 
      setLoading(false); 
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

  const handlePaymentSubmit = async () => {
    if (!selectedFile) { 
      toast.error('Please upload payment screenshot'); 
      return; 
    }
    
    setIsSubmitting(true);
    const loadingToast = toast.loading('Uploading payment screenshot...');
    
    try {
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
      setPaymentSubmitted(true);
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

  const handleCloseTicket = () => {
    setShowTicket(false);
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading pool details...</p>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-800">Pool Not Found</h1>
          <p className="text-gray-500 mt-2">The pool you're looking for may have been removed or doesn't exist.</p>
          <Link href="/listings" className="inline-block mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition">
            Browse All Pools →
          </Link>
        </div>
      </div>
    );
  }

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

          {/* Unified Seat Selector */}
          {showSeatSelector && (
            <SeatSelector
              isOpen={showSeatSelector}
              onClose={() => setShowSeatSelector(false)}
              poolId={pool.id}
              entryFee={entryFee}
              totalSeats={totalSeats}
              programType="regular"
              language={language}
              onSeatsSelected={handleSeatsSelected}
              onCancel={() => setShowSeatSelector(false)}
            />
          )}

          {/* Payment Modal */}
          {showPayment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
                  <h2 className="text-xl font-bold">Complete Payment</h2>
                  <button onClick={() => { setShowPayment(false); setParticipantId(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
                    <p className="text-sm text-gray-600">Pool: {pool.prize_name}</p>
                    <p className="text-sm text-gray-600">Seats: {selectedSeats.join(', ')}</p>
                    <p className="text-xl font-bold text-green-600 mt-2">ETB {(selectedSeats.length * entryFee).toLocaleString()}</p>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">Please send payment to:</p>
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="font-semibold">📱 TeleBirr: 0913277922</p>
                    <p className="font-semibold mt-2">🏦 CBE Bank: 1000601091686</p>
                    <p className="text-sm text-gray-600 mt-2">Account Name: NEGASSA HUNDESSA DUGA</p>
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
          )}
          
          {/* Ticket Display */}
          {showTicket && participantData && (
            <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
                <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">
                      {language === 'am' ? '🎫 የእርስዎ ቲኬት' : '🎫 Your Ticket'}
                    </h2>
                    {ticketVerified && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                        ✅ {language === 'am' ? 'የተረጋገጠ' : 'Verified'}
                      </span>
                    )}
                  </div>
                  <button onClick={handleCloseTicket} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                <div className="p-6">
                  <TicketImage
                    participant={participantData}
                    pool={{
                      prize_name: pool.prize_name,
                      target_amount: pool.target_amount,
                      prize: pool.target_amount
                    }}
                    isVerified={ticketVerified || participantData.payment_status === 'verified'}
                    seatNumbers={participantData.seat_numbers || selectedSeats}
                    ticketNumber={participantData.ticket_number}
                    amount={participantData.contribution_amount}
                    createdAt={participantData.created_at}
                    poolType="regular"
                    show3D={false}
                    language={language}
                    onDownload={() => {
                      toast.success(
                        language === 'am' 
                          ? '📥 ቲኬት እየተወረደ ነው...' 
                          : '📥 Downloading ticket...'
                      );
                    }}
                    onClose={handleCloseTicket}
                  />
                  
                  {!ticketVerified && paymentSubmitted && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-yellow-800">
                        ⏳ {language === 'am' 
                          ? 'ቲኬትዎ እየተረጋገጠ ነው. እባክዎ ይጠብቁ. አስተዳዳሪው ክፍያዎን ካረጋገጠ በኋላ የተረጋገጠ ቲኬት ያገኛሉ.' 
                          : 'Your ticket is being verified. Please wait. You will receive a verified ticket once the admin confirms your payment.'}
                      </p>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
                        <span className="text-xs text-yellow-600">
                          {language === 'am' ? 'በመጠበቅ ላይ...' : 'Waiting...'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {ticketVerified && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-green-800">
                        ✅ {language === 'am' 
                          ? 'ቲኬትዎ ተረጋግጧል! የተረጋገጠ ቲኬትዎን ማውረድ ይችላሉ.' 
                          : 'Your ticket is verified! You can download your verified ticket.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
