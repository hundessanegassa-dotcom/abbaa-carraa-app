import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CharityBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissedBanner = localStorage.getItem('charity-banner-dismissed');
    if (dismissedBanner === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setIsVisible(false);
    localStorage.setItem('charity-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-pink-500 to-red-600 text-white z-50 relative">
      <div className="relative">
        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
        
        {/* Increased padding for mobile, simplified layout */}
        <div className="px-3 py-2 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm">
            {/* Icons row */}
            <div className="flex items-center gap-1 order-1 sm:order-1">
              <span className="text-base sm:text-lg animate-pulse">❤️</span>
              <span className="text-base sm:text-lg">💚</span>
              <span className="text-base sm:text-lg animate-pulse">❤️</span>
            </div>
            
            {/* Text - simplified for mobile */}
            <div className="text-center order-2 sm:order-2">
              <span className="font-bold text-white">2% of ALL income</span>
              <span className="mx-1">→</span>
              <span className="font-semibold">Supporting kidney & heart disease</span>
            </div>
            
            {/* Actions row */}
            <div className="flex items-center gap-2 order-3 sm:order-3">
              <Link href="/about#charity" className="bg-white/20 hover:bg-white/30 px-3 py-0.5 rounded-full text-xs font-semibold transition whitespace-nowrap">
                Join Movement →
              </Link>
              <button 
                onClick={handleDismiss}
                className="text-white/60 hover:text-white transition text-xs"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
    </div>
  );
}
