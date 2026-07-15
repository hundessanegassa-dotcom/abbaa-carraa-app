// pages/_app.js - OPTIMIZED WITH PWA, SEO, PERFORMANCE & TELEGRAM INTEGRATION
import '../styles/globals.css';
import { useState, useEffect, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';
import Head from 'next/head';
import useMediaQuery from '../hooks/useMediaQuery';
import LoadingScreen from '../components/LoadingScreen';
import SEO from '../components/SEO';

// ✅ Import Telegram Bot Client
import TelegramBotClient from '../components/TelegramBotClient';

// Dynamic imports with error boundaries and no SSR to prevent hydration issues
const Navbar = dynamic(() => import('../components/Navbar').catch(() => () => <div className="h-16 bg-gray-100 animate-pulse" />), { 
  ssr: false,
  loading: () => <div className="h-16 bg-gray-100 animate-pulse" /> 
});

const Footer = dynamic(() => import('../components/Footer').catch(() => () => null), { ssr: false });
const ChatBot = dynamic(() => import('../components/ChatBot').catch(() => () => null), { ssr: false });
const LanguageToggle = dynamic(() => import('../components/LanguageToggle').catch(() => () => null), { ssr: false });
const MobileBottomNav = dynamic(() => import('../components/MobileBottomNav').catch(() => () => null), { ssr: false });
const MobileHeader = dynamic(() => import('../components/MobileHeader').catch(() => () => <div className="h-14 bg-white" />), { ssr: false });

// Create queryClient outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const [routerLoading, setRouterLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [isTelegram, setIsTelegram] = useState(false);
  const [telegramUser, setTelegramUser] = useState(null);
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // ✅ Check if running inside Telegram
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for Telegram WebApp
      if (window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        const user = webApp.initDataUnsafe?.user;
        setIsTelegram(true);
        if (user) {
          setTelegramUser(user);
          // Save to sessionStorage for other components
          sessionStorage.setItem('telegram_user', JSON.stringify(user));
          sessionStorage.setItem('telegram_init_data', webApp.initData);
          sessionStorage.setItem('telegram_user_id', user.id);
        }
        // Expand the WebApp
        webApp.expand();
        console.log('📱 Running inside Telegram WebApp');
      }
      
      // Check URL params for Telegram (fallback)
      const urlParams = new URLSearchParams(window.location.search);
      const tgStart = urlParams.get('startapp');
      if (tgStart && tgStart.startsWith('telegram_')) {
        const tgUserId = tgStart.replace('telegram_', '');
        setIsTelegram(true);
        sessionStorage.setItem('telegram_user_id', tgUserId);
        console.log('📱 Telegram startapp param detected:', tgUserId);
      }
    }
  }, []);

  // Register Service Worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('✅ Service Worker registered:', reg))
        .catch(err => console.log('❌ Service Worker registration failed:', err));
    }
  }, []);

  // Handle initial loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle router loading states with React transition
  useEffect(() => {
    const handleStart = () => {
      startTransition(() => {
        setRouterLoading(true);
      });
    };
    const handleComplete = () => {
      startTransition(() => {
        setRouterLoading(false);
      });
    };
    const handleError = () => {
      startTransition(() => {
        setRouterLoading(false);
      });
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
    };
  }, [router, startTransition]);

  // Set mounted after component mounts (prevents hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🚀 ADDED: Unregister old service workers to prevent cache issues
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  const getPageTitle = () => {
    const path = router.pathname;
    const titles = {
      '/': 'Home',
      '/listings': 'Browse Pools',
      '/winners': 'Winners',
      '/dashboard': 'Dashboard',
      '/agent/dashboard': 'Agent Dashboard',
      '/vendor/dashboard': 'Vendor Dashboard',
      '/organization/dashboard': 'Organization Dashboard',
      '/admin/dashboard': 'Admin Panel',
      '/profile': 'Profile',
      '/settings': 'Settings',
      '/how-it-works': 'How It Works',
      '/faq': 'FAQ',
      '/about': 'About',
      '/contact': 'Contact',
      '/create-pool': 'Create Pool',
      '/register': 'Register',
      '/login': 'Login',
      '/auth/callback': 'Authenticating',
      '/merkato-vip': 'Merkato VIP',
      '/merkato-seat': 'Select Seats - Merkato VIP',
      '/cities': 'City VIP Programs',
      '/cities/seat': 'Select Seats - City VIP',
      '/payment/merkato': 'Payment - Merkato VIP',
      // ✅ Admin pages
      '/admin/dashboard': 'Admin Dashboard',
      '/admin/analytics': 'Admin Analytics',
      '/admin/draw-winner': 'Draw Winner',
      '/admin/verify-payments': 'Verify Payments',
      '/admin/announcements': 'Announcements',
      '/admin/applications': 'Applications',
      '/admin/bank-transfers': 'Bank Transfers',
      '/admin/logs': 'System Logs',
      '/admin/newsletter': 'Newsletter',
      '/admin/test-connections': 'Connection Test',
    };
    return titles[path] || 'Abbaa Carraa';
  };

  // Show initial loading screen first
  if (showInitialLoading) {
    return <LoadingScreen onLoadingComplete={() => setShowInitialLoading(false)} />;
  }

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  // Show loading during router navigation
  if (routerLoading || isPending) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-pulse">🎁</span>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-4 animate-pulse">
          {routerLoading ? 'Loading page...' : 'Processing...'}
        </p>
      </div>
    );
  }

  const title = getPageTitle();
  const isAuthPage = router.pathname === '/register' || router.pathname === '/login' || router.pathname === '/auth/callback';

  // Use SEO component for better meta tags
  const seoTitle = title === 'Home' ? undefined : title;

  // ✅ Wrap everything with TelegramBotClient
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <TelegramBotClient>
          <>
            <SEO title={seoTitle} />
            {/* ✅ Telegram Header Badge */}
            {isTelegram && (
              <div className="telegram-header bg-blue-600 text-white px-4 py-1.5 text-center text-xs flex items-center justify-center gap-2 shadow-md">
                <span>📱</span>
                <span>Connected via Telegram</span>
                {telegramUser && (
                  <span className="bg-blue-700 px-2 py-0.5 rounded-full text-[10px]">
                    @{telegramUser.username || telegramUser.id}
                  </span>
                )}
              </div>
            )}
            <div className="min-h-screen flex flex-col bg-gray-50">
              {!isAuthPage && (
                <>
                  {isMobile ? <MobileHeader title={title} /> : <Navbar />}
                </>
              )}
              <main className={`flex-grow ${isMobile && !isAuthPage ? 'pb-20' : ''}`}>
                <Component {...pageProps} />
              </main>
              {!isAuthPage && (
                <>
                  <Footer />
                  <LanguageToggle />
                  <ChatBot />
                  {isMobile && <MobileBottomNav />}
                </>
              )}
              <Toaster 
                position="top-right" 
                toastOptions={{ 
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                    borderRadius: '12px',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                    style: {
                      background: '#10b981',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                    style: {
                      background: '#ef4444',
                    },
                  },
                }} 
              />
            </div>
          </>
        </TelegramBotClient>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
