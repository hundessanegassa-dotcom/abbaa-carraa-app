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
      <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-green-800 via-green-600 to-blue-800 flex items-center justify-center z-[9999]">
        <div className="text-center px-4 w-full">
          <div className="flex justify-center">
            <img 
              src="/images/abbaa-carraa-banner-image.png"
              alt="Abbaa Carraa"
              className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-2xl shadow-2xl animate-pulse"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-6 mb-2">Abbaa Carraa</h1>
          <p className="text-white/80 text-sm sm:text-base">ባላ ኢዲል</p>
          <div className="mt-8 flex justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-white/60 text-xs mt-8">Loading amazing prizes...</p>
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
