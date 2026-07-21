// pages/merkato-vip.js - COMPLETE WITH TICKET IMAGE COMPONENT
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import NoSSR from '../components/NoSSR';
import TopCitySelector from '../components/TopCitySelector';
import PoolProductCard from '../components/PoolProductCard';
import TicketImage from '../components/TicketImage';

// ✅ 5 TIERS FOR MERKATO VIP - 100, 500, 1000, 2500, 5000 BIRR
export const MERKATO_TIERS = {
  silver: {
    id: 'silver',
    labelEn: 'Silver',
    labelAm: 'ብር',
    icon: '🥈',
    contribution: 100,
    prize: 100000,      // ✅ 100,000 ETB
    seats: 1200,
    color: 'from-gray-400 to-gray-500',
    badge: 'Silver',
    tier: 1,
    image_url: '/images/merkato-silver.jpg',
    end_date: '2026-12-31T23:59:59'
  },
  gold: {
    id: 'gold',
    labelEn: 'Gold',
    labelAm: 'ወርቅ',
    icon: '🥇',
    contribution: 500,
    prize: 500000,      // ✅ 500,000 ETB
    seats: 1200,
    color: 'from-yellow-400 to-yellow-600',
    badge: 'Gold',
    tier: 2,
    image_url: '/images/merkato-gold.jpg',
    end_date: '2026-12-31T23:59:59'
  },
  platinum: {
    id: 'platinum',
    labelEn: 'Platinum',
    labelAm: 'ፕላቲኒየም',
    icon: '💎',
    contribution: 1000,
    prize: 2000000,     // ✅ 2,000,000 ETB
    seats: 2400,
    color: 'from-gray-300 to-blue-400',
    badge: 'Platinum',
    tier: 3,
    image_url: '/images/merkato-platinum.jpg',
    end_date: '2026-12-31T23:59:59'
  },
  diamond: {
    id: 'diamond',
    labelEn: 'Diamond',
    labelAm: 'አልማዝ',
    icon: '💠',
    contribution: 2500,
    prize: 5000000,     // ✅ 5,000,000 ETB
    seats: 2400,
    color: 'from-blue-400 to-cyan-400',
    badge: 'Diamond',
    tier: 4,
    image_url: '/images/merkato-diamond.jpg',
    end_date: '2026-12-31T23:59:59'
  },
  royal: {
    id: 'royal',
    labelEn: 'Royal',
    labelAm: 'ንጉሣዊ',
    icon: '👑',
    contribution: 5000,
    prize: 10000000,    // ✅ 10,000,000 ETB
    seats: 2400,
    color: 'from-purple-500 to-pink-500',
    badge: 'Royal',
    tier: 5,
    image_url: '/images/merkato-royal.jpg',
    end_date: '2026-12-31T23:59:59'
  }
};

