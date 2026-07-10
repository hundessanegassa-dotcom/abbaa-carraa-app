// pages/merkato-vip.js - FIXED LOGIN LOOP
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import NoSSR from '../components/NoSSR';
import TopCitySelector from '../components/TopCitySelector';
import { TIERS, getDrawScheduleText } from '../components/SeatSelector';
import SeatSelector from '../components/SeatSelector';
import CityTicket from '../components/CityTicket';

export default function MerkatoVIP() {
  const router = useRouter();
  const [language, setLanguage] = useState('am');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTiers, setShowTiers] = useState(true);
  const [showSeats, setShowSeats] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [participantId, setParticipantId] = useState(null);
  const [participantData, setParticipantData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
    checkUser();
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const checkUser = async () => {
    setCheckingUser(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // ✅ Check if there's a tier in the URL (from login redirect)
      const { tier } = router.query;
      if (user && tier && TIERS[tier]) {
        // User is logged in and there's a tier param - auto select
        setSelectedTierId(tier);
        setSelectedTier(TIERS[tier]);
        setShowTiers(false);
        setShowSeats(true);
        // Clean up URL
        router.replace('/merkato-vip', undefined, { shallow: true });
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleTierSelect = (tierId) => {
    if (!user) {
      const redirectUrl = `/merkato-vip?tier=${tierId}`;
      localStorage.setItem('abbaa_redirect_after_login', redirectUrl);
      sessionStorage.setItem('redirectAfterLogin', redirectUrl);
      toast.loading(language === 'am' ? 'እባክዎ ወደ ስርዓት ይግቡ...' : 'Please login...');
      router.push('/login');
      return;
    }
    setSelectedTierId(tierId);
    setSelectedTier(TIERS[tierId]);
    setShowTiers(false);
    setShowSeats(true);
  };

  // ... rest of functions (handleSeatsSelected, compressImage, handlePaymentSubmit, etc.)

  const handleSeatsSelected = async ({ seats, totalAmount, seatCount, tier }) => {
    const tierConfig = TIERS[tier];
    setLoading(true);
    
    try {
      const ticketNumber = `MK-${tier.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      const { data: participant, error } = await supabase
        .from('merkato_vip_participants')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          tier: tier,
          pool_type: tier,
          seat_numbers: seats,
          contribution_amount: totalAmount,
          prize_amount: tierConfig.prize,
          payment_status: 'pending',
          ticket_number: ticketNumber,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setParticipantId(participant.id);
      setSelectedSeats(seats);
      setShowSeats(false);
      setShowPayment(true);
      
      toast.success(language === 'am' ? 'መቀመጫዎች ተይዘዋል! እባክዎ ክፍያ ይፈጽሙ' : 'Seats reserved! Please complete payment.');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(language === 'am' ? 'መቀመጫዎችን ማስያዝ አልተቻለም' : 'Failed to reserve seats');
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
      toast.error(language === 'am' ? 'እባክዎ የክፍያ ማስረጃ ይስቀሉ' : 'Please upload payment screenshot');
      return;
    }
    
    setIsSubmitting(true);
    const loadingToast = toast.loading(language === 'am' ? 'የክፍያ ማስረጃ በላይናላይ ላይ እየተሰቀለ ነው...' : 'Uploading payment screenshot...');
    
    try {
      const compressedFile = await compressImage(selectedFile);
      const fileName = `merkato-payments/${participantId}/${Date.now()}.jpg`;
      
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
      
      toast.success(language === 'am' ? 'ክፍያ ተልኳል! ያልተረጋገጠ ቲኬትዎ ዝግጁ ነው' : 'Payment submitted! Your unverified ticket is ready', { id: loadingToast });
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || language === 'am' ? 'ክፍያ መላክ አልተቻለም' : 'Failed to submit payment', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSeats = () => {
    setShowSeats(false);
    setShowTiers(true);
  };

  const handleClosePayment = () => {
    setShowPayment(false);
    setShowSeats(true);
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
    router.push('/dashboard');
  };

  // Tier Selection UI
  const renderTierSelection = () => {
    if (!TIERS) {
      return (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold">
            {language === 'am' ? 'ስህተት: የደረጃ መረጃ አልተገኘም' : 'Error: Tier data not found'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {language === 'am' ? 'እባክዎ ገፁን እንደገና ያድሱ' : 'Please refresh the page'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            🔄 {language === 'am' ? 'ያድሱ' : 'Refresh'}
          </button>
        </div>
      );
    }

    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {tiers.map((tierId) => {
          const tier = TIERS[tierId];
          if (!tier) return null;
          
          return (
            <div
              key={tierId}
              className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition hover:scale-105 cursor-pointer border-2 hover:border-green-500"
              onClick={() => handleTierSelect(tierId)}
            >
              <div className={`bg-gradient-to-r ${tier.color} p-4 text-white text-center`}>
                <div className="text-4xl mb-2">{tier.icon}</div>
                <h3 className="font-bold text-xl">
                  {language === 'am' ? tier.labelAm : tier.labelEn}
                </h3>
                <span className="text-xs opacity-80">
                  {getDrawScheduleText(tierId, language)}
                </span>
              </div>
              
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{language === 'am' ? 'ክፍያ' : 'Entry'}</span>
                  <span className="font-semibold">ETB {tier.contribution.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{language === 'am' ? 'ሽልማት' : 'Prize'}</span>
                  <span className="font-bold text-green-600">ETB {tier.prize.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{language === 'am' ? 'መቀመጫዎች' : 'Seats'}</span>
                  <span className="font-semibold">{tier.seats.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{language === 'am' ? 'ኮሚሽን' : 'Commission'}</span>
                  <span className="text-orange-600 font-semibold">ETB {tier.commission.toLocaleString()}</span>
                </div>
                
                <button 
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold text-sm transition"
                  onClick={(e) => { e.stopPropagation(); handleTierSelect(tierId); }}
                >
                  {language === 'am' ? 'መቀመጫ ምረጥ' : 'Select Seats'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (checkingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <NoSSR>
      <>
        <Head>
          <title>Merkato VIP - Win up to 10M ETB | Abbaa Carraa</title>
        </Head>

        <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">🎫</span>
                <span className="font-bold text-white text-lg">Abbaa Carraa</span>
              </Link>
              <div className="flex items-center gap-3">
                <button onClick={toggleLanguage} className="bg-gray-700 text-white px-3 py-1 rounded-lg text-xs">
                  {language === 'am' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}
                </button>
                <TopCitySelector />
              </div>
            </div>
          </div>
        </nav>

        <div className="min-h-screen bg-gray-100">
          {/* Hero */}
          <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white py-12 text-center mx-4 mt-4 rounded-2xl shadow-2xl">
            <div className="text-6xl mb-3">🏪</div>
            <h1 className="text-4xl md:text-5xl font-bold">Merkato VIP</h1>
            <div className="text-emerald-300 font-bold text-xl mt-3">
              {language === 'am' 
                ? '✨ ዛሬ የመርካቶ ተሳታፊ ሚሊየነር እናድርገው! ✨'
                : '✨ Let\'s make a Merkato participant a millionaire today! ✨'}
            </div>
            <p className="text-gray-300 mt-3 text-lg">
              {language === 'am' 
                ? 'እስከ 10 ሚሊዮን ብር ለማሸነፍ መቀመጫዎን ይምረጡ' 
                : 'Select your seat to win up to 10 Million ETB'}
            </p>
          </div>

          {/* Tier Selection */}
          {showTiers && (
            <div className="container mx-auto px-4 py-8">
              <h2 className="text-2xl font-bold text-center mb-6">
                {language === 'am' ? 'የእርስዎን ደረጃ ይምረጡ' : 'Select Your Tier'}
              </h2>
              <p className="text-center text-gray-500 mb-8">
                {language === 'am' 
                  ? 'በጀትዎ እና በሚፈልጉት ሽልማት ላይ በመመስረት ይምረጡ' 
                  : 'Choose based on your budget and desired prize'}
              </p>
              {renderTierSelection()}
            </div>
          )}

          {/* Seat Selector */}
          {showSeats && selectedTier && (
            <SeatSelector
              isOpen={showSeats}
              onClose={handleCloseSeats}
              onCancel={handleCloseSeats}
              programType="merkato"
              tierId={selectedTierId}
              entryFee={selectedTier.contribution}
              totalSeats={selectedTier.seats}
              maxSeats={5}
              language={language}
              onSeatsSelected={handleSeatsSelected}
              poolInfo={{ prize: selectedTier.prize }}
            />
          )}

          {/* Payment */}
          {showPayment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
                  <h2 className="text-xl font-bold">{language === 'am' ? 'ክፍያ ያጠናቅቁ' : 'Complete Payment'}</h2>
                  <button onClick={handleClosePayment} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
                    <p className="text-sm text-gray-600">{language === 'am' ? 'የተመረጡ መቀመጫዎች' : 'Selected Seats'}</p>
                    <p className="font-bold">{selectedSeats.join(', ')}</p>
                    <p className="text-xl font-bold text-green-600 mt-2">
                      ETB {(selectedSeats.length * selectedTier.contribution).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedSeats.length} {language === 'am' ? 'መቀመጫ ×' : 'seats ×'} ETB {selectedTier.contribution.toLocaleString()}
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{language === 'am' ? 'ክፍያ ወደዚህ ይላኩ:' : 'Send payment to:'}</p>
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="font-semibold">📱 TeleBirr: 0913277922</p>
                    <p className="font-semibold mt-2">🏦 CBE Bank: 1000601091686</p>
                    <p className="text-sm text-gray-600 mt-2">{language === 'am' ? 'የሂሳብ ባለቤት:' : 'Account:'} Negassa Hundessa</p>
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
                          <p className="text-green-600 text-sm">✓ {language === 'am' ? 'ማስረጃ ተመርጧል' : 'Screenshot selected'}</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 mt-2">{language === 'am' ? 'የክፍያ ማስረጃ ለመጫን ጠቅ ያድርጉ' : 'Click to upload payment screenshot'}</p>
                          <p className="text-xs text-gray-400">JPEG, PNG (Max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  <button 
                    onClick={handlePaymentSubmit} 
                    disabled={isSubmitting || !selectedFile} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {isSubmitting ? 
                      (language === 'am' ? 'በሂደት ላይ...' : 'Processing...') : 
                      (language === 'am' ? 'ክፍያ አስገባ እና ቲኬት አግኝ' : 'Submit Payment & Get Ticket')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ticket */}
          {showTicket && participantData && (
            <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-md w-full">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex justify-between rounded-t-2xl">
                  <h3 className="text-white font-bold">
                    {language === 'am' ? 'የእርስዎ ቲኬት' : 'Your Ticket'}
                  </h3>
                  <button onClick={handleCloseTicket} className="text-white text-2xl">×</button>
                </div>
                <div className="p-6">
                  <CityTicket 
                    participant={participantData}
                    pool={selectedTier}
                    cityInfo={{ name: 'Merkato VIP', icon: '🏪' }}
                    type="unverified"
                    tierId={selectedTierId}
                    language={language}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    </NoSSR>
  );
}
