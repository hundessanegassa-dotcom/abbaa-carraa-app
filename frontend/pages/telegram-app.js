// pages/telegram-app.js - NEW (Mini App Entry Point)
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import NoSSR from '../components/NoSSR';
import TelegramBotClient, { useTelegram } from '../components/TelegramBotClient';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import TopCitySelector from '../components/TopCitySelector';
import PoolCard from '../components/PoolCard';

export default function TelegramApp() {
  const router = useRouter();
  const { user: tgUser, isReady } = useTelegram();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [language, setLanguage] = useState('am');

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  // Authenticate user when Telegram user is available
  useEffect(() => {
    if (isReady && tgUser) {
      authenticateUser(tgUser);
    } else if (isReady && !tgUser) {
      // Not in Telegram context, redirect to main app
      router.push('/');
    }
  }, [isReady, tgUser]);

  // Load pools after authentication
  useEffect(() => {
    if (user) {
      loadPools();
    }
  }, [user]);

  const authenticateUser = async (tgUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          telegram_id: tgUser.id,
          telegram_username: tgUser.username,
          full_name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
          email: `${tgUser.username || tgUser.id}@telegram.user`,
          updated_at: new Date().toISOString()
        }, { onConflict: 'telegram_id' })
        .select()
        .single();

      if (error) throw error;
      setUser(data);
      
      // Check if user has pending actions from URL
      const { tier, program } = router.query;
      if (tier && program) {
        router.push(`/${program}?tier=${tier}`);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Failed to authenticate with Telegram');
    } finally {
      setLoading(false);
    }
  };

  const loadPools = async () => {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPools(data || []);
      setFeaturedPools(data?.filter(p => p.is_featured) || []);
    } catch (error) {
      console.error('Error loading pools:', error);
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <NoSSR>
      <Head>
        <title>Abbaa Carraa - Telegram Mini App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#16a34a" />
      </Head>
      
      <TelegramBotClient>
        <div className="min-h-screen bg-gray-50 pb-20">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎫</span>
                <span className="font-bold text-lg text-gray-800">Abbaa Carraa</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleLanguage}
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full text-xs font-medium transition"
                >
                  {language === 'am' ? '🇬🇧 EN' : '🇪🇹 አማ'}
                </button>
                <Link href="/dashboard" className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  {user?.full_name?.[0]?.toUpperCase() || tgUser?.first_name?.[0]?.toUpperCase() || 'U'}
                </Link>
              </div>
            </div>
          </header>

          {/* Welcome */}
          <div className="px-4 py-4 bg-white border-b border-gray-100">
            <p className="text-sm text-gray-500">Welcome back,</p>
            <p className="text-xl font-bold text-gray-800">
              {user?.full_name || tgUser?.first_name || 'Guest'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 px-4 py-4">
            <Link href="/merkato-vip" className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100 hover:shadow-md transition">
              <span className="text-3xl block mb-1">🏪</span>
              <span className="text-xs font-bold text-gray-700">Merkato VIP</span>
            </Link>
            <Link href="/cities" className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100 hover:shadow-md transition">
              <span className="text-3xl block mb-1">🏙️</span>
              <span className="text-xs font-bold text-gray-700">City VIP</span>
            </Link>
            <Link href="/listings" className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100 hover:shadow-md transition">
              <span className="text-3xl block mb-1">🏊</span>
              <span className="text-xs font-bold text-gray-700">Regular Pools</span>
            </Link>
            <Link href="/dashboard" className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100 hover:shadow-md transition">
              <span className="text-3xl block mb-1">📊</span>
              <span className="text-xs font-bold text-gray-700">My Tickets</span>
            </Link>
          </div>

          {/* Featured Pools */}
          {featuredPools.length > 0 && (
            <div className="px-4 py-2">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">⭐ Featured Pools</h2>
              <div className="flex overflow-x-auto gap-4 pb-3 snap-x snap-mandatory scrollbar-hide">
                {featuredPools.map((pool) => (
                  <div key={pool.id} className="min-w-[250px] max-w-[250px] snap-start flex-shrink-0">
                    <PoolCard pool={pool} featured={true} language={language} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Pools */}
          <div className="px-4 py-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">🏊 Regular Pools</h2>
            {pools.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <div className="text-4xl mb-2">🏊</div>
                <p className="text-gray-500 text-sm">No active pools at the moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pools.slice(0, 3).map((pool) => (
                  <PoolCard key={pool.id} pool={pool} featured={false} language={language} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Nav */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-4 z-40 shadow-lg">
            <Link href="/telegram-app" className="flex flex-col items-center text-green-600">
              <span className="text-2xl">🏠</span>
              <span className="text-[10px] font-bold">Home</span>
            </Link>
            <Link href="/listings" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-2xl">🎁</span>
              <span className="text-[10px] font-bold">Pools</span>
            </Link>
            <Link href="/winners" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-2xl">🏆</span>
              <span className="text-[10px] font-bold">Winners</span>
            </Link>
            <Link href="/dashboard" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-2xl">👤</span>
              <span className="text-[10px] font-bold">Profile</span>
            </Link>
          </nav>

          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </div>
      </TelegramBotClient>
    </NoSSR>
  );
}