// Helper function to get draw schedule text
function getDrawScheduleText(tierId, language) {
  const schedules = {
    silver: { en: 'Daily Draw', am: 'ዕለታዊ እጣ' },
    gold: { en: 'Daily Draw', am: 'ዕለታዊ እጣ' },
    platinum: { en: 'Weekly Draw', am: 'ሳምንታዊ እጣ' },
    diamond: { en: 'Weekly Draw', am: 'ሳምንታዊ እጣ' },
    royal: { en: 'Monthly Draw', am: 'ወርሃዊ እጣ' }
  };
  return schedules[tierId]?.[language] || schedules.silver[language];
}

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
  const [is3D, setIs3D] = useState(false);
  const [ticketVerified, setTicketVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
    checkUser();
  }, []);

  // Check ticket verification status periodically
  useEffect(() => {
    if (participantId && paymentSubmitted) {
      checkVerificationStatus();
      
      const interval = setInterval(checkVerificationStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [participantId, paymentSubmitted]);

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
      
      const { tier } = router.query;
      if (user && tier && MERKATO_TIERS[tier]) {
        setSelectedTierId(tier);
        setSelectedTier(MERKATO_TIERS[tier]);
        setShowTiers(false);
        setShowSeats(true);
        router.replace('/merkato-vip', undefined, { shallow: true });
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setCheckingUser(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (!participantId || checkingVerification) return;
    
    setCheckingVerification(true);
    try {
      const { data: participant, error } = await supabase
        .from('merkato_vip_participants')
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
        // Refresh participant data to get latest
        const { data: updatedParticipant } = await supabase
          .from('merkato_vip_participants')
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
    setSelectedTier(MERKATO_TIERS[tierId]);
    setShowTiers(false);
    setShowSeats(true);
  };

  const handleSeatsSelected = async ({ seats, totalAmount, seatCount, tier }) => {
    const tierConfig = MERKATO_TIERS[tier];
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
      setPaymentSubmitted(true);
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

  // Convert tier to pool format for PoolProductCard
  const convertTierToPool = (tierId, tier) => {
    return {
      id: tierId,
      prize_name: `${tier.icon} ${language === 'am' ? tier.labelAm : tier.labelEn} - Merkato VIP`,
      title: `${tier.icon} ${language === 'am' ? tier.labelAm : tier.labelEn}`,
      entry_fee: tier.contribution,
      target_amount: tier.prize,
      current_amount: 0,
      status: 'active',
      end_date: tier.end_date || '2026-12-31T23:59:59',
      image_url: tier.image_url || null,
      prize_image: tier.image_url || null,
      is_featured: tier.tier >= 4,
      description: `${getDrawScheduleText(tierId, language)} - ${language === 'am' ? 'እስከ' : 'Up to'} ETB ${tier.prize.toLocaleString()}`
    };
  };

  const renderTierSelection = () => {
    const tierIds = ['silver', 'gold', 'platinum', 'diamond', 'royal'];
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
        {tierIds.map((tierId) => {
          const tier = MERKATO_TIERS[tierId];
          if (!tier) return null;
          
          const poolData = convertTierToPool(tierId, tier);
          
          return (
            <div 
              key={tierId} 
              onClick={() => handleTierSelect(tierId)}
              className="cursor-pointer"
            >
              <PoolProductCard 
                pool={poolData}
                featured={tier.tier >= 4}
                language={language}
                show3D={false}
              />
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
          <title>Merkato VIP - Win up to 5M ETB | Abbaa Carraa</title>
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
                ? 'እስከ 5 ሚሊዮን ብር ለማሸነፍ መቀመጫዎን ይምረጡ' 
                : 'Select your seat to win up to 5 Million ETB'}
            </p>
          </div>

          {showTiers && (
            <div className="container mx-auto px-4 py-8">
              <h2 className="text-2xl font-bold text-center mb-4">
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

          {showSeats && selectedTier && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                  <h3 className="font-bold text-lg">
                    {language === 'am' ? 'መቀመጫ ምረጥ' : 'Select Seats'}
                  </h3>
                  <button onClick={handleCloseSeats} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                <div className="p-6">
                  <div className="text-center mb-4">
                    <p className="text-2xl">{selectedTier.icon}</p>
                    <p className="font-bold text-xl">
                      {language === 'am' ? selectedTier.labelAm : selectedTier.labelEn}
                    </p>
                    <p className="text-sm text-gray-500">
                      {language === 'am' ? 'እያንዳንዱ መቀመጫ' : 'Each seat'} ETB {selectedTier.contribution.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {language === 'am' ? 'ሽልማት' : 'Prize'} ETB {selectedTier.prize.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="border-t pt-4 mt-2">
                    <p className="text-center text-gray-500 text-sm">
                      {language === 'am' 
                        ? 'ለማስያዝ በቀጥታ መቀመጫ ቁጥሮችን ይተይቡ (ከ1 እስከ ' + selectedTier.seats + ')' 
                        : 'Enter seat numbers to reserve (1 to ' + selectedTier.seats + ')'}
                    </p>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {language === 'am' ? 'የመቀመጫ ቁጥሮች (በነጠላ ሰረዝ ይለያዩ)' : 'Seat Numbers (comma separated)'}
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                        placeholder={language === 'am' ? 'ለምሳሌ: 5, 12, 23' : 'Example: 5, 12, 23'}
                        onChange={(e) => {
                          const numbers = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                          setSelectedSeats(numbers);
                        }}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {language === 'am' ? 'ከፍተኛ 5 መቀመጫዎች' : 'Maximum 5 seats'}
                      </p>
                    </div>
                    
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{language === 'am' ? 'የተመረጡ መቀመጫዎች' : 'Selected Seats'}</span>
                        <span className="font-semibold">{selectedSeats.length > 0 ? selectedSeats.join(', ') : '-'}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-600">{language === 'am' ? 'ጠቅላላ ክፍያ' : 'Total Amount'}</span>
                        <span className="font-bold text-green-600">
                          ETB {(selectedSeats.length * selectedTier.contribution).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                      disabled={selectedSeats.length === 0}
                      onClick={() => {
                        if (selectedSeats.length === 0) {
                          toast.error(language === 'am' ? 'እባክዎ ቢያንስ አንድ መቀመጫ ይምረጡ' : 'Please select at least one seat');
                          return;
                        }
                        handleSeatsSelected({
                          seats: selectedSeats,
                          totalAmount: selectedSeats.length * selectedTier.contribution,
                          seatCount: selectedSeats.length,
                          tier: selectedTierId
                        });
                      }}
                    >
                      {language === 'am' ? 'መቀመጫዎችን አስይዝ' : 'Reserve Seats'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* ============================================
              TICKET DISPLAY - UPDATED WITH TicketImage
              ============================================ */}
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
                      prize_name: selectedTier ? 
                        `${selectedTier.icon} ${language === 'am' ? selectedTier.labelAm : selectedTier.labelEn}` : 
                        'Merkato VIP',
                      target_amount: selectedTier?.prize || 0,
                      prize: selectedTier?.prize || 0
                    }}
                    isVerified={ticketVerified || participantData.payment_status === 'verified'}
                    seatNumbers={selectedSeats}
                    ticketNumber={participantData.ticket_number}
                    amount={participantData.contribution_amount}
                    createdAt={participantData.created_at}
                    poolType="merkato"
                    show3D={is3D}
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
                  
                  {/* Verification Status Message */}
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
      </>
    </NoSSR>
  );
}
