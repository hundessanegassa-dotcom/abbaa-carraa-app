// pages/become-creator.js - Landing Page for Becoming a Creator
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import NoSSR from '../components/NoSSR';
import TopCitySelector from '../components/TopCitySelector';

export default function BecomeCreator() {
  const router = useRouter();
  const [language, setLanguage] = useState('am');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

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
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check if user already has a creator profile
        const { data: creator } = await supabase
          .from('pool_creators')
          .select('verification_status')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (creator) {
          if (creator.verification_status === 'approved') {
            router.push('/creator/dashboard');
            return;
          } else if (creator.verification_status === 'pending') {
            router.push('/creator/pending');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const t = (am, en) => language === 'am' ? am : en;

  return (
    <NoSSR>
      <>
        <Head>
          <title>{t('🏪 የፑል ፈጣሪ ይሁኑ', '🏪 Become a Pool Creator')} - Abbaa Carraa</title>
          <meta name="description" content="Create your own prize pools and earn commission on Abbaa Carraa" />
        </Head>

        {/* Navbar */}
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
                {user ? (
                  <Link href="/dashboard" className="text-white hover:text-green-400 text-sm">Dashboard</Link>
                ) : (
                  <Link href="/login" className="text-white hover:text-green-400 text-sm">Login</Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-teal-700 text-white py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="text-6xl md:text-7xl mb-4">🏪</div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
              {t('የራስዎን የእጣ መደብ ይክፈቱ', 'Open Your Own Prize Pool Shop')}
            </h1>
            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
              {t(
                'ሰዎች እንዲቀላቀሉ ፑሎች ይፍጠሩ እና ኮሚሽን ያግኙ!',
                'Create pools for people to join and earn commission!'
              )}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {user ? (
                <Link
                  href="/creator/apply"
                  className="bg-white text-green-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl"
                >
                  {t('🚀 አሁን ያመልክቱ', '🚀 Apply Now')}
                </Link>
              ) : (
                <button
                  onClick={() => {
                    localStorage.setItem('redirectAfterLogin', '/creator/apply');
                    router.push('/login');
                  }}
                  className="bg-white text-green-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl"
                >
                  {t('🔐 ይግቡ እና ያመልክቱ', '🔐 Login & Apply')}
                </button>
              )}
              <Link
                href="/creator/directory"
                className="bg-white/20 backdrop-blur-sm border-2 border-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition transform hover:scale-105"
              >
                {t('👀 ፈጣሪዎችን ይመልከቱ', '👀 View Creators')}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="bg-gray-100 py-8 border-y border-gray-200">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-green-600">50+</p>
                <p className="text-sm text-gray-500">{t('ንቁ ፈጣሪዎች', 'Active Creators')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">500+</p>
                <p className="text-sm text-gray-500">{t('የተፈጠሩ ፑሎች', 'Pools Created')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">5M+</p>
                <p className="text-sm text-gray-500">{t('ጠቅላላ ስብስብ', 'Total Collection')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">10%</p>
                <p className="text-sm text-gray-500">{t('አማካይ ኮሚሽን', 'Average Commission')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {t('እንዴት እንደሚሰራ', 'How It Works')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center border border-gray-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">1</div>
              <h3 className="font-bold text-xl mb-2">{t('ፑል ይፍጠሩ', 'Create Your Pool')}</h3>
              <p className="text-gray-600">
                {t(
                  'ሽልማት፣ የመግቢያ ክፍያ እና መቀመጫዎችን ያዘጋጁ',
                  'Set prize, entry fee, and seats'
                )}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center border border-gray-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">2</div>
              <h3 className="font-bold text-xl mb-2">{t('ሰዎች ይቀላቀሉ', 'People Join')}</h3>
              <p className="text-gray-600">
                {t(
                  'ተሳታፊዎች መቀመጫ ይገዛሉ',
                  'Participants buy seats in your pool'
                )}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center border border-gray-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-yellow-600">3</div>
              <h3 className="font-bold text-xl mb-2">{t('ኮሚሽን ያግኙ', 'Earn Commission')}</h3>
              <p className="text-gray-600">
                {t(
                  'ከጠቅላላ ስብስብ ኮሚሽንዎን ያግኙ',
                  'Get your commission from total collection'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              {t('ለምን ፈጣሪ መሆን አለብዎት?', 'Why Become a Creator?')}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition text-center">
                <div className="text-4xl mb-3">💰</div>
                <h4 className="font-bold text-gray-800">{t('ኮሚሽን ያግኙ', 'Earn Commission')}</h4>
                <p className="text-sm text-gray-500 mt-2">
                  {t('ከእያንዳንዱ ፑል ኮሚሽን ያግኙ', 'Earn from every pool you create')}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h4 className="font-bold text-gray-800">{t('ሙሉ ቁጥጥር', 'Full Control')}</h4>
                <p className="text-sm text-gray-500 mt-2">
                  {t('ሽልማት፣ ክፍያ እና መቀመጫዎችን ይወስኑ', 'Set prizes, fees, and seats')}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition text-center">
                <div className="text-4xl mb-3">💳</div>
                <h4 className="font-bold text-gray-800">{t('ቀላል መውጫ', 'Easy Withdrawal')}</h4>
                <p className="text-sm text-gray-500 mt-2">
                  {t('ገንዘብዎን በማንኛውም ጊዜ ያውጡ', 'Withdraw your earnings anytime')}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition text-center">
                <div className="text-4xl mb-3">📊</div>
                <h4 className="font-bold text-gray-800">{t('ቀላል አስተዳደር', 'Easy Management')}</h4>
                <p className="text-sm text-gray-500 mt-2">
                  {t('ሁሉንም ነገር ከዳሽቦርድ ያስተዳድሩ', 'Manage everything from dashboard')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Example */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            {t('📊 የኮሚሽን ምሳሌ', '📊 Commission Example')}
          </h2>
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-8 border border-green-200">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-green-200">
                <span className="text-gray-600">{t('ጠቅላላ መቀመጫዎች', 'Total Seats')}</span>
                <span className="font-bold text-gray-800">2,000</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-green-200">
                <span className="text-gray-600">{t('የመግቢያ ክፍያ', 'Entry Fee')}</span>
                <span className="font-bold text-gray-800">ETB 100</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-green-200">
                <span className="text-gray-600">{t('ጠቅላላ ስብስብ', 'Total Collection')}</span>
                <span className="font-bold text-green-600">ETB 200,000</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-green-200">
                <span className="text-gray-600">{t('የመድረክ ክፍያ (10%)', 'Platform Fee (10%)')}</span>
                <span className="font-bold text-orange-600">ETB 20,000</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-green-200">
                <span className="text-gray-600">{t('ለበጎ አድራጎት (2%)', 'Charity (2%)')}</span>
                <span className="font-bold text-red-600">ETB 4,000</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-green-200">
                <span className="text-gray-600">{t('ግብር (2%)', 'Tax (2%)')}</span>
                <span className="font-bold text-red-600">ETB 4,000</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-green-200">
                <span className="text-gray-600">{t('የአሸናፊ ሽልማት', 'Winner Prize')}</span>
                <span className="font-bold text-blue-600">ETB 100,000</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-gray-800">{t('የፈጣሪ ገቢ', 'Creator Earnings')}</span>
                <span className="font-bold text-green-700 text-lg">ETB 72,000</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-100 rounded-lg text-center text-sm text-green-800">
              💡 {t('ፈጣሪው ከጠቅላላ ስብስብ ከተቀነሱ ክፍያዎች በኋላ የቀረውን ያገኛል', 'Creator gets everything remaining after all deductions')}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-teal-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              {t('ዛሬ የፑል ፈጣሪ ይሁኑ!', 'Become a Pool Creator Today!')}
            </h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto mb-8">
              {t(
                'የራስዎን ፑሎች ይፍጠሩ እና ኮሚሽን ማግኘት ይጀምሩ',
                'Create your own pools and start earning commission'
              )}
            </p>
            {user ? (
              <Link
                href="/creator/apply"
                className="inline-block bg-white text-green-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl"
              >
                {t('🚀 አሁን ያመልክቱ', '🚀 Apply Now')}
              </Link>
            ) : (
              <button
                onClick={() => {
                  localStorage.setItem('redirectAfterLogin', '/creator/apply');
                  router.push('/login');
                }}
                className="inline-block bg-white text-green-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl"
              >
                {t('🔐 ይግቡ እና ያመልክቱ', '🔐 Login & Apply')}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8">
          <div className="container mx-auto px-4 text-center text-sm">
            <p>© 2026 Abbaa Carraa. {t('ሁሉም መብቶች የተጠበቁ ናቸው', 'All rights reserved.')}</p>
            <p className="mt-1">
              {t('💚 2% ለበጎ አድራጎት • 2% ግብር', '💚 2% Charity • 2% Tax')}
            </p>
          </div>
        </footer>
      </>
    </NoSSR>
  );
}
