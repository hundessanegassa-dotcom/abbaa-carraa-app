// pages/creator/pending.js - Pending Approval Page
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import NoSSR from '../../components/NoSSR';

export default function CreatorPending() {
  const router = useRouter();
  const [language, setLanguage] = useState('am');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
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
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(profileData);

      // Check application status
      const { data: creator } = await supabase
        .from('pool_creators')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!creator) {
        router.push('/creator/apply');
        return;
      }

      if (creator.verification_status === 'approved') {
        router.push('/creator/dashboard');
        return;
      }

      setApplication(creator);

      // Start checking status periodically
      const interval = setInterval(checkStatus, 30000);
      return () => clearInterval(interval);

    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!user || checkingStatus) return;
    
    setCheckingStatus(true);
    try {
      const { data: creator } = await supabase
        .from('pool_creators')
        .select('verification_status')
        .eq('user_id', user.id)
        .single();

      if (creator?.verification_status === 'approved') {
        toast.success(language === 'am' 
          ? '✅ ማመልከቻዎ ጸድቋል! ወደ ዳሽቦርድ ይሂዱ' 
          : '✅ Your application is approved! Go to dashboard');
        router.push('/creator/dashboard');
        return;
      }

      if (creator?.verification_status === 'rejected') {
        toast.error(language === 'am' 
          ? '❌ ማመልከቻዎ ውድቅ ተደርጓል. እባክዎ እንደገና ያመልክቱ' 
          : '❌ Your application was rejected. Please reapply');
        router.push('/creator/apply');
        return;
      }

    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const t = (am, en) => language === 'am' ? am : en;

  if (loading) {
    return <LoadingSpinner fullPage message={t('በመጫን ላይ...', 'Loading...')} />;
  }

  return (
    <NoSSR>
      <>
        <Head>
          <title>{t('ማመልከቻ በጥቅስ ላይ', 'Application Pending')} - Abbaa Carraa</title>
        </Head>

        <DashboardLayout
          title={t('⏳ ማመልከቻ በጥቅስ ላይ', '⏳ Application Pending')}
          subtitle={t('እባክዎ ይጠብቁ, አስተዳዳሪዎቻችን ማመልከቻዎን እየገመገሙ ነው', 'Please wait, our admins are reviewing your application')}
          icon="⏳"
          bgGradient="from-yellow-500 to-orange-500"
          user={user}
          profile={profile}
          language={language}
          toggleLanguage={toggleLanguage}
        >
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              {/* Status Icon */}
              <div className="relative inline-block">
                <div className="text-7xl mb-4">⏳</div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {t('ማመልከቻዎ በጥቅስ ላይ ነው', 'Your Application is Pending')}
              </h2>
              
              <p className="text-gray-500 mb-6">
                {t(
                  'እባክዎ ይጠብቁ. አስተዳዳሪዎቻችን ማመልከቻዎን እየገመገሙ ነው. በ24 ሰዓታት ውስጥ ይመልሱልዎታል.',
                  'Please wait. Our admins are reviewing your application. They will respond within 24 hours.'
                )}
              </p>

              {/* Application Details */}
              {application && (
                <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-500">{t('የመደብር ስም', 'Shop Name')}</span>
                    <span className="font-medium text-gray-800">{application.business_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-500">{t('ሙሉ ስም', 'Full Name')}</span>
                    <span className="font-medium text-gray-800">{application.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-500">{t('ስልክ', 'Phone')}</span>
                    <span className="font-medium text-gray-800">{application.phone}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">{t('ሁኔታ', 'Status')}</span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      {t('በጥቅስ ላይ', 'Pending')}
                    </span>
                  </div>
                </div>
              )}

              {/* Loading Animation */}
              <div className="flex justify-center gap-2 mb-4">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>

              <p className="text-sm text-gray-400">
                {t('በቅርቡ ያግኙን', 'We\'ll get back to you soon')}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <button
                  onClick={checkStatus}
                  disabled={checkingStatus}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {checkingStatus ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {t('በማጣራት ላይ...', 'Checking...')}
                    </div>
                  ) : (
                    t('🔄 ሁኔታ አረጋግጥ', '🔄 Check Status')
                  )}
                </button>

                <Link
                  href="/dashboard"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  {t('📊 ወደ ዳሽቦርድ', '📊 Go to Dashboard')}
                </Link>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-left">
                <p className="text-sm text-blue-700 font-medium mb-1">💡 {t('ምክር', 'Tip')}</p>
                <p className="text-xs text-blue-600">
                  {t(
                    'እባክዎ ማመልከቻዎ እየተገመገመ ባለበት ጊዜ የፑል ፈጣሪ ስለ መሆን ያንብቡ እና ያዘጋጁ.',
                    'While waiting for approval, read about being a creator and prepare your first pool.'
                  )}
                </p>
                <Link href="/become-creator#how-it-works" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                  {t('📖 እንዴት እንደሚሰራ ይወቁ →', '📖 Learn how it works →')}
                </Link>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </>
    </NoSSR>
  );
}
