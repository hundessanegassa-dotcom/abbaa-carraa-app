// pages/merkato-seat.js - COMPLETE WITH UNIFIED SEAT SELECTOR
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import TicketImage from '../components/TicketImage';
import SeatSelector from '../components/SeatSelector';

export default function MerkatoSeat() {
  const router = useRouter();
  const { type } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(type || 'daily');
  const [poolInfo, setPoolInfo] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showSeatSelector, setShowSeatSelector] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [participantData, setParticipantData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [language, setLanguage] = useState('am');

  // VIP Pools configuration
  const vipPools = {
    daily: {
      name: "Daily Millionaire",
      nameAm: "ዕለታዊ",
      entryFee: 500,
      prize: 1000000,
      totalSeats: 2400,
      color: "from-blue-600 to-blue-800",
      icon: "⭐",
      drawDate: "Every Day at 8:00 PM"
    },
    weekly: {
      name: "Weekly Mega Winner",
      nameAm: "ሳምንታዊ",
      entryFee: 2500,
      prize: 10000000,
      totalSeats: 4800,
      color: "from-green-600 to-green-800",
      icon: "🏆",
      drawDate: "Every Sunday at 6:00 PM"
    },
    monthly: {
      name: "Monthly Legend",
      nameAm: "ወርሃዊ",
      entryFee: 5000,
      prize: 40000000,
      totalSeats: 9600,
      color: "from-orange-600 to-orange-800",
      icon: "👑",
      drawDate: "Last Day of Month at 8:00 PM"
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
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

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

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

  const handleSeatsSelected = async ({ seats, totalAmount, seatCount, tier }) => {
    setLoading(true);
    
    try {
      const ticketNumber = `MK-${selectedType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      const { data: participant, error } = await supabase
        .from('merkato_vip_participants')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0],
          pool_type: selectedType,
          city: 'Merkato',
          seat_numbers: seats,
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
      
      // Mark seats as taken in merkato_vip_seats
      await supabase
        .from('merkato_vip_seats')
        .update({
          status: 'taken',
          user_id: user.id,
          reserved_by: null,
          reserved_until: null
        })
        .in('seat_number', seats)
        .eq('pool_id', `merkato_${selectedType}`);
      
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
    
    setUploading(true);
    const loadingToast = toast.loading('Uploading payment screenshot...');
    
    try {
      const compressedFile = await compressImage(selectedFile);
      const fileName = `${user.id}/${Date.now()}_merkato_${selectedType}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, compressedFile);
      
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);
      
      const { error: updateError } = await supabase
        .from('merkato_vip_participants')
        .update({
          payment_status: 'pending_verification',
          payment_proof_url: publicUrl,
          payment_submitted_at: new Date().toISOString()
        })
        .eq('id', participantId);
      
      if (updateError) throw updateError;
      
      const { data: updatedParticipant } = await supabase
        .from('merkato_vip_participants')
        .select('*')
        .eq('id', participantId)
        .single();
      
      setParticipantData(updatedParticipant);
      setShowPayment(false);
      setShowTicket(true);
      
      toast.success('Payment submitted! Your unverified ticket is ready', { id: loadingToast });
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to submit payment', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
    router.push('/dashboard');
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
                    ? `bg-gradient-to-r ${pool.color} text-white shadow-lg border-transparent`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-1">{pool.icon}</div>
                <div className="text-lg font-bold">{language === 'am' ? pool.nameAm : pool.name}</div>
                <div className={`text-2xl font-bold ${selectedType === key ? 'text-white' : 'text-gray-700'}`}>
                  ETB {pool.entryFee.toLocaleString()}
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
              <div className="text-xs text-gray-400 mt-1">
                📅 {poolInfo.drawDate}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                {language === 'am' ? 'ጠቅላላ መቀመጫዎች' : 'Total Seats'}
              </div>
              <div className="font-bold text-2xl text-gray-800">
                {poolInfo.totalSeats.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Unified Seat Selector */}
          {showSeatSelector && (
            <SeatSelector
              isOpen={showSeatSelector}
              onClose={() => setShowSeatSelector(false)}
              tierId={selectedType}
              entryFee={poolInfo.entryFee}
              totalSeats={poolInfo.totalSeats}
              programType="merkato"
              language={language}
              onSeatsSelected={handleSeatsSelected}
              onCancel={() => setShowSeatSelector(false)}
            />
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
                    <p className="font-semibold mb-2">{language === 'am' ? 'የክፍያ ዘዴዎች' : 'Payment Methods'}</p>
                    <p className="font-semibold">📱 TeleBirr: 0913277922</p>
                    <p className="font-semibold mt-2">🏦 CBE Bank: 1000601091686</p>
                    <p className="text-sm">{language === 'am' ? 'የሂሳብ ባለቤት:' : 'Account Name:'} NEGASSA HUNDESSA DUGA</p>
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

          {/* Ticket Display */}
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
                language={language}
              />
              <div className="text-center mt-4">
                <p className="text-sm text-yellow-600">
                  ⏳ {language === 'am' ? 'ይህ ያልተረጋገጠ ቲኬት ነው. ክፍያዎ ከተረጋገጠ በኋላ መቀመጫዎችዎ ይረጋገጣሉ.' : 'This is an UNVERIFIED ticket. Your seats will be confirmed after payment verification.'}
                </p>
                <button
                  onClick={handleCloseTicket}
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
