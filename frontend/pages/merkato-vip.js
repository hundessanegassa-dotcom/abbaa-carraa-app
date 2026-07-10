// pages/merkato-vip.js - COMPLETE WITH PROPER IMPORTS
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import NoSSR from '../components/NoSSR';
import TopCitySelector from '../components/TopCitySelector';
import { TIERS, getDrawScheduleText } from '../components/SeatSelector'; // ✅ Correct import
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

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
    checkUser();
  }, []);

  // ✅ Add console log to debug
  useEffect(() => {
    console.log('TIERS loaded:', TIERS);
    console.log('TIERS keys:', Object.keys(TIERS || {}));
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
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

  // Tier Selection UI
  const renderTierSelection = () => {
    // ✅ Check if TIERS exists
    if (!TIERS || typeof TIERS !== 'object') {
      console.error('TIERS is undefined or not an object:', TIERS);
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
          if (!tier) {
            console.warn(`Tier ${tierId} not found in TIERS`);
            return null;
          }
          
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

  // Return statement with renderTierSelection
  return (
    <NoSSR>
      <>
        <Head>
          <title>Merkato VIP - Win up to 10M ETB | Abbaa Carraa</title>
        </Head>

        {/* Navigation */}
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

          {/* Seat Selector, Payment, Ticket - keep as before */}
          {/* ... rest of the code */}
        </div>
      </>
    </NoSSR>
  );
}
