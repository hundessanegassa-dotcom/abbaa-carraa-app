import '../styles/globals.css';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';
import Head from 'next/head';
import useMediaQuery from '../hooks/useMediaQuery';
import LoadingSpinner from '../components/LoadingSpinner';

// Dynamic imports with error boundaries
const Navbar = dynamic(() => import('../components/Navbar').catch(() => () => <div>Navbar Error</div>), { ssr: false, loading: () => <div className="h-16 bg-gray-100 animate-pulse" /> });
const Footer = dynamic(() => import('../components/Footer').catch(() => () => null), { ssr: false });
const ChatBot = dynamic(() => import('../components/ChatBot').catch(() => () => null), { ssr: false });
const LanguageToggle = dynamic(() => import('../components/LanguageToggle').catch(() => () => null), { ssr: false });
const MobileBottomNav = dynamic(() => import('../components/MobileBottomNav').catch(() => () => null), { ssr: false });
const MobileHeader = dynamic(() => import('../components/MobileHeader').catch(() => () => <div className="h-14 bg-white" />), { ssr: false });

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
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Handle router loading states
  useEffect(() => {
    const handleStart = () => setRouterLoading(true);
    const handleComplete = () => setRouterLoading(false);
    const handleError = () => setRouterLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
    };
  }, [router]);

  // Set mounted with a safety timeout
  useEffect(() => {
    // Safety timeout - force mounted to true after 3 seconds
    const timeoutId = setTimeout(() => {
      if (!mounted) {
        console.warn('Forcing mounted state due to timeout');
        setMounted(true);
      }
    }, 3000);

    setMounted(true);
    
    return () => clearTimeout(timeoutId);
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
      '/merkato-vip': 'Merkato VIP',
    };
    return titles[path] || 'Abbaa Carraa';
  };

  // Show loading only during router navigation or before mount
  if (!mounted || routerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
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
            <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎁</text></svg>" />
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
            <meta name="theme-color" content="#059669" />
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
              }} 
            />
          </div>
        </>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
