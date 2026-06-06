// pages/merkato-vip.js - COMPLETE FIXED WITH PAYMENT SCREENSHOT ONLY
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import NoSSR from '../components/NoSSR';
import TopCitySelector from '../components/TopCitySelector';
import Link from 'next/link';
import UnifiedAgentApplication from '../components/UnifiedAgentApplication';
import Ticket from '../components/Ticket';

// Helper function for next draw dates
const getNextSunday = () => {
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (7 - today.getDay()) % 7);
  return nextSunday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const getNextMonthEnd = () => {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return lastDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

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
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
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
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export default function MerkatoVip() {
  const router = useRouter();
  const isMounted = useRef(true);
  const [activeTab, setActiveTab] = useState('daily');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAgentApplication, setShowAgentApplication] = useState(false);
  
  // Seat selection states
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedPoolType, setSelectedPoolType] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [maxSeats, setMaxSeats] = useState(5);
  const [takenSeats, setTakenSeats] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Ticket states
  const [showTicket, setShowTicket] = useState(false);
  const [participantData, setParticipantData] = useState(null);
  const [ticketType, setTicketType] = useState('unverified');

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted.current) setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  // Fetch taken seats for the selected pool type
  const fetchTakenSeats = async (poolType) => {
    try {
      const { data } = await supabase
        .from('merkato_vip_participants')
        .select('seat_numbers')
        .eq('pool_type', poolType)
        .eq('payment_status', 'verified');
      
      if (data) {
        const allTaken = data.flatMap(p => p.seat_numbers || []);
        setTakenSeats(allTaken);
      }
    } catch (error) {
      console.error('Error fetching taken seats:', error);
    }
  };

  // VIP Pool Data
  const vipPools = {
    daily: {
      name: "ዕለታዊ ሚሊየነር | Daily Millionaire",
      tier: "መርካቶ ለሁሉም | Merkato for All",
      frequency: "Daily",
      contribution: "500",
      contributionFormatted: "500 ETB",
      prize: "1,000,000 ETB",
      prizeNumber: 1000000,
      winnerCount: 1,
      totalSeats: 2400,
      time: "Every Day at 8:00 PM",
      color: "from-gray-700 to-gray-900",
      icon: "⭐",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው",
      sloganEn: "Let's make one participant a millionaire today, this week and this month",
      description: "Start your day with a chance to become an instant millionaire!",
      listedDate: "January 1, 2024",
      drawDate: "Every Day at 8:00 PM",
      nextDraw: "Today at 8:00 PM"
    },
    weekly: {
      name: "ሳምንታዊ ግዙፍ አሸናፊ | Weekly Mega Winner",
      tier: "VIP 2",
      frequency: "Weekly",
      contribution: "2500",
      contributionFormatted: "2,500 ETB",
      prize: "10,000,000 ETB",
      prizeNumber: 10000000,
      winnerCount: 1,
      totalSeats: 4800,
      time: "Every Sunday at 6:00 PM",
      color: "from-gray-700 to-gray-900",
      icon: "🏆",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው",
      sloganEn: "Let's make one participant a millionaire today, this week and this month",
      description: "Ten MILLION Birr changes everything!",
      listedDate: "January 1, 2024",
      drawDate: "Every Sunday at 6:00 PM",
      nextDraw: getNextSunday()
    },
    monthly: {
      name: "ወርሃዊ አሸናፊ | Monthly Winner",
      tier: "VIP 1",
      frequency: "Monthly",
      contribution: "5000",
      contributionFormatted: "5,000 ETB",
      prize: "40,000,000 ETB",
      prizeNumber: 40000000,
      winnerCount: 1,
      totalSeats: 9600,
      time: "Last Day of Month at 8:00 PM",
      color: "from-gray-700 to-gray-900",
      icon: "👑",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው",
      sloganEn: "Let's make one participant a millionaire today, this week and this month",
      description: "The ULTIMATE Merkato prize pool!",
      listedDate: "January 1, 2024",
      drawDate: "Last Day of Month at 8:00 PM",
      nextDraw: getNextMonthEnd()
    }
  };
  
  const handleJoinPool = async (poolType) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      const redirectUrl = `/merkato-vip?type=${poolType}`;
      
      localStorage.setItem('abbaa_redirect_after_login', redirectUrl);
      localStorage.setItem('pendingRole', 'individual');
      
      sessionStorage.setItem('redirectAfterLogin', redirectUrl);
      sessionStorage.setItem('pendingRole', 'individual');
      
      localStorage.removeItem('isPartner');
      sessionStorage.removeItem('isPartner');
      
      toast.loading('Please login to join Merkato VIP...');
      router.push('/login');
      return;
    }
    
    setSelectedPoolType(poolType);
    setSelectedSeats([]);
    await fetchTakenSeats(poolType);
    setShowSeatSelector(true);
  };

  // ========== UPDATED: submitPayment (No Reference Number) ==========
  const submitPayment = async (participantId, file) => {
    const loadingToast = toast.loading('Uploading payment screenshot...');
    
    try {
      validateFile(file);
      const optimizedFile = await compressImage(file);
      
      const fileExt = optimizedFile.name.split('.').pop();
      const fileName = `merkato-payments/${participantId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, optimizedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });
      
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);
      
      const { error: updateError } = await supabase
        .from('merkato_vip_participants')
        .update({
          payment_status: 'pending_verification',
          payment_proof_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', participantId);
      
      if (updateError) throw new Error(`Update failed: ${updateError.message}`);
      
      const { data: updatedParticipant, error: fetchError } = await supabase
        .from('merkato_vip_participants')
        .select('*')
        .eq('id', participantId)
        .single();
      
      if (fetchError) throw new Error(`Fetch failed: ${fetchError.message}`);
      
      setParticipantData(updatedParticipant);
      setTicketType('unverified');
      setShowTicket(true);
      setShowPayment(false);
      setShowSeatSelector(false);
      
      toast.success('Payment submitted! Your unverified ticket is ready', { id: loadingToast });
      
    } catch (error) {
      console.error('Payment submission error:', error);
      toast.error(error.message || 'Failed to submit payment. Please try again.', { id: loadingToast });
      throw error;
    }
  };

  // Updated Seat selector with ALL seats visible and proper color coding
  const renderSeatSelector = () => {
    if (!selectedPoolType) return null;
    
    const pool = vipPools[selectedPoolType];
    const entryFeeAmount = parseInt(pool.contribution);
    const totalSeatsCount = pool.totalSeats;
    const seatNumbers = Array.from({ length: totalSeatsCount }, (_, i) => i + 1);
    
    const toggleSeat = (seatNum) => {
      if (takenSeats.includes(seatNum)) {
        toast.error(`Seat ${seatNum} is already taken`);
        return;
      }
      if (selectedSeats.includes(seatNum)) {
        setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      } else if (selectedSeats.length < maxSeats) {
        setSelectedSeats([...selectedSeats, seatNum]);
      } else {
        toast.error(`You can only select up to ${maxSeats} seats`);
      }
    };
    
    const totalAmount = selectedSeats.length * entryFeeAmount;
    
    const confirmSeats = async () => {
      if (selectedSeats.length === 0) {
        toast.error('Please select at least one seat');
        return;
      }
      
      setLoading(true);
      
      try {
        const ticketNumber = `MK-${selectedPoolType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        const { data: participant, error } = await supabase
          .from('merkato_vip_participants')
          .insert({
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            pool_type: selectedPoolType,
            city: 'Merkato',
            seat_numbers: selectedSeats,
            contribution_amount: totalAmount,
            prize_amount: parseInt(pool.prize.replace(/[^0-9]/g, '')),
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
        
      } catch (error) {
        console.error('Error creating participant:', error);
        toast.error('Failed to create participant record: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Select Your Seats</h2>
              <p className="text-sm text-gray-500">{pool.name} • Max {maxSeats} seats • Total {totalSeatsCount.toLocaleString()} seats</p>
            </div>
            <button 
              onClick={() => {
                setShowSeatSelector(false);
                setSelectedPoolType(null);
                setSelectedSeats([]);
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
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

            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-gray-600">Entry Fee: {pool.contributionFormatted} per seat</p>
              <p className="text-xs text-gray-400">Total Seats Available: {totalSeatsCount.toLocaleString()}</p>
            </div>
            
            <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-2 mb-6 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-xl">
              {seatNumbers.map(seatNum => {
                const isTaken = takenSeats.includes(seatNum);
                const isSelected = selectedSeats.includes(seatNum);
                
                let bgColor = 'bg-yellow-400 hover:bg-yellow-500 text-gray-800';
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
            
            {totalSeatsCount > 500 && (
              <p className="text-xs text-gray-400 text-center mb-4">
                Showing all {totalSeatsCount.toLocaleString()} seats (scroll to see more)
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
                    <p className="text-xs text-gray-400">({selectedSeats.length} seats × {pool.contributionFormatted})</p>
                  </div>
                </div>
                <button
                  onClick={confirmSeats}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm & Proceed to Payment'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ========== UPDATED: renderPayment (No Reference Number) ==========
  const renderPayment = () => {
    if (!showPayment || !participantId || !selectedPoolType) return null;
    
    const pool = vipPools[selectedPoolType];
    const totalAmount = selectedSeats.length * parseInt(pool.contribution);
    
    const handleFileSelect = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        validateFile(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
        
        setSelectedFile(file);
        toast.success('File selected successfully');
      } catch (error) {
        toast.error(error.message);
        e.target.value = '';
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
            <h2 className="text-xl font-bold">Complete Payment</h2>
            <button 
              onClick={() => {
                setShowPayment(false);
                setSelectedPoolType(null);
                setParticipantId(null);
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-gray-600">Pool: {pool.name}</p>
              <p className="text-sm text-gray-600">Seats: {selectedSeats.join(', ')}</p>
              <p className="text-xl font-bold text-green-600 mt-2">ETB {totalAmount.toLocaleString()}</p>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">Please send payment to:</p>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="font-semibold">📱 TeleBirr: 0913277922</p>
              <p className="font-semibold mt-2">🏦 CBE Bank: 1000601091686</p>
              <p className="text-sm text-gray-600 mt-2">Account Name: Negassa Hundessa</p>
            </div>
            
            {/* NO REFERENCE NUMBER FIELD - Only screenshot upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="paymentScreenshot"
                onChange={handleFileSelect}
              />
              <label htmlFor="paymentScreenshot" className="cursor-pointer">
                {previewUrl ? (
                  <div>
                    <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto mb-2 rounded" />
                    <p className="text-green-600">✓ {selectedFile?.name}</p>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 mt-2">Click to upload payment screenshot</p>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG (Max 5MB) - Auto-compressed</p>
                  </div>
                )}
              </label>
            </div>
            
            <button
              onClick={async () => {
                if (!selectedFile) {
                  toast.error('Please upload payment screenshot');
                  return;
                }
                
                setIsSubmitting(true);
                await submitPayment(participantId, selectedFile);
                setIsSubmitting(false);
              }}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition mt-4 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Submit Payment & Get Ticket'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTicketModal = () => {
    if (!showTicket || !participantData) return null;
    
    const pool = vipPools[participantData.pool_type];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">Your Ticket</h3>
              <button
                onClick={() => {
                  setShowTicket(false);
                  router.push('/dashboard');
                }}
                className="text-white hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <Ticket 
                participant={{
                  user_name: participantData.user_name,
                  user_email: participantData.user_email,
                  ticket_number: participantData.ticket_number,
                  created_at: participantData.created_at,
                  contribution_amount: participantData.contribution_amount
                }}
                pool={{
                  prize_name: pool.name,
                  target_amount: pool.prize,
                  pool_type: participantData.pool_type
                }}
                isVerified={ticketType === 'verified'}
                seatNumbers={participantData.seat_numbers}
                ticketNumber={participantData.ticket_number}
                amount={participantData.contribution_amount}
                createdAt={participantData.created_at}
              />
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PoolCard = ({ type, pool }) => (
    <div className="group relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
        🏆 {pool.prize}
      </div>
      
      <div className={`bg-gradient-to-r ${pool.color} p-6 text-white relative`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{pool.tier}</p>
            <h3 className="text-2xl font-bold mt-1">{pool.name}</h3>
          </div>
          <div className="text-5xl animate-bounce">{pool.icon}</div>
        </div>
        
        <div className="mt-3 bg-white/20 backdrop-blur rounded-lg p-2 text-center">
          <p className="text-sm font-bold">{pool.slogan}</p>
          <p className="text-xs opacity-75 mt-1">{pool.sloganEn}</p>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div>
            <p className="text-sm opacity-80">የመግቢያ ክፍያ | Entry Fee</p>
            <p className="text-3xl font-bold">{pool.contributionFormatted}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">የተረጋገጠ ሽልማት | Prize</p>
            <p className="text-3xl font-bold">{pool.prize}</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{pool.time}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span>📅 Listed: {pool.listedDate}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>🎲 Draw: {pool.drawDate}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><span className="text-yellow-500">⏰</span><span>Next Draw: {pool.nextDraw}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg><span>{pool.winnerCount} አሸናፊ | Winner Every {pool.frequency}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg><span>💺 Total Seats: {pool.totalSeats.toLocaleString()}</span></div>
        </div>
        
        <p className="text-gray-600 text-sm mb-6">{pool.description}</p>
        
        <button
          onClick={() => handleJoinPool(type)}
          className={`w-full bg-gradient-to-r ${pool.color} text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-105 flex items-center justify-center gap-2`}
        >
          <span>🎯</span> ይቀላቀሉ | Select Seat & Join
          <span className="group-hover:translate-x-1 transition">→</span>
        </button>
      </div>
    </div>
  );

  return (
    <NoSSR>
      <>
        <Head>
          <title>Merkato VIP - ዕለታዊ 1ሚሊዮን፣ ሳምንታዊ 10ሚሊዮን፣ ወርሃዊ 40ሚሊዮን ብር | Abbaa Carraa</title>
          <meta name="description" content="ልዩ የመርካቶ ነጋዴዎች የሽልማት ፕሮግራም፦ በየቀኑ 1ሚሊዮን ብር፣ በየሳምንቱ 10ሚሊዮን ብር፣ በየወሩ 40ሚሊዮን ብር ያሸንፉ!" />
        </Head>

        {/* Top Navbar with City Selector */}
        <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-2xl group-hover:scale-110 transition-transform">🎫</span>
                <div>
                  <span className="font-bold text-white text-lg">Merkato VIP</span>
                  <span className="text-xs text-gray-400 ml-2 hidden sm:inline">| Ethiopia's Premier Event Hub</span>
                </div>
              </Link>
              <TopCitySelector />
            </div>
          </div>
        </nav>

        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
          {/* Hero Section */}
          <div className="relative bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 text-9xl animate-bounce">🏪</div>
              <div className="absolute bottom-10 right-10 text-9xl animate-pulse">🛺</div>
              <div className="absolute top-1/3 left-1/4 text-8xl animate-spin-slow">📦</div>
              <div className="absolute bottom-1/3 right-1/4 text-8xl animate-ping">💰</div>
            </div>
            
            <div className="relative container mx-auto px-4 py-20 text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
                <span>🏆</span> ልዩ የመርካቶ ፕሮግራም | Merkato Special Program
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-4 animate-fade-in">
                <span className="block">መርካቶ</span>
                <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">VIP</span>
              </h1>
              
              <div className="max-w-4xl mx-auto space-y-4 my-8">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 animate-slide-up">
                  <p className="text-xl md:text-2xl font-bold text-gray-200">
                    &quot;ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው&quot;
                  </p>
                  <p className="text-lg text-gray-300">
                    &quot;Let&apos;s make one participant a millionaire today, this week and this month&quot;
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center hover:bg-white/20 transition transform hover:scale-105">
                  <p className="text-xs opacity-80">ዕለታዊ ሽልማት | Daily Prize</p>
                  <p className="text-2xl font-bold text-gray-200">1,000,000 ብር</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center hover:bg-white/20 transition transform hover:scale-105">
                  <p className="text-xs opacity-80">ሳምንታዊ ሽልማት | Weekly Prize</p>
                  <p className="text-2xl font-bold text-gray-200">10,000,000 ብር</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center hover:bg-white/20 transition transform hover:scale-105">
                  <p className="text-xs opacity-80">ወርሃዊ ሽልማት | Monthly Prize</p>
                  <p className="text-2xl font-bold text-gray-200">40,000,000 ብር</p>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3 hover:bg-white/20 transition">
                  <div className="text-3xl font-bold">7,100+</div>
                  <div className="text-sm">ባለቤቶች | Businesses</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3 hover:bg-white/20 transition">
                  <div className="text-3xl font-bold">13,000+</div>
                  <div className="text-sm">ሠራተኞች | Workers</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3 hover:bg-white/20 transition">
                  <div className="text-3xl font-bold">ሁሉም ኢትዮጵያዊያን</div>
                  <div className="text-sm">All Ethiopians</div>
                </div>
              </div>
            </div>
          </div>

          {/* About Merkato Section */}
          <div className="container mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">🌟 ስለ መርካቶ | About Merkato</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    መርካቶ የአፍሪካ ትልቁ ክፍት ገበያ ሲሆን በየቀኑ በሚሊዮን የሚቆጠር ብር የሚዘዋወርበት የንግድ ልብ ነው። እዚህ ገበያ ውስጥ 7,100 ንግዶች እና 13,000 ሰራተኞች ይገኛሉ።
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>Merkato</strong> is Africa&apos;s largest open-air market, handling millions of Birr in daily transactions. 
                    It&apos;s home to over 7,100 businesses and 13,000 workers coming together for commerce and community.
                  </p>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="border-l-4 border-gray-500 pl-3">
                      <p className="text-xs text-gray-500">የእምነት አካባቢ | Trust-Based</p>
                      <p className="font-semibold">በቃል ንግድ | Word-of-Mouth Commerce</p>
                    </div>
                    <div className="border-l-4 border-gray-500 pl-3">
                      <p className="text-xs text-gray-500">ባህላዊ ቁጠባ | Traditional Saving</p>
                      <p className="font-semibold">የእኩብ ሥርዓት | Equb System</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">💎 መርካቶ ለሁሉም | Merkato for All</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    ይህ ፕሮግራም ለሁሉም ነጋዴዎች እና ተሳታፊዎች ክፍት ነው! 
                    This program is OPEN to ALL Merkato traders and participants!
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span> በየቀኑ አንድ ሚሊየነር | One Millionaire Every Day</div>
                    <div className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span> በየሳምንቱ አንድ ሚሊየነር | One Millionaire Every Week</div>
                    <div className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span> በየወሩ አንድ ሚሊየነር | One Millionaire Every Month</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VIP Tabs */}
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <button onClick={() => setActiveTab('daily')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'daily' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>⭐ ዕለታዊ | Daily (1M)</button>
              <button onClick={() => setActiveTab('weekly')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'weekly' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>🏆 ሳምንታዊ | Weekly (10M)</button>
              <button onClick={() => setActiveTab('monthly')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'monthly' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>👑 ወርሃዊ | Monthly (40M)</button>
            </div>
            <div className="max-w-4xl mx-auto"><PoolCard type={activeTab} pool={vipPools[activeTab]} /></div>
          </div>

          {/* Comparison Table */}
          <div className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-center mb-8">🎯 የሽልማት ንጽጽር | Prize Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">ፕሮግራም | Program</th>
                    <th className="px-6 py-4 text-left">ደረጃ | Tier</th>
                    <th className="px-6 py-4 text-left">ክፍያ | Entry</th>
                    <th className="px-6 py-4 text-left">ሽልማት | Prize</th>
                    <th className="px-6 py-4 text-left">ጊዜ | When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold">⭐ Daily Millionaire</td>
                    <td className="px-6 py-4"><span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">መርካቶ ለሁሉም</span></td>
                    <td className="px-6 py-4 font-bold">500 ብር</td>
                    <td className="px-6 py-4 font-bold text-green-600">1,000,000 ብር</td>
                    <td className="px-6 py-4">Every Day at 8 PM</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold">🏆 Weekly Mega Winner</td>
                    <td className="px-6 py-4"><span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">VIP 2</span></td>
                    <td className="px-6 py-4 font-bold">2,500 ብር</td>
                    <td className="px-6 py-4 font-bold text-purple-600">10,000,000 ብር</td>
                    <td className="px-6 py-4">Every Sunday at 6 PM</td>
                   </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold">👑 Monthly Winner</td>
                    <td className="px-6 py-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">VIP 1</span></td>
                    <td className="px-6 py-4 font-bold">5,000 ብር</td>
                    <td className="px-6 py-4 font-bold text-green-600">40,000,000 ብር</td>
                    <td className="px-6 py-4">Last Day of Month at 8 PM</td>
                   </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gray-100 py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-4">እንዴት እንሳተፋለን? | How It Works</h2>
              <p className="text-center text-gray-600 mb-12">Like traditional Equb, but BIGGER and BETTER!</p>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg text-white animate-bounce">1️⃣</div>
                  <h3 className="font-bold text-xl mb-2">ምረጥ | Choose</h3>
                  <p className="text-gray-600">በየቀኑ፣ በየሳምንቱ ወይም በየወሩ የሚካሄደውን ፑል ምረጥ</p>
                  <p className="text-green-600 font-semibold text-sm mt-1">Choose Daily, Weekly, or Monthly Millionaire pool</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg text-white animate-bounce">2️⃣</div>
                  <h3 className="font-bold text-xl mb-2">ክፈል | Pay</h3>
                  <p className="text-gray-600">በቴሌብር ወይም በንግድ ባንክ መጠነኛ ክፍያ ክፈል</p>
                  <p className="text-green-600 font-semibold text-sm mt-1">Pay via TeleBirr or CBE Bank Transfer</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg text-white animate-bounce">3️⃣</div>
                  <h3 className="font-bold text-xl mb-2">ሽለም | WIN!</h3>
                  <p className="text-gray-600">እጣው ሲነሳ ሚሊየነር ትሆናለህ!</p>
                  <p className="text-green-600 font-semibold text-sm mt-1">When the lottery is drawn - YOU become a MILLIONAIRE!</p>
                </div>
              </div>
              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-2 bg-green-100 px-6 py-3 rounded-full">
                  <span className="text-green-600">💚</span>
                  <span className="text-green-800">2% of every contribution supports kidney & heart disease patients</span>
                </div>
              </div>
            </div>
          </div>

          {/* BECOME AN AGENT SECTION */}
          <div className="container mx-auto px-4 py-12">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">🤝</span>
                  <div>
                    <h3 className="text-2xl font-bold">Become an Agent for Merkato VIP</h3>
                    <p className="text-gray-300 mt-1">
                      Earn 10% commission on every successful contribution from customers you bring!
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      💰 Example: Customer contributes 10,000 ETB → You earn 1,000 ETB
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs bg-green-600/30 rounded-full px-2 py-1">✓ Regular Pools</span>
                      <span className="text-xs bg-purple-600/30 rounded-full px-2 py-1">✓ City VIP Programs</span>
                      <span className="text-xs bg-yellow-600/30 rounded-full px-2 py-1">✓ Merkato VIP</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowAgentApplication(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <span>🎯</span>
                  Apply as Agent
                  <span>→</span>
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div><div className="text-2xl mb-1">💰</div><p className="font-semibold">10% Commission</p><p className="text-xs text-gray-400">On every successful contribution</p></div>
                  <div><div className="text-2xl mb-1">🔗</div><p className="font-semibold">Referral Link</p><p className="text-xs text-gray-400">Track all your customers</p></div>
                  <div><div className="text-2xl mb-1">💳</div><p className="font-semibold">Easy Withdrawal</p><p className="text-xs text-gray-400">TeleBirr or Bank Transfer</p></div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16 animate-pulse-slow">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-4 animate-bounce">ዛሬውኑ ይቀላቀሉ!</h2>
              <p className="text-xl mb-6">Join Today and Become Merkato&apos;s Next Millionaire!</p>
              <button onClick={() => handleJoinPool('daily')} className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl inline-flex items-center gap-2">
                <span>🎯</span> ይሳተፉ | Start Winning
                <span>→</span>
              </button>
              <p className="text-sm opacity-80 mt-4">በቴሌብር እና በንግድ ባንክ መክፈል ይቻላል | Pay via TeleBirr or CBE</p>
            </div>
          </div>
        </div>

        {/* Modals */}
        {renderSeatSelector()}
        {renderPayment()}
        {renderTicketModal()}

        {/* Agent Application Modal */}
        {showAgentApplication && (
          <UnifiedAgentApplication 
            onClose={() => setShowAgentApplication(false)} 
            preSelectedProgram="merkato_vip"
          />
        )}
      </>
    </NoSSR>
  );
}
