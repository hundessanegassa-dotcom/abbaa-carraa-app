import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '../lib/i18n';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChatBot from '../components/ChatBot';
import LanguageToggle from '../components/LanguageToggle';
// import GlobalAnnouncement from '../components/GlobalAnnouncement'; // REMOVED - Duplicate welcome banner

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  const { t } = useTranslation();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-green-800 via-green-600 to-blue-800 flex items-center justify-center z-[9999]">
        <div className="text-center px-4 w-full">
          <div className="flex justify-center">
            <img 
              src="/images/abbaa carraa.png"
              alt="Abbaa Carraa Ethio"
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 object-cover rounded-2xl shadow-2xl animate-pulse"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-4 sm:mt-6 mb-1 sm:mb-2">Abbaa Carraa Ethio</h1>
          <p className="text-white/80 text-xs sm:text-sm md:text-base">{t('common.loading') || 'Loading...'}</p>
          <div className="mt-6 sm:mt-8 flex justify-center gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-white/60 text-[10px] sm:text-xs mt-6 sm:mt-8">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        {/* Navbar */}
        <Navbar />
        
        {/* Main Content */}
        <main className="flex-grow">
          <Component {...pageProps} />
        </main>
        
        {/* Footer */}
        <Footer />
        
        {/* Floating Components */}
        <LanguageToggle />
        <ChatBot />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </div>
    </QueryClientProvider>
  );
}

export default MyApp;
