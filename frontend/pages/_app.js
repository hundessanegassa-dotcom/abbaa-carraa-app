import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n, { initI18n } from '../lib/i18n';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChatBot from '../components/ChatBot';
import LanguageToggle from '../components/LanguageToggle';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    // Initialize i18n on client side only
    const init = async () => {
      initI18n();
      setI18nReady(true);
      setMounted(true);
      
      // Get session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);

  if (!mounted || loading || !i18nReady) {
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
            <Component {...pageProps} session={session} />
          </main>
          <Footer />
          <LanguageToggle />
          <ChatBot />
          <Toaster position="top-right" />
        </div>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
