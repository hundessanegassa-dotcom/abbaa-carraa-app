import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../lib/i18n';
import PushNotification from '../components/PushNotification';
import Banner from '../components/Banner';
import Footer from '../components/Footer';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Banner />
      <Component {...pageProps} session={session} />
      <Footer />
      <Toaster position="top-right" />
      <PushNotification />
    </QueryClientProvider>
  );
}

export default MyApp;
