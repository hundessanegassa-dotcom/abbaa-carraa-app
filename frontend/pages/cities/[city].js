
// pages/cities/[city].js - COMPLETE WITH 5 TIERS & UNLISTED CITY SUPPORT
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import NoSSR from '../../components/NoSSR';
import TopCitySelector from '../../components/TopCitySelector';
import UnifiedAgentApplication from '../../components/UnifiedAgentApplication';
import SeatSelector from '../../components/SeatSelector';
import CityTicket from '../../components/CityTicket';
import { TIERS, getDrawScheduleText, TIER_IDS, getTierLabel } from '../../components/SeatSelector';
// ✅ IMPORT FROM cityData
import { getCityData, getAllCities, addUnlistedCity, updateCityData } from '../../lib/cityData';

// ✅ Get city list from lib
const cityList = getAllCities();

export default function CityVip() {
  const router = useRouter();
  const { cityId } = router.query;
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
  const [cityInfo, setCityInfo] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAgentApplication, setShowAgentApplication] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [citySearchTerm, setCitySearchTerm] = useState('');

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
    if (cityId) {
      const data = getCityData(cityId);
      setCityInfo(data);
    }
    checkUser();
  }, [cityId]);

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
      if (user && tier && TIERS[tier]) {
        setSelectedTierId(tier);
        setSelectedTier(TIERS[tier]);
        setShowTiers(false);
        setShowSeats(true);
        router.replace(`/cities/${cityId}`, undefined, { shallow: true });
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleTierSelect = (tierId) => {
    if (!user) {
      const redirectUrl = `/cities/${cityId}?tier=${tierId}`;
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

  const handleSeatsSelected = async ({ seats, totalAmount, seatCount, tier }) => {
    const tierConfig = TIERS[tier];
    setLoading(true);
    
    try {
      const ticketNumber = `CT-${tier.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      const { data: participant, error } = await supabase
        .from('city_vip_participants')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          city: cityInfo?.name?.split('|')[0] || cityId || 'Unknown City',
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
      const fileName = `city-payments/${participantId}/${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, compressedFile);
      
      if (uploadError) throw new Error('Upload failed: ' + uploadError.message);
      
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
      
      if (updateError) throw updateError;
      
      const { data: updatedParticipant } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('id', participantId)
        .single();
      
      setParticipantData(updatedParticipant);
      setShowPayment(false);
      setShowTicket(true);
      
      toast.success(language === 'am' ? 'ክፍያ ተልኳል! ያልተረጋገጠ ቲኬትዎ ዝግጁ ነው' : 'Payment submitted! Your unverified ticket is ready', { id: loadingToast });
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || (language === 'am' ? 'ክፍያ መላክ አልተቻለም' : 'Failed to submit payment'), { id: loadingToast });
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

  const renderTierSelection = () => {
    const tierIds = ['silver', 'gold', 'platinum', 'diamond', 'royal'];
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
        {tierIds.map((tierId) => {
          const tier = TIERS[tierId];
          if (!tier) return null;
          
          return (
            <div
              key={tierId}
              className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition hover:scale-105 cursor-pointer border-2 hover:border-green-500"
              onClick={() => handleTierSelect(tierId)}
            >
              <div className={'bg-gradient-to-r ' + tier.color + ' p-4 text-white text-center'}>
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

  if (!cityInfo || checkingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">{language === 'am' ? 'ከተማ በመጫን ላይ...' : 'Loading city...'}</p>
        </div>
      </div>
    );
  }

  const cityName = cityInfo.name.split('|')[0].trim();
  const cityNameEn = cityInfo.name.split('|')[1]?.trim() || cityId;

  return (
    <NoSSR>
      <>
        <Head>
          <title>{cityName} VIP - Win up to 10M ETB | Abbaa Carraa</title>
          <meta name="description" content={`Join ${cityName} VIP program and win up to 10M ETB. 5 premium tiers available.`} />
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
          {/* City Selector Dropdown */}
          <div className="container mx-auto px-4 pt-4">
            <div className="relative">
              <button onClick={() => setShowCityDropdown(!showCityDropdown)} className="w-full md:w-auto bg-white border rounded-xl px-5 py-3 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cityInfo.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">{cityName}</div>
                    <div className="text-xs text-gray-500">{cityNameEn}</div>
                    {cityInfo.isUnlisted && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">🆕 New City</span>
                    )}
                  </div>
                </div>
                <svg className={'w-5 h-5 text-gray-400 transition-transform ' + (showCityDropdown ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCityDropdown && (
                <div className="absolute top-full left-0 mt-2 w-full md:w-96 bg-white rounded-2xl shadow-2xl border z-50 max-h-96 overflow-y-auto">
                  <div className="sticky top-0 bg-white p-3 border-b">
                    <input 
                      type="text" 
                      placeholder={language === 'am' ? 'ከተማ ፈልግ...' : 'Search city...'} 
                      className="w-full border rounded-lg px-4 py-2" 
                      value={citySearchTerm}
                      onChange={(e) => setCitySearchTerm(e.target.value)}
                    />
                  </div>
                  {cityList
                    .filter(c => c.name.toLowerCase().includes(citySearchTerm.toLowerCase()) || 
                               c.nameEn.toLowerCase().includes(citySearchTerm.toLowerCase()))
                    .slice(0, 20)
                    .map(c => (
                      <Link key={c.id} href={`/cities/${c.id}`} className={`city-item flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b cursor-pointer ${cityId === c.id ? 'bg-gray-100' : ''}`}>
                        <span className="text-2xl">{c.icon}</span>
                        <div>
                          <div className="font-medium text-gray-800">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.nameEn}</div>
                        </div>
                        {cityId === c.id && <span className="ml-auto text-green-600 text-sm">✓</span>}
                      </Link>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12 text-center mt-4 mx-4 rounded-2xl">
            <div className="text-6xl mb-3">{cityInfo.icon}</div>
            <h1 className="text-3xl md:text-4xl font-bold">{cityName} VIP</h1>
            {cityInfo.slogan && (
              <p className="text-gray-300 text-sm mt-1">{cityInfo.slogan}</p>
            )}
            <div className="text-emerald-300 font-bold text-lg mt-2">
              {language === 'am' 
                ? '✨ ዛሬ የከተማችንን ተሳታፊ ሚሊየነር እናድርገው! ✨'
                : '✨ Let\'s make our city participant a millionaire today! ✨'}
            </div>
            <p className="text-gray-200 mt-2">
              {language === 'am' ? 'እስከ 10 ሚሊዮን ብር ለማሸነፍ መቀመጫዎን ይምረጡ' : 'Select your seat to win up to 10 Million ETB'}
            </p>
            {cityInfo.isUnlisted && (
              <div className="mt-3 inline-block bg-yellow-500/20 text-yellow-300 px-4 py-1 rounded-full text-sm border border-yellow-500/30">
                🆕 {language === 'am' ? 'አዲስ ከተማ ተጨምሯል!' : 'New city added!'}
              </div>
            )}
          </div>

          {/* City Stats */}
          {(cityInfo.businesses !== 'N/A' || cityInfo.population !== 'N/A') && (
            <div className="container mx-auto px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cityInfo.businesses !== 'N/A' && (
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                    <p className="text-2xl font-bold text-gray-800">{cityInfo.businesses}</p>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'ንግዶች' : 'Businesses'}</p>
                  </div>
                )}
                {cityInfo.workers !== 'N/A' && (
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                    <p className="text-2xl font-bold text-gray-800">{cityInfo.workers}</p>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'ሰራተኞች' : 'Workers'}</p>
                  </div>
                )}
                {cityInfo.population !== 'N/A' && (
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                    <p className="text-2xl font-bold text-gray-800">{cityInfo.population}</p>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'ህዝብ' : 'Population'}</p>
                  </div>
                )}
                {cityInfo.region && (
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                    <p className="text-2xl font-bold text-gray-800">{cityInfo.region}</p>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'ክልል' : 'Region'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {showSeats && selectedTier && (
            <SeatSelector
              isOpen={showSeats}
              onClose={handleCloseSeats}
              onCancel={handleCloseSeats}
              programType="city"
              city={cityName || cityId || 'Unknown City'}
              tierId={selectedTierId}
              entryFee={selectedTier.contribution}
              totalSeats={selectedTier.seats}
              maxSeats={5}
              language={language}
              onSeatsSelected={handleSeatsSelected}
              poolInfo={{ prize: selectedTier.prize }}
            />
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
                    cityInfo={cityInfo}
                    type="unverified"
                    tierId={selectedTierId}
                    language={language}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Agent Application Section */}
          <div className="container mx-auto px-4 py-12">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">🤝</span>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {language === 'am' ? `የ${cityName} ወኪል ይሁኑ` : `Become an Agent for ${cityName}`}
                    </h3>
                    <p className="text-gray-300">
                      {language === 'am' ? 'በሚያመጧቸው ደንበኞች ሁሉ 10% ኮሚሽን ያግኙ!' : 'Earn 10% commission on every successful contribution!'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-green-600/30 rounded-full px-2 py-1">✓ Regular Pools</span>
                      <span className="text-xs bg-purple-600/30 rounded-full px-2 py-1">✓ City VIP</span>
                      <span className="text-xs bg-yellow-600/30 rounded-full px-2 py-1">✓ Merkato VIP</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowAgentApplication(true)} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
                  {language === 'am' ? 'እንደ ወኪል ያመልክቱ →' : 'Apply as Agent →'}
                </button>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div><div className="text-2xl">💰</div><p className="font-semibold">{language === 'am' ? '10% ኮሚሽን' : '10% Commission'}</p></div>
                <div><div className="text-2xl">🔗</div><p className="font-semibold">{language === 'am' ? 'ማጣቀሻ ሊንክ' : 'Referral Link'}</p></div>
                <div><div className="text-2xl">💳</div><p className="font-semibold">{language === 'am' ? 'ቀላል መውጫ' : 'Easy Withdrawal'}</p></div>
              </div>
            </div>
          </div>
        </div>

        {showAgentApplication && (
          <UnifiedAgentApplication 
            onClose={() => setShowAgentApplication(false)} 
            preSelectedCity={cityName || cityId || 'Unknown City'} 
            preSelectedProgram="city_vip" 
          />
        )}
      </>
    </NoSSR>
  );
}
