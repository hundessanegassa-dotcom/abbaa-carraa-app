import '../styles/globals.css';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';
import Head from 'next/head';
import { useRouter } from 'next/router';  // Add this
import BackButton from '../components/BackButton';  // Add this

const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });
const Footer = dynamic(() => import('../components/Footer'), { ssr: false });
const ChatBot = dynamic(() => import('../components/ChatBot'), { ssr: false });
const LanguageToggle = dynamic(() => import('../components/LanguageToggle'), { ssr: false });

const queryClient = new QueryClient();

// Pages where back button should NOT appear
const HIDE_BACK_BUTTON = ['/', '/login', '/register'];

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const showBackButton = !HIDE_BACK_BUTTON.includes(router.pathname);

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
              {/* Global Back Button - shows automatically */}
              {showBackButton && <BackButton />}
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
