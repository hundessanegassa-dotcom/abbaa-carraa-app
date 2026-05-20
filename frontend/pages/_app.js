import '../styles/globals.css';
import { useState, useEffect, useRef } from 'react';
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

// Pages where back button should NEVER appear
const HIDE_BACK_BUTTON = ['/', '/login', '/register'];

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const [showGlobalBackButton, setShowGlobalBackButton] = useState(true);
  const router = useRouter();
  const containerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // After component renders, check if page already has a back button
  useEffect(() => {
    if (!mounted) return;
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Check if there's already a back button on the page
      const existingBackButton = document.querySelector('button');
      const hasBackButton = existingBackButton && 
                           existingBackButton.textContent?.includes('Back');
      
      // Also check for our BackButton component by looking for its specific classes
      const hasOurBackButton = document.querySelector('button.text-gray-500');
      
      if (hasBackButton || hasOurBackButton) {
        setShowGlobalBackButton(false);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [mounted, router.pathname]);

  const shouldShow = !HIDE_BACK_BUTTON.includes(router.pathname) && showGlobalBackButton;

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
            <main className="flex-grow container mx-auto px-4 py-6" ref={containerRef}>
              {shouldShow && <BackButton />}
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
