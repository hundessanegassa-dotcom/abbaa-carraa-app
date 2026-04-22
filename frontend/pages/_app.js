import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../lib/i18n';
import Footer from '../components/Footer';
import ChatBot from '../components/ChatBot';
import LanguageToggle from '../components/LanguageToggle';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-r from-green-700 to-blue-700 flex items-center justify-center z-50">
        <div className="text-center px-4">
          <img 
            src="/images/abbaa-carraa-banner-image.png"
            alt="Abbaa Carraa"
            className="w-40 h-40 sm:w-48 sm:h-48 object-cover rounded-2xl mx-auto mb-6 shadow-2xl animate-pulse"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Abbaa Carraa</h1>
          <p className="text-white/80 text-sm">ባላ ኢዲል</p>
          <div className="mt-6 flex justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} session={session} />
      <Footer />
      <LanguageToggle />
      <ChatBot />
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default MyApp;
