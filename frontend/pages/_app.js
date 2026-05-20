import '../styles/globals.css';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BackButton from '../components/BackButton';

const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });
const Footer = dynamic(() => import('../components/Footer'), { ssr: false });
const ChatBot = dynamic(() => import('../components/ChatBot'), { ssr: false });
const LanguageToggle = dynamic(() => import('../components/LanguageToggle'), { ssr: false });

const queryClient = new QueryClient();

// Pages where back button should NEVER appear (even global)
const HIDE_BACK_BUTTON = ['/', '/login', '/register'];

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [pageHasBackButton, setPageHasBackButton] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if the page component has a back button
    // This checks for both imported BackButton component and manual back buttons
    const checkForBackButton = () => {
      // Get the rendered HTML temporarily (not ideal but works)
      const tempDiv = document.createElement('div');
      // This is a simplified check - we'll use a better approach below
    };
    
    // Better approach: Check component's source code characteristics
    // Since we can't easily check rendered output, we'll use a different method
  }, [Component]);

  // Alternative: Add a flag in pageProps when page has its own back button
  // Pages can set this when they import their own BackButton
  const hasOwnBackButton = pageProps.hasBackButton === true;
  
  // Show global back button only if:
  // 1. Not on hidden pages (home, login, register)
  // 2. Page doesn't have its own back button
  const showGlobalBackButton = !HIDE_BACK_BUTTON.includes(router.pathname) && !hasOwnBackButton;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <>
          <Head>
            <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎁</text></svg>" />
          </Head>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-6">
              {/* Global Back Button - only if page doesn't have its own */}
              {showGlobalBackButton && <BackButton />}
              <Component {...pageProps} />
            </main>
            <Footer />
            <LanguageToggle />
            <ChatBot />
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          </div>
        </>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
