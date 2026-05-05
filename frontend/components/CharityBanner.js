import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CharityBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check localStorage only once on mount
    const dismissedBanner = localStorage.getItem('charity-banner-dismissed');
    if (dismissedBanner === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('charity-banner-dismissed', 'true');
  };

  // Don't hide on server, only on client if dismissed
  if (isClient && dismissed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-pink-500 to-red-600 text-white" style={{ minHeight: '44px', display: 'block' }}>
      <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="text-sm">❤️</span>
          <span className="text-sm">💚</span>
          <span className="text-sm">❤️</span>
        </div>
        <div className="text-center text-xs">
          <span className="font-bold">2% of income</span>
          <span> → </span>
          <span>Fighting kidney & heart disease</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/about#charity" className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full text-xs">
            Join →
          </Link>
          <button 
            onClick={handleDismiss} 
            className="text-white/70 hover:text-white text-sm px-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
