// pages/_app.js
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
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Handle initial loading screen - wait for component to mount first
  useEffect(() => {
    // Only start loading timer after component is mounted
    const timer = setTimeout(() => {
      setShowInitialLoading(false);
    }, 2500);
    
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
            <meta name="keywords" content="Ethiopian lottery, digital lottery, Abbaa Carraa, win prizes, Ethiopian games" />
            <meta name="author" content="Abbaa Carraa" />
            <meta property="og:title" content="Abbaa Carraa - Ethiopian Digital Lottery" />
            <meta property="og:description" content="Win amazing prizes and support charity in Ethiopia!" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
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
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
