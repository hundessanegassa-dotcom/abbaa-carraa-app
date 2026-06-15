// pages/merkato-vip.js - COMPLETE REDIRECT TO SEAT SELECTION
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function MerkatoVip() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the simplified seat selection page with daily as default
    window.location.href = '/merkato-seat?type=daily';
  }, []);

  return (
    <>
      <Head>
        <title>Redirecting to Merkato VIP Seat Selection | Abbaa Carraa</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content="Redirecting to Merkato VIP seat selection..." />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto"></div>
          <p className="mt-6 text-gray-700 font-medium text-lg">Redirecting to seat selection...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait...</p>
          <button 
            onClick={() => window.location.href = '/merkato-seat?type=daily'}
            className="mt-6 text-emerald-600 hover:text-emerald-700 underline text-sm"
          >
            Click here if not redirected automatically
          </button>
        </div>
      </div>
    </>
  );
}
