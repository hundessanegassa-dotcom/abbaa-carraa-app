export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import '../styles/globals.css';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';
import Head from 'next/head';

// Dynamically import components
const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });
const Footer = dynamic(() => import('../components/Footer'), { ssr: false });
const ChatBot = dynamic(() => import('../components/ChatBot'), { ssr: false });
const LanguageToggle = dynamic(() => import('../components/LanguageToggle'), { ssr: false });

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  // No mounted check - render immediately
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <>
          <Head>
            <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎁</text></svg>" />
            <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎁</text></svg>" />
          </Head>
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
        </>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
