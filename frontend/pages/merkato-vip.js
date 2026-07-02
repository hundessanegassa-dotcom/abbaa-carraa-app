// pages/merkato-vip.js - COMPLETE FIXED (Removed Duplicate Banner)
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import NoSSR from '../components/NoSSR';
import TopCitySelector from '../components/TopCitySelector';
import UnifiedAgentApplication from '../components/UnifiedAgentApplication';

// VIP Pools with 3 different colors for buttons
const vipPools = {
  daily: { 
    name: "ዕለታዊ ሚሊየነር | Daily Millionaire", 
    nameAm: "ዕለታዊ",
    nameEn: "Daily",
    tier: "ለሁሉም ኢትዮጵያዊ", frequency: "Daily", 
    contribution: "500", contributionFormatted: "500 ETB", prize: "1,000,000 ETB", prizeNumber: 1000000, 
    totalSeats: 2400, seatsPerRow: 20, rows: 120, time: "Every Day at 8:00 PM", 
    color: "from-blue-600 to-blue-800", icon: "⭐", 
    buttonColor: "bg-blue-500 hover:bg-blue-600",
    activeColor: "border-blue-500 bg-blue-50",
    textColor: "text-blue-600",
    description: "Start your day with a chance to become an instant millionaire!" 
  },
  weekly: { 
    name: "ሳምንታዊ ግዙፍ አሸናፊ | Weekly Mega Winner", 
    nameAm: "ሳምንታዊ",
    nameEn: "Weekly",
    tier: "VIP 2", frequency: "Weekly", 
    contribution: "2500", contributionFormatted: "2,500 ETB", prize: "10,000,000 ETB", prizeNumber: 10000000, 
    totalSeats: 4800, seatsPerRow: 20, rows: 240, time: "Every Sunday at 6:00 PM", 
    color: "from-green-600 to-green-800", icon: "🏆", 
    buttonColor: "bg-green-500 hover:bg-green-600",
    activeColor: "border-green-500 bg-green-50",
    textColor: "text-green-600",
    description: "Ten MILLION Birr changes everything!" 
  },
  monthly: { 
    name: "ወርሃዊ አሸናፊ | Monthly Winner", 
    nameAm: "ወርሃዊ",
    nameEn: "Monthly",
    tier: "VIP 1", frequency: "Monthly", 
    contribution: "5000", contributionFormatted: "5,000 ETB", prize: "40,000,000 ETB", prizeNumber: 40000000, 
    totalSeats: 9600, seatsPerRow: 20, rows: 480, time: "Last Day of Month at 8:00 PM", 
    color: "from-orange-600 to-orange-800", icon: "👑", 
    buttonColor: "bg-orange-500 hover:bg-orange-600",
    activeColor: "border-orange-500 bg-orange-50",
    textColor: "text-orange-600",
    description: "The ULTIMATE nationwide prize pool!" 
  }
};

