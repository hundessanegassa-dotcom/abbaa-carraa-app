import '../styles/globals.css';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

// Dynamically import components that use browser-only APIs (prevents SSR hydration errors)
const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });
const Footer = dynamic(() => import('../components/Footer'), { ssr: false });
const ChatBot = dynamic(() => import('../components/ChatBot'), { ssr: false });
const LanguageToggle = dynamic(() => import('../components/LanguageToggle'), { ssr: false });

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return loading state during SSR to prevent hydration mismatches
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Component {...pageProps} />
          </main>
          <Footer />
          <LanguageToggle />
          <ChatBot />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </div>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
