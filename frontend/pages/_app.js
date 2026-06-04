
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
import LoadingSpinner from '../components/LoadingSpinner';

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

// Simple loading screen component without complex animations to avoid hydration issues
function SimpleLoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="relative">
        {/* Main rotating object */}
        <div className="w-24 h-24 relative animate-spin-slow">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute inset-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-full opacity-40 animate-ping"></div>
          <div className="absolute inset-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
            <span className="text-3xl">🎁</span>
          </div>
        </div>
        
        {/* Rotating ring */}
        <div className="absolute -inset-4 border-4 border-green-200 rounded-full animate-spin-slow"></div>
        <div className="absolute -inset-8 border-4 border-teal-200 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>
      </div>
      
      <div className="mt-8 text-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          Abbaa Carraa
        </h1>
        <p className="text-gray-500 text-sm mt-2">ዕድል ለሁሉም | Chance for All</p>
      </div>
      
      <div className="mt-6 flex gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
      
      <p className="text-xs text-gray-400 mt-6">Loading amazing experiences...</p>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        .animate-bounce { animation: bounce 0.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const [routerLoading, setRouterLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Handle initial loading screen - wait for component to mount first
  useEffect(() => {
    // Only start loading timer after component is mounted
    const timer = setTimeout(() => {
      setShowInitialLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle router loading states with React 19 transition
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

  const getPageTitle = () => {
    const path = router.pathname;
    const titles = {
      '/': '',
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
    };
    return titles[path] || 'Abbaa Carraa';
  };

  // Show initial loading screen first
  if (showInitialLoading) {
    return <SimpleLoadingScreen />;
  }

  // Don't show loading during router navigation for better UX (use skeleton instead)
  // Only show loader for actual page transitions
  if (!mounted) {
    return null;
  }

  const title = getPageTitle();
  const isAuthPage = router.pathname === '/register' || router.pathname === '/login' || router.pathname === '/auth/callback';

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <>
          <Head>
            <title>{title ? `${title} | Abbaa Carraa` : 'Abbaa Carraa - Ethiopian Digital Lottery'}</title>
            <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎁</text></svg>" />
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
            <meta name="theme-color" content="#059669" />
            <meta name="description" content="Abbaa Carraa - Ethiopian Digital Lottery Platform. Win amazing prizes, support charity, and get your chance to become a millionaire!" />
          </Head>
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
                },
                success: {
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
              }} 
            />
          </div>
        </>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
