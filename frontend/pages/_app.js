import '../styles/globals.css';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useMediaQuery from '../hooks/useMediaQuery';

const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });
const Footer = dynamic(() => import('../components/Footer'), { ssr: false });
const ChatBot = dynamic(() => import('../components/ChatBot'), { ssr: false });
const LanguageToggle = dynamic(() => import('../components/LanguageToggle'), { ssr: false });
const MobileBottomNav = dynamic(() => import('../components/MobileBottomNav'), { ssr: false });
const MobileHeader = dynamic(() => import('../components/MobileHeader'), { ssr: false });

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

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
    };
    return titles[path] || 'Abbaa Carraa';
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
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
          </Head>
          <div className="min-h-screen flex flex-col">
            {isMobile && !isAuthPage ? <MobileHeader title={title} /> : <Navbar />}
            <main className={`flex-grow ${isMobile && !isAuthPage ? 'pb-20' : ''}`}>
              <Component {...pageProps} />
            </main>
            <Footer />
            <LanguageToggle />
            <ChatBot />
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            {isMobile && !isAuthPage && <MobileBottomNav />}
          </div>
        </>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
