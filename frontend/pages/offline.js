// pages/offline.js - Offline fallback page (MUST be in pages folder)
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function Offline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">You are back online!</h1>
          <p className="text-gray-600 mb-6">Redirecting to homepage...</p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Offline - Abbaa Carraa</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">📡</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">You are offline</h1>
          <p className="text-gray-600 mb-6">
            Please check your internet connection and try again.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Try Again
          </button>
          
          <div className="mt-8 text-left">
            <p className="text-sm text-gray-500 mb-3">While offline, you can still:</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">✓ View previously loaded pages</li>
              <li className="flex items-center gap-2">✓ Check your tickets (if cached)</li>
              <li className="flex items-center gap-2">✓ Read about our programs</li>
            </ul>
          </div>
          
          <div className="mt-8 space-y-3">
            <Link href="/" className="block text-green-600 hover:underline">
              Return to Homepage →
            </Link>
            <Link href="/merkato-vip" className="block text-green-600 hover:underline">
              Merkato VIP Program →
            </Link>
            <Link href="/listings" className="block text-green-600 hover:underline">
              Browse Prize Pools →
            </Link>
            <Link href="/cities" className="block text-green-600 hover:underline">
              City VIP Programs →
            </Link>
          </div>
          
          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              💚 2% of every contribution supports kidney & heart disease patients in Ethiopia
            </p>
            <p className="text-xs text-gray-400 mt-2">
              📞 Need help? Call: 0930330323 / 0913277922
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
