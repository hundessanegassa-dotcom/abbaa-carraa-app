// pages/merkato-seat.js - Merkato VIP daily/weekly/monthly seat booking
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import SeatCheckout from '../components/SeatCheckout';
import { VIP_POOLS } from '../lib/seatPrograms';

const POOL_IDS = ['daily', 'weekly', 'monthly'];

const POOL_TITLES = {
  daily: { am: 'ዕለታዊ ሚሊየነር', en: 'Daily Millionaire' },
  weekly: { am: 'ሳምንታዊ ሜጋ አሸናፊ', en: 'Weekly Mega Winner' },
  monthly: { am: 'ወርሃዊ ሌጀንድ', en: 'Monthly Legend' }
};

export default function MerkatoSeat() {
  const router = useRouter();
  const { type } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('daily');
  const [showCheckout, setShowCheckout] = useState(false);
  const [language, setLanguage] = useState('am');

  const poolInfo = VIP_POOLS[selectedType] || VIP_POOLS.daily;
  const t = (am, en) => (language === 'am' ? am : en);

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') setLanguage(savedLang);
    checkUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (POOL_IDS.includes(type)) setSelectedType(type);
  }, [type]);

  const checkUser = async () => {
    try {
      const {
        data: { user: currentUser }
      } = await supabase.auth.getUser();

      if (!currentUser) {
        const currentUrl = `/merkato-seat?type=${selectedType}`;
        localStorage.setItem('abbaa_redirect_after_login', currentUrl);
        sessionStorage.setItem('redirectAfterLogin', currentUrl);
        localStorage.setItem('pendingRole', 'individual');
        sessionStorage.setItem('pendingRole', 'individual');
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      router.push('/login');
    }
  };

  const selectPool = poolId => {
    setSelectedType(poolId);
    setShowCheckout(false);
    router.replace(`/merkato-seat?type=${poolId}`, undefined, { shallow: true });
  };

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Merkato VIP - Select Seat | Abbaa Carraa</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-6 pb-32">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-between mb-4">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">
              ← {t('ተመለስ', 'Back')}
            </button>
            <button onClick={toggleLanguage} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
              {language === 'am' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border p-5 mb-6 text-center">
            <div className="text-4xl mb-2">🏛️</div>
            <h1 className="text-2xl font-bold">Merkato VIP</h1>
            <p className="text-gray-500 text-sm mt-1">
              {t('እስከ 40 ሚሊዮን ብር ለማሸነፍ መቀመጫዎን ይምረጡ', 'Select your seat to win up to 40 Million ETB')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {POOL_IDS.map(poolId => {
              const option = VIP_POOLS[poolId];
              const active = selectedType === poolId;
              return (
                <button
                  key={poolId}
                  onClick={() => selectPool(poolId)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    active ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="text-lg font-bold">
                    {option.icon} {t(POOL_TITLES[poolId].am, POOL_TITLES[poolId].en)}
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">ETB {option.contribution.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t(`${option.prize.toLocaleString()} ብር ያሸንፉ`, `Win ${option.prize.toLocaleString()} ETB`)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {t('ጠቅላላ መቀመጫዎች', 'Total seats')}: {option.seats.toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowCheckout(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-semibold text-lg transition"
          >
            🎯 {t('መቀመጫ ይምረጡ', 'Select your seats')} (ETB {poolInfo.contribution.toLocaleString()})
          </button>

          {showCheckout && (
            <SeatCheckout
              programType="merkato"
              tierId={selectedType}
              entryFee={poolInfo.contribution}
              totalSeats={poolInfo.seats}
              prize={poolInfo.prize}
              poolName={`Merkato VIP - ${t(POOL_TITLES[selectedType].am, POOL_TITLES[selectedType].en)}`}
              user={user}
              language={language}
              onClose={() => setShowCheckout(false)}
            />
          )}
        </div>
      </div>
    </>
  );
}
