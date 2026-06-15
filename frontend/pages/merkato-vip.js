// pages/merkato-vip.js - REDIRECT TO SEAT SELECTION
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function MerkatoVip() {
  const router = useRouter();

  useEffect(() => {
    window.location.href = '/merkato-seat?type=daily';
  }, []);

  return (
    <>
      <Head>
        <title>Redirecting to Merkato VIP Seat Selection...</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto"></div>
          <p className="mt-6 text-gray-700 font-medium">Redirecting to seat selection...</p>
        </div>
      </div>
    </>
  );
}