export default function MerkatoVIP() {
  const router = useRouter();
  const [language, setLanguage] = useState('am');
  const [activeTab, setActiveTab] = useState('daily');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAgentApplication, setShowAgentApplication] = useState(false);

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
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleJoinPool = (poolType) => {
    if (!user) {
      const redirectUrl = `/merkato-seat?type=${poolType}`;
      localStorage.setItem('abbaa_redirect_after_login', redirectUrl);
      sessionStorage.setItem('redirectAfterLogin', redirectUrl);
      localStorage.setItem('pendingRole', 'individual');
      sessionStorage.setItem('pendingRole', 'individual');
      toast.loading(language === 'am' ? 'እባክዎ ወደ ስርዓት ይግቡ...' : 'Please login to join Merkato VIP...');
      router.push('/login');
      return;
    }
    router.push(`/merkato-seat?type=${poolType}`);
  };

  const PoolCard = ({ type, pool }) => {
    const isActive = activeTab === type;
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition hover:scale-105">
        <div className={`bg-gradient-to-r ${pool.color} p-6 text-white`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs opacity-80">{pool.tier}</p>
              <h3 className="text-2xl font-bold">{language === 'am' ? pool.nameAm : pool.nameEn}</h3>
            </div>
            <div className="text-5xl animate-bounce">{pool.icon}</div>
          </div>
          <div className="mt-4 flex justify-between">
            <div>
              <p className="text-sm opacity-80">{language === 'am' ? 'የመግቢያ ክፍያ' : 'Entry Fee'}</p>
              <p className="text-2xl font-bold">{pool.contributionFormatted}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">{language === 'am' ? 'ሽልማት' : 'Prize'}</p>
              <p className="text-2xl font-bold">{pool.prize}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              📅 {language === 'am' ? 'የእጣ ቀን:' : 'Draw:'} {pool.time}
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              💺 {language === 'am' ? 'ጠቅላላ መቀመጫዎች:' : 'Total Seats:'} {pool.totalSeats.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              👥 {language === 'am' ? 'የተሳታፊዎች ብዛት:' : 'Participants:'} {Math.floor(pool.totalSeats * 0.65).toLocaleString()}
            </div>
          </div>
          <button 
            onClick={() => handleJoinPool(type)} 
            className={`w-full ${pool.buttonColor} text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2`}
          >
            🎯 {language === 'am' ? 'መቀመጫ ምረጡ እና ይቀላቀሉ →' : 'Select Seat & Join →'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <NoSSR>
      <>
        <Head><title>Merkato VIP - Win 1M Daily, 10M Weekly, 40M Monthly | Abbaa Carraa</title></Head>
        
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">🎫</span>
                <span className="font-bold text-white text-lg">Abbaa Carraa</span>
              </Link>
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleLanguage} 
                  className="bg-gray-700 text-white px-3 py-1 rounded-lg text-xs hover:bg-gray-600 transition"
                >
                  {language === 'am' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}
                </button>
                <TopCitySelector />
              </div>
            </div>
          </div>
        </nav>

        <div className="min-h-screen bg-gray-100">
          {/* Language Toggle - Mobile */}
          <div className="container mx-auto px-4 pt-4 flex justify-end md:hidden">
            <button 
              onClick={toggleLanguage} 
              className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-medium hover:bg-gray-300 transition"
            >
              {language === 'am' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}
            </button>
          </div>

          {/* Hero Section */}
          <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white py-16 text-center mx-4 mt-4 rounded-2xl shadow-2xl">
            <div className="text-7xl mb-4 animate-bounce">🏪</div>
            <h1 className="text-4xl md:text-5xl font-bold">Merkato VIP</h1>
            <div className="text-emerald-300 font-bold text-xl mt-3">
              {language === 'am' 
                ? '✨ ዛሬ የመርካቶ ተሳታፊ ሚሊየነር እናድርገው! ✨'
                : '✨ Let\'s make a Merkato participant a millionaire today! ✨'}
            </div>
            <p className="text-gray-300 mt-3 text-lg">
              {language === 'am' 
                ? 'እስከ 40 ሚሊዮን ብር ለማሸነፍ መቀመጫዎን ይምረጡ' 
                : 'Select your seat to win up to 40 Million ETB'}
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="bg-blue-600/30 px-4 py-2 rounded-full text-sm">⭐ Daily 1M</div>
              <div className="bg-green-600/30 px-4 py-2 rounded-full text-sm">🏆 Weekly 10M</div>
              <div className="bg-orange-600/30 px-4 py-2 rounded-full text-sm">👑 Monthly 40M</div>
            </div>
          </div>

          {/* 3 Colorful Tabs */}
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <button 
                onClick={() => setActiveTab('daily')} 
                className={`px-8 py-4 rounded-full font-bold transition transform hover:scale-105 ${
                  activeTab === 'daily' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ⭐ {language === 'am' ? 'ዕለታዊ' : 'Daily'} <span className="text-sm opacity-80">(1M)</span>
              </button>
              <button 
                onClick={() => setActiveTab('weekly')} 
                className={`px-8 py-4 rounded-full font-bold transition transform hover:scale-105 ${
                  activeTab === 'weekly' 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/30' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🏆 {language === 'am' ? 'ሳምንታዊ' : 'Weekly'} <span className="text-sm opacity-80">(10M)</span>
              </button>
              <button 
                onClick={() => setActiveTab('monthly')} 
                className={`px-8 py-4 rounded-full font-bold transition transform hover:scale-105 ${
                  activeTab === 'monthly' 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                👑 {language === 'am' ? 'ወርሃዊ' : 'Monthly'} <span className="text-sm opacity-80">(40M)</span>
              </button>
            </div>

            {/* Pool Card */}
            <div className="max-w-4xl mx-auto">
              <PoolCard type={activeTab} pool={vipPools[activeTab]} />
            </div>
          </div>

          {/* Features Section */}
          <div className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
              {language === 'am' ? '🚀 ለምን መርካቶ ቪአይፒ?' : '🚀 Why Merkato VIP?'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition">
                <div className="text-5xl mb-3">💰</div>
                <h3 className="font-bold text-lg text-gray-800">
                  {language === 'am' ? 'ከፍተኛ ሽልማቶች' : 'Massive Prizes'}
                </h3>
                <p className="text-gray-600 text-sm mt-2">
                  {language === 'am' 
                    ? 'እስከ 40 ሚሊዮን ብር ለማሸነፍ እድል' 
                    : 'Win up to 40 Million ETB'}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition">
                <div className="text-5xl mb-3">🎯</div>
                <h3 className="font-bold text-lg text-gray-800">
                  {language === 'am' ? 'ቀላል እና ፈጣን' : 'Simple & Fast'}
                </h3>
                <p className="text-gray-600 text-sm mt-2">
                  {language === 'am' 
                    ? 'በደቂቃዎች ውስጥ ይቀላቀሉ እና ይከፈሉ' 
                    : 'Join and pay in minutes'}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition">
                <div className="text-5xl mb-3">🔒</div>
                <h3 className="font-bold text-lg text-gray-800">
                  {language === 'am' ? 'አስተማማኝ' : 'Secure'}
                </h3>
                <p className="text-gray-600 text-sm mt-2">
                  {language === 'am' 
                    ? 'በሱፓቤዝ የተጠበቀ እና የተረጋገጠ' 
                    : 'Supabase secured & verified'}
                </p>
              </div>
            </div>
          </div>

          {/* Become an Agent Section */}
          <div className="container mx-auto px-4 py-12">
            <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-6xl">🤝</span>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {language === 'am' ? 'የመርካቶ ወኪል ይሁኑ' : 'Become a Merkato Agent'}
                    </h3>
                    <p className="text-gray-300">
                      {language === 'am' 
                        ? 'በሚያመጧቸው ደንበኞች ሁሉ 10% ኮሚሽን ያግኙ!' 
                        : 'Earn 10% commission on every successful contribution!'}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs bg-green-600/30 rounded-full px-3 py-1">✓ Regular Pools</span>
                      <span className="text-xs bg-purple-600/30 rounded-full px-3 py-1">✓ City VIP</span>
                      <span className="text-xs bg-yellow-600/30 rounded-full px-3 py-1">✓ Merkato VIP</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAgentApplication(true)} 
                  className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition transform hover:scale-105"
                >
                  {language === 'am' ? 'እንደ ወኪል ያመልክቱ →' : 'Apply as Agent →'}
                </button>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl">💰</div>
                  <p className="font-semibold">{language === 'am' ? '10% ኮሚሽን' : '10% Commission'}</p>
                </div>
                <div>
                  <div className="text-3xl">🔗</div>
                  <p className="font-semibold">{language === 'am' ? 'ማጣቀሻ ሊንክ' : 'Referral Link'}</p>
                </div>
                <div>
                  <div className="text-3xl">💳</div>
                  <p className="font-semibold">{language === 'am' ? 'ቀላል መውጫ' : 'Easy Withdrawal'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="container mx-auto px-4 pb-12">
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <h3 className="text-2xl font-bold text-gray-800">
                {language === 'am' ? '🎯 ዛሬ መቀመጫዎን ይምረጡ' : '🎯 Select Your Seat Today'}
              </h3>
              <p className="text-gray-600 mt-2">
                {language === 'am' 
                  ? 'ከ2400 እስከ 9600 መቀመጫዎች አሉ - ፈጥነው ይምረጡ!' 
                  : 'From 2,400 to 9,600 seats available - Choose yours now!'}
              </p>
              <button 
                onClick={() => handleJoinPool(activeTab)} 
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition transform hover:scale-105"
              >
                {language === 'am' ? 'ወደ መቀመጫ ምርጫ ሂድ →' : 'Go to Seat Selection →'}
              </button>
            </div>
          </div>
        </div>

        {/* Agent Application Modal */}
        {showAgentApplication && (
          <UnifiedAgentApplication 
            onClose={() => setShowAgentApplication(false)} 
            preSelectedCity="Merkato" 
            preSelectedProgram="merkato_vip" 
          />
        )}
      </>
    </NoSSR>
  );
}
