// pages/merkato-vip.js - COMPLETE WITH 5 TIERS (NO IMAGES)
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import NoSSR from '../components/NoSSR';
import TopCitySelector from '../components/TopCitySelector';
import PoolCard from '../components/PoolCard'
import SeatCheckout from '../components/SeatCheckout';
import { TIERS as MERKATO_TIER_CONFIG, TIER_IDS, getDrawScheduleText } from '../lib/seatPrograms';

// Merkato VIP uses the shared tier configuration (single source of truth).
export const MERKATO_TIERS = MERKATO_TIER_CONFIG;

export default function MerkatoVIP() {
  const router = useRouter();
  const [language, setLanguage] = useState('am');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTiers, setShowTiers] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
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
      
      const { tier } = router.query;
      if (user && tier && MERKATO_TIERS[tier]) {
        setSelectedTierId(tier);
        setSelectedTier(MERKATO_TIERS[tier]);
        setShowTiers(false);
        setShowCheckout(true);
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
    setSelectedTier(MERKATO_TIERS[tierId]);
    setShowTiers(false);
    setShowCheckout(true);
  };

  const handleCheckoutClosed = () => {
    setShowCheckout(false);
    setShowTiers(true);
  };

  // Convert tier to pool format for PoolProductCard - NO IMAGES
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
      is_featured: tier.tier >= 4,
      description: `${getDrawScheduleText(tierId, language)} - ${language === 'am' ? 'እስከ' : 'Up to'} ETB ${tier.prize.toLocaleString()}`
    };
  };

  const renderTierSelection = () => {
    const tierIds = TIER_IDS;
    
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
             <PoolCard 
  pool={poolData}
  featured={tier.tier >= 4}
  language={language}
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

          {showCheckout && selectedTier && (
            <SeatCheckout
              programType="merkato"
              tierId={selectedTierId}
              entryFee={selectedTier.contribution}
              totalSeats={selectedTier.seats}
              prize={selectedTier.prize}
              poolName={`${selectedTier.icon} ${language === 'am' ? selectedTier.labelAm : selectedTier.labelEn} - Merkato VIP`}
              user={user}
              language={language}
              onClose={handleCheckoutClosed}
            />
          )}
        </div>
      </>
    </NoSSR>
  );
}
